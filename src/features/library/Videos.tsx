"use client";
import React, { useMemo, useState } from "react";
import { Play, Clock, CheckCircle2, ArrowLeft, Languages, Lightbulb, HelpCircle, Info } from "lucide-react";
import { Button, Card, Badge, Select, PageHeader, EmptyState, Field } from "@/components/ui";
import { usePersisted } from "@/hooks/usePersisted";
import { useDemo } from "@/components/shared/DemoProvider";
import { VIDEOS, type Video } from "@/data/mock-videos";
import { cn } from "@/lib/utils";

function Thumb({ v, big }: { v: Video; big?: boolean }) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-gradient-to-br", v.hue, big ? "aspect-video rounded-xl2" : "aspect-video rounded-t-xl2")}>
      <svg className="absolute inset-0 h-full w-full opacity-10" aria-hidden><defs><pattern id={`p${v.id}`} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#fff" /></pattern></defs><rect width="100%" height="100%" fill={`url(#p${v.id})`} /></svg>
      <span className={cn("flex items-center justify-center rounded-full bg-white/90 text-oxford shadow-lift", big ? "h-16 w-16" : "h-12 w-12")}><Play className="ml-0.5 h-5 w-5" /></span>
      <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">{v.duration}</span>
      <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-oxford">{v.subject}</span>
    </div>
  );
}

export default function Videos() {
  const [done, setDone] = usePersisted<string[]>("videos-done", ["v1"]);
  const [f, setF] = useState({ subject: "All", chapter: "All", topic: "All", language: "All" });
  const [openId, setOpenId] = useState<string | null>(null);
  const chapters = useMemo(() => Array.from(new Set(VIDEOS.filter((v) => f.subject === "All" || v.subject === f.subject).map((v) => v.chapter))), [f.subject]);
  const topics = useMemo(() => Array.from(new Set(VIDEOS.filter((v) => f.chapter === "All" || v.chapter === f.chapter).map((v) => v.topic))), [f.chapter]);
  const list = VIDEOS.filter((v) => (f.subject === "All" || v.subject === f.subject) && (f.chapter === "All" || v.chapter === f.chapter) && (f.topic === "All" || v.topic === f.topic) && (f.language === "All" || v.language === f.language));
  const open = VIDEOS.find((v) => v.id === openId);
  if (open) return <VideoDetail v={open} done={done.includes(open.id)} onToggle={() => setDone((d) => d.includes(open.id) ? d.filter((x) => x !== open.id) : [...d, open.id])} onBack={() => setOpenId(null)} onOpen={setOpenId} />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Learn" title="Video Learning" subtitle="Topic-wise videos matched to your chapters." />
      <p className="mb-5 flex items-start gap-2 rounded-xl bg-sun-50 px-4 py-3 text-sm"><Info className="mt-0.5 h-4 w-4 shrink-0 text-warn-700" />Prototype placeholders: no real videos are played, and titles are illustrative. They are not verified or endorsed by any publisher.</p>
      <Card className="mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Subject"><Select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value, chapter: "All", topic: "All" })}><option>All</option><option>Mathematics</option><option>Science</option></Select></Field>
        <Field label="Chapter"><Select value={f.chapter} onChange={(e) => setF({ ...f, chapter: e.target.value, topic: "All" })}><option>All</option>{chapters.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Topic"><Select value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}><option>All</option>{topics.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Language"><Select value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}><option>All</option><option>English</option><option>Hindi</option></Select></Field>
      </Card>
      {list.length === 0 ? <EmptyState icon={<Play className="h-6 w-6" />} title="No videos match" body="Try clearing a filter." action={<Button variant="outline" onClick={() => setF({ subject: "All", chapter: "All", topic: "All", language: "All" })}>Clear filters</Button>} /> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <Card key={v.id} className="overflow-hidden transition hover:shadow-lift">
              <button className="block w-full text-left" onClick={() => setOpenId(v.id)} aria-label={`Open ${v.title}`}><Thumb v={v} /></button>
              <div className="p-4"><div className="flex items-start justify-between gap-2"><button className="text-left font-semibold text-oxford hover:underline dark:text-white" onClick={() => setOpenId(v.id)}>{v.title}</button>{done.includes(v.id) && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Completed" />}</div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{v.desc}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><Badge tone="neutral">{v.chapter}</Badge><Badge tone="blue"><Languages className="h-3 w-3" />{v.language}</Badge><span className="flex items-center gap-1 text-slate-500"><Clock className="h-3 w-3" />{v.duration}</span></div></div>
            </Card>))}
        </div>)}
    </div>
  );
}

