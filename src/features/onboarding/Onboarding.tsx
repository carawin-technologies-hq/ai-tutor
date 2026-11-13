"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Eye, ListOrdered, Home, GraduationCap, MessageCircleQuestion, BookOpen, PartyPopper } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button, Field, Input, Select, Progress } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { usePersisted } from "@/hooks/usePersisted";
import { AVATARS } from "@/data/mock-students";
import { BOARDS, CLASSES, SESSIONS, MEDIUMS, ALL_SUBJECTS, LANGUAGES, LEARNING_PREFS } from "@/data/mock-curriculum";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name (at least 2 characters)"),
  age: z.string().refine((v) => /^\d+$/.test(v.trim()) && +v >= 4 && +v <= 20, "Enter an age between 4 and 20"),
  classLevel: z.string().min(1, "Select your class"),
});
type ProfileForm = z.infer<typeof profileSchema>;

const ICONS: Record<string, any> = { Eye, ListOrdered, Home, GraduationCap, MessageCircleQuestion, BookOpen };
const STEPS = ["Profile", "Board", "Academics", "Subjects", "Language", "Preferences", "Welcome"];

interface Draft { name: string; avatar: string; age: string; classLevel: string; board: string; session: string; school: string; medium: string; subjects: string[]; language: string; styles: string[] }
const EMPTY: Draft = { name: "", avatar: "🦉", age: "", classLevel: "8", board: "", session: "2026–27", school: "", medium: "English", subjects: [], language: "English", styles: [] };

