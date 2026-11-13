"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, Download, Wifi, WifiOff, Loader2, Send, Trophy, Users, MessageSquare, Compass, FileText, RotateCw, Plus } from "lucide-react";
import { Button, Card, CardHeader, Badge, Select, Field, Textarea, Progress, Input, Tabs, Switch } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { usePersisted } from "@/hooks/usePersisted";
import { cn, sleep, uid } from "@/lib/utils";

/* ---------- D. Writing coach ---------- */
const SAMPLE = "My favourite festival is Diwali. It is very good. We light diyas and eat sweets. It is very good because everyone is happy. I like Diwali very much.";
export function WritingCoach() {
  const [text, setText] = useState(SAMPLE); const [res, setRes] = useState<null | ReturnType<typeof analyse>>(null); const [busy, setBusy] = useState(false);
  function analyse(t: string) {
    const words = t.trim().split(/\s+/).filter(Boolean); const sents = t.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
    const freq = new Map<string, number>(); words.forEach((w) => { const k = w.toLowerCase().replace(/[^a-z]/g, ""); if (k.length > 3) freq.set(k, (freq.get(k) ?? 0) + 1); });
    const repeated = Array.from(freq).filter(([, n]) => n >= 2).map(([w]) => w).slice(0, 4);
    const vocab: [RegExp, string][] = [[/\bvery good\b/i, "wonderful, delightful, memorable"], [/\bhappy\b/i, "joyful, cheerful, delighted"], [/\bnice\b/i, "pleasant, lovely"], [/\bbig\b/i, "enormous, vast"]];
    const grammar: string[] = []; if (/\bi\b/.test(t)) grammar.push("Write the pronoun “I” with a capital letter."); if (!/[.!?]\s*$/.test(t.trim())) grammar.push("End your final sentence with punctuation.");
    const avg = words.length / Math.max(1, sents.length);
    return { words: words.length, sents: sents.length, avg: Math.round(avg * 10) / 10, repeated, vocab: vocab.filter(([r]) => r.test(t)).map(([r, s]) => [r.source.replace(/\\b/g, ""), s]), grammar, structure: [words.length < 60 ? "Add more detail — aim for at least 60 words for a paragraph." : "Good length.", sents.length > 2 ? "Add a clear opening sentence and a closing sentence." : "Write at least three sentences.", avg < 8 ? "Sentences are short; combine some using ‘because’ or ‘and’." : "Sentence length is balanced."], score: Math.min(95, 40 + Math.min(30, words.length / 2) + (repeated.length ? 0 : 10) + (grammar.length ? 0 : 10)) };
  }
  const run = async () => { setBusy(true); await sleep(900); setRes(analyse(text)); setBusy(false); };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5"><Field label="Your writing"><Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} /></Field><div className="mt-3 flex items-center gap-2"><Button onClick={run} disabled={busy || text.trim().length < 10}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Analysing…</> : <><Sparkles className="h-4 w-4" />Get feedback</>}</Button><Button variant="outline" onClick={() => { setText(SAMPLE); setRes(null); }}>Load sample essay</Button></div><p className="mt-2 text-xs text-slate-400">Feedback uses simple rule-based checks in this prototype — not a real language model.</p></Card>
      <Card className="p-5">{!res ? <p className="py-16 text-center text-sm text-slate-500">Your feedback will appear here.</p> : (
        <div className="space-y-4 text-sm"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-sun font-display text-xl text-oxford">{res.score}</div><div><p className="font-semibold text-oxford">Sample evaluation</p><p className="text-slate-500">{res.words} words · {res.sents} sentences · {res.avg} words/sentence</p></div></div>
          <div><p className="font-semibold text-oxford">Grammar</p>{res.grammar.length ? <ul className="list-disc pl-5 text-slate-600">{res.grammar.map((g) => <li key={g}>{g}</li>)}</ul> : <p className="text-slate-600">No obvious grammar issues found.</p>}</div>
          <div><p className="font-semibold text-oxford">Vocabulary</p>{res.vocab.length ? <ul className="list-disc pl-5 text-slate-600">{res.vocab.map(([a, b]) => <li key={a}>Replace “{a}” with: {b}</li>)}</ul> : <p className="text-slate-600">Nice word choices.</p>}{res.repeated.length > 0 && <p className="mt-1 text-slate-600">Repeated words: {res.repeated.join(", ")}.</p>}</div>
          <div><p className="font-semibold text-oxford">Structure</p><ul className="list-disc pl-5 text-slate-600">{res.structure.map((g) => <li key={g}>{g}</li>)}</ul></div></div>)}</Card>
    </div>
  );
}

