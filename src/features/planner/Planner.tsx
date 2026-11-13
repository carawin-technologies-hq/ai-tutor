"use client";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Lightbulb, CalendarClock, Bell, ChevronLeft, ChevronRight, Target } from "lucide-react";
import Link from "next/link";
import { Button, Card, CardHeader, Badge, Modal, Field, Input, Select, Tabs, PageHeader, EmptyState, Switch, Progress } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { usePersisted } from "@/hooks/usePersisted";
import { initialTasks } from "@/data/mock-planner";
import { ALL_SUBJECTS, SUBJECT_COLORS } from "@/data/mock-curriculum";
import { EXAMS } from "@/data/mock-progress";
import { addDays, todayStr, fmtDate, daysUntil } from "@/lib/dates";
import { cn, uid } from "@/lib/utils";
import type { Task } from "@/types";

const schema = z.object({
  title: z.string().trim().min(3, "Give the task a short title (3+ characters)").max(80, "Keep the title under 80 characters"),
  subject: z.string().min(1),
  date: z.string().min(1, "Choose a date"),
  duration: z.string().refine((v) => /^\d+$/.test(v) && +v >= 5 && +v <= 240, "Enter minutes between 5 and 240"),
  priority: z.enum(["High", "Medium", "Low"]),
  kind: z.enum(["Study", "Homework", "Revision", "Test"]),
});
type F = z.infer<typeof schema>;
const PRIO = { High: "red", Medium: "amber", Low: "neutral" } as const;