function Choice({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className={cn("relative rounded-xl2 border-2 p-4 text-left transition-all", selected ? "border-oxford bg-oxford-50 shadow-card" : "border-line bg-white hover:border-oxford-300", className)}>
      {selected && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-oxford text-white"><Check className="h-3 w-3" /></span>}
      {children}
    </button>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { setProfile, setOnboarded, toast } = useDemo();
  const [step, setStep] = useState(0);
  const [d, setD] = usePersisted<Draft>("onboarding-draft", EMPTY);
  const [err, setErr] = useState("");
  const form = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), values: { name: d.name, age: d.age, classLevel: d.classLevel }, mode: "onTouched" });

  const upd = (p: Partial<Draft>) => { setErr(""); setD((x) => ({ ...x, ...p })); };
  const toggle = (k: "subjects" | "styles", v: string) => upd({ [k]: d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v] } as any);

  const next = async () => {
    if (step === 0) {
      const ok = await form.trigger();
      if (!ok) return;
      const v = form.getValues();
      upd({ name: v.name, age: v.age, classLevel: v.classLevel });
    }
    if (step === 1 && !d.board) return setErr("Please select your board to continue.");
    if (step === 3 && d.subjects.length === 0) return setErr("Select at least one subject.");
    if (step === 5 && d.styles.length === 0) return setErr("Pick at least one way you like to learn.");
    if (step === 5) {
      setProfile({ name: d.name, avatar: d.avatar, age: d.age, classLevel: d.classLevel, board: d.board, session: d.session, school: d.school, medium: d.medium, subjects: d.subjects, language: d.language, styles: d.styles });
      setOnboarded(true);
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-oxford-50 to-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/"><Logo /></Link>
        <Link href="/student" className="text-sm text-slate-500 hover:text-oxford">Skip and use demo student →</Link>
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        {step < 6 && (
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-xs font-medium text-slate-500"><span>Step {step + 1} of 6 · {STEPS[step]}</span><span>{Math.round((step / 6) * 100)}%</span></div>
            <Progress value={((step + 1) / 6) * 100} tone="blue" />
          </div>
        )}
        <div className="card-surface min-h-[420px] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
              {step === 0 && (
                <div>
                  <h1 className="font-display text-2xl text-oxford">Let&apos;s meet you</h1>
                  <p className="mt-1 text-sm text-slate-500">Tell us a little about yourself so your teacher can say hello properly.</p>
                  <div className="mt-6">
                    <p className="mb-2 text-sm font-medium text-oxford">Choose an avatar</p>
                    <div className="flex flex-wrap gap-2">{AVATARS.map((a) => (
                      <button key={a} type="button" aria-label={`Avatar ${a}`} aria-pressed={d.avatar === a} onClick={() => upd({ avatar: a })} className={cn("flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-3xl transition", d.avatar === a ? "border-oxford bg-oxford-50" : "border-line hover:border-oxford-300")}>{a}</button>))}</div>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field label="Your name" error={form.formState.errors.name?.message} className="sm:col-span-2"><Input placeholder="e.g. Aarav Sharma" {...form.register("name")} /></Field>
                    <Field label="Age" error={form.formState.errors.age?.message}><Input type="number" inputMode="numeric" placeholder="13" {...form.register("age")} /></Field>
                    <Field label="Class" error={form.formState.errors.classLevel?.message}><Select {...form.register("classLevel")}>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}</Select></Field>
                  </div>
                </div>
              )}
              {step === 1 && (
                <div>
                  <h1 className="font-display text-2xl text-oxford">Which board do you study under?</h1>
                  <p className="mt-1 text-sm text-slate-500">Your lessons will follow this board&apos;s syllabus.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">{BOARDS.map((b) => (
                    <Choice key={b.id} selected={d.board === b.id} onClick={() => upd({ board: b.id })}><p className="text-lg font-semibold text-oxford">{b.label}</p><p className="mt-1 text-sm text-slate-500">{b.desc}</p></Choice>))}</div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <h1 className="font-display text-2xl text-oxford">Your academic details</h1>
                  <p className="mt-1 text-sm text-slate-500">This helps us match chapters and exam dates.</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field label="Academic session"><Select value={d.session} onChange={(e) => upd({ session: e.target.value })}>{SESSIONS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
                    <Field label="Class"><Select value={d.classLevel} onChange={(e) => { upd({ classLevel: e.target.value }); form.setValue("classLevel", e.target.value); }}>{CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}</Select></Field>
                    <Field label="School name (optional)" className="sm:col-span-2"><Input value={d.school} onChange={(e) => upd({ school: e.target.value })} placeholder="e.g. Delhi Public School" /></Field>
                    <Field label="Medium of instruction"><Select value={d.medium} onChange={(e) => upd({ medium: e.target.value })}>{MEDIUMS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <h1 className="font-display text-2xl text-oxford">Pick your subjects</h1>
                  <p className="mt-1 text-sm text-slate-500">Select all that apply. You can change this later in Settings.</p>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{ALL_SUBJECTS.map((s) => (
                    <Choice key={s} selected={d.subjects.includes(s)} onClick={() => toggle("subjects", s)} className="p-3"><p className="pr-5 text-sm font-semibold text-oxford">{s}</p></Choice>))}</div>
                </div>
              )}
              {step === 4 && (
                <div>
                  <h1 className="font-display text-2xl text-oxford">Which language should your teacher use?</h1>
                  <p className="mt-1 text-sm text-slate-500">All 22 scheduled languages are shown. In this prototype only English and sample Hindi content are demonstrated; others are planned or require validation.</p>
                  <div className="mt-5 grid max-h-[300px] gap-2 overflow-y-auto pr-1 scroll-thin sm:grid-cols-3">
                    <Choice selected={d.language === "English"} onClick={() => upd({ language: "English" })} className="p-3"><p className="text-sm font-semibold text-oxford">English</p><p className="text-xs text-slate-500">Available in demo</p></Choice>
                    {LANGUAGES.map((l) => (
                      <Choice key={l.name} selected={d.language === l.name} onClick={() => upd({ language: l.name })} className="p-3">
                        <p className="text-sm font-semibold text-oxford">{l.native} <span className="font-normal text-slate-500">· {l.name}</span></p><p className="text-xs text-slate-500">{l.status}</p></Choice>))}
                  </div>
                </div>
              )}
              {step === 5 && (
                <div>
                  <h1 className="font-display text-2xl text-oxford">How do you like to learn?</h1>
                  <p className="mt-1 text-sm text-slate-500">Choose one or more. Your teacher will adapt its style.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">{LEARNING_PREFS.map((p) => { const I = ICONS[p.icon]; return (
                    <Choice key={p.id} selected={d.styles.includes(p.id)} onClick={() => toggle("styles", p.id)}><div className="flex items-start gap-3"><I className="mt-0.5 h-5 w-5 text-crimson" /><div><p className="font-semibold text-oxford">{p.id}</p><p className="text-sm text-slate-500">{p.desc}</p></div></div></Choice>); })}</div>
                </div>
              )}
              {step === 6 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="relative flex h-24 w-24 items-center justify-center rounded-full bg-oxford text-5xl">
                    {d.avatar}
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <motion.span key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.6], x: Math.cos(i * 1.05) * 70, y: Math.sin(i * 1.05) * 70 }} transition={{ delay: 0.2 + i * 0.08, duration: 1.1 }} className="absolute text-xl">{["✨", "⭐", "🎉"][i % 3]}</motion.span>))}
                  </motion.div>
                  <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6 font-display text-3xl text-oxford">Your personal AI teacher is ready.</motion.h1>
                  <p className="mt-2 max-w-md text-slate-600">Welcome, {d.name.split(" ")[0] || "friend"}! Class {d.classLevel} · {d.board} · {d.subjects.length} subjects · {d.language}.</p>
                  <Button size="lg" variant="accent" className="mt-8" onClick={() => { toast("Profile saved on this device (demo)"); router.push("/student"); }}>Go to my dashboard <ArrowRight className="h-4 w-4" /></Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {err && <p role="alert" className="mt-4 text-sm text-crimson">{err}</p>}
        </div>
        {step < 6 && (
          <div className="mt-5 flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ArrowLeft className="h-4 w-4" />Back</Button>
            <Button onClick={next}>{step === 5 ? "Finish" : "Continue"}<ArrowRight className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
