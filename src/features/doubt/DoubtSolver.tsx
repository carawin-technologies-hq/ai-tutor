"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ImageUp, FileText, ClipboardPaste, Keyboard, CheckCircle2, Loader2, Lightbulb, RefreshCw, UploadCloud, Sparkles, ArrowRight, X, Eye } from "lucide-react";
import Link from "next/link";
import { Button, Card, CardHeader, Badge, PageHeader, Tabs, Textarea, DemoTag } from "@/components/ui";
import { useDemo } from "@/components/shared/DemoProvider";
import { cn, sleep } from "@/lib/utils";

const STEPS = ["Reading the question", "Identifying the subject", "Understanding the problem", "Preparing the explanation"];

interface Solution { question: string; subject: string; chapter: string; difficulty: string; hint: string; steps: { title: string; eq: string; why: string }[]; alt: { title: string; body: string }; similar: string[] }
const SOLUTIONS: Record<string, Solution> = {
  linear: {
    question: "Solve for x: 3x − 5 = 16", subject: "Mathematics", chapter: "Linear Equations", difficulty: "Medium",
    hint: "First deal with the “− 5”. Which operation on both sides will remove it?",
    steps: [
      { title: "Write the equation", eq: "3x − 5 = 16", why: "Start from what is given." },
      { title: "Add 5 to both sides", eq: "3x − 5 + 5 = 16 + 5  →  3x = 21", why: "Adding 5 is the inverse of subtracting 5, so the constant moves away from x." },
      { title: "Divide both sides by 3", eq: "3x ÷ 3 = 21 ÷ 3  →  x = 7", why: "Division is the inverse of multiplication by 3; it leaves x alone." },
      { title: "Verify", eq: "3(7) − 5 = 21 − 5 = 16 ✓", why: "Substituting back confirms the left side equals the right side." },
    ],
    alt: { title: "Alternative method: transposition", body: "Move −5 to the right side as +5: 3x = 16 + 5 = 21. Then move the multiplier 3 across as ÷3: x = 21/3 = 7." },
    similar: ["Solve: 4x + 3 = 27", "Solve: 5x − 8 = 17", "A number multiplied by 6 and reduced by 4 gives 20. Find the number."],
  },
  factor: {
    question: "Factorise: 6x² + 9x", subject: "Mathematics", chapter: "Factorisation", difficulty: "Easy",
    hint: "Look for the largest number and the largest power of x that divide both terms.",
    steps: [
      { title: "Write each term in factors", eq: "6x² = 2 × 3 × x × x ;  9x = 3 × 3 × x", why: "Breaking terms into factors makes the common part visible." },
      { title: "Find the common factor", eq: "Common = 3 × x = 3x", why: "Both terms contain 3 and x." },
      { title: "Take 3x out", eq: "6x² + 9x = 3x(2x + 3)", why: "Divide each term by 3x and keep the result inside brackets." },
      { title: "Verify by expanding", eq: "3x(2x + 3) = 6x² + 9x ✓", why: "Multiplying back should return the original expression." },
    ],
    alt: { title: "Alternative method: HCF", body: "Find the HCF of 6 and 9 (=3) and of x² and x (=x). The HCF of the terms is 3x. Divide each term by it." },
    similar: ["Factorise: 8a² + 12a", "Factorise: 15y − 25y²", "Factorise: 4m²n + 10mn²"],
  },
};

type Stage = "input" | "processing" | "result";
type Source = { kind: "image" | "pdf" | "text"; name: string; url?: string; text?: string };

