"use client";
import React, { useState } from "react";
import Link from "next/link";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { TrendingUp, Flame, BookCheck, Target, Sparkles, AlertTriangle, CheckCircle2, ArrowRight, Info } from "lucide-react";
import { Card, CardHeader, PageHeader, StatCard, Progress, MasteryBadge, Tabs, Badge, RingProgress, DemoTag } from "@/components/ui";
import { ChartCard } from "./ChartCard";
import { TOPIC_MASTERY, WEEKLY_ACTIVITY, MONTHLY_TREND, TEST_SCORES, SUBJECT_PROGRESS, LINEAR_EQ_TREND, INSIGHTS } from "@/data/mock-progress";
import { masteryState } from "@/lib/utils";

const col = (p: number) => (p >= 80 ? "#16A34A" : p >= 55 ? "#D97706" : "#DC143C");
const tip = { contentStyle: { borderRadius: 12, border: "1px solid #E3E8EF" } };

export default function StudentProgress() {
  const [subject, setSubject] = useState("Mathematics");
  const all = Object.values(TOPIC_MASTERY).flat();
  const need = all.filter((t) => masteryState(t.pct) === "revise");
  const overall = Math.round(SUBJECT_PROGRESS.reduce((a, s) => a + s.progress, 0) / SUBJECT_PROGRESS.length);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Understand" title="My Progress" subtitle="See what you know well, what is developing and what needs revision." actions={<DemoTag>Demonstration data</DemoTag>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4"><RingProgress value={overall} /><div><p className="text-xs text-slate-500">Overall progress</p><p className="font-semibold text-oxford">Class 8 syllabus</p></div></Card>
        <StatCard icon={<Target className="h-5 w-5" />} label="Practice accuracy" value="78%" tone="green" sub="Up from 58% in June" />
        <StatCard icon={<Flame className="h-5 w-5" />} label="Learning streak" value="12 days" tone="red" sub="Best: 15 days" />
        <StatCard icon={<BookCheck className="h-5 w-5" />} label="Chapters completed" value="7 of 20" tone="yellow" sub="3 in progress" />
      </div>

      <Card className="border-l-4 border-l-oxford">
        <CardHeader title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-crimson" />Your AI Learning Insights</span>} subtitle="Generated from your recent activity (sample data)" />
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {INSIGHTS.map((i) => (
            <div key={i.title} className="rounded-xl border border-line bg-mist p-4">
              <div className="flex items-center gap-2">{i.tone === "green" ? <TrendingUp className="h-4 w-4 text-success" /> : <AlertTriangle className={`h-4 w-4 ${i.tone === "red" ? "text-crimson" : "text-warn"}`} />}<p className="text-sm font-semibold text-oxford">{i.title}</p></div>
              <p className="mt-2 text-sm text-slate-600">{i.body}</p>
            </div>))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Weekly learning time" subtitle="Minutes per day" table={{ head: ["Day", "Minutes"], rows: WEEKLY_ACTIVITY.map((d) => [d.day, d.minutes]) }}
          chart={<ResponsiveContainer width="100%" height="100%"><BarChart data={WEEKLY_ACTIVITY} margin={{ left: -20, top: 8 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip {...tip} cursor={{ fill: "#EEF3FA" }} formatter={(v) => [`${v} min`, "Learning time"]} /><Bar dataKey="minutes" fill="#002147" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>} />
        <ChartCard title="Practice accuracy trend" subtitle="Monthly accuracy (%)" table={{ head: ["Month", "Accuracy %"], rows: MONTHLY_TREND.map((d) => [d.month, d.accuracy]) }}
          chart={<ResponsiveContainer width="100%" height="100%"><LineChart data={MONTHLY_TREND} margin={{ left: -20, top: 8, right: 10 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis domain={[40, 100]} tickLine={false} axisLine={false} fontSize={12} /><Tooltip {...tip} formatter={(v) => [`${v}%`, "Accuracy"]} /><Line type="monotone" dataKey="accuracy" stroke="#002147" strokeWidth={2.5} dot={{ r: 4, fill: "#002147", stroke: "#fff", strokeWidth: 2 }} /></LineChart></ResponsiveContainer>} />
        <ChartCard title="Monthly learning hours" subtitle="Hours of study per month" table={{ head: ["Month", "Hours"], rows: MONTHLY_TREND.map((d) => [d.month, d.hours]) }}
          chart={<ResponsiveContainer width="100%" height="100%"><BarChart data={MONTHLY_TREND} margin={{ left: -20, top: 8 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip {...tip} cursor={{ fill: "#EEF3FA" }} formatter={(v) => [`${v} h`, "Study time"]} /><Bar dataKey="hours" fill="#002147" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>} />
        <ChartCard title="Test scores" subtitle="Recent tests (%)" table={{ head: ["Test", "Score %"], rows: TEST_SCORES.map((d) => [d.test, d.score]) }}
          chart={<ResponsiveContainer width="100%" height="100%"><LineChart data={TEST_SCORES} margin={{ left: -20, top: 8, right: 10 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="test" tickLine={false} axisLine={false} fontSize={11} /><YAxis domain={[40, 100]} tickLine={false} axisLine={false} fontSize={12} /><Tooltip {...tip} formatter={(v) => [`${v}%`, "Score"]} /><Line type="monotone" dataKey="score" stroke="#DC143C" strokeWidth={2.5} dot={{ r: 4, fill: "#DC143C", stroke: "#fff", strokeWidth: 2 }} /></LineChart></ResponsiveContainer>} />
      </div>

      <Card>
        <CardHeader title="Subject performance" subtitle="Syllabus covered vs. average score" />
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          {SUBJECT_PROGRESS.map((s) => (
            <div key={s.subject} className="rounded-xl border border-line p-4"><div className="flex items-center justify-between"><p className="font-semibold text-oxford">{s.subject}</p><MasteryBadge pct={s.score} /></div>
              <div className="mt-3 space-y-2 text-sm"><div><div className="mb-1 flex justify-between text-slate-500"><span>Syllabus covered</span><span>{s.progress}%</span></div><Progress value={s.progress} tone="blue" /></div><div><div className="mb-1 flex justify-between text-slate-500"><span>Average score</span><span>{s.score}%</span></div><Progress value={s.score} /></div></div></div>))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Chapter and topic mastery" action={<Tabs value={subject} onChange={setSubject} tabs={Object.keys(TOPIC_MASTERY).map((s) => ({ id: s, label: s }))} />} />
        <div className="flex flex-wrap gap-3 px-5 pt-3 text-xs text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" />Strong (80%+)</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warn" />Developing (55–79%)</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-crimson" />Needs revision (&lt;55%)</span></div>
        <ul className="grid gap-4 p-5 md:grid-cols-2">
          {TOPIC_MASTERY[subject].map((t) => (
            <li key={t.topic}><div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium">{t.topic}</span><span className="flex items-center gap-2"><span className="font-semibold">{t.pct}%</span><MasteryBadge pct={t.pct} /></span></div><Progress value={t.pct} /></li>))}
        </ul>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Linear Equations: improvement" subtitle="Mastery over five weeks (%)" table={{ head: ["Week", "Mastery %"], rows: LINEAR_EQ_TREND.map((d) => [d.week, d.pct]) }}
          chart={<ResponsiveContainer width="100%" height="100%"><LineChart data={LINEAR_EQ_TREND} margin={{ left: -20, top: 8, right: 10 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} /><YAxis domain={[40, 100]} tickLine={false} axisLine={false} fontSize={12} /><ReferenceLine y={80} stroke="#16A34A" strokeDasharray="4 4" label={{ value: "Strong", fontSize: 11, fill: "#15803D", position: "insideTopLeft" }} /><Tooltip {...tip} formatter={(v) => [`${v}%`, "Mastery"]} /><Line dataKey="pct" stroke="#002147" strokeWidth={2.5} dot={{ r: 4, fill: "#002147", stroke: "#fff", strokeWidth: 2 }} /></LineChart></ResponsiveContainer>} />
        <Card>
          <CardHeader title="Areas requiring revision" subtitle="And why we recommend them" />
          <ul className="space-y-3 p-5">
            {need.length === 0 && <li className="text-sm text-slate-500">Nothing needs revision right now.</li>}
            {need.map((t) => (<li key={t.topic} className="rounded-xl border border-crimson/20 bg-crimson-50/40 p-3 text-sm"><div className="flex items-center justify-between"><p className="font-semibold text-oxford">{t.topic} · {t.pct}%</p><Badge tone="red">Needs revision</Badge></div>
              <p className="mt-1 text-slate-600">{t.topic === "Factorisation" ? "Recommended because accuracy is below 55% and most errors involve negative signs when taking out common factors." : "Recommended because recent attempts were below 55% and several questions were skipped."}</p>
              <Link href="/student/practice" className="mt-2 inline-flex items-center gap-1 font-medium text-crimson hover:underline">Practise now <ArrowRight className="h-3.5 w-3.5" /></Link></li>))}
          </ul>
        </Card>
      </div>
      <p className="flex items-center gap-2 text-xs text-slate-500"><Info className="h-3.5 w-3.5" />All charts and scores on this page are demonstration data for the prototype.</p>
    </div>
  );
}