/* ---------- E. Career guidance ---------- */
const QS = [["I enjoy solving puzzles and number problems", "analytical"], ["I like experiments and finding out how things work", "science"], ["I enjoy drawing, designing or making things", "creative"], ["I like helping and teaching other people", "people"], ["I enjoy writing stories or speaking in front of others", "language"], ["I am curious about computers and apps", "tech"]] as const;
const PATHS: Record<string, { title: string; careers: string[]; steps: string[] }> = {
  analytical: { title: "Mathematics & Data", careers: ["Data scientist", "Actuary", "Economist"], steps: ["Class 9–10: Strengthen algebra and statistics", "Class 11–12: Mathematics + Economics/Computer Science", "Undergraduate: Statistics, Maths or Economics", "Build projects with real data"] },
  science: { title: "Science & Engineering", careers: ["Engineer", "Doctor", "Researcher"], steps: ["Class 9–10: Build strong Physics, Chemistry, Biology basics", "Class 11–12: PCM or PCB", "Entrance preparation and undergraduate study", "Join a science club or maker lab"] },
  creative: { title: "Design & Arts", careers: ["Architect", "UX designer", "Animator"], steps: ["Build a sketchbook portfolio", "Class 11–12: choose a stream with Design/Arts options", "Design entrance exams and portfolio", "Learn a design tool"] },
  people: { title: "Education & Health", careers: ["Teacher", "Psychologist", "Nurse"], steps: ["Volunteer as a peer tutor", "Class 11–12: Humanities or Science depending on goal", "Undergraduate: Education, Psychology or Health sciences", "Practical internships"] },
  language: { title: "Communication & Media", careers: ["Journalist", "Lawyer", "Content creator"], steps: ["Write a school blog", "Class 11–12: Humanities", "Undergraduate: Journalism, Law or Literature", "Public speaking practice"] },
  tech: { title: "Technology", careers: ["Software developer", "AI engineer", "Cybersecurity analyst"], steps: ["Learn basic coding (Python/Scratch)", "Class 11–12: Maths + Computer Science", "Undergraduate: Computer Science", "Build and share small projects"] },
};
export function Career() {
  const [ans, setAns] = useState<Record<string, number>>({}); const [done, setDone] = useState(false);
  const scores = useMemo(() => Object.entries(PATHS).map(([k]) => [k, ans[k] ?? 0] as const).sort((a, b) => b[1] - a[1]), [ans]);
  const top = scores.slice(0, 2);
  if (done) return (
    <div className="space-y-5"><Card className="p-6"><p className="text-xs font-semibold uppercase tracking-wider text-crimson">Your strengths</p><div className="mt-3 flex flex-wrap gap-2">{top.map(([k]) => <Badge key={k} tone="blue" className="text-sm">{PATHS[k].title}</Badge>)}</div><p className="mt-3 text-sm text-slate-500">Based on a short interest questionnaire. This is sample guidance, not professional career advice.</p></Card>
      <div className="grid gap-5 md:grid-cols-2">{top.map(([k]) => <Card key={k} className="p-5"><p className="font-display text-xl text-oxford">{PATHS[k].title}</p><p className="mt-1 text-sm text-slate-500">Career categories: {PATHS[k].careers.join(" · ")}</p><ol className="mt-4 space-y-2">{PATHS[k].steps.map((s, i) => <li key={s} className="flex gap-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-oxford text-xs text-white">{i + 1}</span>{s}</li>)}</ol></Card>)}</div>
      <Button variant="outline" onClick={() => { setAns({}); setDone(false); }}>Retake questionnaire</Button></div>);
  const answered = Object.keys(ans).length;
  return (
    <Card className="mx-auto max-w-2xl p-6"><p className="font-semibold text-oxford">How much do these sound like you?</p><Progress value={(answered / QS.length) * 100} tone="blue" className="mt-2" />
      <ul className="mt-5 space-y-5">{QS.map(([q, k]) => <li key={k}><p className="text-sm font-medium">{q}</p><div className="mt-2 flex gap-2">{[["Not me", 0], ["Sometimes", 1], ["Very me", 2]].map(([l, v]) => <button key={l as string} onClick={() => setAns({ ...ans, [k]: v as number })} aria-pressed={ans[k] === v} className={cn("flex-1 rounded-xl border-2 py-2 text-sm", ans[k] === v ? "border-oxford bg-oxford-50 font-medium text-oxford" : "border-line")}>{l}</button>)}</div></li>)}</ul>
      <Button className="mt-6" disabled={answered < QS.length} onClick={() => setDone(true)}>See my pathways</Button></Card>
  );
}

