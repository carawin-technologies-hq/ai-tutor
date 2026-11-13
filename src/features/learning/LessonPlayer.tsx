"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, Circle, Globe, Lightbulb, Maximize2, Minimize2, NotebookPen, PanelLeft, PanelRight,
  RotateCcw, Send, Sparkles, Palette, Volume2, XCircle, PartyPopper, Repeat, ArrowLeft, HelpCircle, X,
} from "lucide-react";
import { Button, Badge, Dropdown, MenuItem, Progress, Textarea, Input } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { usePersisted } from "@/hooks/usePersisted";
import { cn, sleep } from "@/lib/utils";
import { LESSONS, LESSON_ORDER, FOLLOWUP_RESPONSES, type Beat, type QuestionBeat, type TeachBeat } from "@/data/mock-lessons";
import { COURSE_OUTLINE, TEACHING_STYLES, UI_LANGUAGES } from "@/data/mock-curriculum";
import { BalanceVisual, Equation, RichText } from "./Visuals";

type Result = { attempts: number; status: "idle" | "correct" | "wrong" | "partial" | "revealed"; selected?: string; msg?: string };
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "").replace(/^x=/, "");

function TeacherAvatar({ typing }: { typing?: boolean }) {
  return <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-oxford text-lg text-white", typing && "ring-4 ring-sun/40")}>🎓</div>;
}

