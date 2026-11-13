"use client";
import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Download, Sparkles, Save } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Button, Card, CardHeader, Badge, Input, Select, Field, Modal, Switch, Textarea, Progress } from "@/components/ui";
import { AHead, DataTable } from "./shared";
import { usePersisted } from "@/hooks/usePersisted";
import { useDemo } from "@/components/shared/DemoProvider";
import { QUESTION_BANK, TYPE_LABEL } from "@/data/mock-questions";
import { LANGUAGES, TEACHING_STYLES, ALL_SUBJECTS, SESSIONS } from "@/data/mock-curriculum";
import { SEED_ASSESSMENTS, SEED_ADMIN_VIDEOS } from "@/data/mock-admin";
import { uid, cn } from "@/lib/utils";
import type { Question, QuestionType } from "@/types";

/* ---------- Question bank ---------- */
const blank = (): Question => ({ id: "", board: "CBSE", classLevel: "8", subject: "Mathematics", chapter: "", topic: "", difficulty: "Medium", type: "mcq", text: "", options: ["", "", "", ""], answer: "0", explanation: "", marks: 1, status: "Draft" });

export function AdminQuestions() {
  const { toast } = useDemo();
  const [rows, setRows] = usePersisted<Question[]>("admin-questions", QUESTION_BANK);
  const [q, setQ] = useState(""); const [type, setType] = useState("All"); const [diff, setDiff] = useState("All");
  const [edit, setEdit] = useState<Question | null>(null); const [isNew, setIsNew] = useState(false); const [errs, setErrs] = useState<Record<string, string>>({});
  const list = rows.filter((r) => (type === "All" || r.type === type) && (diff === "All" || r.difficulty === diff) && (r.text + r.chapter).toLowerCase().includes(q.toLowerCase()));
  const hasOpts = edit && ["mcq", "multi", "case", "assertion", "competency"].includes(edit.type);

  const save = () => {
    if (!edit) return; const e: Record<string, string> = {};
    if (edit.text.trim().length < 8) e.text = "Question text is too short.";
    if (!edit.chapter.trim()) e.chapter = "Map to a chapter.";
    if (!edit.topic.trim()) e.topic = "Map to a topic.";
    if (hasOpts && edit.options!.some((o) => !o.trim())) e.options = "Fill in all four options.";
    if (!hasOpts && !String(edit.answer).trim()) e.answer = "Provide the correct answer.";
    if (!edit.explanation.trim()) e.explanation = "Add an explanation for students.";
    setErrs(e); if (Object.keys(e).length) return;
    const final = { ...edit, id: isNew ? "Q" + uid().toUpperCase().slice(0, 4) : edit.id };
    setRows((l) => isNew ? [final, ...l] : l.map((x) => x.id === final.id ? final : x)); toast(isNew ? "Question created" : "Question updated"); setEdit(null);
  };
  const setType_ = (t: QuestionType) => setEdit((x) => x && ({ ...x, type: t, options: ["mcq", "multi", "case", "assertion", "competency"].includes(t) ? (x.options?.length ? x.options : ["", "", "", ""]) : undefined, answer: t === "multi" ? [] : t === "tf" ? "True" : ["mcq", "case", "assertion", "competency"].includes(t) ? "0" : "" }));

  return (
    <div className="mx-auto max-w-7xl"><AHead title="Question Bank" subtitle={`${rows.length} questions in the prototype bank`} actions={<Button variant="accent" onClick={() => { setEdit(blank()); setIsNew(true); setErrs({}); }}><Plus className="h-4 w-4" />Create question</Button>} />
      <div className="mb-4 flex flex-wrap gap-3"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search questions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" /></div>
        <div className="w-48"><Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type"><option value="All">All types</option>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></div>
        <div className="w-36"><Select value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="Difficulty"><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></Select></div></div>
      <DataTable rows={list} cols={[
        { head: "ID", cell: (r) => <span className="font-mono text-xs">{r.id}</span> }, { head: "Question", cell: (r) => <span className="line-clamp-2 max-w-[340px]">{r.text}</span> }, { head: "Type", cell: (r) => <Badge tone="blue">{TYPE_LABEL[r.type]}</Badge> },
        { head: "Mapping", cell: (r) => <span className="text-xs text-slate-500">{r.subject} › {r.chapter}</span> }, { head: "Marks", cell: (r) => r.marks }, { head: "Difficulty", cell: (r) => <Badge tone={r.difficulty === "Easy" ? "green" : r.difficulty === "Medium" ? "amber" : "red"}>{r.difficulty}</Badge> }, { head: "Status", cell: (r) => <Badge tone={r.status === "Approved" ? "green" : "neutral"}>{r.status ?? "Draft"}</Badge> },
        { head: "", cell: (r) => <div className="flex gap-1"><Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEdit(structuredClone(r)); setIsNew(false); setErrs({}); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { setRows((l) => l.filter((x) => x.id !== r.id)); toast("Question deleted", "info"); }}><Trash2 className="h-4 w-4" /></Button></div> },
      ]} empty="No questions match." />
      <Modal wide open={!!edit} onClose={() => setEdit(null)} title={isNew ? "Create question" : "Edit question"} footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save question</Button></>}>
        {edit && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Question type"><Select value={edit.type} onChange={(e) => setType_(e.target.value as QuestionType)}>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Marks"><Input type="number" min={1} max={10} value={edit.marks} onChange={(e) => setEdit({ ...edit, marks: Math.max(1, +e.target.value || 1) })} /></Field><Field label="Difficulty"><Select value={edit.difficulty} onChange={(e) => setEdit({ ...edit, difficulty: e.target.value as any })}><option>Easy</option><option>Medium</option><option>Hard</option></Select></Field></div>
          <Field label="Question" error={errs.text} className="sm:col-span-2"><Textarea rows={3} value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} /></Field>
          {hasOpts && <div className="sm:col-span-2"><p className="mb-1.5 text-sm font-medium text-oxford">Options (select the correct answer{edit.type === "multi" ? "s" : ""})</p><div className="space-y-2">{edit.options!.map((o, i) => { const on = edit.type === "multi" ? (edit.answer as string[]).includes(String(i)) : edit.answer === String(i); return (
            <div key={i} className="flex items-center gap-2"><button type="button" aria-label={`Mark option ${i + 1} correct`} aria-pressed={on} onClick={() => setEdit({ ...edit, answer: edit.type === "multi" ? (on ? (edit.answer as string[]).filter((x) => x !== String(i)) : [...(edit.answer as string[]), String(i)]) : String(i) })} className={cn("h-6 w-6 shrink-0 rounded-full border-2", on ? "border-success bg-success" : "border-slate-300")} /><Input value={o} onChange={(e) => setEdit({ ...edit, options: edit.options!.map((x, k) => k === i ? e.target.value : x) })} placeholder={`Option ${i + 1}`} /></div>); })}</div>{errs.options && <p className="mt-1 text-xs text-crimson">{errs.options}</p>}</div>}
          {edit.type === "tf" && <Field label="Correct answer"><Select value={edit.answer as string} onChange={(e) => setEdit({ ...edit, answer: e.target.value })}><option>True</option><option>False</option></Select></Field>}
          {!hasOpts && edit.type !== "tf" && <Field label={edit.type === "short" || edit.type === "long" ? "Model answer" : "Correct answer"} error={errs.answer} className="sm:col-span-2"><Input value={edit.answer as string} onChange={(e) => setEdit({ ...edit, answer: e.target.value })} /></Field>}
          <Field label="Explanation" error={errs.explanation} className="sm:col-span-2"><Textarea rows={2} value={edit.explanation} onChange={(e) => setEdit({ ...edit, explanation: e.target.value })} /></Field>
          <Field label="Subject"><Select value={edit.subject} onChange={(e) => setEdit({ ...edit, subject: e.target.value })}>{ALL_SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Chapter" error={errs.chapter}><Input value={edit.chapter} onChange={(e) => setEdit({ ...edit, chapter: e.target.value })} /></Field>
          <Field label="Topic" error={errs.topic}><Input value={edit.topic} onChange={(e) => setEdit({ ...edit, topic: e.target.value })} /></Field>
          <Field label="Status"><Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as any })}><option>Draft</option><option>In review</option><option>Approved</option></Select></Field>
        </div>}
      </Modal>
    </div>
  );
}