/* ---------- F. Revision coach ---------- */
const CARDS = [["Inverse of addition?", "Subtraction"], ["Formula for pressure?", "P = F ÷ A"], ["Factorise 6x + 9", "3(2x + 3)"], ["Which microorganism makes curd?", "Lactobacillus"], ["(a + b)² = ?", "a² + 2ab + b²"]];
export function RevisionCoach() {
  const { toast } = useDemo(); const [i, setI] = useState(0); const [show, setShow] = useState(false); const [rated, setRated] = useState<Record<number, string>>({});
  const rate = (r: string) => { setRated({ ...rated, [i]: r }); setShow(false); if (i < CARDS.length - 1) setI(i + 1); else toast("All due cards reviewed!"); };
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2"><div className="flex items-center justify-between"><Badge tone="blue">Card {i + 1} of {CARDS.length}</Badge><span className="text-xs text-slate-500">Spaced repetition (simulated)</span></div>
        <button onClick={() => setShow((s) => !s)} className="mt-4 flex min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border-2 border-oxford-100 bg-oxford-50/50 p-6 text-center" aria-label="Flip card"><p className="text-xs uppercase tracking-wider text-slate-400">{show ? "Answer" : "Question — tap to reveal"}</p><p className="mt-2 font-display text-2xl text-oxford">{show ? CARDS[i][1] : CARDS[i][0]}</p></button>
        {show && <div className="mt-4 flex justify-center gap-2">{[["Again", "danger"], ["Good", "soft"], ["Easy", "primary"]].map(([l, v]) => <Button key={l} variant={v as any} onClick={() => rate(l)}>{l}</Button>)}</div>}
        <Progress value={(Object.keys(rated).length / CARDS.length) * 100} tone="green" className="mt-5" /></Card>
      <div className="space-y-5"><Card><CardHeader title="Due topics" /><ul className="space-y-3 p-5 text-sm">{[["Factorisation", "Due today"], ["Force and Pressure", "Due tomorrow"], ["Cell Structure", "In 3 days"]].map(([t, d]) => <li key={t} className="flex justify-between"><span>{t}</span><Badge tone={d === "Due today" ? "red" : "neutral"}>{d}</Badge></li>)}</ul></Card><Card className="p-5"><p className="font-semibold text-oxford">Quick revision test</p><p className="mt-1 text-sm text-slate-500">6 questions on your weakest chapters.</p><Link href="/student/exams"><Button className="mt-3">Start test</Button></Link></Card></div>
    </div>
  );
}

