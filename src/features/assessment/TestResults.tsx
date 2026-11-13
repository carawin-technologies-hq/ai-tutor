"use client";
import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { CheckCircle2, XCircle, MinusCircle, AlertCircle, RotateCcw, Trophy, Clock, Target, Lightbulb } from "lucide-react";
import Link from "next/link";
import { Button, Card, CardHeader, Badge, MasteryBadge, Progress, RingProgress, Tabs } from "@/components/ui";
import { formatTime, masteryState } from "@/lib/utils";
import { answerText, givenText, topicBreakdown, type SessionResult } from "./engine";

export default function TestResults({ r, onRetry, onDone, label = "Practise again" }: { r: SessionResult; onRetry: () => void; onDone: () => void; label?: string }) {
  const [tab, setTab] = useState("all");
  const pct = r.maxScore ? Math.round((r.score / r.maxScore) * 100) : 0;
  const correct = r.rows.filter((x) => x.v.status === "correct").length;
  const wrong = r.rows.filter((x) => x.v.status === "wrong").length;
  const partial = r.rows.filter((x) => x.v.status === "partial").length;
  const skipped = r.rows.filter((x) => x.v.status === "skipped").length;
  const topics = topicBreakdown(r);
  const weak = topics.filter((t) => t.pct < 60);
  const rows = r.rows.filter((x) => tab === "all" ? true : tab === "wrong" ? x.v.status === "wrong" || x.v.status === "skipped" : tab === "marked" ? x.marked : x.v.status === "correct");
  const grade = pct >= 85 ? "Excellent work!" : pct >= 65 ? "Good effort — you're getting there." : "Keep practising — every attempt helps.";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-6 bg-oxford p-6 text-white sm:flex-row">
          <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-4 border-sun"><span className="font-display text-3xl">{pct}%</span><span className="text-xs text-white/70">{r.score}/{r.maxScore} marks</span></div>
          <div className="text-center sm:text-left"><p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-sun sm:justify-start"><Trophy className="h-4 w-4" />Result · {r.title}</p><h2 className="mt-1 font-display text-2xl">{grade}</h2><p className="mt-1 text-sm text-white/70">Simulated evaluation. Short and long answers are marked by keyword matching in this prototype.</p></div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0">
          {[["Correct", correct, "text-success-700", CheckCircle2], ["Incorrect", wrong + partial, "text-crimson", XCircle], ["Skipped", skipped, "text-slate-500", MinusCircle], ["Time spent", formatTime(r.timeSpent), "text-oxford", Clock]].map(([l, v, c, I]: any) => (
            <div key={l} className="flex items-center gap-3 p-4"><I className={`h-6 w-6 ${c}`} /><div><p className="text-xl font-semibold text-oxford">{v}</p><p className="text-xs text-slate-500">{l}</p></div></div>))}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card><CardHeader title="Topic-wise performance" />
          <div className="h-56 p-3"><ResponsiveContainer width="100%" height="100%"><BarChart data={topics} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid horizontal={false} stroke="#E3E8EF" /><XAxis type="number" domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} /><YAxis dataKey="topic" type="category" width={110} fontSize={11} tickLine={false} axisLine={false} /><Tooltip formatter={(v) => [`${v}%`, "Score"]} contentStyle={{ borderRadius: 12 }} /><Bar dataKey="pct" radius={[0, 6, 6, 0]}>{topics.map((t, i) => <Cell key={i} fill={t.pct >= 80 ? "#16A34A" : t.pct >= 55 ? "#D97706" : "#DC143C"} />)}</Bar></BarChart></ResponsiveContainer></div>
          <div className="space-y-2 px-5 pb-5">{topics.map((t) => <div key={t.topic} className="flex items-center justify-between text-sm"><span>{t.topic}</span><MasteryBadge pct={t.pct} /></div>)}</div>
        </Card>
        <Card><CardHeader title="Improvement recommendations" />
          <div className="space-y-3 p-5 text-sm">
            {weak.length === 0 && <p className="flex gap-2 text-slate-600"><Lightbulb className="h-5 w-5 shrink-0 text-warn-700" />Strong across all chapters attempted. Try harder questions or a timed test next.</p>}
            {weak.map((t) => <p key={t.topic} className="flex gap-2 text-slate-600"><Target className="h-5 w-5 shrink-0 text-crimson" /><span><b className="text-oxford">{t.topic}</b> scored {t.pct}%. Revisit the lesson, then try 5 more questions at Easy–Medium level.</span></p>)}
            {skipped > 0 && <p className="flex gap-2 text-slate-600"><AlertCircle className="h-5 w-5 shrink-0 text-warn-700" />You skipped {skipped} question{skipped > 1 ? "s" : ""}. In exams, attempt every question — partial method marks count.</p>}
            {r.timeSpent / Math.max(1, r.total) > 120 && <p className="flex gap-2 text-slate-600"><Clock className="h-5 w-5 shrink-0 text-oxford" />You averaged over 2 minutes per question. Practise a timed set to build speed.</p>}
            <div className="flex flex-wrap gap-2 pt-2"><Link href="/student/learn/lesson/le-2"><Button size="sm" variant="soft">Revise with teacher</Button></Link><Link href="/student/planner"><Button size="sm" variant="outline">Add to study plan</Button></Link></div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Question review" action={<Tabs value={tab} onChange={setTab} tabs={[{ id: "all", label: "All" }, { id: "wrong", label: "Needs work" }, { id: "correct", label: "Correct" }, { id: "marked", label: "Marked" }]} />} />
        <ul className="divide-y divide-line p-2">
          {rows.length === 0 && <li className="p-8 text-center text-sm text-slate-500">Nothing here.</li>}
          {rows.map(({ q, a, v, time }, k) => (
            <li key={q.id} className="p-4">
              <div className="flex items-start gap-3">
                {v.status === "correct" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> : v.status === "skipped" ? <MinusCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-crimson" />}
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-line font-medium text-oxford dark:text-white">{q.text}</p>
                  <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Your answer: </span>{givenText(q, a)}</p><p><span className="text-slate-500">Correct: </span><span className="text-success-700">{answerText(q)}</span></p></div>
                  <p className="mt-2 rounded-lg bg-mist px-3 py-2 text-sm text-slate-600"><b>Explanation: </b>{q.explanation}</p>
                  <p className="mt-1 text-xs text-slate-400">{q.chapter} · {q.difficulty} · {v.score}/{q.marks} marks · {formatTime(time)}</p>
                </div>
              </div>
            </li>))}
        </ul>
      </Card>
      <div className="flex flex-wrap justify-center gap-3 pb-4"><Button onClick={onRetry}><RotateCcw className="h-4 w-4" />{label}</Button><Button variant="outline" onClick={onDone}>Back</Button></div>
    </div>
  );
}