/* ---------- Assessments ---------- */
export function AdminAssessments() {
  const { toast } = useDemo(); const [rows, setRows] = usePersisted("admin-assessments", SEED_ASSESSMENTS);
  const [open, setOpen] = useState(false); const [d, setD] = useState({ name: "", type: "Chapter test", questions: "10", minutes: "20" }); const [err, setErr] = useState("");
  const add = () => { if (d.name.trim().length < 3) return setErr("Give the assessment a name."); if (!(+d.questions > 0 && +d.minutes > 0)) return setErr("Questions and minutes must be positive numbers."); setRows((l) => [{ id: uid(), name: d.name, type: d.type, questions: +d.questions, minutes: +d.minutes, status: "Draft" }, ...l]); setOpen(false); setErr(""); setD({ ...d, name: "" }); toast("Assessment created"); };
  return (
    <div className="mx-auto max-w-6xl"><AHead title="Assessments" subtitle="Tests and sample papers assembled from the question bank." actions={<Button variant="accent" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New assessment</Button>} />
      <DataTable rows={rows} cols={[{ head: "Name", cell: (r) => <b className="text-oxford">{r.name}</b> }, { head: "Type", cell: (r) => r.type }, { head: "Questions", cell: (r) => r.questions }, { head: "Duration", cell: (r) => `${r.minutes} min` },
        { head: "Status", cell: (r) => <button onClick={() => { setRows((l) => l.map((x) => x.id === r.id ? { ...x, status: x.status === "Draft" ? "Published" : "Draft" } : x)); toast("Status changed", "info"); }}><Badge tone={r.status === "Published" ? "green" : "neutral"}>{r.status}</Badge></button> },
        { head: "", cell: (r) => <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { setRows((l) => l.filter((x) => x.id !== r.id)); toast("Deleted", "info"); }}><Trash2 className="h-4 w-4" /></Button> }]} />
      <Modal open={open} onClose={() => setOpen(false)} title="New assessment" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={add}>Create</Button></>}>
        <div className="space-y-4"><Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field><div className="grid gap-3 sm:grid-cols-3"><Field label="Type"><Select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })}>{["Chapter test", "Unit test", "Mock test", "Sample paper", "Revision test"].map((t) => <option key={t}>{t}</option>)}</Select></Field><Field label="Questions"><Input inputMode="numeric" value={d.questions} onChange={(e) => setD({ ...d, questions: e.target.value })} /></Field><Field label="Minutes"><Input inputMode="numeric" value={d.minutes} onChange={(e) => setD({ ...d, minutes: e.target.value })} /></Field></div>{err && <p role="alert" className="text-sm text-crimson">{err}</p>}</div>
      </Modal>
    </div>
  );
}

