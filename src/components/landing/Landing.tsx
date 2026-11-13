"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpenCheck, MessagesSquare, ScanSearch, PenLine, LineChart, Library, GraduationCap, Mic, Languages, Users, ArrowRight, CheckCircle2, Menu, X, Brain, Wallet, HelpCircle, Sparkles, Share2, AtSign, Globe, PlayCircle,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button, Badge, Progress, Card } from "@/components/ui";
import { LANGUAGES } from "@/data/mock-curriculum";
import { cn } from "@/lib/utils";
import { Login } from "@/features/auth/Login";
import type { Role } from "@/types";

const NAV = [
  ["Features", "#features"], ["How it works", "#how"], ["For students", "#students"],
  ["For parents", "#parents"], ["Languages", "#languages"],
];

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="CARAWIN AI TUTOR"><Logo /></Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV.map(([l, h]) => <a key={h} href={h} className="text-sm font-medium text-slate-600 hover:text-oxford">{l}</a>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <a href="#login"><Button variant="ghost">Sign in</Button></a>
          <Link href="/onboarding"><Button variant="accent">Get started</Button></Link>
        </div>
        <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t border-line bg-white px-4 pb-4 lg:hidden">
          {NAV.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block py-3 text-sm font-medium">{l}</a>)}
          <div className="flex gap-2 pt-2"><a href="#login" onClick={() => setOpen(false)} className="flex-1"><Button variant="outline" className="w-full justify-center">Sign in</Button></a><Link href="/onboarding" className="flex-1"><Button variant="accent" className="w-full justify-center">Get started</Button></Link></div>
        </div>
      )}
    </header>
  );
}

