"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { Clock, BookOpenCheck, HelpCircle, Flame, ArrowRight, MessagesSquare, ScanSearch, PenLine, Library, LineChart, Lightbulb, CalendarClock, CheckCircle2, Circle, Play } from "lucide-react";
import { Card, CardHeader, Button, Progress, StatCard, Skeleton, DemoTag, Badge } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { usePersisted } from "@/hooks/usePersisted";
import { DASHBOARD_STATS, SUBJECT_PROGRESS, WEEKLY_ACTIVITY, EXAMS } from "@/data/mock-progress";
import { initialTasks } from "@/data/mock-planner";
import { todayStr, daysUntil, fmtDate } from "@/lib/dates";
import { SUBJECT_COLORS } from "@/data/mock-curriculum";
import type { Task } from "@/types";

const ACTIONS = [
  { href: "/student/learn", title: "Learn a Chapter", desc: "Structured lessons with your AI teacher", icon: BookOpenCheck, tone: "bg-oxford text-white", ic: "text-sun" },
  { href: "/student/teacher", title: "Talk to My Teacher", desc: "Ask anything, by text or voice", icon: MessagesSquare, tone: "bg-white", ic: "text-crimson" },
  { href: "/student/doubt", title: "Solve My Doubt", desc: "Photo, PDF or typed question", icon: ScanSearch, tone: "bg-white", ic: "text-crimson" },
  { href: "/student/practice", title: "Practise & Test", desc: "Adaptive questions, 10 formats", icon: PenLine, tone: "bg-white", ic: "text-crimson" },
  { href: "/student/library", title: "My Digital Library", desc: "Notes, textbooks and worksheets", icon: Library, tone: "bg-white", ic: "text-crimson" },
  { href: "/student/progress", title: "My Progress", desc: "Mastery, trends and insights", icon: LineChart, tone: "bg-white", ic: "text-crimson" },
];

