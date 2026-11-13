"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Users, UserCheck, UserRound, Library, HelpCircle, BookOpenCheck, Activity, Plus, Search, Pencil, Trash2, Eye, Upload } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardHeader, Badge, Input, Select, Field, Modal, StatCard, Tabs, Progress, EmptyState } from "@/components/ui";
import { AHead, DataTable } from "./shared";
import { usePersisted } from "@/hooks/usePersisted";
import { useDemo } from "@/components/shared/DemoProvider";
import { ADMIN_STUDENTS } from "@/data/mock-students";
import { BOARDS, CLASSES, SESSIONS, ALL_SUBJECTS, CHAPTERS } from "@/data/mock-curriculum";
import { seedCurriculum, type CurEntry, SEED_CONTENT, type ContentItem, PLATFORM_ACTIVITY, SEED_PARENTS } from "@/data/mock-admin";
import { QUESTION_BANK } from "@/data/mock-questions";
import { uid } from "@/lib/utils";

/* ---------- Overview ---------- */
export function AdminOverview() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AHead title="Platform overview" subtitle="Key numbers across students, parents and content." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total students" value="12,480" />
        <StatCard icon={<UserCheck className="h-5 w-5" />} label="Active students (7 days)" value="8,914" tone="green" />
        <StatCard icon={<UserRound className="h-5 w-5" />} label="Parents" value="9,306" tone="yellow" />
        <StatCard icon={<Library className="h-5 w-5" />} label="Content items" value="3,262" tone="red" />
        <StatCard icon={<HelpCircle className="h-5 w-5" />} label="Questions" value={`${QUESTION_BANK.length + 18240}`} />
        <StatCard icon={<BookOpenCheck className="h-5 w-5" />} label="Lessons completed" value="148,902" tone="green" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Sessions today" value="1,620" tone="yellow" />
        <StatCard icon={<Users className="h-5 w-5" />} label="New this week" value="+412" tone="red" />
      </div>
      <Card><CardHeader title="Platform activity" subtitle="Learning sessions per day (illustrative)" />
        <div className="h-64 p-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={PLATFORM_ACTIVITY} margin={{ left: -10 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip cursor={{ fill: "#EEF3FA" }} contentStyle={{ borderRadius: 12 }} formatter={(v) => [v, "Sessions"]} /><Bar dataKey="sessions" fill="#002147" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <p className="text-xs text-slate-500">All figures are mock values for demonstration.</p>
    </div>
  );
}

