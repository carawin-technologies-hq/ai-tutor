"use client";
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Send, Mic, Square, RotateCcw, Plus, Trash2, Star, StarOff, Globe, X, Volume2, VolumeX, History, Repeat, Presentation, MessagesSquare, ChevronLeft, ChevronRight, Hand, AudioLines, Check, Download, Loader2 } from "lucide-react";
import { Button, Badge, Dropdown, MenuItem, Textarea, EmptyState, Modal } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { usePersisted } from "@/hooks/usePersisted";
import { cn, sleep, uid } from "@/lib/utils";
import { SEED_CONVERSATIONS, SUGGESTED, mockReply, type Block, type Conversation, type Msg } from "@/data/mock-conversations";
import { useTeacherVoice, getSpeechRecognition, type VoiceEngine } from "@/hooks/useTeacherVoice";
import { NATURAL_VOICES } from "./voiceConfig";
import type { AvatarMood } from "./TeacherAvatar3D";
import { UI_LANGUAGES } from "@/data/mock-curriculum";
import { RenderBlocks } from "./Blocks";
import Whiteboard, { type BoardMode } from "./Whiteboard";
import { speechPlan, blockSpeech, presenterLayout, type BoardPointer } from "./speech";

type VoiceState = "off" | "listening" | "thinking" | "speaking";


const TeacherAvatar3D = dynamic(() => import("./TeacherAvatar3D"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-5xl">🎓</div>,
});


function useIsWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const h = () => setWide(mq.matches); h();
    mq.addEventListener("change", h); return () => mq.removeEventListener("change", h);
  }, []);
  return wide;
}

function Waveform({ active, tone = "#FFC20E" }: { active: boolean; tone?: string }) {
  return (
    <div className="flex h-14 items-center justify-center gap-1" aria-hidden>
      {Array.from({ length: 21 }, (_, i) => (
        <span key={i} className={cn("w-1 origin-center rounded-full", active && "animate-wave")} style={{ height: 40, background: tone, animationDelay: `${(i % 7) * 0.11}s`, transform: active ? undefined : "scaleY(0.15)" }} />
      ))}
    </div>
  );
}