function VideoDetail({ v, done, onToggle, onBack, onOpen }: { v: Video; done: boolean; onToggle: () => void; onBack: () => void; onOpen: (id: string) => void }) {
  const { toast } = useDemo();
  const [picked, setPicked] = useState<Record<number, number>>({});
  const related = VIDEOS.filter((x) => x.id !== v.id && (x.chapter === v.chapter || x.subject === v.subject)).slice(0, 3);
  return (
    <div className="mx-auto max-w-6xl">
      <Button variant="ghost" onClick={onBack} className="mb-4"><ArrowLeft className="h-4 w-4" />All videos</Button>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="relative"><Thumb v={v} big /><div className="absolute inset-x-0 bottom-0 rounded-b-xl2 bg-black/60 px-4 py-2 text-center text-xs text-white">Video player placeholder — no real video in this prototype</div></div>
          <div><h1 className="font-display text-2xl text-oxford dark:text-white">{v.title}</h1><div className="mt-2 flex flex-wrap gap-2"><Badge tone="blue">{v.subject}</Badge><Badge tone="neutral">{v.chapter}</Badge><Badge tone="neutral">{v.language}</Badge></div><p className="mt-3 text-slate-600">{v.desc}</p>
            <Button className="mt-4" variant={done ? "outline" : "accent"} onClick={() => { onToggle(); toast(done ? "Marked as not completed" : "Video marked as completed 🎉", "info"); }}><CheckCircle2 className="h-4 w-4" />{done ? "Completed" : "Mark as completed"}</Button></div>
          <div className="grid gap-4 sm:grid-cols-2"><Card className="p-5"><p className="font-semibold text-oxford">Learning objectives</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{v.objectives.map((o) => <li key={o}>{o}</li>)}</ul></Card>
            <Card className="p-5"><p className="flex items-center gap-1.5 font-semibold text-oxford"><Lightbulb className="h-4 w-4 text-warn-700" />Key takeaways</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{v.takeaways.map((o) => <li key={o}>{o}</li>)}</ul></Card></div>
          <Card className="p-5"><p className="flex items-center gap-1.5 font-semibold text-oxford"><HelpCircle className="h-4 w-4 text-crimson" />Check your understanding</p>
            {v.questions.map((qq, i) => (<div key={i} className="mt-3"><p className="text-sm font-medium">{qq.q}</p><div className="mt-2 flex flex-wrap gap-2">{qq.options.map((o, k) => { const p = picked[i]; const right = p !== undefined && k === qq.answer; const wrong = p === k && k !== qq.answer; return <button key={o} onClick={() => setPicked({ ...picked, [i]: k })} className={cn("rounded-xl border-2 px-4 py-2 text-sm", right ? "border-success bg-success-50" : wrong ? "border-crimson bg-crimson-50" : "border-line hover:border-oxford-300")}>{o}</button>; })}</div>{picked[i] !== undefined && <p className="mt-2 text-sm text-slate-600">{picked[i] === qq.answer ? "✅ Correct!" : "❌ Try again — rewatch the key takeaways above."}</p>}</div>))}
          </Card>
        </div>
        <div><p className="mb-3 font-semibold text-oxford">Related videos</p><div className="space-y-3">{related.map((r) => <button key={r.id} onClick={() => { onOpen(r.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="card-surface flex w-full gap-3 p-2 text-left hover:shadow-lift"><div className={cn("flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br", r.hue)}><Play className="h-5 w-5 text-white" /></div><div className="min-w-0"><p className="line-clamp-2 text-sm font-medium text-oxford">{r.title}</p><p className="text-xs text-slate-500">{r.duration} · {r.language}</p></div></button>)}</div></div>
      </div>
    </div>
  );
}