export default function DoubtSolver() {
  const { toast } = useDemo();
  const [mode, setMode] = useState("image");
  const [stage, setStage] = useState<Stage>("input");
  const [src, setSrc] = useState<Source | null>(null);
  const [typed, setTyped] = useState("");
  const [drag, setDrag] = useState(false);
  const [step, setStep] = useState(0);
  const [hintOnly, setHintOnly] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sol, setSol] = useState<Solution>(SOLUTIONS.linear);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (src?.url) URL.revokeObjectURL(src.url); }, [src]);

  const onFile = (f: File | undefined, expect?: "image" | "pdf") => {
    setError("");
    if (!f) return;
    const isImg = f.type.startsWith("image/"); const isPdf = f.type === "application/pdf";
    if (!isImg && !isPdf) return setError("Please choose an image (JPG, PNG) or a PDF file.");
    if (f.size > 15 * 1024 * 1024) return setError("That file is larger than 15 MB. Please pick a smaller one.");
    if (src?.url) URL.revokeObjectURL(src.url);
    setSrc({ kind: isPdf ? "pdf" : "image", name: f.name, url: URL.createObjectURL(f) });
  };

  const run = async (source: Source, forceKey?: string) => {
    const key = forceKey ?? ((source.text ?? "").match(/factor/i) ? "factor" : "linear");
    setSol(SOLUTIONS[key]); setSrc(source); setStage("processing"); setStep(0); setShowHint(false);
    for (let i = 0; i < STEPS.length; i++) { setStep(i); await sleep(850); }
    setStep(STEPS.length); await sleep(350); setStage("result");
  };

  const reset = () => { setStage("input"); setSrc(null); setTyped(""); setHintOnly(false); setError(""); };

  const submitTyped = () => {
    if (typed.trim().length < 4) return setError("Please type or paste the full question (at least a few words).");
    setError(""); run({ kind: "text", name: "Typed question", text: typed });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Ask" title="Solve My Doubt" subtitle="Photograph a question, upload an image or PDF, or type it. Files stay in your browser — nothing is uploaded." actions={<DemoTag>Simulated solution</DemoTag>} />

      {stage === "input" && (
        <div className="space-y-5">
          <Tabs value={mode} onChange={(m) => { setMode(m); setError(""); }} tabs={[
            { id: "image", label: <span className="flex items-center gap-1.5"><ImageUp className="h-4 w-4" />Image</span> },
            { id: "camera", label: <span className="flex items-center gap-1.5"><Camera className="h-4 w-4" />Photograph</span> },
            { id: "pdf", label: <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" />PDF</span> },
            { id: "paste", label: <span className="flex items-center gap-1.5"><ClipboardPaste className="h-4 w-4" />Paste</span> },
            { id: "type", label: <span className="flex items-center gap-1.5"><Keyboard className="h-4 w-4" />Type</span> },
          ]} />

          {(mode === "image" || mode === "pdf" || mode === "camera") && (
            <Card className="p-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
                className={cn("flex min-h-[260px] flex-col items-center justify-center rounded-xl2 border-2 border-dashed p-8 text-center transition", drag ? "border-crimson bg-crimson-50" : "border-oxford-200 bg-oxford-50/50")}>
                {!src ? (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oxford text-sun"><UploadCloud className="h-7 w-7" /></div>
                    <p className="mt-4 font-semibold text-oxford">{mode === "camera" ? "Take a photograph of your question" : `Drag and drop your ${mode === "pdf" ? "PDF" : "image"} here`}</p>
                    <p className="mt-1 text-sm text-slate-500">or choose from your device · JPG, PNG or PDF up to 15 MB</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {mode === "camera" ? <Button onClick={() => camRef.current?.click()}><Camera className="h-4 w-4" />Open camera</Button> : <Button onClick={() => fileRef.current?.click()}>Choose file</Button>}
                      <Button variant="outline" onClick={() => run({ kind: "text", name: "Sample question", text: "Solve for x: 3x − 5 = 16" }, "linear")}><Sparkles className="h-4 w-4" />Use a sample question</Button>
                    </div>
                    <input ref={fileRef} type="file" hidden accept={mode === "pdf" ? "application/pdf" : "image/*,application/pdf"} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
                    <input ref={camRef} type="file" hidden accept="image/*" capture="environment" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
                  </>
                ) : (
                  <div className="w-full max-w-md">
                    {src.kind === "image" ? <img src={src.url} alt="Preview of your uploaded question" className="mx-auto max-h-64 rounded-xl border border-line object-contain" /> : (
                      <div className="mx-auto flex h-40 w-40 flex-col items-center justify-center rounded-xl border border-line bg-white"><FileText className="h-12 w-12 text-crimson" /><span className="mt-2 px-2 text-xs text-slate-500 break-all">{src.name}</span></div>)}
                    <p className="mt-3 text-sm font-medium text-oxford">{src.name}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <Button variant="accent" onClick={() => run(src)}>Solve this question<ArrowRight className="h-4 w-4" /></Button>
                      <Button variant="outline" onClick={() => { setHintOnly(true); run(src); }}><Lightbulb className="h-4 w-4" />Give me a hint first</Button>
                      <Button variant="ghost" onClick={() => setSrc(null)}><X className="h-4 w-4" />Remove</Button>
                    </div>
                  </div>
                )}
              </div>
              {error && <p role="alert" className="mt-3 text-sm text-crimson">{error}</p>}
            </Card>
          )}

          {(mode === "paste" || mode === "type") && (
            <Card className="p-5">
              <label className="mb-2 block text-sm font-medium text-oxford">{mode === "paste" ? "Paste your question" : "Type your question"}</label>
              <Textarea rows={6} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="e.g. Factorise: 6x² + 9x" aria-label="Question text" />
              {error && <p role="alert" className="mt-2 text-sm text-crimson">{error}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="accent" onClick={submitTyped}>Solve this question<ArrowRight className="h-4 w-4" /></Button>
                <Button variant="outline" onClick={() => { setHintOnly(true); submitTyped(); }}><Lightbulb className="h-4 w-4" />Hint first</Button>
                <Button variant="ghost" onClick={() => setTyped("Factorise: 6x² + 9x")}>Try an example</Button>
              </div>
            </Card>
          )}
          <p className="text-xs text-slate-500">Prototype note: text extraction (OCR) and solving are simulated. You will always see one of two sample solutions: a linear equation, or factorisation when your text mentions “factor”.</p>
        </div>
      )}

      {stage === "processing" && (
        <Card className="mx-auto max-w-xl p-8">
          <h2 className="font-display text-xl text-oxford">Working on your doubt…</h2>
          <ol className="mt-6 space-y-4" aria-live="polite">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                {i < step ? <CheckCircle2 className="h-6 w-6 text-success" /> : i === step ? <Loader2 className="h-6 w-6 animate-spin text-crimson" /> : <span className="h-6 w-6 rounded-full border-2 border-slate-200" />}
                <span className={cn("text-sm", i <= step ? "font-medium text-oxford" : "text-slate-400")}>{s}{i === step && "…"}</span>
              </li>))}
          </ol>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100"><motion.div className="h-full bg-crimson" animate={{ width: `${(Math.min(step, 4) / 4) * 100}%` }} /></div>
        </Card>
      )}

      {stage === "result" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><Badge tone="yellow">Sample result — simulated</Badge><Button variant="outline" onClick={reset}><RefreshCw className="h-4 w-4" />Upload another question</Button></div>
          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader title="Your question" />
              <div className="space-y-4 p-5">
                {src?.kind === "image" && <img src={src.url} alt="Your uploaded question" className="max-h-56 w-full rounded-xl border border-line object-contain" />}
                {src?.kind === "pdf" && <div className="flex items-center gap-3 rounded-xl border border-line p-3"><FileText className="h-8 w-8 text-crimson" /><span className="text-sm break-all">{src.name}</span></div>}
                <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Extracted question</p><p className="mt-1 rounded-xl bg-oxford-50 px-3 py-2.5 font-display text-lg text-oxford">{sol.question}</p></div>
                <div className="flex flex-wrap gap-2"><Badge tone="blue">{sol.subject}</Badge><Badge tone="neutral">{sol.chapter}</Badge><Badge tone={sol.difficulty === "Easy" ? "green" : "amber"}>{sol.difficulty}</Badge></div>
                <Link href="/student/learn/lesson/le-2" className="inline-flex items-center gap-1 text-sm font-medium text-crimson hover:underline">Learn this concept <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </Card>

            <div className="space-y-5 lg:col-span-3">
              {hintOnly && !showHint ? (
                <Card className="p-6 text-center"><Lightbulb className="mx-auto h-8 w-8 text-warn-700" /><p className="mt-2 font-semibold text-oxford">Try it yourself first</p><p className="mt-1 text-sm text-slate-500">{sol.hint}</p><Button className="mt-4" variant="outline" onClick={() => setShowHint(true)}><Eye className="h-4 w-4" />Show full solution</Button></Card>
              ) : (
                <>
                  <Card><CardHeader title="Step-by-step solution" />
                    <ol className="space-y-3 p-5">
                      {sol.steps.map((s, i) => (
                        <motion.li key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} className="rounded-xl border border-line p-3.5">
                          <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-crimson text-xs font-bold text-white">{i + 1}</span><p className="font-medium text-oxford">{s.title}</p></div>
                          <p className="mt-2 rounded-lg bg-mist px-3 py-2 font-display text-lg text-oxford">{s.eq}</p>
                          <p className="mt-2 text-sm text-slate-600"><b>Why: </b>{s.why}</p>
                        </motion.li>))}
                    </ol>
                  </Card>
                  <Card className="p-5"><p className="font-semibold text-oxford">{sol.alt.title}</p><p className="mt-1 text-sm text-slate-600">{sol.alt.body}</p></Card>
                </>
              )}
              <Card><CardHeader title="Similar practice questions" subtitle="Try these to make sure you've understood" />
                <ul className="space-y-2 p-5">{sol.similar.map((q, i) => <li key={q} className="flex items-center justify-between gap-3 rounded-xl bg-mist px-3 py-2.5 text-sm"><span>{i + 1}. {q}</span><Link href="/student/practice"><Button size="sm" variant="soft">Practise</Button></Link></li>)}</ul>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