/* ---------- Students ---------- */
export function AdminStudents() {
  const [q, setQ] = useState(""); const [board, setBoard] = useState("All"); const [cls, setCls] = useState("All"); const [status, setStatus] = useState("All");
  const [sel, setSel] = useState<(typeof ADMIN_STUDENTS)[number] | null>(null);
  const rows = ADMIN_STUDENTS.filter((s) => (board === "All" || s.board === board) && (cls === "All" || s.classLevel === cls) && (status === "All" || s.status === status) && (s.name + s.id).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-7xl">
      <AHead title="Students" subtitle={`${rows.length} of ${ADMIN_STUDENTS.length} sample students`} />
      <div className="mb-4 flex flex-wrap gap-3"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search by name or ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" /></div>
        <div className="w-40"><Select value={board} onChange={(e) => setBoard(e.target.value)} aria-label="Board"><option>All</option><option>CBSE</option><option>ICSE</option><option>State Board</option></Select></div>
        <div className="w-36"><Select value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class"><option>All</option>{["5", "6", "7", "8", "9", "10"].map((c) => <option key={c}>{c}</option>)}</Select></div>
        <div className="w-36"><Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option>All</option><option>Active</option><option>Inactive</option></Select></div></div>
      <DataTable rows={rows} cols={[
        { head: "ID", cell: (r) => <span className="font-mono text-xs">{r.id}</span> }, { head: "Name", cell: (r) => <b className="text-oxford">{r.name}</b> },
        { head: "Class", cell: (r) => r.classLevel }, { head: "Board", cell: (r) => r.board }, { head: "Language", cell: (r) => r.language },
        { head: "Avg score", cell: (r) => `${r.avg}%` }, { head: "Status", cell: (r) => <Badge tone={r.status === "Active" ? "green" : "neutral"}>{r.status}</Badge> },
        { head: "", cell: (r) => <Button size="sm" variant="soft" onClick={() => setSel(r)}><Eye className="h-3.5 w-3.5" />View</Button> },
      ]} empty="No students match these filters." />
      <Modal open={!!sel} onClose={() => setSel(null)} title="Student profile" footer={<Button onClick={() => setSel(null)}>Close</Button>}>
        {sel && <div className="space-y-4"><div><p className="font-display text-xl text-oxford">{sel.name}</p><p className="text-sm text-slate-500">{sel.id} · Class {sel.classLevel} · {sel.board}</p></div>
          <div className="grid grid-cols-3 gap-2 text-center">{[[sel.lessons, "Lessons"], [sel.avg + "%", "Avg score"], [sel.lastActive, "Last active"]].map(([a, b]) => <div key={b as string} className="rounded-xl bg-mist p-3"><p className="font-semibold text-oxford">{a}</p><p className="text-xs text-slate-500">{b}</p></div>)}</div>
          <div><p className="mb-1 text-sm font-medium">Learning summary</p><Progress value={sel.avg} /><p className="mt-2 text-xs text-slate-500">Preferred language: {sel.language}. Status: {sel.status}. (Sample data.)</p></div></div>}
      </Modal>
    </div>
  );
}

/* ---------- Parents ---------- */
export function AdminParents() {
  const [q, setQ] = useState("");
  const rows = SEED_PARENTS.filter((p) => (p.name + p.email).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-6xl"><AHead title="Parents" subtitle="Linked parent accounts (sample)." />
      <div className="relative mb-4 max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search parents" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search parents" /></div>
      <DataTable rows={rows} cols={[{ head: "ID", cell: (r) => <span className="font-mono text-xs">{r.id}</span> }, { head: "Name", cell: (r) => <b className="text-oxford">{r.name}</b> }, { head: "Email", cell: (r) => r.email }, { head: "Children", cell: (r) => r.children }, { head: "Joined", cell: (r) => r.joined }, { head: "Status", cell: (r) => <Badge tone={r.status === "Active" ? "green" : "neutral"}>{r.status}</Badge> }]} />
    </div>
  );
}

/* ---------- Curriculum ---------- */
const curSchema = z.object({ board: z.string().min(1), session: z.string().min(1), classLevel: z.string().min(1), subject: z.string().min(1), chapter: z.string().trim().min(2, "Chapter is required"), topic: z.string().trim().min(2, "Topic is required"), subtopic: z.string().trim().optional(), objectives: z.string().trim().min(5, "Add a learning objective (5+ characters)") });
type CurForm = z.infer<typeof curSchema>;
const LEVELS = ["boards", "classes", "subjects", "chapters", "topics"] as const;

