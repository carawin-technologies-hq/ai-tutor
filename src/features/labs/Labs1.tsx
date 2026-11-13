"use client";
import React, { useEffect, useRef, useState } from "react";
import { Undo2, Eraser, Sparkles, Mic, Square, Play, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { Button, Card, CardHeader, Badge, Select, Field, Textarea, Progress, Input } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { sleep, cn } from "@/lib/utils";
import { moonPath } from "@/features/learning/Blocks";

/* ---------- A. Math whiteboard ---------- */
export function Whiteboard() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const cur = useRef<{ x: number; y: number }[] | null>(null);
  const [eq, setEq] = useState("2x + 6 = 14");
  const [steps, setSteps] = useState<{ t: string; e: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const redraw = (list: typeof strokes) => {
    const c = ref.current!; const ctx = c.getContext("2d")!; ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#002147";
    list.forEach((s) => { ctx.beginPath(); s.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); });
  };
  useEffect(() => { redraw(strokes); }, [strokes]);
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * ref.current!.width, y: ((e.clientY - r.top) / r.height) * ref.current!.height }; };
  const down = (e: React.PointerEvent) => { (e.target as Element).setPointerCapture(e.pointerId); cur.current = [pos(e)]; };
  const move = (e: React.PointerEvent) => { if (!cur.current) return; cur.current.push(pos(e)); redraw([...strokes, cur.current]); };
  const up = () => { if (cur.current) setStrokes((s) => [...s, cur.current!]); cur.current = null; };

  const solve = async () => {
    setBusy(true); setSteps([]); await sleep(900);
    const m = eq.replace(/\s/g, "").match(/^(-?\d*)x([+-]\d+)?=(-?\d+)$/);
    if (!m) { setBusy(false); return setSteps([{ t: "I can solve equations of the form ax + b = c in this prototype, e.g. 2x + 6 = 14.", e: "" }]); }
    const a = m[1] === "" ? 1 : m[1] === "-" ? -1 : +m[1]; const b = m[2] ? +m[2] : 0; const c = +m[3];
    const rhs = c - b; const x = rhs / a;
    setSteps([{ t: "Write the equation", e: eq }, ...(b ? [{ t: `${b > 0 ? "Subtract" : "Add"} ${Math.abs(b)} from both sides`, e: `${a === 1 ? "" : a}x = ${rhs}` }] : []), ...(a !== 1 ? [{ t: `Divide both sides by ${a}`, e: `x = ${Number.isInteger(x) ? x : x.toFixed(2)}` }] : []), { t: "Check", e: `${a}(${Number.isInteger(x) ? x : x.toFixed(2)}) ${b >= 0 ? "+" : "−"} ${Math.abs(b)} = ${c} ✓` }]);
    setBusy(false);
  };
  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-3"><CardHeader title="Whiteboard" subtitle="Draw or write with your mouse, finger or stylus" action={<div className="flex gap-1"><Button size="sm" variant="outline" disabled={!strokes.length} onClick={() => setStrokes((s) => s.slice(0, -1))}><Undo2 className="h-4 w-4" />Undo</Button><Button size="sm" variant="outline" onClick={() => { setStrokes([]); setSteps([]); }}><Eraser className="h-4 w-4" />Clear</Button></div>} />
        <div className="p-4"><canvas ref={ref} width={900} height={520} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} className="w-full touch-none rounded-xl border border-line bg-white" style={{ backgroundImage: "linear-gradient(#EEF3FA 1px, transparent 1px), linear-gradient(90deg, #EEF3FA 1px, transparent 1px)", backgroundSize: "30px 30px" }} aria-label="Drawing canvas" /></div></Card>
      <Card className="lg:col-span-2"><CardHeader title="Equation & solution" subtitle="Handwriting recognition is simulated: type the equation to solve" />
        <div className="space-y-3 p-5"><Field label="Equation"><Input value={eq} onChange={(e) => setEq(e.target.value)} /></Field>
          <div className="flex gap-2"><Button onClick={solve} disabled={busy}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Solving…</> : <><Sparkles className="h-4 w-4" />Solve step by step</>}</Button><Button variant="outline" onClick={() => setEq("3x - 5 = 16")}>Sample</Button></div>
          <ol className="space-y-2 pt-2">{steps.map((s, i) => <li key={i} className="rounded-xl bg-mist p-3 text-sm"><p className="text-slate-600">{i + 1}. {s.t}</p>{s.e && <p className="font-display text-lg text-oxford">{s.e}</p>}</li>)}</ol></div></Card>
    </div>
  );
}