export default function StudentDashboard() {
  const { profile, toast } = useDemo();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = usePersisted<Task[]>("tasks", initialTasks());
  useEffect(() => { const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t); }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = tasks.filter((t) => t.date === todayStr());
  const exam = EXAMS[0];
  const left = daysUntil(exam.date);

  if (loading) return (
    <div className="space-y-6"><Skeleton className="h-24" /><div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div></div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-oxford dark:text-white">{greet}, {profile.name.split(" ")[0]}!</h1>
          <p className="mt-1 text-slate-500">Ready to learn something new today?</p>
        </div>
        <div className="flex items-center gap-2"><Badge tone="blue">{profile.board} · Class {profile.classLevel}</Badge><DemoTag /></div>
      </div>

      {/* Daily overview */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Clock className="h-5 w-5" />} label="Learning time today" value={`${DASHBOARD_STATS.minutesToday} min`} sub="Goal: 60 min" />
        <StatCard icon={<BookOpenCheck className="h-5 w-5" />} label="Lessons completed" value={DASHBOARD_STATS.lessonsDone} tone="green" sub="This week: 9" />
        <StatCard icon={<HelpCircle className="h-5 w-5" />} label="Questions solved" value={DASHBOARD_STATS.questionsSolved} tone="yellow" sub="82% accuracy" />
        <StatCard icon={<Flame className="h-5 w-5" />} label="Current streak" value={`${DASHBOARD_STATS.streak} days`} tone="red" sub="Personal best: 15" />
      </div>

      {/* Continue + exam */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex overflow-hidden lg:col-span-2">
          <div className="flex w-full flex-col gap-5 bg-oxford p-6 text-white sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun">Continue learning</p>
              <h2 className="mt-2 font-display text-2xl">Linear Equations</h2>
              <p className="mt-1 text-sm text-white/70">Mathematics · Solving x + a = b · Lesson 2 of 5</p>
              <div className="mt-4 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20"><div className="h-full w-[40%] rounded-full bg-sun" /></div><span className="text-sm font-semibold">40%</span></div>
            </div>
            <Link href="/student/learn/lesson/le-2"><Button variant="yellow" size="lg"><Play className="h-4 w-4" />Continue</Button></Link>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500"><CalendarClock className="h-4 w-4 text-crimson" />Upcoming examination</div>
          <p className="mt-2 font-semibold text-oxford">{exam.name} · {exam.subject}</p>
          <div className="mt-2 flex items-baseline gap-2"><span className="font-display text-5xl text-crimson">{left}</span><span className="text-slate-500">days to go · {fmtDate(exam.date)}</span></div>
          <div className="mt-3 flex justify-between text-xs text-slate-500"><span>Syllabus covered</span><span>{exam.syllabus}%</span></div>
          <Progress value={exam.syllabus} className="mt-1" tone="blue" />
          <Link href="/student/exams" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-oxford hover:underline">Prepare now <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Card>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((a, i) => (
          <motion.div key={a.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={a.href} className={`group flex h-full items-center gap-4 rounded-xl2 border border-line p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift ${a.tone}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${i === 0 ? "bg-white/10" : "bg-crimson-50"}`}><a.icon className={`h-6 w-6 ${a.ic}`} /></div>
              <div className="min-w-0 flex-1"><p className={`font-semibold ${i === 0 ? "text-white" : "text-oxford"}`}>{a.title}</p><p className={`text-sm ${i === 0 ? "text-white/70" : "text-slate-500"}`}>{a.desc}</p></div>
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${i === 0 ? "text-sun" : "text-slate-400"}`} />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Subject progress */}
        <Card className="lg:col-span-1">
          <CardHeader title="Subject progress" subtitle="Syllabus covered" />
          <div className="space-y-4 p-5">
            {SUBJECT_PROGRESS.map((s) => (
              <Link key={s.subject} href="/student/progress" className="block">
                <div className="mb-1.5 flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-medium"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SUBJECT_COLORS[s.subject] }} />{s.subject}</span><span className="text-slate-500">{s.progress}%</span></div>
                <Progress value={s.progress} tone="blue" />
              </Link>
            ))}
          </div>
        </Card>

        {/* AI recommendation + weekly chart */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-l-4 border-l-sun p-5">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sun-50 text-warn-700"><Lightbulb className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-warn-700">AI recommendation</p>
                <p className="mt-1 text-ink dark:text-slate-100">Your understanding of <b>Factorisation</b> needs improvement. Spend 15 minutes revising it before moving to the next chapter.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/student/practice"><Button size="sm" variant="primary">Practise Factorisation</Button></Link>
                  <Button size="sm" variant="outline" onClick={() => { setTasks((l) => [{ id: "t" + Date.now(), title: "Revise Factorisation (15 min)", subject: "Mathematics", date: todayStr(), duration: 15, priority: "High", kind: "Revision", done: false }, ...l]); toast("Added to today's study plan"); }}>Add to my plan</Button>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="This week's activity" subtitle="Minutes of learning per day" action={<DemoTag />} />
            <div className="h-48 p-3 pr-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_ACTIVITY} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E3E8EF" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <RTooltip cursor={{ fill: "#EEF3FA" }} contentStyle={{ borderRadius: 12, border: "1px solid #E3E8EF" }} formatter={(v) => [`${v} min`, "Learning"]} />
                  <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>{WEEKLY_ACTIVITY.map((d, i) => <Cell key={i} fill={i === 3 ? "#DC143C" : "#002147"} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Today's plan */}
      <Card>
        <CardHeader title="Today's study plan" subtitle={`${today.filter((t) => t.done).length} of ${today.length} done`} action={<Link href="/student/planner"><Button size="sm" variant="soft">Open planner</Button></Link>} />
        <ul className="divide-y divide-line p-2 pt-3">
          {today.length === 0 && <li className="p-6 text-center text-sm text-slate-500">Nothing planned for today. Add a task in your planner.</li>}
          {today.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-mist">
              <button aria-label={t.done ? "Mark as not done" : "Mark as done"} onClick={() => { setTasks((l) => l.map((x) => x.id === t.id ? { ...x, done: !x.done } : x)); if (!t.done) toast("Nice work! Task completed 🎉"); }}>
                {t.done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-slate-300" />}
              </button>
              <div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${t.done ? "text-slate-400 line-through" : "text-ink dark:text-slate-100"}`}>{t.title}</p><p className="text-xs text-slate-500">{t.subject} · {t.duration} min</p></div>
              <Badge tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "neutral"}>{t.priority}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