export function AdminCurriculum({ level }: { level?: string }) {
  const { toast } = useDemo();
  const [rows, setRows] = usePersisted<CurEntry[]>("admin-curriculum", seedCurriculum());
  const [q, setQ] = useState(""); const [editing, setEditing] = useState<CurEntry | "new" | null>(null);
  const form = useForm<CurForm>({ resolver: zodResolver(curSchema), defaultValues: { board: "CBSE", session: "2026–27", classLevel: "8", subject: "Mathematics", chapter: "", topic: "", subtopic: "", objectives: "" } });
  const open = (e: CurEntry | "new") => { setEditing(e); form.reset(e === "new" ? { board: "CBSE", session: "2026–27", classLevel: "8", subject: "Mathematics", chapter: "", topic: "", subtopic: "", objectives: "" } : { ...e, subtopic: e.subtopic === "—" ? "" : e.subtopic }); };
  const save = form.handleSubmit((v) => {
    const entry: CurEntry = { id: editing && editing !== "new" ? editing.id : uid(), ...v, subtopic: v.subtopic || "—" };
    setRows((l) => editing === "new" ? [entry, ...l] : l.map((x) => x.id === entry.id ? entry : x)); toast(editing === "new" ? "Curriculum entry created (local)" : "Entry updated"); setEditing(null);
  });
  const filtered = rows.filter((r) => Object.values(r).join(" ").toLowerCase().includes(q.toLowerCase()));

  // Level summary (boards/classes/subjects/chapters/topics)
  const grouped = useMemo(() => {
    if (!level) return [];
    const key = ({ boards: "board", classes: "classLevel", subjects: "subject", chapters: "chapter", topics: "topic" } as const)[level as (typeof LEVELS)[number]];
    const m = new Map<string, number>(); rows.forEach((r) => m.set(r[key], (m.get(r[key]) ?? 0) + 1));
    return Array.from(m, ([name, count]) => ({ id: name, name, count }));
  }, [rows, level]);

  return (
    <div className="mx-auto max-w-7xl">
      <AHead title={level ? `Curriculum · ${level[0].toUpperCase() + level.slice(1)}` : "Curriculum Management"} subtitle="Board → Session → Class → Subject → Chapter → Topic → Subtopic, with learning objectives." actions={<Button variant="accent" onClick={() => open("new")}><Plus className="h-4 w-4" />Add entry</Button>} />
      {level && <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">{LEVELS.map((l) => <Link key={l} href={`/admin/curriculum/${l}`} className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${l === level ? "bg-white text-oxford shadow-sm" : "text-slate-600 hover:text-oxford"}`}>{l[0].toUpperCase() + l.slice(1)}</Link>)}</div>}
      {level && <div className="mb-6"><DataTable rows={grouped} cols={[{ head: level.slice(0, -1).replace(/^./, (c) => c.toUpperCase()), cell: (r) => <b className="text-oxford">{level === "classes" ? `Class ${r.name}` : r.name}</b> }, { head: "Curriculum entries", cell: (r) => r.count }]} /></div>}
      <div className="relative mb-4 max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search curriculum" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search curriculum" /></div>
      <DataTable rows={filtered} cols={[
        { head: "Board", cell: (r) => r.board }, { head: "Session", cell: (r) => r.session }, { head: "Class", cell: (r) => r.classLevel }, { head: "Subject", cell: (r) => r.subject },
        { head: "Chapter", cell: (r) => <b className="text-oxford">{r.chapter}</b> }, { head: "Topic", cell: (r) => r.topic }, { head: "Objectives", cell: (r) => <span className="line-clamp-1 max-w-[220px] text-slate-500">{r.objectives}</span> },
        { head: "", cell: (r) => <div className="flex gap-1"><Button size="icon" variant="ghost" aria-label="Edit" onClick={() => open(r)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { setRows((l) => l.filter((x) => x.id !== r.id)); toast("Entry deleted", "info"); }}><Trash2 className="h-4 w-4" /></Button></div> },
      ]} empty="No curriculum entries. Add one to get started." />
      <Modal wide open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New curriculum entry" : "Edit curriculum entry"} footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Board"><Select {...form.register("board")}>{BOARDS.map((b) => <option key={b.id}>{b.id}</option>)}</Select></Field>
          <Field label="Academic session"><Select {...form.register("session")}>{SESSIONS.map((b) => <option key={b}>{b}</option>)}</Select></Field>
          <Field label="Class"><Select {...form.register("classLevel")}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Subject"><Select {...form.register("subject")}>{ALL_SUBJECTS.map((b) => <option key={b}>{b}</option>)}</Select></Field>
          <Field label="Chapter" error={form.formState.errors.chapter?.message}><Input {...form.register("chapter")} /></Field>
          <Field label="Topic" error={form.formState.errors.topic?.message}><Input {...form.register("topic")} /></Field>
          <Field label="Subtopic (optional)" className="sm:col-span-2"><Input {...form.register("subtopic")} /></Field>
          <Field label="Learning objectives" error={form.formState.errors.objectives?.message} className="sm:col-span-2"><Input {...form.register("objectives")} /></Field>
        </form>
      </Modal>
    </div>
  );
}

/* ---------- Content library ---------- */
export function AdminContent() {
  const { toast } = useDemo();
  const [rows, setRows] = usePersisted<ContentItem[]>("admin-content", SEED_CONTENT);
  const [open, setOpen] = useState(false); const [d, setD] = useState({ title: "", kind: "Chapter material", subject: "Mathematics", chapter: "", language: "English" }); const [err, setErr] = useState("");
  const [file, setFile] = useState<string>("");
  const add = () => { if (!d.title.trim()) return setErr("Title is required."); setRows((l) => [{ id: uid(), ...d, chapter: d.chapter || "General", status: "Draft", updated: new Date().toISOString().slice(0, 10) }, ...l]); setOpen(false); setD({ ...d, title: "" }); setFile(""); setErr(""); toast("Content added as Draft"); };
  const tone = { Approved: "green", "In review": "amber", Draft: "neutral" } as const;
  return (
    <div className="mx-auto max-w-7xl"><AHead title="Digital Content Library" subtitle="Chapter material, notes, examples, videos and questions." actions={<Button variant="accent" onClick={() => setOpen(true)}><Upload className="h-4 w-4" />Add content</Button>} />
      <DataTable rows={rows} cols={[
        { head: "Title", cell: (r) => <b className="text-oxford">{r.title}</b> }, { head: "Type", cell: (r) => r.kind }, { head: "Subject", cell: (r) => r.subject }, { head: "Chapter", cell: (r) => r.chapter }, { head: "Language", cell: (r) => r.language },
        { head: "Approval", cell: (r) => <Select className="h-8 w-32 text-xs" value={r.status} onChange={(e) => { setRows((l) => l.map((x) => x.id === r.id ? { ...x, status: e.target.value as any } : x)); toast(`Status set to ${e.target.value}`, "info"); }} aria-label="Approval status"><option>Approved</option><option>In review</option><option>Draft</option></Select> },
        { head: "", cell: (r) => <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { setRows((l) => l.filter((x) => x.id !== r.id)); toast("Content removed", "info"); }}><Trash2 className="h-4 w-4" /></Button> },
      ]} />
      <Modal open={open} onClose={() => setOpen(false)} title="Add content" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={add}>Add</Button></>}>
        <div className="space-y-4"><Field label="Title"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Type"><Select value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value })}>{["Chapter material", "Notes", "Examples", "Video", "Questions"].map((k) => <option key={k}>{k}</option>)}</Select></Field>
            <Field label="Language"><Select value={d.language} onChange={(e) => setD({ ...d, language: e.target.value })}><option>English</option><option>Hindi</option></Select></Field>
            <Field label="Subject"><Select value={d.subject} onChange={(e) => setD({ ...d, subject: e.target.value })}>{ALL_SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Chapter"><Input value={d.chapter} onChange={(e) => setD({ ...d, chapter: e.target.value })} list="chs" /></Field></div>
          <datalist id="chs">{Object.values(CHAPTERS).flat().map((c) => <option key={c} value={c} />)}</datalist>
          <Field label="Attach file (local preview only)"><Input type="file" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} />{file && <p className="mt-1 text-xs text-slate-500">Selected: {file} (not uploaded anywhere)</p>}</Field>
          {err && <p role="alert" className="text-sm text-crimson">{err}</p>}</div>
      </Modal>
    </div>
  );
}
