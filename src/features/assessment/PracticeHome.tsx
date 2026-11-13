"use client";
import React, { useMemo, useState } from "react";
import { Zap, BookOpen, Target, Timer, SlidersHorizontal, TrendingDown, Play } from "lucide-react";
import { Button, Card, CardHeader, Field, Select, PageHeader, EmptyState, Badge, DemoTag } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { QUESTION_BANK, TYPE_LABEL } from "@/data/mock-questions";
import { BOARDS, CLASSES, TOPICS } from "@/data/mock-curriculum";
import TestRunner, { type RunnerConfig } from "./TestRunner";
import TestResults from "./TestResults";
import type { SessionResult } from "./engine";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "quick", title: "Quick practice", desc: "5 adaptive questions", icon: Zap },
  { id: "chapter", title: "Chapter practice", desc: "Pick a chapter, get instant feedback", icon: BookOpen },
  { id: "topic", title: "Topic practice", desc: "Zoom in on one topic", icon: Target },
  { id: "weak", title: "Weak-topic practice", desc: "Auto-picked from your weakest chapters", icon: TrendingDown },
  { id: "timed", title: "Timed practice", desc: "10 questions, 12 minutes", icon: Timer },
  { id: "custom", title: "Custom practice", desc: "Set every filter yourself", icon: SlidersHorizontal },
] as const;
const WEAK = ["Factorisation", "Force and Pressure"];

export default function PracticeHome() {
  const { profile } = useDemo();
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("quick");
  const [f, setF] = useState({ board: profile.board, classLevel: profile.classLevel, subject: "All", chapter: "All", topic: "All", difficulty: "All", type: "All", count: 8 });
  const [run, setRun] = useState<RunnerConfig | null>(null);
  const [res, setRes] = useState<SessionResult | null>(null);

  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const chapters = useMemo(() => Array.from(new Set(QUESTION_BANK.filter((q) => f.subject === "All" || q.subject === f.subject).map((q) => q.chapter))), [f.subject]);
  const topics = useMemo(() => Array.from(new Set(QUESTION_BANK.filter((q) => f.chapter === "All" || q.chapter === f.chapter).map((q) => q.topic))), [f.chapter]);

  const pool = useMemo(() => QUESTION_BANK.filter((q) =>
    q.board === f.board && q.classLevel === f.classLevel &&
    (mode === "weak" ? WEAK.includes(q.chapter) : true) &&
    (f.subject === "All" || q.subject === f.subject) && (f.chapter === "All" || q.chapter === f.chapter) &&
    (f.topic === "All" || q.topic === f.topic) && (f.difficulty === "All" || q.difficulty === f.difficulty) && (f.type === "All" || q.type === f.type)), [f, mode]);

  const start = () => {
    const defaults: Record<string, { count: number; adaptive?: boolean; dur?: number; feedback?: boolean; nav?: boolean }> = {
      quick: { count: 5, adaptive: true, feedback: true }, chapter: { count: 8, feedback: true }, topic: { count: 6, feedback: true },
      weak: { count: 6, adaptive: true, feedback: true }, timed: { count: 10, dur: 720, nav: true }, custom: { count: f.count, feedback: true },
    };
    const d = defaults[mode]; const count = Math.min(d.count, pool.length);
    const ordered = d.adaptive ? pool : [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    setRes(null);
    setRun({ title: `${MODES.find((m) => m.id === mode)!.title}`, pool: ordered, count, adaptive: d.adaptive, instantFeedback: d.feedback, durationSec: d.dur, showNavPanel: d.nav, examStyle: d.nav });
  };

  if (run && !res) return <TestRunner config={run} onFinish={setRes} onExit={() => setRun(null)} />;
  if (res) return <TestResults r={res} onRetry={() => { setRes(null); start(); }} onDone={() => { setRes(null); setRun(null); }} />;

  const showChapter = ["chapter", "topic", "custom"].includes(mode);
  const showTopic = ["topic", "custom"].includes(mode);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Practise" title="Practise & Test" subtitle="Choose a practice style. Quick and weak-topic sessions adapt difficulty to your answers." actions={<DemoTag>Sample question bank</DemoTag>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} aria-pressed={mode === m.id} className={cn("card-surface flex items-center gap-4 p-4 text-left transition", mode === m.id ? "border-oxford ring-2 ring-oxford/20" : "hover:border-oxford-300")}>
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", mode === m.id ? "bg-oxford text-sun" : "bg-oxford-50 text-oxford")}><m.icon className="h-5 w-5" /></span>
            <span><span className="block font-semibold text-oxford dark:text-white">{m.title}</span><span className="block text-sm text-slate-500">{m.desc}</span></span>
          </button>))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Filters" subtitle={mode === "weak" ? "Weak chapters detected: Factorisation and Force and Pressure" : "Narrow down your question set"} />
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Board"><Select value={f.board} onChange={(e) => set({ board: e.target.value })}>{BOARDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</Select></Field>
          <Field label="Class"><Select value={f.classLevel} onChange={(e) => set({ classLevel: e.target.value })}>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}</Select></Field>
          <Field label="Subject"><Select value={f.subject} onChange={(e) => set({ subject: e.target.value, chapter: "All", topic: "All" })}><option>All</option><option>Mathematics</option><option>Science</option></Select></Field>
          {showChapter && <Field label="Chapter"><Select value={f.chapter} onChange={(e) => set({ chapter: e.target.value, topic: "All" })}><option>All</option>{chapters.map((c) => <option key={c}>{c}</option>)}</Select></Field>}
          {showTopic && <Field label="Topic"><Select value={f.topic} onChange={(e) => set({ topic: e.target.value })}><option>All</option>{topics.map((c) => <option key={c}>{c}</option>)}</Select></Field>}
          <Field label="Difficulty"><Select value={f.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>{["All", "Easy", "Medium", "Hard"].map((d) => <option key={d}>{d}</option>)}</Select></Field>
          <Field label="Question type"><Select value={f.type} onChange={(e) => set({ type: e.target.value })}><option value="All">All types</option>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          {mode === "custom" && <Field label={`Number of questions: ${Math.min(f.count, pool.length)}`}><input type="range" min={3} max={Math.max(3, Math.min(20, pool.length))} value={Math.min(f.count, pool.length)} onChange={(e) => set({ count: +e.target.value })} className="w-full accent-[#002147]" aria-label="Number of questions" /></Field>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-5">
          <p className="text-sm text-slate-500"><b className="text-oxford">{pool.length}</b> matching questions in the sample bank</p>
          <Button variant="accent" size="lg" disabled={pool.length < 1} onClick={start}><Play className="h-4 w-4" />Start {MODES.find((m) => m.id === mode)!.title.toLowerCase()}</Button>
        </div>
      </Card>
      {pool.length === 0 && <div className="mt-6"><EmptyState title="No questions match these filters" body="The prototype question bank covers Class 8 CBSE Mathematics and Science. Loosen a filter or switch the class back to 8." /></div>}
    </div>
  );
}