/* ---------- B. Oral exam ---------- */
export function OralExam() {
  const [state, setState] = useState<"idle" | "listening" | "evaluating" | "done">("idle");
  const [transcript, setTranscript] = useState("");
  const answer = "Photosynthesis is the process by which green plants make food using sunlight, water and carbon dioxide. Chlorophyll in the leaves absorbs sunlight, and oxygen is released as a by-product.";
  const start = async () => { setState("listening"); setTranscript(""); const words = answer.split(" "); for (let i = 0; i < words.length; i++) { await sleep(130); setTranscript(words.slice(0, i + 1).join(" ")); } setState("evaluating"); await sleep(1200); setState("done"); };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="p-6"><Badge tone="blue">Question 1 of 3 · Science</Badge><p className="mt-3 font-display text-2xl text-oxford dark:text-white">Explain photosynthesis in your own words.</p>
        <div className="mt-6 flex flex-col items-center"><button onClick={state === "idle" || state === "done" ? start : undefined} disabled={state === "listening" || state === "evaluating"} aria-label="Start simulated recording" className={cn("relative flex h-20 w-20 items-center justify-center rounded-full text-white", state === "listening" ? "bg-crimson" : "bg-oxford")}>{state === "listening" && <span className="absolute h-full w-full animate-pulseRing rounded-full bg-crimson/50" />}{state === "listening" ? <Square className="h-7 w-7" /> : <Mic className="h-8 w-8" />}</button>
          <p className="mt-3 text-sm text-slate-500">{state === "idle" ? "Tap the microphone to start (simulated — no audio is recorded)" : state === "listening" ? "Listening…" : state === "evaluating" ? "Evaluating your answer…" : "Done. Tap to try again."}</p></div>
        {transcript && <div className="mt-5 rounded-xl bg-mist p-4 text-sm"><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Transcript (sample)</p>{transcript}</div>}</Card>
      {state === "done" && <Card className="border-l-4 border-l-success p-6"><p className="flex items-center gap-2 font-semibold text-success-700"><CheckCircle2 className="h-5 w-5" />Evaluation (simulated)</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{[["Accuracy", 85], ["Clarity", 78], ["Completeness", 70]].map(([l, v]) => <div key={l as string}><div className="mb-1 flex justify-between text-sm"><span>{l}</span><span>{v}%</span></div><Progress value={v as number} /></div>)}</div><p className="mt-4 text-sm text-slate-600"><b>Feedback:</b> Good explanation of the inputs and outputs. Next time, mention that glucose is the food produced, and name the stomata as the gateway for carbon dioxide.</p></Card>}
    </div>
  );
}

