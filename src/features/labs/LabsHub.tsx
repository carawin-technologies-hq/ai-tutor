"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, PenTool, Mic, FlaskConical, PenLine, Compass, RotateCw, WifiOff, Presentation, Users } from "lucide-react";
import { Card, PageHeader, Badge, DemoTag } from "@/components/ui";
import { Whiteboard, OralExam, ScienceDemo } from "./Labs1";
import { WritingCoach, Career, RevisionCoach, Offline, Studio, StudyGroup } from "./Labs2";

export const LABS = [
  { id: "whiteboard", t: "AI Mathematics Whiteboard", d: "Draw, write equations and see step-by-step solutions.", icon: PenTool, C: Whiteboard },
  { id: "oral", t: "AI Oral Examination", d: "Answer aloud (simulated) and get an evaluation.", icon: Mic, C: OralExam },
  { id: "science", t: "AI Science Demonstrator", d: "Interactive experiments with live visuals.", icon: FlaskConical, C: ScienceDemo },
  { id: "writing", t: "AI Writing Coach", d: "Grammar, vocabulary and structure feedback.", icon: PenLine, C: WritingCoach },
  { id: "career", t: "AI Career Guidance", d: "Interests questionnaire and learning pathways.", icon: Compass, C: Career },
  { id: "revision", t: "AI Revision Coach", d: "Spaced-repetition cards and due topics.", icon: RotateCw, C: RevisionCoach },
  { id: "offline", t: "Offline Learning", d: "Download lessons (simulated offline mode).", icon: WifiOff, C: Offline },
  { id: "studio", t: "Teacher Content Studio", d: "Create lessons, worksheets and papers.", icon: Presentation, C: Studio },
  { id: "group", t: "Study Group", d: "Discuss and compete with classmates.", icon: Users, C: StudyGroup },
];

export function LabsIndex() {
  return (
    <div className="mx-auto max-w-6xl"><PageHeader eyebrow="Explore" title="Learning Labs" subtitle="Advanced prototype modules. Each demonstrates the intended experience with simulated intelligence." actions={<DemoTag>Prototype features</DemoTag>} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{LABS.map((l) => <Link key={l.id} href={`/student/labs/${l.id}`}><Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lift"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-oxford text-sun"><l.icon className="h-6 w-6" /></span><p className="mt-4 font-semibold text-oxford dark:text-white">{l.t}</p><p className="mt-1 text-sm text-slate-500">{l.d}</p><Badge tone="yellow" className="mt-3">Simulated</Badge></Card></Link>)}</div></div>
  );
}

export function LabPage({ id }: { id: string }) {
  const lab = LABS.find((l) => l.id === id)!; const C = lab.C;
  return (
    <div className="mx-auto max-w-6xl"><Link href="/student/labs" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-oxford"><ArrowLeft className="h-4 w-4" />Learning Labs</Link>
      <PageHeader eyebrow="Learning Lab" title={lab.t} subtitle={lab.d} actions={<DemoTag>Simulated · no real AI</DemoTag>} /><C /></div>
  );
}
