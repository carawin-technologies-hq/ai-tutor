"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkerIn, WorkerOut } from "@/features/learning/piper.worker";
import { NATURAL_VOICES, isVoiceDownloaded } from "@/features/learning/voiceConfig";

/**
 * Shared, mutable signal read every animation frame by the 3D avatar and the whiteboard.
 * Kept in a ref (not state) so lip-sync never triggers React re-renders.
 */
export interface VoiceSignal {
  speaking: boolean;
  /** 0..1 burst set on every spoken word boundary; the avatar decays it. */
  pulse: number;
  /** Text being spoken, and where speech was last known to be (for viseme lip-sync). */
  text: string;
  charIndex: number;
  /** performance.now() when charIndex was last synced. */
  syncAt: number;
  /** Estimated speaking speed in characters per second. */
  cps: number;
  /** Loudness of the audio being played, 0..1 (1 when unknown). Closes the mouth in pauses. */
  level: number;
  /** True while real audio (natural voice) is playing, so lips can follow the actual sound. */
  audio: boolean;
}

export type VoiceEngine = "browser" | "natural";
export interface NaturalStatus {
  state: "off" | "downloading" | "loading" | "ready" | "error";
  /** 0..1 download progress */
  progress: number;
  message?: string;
  /** Piper voice that is loaded (when ready) */
  voiceId?: string;
}

const LANG_CODES: Record<string, string> = {
  English: "en-IN", Hindi: "hi-IN", Bengali: "bn-IN", Tamil: "ta-IN", Telugu: "te-IN",
  Marathi: "mr-IN", Gujarati: "gu-IN", Kannada: "kn-IN", Malayalam: "ml-IN", Punjabi: "pa-IN", Urdu: "ur-IN",
};

/** Prefer the browser's neural "Natural"/"Online" voices (Edge) or Google's network voices (Chrome). */
function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.split("-")[0];
  const good = (v: SpeechSynthesisVoice) => /natural|online|neural|google/i.test(v.name);
  const fem = (v: SpeechSynthesisVoice) => /female|woman|heera|swara|neerja|aria|jenny|sonia|libby|ava|emma/i.test(v.name);
  return (
    voices.find((v) => v.lang === lang && good(v) && fem(v)) ??
    voices.find((v) => v.lang === lang && good(v)) ??
    voices.find((v) => v.lang.startsWith(base + "-") && good(v)) ??
    voices.find((v) => v.lang === lang && fem(v)) ??
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(base + "-")) ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

// ---------- Natural voice: one worker + audio graph for the whole app session ----------
type Listener = (m: WorkerOut) => void;
let worker: Worker | null = null;
const listeners = new Set<Listener>();
let lastStatus: NaturalStatus = { state: "off", progress: 0 };
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let levelPeak = 0.1;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("../features/learning/piper.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<WorkerOut>) => listeners.forEach((l) => l(e.data));
    worker.onerror = (e) => listeners.forEach((l) => l({ type: "error", message: e.message || "Voice worker failed to start" }));
  }
  return worker;
}
const send = (m: WorkerIn) => getWorker().postMessage(m);

function getAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0;
    analyser.connect(audioCtx.destination);
  }
  return { ctx: audioCtx, analyser: analyser! };
}