/* ---------- C. Science demonstrator ---------- */
export function ScienceDemo() {
  const [topic, setTopic] = useState("pressure");
  const [force, setForce] = useState(200); const [area, setArea] = useState(4);
  const [phase, setPhase] = useState(4);
  const [light, setLight] = useState(true); const [water, setWater] = useState(true); const [co2, setCo2] = useState(true);
  const P = force / area; const ok = light && water && co2;
  const cards = [{ id: "pressure", t: "Force and Pressure" }, { id: "moon", t: "Phases of the Moon" }, { id: "photo", t: "Photosynthesis" }];
  const phases = ["New Moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full Moon", "Waning gibbous", "Last quarter", "Waning crescent"];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">{cards.map((c) => <button key={c.id} onClick={() => setTopic(c.id)} aria-pressed={topic === c.id} className={cn("card-surface p-4 text-left", topic === c.id && "border-oxford ring-2 ring-oxford/20")}><p className="font-semibold text-oxford">{c.t}</p><p className="text-xs text-slate-500">Interactive experiment</p></button>)}</div>
      {topic === "pressure" && <Card className="p-6"><p className="font-semibold text-oxford">Experiment: Pressure = Force ÷ Area</p><p className="text-sm text-slate-500">Objective: see how changing force and contact area changes pressure.</p>
        <div className="mt-5 grid gap-6 md:grid-cols-2"><div className="space-y-4"><Field label={`Force: ${force} N`}><input type="range" min={50} max={500} step={10} value={force} onChange={(e) => setForce(+e.target.value)} className="w-full accent-[#002147]" /></Field><Field label={`Contact area: ${area} m²`}><input type="range" min={1} max={10} value={area} onChange={(e) => setArea(+e.target.value)} className="w-full accent-[#DC143C]" /></Field></div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-oxford p-6 text-white"><p className="text-xs uppercase tracking-wider text-sun">Pressure</p><p className="font-display text-5xl">{P.toFixed(0)} Pa</p><div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-sun transition-all" style={{ width: `${Math.min(100, (P / 500) * 100)}%` }} /></div><p className="mt-3 text-center text-sm text-white/70">{area <= 2 ? "Small area → high pressure (like a sharp nail)" : area >= 8 ? "Large area → low pressure (like a camel's broad foot)" : "Try making the area smaller."}</p></div></div></Card>}
      {topic === "moon" && <Card className="p-6"><p className="font-semibold text-oxford">Experiment: Phases of the Moon</p><Field label={`Moon position: ${phases[phase]}`} className="mt-4"><input type="range" min={0} max={7} value={phase} onChange={(e) => setPhase(+e.target.value)} className="w-full accent-[#002147]" /></Field>
        <div className="mt-4 flex items-center justify-center gap-10 rounded-xl bg-oxford p-8"><svg width="110" height="110" viewBox="-24 -24 48 48" aria-label={phases[phase]}><circle r="20" fill="#1D3557" stroke="#4F77A8" /><path d={moonPath(phase)} fill="#FFC20E" /></svg><p className="max-w-xs text-sm text-white/80">The Sun always lights half of the Moon. As the Moon orbits Earth, we see more or less of the lit half. Showing: <b className="text-sun">{phases[phase]}</b>.</p></div></Card>}
      {topic === "photo" && <Card className="p-6"><p className="font-semibold text-oxford">Experiment: What does a plant need?</p><div className="mt-4 flex flex-wrap gap-3">{[["Sunlight", light, setLight], ["Water", water, setWater], ["Carbon dioxide", co2, setCo2]].map(([l, v, s]: any) => <button key={l} onClick={() => s(!v)} aria-pressed={v} className={cn("rounded-xl border-2 px-4 py-2 text-sm font-medium", v ? "border-success bg-success-50 text-success-700" : "border-line text-slate-500")}>{v ? "✓" : "✗"} {l}</button>)}</div>
        <div className={cn("mt-5 rounded-xl p-5 text-center", ok ? "bg-success-50" : "bg-crimson-50")}><p className="text-4xl">{ok ? "🌿" : "🥀"}</p><p className="mt-2 font-semibold text-oxford">{ok ? "Glucose and oxygen are produced" : "Photosynthesis cannot happen"}</p><p className="text-sm text-slate-600">{ok ? "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂" : `Missing: ${[!light && "sunlight", !water && "water", !co2 && "carbon dioxide"].filter(Boolean).join(", ")}`}</p></div></Card>}
    </div>
  );
}