function Hero({ role }: { role: Role }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-24 pt-14 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Badge tone="blue" className="mb-5"><Sparkles className="h-3 w-3" />Frontend prototype by Carawin Technologies</Badge>
          <h1 className="font-display text-4xl font-bold leading-[1.08] text-oxford sm:text-5xl lg:text-6xl">Meet Your Personal <span className="text-crimson">AI Teacher.</span></h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">Learn every concept, solve every doubt and prepare for every examination—with an intelligent teacher that understands how you learn.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/onboarding"><Button size="lg" variant="accent">Start Learning <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/student/learn"><Button size="lg" variant="outline">Explore the Tutor</Button></Link>
          </div>
          <p className="mt-6 text-sm font-medium text-oxford">Your Personal AI Teacher. Every Subject. Every Chapter. Every Language.</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            {["CBSE · ICSE · State Boards", "Classes 1–12", "Student, Parent & Academic portals"].map((t) => <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" />{t}</span>)}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}><Login initialRole={role} /></motion.div>
      </div>
    </section>
  );
}

function Problem() {
  const items = [
    { icon: Brain, t: "Every student learns differently", d: "A class of 40 moves at one speed. Some students need another example, others need to go faster." },
    { icon: Wallet, t: "Personal tuition is expensive", d: "One-to-one attention is out of reach for many families, even when a child clearly needs it." },
    { icon: HelpCircle, t: "Students hesitate to ask", d: "Many children stay silent in class rather than risk looking unsure in front of friends." },
    { icon: Languages, t: "Language can become a barrier", d: "Understanding a concept is hard enough. Doing it in a second language is harder." },
    { icon: Users, t: "Parents lack real visibility", d: "Marks arrive late. Parents rarely see which concepts a child actually understands today." },
  ];
  return (
    <section className="bg-mist py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="eyebrow">The problem</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl text-oxford sm:text-4xl">Good teaching shouldn&apos;t depend on a classroom&apos;s pace or a family&apos;s budget.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((it) => (
            <Card key={it.t} className="p-5"><it.icon className="h-6 w-6 text-crimson" /><h3 className="mt-3 font-semibold text-oxford">{it.t}</h3><p className="mt-1.5 text-sm text-slate-600">{it.d}</p></Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  ["Learn", "Complete chapters taught step by step", BookOpenCheck], ["Ask", "Voice or text, any doubt, any time", MessagesSquare],
  ["Practise", "Adaptive questions that match your level", PenLine], ["Assess", "Chapter tests and mock examinations", GraduationCap],
  ["Understand", "See exactly what you know and what you don't", LineChart], ["Improve", "Personalised revision and study plans", Sparkles],
] as const;

function Pillars() {
  return (
    <section className="bg-oxford py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun">The solution</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl sm:text-4xl">One platform. Six things a great home tutor does.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {PILLARS.map(([t, d, Icon], i) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between"><Icon className="h-6 w-6 text-sun" /><span className="text-xs text-white/40">0{i + 1}</span></div>
              <h3 className="mt-4 text-lg font-semibold">{t}</h3><p className="mt-1 text-sm text-white/70">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: BookOpenCheck, t: "AI Chapter Teacher", d: "A structured lesson with explanation, worked examples and questions that wait for your answer — then respond to it.", tag: "Learn" },
  { icon: Mic, t: "AI Voice Tutor", d: "Talk to your teacher and hear it explain. Voice is simulated in this prototype.", tag: "Ask" },
  { icon: ScanSearch, t: "Photo & PDF Doubt Solver", d: "Photograph a question or upload a PDF and get a step-by-step solution with explanation.", tag: "Ask" },
  { icon: PenLine, t: "Adaptive Practice", d: "Ten question types. Difficulty rises and falls with your answers.", tag: "Practise" },
  { icon: Library, t: "Digital Library", d: "Upload notes and textbooks. Ask questions, create summaries and flashcards from them.", tag: "Learn" },
  { icon: GraduationCap, t: "Examination Preparation", d: "Chapter tests to board-style mock papers with a countdown and detailed analysis.", tag: "Assess" },
  { icon: Users, t: "Parent Intelligence", d: "Clear, calm insight into what your child studied and where they need support.", tag: "Understand" },
  { icon: Languages, t: "Multilingual Learning", d: "Designed for all 22 scheduled Indian languages, rolling out with validation.", tag: "Improve" },
];

function Features() {
  return (
    <section id="features" className="scroll-mt-16 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="eyebrow">Product</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl text-oxford sm:text-4xl">Everything a student needs, in one place.</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <motion.div key={f.t} whileHover={{ y: -4 }} className="card-surface p-5 transition-shadow hover:shadow-lift">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-oxford text-sun"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold text-oxford">{f.t}</h3><p className="mt-1.5 text-sm text-slate-600">{f.d}</p>
              <Badge tone="blue" className="mt-4">{f.tag}</Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SplitFeature({ id, eyebrow, title, body, bullets, visual, flip }: { id?: string; eyebrow: string; title: string; body: string; bullets: string[]; visual: React.ReactNode; flip?: boolean }) {
  return (
    <section id={id} className="scroll-mt-16 py-16">
      <div className={cn("mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2")}>
        <div className={cn(flip && "lg:order-2")}>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl text-oxford sm:text-4xl">{title}</h2>
          <p className="mt-4 text-slate-600">{body}</p>
          <ul className="mt-6 space-y-3">{bullets.map((b) => <li key={b} className="flex gap-2.5 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />{b}</li>)}</ul>
        </div>
        <div className={cn(flip && "lg:order-1")}>{visual}</div>
      </div>
    </section>
  );
}

function StudentVisual() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-oxford-50 text-2xl">🦉</div><div><p className="font-semibold text-oxford">Good evening, Aarav!</p><p className="text-xs text-slate-500">Continue: Linear Equations · 40%</p></div></div>
      <Progress value={40} tone="blue" className="mt-3" />
      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        {[["48m", "Today"], ["27", "Questions"], ["3", "Lessons"], ["12🔥", "Streak"]].map(([a, b]) => <div key={b} className="rounded-xl bg-mist p-3"><p className="text-lg font-bold text-oxford">{a}</p><p className="text-xs text-slate-500">{b}</p></div>)}
      </div>
      <div className="mt-4 rounded-xl border-l-4 border-sun bg-sun-50 p-3 text-sm text-ink">Factorisation needs 15 minutes of revision before the next chapter.</div>
    </Card>
  );
}
function ParentVisual() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between"><p className="font-semibold text-oxford">This week · Aarav</p><Badge tone="green">+9% Maths</Badge></div>
      <div className="mt-4 space-y-3">
        {[["Mathematics", 74], ["Science", 79], ["English", 83], ["Social Science", 68]].map(([s, v]) => (
          <div key={s as string}><div className="mb-1 flex justify-between text-sm"><span>{s}</span><span className="font-medium">{v}%</span></div><Progress value={v as number} /></div>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-mist p-3 text-sm text-slate-600">“Aarav completed 4 Mathematics lessons this week. Linear Equations improved from 55% to 82%. Factorisation requires additional practice.”</p>
      <p className="mt-2 text-right text-[10px] uppercase tracking-wider text-slate-400">Illustrative demonstration data</p>
    </Card>
  );
}

function How() {
  const steps = ["Select your curriculum", "Choose a subject and chapter", "Learn with your AI teacher", "Practise and get assessed", "Improve with personalised guidance"];
  return (
    <section id="how" className="scroll-mt-16 bg-mist py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 font-display text-3xl text-oxford sm:text-4xl">From curriculum to confidence in five steps.</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s} className="card-surface relative p-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-crimson font-bold text-white">{i + 1}</span><p className="mt-4 font-semibold text-oxford">{s}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function LanguageSection() {
  return (
    <section id="languages" className="scroll-mt-16 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="eyebrow">Languages</p>
        <h2 className="mt-2 max-w-3xl font-display text-3xl text-oxford sm:text-4xl">Our ambition: a teacher in every scheduled Indian language.</h2>
        <p className="mt-4 max-w-2xl text-slate-600">CARAWIN AI TUTOR is being designed to support all 22 scheduled languages of India. Each language will be rolled out only after academic and linguistic validation. In this prototype, the interface lets you choose a language, but lessons and responses are shown in English or sample Hindi.</p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          {LANGUAGES.map((l) => (
            <span key={l.name} className="rounded-xl border border-line bg-mist px-3.5 py-2 text-sm"><span className="font-medium text-oxford">{l.native}</span><span className="ml-2 text-xs text-slate-500">{l.name}</span></span>
          ))}
        </div>
        <p className="mt-5 text-xs text-slate-500">Support status in this prototype is illustrative and does not represent production language quality.</p>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    ["Product", ["Features", "How it works", "For students", "For parents"]],
    ["Company", ["About Carawin Technologies", "Contact"]],
    ["Legal", ["Privacy", "Terms"]],
  ] as const;
  return (
    <footer className="bg-oxford-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div><Logo light /><p className="mt-4 max-w-xs text-sm text-white/60">Your Personal AI Teacher. Every Subject. Every Chapter. Every Language.</p>
          <div className="mt-4 flex gap-3 text-white/60">{[Share2, AtSign, Globe, PlayCircle].map((I, i) => <span key={i} title="Placeholder — coming soon" className="rounded-lg border border-white/15 p-2"><I className="h-4 w-4" /></span>)}</div></div>
        {cols.map(([h, links]) => (
          <div key={h}><p className="text-sm font-semibold text-sun">{h}</p><ul className="mt-3 space-y-2 text-sm text-white/70">{links.map((l) => <li key={l}><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">{l}</a></li>)}</ul></div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">© 2026 Carawin Technologies. Prototype for demonstration — all students, scores and content shown are sample data.</div>
    </footer>
  );
}

export default function Landing({ role }: { role: Role }) {
  return (
    <div className="bg-white">
      <Nav />
      <Hero role={role} />
      <Problem />
      <Pillars />
      <Features />
      <div className="bg-mist">
        <SplitFeature id="students" eyebrow="For students" title="A teacher who waits for your answer." body="Lessons are conversations. Your teacher explains, asks, listens, gives a hint when you're stuck and moves on only when you've understood." bullets={["Lessons that follow your board, class and chapter", "Hints before answers, explanations after mistakes", "Practice that adapts to what you got right and wrong"]} visual={<StudentVisual />} />
        <SplitFeature id="parents" flip eyebrow="For parents" title="Know what your child actually understands." body="Parent Intelligence turns study activity into plain-language insight — which topics are strong, which need support, and what you can do this week." bullets={["Weekly and monthly progress reports", "Topic-level strengths and weaknesses", "Practical recommendations, not just scores"]} visual={<ParentVisual />} />
      </div>
      <How />
      <LanguageSection />
      <section className="bg-oxford py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="font-display text-3xl sm:text-4xl">Ready to meet your teacher?</h2>
          <p className="mt-3 text-white/70">Explore the full prototype — student, parent and academic portals — with sample data.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/onboarding"><Button size="lg" variant="yellow">Start Learning</Button></Link>
            <Link href="/parent"><Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">See the Parent view</Button></Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