export default function LessonPlayer({ lessonId }: { lessonId: string }) {
  const lesson = LESSONS[lessonId];
  const router = useRouter();
  const { profile, toast } = useDemo();
  const [style, setStyle] = useState(profile.teachingStyle);
  const [lang, setLang] = useState(profile.language === "Hindi" ? "Hindi" : "English");
  const [full, setFull] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false); // mobile drawer
  const [rightOpen, setRightOpen] = useState(true);
  const [revealed, setRevealed] = useState(1);
  const [typing, setTyping] = useState(false);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const [simple, setSimple] = useState<Record<string, boolean>>({});
  const [input, setInput] = useState<Record<string, string>>({});
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [completed, setCompleted] = usePersisted<string[]>("completed-lessons", ["le-1"]);
  const [bookmarks, setBookmarks] = usePersisted<{ lessonId: string; beatId: string; title: string }[]>("bookmarks", []);
  const [notes, setNotes] = usePersisted<Record<string, string>>("lesson-notes", {});
  const [panel, setPanel] = useState<"progress" | "ask" | "notes" | "bookmarks">("ask");
  const [chat, setChat] = useState<{ from: "me" | "ai"; text: string }[]>([{ from: "ai", text: "Ask me anything about this lesson — for example, “why do we do it on both sides?”" }]);
  const [q, setQ] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // reset when lesson changes
  useEffect(() => { setRevealed(1); setResults({}); setHints({}); setSimple({}); setInput({}); }, [lessonId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [revealed, results, typing]);
  useEffect(() => { document.body.style.overflow = full ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [full]);

  const beats = lesson.beats;
  const current = beats[revealed - 1];
  const isQ = current?.kind === "question";
  const qStatus = isQ ? results[current.id]?.status : undefined;
  const canContinue = current && (!isQ || qStatus === "correct" || qStatus === "revealed");
  const done = revealed === beats.length && canContinue;
  const answeredCount = beats.slice(0, revealed).filter((b) => b.kind === "teach" || results[b.id]?.status === "correct" || results[b.id]?.status === "revealed").length;
  const pct = Math.round((answeredCount / beats.length) * 100);
  const isCompleted = completed.includes(lessonId);
  const idx = LESSON_ORDER.indexOf(lessonId);

  const next = useCallback(async () => {
    setTyping(true); await sleep(650); setTyping(false); setRevealed((r) => Math.min(r + 1, beats.length));
  }, [beats.length]);

  const submit = (b: QuestionBeat, value: string) => {
    const prev = results[b.id] ?? { attempts: 0, status: "idle" as const };
    const attempts = prev.attempts + 1;
    const v = norm(value);
    let status: Result["status"]; let msg: string;
    if (v === norm(b.answer)) { status = "correct"; msg = b.correct; }
    else if (b.partial?.some((p) => norm(p) === v)) { status = "partial"; msg = b.partialMsg ?? "You're on the right track — finish the last step."; }
    else if (attempts >= 2) { status = "revealed"; msg = `Let's look at it together. ${b.explain}`; }
    else { status = "wrong"; msg = b.wrong; }
    setResults((r) => ({ ...r, [b.id]: { attempts, status, selected: value, msg } }));
  };

  const toggleBookmark = (beatId: string, title: string) => {
    const has = bookmarks.some((b) => b.lessonId === lessonId && b.beatId === beatId);
    setBookmarks((l) => has ? l.filter((b) => !(b.lessonId === lessonId && b.beatId === beatId)) : [...l, { lessonId, beatId, title: `${lesson.title} — ${title}` }]);
    toast(has ? "Bookmark removed" : "Bookmarked", "info");
  };
  const lessonBookmarked = bookmarks.some((b) => b.lessonId === lessonId && b.beatId === "lesson");

  const ask = async () => {
    const text = q.trim(); if (!text) return;
    setChat((c) => [...c, { from: "me", text }]); setQ("");
    await sleep(700);
    const hit = FOLLOWUP_RESPONSES.find((r) => r.match.test(text));
    setChat((c) => [...c, { from: "ai", text: hit?.answer ?? "Good thinking. In this lesson the key idea is to keep the equation balanced by doing the same thing to both sides. Could you tell me which step feels unclear? (Simulated response — no real AI is connected.)" }]);
  };

  const speak = (id: string) => { setSpeaking(id); toast("Voice playback is simulated in this prototype", "info"); setTimeout(() => setSpeaking(null), 2200); };

  const textFor = (b: TeachBeat) => {
    if (simple[b.id] && b.simpler) return b.simpler;
    if (lang === "Hindi" && b.hi) return b.hi;
    return b.styleText?.[style] ?? b.text;
  };

  /* ---------- Left outline ---------- */
  const Outline = (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Course outline</p><p className="mt-1 font-semibold text-oxford dark:text-white">Class {profile.classLevel} · Mathematics</p><p className="text-xs text-slate-500">{profile.board}</p></div>
      <div className="flex-1 space-y-4 overflow-y-auto p-3 scroll-thin">
        {COURSE_OUTLINE.map((ch) => (
          <div key={ch.chapter}>
            <p className="px-2 pb-1 text-sm font-semibold text-oxford dark:text-white">{ch.chapter}</p>
            <ul>
              {ch.topics.map((t) => {
                const playable = !!LESSONS[t.id]; const isCur = t.id === lessonId; const isDone = completed.includes(t.id) || (t.done && !playable);
                return (
                  <li key={t.id}>
                    <button onClick={() => { if (playable) { router.push(`/student/learn/lesson/${t.id}`); setLeftOpen(false); } else toast("This topic's lesson isn't included in the prototype", "warn"); }}
                      className={cn("flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm", isCur ? "bg-oxford text-white" : "hover:bg-oxford-50 text-slate-700 dark:text-slate-300")}>
                      {isDone ? <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", isCur ? "text-sun" : "text-success")} /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 opacity-40" />}
                      <span>{t.title}{!playable && <span className="ml-1 text-[10px] opacity-60">· preview</span>}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn(full ? "fixed inset-0 z-[60] bg-mist dark:bg-[#0A1424]" : "-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-4rem)]", "flex flex-col")}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-white px-3 py-2.5 sm:px-5 dark:bg-[#0D1930] dark:border-[#1E3050]">
        <button className="rounded-lg p-2 hover:bg-oxford-50 lg:hidden" onClick={() => setLeftOpen(true)} aria-label="Open outline"><PanelLeft className="h-5 w-5" /></button>
        <Link href="/student/learn" className="rounded-lg p-2 hover:bg-oxford-50" aria-label="Back to chapters"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-slate-500">{lesson.chapter}</p>
          <h1 className="truncate font-semibold text-oxford dark:text-white">{lesson.title}</h1>
        </div>
        <div className="hidden w-40 items-center gap-2 sm:flex"><Progress value={pct} tone="blue" /><span className="text-xs font-medium">{pct}%</span></div>
        <Dropdown trigger={<Button variant="outline" size="sm"><Palette className="h-4 w-4" /><span className="hidden md:inline max-w-[140px] truncate">{style}</span></Button>}>
          {(close) => (<div className="w-72">{TEACHING_STYLES.map((s) => (<MenuItem key={s.id} active={style === s.id} onClick={() => { setStyle(s.id); close(); toast(`Teaching style: ${s.id}`, "info"); }}><span><span className="block">{s.id}</span><span className="block text-[11px] text-slate-500">{s.desc}</span></span></MenuItem>))}</div>)}
        </Dropdown>
        <Dropdown trigger={<Button variant="outline" size="sm"><Globe className="h-4 w-4" /><span className="hidden md:inline">{lang}</span></Button>}>
          {(close) => (<div className="max-h-72 w-52 overflow-y-auto scroll-thin">{UI_LANGUAGES.map((l) => (<MenuItem key={l} active={lang === l} onClick={() => { close(); if (l === "English" || l === "Hindi") { setLang(l); toast(`Teaching language: ${l}`, "info"); } else toast(`${l} is planned — not available in this prototype`, "warn"); }}>{l}{l !== "English" && l !== "Hindi" && <span className="text-[10px] text-slate-400">Soon</span>}</MenuItem>))}</div>)}
        </Dropdown>
        <Button variant="ghost" size="icon" aria-label={lessonBookmarked ? "Remove lesson bookmark" : "Bookmark lesson"} onClick={() => toggleBookmark("lesson", "Lesson")}>{lessonBookmarked ? <BookmarkCheck className="h-5 w-5 text-crimson" /> : <Bookmark className="h-5 w-5" />}</Button>
        <Button variant="ghost" size="icon" aria-label="Toggle right panel" className="hidden lg:inline-flex" onClick={() => setRightOpen((o) => !o)}><PanelRight className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" aria-label={full ? "Exit full screen" : "Full-screen learning mode"} onClick={() => setFull((f) => !f)}>{full ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}</Button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left */}
        <aside className="hidden w-72 shrink-0 border-r border-line bg-white lg:block dark:bg-[#0D1930] dark:border-[#1E3050]">{Outline}</aside>
        <AnimatePresence>{leftOpen && (<div className="fixed inset-0 z-[70] lg:hidden"><div className="absolute inset-0 bg-oxford-900/50" onClick={() => setLeftOpen(false)} /><motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="absolute left-0 top-0 h-full w-80 max-w-[88vw] bg-white"><button className="absolute right-2 top-2 rounded-lg p-2" onClick={() => setLeftOpen(false)} aria-label="Close outline"><X className="h-5 w-5" /></button>{Outline}</motion.div></div>)}</AnimatePresence>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6 scroll-thin sm:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 rounded-xl2 border border-sun/50 bg-sun-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-warn-700">Learning objective</p>
                <p className="mt-1 text-sm text-ink">{lesson.objective}</p>
              </div>

              <div className="space-y-5">
                {beats.slice(0, revealed).map((b) => (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex gap-3">
                    <TeacherAvatar />
                    <div className="min-w-0 flex-1">
                      {b.kind === "teach" ? (
                        <div className="rounded-2xl rounded-tl-sm border border-line bg-white p-4 shadow-card dark:bg-[#101E36] dark:border-[#1E3050]">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2"><Badge tone="blue">{b.stage}</Badge><span className="text-sm font-semibold text-oxford dark:text-white">{b.title}</span></div>
                            <div className="flex items-center gap-0.5">
                              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-oxford-50 hover:text-oxford" aria-label="Listen (simulated)" onClick={() => speak(b.id)}><Volume2 className={cn("h-4 w-4", speaking === b.id && "text-crimson")} /></button>
                              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-oxford-50 hover:text-oxford" aria-label="Bookmark this explanation" onClick={() => toggleBookmark(b.id, b.title)}>{bookmarks.some((x) => x.lessonId === lessonId && x.beatId === b.id) ? <BookmarkCheck className="h-4 w-4 text-crimson" /> : <Bookmark className="h-4 w-4" />}</button>
                            </div>
                          </div>
                          <RichText text={textFor(b)} className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200" />
                          {lang === "Hindi" && !b.hi && <p className="mt-2 text-xs text-slate-400">Hindi sample is available only for selected explanations in this prototype.</p>}
                          {b.equation && <Equation big>{b.equation}</Equation>}
                          {b.visual && <BalanceVisual {...b.visual} />}
                          {b.steps && (
                            <ol className="mt-3 space-y-2">
                              {b.steps.map((s, i) => (
                                <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.25 }} className="flex gap-3 rounded-xl bg-mist p-3 dark:bg-[#0F1C33]">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-crimson text-xs font-bold text-white">{i + 1}</span>
                                  <div><p className="text-sm text-slate-600 dark:text-slate-300">{s.text}</p><p className="font-display text-lg text-oxford dark:text-white">{s.eq}</p></div>
                                </motion.li>
                              ))}
                            </ol>
                          )}
                          {(b.simpler || b.stage === "Concept" || b.stage === "Real-world example") && b.id === current?.id && (
                            <button onClick={() => { setSimple((s) => ({ ...s, [b.id]: !s[b.id] })); toast(simple[b.id] ? "Showing the original explanation" : "Here's a simpler way to see it", "info"); }} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-crimson hover:underline"><Repeat className="h-3.5 w-3.5" />{simple[b.id] ? "Show original explanation" : "Explain this again, more simply"}</button>
                          )}
                        </div>
                      ) : (
                        <QuestionCard b={b} res={results[b.id]} hint={!!hints[b.id]} value={input[b.id] ?? ""} setValue={(v) => setInput((i) => ({ ...i, [b.id]: v }))}
                          onHint={() => { setHints((h) => ({ ...h, [b.id]: true })); }} onSubmit={(v) => submit(b, v)} locked={b.id !== current?.id || results[b.id]?.status === "correct" || results[b.id]?.status === "revealed"} />
                      )}
                    </div>
                  </motion.div>
                ))}
                {typing && (<div className="flex gap-3"><TeacherAvatar typing /><div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-line bg-white px-4 py-3">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.15}s` }} />)}</div></div>)}
                {done && (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl2 border border-success/30 bg-success-50 p-6 text-center">
                    <PartyPopper className="mx-auto h-8 w-8 text-success-700" />
                    <p className="mt-2 font-display text-xl text-success-700">Lesson complete</p>
                    <p className="mt-1 text-sm text-slate-600">You answered {beats.filter((b) => b.kind === "question").length} questions. Ready to confirm and move on?</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <Button variant={isCompleted ? "outline" : "accent"} onClick={() => { if (!isCompleted) { setCompleted((c) => [...c, lessonId]); toast("Lesson marked as completed 🎉"); } }}>{isCompleted ? <><CheckCircle2 className="h-4 w-4" />Completed</> : "Mark as completed"}</Button>
                      {idx < LESSON_ORDER.length - 1 && <Button onClick={() => router.push(`/student/learn/lesson/${LESSON_ORDER[idx + 1]}`)}>Next lesson<ChevronRight className="h-4 w-4" /></Button>}
                      <Link href="/student/practice"><Button variant="outline">Practise this topic</Button></Link>
                    </div>
                  </motion.div>
                )}
                <div ref={endRef} />
              </div>
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between gap-2 border-t border-line bg-white px-3 py-3 sm:px-8 dark:bg-[#0D1930] dark:border-[#1E3050]">
            <Button variant="ghost" size="sm" disabled={idx <= 0} onClick={() => router.push(`/student/learn/lesson/${LESSON_ORDER[idx - 1]}`)}><ChevronLeft className="h-4 w-4" /><span className="hidden xl:inline">Previous lesson</span></Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setRevealed(1); setResults({}); setHints({}); setSimple({}); toast("Lesson restarted", "info"); }}><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Restart</span></Button>
              <Button disabled={!canContinue || typing || revealed >= beats.length} onClick={next}>{isQ && !canContinue ? "Answer to continue" : "Continue"}<ChevronRight className="h-4 w-4" /></Button>
            </div>
            <Button variant="ghost" size="sm" disabled={idx >= LESSON_ORDER.length - 1} onClick={() => router.push(`/student/learn/lesson/${LESSON_ORDER[idx + 1]}`)}><span className="hidden xl:inline">Next lesson</span><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </main>

        {/* Right panel */}
        {rightOpen && (
          <aside className="hidden w-80 shrink-0 flex-col border-l border-line bg-white lg:flex dark:bg-[#0D1930] dark:border-[#1E3050]">
            <div className="border-b border-line p-4">
              <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-oxford text-2xl">🎓</div>
                <div><p className="font-semibold text-oxford dark:text-white">Your AI teacher</p><p className="text-xs text-slate-500">{style}</p><p className="text-[10px] uppercase tracking-wider text-slate-400">Simulated · no real AI</p></div></div>
            </div>
            <div className="flex border-b border-line text-xs font-medium">
              {([["ask", "Ask", HelpCircle], ["progress", "Progress", Sparkles], ["notes", "Notes", NotebookPen], ["bookmarks", "Saved", Bookmark]] as const).map(([id, l, I]) => (
                <button key={id} onClick={() => setPanel(id)} className={cn("flex flex-1 flex-col items-center gap-1 py-2.5", panel === id ? "border-b-2 border-crimson text-oxford" : "text-slate-500")}><I className="h-4 w-4" />{l}</button>))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 scroll-thin">
              {panel === "ask" && (
                <div className="flex h-full flex-col">
                  <div className="flex-1 space-y-3">{chat.map((m, i) => (<div key={i} className={cn("max-w-[92%] rounded-2xl px-3 py-2 text-sm", m.from === "me" ? "ml-auto bg-oxford text-white" : "bg-oxford-50 text-ink")}>{m.text}</div>))}</div>
                  <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(); }}><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a follow-up…" aria-label="Ask a follow-up question" /><Button size="icon" aria-label="Send"><Send className="h-4 w-4" /></Button></form>
                </div>
              )}
              {panel === "progress" && (
                <div className="space-y-4">
                  <div><div className="mb-1 flex justify-between text-sm"><span>This lesson</span><span className="font-semibold">{pct}%</span></div><Progress value={pct} tone="blue" /></div>
                  <div><div className="mb-1 flex justify-between text-sm"><span>Chapter</span><span className="font-semibold">{Math.round(((completed.filter((c) => LESSON_ORDER.includes(c)).length + pct / 100) / 5) * 100)}%</span></div><Progress value={((completed.filter((c) => LESSON_ORDER.includes(c)).length + pct / 100) / 5) * 100} tone="blue" /></div>
                  <ul className="space-y-1.5 text-sm">{LESSON_ORDER.map((id) => <li key={id} className="flex items-center gap-2">{completed.includes(id) ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-slate-300" />}{LESSONS[id].title}</li>)}</ul>
                </div>
              )}
              {panel === "notes" && (<div><p className="mb-2 text-sm text-slate-500">Notes are saved on this device.</p><Textarea rows={10} value={notes[lessonId] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [lessonId]: e.target.value }))} placeholder="Write what you want to remember…" aria-label="Lesson notes" /></div>)}
              {panel === "bookmarks" && (<div className="space-y-2">{bookmarks.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No bookmarks yet. Tap the bookmark icon on any explanation.</p>}{bookmarks.map((b) => (<div key={b.lessonId + b.beatId} className="flex items-center gap-2 rounded-xl border border-line p-2.5 text-sm"><BookmarkCheck className="h-4 w-4 shrink-0 text-crimson" /><button className="flex-1 text-left" onClick={() => router.push(`/student/learn/lesson/${b.lessonId}`)}>{b.title}</button><button aria-label="Remove bookmark" onClick={() => setBookmarks((l) => l.filter((x) => x !== b))}><X className="h-4 w-4 text-slate-400" /></button></div>))}</div>)}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function QuestionCard({ b, res, hint, value, setValue, onHint, onSubmit, locked }: { b: QuestionBeat; res?: Result; hint: boolean; value: string; setValue: (v: string) => void; onHint: () => void; onSubmit: (v: string) => void; locked: boolean }) {
  const [sel, setSel] = useState("");
  const status = res?.status ?? "idle";
  const tone = status === "correct" ? "border-success/40 bg-success-50" : status === "wrong" ? "border-crimson/30 bg-crimson-50" : status === "partial" ? "border-warn/40 bg-warn-50" : status === "revealed" ? "border-oxford-200 bg-oxford-50" : "border-line bg-white";
  return (
    <div className="rounded-2xl rounded-tl-sm border-2 border-oxford-100 bg-white p-4 shadow-card dark:bg-[#101E36]">
      <div className="mb-2 flex items-center gap-2"><Badge tone="red"><HelpCircle className="h-3 w-3" />{b.title}</Badge></div>
      <p className="font-medium text-oxford dark:text-white">{b.prompt}</p>
      {b.equation && <Equation>{b.equation}</Equation>}
      {b.qtype === "mcq" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Answer options">
          {b.options!.map((o) => {
            const picked = (res?.selected ?? sel) === o;
            const correct = (status === "correct" || status === "revealed") && o === b.answer;
            return (
              <button key={o} role="radio" aria-checked={picked} disabled={locked} onClick={() => { setSel(o); onSubmit(o); }}
                className={cn("flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm transition", correct ? "border-success bg-success-50 text-success-700" : picked && status === "wrong" ? "border-crimson bg-crimson-50" : "border-line hover:border-oxford-300 disabled:hover:border-line")}>
                {o}{correct && <CheckCircle2 className="h-4 w-4" />}{picked && status === "wrong" && <XCircle className="h-4 w-4 text-crimson" />}
              </button>
            );
          })}
        </div>
      ) : (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (value.trim() && !locked) onSubmit(value); }}>
          <Input value={value} onChange={(e) => setValue(e.target.value)} disabled={locked} placeholder="Type your answer, e.g. x = 5" aria-label="Your answer" />
          <Button disabled={locked || !value.trim()}>Check</Button>
        </form>
      )}
      {!locked && status !== "correct" && (
        <button onClick={onHint} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-warn-700 hover:underline"><Lightbulb className="h-4 w-4" />{hint ? "Hint shown" : "Give me a hint"}</button>
      )}
      {hint && status !== "correct" && <p className="mt-2 rounded-lg bg-sun-50 px-3 py-2 text-sm text-ink"><b>Hint:</b> {b.hint}</p>}
      {res && status !== "idle" && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-3 rounded-xl border p-3 text-sm", tone)} role="status">
          <p className="mb-0.5 font-semibold">{status === "correct" ? "✅ Correct" : status === "wrong" ? "❌ Not quite" : status === "partial" ? "🟡 Partly there" : "📘 Let's learn from this"}</p>
          <RichText text={res.msg ?? ""} />
          {(status === "correct") && <p className="mt-1 text-slate-600"><b>Why:</b> {b.explain}</p>}
        </motion.div>
      )}
    </div>
  );
}
