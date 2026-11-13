"use client";
import React, { useMemo, useRef, useState } from "react";
import { Upload, Search, Star, FileText, Plus, NotebookPen, BookOpen, ClipboardList, Trash2, ArrowLeft, Loader2, CheckCircle2, Sparkles, Layers, ListChecks, Bookmark, MessageCircleQuestion, Send, FileStack, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Button, Card, Badge, Input, Select, Field, Modal, Tabs, Textarea, EmptyState, PageHeader, Progress, DemoTag } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { usePersisted } from "@/hooks/usePersisted";
import { SEED_DOCS, SAMPLE_PAGES, type LibDoc } from "@/data/mock-library";
import { ALL_SUBJECTS } from "@/data/mock-curriculum";
import { cn, sleep, uid } from "@/lib/utils";

const KINDS = ["Textbook", "Notes", "Worksheet", "PDF"] as const;
const PROCESS = ["Reading document", "Extracting text", "Identifying chapters", "Indexing for questions"];

export default function Library() {
  const { toast } = useDemo();
  const [docs, setDocs] = usePersisted<LibDoc[]>("library", SEED_DOCS);
  const [q, setQ] = useState(""); const [subj, setSubj] = useState("All"); const [kind, setKind] = useState("All"); const [tab, setTab] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState<null | "file" | "note">(null);
  const [processing, setProcessing] = useState<{ id: string; step: number } | null>(null);
  const files = useRef<Record<string, { url: string; type: string }>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState({ title: "", kind: "PDF" as LibDoc["kind"], subject: "Mathematics", chapter: "", text: "", file: null as File | null });
  const [err, setErr] = useState("");

  const list = useMemo(() => docs.filter((d) =>
    (tab === "fav" ? d.fav : tab === "recent" ? true : true) &&
    (subj === "All" || d.subject === subj) && (kind === "All" || d.kind === kind) &&
    (d.title + d.chapter + d.subject).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => tab === "recent" ? b.added.localeCompare(a.added) : 0).slice(0, tab === "recent" ? 4 : 99), [docs, q, subj, kind, tab]);

  const reset = () => { setDraft({ title: "", kind: "PDF", subject: "Mathematics", chapter: "", text: "", file: null }); setErr(""); };
  const save = async () => {
    if (!draft.title.trim()) return setErr("Please give the document a title.");
    if (adding === "file" && !draft.file) return setErr("Choose a PDF or image from your device first.");
    if (adding === "note" && !draft.text.trim()) return setErr("Write something in your note first.");
    const id = uid();
    const d: LibDoc = { id, title: draft.title.trim(), kind: adding === "note" ? "Notes" : draft.kind, subject: draft.subject, chapter: draft.chapter || "General", pages: adding === "note" ? 1 : 3, fav: false, added: new Date().toISOString().slice(0, 10), size: draft.file ? `${Math.max(1, Math.round(draft.file.size / 1024))} KB` : `${draft.text.length} chars`, text: draft.text || undefined, hasFile: !!draft.file };
    if (draft.file) files.current[id] = { url: URL.createObjectURL(draft.file), type: draft.file.type };
    setAdding(null); reset();
    setDocs((l) => [d, ...l]); setProcessing({ id, step: 0 });
    for (let i = 0; i < PROCESS.length; i++) { setProcessing({ id, step: i }); await sleep(700); }
    setProcessing(null); toast("Document is ready — you can now ask questions from it");
  };

  const open = docs.find((d) => d.id === openId);
  if (open) return <DocViewer doc={open} file={files.current[open.id]} onBack={() => setOpenId(null)} />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Learn" title="My Digital Library" subtitle="Keep your notes, textbooks and worksheets in one place — and ask questions from them." actions={
        <div className="flex gap-2"><Button variant="outline" onClick={() => { reset(); setAdding("note"); }}><NotebookPen className="h-4 w-4" />Add note</Button><Button onClick={() => { reset(); setAdding("file"); }}><Upload className="h-4 w-4" />Upload</Button></div>} />
      {processing && (
        <Card className="mb-5 border-oxford-200 p-4"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-crimson" /><div className="flex-1"><p className="text-sm font-medium text-oxford">AI processing (simulated): {PROCESS[processing.step]}…</p><Progress value={((processing.step + 1) / PROCESS.length) * 100} tone="blue" className="mt-2" /></div></div></Card>
      )}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search your library…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search library" /></div>
        <div className="w-44"><Select value={subj} onChange={(e) => setSubj(e.target.value)} aria-label="Subject"><option>All</option>{ALL_SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></div>
        <div className="w-40"><Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type"><option>All</option>{KINDS.map((s) => <option key={s}>{s}</option>)}</Select></div>
      </div>
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ id: "all", label: `All (${docs.length})` }, { id: "recent", label: "Recent" }, { id: "fav", label: "Favourites" }]} />
      {list.length === 0 ? <EmptyState icon={<FileStack className="h-6 w-6" />} title={q ? "No documents match your search" : "Your library is empty"} body="Upload a PDF, add a note or try a different filter." action={<Button onClick={() => { reset(); setAdding("file"); }}>Upload a document</Button>} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <Card key={d.id} className="group flex flex-col p-4 transition hover:shadow-lift">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-crimson-50 text-crimson">{d.kind === "Notes" ? <NotebookPen className="h-5 w-5" /> : d.kind === "Worksheet" ? <ClipboardList className="h-5 w-5" /> : d.kind === "Textbook" ? <BookOpen className="h-5 w-5" /> : <FileText className="h-5 w-5" />}</div>
                <div className="min-w-0 flex-1"><button onClick={() => setOpenId(d.id)} className="line-clamp-2 text-left font-semibold text-oxford hover:underline dark:text-white">{d.title}</button><p className="mt-1 text-xs text-slate-500">{d.subject} · {d.chapter}</p></div>
                <button aria-label={d.fav ? "Remove from favourites" : "Add to favourites"} onClick={() => setDocs((l) => l.map((x) => x.id === d.id ? { ...x, fav: !x.fav } : x))}><Star className={cn("h-5 w-5", d.fav ? "fill-sun text-sun" : "text-slate-300")} /></button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Badge tone="blue">{d.kind}</Badge><span>{d.pages} pages</span><span>· {d.size}</span></div>
              <div className="mt-4 flex gap-2"><Button size="sm" className="flex-1 justify-center" onClick={() => setOpenId(d.id)}>Open</Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${d.title}`} onClick={() => { setDocs((l) => l.filter((x) => x.id !== d.id)); toast("Removed from library", "info"); }}><Trash2 className="h-4 w-4" /></Button></div>
            </Card>))}
        </div>)}

      <Modal open={!!adding} onClose={() => setAdding(null)} title={adding === "note" ? "Add a note" : "Upload a document"} footer={<><Button variant="outline" onClick={() => setAdding(null)}>Cancel</Button><Button onClick={save}>{adding === "note" ? "Save note" : "Add to library"}</Button></>}>
        <div className="space-y-4">
          {adding === "file" && (
            <div><input ref={fileRef} hidden type="file" accept="application/pdf,image/*" onChange={(e) => { const f = e.target.files?.[0] ?? null; setDraft((d) => ({ ...d, file: f, title: d.title || (f?.name.replace(/\.[^.]+$/, "") ?? "") })); }} />
              <button onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-oxford-200 bg-oxford-50/50 p-6 text-sm text-slate-600 hover:bg-oxford-50"><Upload className="mb-2 h-6 w-6 text-oxford" />{draft.file ? <span className="font-medium text-oxford">{draft.file.name}</span> : "Choose a PDF or image (stays in your browser)"}</button></div>)}
          <Field label="Title"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Chapter 2 notes" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {adding === "file" && <Field label="Type"><Select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as any })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</Select></Field>}
            <Field label="Subject"><Select value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })}>{ALL_SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Chapter (optional)"><Input value={draft.chapter} onChange={(e) => setDraft({ ...draft, chapter: e.target.value })} /></Field>
          </div>
          {adding === "note" && <Field label="Your note"><Textarea rows={6} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder="Type or paste your notes…" /></Field>}
          {err && <p role="alert" className="text-sm text-crimson">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}

function DocViewer({ doc, file, onBack }: { doc: LibDoc; file?: { url: string; type: string }; onBack: () => void }) {
  const { toast } = useDemo();
  const pages = SAMPLE_PAGES[doc.id] ?? (doc.text ? [doc.text] : ["Preview of your uploaded document.\n\nIn the full product, each page would be rendered here and indexed for question answering."]);
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState("ask");
  const [bm, setBm] = usePersisted<Record<string, number[]>>("doc-bookmarks", {});
  const [chat, setChat] = useState<{ me?: string; ai?: string }[]>([]);
  const [q, setQ] = useState("");
  const [gen, setGen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [flip, setFlip] = useState<number | null>(null);
  const marks = bm[doc.id] ?? [];

  const generate = async (k: string) => { setBusy(k); await sleep(1100); setGen((g) => ({ ...g, [k]: true })); setBusy(null); toast("Generated (simulated)"); };
  const ask = async () => {
    const t = q.trim(); if (!t) return; setChat((c) => [...c, { me: t }]); setQ(""); await sleep(800);
    setChat((c) => [...c, { ai: `From “${doc.title}”, page ${page + 1}: ${(pages[page] ?? "").split("\n").filter(Boolean).slice(0, 2).join(" ")} — (Simulated answer; a real version would cite exact passages.)` }]);
  };
  const cards = [["What is a linear equation?", "An equation with one variable of power 1."], ["What is a solution (root)?", "The value that makes both sides equal."], ["What does transposing do?", "Moves a term across the equals sign and changes its operation."], ["Check for x + 4 = 10?", "Substitute x = 6 → 6 + 4 = 10 ✓"]];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center gap-3"><Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" />Library</Button><div className="min-w-0"><h1 className="truncate font-display text-xl text-oxford dark:text-white">{doc.title}</h1><p className="text-xs text-slate-500">{doc.subject} · {doc.chapter} · {doc.sample && <DemoTag>Sample document</DemoTag>}</p></div></div>
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm text-slate-500">Page {page + 1} of {pages.length}</span>
            <div className="flex gap-1"><Button size="icon" variant="ghost" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Next page" disabled={page >= pages.length - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              <Button size="sm" variant={marks.includes(page) ? "yellow" : "outline"} onClick={() => setBm((b) => ({ ...b, [doc.id]: marks.includes(page) ? marks.filter((p) => p !== page) : [...marks, page] }))}><Bookmark className="h-4 w-4" />{marks.includes(page) ? "Bookmarked" : "Bookmark page"}</Button></div>
          </div>
          <div className="min-h-[420px] p-4">
            {file?.type === "application/pdf" ? <iframe src={file.url} title="Uploaded PDF preview" className="h-[520px] w-full rounded-lg border border-line" />
              : file ? <img src={file.url} alt="Uploaded document preview" className="mx-auto max-h-[520px] rounded-lg" />
              : <div className="mx-auto min-h-[400px] max-w-md rounded-lg border border-line bg-white p-8 shadow-card"><p className="whitespace-pre-line font-serif text-[15px] leading-7 text-slate-800">{pages[page]}</p><p className="mt-6 text-center text-xs text-slate-400">— {page + 1} —</p></div>}
          </div>
          {marks.length > 0 && <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3 text-xs"><span className="text-slate-500">Bookmarked pages:</span>{marks.map((m) => <button key={m} onClick={() => setPage(m)} className="rounded-full bg-sun-50 px-2.5 py-0.5 font-medium text-warn-700">p.{m + 1}</button>)}</div>}
        </Card>

        <Card className="lg:col-span-2">
          <div className="border-b border-line p-3"><Tabs value={tab} onChange={setTab} tabs={[{ id: "ask", label: "Ask" }, { id: "summary", label: "Summary" }, { id: "flash", label: "Flashcards" }, { id: "qs", label: "Questions" }, { id: "notes", label: "Notes" }]} /></div>
          <div className="min-h-[360px] p-4">
            {tab === "ask" && (<div className="flex h-full flex-col"><div className="flex-1 space-y-2">{chat.length === 0 && <p className="py-8 text-center text-sm text-slate-500"><MessageCircleQuestion className="mx-auto mb-2 h-6 w-6 text-oxford" />Ask a question about this document.</p>}{chat.map((m, i) => <div key={i} className={cn("rounded-2xl px-3 py-2 text-sm", m.me ? "ml-auto max-w-[85%] bg-oxford text-white" : "max-w-[92%] bg-oxford-50")}>{m.me ?? m.ai}</div>)}</div>
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(); }}><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask from this document…" aria-label="Ask from this document" /><Button size="icon" aria-label="Send"><Send className="h-4 w-4" /></Button></form></div>)}
            {tab !== "ask" && !gen[tab] && (
              <div className="py-10 text-center"><Sparkles className="mx-auto h-7 w-7 text-crimson" /><p className="mt-2 text-sm text-slate-600">{({ summary: "Generate a summary of this document", flash: "Create flashcards from this document", qs: "Create practice questions", notes: "Create revision notes" } as any)[tab]}</p><Button className="mt-4" disabled={busy === tab} onClick={() => generate(tab)}>{busy === tab ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</> : "Generate (simulated)"}</Button></div>)}
            {tab === "summary" && gen.summary && <div className="space-y-2 text-sm text-slate-700"><Badge tone="yellow">Simulated summary</Badge><p>This document introduces the key ideas of <b>{doc.chapter}</b>: definitions, the balance method, and worked examples.</p><ul className="list-disc space-y-1 pl-5"><li>Do the same operation on both sides.</li><li>Use inverse operations to isolate the variable.</li><li>Always verify by substitution.</li></ul></div>}
            {tab === "flash" && gen.flash && <div className="grid gap-2">{cards.map(([a, b], i) => <button key={i} onClick={() => setFlip(flip === i ? null : i)} className={cn("rounded-xl border p-3 text-left text-sm transition", flip === i ? "border-oxford bg-oxford text-white" : "border-line bg-white hover:bg-oxford-50")}><span className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-60"><RotateCw className="h-3 w-3" />{flip === i ? "Answer" : "Question — tap to flip"}</span>{flip === i ? b : a}</button>)}</div>}
            {tab === "qs" && gen.qs && <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700"><li>Define a linear equation in one variable.</li><li>Solve: 3x − 5 = 16.</li><li>Why do we apply the same operation on both sides?</li><li>Frame and solve: “A number increased by 9 is 23.”</li></ol>}
            {tab === "notes" && gen.notes && <div className="space-y-2 text-sm text-slate-700"><Badge tone="yellow">Simulated revision notes</Badge><p><b>Key formula idea:</b> x + a = b → x = b − a</p><p><b>Remember:</b> change side, change sign.</p><p><b>Check:</b> substitute and compare both sides.</p></div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