/* ---------- AI teaching config ---------- */
export function AdminAIConfig() {
  const { toast } = useDemo();
  const [c, setC] = usePersisted("admin-ai", { styles: ["Friendly teacher", "Socratic teacher", "Step-by-step mathematics teacher"] as string[], length: "Medium", hints: "After one wrong attempt", socratic: false, age: "Class 6–8", language: "Student's preferred language" });
  const preview = useMemo(() => {
    const base = c.socratic ? "Before I tell you — if you add 4 to a number and get 10, what could you do to get the number back?" : "To solve x + 4 = 10, subtract 4 from both sides, so x = 6.";
    const longer = c.length === "Detailed" ? " We do the same on both sides to keep the equation balanced, just like a see-saw. Check: 6 + 4 = 10." : c.length === "Short" ? "" : " Check: 6 + 4 = 10.";
    const tone = c.age === "Class 1–5" ? "Let's play detective! " : c.age === "Class 9–12" ? "" : "";
    return tone + base + longer;
  }, [c]);
  const tog = (s: string) => setC((x) => ({ ...x, styles: x.styles.includes(s) ? x.styles.filter((y) => y !== s) : [...x.styles, s] }));
  return (
    <div className="mx-auto max-w-5xl"><AHead title="AI Teaching Configuration" subtitle="Control how the AI teacher behaves. Changes here only affect the preview in this prototype." actions={<Button onClick={() => toast("Configuration saved locally")}><Save className="h-4 w-4" />Save</Button>} />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card><CardHeader title="Enabled teaching styles" /><div className="space-y-1 p-5">{TEACHING_STYLES.map((s) => <div key={s.id} className="flex items-center justify-between gap-3 py-2"><div><p className="text-sm font-medium">{s.id}</p><p className="text-xs text-slate-500">{s.desc}</p></div><Switch checked={c.styles.includes(s.id)} onChange={() => tog(s.id)} label={s.id} /></div>)}</div></Card>
          <Card><CardHeader title="Behaviour" /><div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Explanation length"><Select value={c.length} onChange={(e) => setC({ ...c, length: e.target.value })}><option>Short</option><option>Medium</option><option>Detailed</option></Select></Field>
            <Field label="Hint behaviour"><Select value={c.hints} onChange={(e) => setC({ ...c, hints: e.target.value })}><option>Only on request</option><option>After one wrong attempt</option><option>Automatically after 20 seconds</option></Select></Field>
            <Field label="Age-level response style"><Select value={c.age} onChange={(e) => setC({ ...c, age: e.target.value })}><option>Class 1–5</option><option>Class 6–8</option><option>Class 9–12</option></Select></Field>
            <Field label="Language preference"><Select value={c.language} onChange={(e) => setC({ ...c, language: e.target.value })}><option>Student's preferred language</option><option>Always English</option><option>Bilingual (English + preferred)</option></Select></Field>
            <div className="flex items-center justify-between rounded-xl border border-line p-3 sm:col-span-2"><div><p className="text-sm font-medium">Socratic mode</p><p className="text-xs text-slate-500">Ask guiding questions before giving answers</p></div><Switch checked={c.socratic} onChange={(v) => setC({ ...c, socratic: v })} label="Socratic mode" /></div>
          </div></Card>
        </div>
        <Card className="h-fit lg:col-span-2"><CardHeader title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-crimson" />Live preview</span>} subtitle="Sample response with current settings" /><div className="p-5"><div className="rounded-2xl rounded-tl-sm bg-oxford-50 p-4 text-sm text-ink">{preview}</div><p className="mt-3 text-xs text-slate-500">Hints: {c.hints} · Language: {c.language}</p><p className="mt-1 text-xs text-slate-400">Scripted preview — no AI model is called.</p></div></Card>
      </div>
    </div>
  );
}

