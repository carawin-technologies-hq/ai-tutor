"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Lock, BookOpenCheck } from "lucide-react";
import { Card, PageHeader, Select, Tabs, Progress, Badge, Modal, Button, Field, DemoTag } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { BOARDS, CLASSES, CHAPTERS, TOPICS, SUBJECT_COLORS } from "@/data/mock-curriculum";
import { TOPIC_MASTERY } from "@/data/mock-progress";

const PROGRESS: Record<string, number> = { "Rational Numbers": 100, "Linear Equations": 40, "Understanding Quadrilaterals": 100, "Data Handling": 66, "Algebraic Expressions": 72, Factorisation: 20, "Exponents and Powers": 85, "Crop Production and Management": 88, Microorganisms: 74, "Force and Pressure": 30, "Cell Structure": 58 };

export default function ChapterBrowser() {
  const { profile, setProfile } = useDemo();
  const router = useRouter();
  const subjects = profile.subjects.filter((s) => CHAPTERS[s]);
  const [subject, setSubject] = useState(subjects[0] ?? "Mathematics");
  const [preview, setPreview] = useState<string | null>(null);

  const open = (ch: string) => {
    if (ch === "Linear Equations") router.push("/student/learn/lesson/le-2");
    else setPreview(ch);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Learn" title="Learn a Chapter" subtitle="Pick a subject and chapter. Your AI teacher will teach it step by step, then check your understanding." actions={<DemoTag />} />
      <Card className="mb-6 grid gap-4 p-4 sm:grid-cols-3">
        <Field label="Board"><Select value={profile.board} onChange={(e) => setProfile({ board: e.target.value })}>{BOARDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</Select></Field>
        <Field label="Class"><Select value={profile.classLevel} onChange={(e) => setProfile({ classLevel: e.target.value })}>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}</Select></Field>
        <Field label="Academic session"><Select value={profile.session} disabled><option>{profile.session}</option></Select></Field>
      </Card>
      {profile.classLevel !== "8" && <p className="mb-4 rounded-xl bg-sun-50 px-4 py-3 text-sm text-ink">Sample chapters in this prototype are for Class 8. Changing the class demonstrates the selector only.</p>}
      <Tabs className="mb-5" value={subject} onChange={setSubject} tabs={subjects.map((s) => ({ id: s, label: s }))} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(CHAPTERS[subject] ?? []).map((ch, i) => {
          const p = PROGRESS[ch] ?? 0; const live = ch === "Linear Equations";
          return (
            <button key={ch} onClick={() => open(ch)} className="card-surface group flex flex-col p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-start justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: SUBJECT_COLORS[subject] }}>{i + 1}</span>{live ? <Badge tone="green">Interactive lesson</Badge> : <Badge tone="neutral"><Lock className="h-3 w-3" />Preview</Badge>}</div>
              <p className="mt-3 font-semibold text-oxford dark:text-white">{ch}</p>
              <p className="mt-1 text-xs text-slate-500">{(TOPICS[ch] ?? ["Topics included in full release"]).length} topics</p>
              <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>{p === 0 ? "Not started" : p === 100 ? "Completed" : "In progress"}</span><span>{p}%</span></div><Progress value={p} tone="blue" /></div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-crimson">{live ? <><Play className="h-4 w-4" />Continue lesson</> : p ? "Open preview" : "Start preview"}</span>
            </button>
          );
        })}
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ?? ""} footer={<><Button variant="outline" onClick={() => setPreview(null)}>Close</Button><Button onClick={() => router.push("/student/learn/lesson/le-2")}>Open Linear Equations lesson</Button></>}>
        <Badge tone="yellow">Prototype preview</Badge>
        <p className="mt-3 text-sm text-slate-600">In this prototype, the full interactive teaching flow is available for <b>Linear Equations</b> (Class 8 Mathematics). Other chapters show their outline only.</p>
        <p className="mt-4 text-sm font-semibold text-oxford">Topics in this chapter</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{(preview && TOPICS[preview] ? TOPICS[preview] : ["Introduction", "Core concepts", "Worked examples", "Practice and revision"]).map((t) => <li key={t}>{t}</li>)}</ul>
      </Modal>
    </div>
  );
}
