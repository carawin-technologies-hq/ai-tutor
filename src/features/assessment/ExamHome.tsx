"use client";
import React, { useState } from "react";
import { CalendarClock, FileText, Award, ClipboardCheck, BookMarked, History, RefreshCw, GraduationCap, Landmark, Play, AlertTriangle } from "lucide-react";
import { Button, Card, CardHeader, Badge, PageHeader, Progress, DemoTag, MasteryBadge, Tabs } from "@/components/ui";
import { EXAMS } from "@/data/mock-progress";
import { QUESTION_BANK } from "@/data/mock-questions";
import { daysUntil, fmtDate } from "@/lib/dates";
import TestRunner, { type RunnerConfig } from "./TestRunner";
import TestResults from "./TestResults";
import type { SessionResult } from "./engine";
import Link from "next/link";

const TESTS = [
  { id: "chapter", title: "Chapter test", desc: "One chapter, 20 minutes", icon: ClipboardCheck, count: 8, min: 20, filter: (q: any) => q.chapter === "Linear Equations", tag: "Linear Equations" },
  { id: "unit", title: "Unit test", desc: "Mixed chapters from a unit", icon: FileText, count: 10, min: 30, filter: (q: any) => q.subject === "Mathematics", tag: "Mathematics" },
  { id: "half", title: "Half-yearly preparation", desc: "Broad paper across subjects", icon: BookMarked, count: 14, min: 45, filter: () => true, tag: "All subjects" },
  { id: "annual", title: "Annual examination prep", desc: "Full-length practice paper", icon: GraduationCap, count: 18, min: 60, filter: () => true, tag: "All subjects" },
  { id: "board", title: "Board examination prep", desc: "Board-style paper pattern", icon: Landmark, count: 16, min: 60, filter: () => true, tag: "Illustrative" },
  { id: "mock", title: "Mock test", desc: "Timed full simulation", icon: Award, count: 12, min: 25, filter: () => true, tag: "Mixed" },
  { id: "sample", title: "Sample paper", desc: "Illustrative sample paper", icon: FileText, count: 10, min: 30, filter: (q: any) => q.subject === "Science", tag: "Science · Illustrative" },
  { id: "pyq", title: "Previous-year-style questions", desc: "Questions in the style of past papers", icon: History, count: 10, min: 25, filter: (q: any) => q.difficulty !== "Easy", tag: "Style only" },
  { id: "revision", title: "Revision test", desc: "Short check on weak chapters", icon: RefreshCw, count: 6, min: 12, filter: (q: any) => ["Factorisation", "Force and Pressure"].includes(q.chapter), tag: "Weak chapters" },
];

const WEAK = [{ ch: "Factorisation", pct: 38 }, { ch: "Cell Structure", pct: 58 }, { ch: "Force and Pressure", pct: 65 }];

export default function ExamHome() {
  const [tab, setTab] = useState("overview");
  const [run, setRun] = useState<RunnerConfig | null>(null);
  const [res, setRes] = useState<SessionResult | null>(null);
  const [last, setLast] = useState<(typeof TESTS)[number] | null>(null);

  const launch = (t: (typeof TESTS)[number]) => {
    const pool = QUESTION_BANK.filter(t.filter);
    const count = Math.min(t.count, pool.length);
    setLast(t); setRes(null);
    setRun({ title: t.title, pool: [...pool].sort(() => Math.random() - 0.5), count, durationSec: t.min * 60, showNavPanel: true, examStyle: true });
  };

  if (run && !res) return <TestRunner config={run} onFinish={setRes} onExit={() => setRun(null)} />;
  if (res) return <TestResults r={res} label="Retake test" onRetry={() => last && launch(last)} onDone={() => { setRes(null); setRun(null); }} />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Assess" title="Examination Preparation" subtitle="Track your preparation and take timed tests with a real exam-style interface." actions={<DemoTag>Illustrative prototype content</DemoTag>} />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ id: "overview", label: "Preparation overview" }, { id: "tests", label: "Tests & papers" }]} />

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {EXAMS.map((e) => { const d = daysUntil(e.date); return (
              <Card key={e.id} className="p-5">
                <Badge tone="blue">{e.kind}</Badge>
                <p className="mt-2 font-semibold text-oxford dark:text-white">{e.name}</p><p className="text-sm text-slate-500">{e.subject} · {fmtDate(e.date, { day: "numeric", month: "short", year: "numeric" })}</p>
                <div className="mt-3 flex items-baseline gap-1.5"><span className="font-display text-4xl text-crimson">{d}</span><span className="text-sm text-slate-500">days left</span></div>
                <div className="mt-3 flex justify-between text-xs text-slate-500"><span>Syllabus completion</span><span>{e.syllabus}%</span></div><Progress value={e.syllabus} tone="blue" className="mt-1" />
                <p className="mt-2 text-xs font-medium">{e.syllabus >= 70 ? <span className="text-success-700">On track</span> : e.syllabus >= 50 ? <span className="text-warn-700">Needs attention</span> : <span className="text-crimson">Start soon</span>}</p>
              </Card>); })}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card><CardHeader title="Weak chapters" subtitle="Based on your recent practice (demo data)" />
              <ul className="space-y-4 p-5">{WEAK.map((w) => <li key={w.ch}><div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium">{w.ch}</span><MasteryBadge pct={w.pct} /></div><Progress value={w.pct} /></li>)}</ul>
            </Card>
            <Card><CardHeader title="Recommended practice" />
              <ul className="space-y-3 p-5 text-sm">
                {[["Revision test: Factorisation + Force & Pressure", "revision"], ["Chapter test: Linear Equations", "chapter"], ["Mock test (25 min)", "mock"]].map(([l, id]) => (
                  <li key={id} className="flex items-center justify-between gap-3 rounded-xl bg-mist p-3"><span>{l}</span><Button size="sm" onClick={() => launch(TESTS.find((t) => t.id === id)!)}><Play className="h-3.5 w-3.5" />Start</Button></li>))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {tab === "tests" && (
        <div>
          <p className="mb-4 flex items-start gap-2 rounded-xl bg-sun-50 px-4 py-3 text-sm text-ink"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn-700" />All sample papers here are illustrative prototype content assembled from a small demo question bank. They are not real board papers.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TESTS.map((t) => (
              <Card key={t.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-oxford text-sun"><t.icon className="h-5 w-5" /></span><Badge tone="neutral">{t.tag}</Badge></div>
                <p className="mt-3 font-semibold text-oxford dark:text-white">{t.title}</p><p className="text-sm text-slate-500">{t.desc}</p>
                <p className="mt-2 text-xs text-slate-400">{Math.min(t.count, QUESTION_BANK.filter(t.filter).length)} questions · {t.min} min</p>
                <Button className="mt-4 w-full justify-center" variant="outline" onClick={() => launch(t)}><Play className="h-4 w-4" />Start</Button>
              </Card>))}
          </div>
        </div>
      )}
    </div>
  );
}