export default function TeacherChat() {
  const { profile, setProfile, toast } = useDemo();
  const [convs, setConvs, ready] = usePersisted<Conversation[]>("conversations", SEED_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [voice, setVoice] = useState<VoiceState>("off");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [histOpen, setHistOpen] = useState(false);
  const [autoSpeak, setAutoSpeak] = usePersisted<boolean>("teacher-auto-speak", true);
  const [heard, setHeard] = useState("");
  const [voiceEngine, setVoiceEngine] = usePersisted<VoiceEngine>("teacher-voice-engine-v2", "natural");
  const [voiceId, setVoiceId] = usePersisted<string>("teacher-piper-voice", NATURAL_VOICES[0].id);
  const tts = useTeacherVoice(profile.language, { engine: voiceEngine, voiceId });
  const recRef = useRef<any>(null);
  const isWide = useIsWide();
  const [boardOn, setBoardOn] = usePersisted<boolean>("teacher-board", true);
  const [boardSel, setBoardSel] = useState<string | null>(null);
  const [boardRun, setBoardRun] = useState<{ msgId: string; key: string; mode: "speech" | "timer" } | null>(null);
  const [focus, setFocus] = useState<{ msgId: string; idx: number } | null>(null);
  const boardPointer = useRef<BoardPointer>({ x: 0, y: 0, active: false });
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 800, h: 500 });
  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el); return () => ro.disconnect();
  }, [boardOn]);
  const endRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const active = convs.find((c) => c.id === activeId) ?? null;
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [active?.messages.length, thinking]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const patchConv = (id: string, fn: (c: Conversation) => Conversation) => setConvs((l) => l.map((c) => (c.id === id ? fn(c) : c)));

  const send = async (raw: string, fromVoice = false) => {
    const q = raw.trim(); if (!q || thinking) return;
    let id = activeId;
    const userMsg: Msg = { id: uid(), from: "me", text: q };
    if (!id) {
      id = uid(); const reply = mockReply(q);
      setConvs((l) => [{ id: id!, title: reply.title, subject: reply.subject, date: new Date().toISOString().slice(0, 10), messages: [userMsg] }, ...l]);
      setActiveId(id);
    } else patchConv(id, (c) => ({ ...c, messages: [...c.messages, userMsg] }));
    setText(""); setThinking(true);
    await sleep(fromVoice ? 700 : 1000);
    const followUp = /^(yes, please|quiz me|explain simpler)$/i.test(q);
    const reply = mockReply(followUp && active ? "" : q);
    const quick = !followUp ? null : /^yes/i.test(q) ? { blocks: [{ t: "p", text: "Great! Here's a quick recap: remember that the key idea is the same each time — keep it balanced and check your answer. Ask me anything else, or pick another suggested question." }] } : /^quiz/i.test(q) ? { blocks: [{ t: "p", text: "Quiz time! Q1: In a right-angled triangle with legs 6 cm and 8 cm, what is the hypotenuse? (Answer: 10 cm.) Type your answer and I'll check it — in this prototype I'll respond with a sample reply." }] } : /^explain/i.test(q) ? { blocks: [{ t: "p", text: "Sure — simpler version: break it into one small idea at a time, and use an everyday picture (a balance, a ball and a lamp) to see why it works." }] } : null;
    const aiMsg: Msg = { id: uid(), from: "ai", blocks: (quick?.blocks ?? reply.blocks) as any };
    patchConv(id, (c) => ({ ...c, messages: [...c.messages, aiMsg] }));
    setThinking(false);
    setBoardSel(null);
    if (fromVoice || autoSpeak) speak(aiMsg.id, aiMsg.blocks, fromVoice);
    else { setVoice("off"); setBoardRun({ msgId: aiMsg.id, key: uid(), mode: "timer" }); }
  };

  const speak = (msgId: string, blocks?: Block[], keepVoice = false) => {
    const b = blocks ?? active?.messages.find((x) => x.id === msgId)?.blocks;
    setSpeakingId(msgId); setVoice(keepVoice ? "speaking" : "off"); setFocus(null);
    setBoardRun({ msgId, key: uid(), mode: "speech" });
    tts.speak(speechPlan(b).text, () => { setSpeakingId(null); setVoice("off"); });
  };
  const stopSpeaking = () => { tts.stop(); setSpeakingId(null); setVoice("off"); setBoardRun(null); setFocus(null); toast("Stopped speaking", "info"); };
  const firstName = (profile.name || "").split(" ")[0] || "there";

  // ---- Whiteboard ----
  const aiMsgs = active?.messages.filter((m) => m.from === "ai") ?? [];
  const boardMsg = aiMsgs.find((m) => m.id === boardSel) ?? aiMsgs[aiMsgs.length - 1] ?? null;
  const boardIdx = boardMsg ? aiMsgs.indexOf(boardMsg) : -1;
  const boardQuestion = (() => {
    if (!active || !boardMsg) return undefined;
    const i = active.messages.indexOf(boardMsg);
    for (let j = i - 1; j >= 0; j--) if (active.messages[j].from === "me") return active.messages[j].text;
  })();
  const boardMode: BoardMode = boardRun && boardMsg && boardRun.msgId === boardMsg.id
    ? (boardRun.mode === "timer" ? "timer" : tts.speaking ? "speech" : "static")
    : "static";
  const replayOnBoard = () => {
    if (!boardMsg) return;
    if (autoSpeak) speak(boardMsg.id, boardMsg.blocks);
    else { tts.stop(); setBoardRun({ msgId: boardMsg.id, key: uid(), mode: "timer" }); }
  };
  const showOnBoard = (m: Msg) => { setBoardSel(m.id); setBoardOn(true); tts.stop(); setSpeakingId(null); setBoardRun(null); setFocus(null); };

  /** Student taps a part of the board: the teacher points at it and explains just that part again. */
  const explainBlock = (i: number) => {
    if (!boardMsg?.blocks?.[i]) return;
    tts.stop(); setBoardRun(null);
    setFocus({ msgId: boardMsg.id, idx: i }); setSpeakingId(boardMsg.id);
    const intro = ["Sure, let me explain this part again.", "Good question. Look here.", "Okay, let's go over this bit once more."][i % 3];
    tts.speak(intro + " " + blockSpeech(boardMsg.blocks[i]), () => { setFocus(null); setSpeakingId(null); });
  };

  /** Student raises a hand mid-lesson: she stops, turns to them and invites the question. */
  const raiseHand = () => {
    tts.stop(); setBoardRun(null); setFocus(null); setSpeakingId(null);
    const input = document.getElementById("teacher-input") as HTMLTextAreaElement | null;
    input?.focus();
    tts.speak(`Yes, ${firstName}? Go ahead, what's your question?`, () => {
      startVoice(true);
    });
  };

  const simulateVoice = () => {
    const q = "Why does the moon change its shape?";
    setHeard(q);
    const t1 = setTimeout(() => { setVoice("thinking"); send(q, true); }, 3000);
    timers.current.push(t1);
  };
  /** typeInstead: after "Raise hand", fall back to the text box rather than the sample question. */
  const startVoice = (typeInstead = false) => {
    tts.stop(); setHeard(""); setVoice("listening");
    const toInput = (msg: string) => {
      setVoice("off"); toast(msg, "info");
      (document.getElementById("teacher-input") as HTMLTextAreaElement | null)?.focus();
    };
    const rec = getSpeechRecognition();
    if (!rec) { if (typeInstead) toInput("Type your question below"); else simulateVoice(); return; }
    recRef.current = rec;
    rec.lang = profile.language === "Hindi" ? "hi-IN" : "en-IN";
    rec.interimResults = true; rec.maxAlternatives = 1;
    let finalText = "";
    rec.onresult = (e: any) => {
      const txt = Array.from(e.results as ArrayLike<any>).map((r: any) => r[0].transcript).join(" ");
      setHeard(txt);
      if (e.results[e.results.length - 1].isFinal) finalText = txt;
    };
    rec.onerror = (e: any) => {
      recRef.current = null;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        if (typeInstead) toInput("Microphone blocked — type your question below");
        else { toast("Microphone blocked — using sample question", "info"); simulateVoice(); }
      }
      else if (e.error !== "aborted") { toast("Didn't catch that — try again", "info"); setVoice("off"); }
    };
    rec.onend = () => {
      if (!recRef.current) return; recRef.current = null;
      if (finalText.trim()) { setVoice("thinking"); send(finalText, true); } else setVoice("off");
    };
    try { rec.start(); } catch { if (typeInstead) toInput("Type your question below"); else simulateVoice(); }
  };
  const cancelVoice = () => { timers.current.forEach(clearTimeout); const r = recRef.current; recRef.current = null; r?.abort?.(); setVoice("off"); };

  const mood: AvatarMood = voice === "listening" ? "listening" : thinking || voice === "thinking" ? "thinking" : tts.speaking ? "speaking" : "idle";
  const moodLabel = { idle: "Ready to help", listening: "Listening to you…", thinking: "Thinking…", speaking: "Explaining…" }[mood];
  const AvatarStage = (
    <div className="relative flex h-full flex-col items-center justify-center bg-gradient-to-b from-oxford-50 to-white dark:from-[#0F2142] dark:to-[#0D1930]">
      <TeacherAvatar3D mood={mood} signal={tts.signal} board={boardOn && !!boardMsg} className="h-full w-full" />
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-oxford shadow-card dark:bg-[#101E36] dark:text-white">
        <span className={cn("h-2 w-2 rounded-full", mood === "speaking" ? "bg-crimson animate-pulse" : mood === "listening" ? "bg-success animate-pulse" : mood === "thinking" ? "bg-sun animate-pulse" : "bg-oxford-400")} />
        Ms. Cara · {moodLabel}
        {tts.speaking && <button onClick={stopSpeaking} className="ml-1 rounded-full p-0.5 text-crimson hover:bg-crimson-50" aria-label="Stop speaking"><Square className="h-3.5 w-3.5" /></button>}
      </div>
      <button onClick={() => { if (autoSpeak) tts.stop(); setAutoSpeak(!autoSpeak); toast(autoSpeak ? "Voice replies off" : "Teacher will read replies aloud", "info"); }} className="absolute right-2 top-2 rounded-full bg-white/80 p-2 text-oxford shadow-card hover:bg-white dark:bg-[#101E36] dark:text-white" aria-label={autoSpeak ? "Turn off voice replies" : "Turn on voice replies"} title={autoSpeak ? "Voice replies on" : "Voice replies off"}>
        {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </div>
  );

  const clearConv = () => { if (!active) return; patchConv(active.id, (c) => ({ ...c, messages: [] })); toast("Conversation cleared", "info"); };
  const del = (id: string) => { setConvs((l) => l.filter((c) => c.id !== id)); if (activeId === id) setActiveId(null); };
  const toggleSave = (m: Msg) => { patchConv(active!.id, (c) => ({ ...c, messages: c.messages.map((x) => x.id === m.id ? { ...x, saved: !x.saved } : x) })); toast(m.saved ? "Removed from saved" : "Saved to Learning History", "info"); };

  /** Teaching layout: a large whiteboard on the left, the teacher standing beside it on the right (slightly in front of its edge). */
  const room = (() => {
    const W = stage.w, H = stage.h;
    const teacherH = H;
    const teacherW = presenterLayout(W, H).reserve;
    const boardL = W * 0.025, boardT = H * 0.06, boardH = H * 0.8;
    const boardW = Math.max(220, W - boardL - teacherW * 0.78 - W * 0.01);
    const overlap = Math.max(0, boardL + boardW - (W - teacherW * 0.92));
    return { teacherW, teacherH, boardL, boardT, boardW, boardH, reserve: overlap > 0 ? overlap + 8 : 0 };
  })();

  const HistoryPanel = (
    <div className="flex h-full flex-col">
      <div className="p-3"><Button className="w-full justify-center" onClick={() => { setActiveId(null); setHistOpen(false); }}><Plus className="h-4 w-4" />New conversation</Button></div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3 scroll-thin">
        {ready && convs.length === 0 && <p className="p-4 text-center text-sm text-slate-500">No conversations yet.</p>}
        {convs.map((c) => (
          <div key={c.id} className={cn("group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm", c.id === activeId ? "bg-oxford text-white" : "hover:bg-oxford-50")}>
            <button className="min-w-0 flex-1 text-left" onClick={() => { setActiveId(c.id); setHistOpen(false); }}><p className="truncate font-medium">{c.title}</p><p className={cn("text-xs", c.id === activeId ? "text-white/60" : "text-slate-500")}>{c.subject} · {c.date}</p></button>
            <button aria-label={`Delete ${c.title}`} onClick={() => del(c.id)} className="opacity-0 group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] sm:-m-6 lg:-m-8">
      <aside className="hidden w-72 shrink-0 border-r border-line bg-white lg:block dark:bg-[#0D1930] dark:border-[#1E3050]">{HistoryPanel}</aside>
      <AnimatePresence>{histOpen && (<div className="fixed inset-0 z-[70] lg:hidden"><div className="absolute inset-0 bg-oxford-900/50" onClick={() => setHistOpen(false)} /><motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="absolute left-0 top-0 h-full w-80 max-w-[88vw] bg-white"><button className="absolute right-2 top-2 p-2" onClick={() => setHistOpen(false)} aria-label="Close history"><X className="h-5 w-5" /></button><div className="pt-10 h-full">{HistoryPanel}</div></motion.div></div>)}</AnimatePresence>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-3 dark:bg-[#0D1930] dark:border-[#1E3050]">
          <button className="rounded-lg p-2 hover:bg-oxford-50 lg:hidden" onClick={() => setHistOpen(true)} aria-label="Conversation history"><History className="h-5 w-5" /></button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oxford text-xl">🎓</div>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold text-oxford dark:text-white">{active?.title ?? "Talk to My Teacher"}</p><p className="text-xs text-slate-500">Simulated teacher · {profile.board} Class {profile.classLevel}</p></div>
          <Dropdown trigger={<Button variant="outline" size="sm"><Globe className="h-4 w-4" /><span className="hidden sm:inline">{profile.language}</span></Button>}>
            {(close) => <div className="max-h-72 w-48 overflow-y-auto scroll-thin">{UI_LANGUAGES.map((l) => <MenuItem key={l} active={profile.language === l} onClick={() => { setProfile({ language: l }); close(); toast(l === "English" ? "Language: English" : `${l} selected — replies stay in English in this prototype`, "info"); }}>{l}</MenuItem>)}</div>}
          </Dropdown>
          <Dropdown trigger={<Button variant="outline" size="sm" title="Teacher's voice"><AudioLines className="h-4 w-4" /><span className="hidden 2xl:inline">Voice</span></Button>}>
            {(close) => {
              const busy = tts.natural.state === "downloading" || tts.natural.state === "loading";
              const pct = Math.round(tts.natural.progress * 100);
              return (
                <div className="w-80 p-1 text-sm">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Natural voice (Piper · runs on your device)</p>
                  {busy && (
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-2 text-oxford"><Loader2 className="h-4 w-4 animate-spin" />{tts.natural.state === "downloading" ? `Downloading voice… ${pct}%` : "Preparing voice…"}</div>
                      {tts.natural.state === "downloading" && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-oxford-50"><div className="h-full bg-crimson transition-all" style={{ width: `${pct}%` }} /></div>}
                    </div>
                  )}
                  {tts.natural.state === "error" && (
                    <div className="px-3 py-2 text-xs">
                      <p className="text-crimson">Couldn't start the natural voice: {tts.natural.message}</p>
                      <Button size="sm" variant="outline" className="mt-2 w-full justify-center" onClick={() => tts.enableNatural()}>Try again</Button>
                    </div>
                  )}
                  {!busy && tts.natural.state !== "error" && <p className="px-3 pb-1 text-xs text-slate-500">Pick a voice. Each one downloads once, then works offline. Best in Chrome or Edge.</p>}
                  {NATURAL_VOICES.map((v) => {
                    const selected = voiceEngine === "natural" && voiceId === v.id;
                    const loaded = tts.natural.state === "ready" && tts.natural.voiceId === v.id;
                    return (
                      <MenuItem key={v.id} active={selected} onClick={() => {
                        setVoiceEngine("natural"); setVoiceId(v.id); tts.enableNatural(v.id); close();
                        toast(loaded ? `Voice: ${v.label}` : `Getting ${v.label}'s voice ready…`, "info");
                      }}>
                        <span className="flex w-full items-center justify-between gap-2">
                          <span><b>{v.label}</b> <span className="text-xs text-slate-500">{v.note}</span></span>
                          {selected ? <Check className="h-4 w-4 shrink-0" /> : <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-slate-400"><Download className="h-3 w-3" />{v.mb} MB</span>}
                        </span>
                      </MenuItem>
                    );
                  })}
                  <div className="my-1 border-t border-line" />
                  <MenuItem active={voiceEngine === "browser"} onClick={() => { setVoiceEngine("browser"); close(); toast("Voice: browser built-in", "info"); }}>
                    <span className="flex w-full items-center justify-between gap-2"><span><b>Browser voice</b> <span className="text-xs text-slate-500">instant, more robotic</span></span>{voiceEngine === "browser" && <Check className="h-4 w-4" />}</span>
                  </MenuItem>
                </div>
              );
            }}
          </Dropdown>
          <Button variant={boardOn ? "primary" : "outline"} size="sm" onClick={() => setBoardOn(!boardOn)} aria-pressed={boardOn} title={boardOn ? "Switch to chat view" : "Switch to whiteboard view"}>
            {boardOn ? <MessagesSquare className="h-4 w-4" /> : <Presentation className="h-4 w-4" />}<span className="hidden 2xl:inline">{boardOn ? "Chat" : "Whiteboard"}</span>
          </Button>
          {active && <Button variant="outline" size="sm" onClick={clearConv}><RotateCcw className="h-4 w-4" /><span className="hidden 2xl:inline">Clear</span></Button>}
          <Button size="sm" variant="soft" onClick={() => setActiveId(null)}><Plus className="h-4 w-4" /><span className="hidden sm:inline">New</span></Button>
        </div>

        {!isWide && !boardOn && <div className="h-44 shrink-0 border-b border-line sm:h-52 dark:border-[#1E3050]">{AvatarStage}</div>}
        {boardOn ? (
          <div className="flex min-h-0 flex-1 flex-col bg-[#e8ecf2] dark:bg-[#0D1930]">
            <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden">
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 45% 35%, #ffffff 0%, #eef1f6 55%, #dde3eb 100%)" }} aria-hidden />
              {/* Whiteboard mounted on the wall */}
              <div className="absolute z-[2] drop-shadow-[0_10px_20px_rgba(20,35,60,.18)]" style={{ left: room.boardL, top: room.boardT, width: room.boardW, height: room.boardH }}>
              {boardMsg ? (
                <Whiteboard
                  key={boardMsg.id}
                  blocks={boardMsg.blocks ?? []}
                  question={boardQuestion}
                  subject={active?.subject}
                  mode={boardMode}
                  runKey={boardRun?.key ?? "static"}
                  signal={tts.signal}
                  onDone={() => setBoardRun(null)}
                  onFollow={send}
                  pointer={boardPointer}
                  focusIdx={focus && focus.msgId === boardMsg.id ? focus.idx : null}
                  onBlockClick={explainBlock}
                  reserveRight={room.reserve}
                  className="h-full"
                />
              ) : (
                <Whiteboard
                  key="welcome"
                  blocks={[
                    { t: "h", text: `Hi ${firstName}! What shall we learn today?` },
                    { t: "p", text: "Ask me anything. I'll explain it right here on the board, step by step." },
                  ]}
                  mode="static"
                  runKey="welcome"
                  signal={tts.signal}
                  reserveRight={room.reserve}
                  className="h-full"
                  footer={
                    <div className="mt-5 flex flex-wrap gap-2 font-sans">
                      {SUGGESTED.map((q) => <button key={q} onClick={() => send(q)} className="rounded-full border border-oxford-200 bg-white px-4 py-2 text-sm text-oxford shadow-sm hover:border-oxford hover:bg-oxford-50">{q}</button>)}
                    </div>
                  }
                />
              )}
              {thinking && (
                <div className="absolute inset-2 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-full bg-oxford px-4 py-2 text-sm text-white shadow-lift">
                    {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-sun" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    Ms. Cara is preparing the board…
                  </div>
                </div>
              )}
              </div>
              {/* The teacher, standing beside the board */}
              <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
                <TeacherAvatar3D mood={mood} signal={tts.signal} board pointer={boardPointer} framing="presenter" className="h-full w-full" />
              </div>
              <div className="absolute bottom-3 left-3 z-20 flex flex-col items-start gap-2">
                {(tts.speaking || boardMode === "timer") && (
                  <button onClick={raiseHand} className="flex items-center gap-1.5 rounded-full bg-sun px-3 py-1.5 text-xs font-semibold text-ink shadow-lift hover:bg-sun-600" title="Interrupt and ask a question">
                    <Hand className="h-4 w-4" />Raise hand
                  </button>
                )}
                <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-oxford shadow-card dark:bg-[#101E36] dark:text-white">
                  <span className={cn("h-2 w-2 rounded-full", mood === "speaking" ? "bg-crimson animate-pulse" : mood === "listening" ? "bg-success animate-pulse" : mood === "thinking" ? "bg-sun animate-pulse" : "bg-oxford-400")} />
                  Ms. Cara · {focus ? "Explaining that part…" : moodLabel}
                  {voiceEngine === "natural" && (tts.natural.state === "downloading" || tts.natural.state === "loading") && (
                    <span className="flex items-center gap-1 text-slate-500"><Loader2 className="h-3 w-3 animate-spin" />{tts.natural.state === "downloading" ? `voice ${Math.round(tts.natural.progress * 100)}%` : "voice…"}</span>
                  )}
                  <button onClick={() => { if (autoSpeak) tts.stop(); setAutoSpeak(!autoSpeak); toast(autoSpeak ? "Voice replies off" : "Teacher will read replies aloud", "info"); }} className="ml-1 rounded-full p-0.5 hover:bg-oxford-50" aria-label={autoSpeak ? "Turn off voice replies" : "Turn on voice replies"}>
                    {autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 bg-white/70 px-3 py-2 text-sm dark:bg-[#0D1930]">
              {boardMsg && <span className="hidden text-xs text-slate-600 md:inline dark:text-slate-300">Tip: tap any line on the board and she'll explain it again.</span>}
              {aiMsgs.length > 1 && (
                <div className="flex items-center gap-1 rounded-full bg-white/80 px-1 py-0.5 shadow-card dark:bg-[#101E36]">
                  <button className="rounded-full p-1.5 hover:bg-oxford-50 disabled:opacity-30" disabled={boardIdx <= 0} onClick={() => showOnBoard(aiMsgs[boardIdx - 1])} aria-label="Previous board"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="px-1 text-xs text-slate-600 dark:text-slate-300">Board {boardIdx + 1} of {aiMsgs.length}</span>
                  <button className="rounded-full p-1.5 hover:bg-oxford-50 disabled:opacity-30" disabled={boardIdx >= aiMsgs.length - 1} onClick={() => showOnBoard(aiMsgs[boardIdx + 1])} aria-label="Next board"><ChevronRight className="h-4 w-4" /></button>
                </div>
              )}
              {boardMsg && <Button size="sm" variant="outline" className="bg-white/80" onClick={replayOnBoard}><Repeat className="h-4 w-4" />Explain again</Button>}
              {(tts.speaking || boardMode === "timer") && <Button size="sm" variant="outline" className="bg-white/80 text-crimson" onClick={stopSpeaking}><Square className="h-4 w-4" />Stop</Button>}
            </div>
          </div>
        ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6 scroll-thin sm:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {(!active || active.messages.length === 0) && (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-oxford text-3xl">🎓</div>
                <h2 className="mt-4 font-display text-2xl text-oxford dark:text-white">What would you like to understand today?</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Ask in your own words. Type, or tap the microphone to try the simulated voice mode.</p>
                <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">{SUGGESTED.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-white px-4 py-2 text-sm text-oxford shadow-sm hover:border-oxford hover:bg-oxford-50">{s}</button>)}</div>
              </div>
            )}
            {active?.messages.map((m) => m.from === "me" ? (
              <div key={m.id} className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-oxford px-4 py-2.5 text-white">{m.text}</div></div>
            ) : (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-oxford text-lg text-white">🎓</div>
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl rounded-tl-sm border border-line bg-white p-4 shadow-card dark:bg-[#101E36] dark:border-[#1E3050]">
                    {speakingId === m.id && <div className="mb-2 flex items-center gap-2 text-xs font-medium text-crimson"><Volume2 className="h-4 w-4" />Speaking…<Waveform active tone="#DC143C" /></div>}
                    <RenderBlocks blocks={m.blocks!} onFollow={send} />
                  </div>
                  <div className="mt-1.5 flex gap-1 text-xs text-slate-500">
                    <button className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-oxford-50" onClick={() => speak(m.id, m.blocks)}><Repeat className="h-3.5 w-3.5" />Repeat answer</button>
                    {speakingId === m.id && <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-crimson hover:bg-crimson-50" onClick={stopSpeaking}><Square className="h-3.5 w-3.5" />Stop speaking</button>}
                    <button className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-oxford-50" onClick={() => showOnBoard(m)}><Presentation className="h-3.5 w-3.5" />Show on whiteboard</button>
                    <button className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-oxford-50" onClick={() => toggleSave(m)}>{m.saved ? <Star className="h-3.5 w-3.5 fill-sun text-sun" /> : <StarOff className="h-3.5 w-3.5" />}{m.saved ? "Saved" : "Save response"}</button>
                  </div>
                </div>
              </motion.div>
            ))}
            {thinking && <div className="flex gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-oxford text-lg text-white">🎓</div><div className="flex items-center gap-1 rounded-2xl border border-line bg-white px-4 py-3">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.15}s` }} />)}</div></div>}
            <div ref={endRef} />
          </div>
        </div>
        )}

        <div className="border-t border-line bg-white p-3 sm:px-8 dark:bg-[#0D1930] dark:border-[#1E3050]">
          {active && active.messages.length > 0 && <div className="mx-auto mb-2 flex max-w-3xl gap-2 overflow-x-auto scroll-thin">{SUGGESTED.slice(0, 3).map((s) => <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-slate-600 hover:bg-oxford-50">{s}</button>)}</div>}
          <form className="mx-auto flex max-w-3xl items-end gap-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <Textarea id="teacher-input" rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} placeholder="Ask your teacher anything…" aria-label="Message your teacher" className="max-h-32 min-h-[44px] flex-1 resize-none" />
            <Button type="button" variant="outline" size="icon" aria-label="Speak to your teacher" onClick={() => startVoice()}><Mic className="h-5 w-5 text-crimson" /></Button>
            <Button size="icon" aria-label="Send" disabled={!text.trim() || thinking}><Send className="h-5 w-5" /></Button>
          </form>
          <p className="mx-auto mt-1.5 max-w-3xl text-center text-[11px] text-slate-400">Prototype: replies are scripted samples. {voiceEngine === "natural" && tts.natural.state === "ready" ? `Voice: ${NATURAL_VOICES.find((v) => v.id === voiceId)?.label ?? "natural"} (Piper), running on your device.` : "Voice: browser built-in — pick a natural voice from the Voice menu."} Chrome/Edge recommended for the microphone.</p>
        </div>
      </section>

      {isWide && !boardOn && (
        <aside className="flex w-80 shrink-0 flex-col border-l border-line bg-white dark:bg-[#0D1930] dark:border-[#1E3050]">
          <div className="h-[380px] shrink-0">{AvatarStage}</div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm scroll-thin">
            <p className="font-semibold text-oxford dark:text-white">Your 3D teacher</p>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li className="flex gap-2"><Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />Reads every answer aloud — toggle with the speaker button.</li>
              <li className="flex gap-2"><Mic className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />Tap the mic and ask out loud.</li>
              <li className="flex gap-2"><Presentation className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />She writes and draws each answer on the whiteboard as she explains.</li>
              <li className="flex gap-2"><Repeat className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />Use “Explain again” to watch it once more.</li>
            </ul>
            {!tts.supported && <p className="rounded-xl bg-warn-50 p-3 text-xs text-warn-700">Your browser has no speech voice, so the teacher will only animate.</p>}
          </div>
        </aside>
      )}

      {/* Voice overlay */}
      <AnimatePresence>
        {(voice === "listening" || voice === "thinking") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-oxford-900/95 p-6 text-white" role="dialog" aria-label="Voice mode">
            <button className="absolute right-4 top-4 rounded-full p-2 hover:bg-white/10" onClick={cancelVoice} aria-label="Close voice mode"><X className="h-6 w-6" /></button>
            <Badge tone="yellow" className="mb-6">Voice mode</Badge>
            <div className="relative flex h-56 w-56 items-center justify-center">
              {voice === "listening" && <><span className="absolute h-40 w-40 animate-pulseRing rounded-full bg-crimson/40" /><span className="absolute h-40 w-40 animate-pulseRing rounded-full bg-crimson/30 [animation-delay:0.6s]" /></>}
              <div className="relative h-56 w-56 overflow-hidden rounded-full bg-gradient-to-b from-oxford-100 to-white"><TeacherAvatar3D mood={mood} signal={tts.signal} className="h-full w-full" /></div>
              <div className="absolute -bottom-2 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-crimson shadow-lift"><Mic className="h-6 w-6" /></div>
            </div>
            <p className="mt-8 font-display text-2xl">{voice === "listening" ? "Listening…" : "Thinking…"}</p>
            <Waveform active={voice === "listening"} />
            <p className="mt-2 max-w-sm text-center text-sm text-white/60">{heard ? `“${heard}”` : voice === "listening" ? "Ask your question out loud" : "Preparing your answer"}</p>
            <Button variant="outline" className="mt-8 border-white/30 bg-transparent text-white hover:bg-white/10" onClick={cancelVoice}><Square className="h-4 w-4" />Cancel</Button>
          </motion.div>
        )}
      </AnimatePresence>
      {voice === "speaking" && (
        <div className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full bg-oxford px-5 py-2.5 text-white shadow-lift"><Volume2 className="h-4 w-4 text-sun" />Teacher is speaking<Button size="sm" variant="yellow" onClick={stopSpeaking}><Square className="h-3.5 w-3.5" />Stop</Button></div>
      )}
    </div>
  );
}