/* ---------- G. Offline ---------- */
export function Offline() {
  const { toast } = useDemo();
  const [items, setItems] = usePersisted("offline", [{ id: "o1", t: "Linear Equations — Lesson 2", size: "12 MB", state: "done", p: 100 }, { id: "o2", t: "Factorisation — Revision pack", size: "8 MB", state: "none", p: 0 }, { id: "o3", t: "Force and Pressure worksheet", size: "3 MB", state: "none", p: 0 }, { id: "o4", t: "Practice set: Algebra (20 Qs)", size: "1 MB", state: "done", p: 100 }]);
  const [off, setOff] = useState(false);
  const dl = async (id: string) => { setItems((l) => l.map((x) => x.id === id ? { ...x, state: "loading", p: 0 } : x)); for (let p = 10; p <= 100; p += 15) { await sleep(250); setItems((l) => l.map((x) => x.id === id ? { ...x, p: Math.min(100, p) } : x)); } setItems((l) => l.map((x) => x.id === id ? { ...x, state: "done", p: 100 } : x)); toast("Downloaded (simulated)"); };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="flex items-center justify-between p-5"><div className="flex items-center gap-3">{off ? <WifiOff className="h-5 w-5 text-crimson" /> : <Wifi className="h-5 w-5 text-success" />}<div><p className="font-semibold text-oxford">Offline mode (simulated)</p><p className="text-xs text-slate-500">{off ? "Only downloaded items are available" : "Online — everything is available"}</p></div></div><Switch checked={off} onChange={setOff} label="Offline mode" /></Card>
      <Card><CardHeader title="Downloaded lessons & practice" /><ul className="divide-y divide-line p-2">{items.map((x) => { const locked = off && x.state !== "done"; return (<li key={x.id} className={cn("flex items-center gap-3 p-3", locked && "opacity-40")}><div className="min-w-0 flex-1"><p className="text-sm font-medium">{x.t}</p><p className="text-xs text-slate-500">{x.size}{locked && " · not available offline"}</p>{x.state === "loading" && <Progress value={x.p} tone="blue" className="mt-1.5" />}</div>
        {x.state === "done" ? <Badge tone="green"><CheckCircle2 className="h-3 w-3" />Downloaded</Badge> : x.state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Button size="sm" variant="outline" disabled={off} onClick={() => dl(x.id)}><Download className="h-4 w-4" />Download</Button>}</li>); })}</ul></Card>
      <p className="text-xs text-slate-500">Nothing is actually stored for offline use in this prototype; this demonstrates the intended experience.</p>
    </div>
  );
}

/* ---------- H. Teacher content studio ---------- */
export function Studio() {
  const { toast } = useDemo(); const [tab, setTab] = useState("lesson"); const [topic, setTopic] = useState("Linear Equations"); const [n, setN] = useState("5"); const [out, setOut] = useState<string[] | null>(null); const [busy, setBusy] = useState(false); const [status, setStatus] = useState("Draft");
  const gen = async () => { setBusy(true); setOut(null); await sleep(900); const k = Math.max(1, Math.min(10, +n || 5));
    const base: Record<string, string[]> = { lesson: ["Objective: students solve one-variable equations.", "Warm-up (5 min): balance scale demo.", "Teach (15 min): inverse operations.", "Practice (15 min): 5 guided problems.", "Exit ticket: solve x + 9 = 23."], worksheet: Array.from({ length: k }, (_, i) => `Q${i + 1}. Solve: x + ${i + 3} = ${i + 14}`), paper: Array.from({ length: k }, (_, i) => `Q${i + 1} (${i < 2 ? 1 : 2} mark${i < 2 ? "" : "s"}). ${["Define a linear equation.", "Solve 3x − 5 = 16.", "Solve 5x = 3x + 10.", "Frame and solve a word problem.", "Verify x = 7 in 2x + 1 = 15."][i % 5]}`), assignment: ["Title: Equations in everyday life", "Task: find three real situations that can be written as x + a = b.", "Submission: one page with equations and solutions.", "Due: in 5 days."] };
    setOut(base[tab] ?? base.lesson); setBusy(false); setStatus("Draft"); };
  return (
    <div className="space-y-5"><Tabs value={tab} onChange={(t) => { setTab(t); setOut(null); }} tabs={[{ id: "lesson", label: "Create lesson" }, { id: "worksheet", label: "Worksheet" }, { id: "paper", label: "Question paper" }, { id: "assignment", label: "Assignment" }, { id: "review", label: "Review content" }]} />
      {tab !== "review" ? <div className="grid gap-5 lg:grid-cols-2"><Card className="p-5 space-y-4"><Field label="Topic"><Input value={topic} onChange={(e) => setTopic(e.target.value)} /></Field>{(tab === "worksheet" || tab === "paper") && <Field label="Number of questions (1–10)"><Input inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} /></Field>}<Button onClick={gen} disabled={busy || topic.trim().length < 3}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4" />Generate draft (simulated)</>}</Button></Card>
        <Card className="p-5">{!out ? <p className="py-12 text-center text-sm text-slate-500">Your draft appears here.</p> : <><div className="mb-3 flex items-center justify-between"><p className="font-semibold text-oxford">{topic} · draft</p><Badge tone={status === "Approved" ? "green" : "amber"}>{status}</Badge></div><ul className="space-y-2 text-sm">{out.map((l) => <li key={l} className="rounded-lg bg-mist px-3 py-2">{l}</li>)}</ul><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => setStatus("In review")}>Send for review</Button><Button size="sm" onClick={() => { setStatus("Approved"); toast("Marked approved (local)"); }}>Approve</Button></div></>}</Card></div>
        : <Card className="p-5"><ul className="divide-y divide-line">{[["Linear Equations worksheet", "In review"], ["Factorisation unit test", "Draft"], ["Pressure lesson plan", "In review"]].map(([t, s]) => <li key={t} className="flex items-center justify-between py-3 text-sm"><span className="flex items-center gap-2"><FileText className="h-4 w-4 text-oxford" />{t}</span><Badge tone="amber">{s}</Badge></li>)}</ul></Card>}
    </div>
  );
}

