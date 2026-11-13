"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare, ScanSearch, BookOpenCheck, PenLine, GraduationCap, Star, Bookmark, TrendingDown, Search, Trash2, ArrowRight, History as HistoryIcon } from "lucide-react";
import { Button, Card, Badge, Input, Select, Tabs, EmptyState, PageHeader, DemoTag } from "@/components/ui";
import { usePersisted } from "@/hooks/usePersisted";
import { useDemo } from "@/components/shared/DemoProvider";
import { addDays, todayStr, fmtDate } from "@/lib/dates";

type Kind = "conversation" | "doubt" | "lesson" | "practice" | "test" | "saved" | "bookmark" | "revise";
interface Item { id: string; kind: Kind; title: string; subject: string; date: string; detail: string; href: string; removable?: boolean }

const META: Record<Kind, { label: string; icon: any; cta: string }> = {
  conversation: { label: "AI conversation", icon: MessagesSquare, cta: "Reopen" }, doubt: { label: "Doubt solved", icon: ScanSearch, cta: "View solution" },
  lesson: { label: "Lesson", icon: BookOpenCheck, cta: "Continue lesson" }, practice: { label: "Practice", icon: PenLine, cta: "Practise again" }, test: { label: "Test", icon: GraduationCap, cta: "View exams" },
  saved: { label: "Saved explanation", icon: Star, cta: "Open" }, bookmark: { label: "Bookmark", icon: Bookmark, cta: "Open" }, revise: { label: "Needs revision", icon: TrendingDown, cta: "Revise now" },
};

function seed(): Item[] {
  const t = todayStr();
  return [
    { id: "h1", kind: "conversation", title: "Why does the moon change its shape?", subject: "Science", date: t, detail: "8 messages", href: "/student/teacher" },
    { id: "h2", kind: "lesson", title: "Solving x + a = b", subject: "Mathematics", date: t, detail: "40% complete", href: "/student/learn/lesson/le-2" },
    { id: "h3", kind: "doubt", title: "Factorise 6x² + 9x", subject: "Mathematics", date: addDays(t, -1), detail: "Photo question", href: "/student/doubt" },
    { id: "h4", kind: "practice", title: "Quick practice — Linear Equations", subject: "Mathematics", date: addDays(t, -1), detail: "4 of 5 correct", href: "/student/practice" },
    { id: "h5", kind: "test", title: "Unit Test 2 — Mathematics", subject: "Mathematics", date: addDays(t, -4), detail: "Score 81%", href: "/student/exams" },
    { id: "h6", kind: "saved", title: "Pythagoras theorem — explanation", subject: "Mathematics", date: addDays(t, -3), detail: "Saved from chat", href: "/student/teacher", removable: true },
    { id: "h7", kind: "saved", title: "Photosynthesis equation", subject: "Science", date: addDays(t, -6), detail: "Saved from chat", href: "/student/teacher", removable: true },
    { id: "h8", kind: "bookmark", title: "Linear Equations — The balance idea", subject: "Mathematics", date: addDays(t, -2), detail: "Lesson bookmark", href: "/student/learn/lesson/le-2", removable: true },
    { id: "h9", kind: "revise", title: "Factorisation — accuracy 38%", subject: "Mathematics", date: t, detail: "Common factors with negative signs", href: "/student/practice" },
    { id: "h10", kind: "revise", title: "Force and Pressure — unit conversion", subject: "Science", date: addDays(t, -2), detail: "cm² to m²", href: "/student/practice" },
    { id: "h11", kind: "conversation", title: "Pythagoras theorem", subject: "Mathematics", date: addDays(t, -5), detail: "5 messages", href: "/student/teacher" },
    { id: "h12", kind: "lesson", title: "What is a linear equation?", subject: "Mathematics", date: addDays(t, -7), detail: "Completed", href: "/student/learn/lesson/le-1" },
    { id: "h13", kind: "practice", title: "Chapter practice — Microorganisms", subject: "Science", date: addDays(t, -8), detail: "7 of 9 correct", href: "/student/practice" },
  ];
}

export default function History() {
  const router = useRouter(); const { toast } = useDemo();
  const [items, setItems] = usePersisted<Item[]>("history", seed());
  const [q, setQ] = useState(""); const [subj, setSubj] = useState("All"); const [range, setRange] = useState("all"); const [tab, setTab] = useState("all");

  const list = useMemo(() => items.filter((i) =>
    (tab === "all" || i.kind === tab || (tab === "saved" && (i.kind === "bookmark"))) &&
    (subj === "All" || i.subject === subj) &&
    (range === "all" || i.date >= addDays(todayStr(), range === "today" ? 0 : range === "week" ? -7 : -30)) &&
    (i.title + i.detail).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)), [items, q, subj, range, tab]);

  const count = (k: string) => items.filter((i) => k === "saved" ? i.kind === "saved" || i.kind === "bookmark" : i.kind === k).length;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Understand" title="Learning History" subtitle="Everything you've learned, asked and saved — in one searchable place." actions={<DemoTag />} />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search history…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search history" /></div>
        <div className="w-44"><Select value={subj} onChange={(e) => setSubj(e.target.value)} aria-label="Subject"><option>All</option><option>Mathematics</option><option>Science</option><option>English</option></Select></div>
        <div className="w-40"><Select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range"><option value="all">Any date</option><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></Select></div>
      </div>
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ id: "all", label: `All (${items.length})` }, { id: "conversation", label: `Chats (${count("conversation")})` }, { id: "doubt", label: `Doubts (${count("doubt")})` }, { id: "lesson", label: `Lessons (${count("lesson")})` }, { id: "practice", label: `Practice (${count("practice")})` }, { id: "test", label: `Tests (${count("test")})` }, { id: "saved", label: `Saved (${count("saved")})` }, { id: "revise", label: `Revise (${count("revise")})` }]} />
      {list.length === 0 ? <EmptyState icon={<HistoryIcon className="h-6 w-6" />} title="Nothing found" body="Try a different filter or search term." action={<Button variant="outline" onClick={() => { setQ(""); setSubj("All"); setRange("all"); setTab("all"); }}>Clear filters</Button>} /> : (
        <ul className="space-y-2.5">
          {list.map((i) => { const M = META[i.kind]; return (
            <li key={i.id}><Card className="flex items-center gap-4 p-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${i.kind === "revise" ? "bg-crimson-50 text-crimson" : "bg-oxford-50 text-oxford"}`}><M.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate font-medium text-oxford dark:text-white">{i.title}</p><p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500"><Badge tone="neutral">{M.label}</Badge>{i.subject} · {i.detail} · {fmtDate(i.date)}</p></div>
              <Button size="sm" variant="soft" onClick={() => router.push(i.href)}>{M.cta}<ArrowRight className="h-3.5 w-3.5" /></Button>
              {i.removable && <Button size="icon" variant="ghost" aria-label={`Remove ${i.title}`} onClick={() => { setItems((l) => l.filter((x) => x.id !== i.id)); toast("Removed from saved", "info"); }}><Trash2 className="h-4 w-4" /></Button>}
            </Card></li>); })}
        </ul>)}
    </div>
  );
}