/* ---------- Language management ---------- */
export function AdminLanguages() {
  const { toast } = useDemo();
  const [st, setSt] = usePersisted<Record<string, string>>("admin-lang", Object.fromEntries(LANGUAGES.map((l) => [l.name, l.status])));
  const counts = Object.values(st).reduce<Record<string, number>>((a, v) => ({ ...a, [v]: (a[v] ?? 0) + 1 }), {});
  return (
    <div className="mx-auto max-w-5xl"><AHead title="Language Management" subtitle="The 22 scheduled Indian languages and their illustrative support status." />
      <p className="mb-4 rounded-xl bg-sun-50 px-4 py-3 text-sm">Statuses below are illustrative. Production translation, speech and AI quality are <b>not</b> implemented in this prototype; every language requires academic and linguistic validation before launch.</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">{["Available in demo", "Requires validation", "Planned"].map((s) => <Card key={s} className="p-4"><p className="text-2xl font-semibold text-oxford">{counts[s] ?? 0}</p><p className="text-sm text-slate-500">{s}</p></Card>)}</div>
      <DataTable rows={LANGUAGES.map((l, i) => ({ id: l.name, ...l, n: i + 1 }))} cols={[{ head: "#", cell: (r) => r.n }, { head: "Language", cell: (r) => <b className="text-oxford">{r.name}</b> }, { head: "Native name", cell: (r) => r.native },
        { head: "Support status", cell: (r) => <Select className="h-8 w-48 text-xs" value={st[r.name]} onChange={(e) => { setSt({ ...st, [r.name]: e.target.value }); toast(`${r.name}: ${e.target.value}`, "info"); }} aria-label={`Status for ${r.name}`}><option>Available in demo</option><option>Requires validation</option><option>Planned</option></Select> }]} />
    </div>
  );
}

/* ---------- Videos ---------- */
export function AdminVideos() {
  const { toast } = useDemo(); const [rows, setRows] = usePersisted("admin-videos", SEED_ADMIN_VIDEOS);
  const [open, setOpen] = useState(false); const [d, setD] = useState({ title: "", subject: "Mathematics", language: "English", url: "" }); const [err, setErr] = useState("");
  const add = () => { if (d.title.trim().length < 3) return setErr("Title is required."); if (d.url && !/^https?:\/\//.test(d.url)) return setErr("URL must start with http:// or https://"); setRows((l) => [{ id: uid(), title: d.title, subject: d.subject, language: d.language, status: "Placeholder", duration: "—" }, ...l]); setOpen(false); setErr(""); setD({ ...d, title: "", url: "" }); toast("Video resource added (placeholder)"); };
  return (
    <div className="mx-auto max-w-6xl"><AHead title="Video Resources" subtitle="Manage video placeholders. No videos are hosted or verified in the prototype." actions={<Button variant="accent" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add video</Button>} />
      <DataTable rows={rows} cols={[{ head: "Title", cell: (r) => <b className="text-oxford">{r.title}</b> }, { head: "Subject", cell: (r) => r.subject }, { head: "Language", cell: (r) => r.language }, { head: "Duration", cell: (r) => r.duration }, { head: "Status", cell: (r) => <Badge tone="yellow">{r.status}</Badge> }, { head: "", cell: (r) => <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { setRows((l) => l.filter((x) => x.id !== r.id)); toast("Removed", "info"); }}><Trash2 className="h-4 w-4" /></Button> }]} />
      <Modal open={open} onClose={() => setOpen(false)} title="Add video resource" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={add}>Add</Button></>}>
        <div className="space-y-4"><Field label="Title"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Subject"><Select value={d.subject} onChange={(e) => setD({ ...d, subject: e.target.value })}>{ALL_SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></Field><Field label="Language"><Select value={d.language} onChange={(e) => setD({ ...d, language: e.target.value })}><option>English</option><option>Hindi</option></Select></Field></div><Field label="Source URL (optional)"><Input value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} placeholder="https://" /></Field>{err && <p role="alert" className="text-sm text-crimson">{err}</p>}</div>
      </Modal>
    </div>
  );
}

