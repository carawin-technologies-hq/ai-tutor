/// <reference lib="webworker" />
/**
 * Natural teacher voice: Piper TTS (ONNX Runtime Web) running on the student's device.
 * Runs in a worker so synthesis never stalls the 3D teacher's animation.
 * Each voice (~30–110 MB) is downloaded once and kept in the browser's private file storage (OPFS).
 * Speech is synthesised sentence by sentence, so the first words play quickly and each
 * sentence's audio length gives accurate timing for lip-sync and board writing.
 */
import { TtsSession } from "@mintplex-labs/piper-tts-web";

declare const self: DedicatedWorkerGlobalScope;

/** Must match the installed onnxruntime-web and the phonemizer the library was built against. */
const WASM_PATHS = {
  onnxWasm: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/",
  piperData: "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data",
  piperWasm: "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm",
};

export type WorkerIn =
  | { type: "init"; voiceId: string }
  | { type: "speak"; id: number; text: string; voiceId: string }
  | { type: "cancel" };

export type WorkerOut =
  | { type: "progress"; loaded: number; total: number; stage: "download" | "load" }
  | { type: "ready"; voiceId: string }
  | { type: "error"; message: string; id?: number }
  | { type: "chunk"; id: number; samples: Float32Array; sampleRate: number; words: { s: number; e: number; t0: number; t1: number }[]; isFinal: boolean }
  | { type: "done"; id: number };

const post = (m: WorkerOut, transfer: Transferable[] = []) => self.postMessage(m, transfer);

let session: TtsSession | null = null;
let sessionVoice = "";
let loading: Promise<TtsSession> | null = null;
let current = { id: 0, cancelled: false };

function ensureSession(voiceId: string): Promise<TtsSession> {
  if (session && sessionVoice === voiceId) return Promise.resolve(session);
  if (loading && sessionVoice === voiceId) return loading;
  sessionVoice = voiceId;
  // The library keeps one shared session; clear it so a different voice actually loads its own model.
  (TtsSession as unknown as { _instance: TtsSession | null })._instance = null;
  session = null;
  post({ type: "progress", loaded: 0, total: 1, stage: "load" });
  loading = TtsSession.create({
    voiceId,
    wasmPaths: WASM_PATHS,
    progress: (p) => {
      if (p.url.startsWith("tts://") || !p.url.endsWith(".onnx")) return;
      post({ type: "progress", loaded: p.loaded, total: p.total || p.loaded || 1, stage: "download" });
    },
  }).then((s) => {
    session = s; loading = null;
    post({ type: "ready", voiceId });
    return s;
  }, (e) => { loading = null; sessionVoice = ""; throw e; });
  return loading;
}

/** The library returns a 16-bit PCM WAV; turn it into float samples for Web Audio. */
async function wavToFloat(blob: Blob): Promise<{ samples: Float32Array; sampleRate: number }> {
  const buf = await blob.arrayBuffer();
  const view = new DataView(buf);
  const sampleRate = view.getUint32(24, true);
  // Find the "data" chunk (normally at byte 36).
  let off = 12;
  while (off + 8 <= buf.byteLength) {
    const id = String.fromCharCode(view.getUint8(off), view.getUint8(off + 1), view.getUint8(off + 2), view.getUint8(off + 3));
    const size = view.getUint32(off + 4, true);
    if (id === "data") { off += 8; break; }
    off += 8 + size;
  }
  const n = Math.floor((buf.byteLength - off) / 2);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) samples[i] = view.getInt16(off + i * 2, true) / 32768;
  return { samples, sampleRate };
}

/** Sentences with their positions in the full text. Very short ones are merged so speech flows naturally. */
function sentences(text: string): { s: number; e: number; text: string }[] {
  const out: { s: number; e: number; text: string }[] = [];
  for (const m of text.matchAll(/[^.!?;:]+[.!?;:]*\s*/g)) {
    const s = m.index ?? 0, e = s + m[0].length;
    const prev = out[out.length - 1];
    if (prev && prev.text.trim().length < 25) { prev.e = e; prev.text = text.slice(prev.s, e); }
    else out.push({ s, e, text: m[0] });
  }
  return out.filter((x) => /[\p{L}\p{N}]/u.test(x.text));
}

/** Spread a sentence's audio time over its words, weighted by length (Piper gives no word timing). */
function wordTimes(text: string, base: number, dur: number) {
  const words = [...text.matchAll(/\S+/g)].map((m) => ({ s: base + (m.index ?? 0), e: base + (m.index ?? 0) + m[0].length, w: m[0].replace(/[^\p{L}\p{N}]/gu, "").length + 1.2 }));
  const total = words.reduce((a, w) => a + w.w, 0) || 1;
  const lead = Math.min(0.12, dur * 0.04), span = Math.max(0.05, dur - lead - Math.min(0.2, dur * 0.06));
  let t = lead;
  return words.map((w) => { const d = (w.w / total) * span; const r = { s: w.s, e: w.e, t0: t, t1: t + d }; t += d; return r; });
}

async function speak(id: number, text: string, voiceId: string) {
  const me = (current = { id, cancelled: false });
  const tts = await ensureSession(voiceId);
  const parts = sentences(text);
  for (let i = 0; i < parts.length; i++) {
    if (me.cancelled) return;
    const p = parts[i];
    const wav = await tts.predict(p.text.trim());
    if (me.cancelled) return;
    const { samples, sampleRate } = await wavToFloat(wav);
    const dur = samples.length / sampleRate;
    const lead = p.text.length - p.text.trimStart().length;
    post({ type: "chunk", id, samples, sampleRate, words: wordTimes(p.text.trim(), p.s + lead, dur), isFinal: i === parts.length - 1 }, [samples.buffer]);
  }
  if (!me.cancelled) post({ type: "done", id });
}

self.onmessage = async (ev: MessageEvent<WorkerIn>) => {
  const m = ev.data;
  try {
    if (m.type === "init") await ensureSession(m.voiceId);
    else if (m.type === "speak") { current.cancelled = true; await speak(m.id, m.text, m.voiceId); }
    else if (m.type === "cancel") current.cancelled = true;
  } catch (e) {
    post({ type: "error", message: e instanceof Error ? e.message : String(e), id: m.type === "speak" ? m.id : undefined });
  }
};