export function useTeacherVoice(language = "English", opts: { engine?: VoiceEngine; voiceId?: string } = {}) {
  const engine = opts.engine ?? "browser";
  const voiceId = opts.voiceId ?? NATURAL_VOICES[0].id;
  const signal = useRef<VoiceSignal>({ speaking: false, pulse: 0, text: "", charIndex: 0, syncAt: 0, cps: 14, level: 1, audio: false });
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [natural, setNatural] = useState<NaturalStatus>(lastStatus);
  const [downloaded, setDownloaded] = useState(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout>>();
  const onDoneRef = useRef<(() => void) | undefined>();

  // Natural-voice playback state for the current utterance.
  const play = useRef<{
    id: number; nextStart: number; sources: AudioBufferSourceNode[];
    words: { s: number; e: number; t0: number; t1: number }[]; done: boolean; endAt: number; lastWord: number;
  } | null>(null);
  const uttId = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(ok);
    if (!ok) return;
    window.speechSynthesis.getVoices();
    const h = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", h);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", h);
      window.speechSynthesis.cancel();
    };
  }, []);

  const finish = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    cancelAnimationFrame(raf.current);
    signal.current.speaking = false;
    signal.current.pulse = 0;
    signal.current.level = 1;
    signal.current.audio = false;
    setSpeaking(false);
    const cb = onDoneRef.current; onDoneRef.current = undefined; cb?.();
  }, []);

  const stopNatural = useCallback(() => {
    const p = play.current; play.current = null;
    p?.sources.forEach((s) => { try { s.stop(); } catch {} });
    if (worker) send({ type: "cancel" });
  }, []);

  const stop = useCallback(() => {
    pending.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    stopNatural();
    finish();
  }, [finish, stopNatural]);

  // ---- Natural voice: worker messages ----
  const setStatus = (s: NaturalStatus) => { lastStatus = s; setNatural(s); };
  const browserSpeakRef = useRef<(text: string) => void>(() => {});
  const naturalSpeakRef = useRef<(text: string) => void>(() => {});
  /** Text waiting for the natural voice to finish loading (so we never fall back to the robotic voice just because it's still loading). */
  const pending = useRef<string | null>(null);

  useEffect(() => {
    const onMsg: Listener = (m) => {
      if (m.type === "progress") {
        setStatus(m.stage === "download"
          ? { state: "downloading", progress: m.total ? m.loaded / m.total : 0 }
          : { state: "loading", progress: 1 });
      } else if (m.type === "ready") {
        setStatus({ state: "ready", progress: 1, voiceId: m.voiceId }); setDownloaded(true);
        const waiting = pending.current; pending.current = null;
        if (waiting) naturalSpeakRef.current(waiting);
      } else if (m.type === "error") {
        const p = play.current;
        if (m.id !== undefined && p && p.id === m.id && p.sources.length === 0) {
          // Synthesis failed before any audio: say it with the browser voice instead.
          play.current = null; browserSpeakRef.current(signal.current.text);
        }
        if (m.id === undefined || lastStatus.state !== "ready") setStatus({ state: "error", progress: 0, message: m.message });
        // The natural voice couldn't load: say what was waiting with the browser voice.
        const waiting = pending.current; pending.current = null;
        if (waiting) browserSpeakRef.current(waiting);
      } else if (m.type === "chunk") {
        const p = play.current; if (!p || p.id !== m.id) return;
        const { ctx, analyser } = getAudio();
        const buf = ctx.createBuffer(1, m.samples.length, m.sampleRate);
        buf.copyToChannel(new Float32Array(m.samples), 0);
        const src = ctx.createBufferSource(); src.buffer = buf; src.connect(analyser);
        const start = Math.max(p.nextStart, ctx.currentTime + 0.04);
        src.start(start);
        p.sources.push(src);
        for (const w of m.words) p.words.push({ s: w.s, e: w.e, t0: start + w.t0, t1: start + w.t1 });
        p.nextStart = start + buf.duration;
        p.endAt = p.nextStart;
      } else if (m.type === "done") {
        const p = play.current; if (!p || p.id !== m.id) return;
        p.done = true;
      }
    };
    listeners.add(onMsg);
    return () => { listeners.delete(onMsg); };
  }, []);

  /** Download (first time) and load a Piper voice. Defaults to the currently selected voice. */
  const enableNatural = useCallback((id?: string) => {
    const want = id ?? voiceId;
    const busy = lastStatus.state === "downloading" || lastStatus.state === "loading";
    if ((lastStatus.state === "ready" || busy) && lastStatus.voiceId === want) return;
    setStatus({ state: "loading", progress: 0, voiceId: want });
    send({ type: "init", voiceId: want });
  }, [voiceId]);

  // Is the selected voice already saved in this browser?
  useEffect(() => { setDownloaded(false); isVoiceDownloaded(voiceId).then(setDownloaded); }, [voiceId]);
  // The natural voice is the default: start loading it as soon as the page opens (first visit downloads it once).
  useEffect(() => { if (engine === "natural") enableNatural(); }, [engine, enableNatural]);

  // ---- Browser speech engine ----
  const speakBrowser = useCallback((clean: string) => {
    if (!supported) {
      fallbackTimer.current = setTimeout(finish, Math.min(15000, 600 + clean.split(" ").length * 320));
      return;
    }
    const lang = LANG_CODES[language] ?? "en-IN";
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = lang;
    const v = pickVoice(lang); if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 0.98; u.pitch = 1.03;
    u.onstart = () => { signal.current.syncAt = performance.now(); signal.current.charIndex = 0; };
    u.onboundary = (e) => {
      const sg = signal.current, now = performance.now();
      if (e.charIndex > sg.charIndex && now > sg.syncAt) {
        const rate = (e.charIndex - sg.charIndex) / ((now - sg.syncAt) / 1000);
        if (rate > 4 && rate < 40) sg.cps = sg.cps * 0.6 + rate * 0.4;
      }
      sg.charIndex = e.charIndex; sg.syncAt = now; sg.pulse = 1;
    };
    u.onend = finish;
    u.onerror = finish;
    window.speechSynthesis.speak(u);
    fallbackTimer.current = setTimeout(finish, 2000 + clean.length * 90);
  }, [finish, language, supported]);
  browserSpeakRef.current = speakBrowser;

  // ---- Natural engine: drive the shared signal from the real audio clock and word timings ----
  const tick = useCallback(() => {
    raf.current = requestAnimationFrame(tick);
    const p = play.current; if (!p || !audioCtx || !analyser) return;
    const t = audioCtx.currentTime, sg = signal.current, now = performance.now();
    let wi = -1;
    for (let i = p.words.length - 1; i >= 0; i--) if (p.words[i].t0 <= t) { wi = i; break; }
    if (wi >= 0) {
      const w = p.words[wi];
      if (wi !== p.lastWord) { p.lastWord = wi; sg.pulse = 1; }
      if (t <= w.t1) {
        const span = Math.max(0.01, w.t1 - w.t0);
        sg.charIndex = w.s + ((t - w.t0) / span) * (w.e - w.s);
        sg.cps = (w.e - w.s) / span;
      } else { sg.charIndex = w.e; sg.cps = 0; }
      sg.syncAt = now;
    } else { sg.charIndex = 0; sg.cps = 0; sg.syncAt = now; }
    // Loudness of what is actually coming out of the speakers right now (normalised to the voice's recent peak).
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    let sum = 0; for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    levelPeak = Math.max(rms, levelPeak * 0.997, 0.04);
    const lvl = Math.min(1, rms / (levelPeak * 0.8));
    sg.level += (lvl - sg.level) * (lvl > sg.level ? 0.7 : 0.35);
    if (p.done && p.sources.length > 0 && t >= p.endAt + 0.05) { play.current = null; finish(); }
  }, [finish]);

  const speakNatural = useCallback((clean: string) => {
    clearTimeout(fallbackTimer.current);
    const { ctx } = getAudio();
    ctx.resume().catch(() => {});
    const id = ++uttId.current;
    Object.assign(signal.current, { speaking: true, text: clean, charIndex: 0, cps: 0, level: 0, audio: true, syncAt: performance.now() });
    play.current = { id, nextStart: 0, sources: [], words: [], done: false, endAt: 0, lastWord: -1 };
    const v = NATURAL_VOICES.find((x) => x.id === voiceId) ?? NATURAL_VOICES[0];
    send({ type: "speak", id, text: clean, voiceId: v.id });
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    // Safety net in case the worker stalls.
    fallbackTimer.current = setTimeout(() => { stopNatural(); finish(); }, 20000 + clean.length * 150);
  }, [voiceId, tick, stopNatural, finish]);
  naturalSpeakRef.current = speakNatural;

  const speak = useCallback((text: string, onDone?: () => void) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) { onDone?.(); return; }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    stopNatural();
    clearTimeout(fallbackTimer.current);
    cancelAnimationFrame(raf.current);
    onDoneRef.current = onDone;
    Object.assign(signal.current, { speaking: true, pulse: 1, text: clean, charIndex: 0, syncAt: performance.now(), cps: 14, level: 1, audio: false });
    setSpeaking(true);

    pending.current = null;
    if (engine === "natural") {
      // Unlock audio now, while we're still inside the student's click.
      getAudio().ctx.resume().catch(() => {});
      if (lastStatus.state === "ready" && lastStatus.voiceId === voiceId) { speakNatural(clean); return; }
      if (lastStatus.state !== "error") {
        // Voice still downloading/loading: wait for it (mouth closed, board paused) rather than use the robotic voice.
        Object.assign(signal.current, { cps: 0, level: 0 });
        pending.current = clean;
        enableNatural();
        fallbackTimer.current = setTimeout(() => {
          if (pending.current === clean) { pending.current = null; speakBrowser(clean); }
        }, 120000);
        return;
      }
    }
    speakBrowser(clean);
  }, [engine, voiceId, speakBrowser, speakNatural, stopNatural, enableNatural]);

  useEffect(() => () => { clearTimeout(fallbackTimer.current); cancelAnimationFrame(raf.current); }, []);

  return { speak, stop, speaking, supported, signal, natural, naturalDownloaded: downloaded, enableNatural };
}

/** Browser speech-to-text (Chrome / Edge). Returns null when unavailable. */
export function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  return SR ? new SR() : null;
}