/* ---------- Reports ---------- */
const GROWTH = [{ m: "Jun", u: 4200 }, { m: "Jul", u: 6100 }, { m: "Aug", u: 7900 }, { m: "Sep", u: 9800 }, { m: "Oct", u: 11300 }, { m: "Nov", u: 12480 }];
export function AdminReports() {
  const { toast } = useDemo();
  return (
    <div className="mx-auto max-w-6xl"><AHead title="Reports" subtitle="Platform-level reports (illustrative)." actions={<Button onClick={() => toast("Export is simulated in this prototype", "info")}><Download className="h-4 w-4" />Export CSV</Button>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader title="Student growth" subtitle="Registered students" /><div className="h-60 p-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={GROWTH} margin={{ left: -10, right: 10 }}><CartesianGrid vertical={false} stroke="#E3E8EF" /><XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v) => [v, "Students"]} /><Line dataKey="u" stroke="#002147" strokeWidth={2.5} dot={{ r: 4, fill: "#002147", stroke: "#fff", strokeWidth: 2 }} /></LineChart></ResponsiveContainer></div></Card>
        <Card><CardHeader title="Content coverage by subject" subtitle="Approved chapters (%)" /><ul className="space-y-4 p-5">{[["Mathematics", 82], ["Science", 74], ["English", 61], ["Social Science", 48]].map(([s, v]) => <li key={s as string}><div className="mb-1 flex justify-between text-sm"><span>{s}</span><span>{v}%</span></div><Progress value={v as number} tone="blue" /></li>)}</ul></Card>
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */
export function AdminSettings() {
  const { toast } = useDemo();
  const [s, setS] = usePersisted("admin-settings", { name: "CARAWIN AI TUTOR (Prototype)", session: "2026–27", defaultLang: "English", features: { voice: true, doubt: true, library: true, labs: true, parent: true, offline: false } as Record<string, boolean> });
  return (
    <div className="mx-auto max-w-3xl space-y-5"><AHead title="Settings" actions={<Button onClick={() => toast("Settings saved locally")}><Save className="h-4 w-4" />Save</Button>} />
      <Card><CardHeader title="Platform configuration" /><div className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Platform name"><Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></Field><Field label="Academic session"><Select value={s.session} onChange={(e) => setS({ ...s, session: e.target.value })}>{SESSIONS.map((x) => <option key={x}>{x}</option>)}</Select></Field><Field label="Default language"><Select value={s.defaultLang} onChange={(e) => setS({ ...s, defaultLang: e.target.value })}><option>English</option><option>Hindi</option></Select></Field></div></Card>
      <Card><CardHeader title="Feature availability" subtitle="Toggle modules for this demo" /><div className="divide-y divide-line px-5 pb-2">{Object.entries({ voice: "Voice tutor (simulated)", doubt: "Photo & PDF doubt solver", library: "Digital library", labs: "Learning labs", parent: "Parent portal", offline: "Offline learning" }).map(([k, l]) => <div key={k} className="flex items-center justify-between py-3"><span className="text-sm">{l}</span><Switch checked={s.features[k]} onChange={(v) => setS({ ...s, features: { ...s.features, [k]: v } })} label={l} /></div>)}</div></Card>
      <Card><CardHeader title="Profile" /><div className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Name"><Input defaultValue="Academic Administrator" /></Field><Field label="Email"><Input defaultValue="admin@example.com" /></Field></div></Card>
    </div>
  );
}