/* ---------- I. Study group ---------- */
const MEMBERS = [["Aarav", "🦉", 920], ["Ishita", "🦊", 880], ["Kabir", "🦁", 810], ["Meera", "🐬", 760]] as const;
export function StudyGroup() {
  const { profile } = useDemo();
  const [msgs, setMsgs] = usePersisted("group-msgs", [{ id: "g1", who: "Ishita", text: "Anyone solved Q4 of the Factorisation worksheet?" }, { id: "g2", who: "Kabir", text: "Yes! Take out 3x first, then check by expanding." }]);
  const [t, setT] = useState(""); const [joined, setJoined] = useState(false);
  const send = async () => { if (!t.trim()) return; setMsgs((m) => [...m, { id: uid(), who: profile.name.split(" ")[0], text: t.trim() }]); setT(""); await sleep(900); setMsgs((m) => [...m, { id: uid(), who: "Meera", text: "Nice, thanks for sharing 👍 (scripted reply)" }]); };
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="flex flex-col lg:col-span-2"><CardHeader title={<span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Class 8 Maths Squad</span>} subtitle="Mock group — all members are sample profiles" />
        <div className="max-h-80 flex-1 space-y-3 overflow-y-auto p-5">{msgs.map((m) => <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.who === profile.name.split(" ")[0] ? "ml-auto bg-oxford text-white" : "bg-oxford-50")}><p className="text-[11px] font-semibold opacity-70">{m.who}</p>{m.text}</div>)}</div>
        <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); send(); }}><Input value={t} onChange={(e) => setT(e.target.value)} placeholder="Write a message…" aria-label="Message" /><Button size="icon" aria-label="Send"><Send className="h-4 w-4" /></Button></form></Card>
      <div className="space-y-5"><Card><CardHeader title={<span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-warn" />Weekly challenge</span>} subtitle="Solve 20 equations" /><ul className="space-y-3 p-5">{MEMBERS.map(([n, a, p], i) => <li key={n} className="flex items-center gap-3 text-sm"><span className="w-4 text-slate-400">{i + 1}</span><span className="text-xl">{a}</span><span className="flex-1 font-medium">{n}</span><span className="text-slate-500">{p} pts</span></li>)}</ul></Card>
        <Card className="p-5"><p className="font-semibold text-oxford">Shared practice</p><p className="mt-1 text-sm text-slate-500">Everyone attempts the same 5 questions.</p><Link href="/student/practice"><Button className="mt-3" onClick={() => setJoined(true)}>Join shared practice</Button></Link></Card></div>
    </div>
  );
}
