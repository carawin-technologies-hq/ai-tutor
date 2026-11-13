"use client";
import React, { useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { Clock, BookOpenCheck, HelpCircle, Award, TrendingUp, TrendingDown, Download, Sparkles, CheckCircle2, ThumbsUp, Bell, ShieldCheck, Printer, UserPlus, Link2, Lock, Mail } from "lucide-react";
import { Card, CardHeader, Badge, Button, PageHeader, Progress, MasteryBadge, StatCard, Switch, Tabs, Field, Input, Modal, EmptyState, DemoTag, Dropdown, MenuItem } from "@/components/ui";
import { ChartCard } from "@/features/progress/ChartCard";
import { usePersisted } from "@/hooks/usePersisted";
import { useDemo } from "@/components/shared/DemoProvider";
import { CHILDREN, PARENT } from "@/data/mock-students";
import { CHILD_DETAIL, PARENT_NOTICES } from "@/data/mock-parents";
import { initialTasks } from "@/data/mock-planner";
import { fmtDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const tip = { contentStyle: { borderRadius: 12, border: "1px solid #E3E8EF" } };

function useChild() {
  const [id, setId] = usePersisted<string>("parent-child", "aarav");
  const child = CHILDREN.find((c) => c.id === id) ?? CHILDREN[0];
  return { child, detail: CHILD_DETAIL[child.id], setId };
}

function ChildSwitch({ child, setId }: { child: (typeof CHILDREN)[number]; setId: (s: string) => void }) {
  const { toast } = useDemo();
  return (
    <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Select child">
      {CHILDREN.map((c) => (
        <button key={c.id} role="tab" aria-selected={c.id === child.id} onClick={() => { setId(c.id); toast(`Showing ${c.name.split(" ")[0]}'s learning`, "info"); }} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium", c.id === child.id ? "bg-white text-oxford shadow-sm" : "text-slate-600")}><span>{c.avatar}</span>{c.name.split(" ")[0]}</button>))}
    </div>
  );
}
function Head({ title, subtitle, eyebrow = "Parent Portal", children }: { title: string; subtitle?: string; eyebrow?: string; children?: React.ReactNode }) {
  return <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} actions={<div className="flex items-center gap-2">{children}<DemoTag /></div>} />;
}

const weeklyData = (w: number[]) => DAYS.map((d, i) => ({ day: d, minutes: w[i] }));

/* ---------- Overview ---------- */
export function ParentOverview() {
  const { child, detail, setId } = useChild();
  const [notices] = useState(PARENT_NOTICES.slice(0, 3));
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Head title={`Welcome, ${PARENT.name.split(" ")[0]}`} subtitle="A calm overview of how your children are learning this week."><ChildSwitch child={child} setId={setId} /></Head>
      <Card className="flex flex-wrap items-center gap-5 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-oxford-50 text-4xl">{child.avatar}</div>
        <div className="min-w-0 flex-1"><p className="font-display text-xl text-oxford dark:text-white">{child.name}</p><p className="text-sm text-slate-500">Class {child.classLevel} · {child.board} · {child.school}</p></div>
        <Link href="/parent/reports"><Button variant="outline"><Download className="h-4 w-4" />Open report</Button></Link>
      </Card>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Clock className="h-5 w-5" />} label="Learning hours (month)" value={`${child.hours} h`} />
        <StatCard icon={<BookOpenCheck className="h-5 w-5" />} label="Lessons completed" value={child.lessons} tone="green" />
        <StatCard icon={<HelpCircle className="h-5 w-5" />} label="Questions solved" value={child.questions} tone="yellow" />
        <StatCard icon={<Award className="h-5 w-5" />} label="Assessment average" value={`${child.avg}%`} tone="red" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="border-l-4 border-l-oxford p-5 lg:col-span-2"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-crimson"><Sparkles className="h-4 w-4" />AI-generated insight</p><p className="mt-2 text-ink dark:text-slate-100">{detail.insight}</p></Card>
        <Card className="p-5"><p className="font-semibold text-oxford">Completion</p><div className="mt-3 space-y-3 text-sm"><div><div className="mb-1 flex justify-between"><span>Homework</span><span>{detail.homework.done}/{detail.homework.total}</span></div><Progress value={(detail.homework.done / detail.homework.total) * 100} tone="green" /></div><div><div className="mb-1 flex justify-between"><span>Study plan</span><span>{detail.plan.done}/{detail.plan.total}</span></div><Progress value={(detail.plan.done / detail.plan.total) * 100} tone="blue" /></div></div></Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Weekly learning activity" subtitle="Minutes per day" table={{ head: ["Day", "Minutes"], rows: weeklyData(child.weekly).map((d) => [d.day, d.minutes]) }} chart={<ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData(child.weekly)} margin={{ left: -20 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip {...tip} cursor={{ fill: "#EEF3FA" }} formatter={(v) => [`${v} min`, "Learning"]} /><Bar dataKey="minutes" fill="#002147" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>} />
        <Card><CardHeader title="Subject-wise performance" /><ul className="space-y-4 p-5">{child.subjects.map((s) => (<li key={s.name}><div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium">{s.name}</span><span className="flex items-center gap-2"><span className={cn("flex items-center text-xs", s.trend >= 0 ? "text-success-700" : "text-crimson")}>{s.trend >= 0 ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />}{s.trend > 0 ? "+" : ""}{s.trend}</span><b>{s.score}%</b></span></div><Progress value={s.score} /></li>))}</ul></Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader title="Strengths" /><ul className="space-y-3 p-5">{detail.strengths.map((t) => <li key={t.topic} className="flex items-center justify-between text-sm"><span>{t.topic}</span><span className="flex items-center gap-2"><b>{t.pct}%</b><MasteryBadge pct={t.pct} /></span></li>)}</ul></Card>
        <Card><CardHeader title="Needs more support" /><ul className="space-y-3 p-5">{detail.weaknesses.map((t) => <li key={t.topic} className="flex items-center justify-between text-sm"><span>{t.topic}</span><span className="flex items-center gap-2"><b>{t.pct}%</b><MasteryBadge pct={t.pct} /></span></li>)}</ul></Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader title="Recommendations for parents" /><ul className="space-y-3 p-5">{detail.recs.map((r) => <li key={r} className="flex gap-2 text-sm text-slate-600"><ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-success" />{r}</li>)}</ul></Card>
        <Card><CardHeader title="Notification centre" action={<Link href="/parent/notifications" className="text-sm font-medium text-crimson">View all</Link>} /><ul className="divide-y divide-line p-2">{notices.map((n) => <li key={n.id} className="p-3 text-sm"><p className="font-medium text-oxford">{n.title}</p><p className="text-xs text-slate-500">{n.body}</p></li>)}</ul></Card>
      </div>
    </div>
  );
}

/* ---------- My Children ---------- */
export function ParentChildren() {
  const { toast } = useDemo(); const { child, setId } = useChild(); const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto max-w-5xl">
      <Head title="My Children" subtitle="Linked student profiles."><Button onClick={() => setOpen(true)}><UserPlus className="h-4 w-4" />Link a child</Button></Head>
      <div className="grid gap-5 md:grid-cols-2">
        {CHILDREN.map((c) => (
          <Card key={c.id} className={cn("p-5", c.id === child.id && "ring-2 ring-oxford/20")}>
            <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-oxford-50 text-4xl">{c.avatar}</div><div><p className="font-display text-xl text-oxford dark:text-white">{c.name}</p><p className="text-sm text-slate-500">Class {c.classLevel} · {c.board}</p><p className="text-xs text-slate-400">{c.school}</p></div></div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[[c.hours + "h", "Hours"], [c.lessons, "Lessons"], [c.avg + "%", "Average"]].map(([a, b]) => <div key={b as string} className="rounded-xl bg-mist p-2.5"><p className="font-semibold text-oxford">{a}</p><p className="text-xs text-slate-500">{b}</p></div>)}</div>
            <div className="mt-4 flex gap-2"><Button className="flex-1 justify-center" variant={c.id === child.id ? "primary" : "outline"} onClick={() => { setId(c.id); toast(`Now viewing ${c.name.split(" ")[0]}`, "info"); }}>{c.id === child.id ? "Currently viewing" : "View"}</Button><Link href="/parent/reports"><Button variant="soft">Report</Button></Link></div>
          </Card>))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Link a child" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { setOpen(false); toast("Link request sent (simulated)"); }}>Send link request</Button></>}>
        <p className="mb-3 text-sm text-slate-500">Enter the student's linking code. In the full product the child approves the request.</p>
        <Field label="Student linking code"><Input placeholder="e.g. CARA-8H4K" /></Field>
      </Modal>
    </div>
  );
}

/* ---------- Learning Activity ---------- */
export function ParentActivity() {
  const { child, detail, setId } = useChild();
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Head title="Learning Activity" subtitle="What your child has studied recently."><ChildSwitch child={child} setId={setId} /></Head>
      <ChartCard title="This week" subtitle="Minutes of learning per day" table={{ head: ["Day", "Minutes"], rows: weeklyData(child.weekly).map((d) => [d.day, d.minutes]) }} chart={<ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData(child.weekly)} margin={{ left: -20 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip {...tip} cursor={{ fill: "#EEF3FA" }} formatter={(v) => [`${v} min`, "Learning"]} /><Bar dataKey="minutes" fill="#002147" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>} />
      <Card><CardHeader title="Learning timeline" /><ol className="relative space-y-5 p-5 pl-8 before:absolute before:left-[1.65rem] before:top-6 before:h-[calc(100%-3rem)] before:w-px before:bg-line">{detail.timeline.map((t, i) => <li key={i} className="relative"><span className="absolute -left-[1.45rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-crimson ring-1 ring-crimson" /><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.date}</p><p className="text-sm text-ink dark:text-slate-100">{t.text}</p></li>)}</ol></Card>
    </div>
  );
}

/* ---------- Academic performance ---------- */
export function ParentPerformance() {
  const { child, detail, setId } = useChild();
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Head title="Academic Performance" subtitle="Assessment averages and trends."><ChildSwitch child={child} setId={setId} /></Head>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Average score by month" subtitle="%" table={{ head: ["Month", "Average %"], rows: detail.monthly.map((m) => [m.month, m.avg]) }} chart={<ResponsiveContainer width="100%" height="100%"><LineChart data={detail.monthly} margin={{ left: -20, right: 10 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis domain={[50, 100]} tickLine={false} axisLine={false} fontSize={12} /><Tooltip {...tip} formatter={(v) => [`${v}%`, "Average"]} /><Line dataKey="avg" stroke="#002147" strokeWidth={2.5} dot={{ r: 4, fill: "#002147", stroke: "#fff", strokeWidth: 2 }} /></LineChart></ResponsiveContainer>} />
        <ChartCard title="Learning hours by month" subtitle="Hours" table={{ head: ["Month", "Hours"], rows: detail.monthly.map((m) => [m.month, m.hours]) }} chart={<ResponsiveContainer width="100%" height="100%"><BarChart data={detail.monthly} margin={{ left: -20 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip {...tip} cursor={{ fill: "#EEF3FA" }} formatter={(v) => [`${v} h`, "Hours"]} /><Bar dataKey="hours" fill="#DC143C" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>} />
      </div>
      <Card><CardHeader title="Subject scores" /><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-oxford-50 text-left text-oxford"><tr><th className="px-5 py-2.5">Subject</th><th>Score</th><th>Change</th><th>Status</th></tr></thead><tbody>{child.subjects.map((s) => <tr key={s.name} className="border-t border-line"><td className="px-5 py-3 font-medium">{s.name}</td><td>{s.score}%</td><td className={s.trend >= 0 ? "text-success-700" : "text-crimson"}>{s.trend > 0 ? "+" : ""}{s.trend}</td><td><MasteryBadge pct={s.score} /></td></tr>)}</tbody></table></div></Card>
    </div>
  );
}

/* ---------- Subject analysis ---------- */
export function ParentSubjects() {
  const { child, detail, setId } = useChild(); const [sub, setSub] = useState(child.subjects[0].name);
  const s = child.subjects.find((x) => x.name === sub) ?? child.subjects[0];
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Head title="Subject Analysis" subtitle="Go deeper into one subject at a time."><ChildSwitch child={child} setId={setId} /></Head>
      <Tabs value={s.name} onChange={setSub} tabs={child.subjects.map((x) => ({ id: x.name, label: x.name }))} />
      <div className="grid gap-5 md:grid-cols-3"><StatCard icon={<Award className="h-5 w-5" />} label="Current score" value={`${s.score}%`} /><StatCard icon={s.trend >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />} label="Change this month" value={`${s.trend > 0 ? "+" : ""}${s.trend}`} tone={s.trend >= 0 ? "green" : "red"} /><StatCard icon={<BookOpenCheck className="h-5 w-5" />} label="Status" value={<MasteryBadge pct={s.score} />} tone="yellow" /></div>
      <div className="grid gap-5 md:grid-cols-2"><Card><CardHeader title="Strengths" /><ul className="space-y-2 p-5 text-sm">{detail.strengths.map((t) => <li key={t.topic} className="flex justify-between"><span>{t.topic}</span><b>{t.pct}%</b></li>)}</ul></Card><Card><CardHeader title="Needs support" /><ul className="space-y-2 p-5 text-sm">{detail.weaknesses.map((t) => <li key={t.topic} className="flex justify-between"><span>{t.topic}</span><b>{t.pct}%</b></li>)}</ul></Card></div>
    </div>
  );
}

/* ---------- Study plan ---------- */
export function ParentPlan() {
  const { child, detail, setId } = useChild();
  const tasks = initialTasks().slice(0, 8);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Head title="Study Plan" subtitle="Read-only view of the plan your child follows."><ChildSwitch child={child} setId={setId} /></Head>
      <div className="grid gap-4 sm:grid-cols-2"><Card className="p-5"><p className="text-sm text-slate-500">Homework</p><p className="text-2xl font-semibold text-oxford">{detail.homework.done}/{detail.homework.total}</p><Progress value={(detail.homework.done / detail.homework.total) * 100} tone="green" className="mt-2" /></Card><Card className="p-5"><p className="text-sm text-slate-500">Study plan tasks</p><p className="text-2xl font-semibold text-oxford">{detail.plan.done}/{detail.plan.total}</p><Progress value={(detail.plan.done / detail.plan.total) * 100} tone="blue" className="mt-2" /></Card></div>
      <Card><CardHeader title="Upcoming tasks" subtitle="Sample plan" /><ul className="divide-y divide-line p-2">{tasks.map((t) => <li key={t.id} className="flex items-center gap-3 p-3 text-sm">{t.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="h-4 w-4 rounded-full border-2 border-slate-300" />}<span className="flex-1">{t.title}<span className="block text-xs text-slate-500">{t.subject} · {fmtDate(t.date)} · {t.duration} min</span></span><Badge tone={t.priority === "High" ? "red" : "neutral"}>{t.priority}</Badge></li>)}</ul></Card>
    </div>
  );
}

/* ---------- Reports ---------- */
export function ParentReports() {
  const { toast } = useDemo(); const { child, detail, setId } = useChild();
  const [period, setPeriod] = useState("month");
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Head title="Reports" subtitle="Detailed learning report with charts and timeline."><ChildSwitch child={child} setId={setId} /></Head>
      <div className="flex flex-wrap items-center justify-between gap-3"><Tabs value={period} onChange={setPeriod} tabs={[{ id: "week", label: "Weekly" }, { id: "month", label: "Monthly" }]} /><div className="flex gap-2"><Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button><Button onClick={() => toast("PDF export is simulated in this prototype", "info")}><Download className="h-4 w-4" />Download PDF</Button></div></div>
      <Card className="overflow-hidden">
        <div className="bg-oxford p-6 text-white"><p className="text-xs font-semibold uppercase tracking-widest text-sun">{period === "week" ? "Weekly" : "Monthly"} learning report · November 2026</p><h2 className="mt-1 font-display text-2xl">{child.name}</h2><p className="text-sm text-white/70">Class {child.classLevel} · {child.board} · {child.school}</p></div>
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">{[[child.hours + " h", "Learning time"], [child.lessons, "Lessons"], [child.questions, "Questions"], [child.avg + "%", "Average"]].map(([a, b]) => <div key={b as string} className="bg-white p-4 text-center"><p className="text-xl font-semibold text-oxford">{a}</p><p className="text-xs text-slate-500">{b}</p></div>)}</div>
        <div className="space-y-6 p-6">
          <div><p className="font-semibold text-oxford">Summary</p><p className="mt-1 text-sm text-slate-600">{detail.insight}</p></div>
          <div className="h-52"><p className="mb-2 font-semibold text-oxford">Subject scores</p><ResponsiveContainer width="100%" height="90%"><BarChart data={child.subjects} margin={{ left: -20 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} /><Tooltip {...tip} formatter={(v) => [`${v}%`, "Score"]} /><Bar dataKey="score" radius={[6, 6, 0, 0]}>{child.subjects.map((s, i) => <Cell key={i} fill={s.score >= 80 ? "#16A34A" : s.score >= 55 ? "#D97706" : "#DC143C"} />)}</Bar></BarChart></ResponsiveContainer></div>
          <div><p className="mb-2 font-semibold text-oxford">Learning timeline</p><ul className="space-y-2 text-sm">{detail.timeline.map((t, i) => <li key={i} className="flex gap-3"><span className="w-24 shrink-0 text-slate-400">{t.date}</span><span className="text-slate-700">{t.text}</span></li>)}</ul></div>
          <div><p className="mb-2 font-semibold text-oxford">Recommendations</p><ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">{detail.recs.map((r) => <li key={r}>{r}</li>)}</ul></div>
        </div>
        <p className="border-t border-line px-6 py-3 text-xs text-slate-400">Prototype report built from demonstration data.</p>
      </Card>
    </div>
  );
}

/* ---------- Notifications ---------- */
export function ParentNotifications() {
  const [read, setRead] = usePersisted<string[]>("parent-read", []);
  return (
    <div className="mx-auto max-w-3xl">
      <Head title="Notifications" subtitle="Updates about your children's learning."><Button variant="outline" onClick={() => setRead(PARENT_NOTICES.map((n) => n.id))}>Mark all read</Button></Head>
      <ul className="space-y-3">{PARENT_NOTICES.map((n) => <li key={n.id}><Card className={cn("flex gap-3 p-4", !read.includes(n.id) && "border-l-4 border-l-crimson")}><Bell className={cn("mt-0.5 h-5 w-5", n.kind === "warning" ? "text-warn" : n.kind === "success" ? "text-success" : "text-oxford")} /><div className="flex-1"><p className="font-medium text-oxford">{n.title}</p><p className="text-sm text-slate-500">{n.body}</p><p className="mt-1 text-xs text-slate-400">{n.time}</p></div>{!read.includes(n.id) && <Button size="sm" variant="ghost" onClick={() => setRead((r) => [...r, n.id])}>Mark read</Button>}</Card></li>)}</ul>
    </div>
  );
}

/* ---------- Settings ---------- */
export function ParentSettings() {
  const { toast } = useDemo();
  const [prefs, setPrefs] = usePersisted<Record<string, boolean>>("parent-prefs", { weekly: true, monthly: true, alerts: true, email: true, sms: false, consent: true, share: false });
  const set = (k: string) => (v: boolean) => { setPrefs((p) => ({ ...p, [k]: v })); toast("Preference saved", "info"); };
  const Row = ({ k, l, d }: { k: string; l: string; d: string }) => <div className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-medium text-oxford">{l}</p><p className="text-xs text-slate-500">{d}</p></div><Switch checked={!!prefs[k]} onChange={set(k)} label={l} /></div>;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Head title="Settings" />
      <Card><CardHeader title="Profile" /><div className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Name"><Input defaultValue={PARENT.name} /></Field><Field label="Email"><Input defaultValue={PARENT.email} /></Field><Field label="Phone"><Input defaultValue={PARENT.phone} /></Field><div className="flex items-end"><Button onClick={() => toast("Profile saved (demo)")}>Save profile</Button></div></div></Card>
      <Card><CardHeader title="Child links" /><ul className="divide-y divide-line px-5 pb-3">{CHILDREN.map((c) => <li key={c.id} className="flex items-center justify-between py-3 text-sm"><span className="flex items-center gap-2"><Link2 className="h-4 w-4 text-oxford" />{c.name}</span><Badge tone="green">Linked</Badge></li>)}</ul></Card>
      <Card><CardHeader title="Notification preferences" /><div className="divide-y divide-line px-5 pb-2"><Row k="weekly" l="Weekly report" d="Every Sunday evening" /><Row k="monthly" l="Monthly report" d="First day of the month" /><Row k="alerts" l="Revision alerts" d="When a topic falls below 55%" /><Row k="email" l="Email notifications" d="Sent to your email address" /><Row k="sms" l="SMS notifications" d="Simulated in this prototype" /></div></Card>
      <Card><CardHeader title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Privacy and consent</span>} /><div className="divide-y divide-line px-5 pb-2"><Row k="consent" l="Allow learning analytics" d="Used to create reports for you" /><Row k="share" l="Share anonymised data for product improvement" d="Off by default" /></div></Card>
      <Card><CardHeader title={<span className="flex items-center gap-2"><Lock className="h-4 w-4" />Security</span>} /><div className="space-y-3 p-5"><Button variant="outline" onClick={() => toast("Password change is not available in the prototype", "warn")}>Change password <Badge tone="yellow">Coming soon</Badge></Button><Button variant="outline" onClick={() => toast("Two-factor sign-in is not available in the prototype", "warn")}>Two-factor authentication <Badge tone="yellow">Coming soon</Badge></Button></div></Card>
    </div>
  );
}