export default function Planner() {
  const { toast } = useDemo();
  const [tasks, setTasks] = usePersisted<Task[]>("tasks", initialTasks());
  const [view, setView] = useState("day");
  const [day, setDay] = useState(todayStr());
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const [reminders, setReminders] = usePersisted<boolean>("planner-reminders", true);

  const form = useForm<F>({ resolver: zodResolver(schema), defaultValues: { title: "", subject: "Mathematics", date: todayStr(), duration: "30", priority: "Medium", kind: "Study" } });
  const openForm = (t: Task | "new") => {
    setEditing(t);
    form.reset(t === "new" ? { title: "", subject: "Mathematics", date: day, duration: "30", priority: "Medium", kind: "Study" } : { title: t.title, subject: t.subject, date: t.date, duration: String(t.duration), priority: t.priority, kind: t.kind });
  };
  const onSave = form.handleSubmit((v) => {
    const t: Task = { id: editing && editing !== "new" ? editing.id : uid(), done: editing && editing !== "new" ? editing.done : false, ...v, duration: +v.duration };
    setTasks((l) => editing === "new" ? [...l, t] : l.map((x) => x.id === t.id ? t : x));
    toast(editing === "new" ? "Task added" : "Task updated"); setEditing(null);
  });

  const week = useMemo(() => { const d = new Date(day + "T00:00:00"); const mon = addDays(d, -((d.getDay() + 6) % 7)); return Array.from({ length: 7 }, (_, i) => addDays(mon, i)); }, [day]);
  const dayTasks = tasks.filter((t) => t.date === day);
  const listed = tasks.filter((t) => filter === "all" ? true : filter === "done" ? t.done : !t.done).sort((a, b) => a.date.localeCompare(b.date));
  const pending = tasks.filter((t) => !t.done).length; const doneN = tasks.length - pending;
  const toggle = (id: string) => setTasks((l) => l.map((x) => x.id === id ? { ...x, done: !x.done } : x));
  const del = (t: Task) => { setTasks((l) => l.filter((x) => x.id !== t.id)); toast("Task deleted", "info"); };
  const prio = (t: Task) => setTasks((l) => l.map((x) => x.id === t.id ? { ...x, priority: x.priority === "High" ? "Low" : x.priority === "Medium" ? "High" : "Medium" } : x));

  const Row = ({ t }: { t: Task }) => (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-white p-3">
      <button aria-label={t.done ? "Mark as pending" : "Mark as complete"} onClick={() => toggle(t.id)}>{t.done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-slate-300" />}</button>
      <span className="h-8 w-1 rounded-full" style={{ background: SUBJECT_COLORS[t.subject] ?? "#002147" }} />
      <div className="min-w-[140px] flex-1"><p className={cn("text-sm font-medium", t.done && "text-slate-400 line-through")}>{t.title}</p><p className="text-xs text-slate-500">{t.subject} · {t.kind} · {t.duration} min · {fmtDate(t.date)}</p></div>
      <button title="Change priority" onClick={() => prio(t)}><Badge tone={PRIO[t.priority]}>{t.priority}</Badge></button>
      <Button size="icon" variant="ghost" aria-label={`Edit ${t.title}`} onClick={() => openForm(t)}><Pencil className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" aria-label={`Delete ${t.title}`} onClick={() => del(t)}><Trash2 className="h-4 w-4" /></Button>
    </li>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Improve" title="My Study Planner" subtitle="Plan your day, track homework and schedule revision." actions={<Button variant="accent" onClick={() => openForm("new")}><Plus className="h-4 w-4" />Add task</Button>} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="border-l-4 border-l-sun p-5"><div className="flex gap-3"><Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-warn-700" /><div><p className="text-xs font-semibold uppercase tracking-wider text-warn-700">AI recommendation</p><p className="mt-1 text-sm">You have <b>3 topics to revise this week</b>. We recommend starting with <b>Factorisation</b>.</p>
            <Button size="sm" className="mt-3" variant="outline" onClick={() => { setTasks((l) => [...l, { id: uid(), title: "Revise Factorisation (AI suggested)", subject: "Mathematics", date: day, duration: 20, priority: "High", kind: "Revision", done: false }]); toast("Added to your plan"); }}>Add to {day === todayStr() ? "today" : fmtDate(day)}</Button></div></div></Card>

          <Tabs value={view} onChange={setView} tabs={[{ id: "day", label: "Daily timetable" }, { id: "week", label: "Weekly calendar" }, { id: "list", label: "All tasks" }]} />

          {view === "day" && (
            <Card><CardHeader title={fmtDate(day, { weekday: "long", day: "numeric", month: "long" })} subtitle={`${dayTasks.filter((t) => t.done).length}/${dayTasks.length} done · ${dayTasks.reduce((a, t) => a + t.duration, 0)} min planned`} action={<div className="flex gap-1"><Button size="icon" variant="ghost" aria-label="Previous day" onClick={() => setDay(addDays(day, -1))}><ChevronLeft className="h-4 w-4" /></Button><Button size="sm" variant="soft" onClick={() => setDay(todayStr())}>Today</Button><Button size="icon" variant="ghost" aria-label="Next day" onClick={() => setDay(addDays(day, 1))}><ChevronRight className="h-4 w-4" /></Button></div>} />
              <div className="p-5">{dayTasks.length === 0 ? <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="Nothing planned" body="Add a study task or revision slot for this day." action={<Button onClick={() => openForm("new")}>Add task</Button>} /> : <ul className="space-y-2">{dayTasks.map((t) => <Row key={t.id} t={t} />)}</ul>}</div></Card>
          )}

          {view === "week" && (
            <Card><div className="overflow-x-auto p-3"><div className="grid min-w-[760px] grid-cols-7 gap-2">
              {week.map((d) => { const ts = tasks.filter((t) => t.date === d); const isToday = d === todayStr(); return (
                <div key={d} className={cn("min-h-[220px] rounded-xl border p-2", isToday ? "border-crimson bg-crimson-50/40" : "border-line bg-white")}>
                  <button onClick={() => { setDay(d); setView("day"); }} className="mb-2 block w-full text-left"><p className="text-xs font-semibold uppercase text-slate-400">{fmtDate(d, { weekday: "short" })}</p><p className={cn("text-lg font-semibold", isToday ? "text-crimson" : "text-oxford")}>{new Date(d + "T00:00:00").getDate()}</p></button>
                  <div className="space-y-1">{ts.map((t) => <button key={t.id} onClick={() => openForm(t)} className={cn("block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] text-white", t.done && "opacity-50 line-through")} style={{ background: SUBJECT_COLORS[t.subject] ?? "#002147" }} title={t.title}>{t.title}</button>)}</div></div>); })}
            </div></div></Card>
          )}

          {view === "list" && (
            <div className="space-y-3"><Tabs value={filter} onChange={setFilter} tabs={[{ id: "all", label: `All (${tasks.length})` }, { id: "pending", label: `Pending (${pending})` }, { id: "done", label: `Completed (${doneN})` }]} />
              {listed.length === 0 ? <EmptyState title="No tasks here" body="Completed and pending tasks will show up in this list." /> : <ul className="space-y-2">{listed.map((t) => <Row key={t.id} t={t} />)}</ul>}</div>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-5"><p className="font-semibold text-oxford">Progress</p><div className="mt-3 flex justify-between text-sm"><span>{doneN} completed</span><span>{pending} pending</span></div><Progress value={tasks.length ? (doneN / tasks.length) * 100 : 0} tone="green" className="mt-2" /></Card>
          <Card><CardHeader title="Exam countdown" /><ul className="space-y-3 p-5">{EXAMS.map((e) => <li key={e.id} className="flex items-center justify-between text-sm"><span><span className="block font-medium">{e.name}</span><span className="text-xs text-slate-500">{fmtDate(e.date)}</span></span><span className="font-display text-xl text-crimson">{daysUntil(e.date)}d</span></li>)}</ul></Card>
          <Card className="p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Bell className="h-4 w-4 text-oxford" /><div><p className="text-sm font-semibold text-oxford">Study reminders</p><p className="text-xs text-slate-500">Daily at 5:00 PM (simulated)</p></div></div><Switch checked={reminders} onChange={(v) => { setReminders(v); toast(v ? "Reminders on" : "Reminders off", "info"); }} label="Study reminders" /></div></Card>
          <Card className="p-5"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-crimson" /><p className="font-semibold text-oxford">Weekly study target</p></div><p className="mt-2 text-sm text-slate-600">5 hours · 3h 40m done</p><Progress value={73} tone="blue" className="mt-2" /><Link href="/student/practice" className="mt-3 inline-block text-sm font-medium text-crimson hover:underline">Practise now →</Link></Card>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Add a task" : "Edit task"} footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={onSave}>{editing === "new" ? "Add task" : "Save changes"}</Button></>}>
        <form className="space-y-4" onSubmit={onSave}>
          <Field label="Task" error={form.formState.errors.title?.message}><Input placeholder="e.g. Practise Factorisation" {...form.register("title")} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subject"><Select {...form.register("subject")}>{ALL_SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Type"><Select {...form.register("kind")}>{["Study", "Homework", "Revision", "Test"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Date" error={form.formState.errors.date?.message}><Input type="date" {...form.register("date")} /></Field>
            <Field label="Duration (minutes)" error={form.formState.errors.duration?.message}><Input inputMode="numeric" {...form.register("duration")} /></Field>
            <Field label="Priority"><Select {...form.register("priority")}>{["High", "Medium", "Low"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
