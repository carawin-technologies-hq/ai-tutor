"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flag, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, Lightbulb, Send, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Button, Badge, Card, Textarea, Input, Modal, Progress } from "@/components/ui";
import { cn, formatTime } from "@/lib/utils";
import type { Question } from "@/types";
import { TYPE_LABEL } from "@/data/mock-questions";
import { evaluate, pickNext, type Answer, type SessionResult } from "./engine";
import { useDemo } from "@/components/shared/DemoProvider";

export interface RunnerConfig {
  title: string;
  pool: Question[];            // all eligible questions
  count: number;
  durationSec?: number;        // timer (countdown). undefined = count-up
  adaptive?: boolean;          // choose next by performance, no going back
  instantFeedback?: boolean;   // practise mode
  showNavPanel?: boolean;      // exam style palette
  examStyle?: boolean;
}

export default function TestRunner({ config, onFinish, onExit }: { config: RunnerConfig; onFinish: (r: SessionResult) => void; onExit: () => void }) {
  const { toast } = useDemo();
  const [qs, setQs] = useState<Question[]>(() => config.adaptive
    ? [pickNext(config.pool, new Set(), "Easy", null)!]
    : config.pool.slice(0, config.count));
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<Record<string, Answer>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [spent, setSpent] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [hint, setHint] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState(false);
  const [exitAsk, setExitAsk] = useState(false);
  const finished = useRef(false);

  const q = qs[i];
  const total = config.count;
  const timeLeft = config.durationSec ? Math.max(0, config.durationSec - elapsed) : null;

  // tick
  useEffect(() => {
    const t = setInterval(() => { setElapsed((e) => e + 1); setSpent((s) => ({ ...s, [qs[i]?.id]: (s[qs[i]?.id] ?? 0) + 1 })); }, 1000);
    return () => clearInterval(t);
  }, [i, qs]);

  const submit = useCallback(() => {
    if (finished.current) return; finished.current = true;
    const rows = qs.map((qq) => ({ q: qq, a: ans[qq.id], v: evaluate(qq, ans[qq.id]), time: spent[qq.id] ?? 0, marked: marked.has(qq.id) }));
    onFinish({ title: config.title, total: qs.length, maxScore: qs.reduce((a, b) => a + b.marks, 0), score: rows.reduce((a, r) => a + r.v.score, 0), timeSpent: elapsed, rows });
  }, [qs, ans, spent, marked, elapsed, config.title, onFinish]);

  useEffect(() => { if (timeLeft === 0) { toast("Time's up! Submitting your test.", "warn"); submit(); } }, [timeLeft]); // eslint-disable-line

  const setAnswer = (v: Answer) => setAns((a) => ({ ...a, [q.id]: v }));
  const cur = ans[q.id];
  const verdict = checked[q.id] ? evaluate(q, cur) : null;

  const goNext = () => {
    if (config.adaptive) {
      if (qs.length >= total) return setConfirm(true);
      const v = evaluate(q, cur);
      const nxt = pickNext(config.pool, new Set(qs.map((x) => x.id)), q.difficulty, v.status === "skipped" ? null : v.status === "correct");
      if (!nxt) return setConfirm(true);
      setQs((l) => [...l, nxt]); setI(qs.length);
    } else if (i < qs.length - 1) setI(i + 1); else setConfirm(true);
  };

  const unanswered = qs.filter((x) => ans[x.id] === undefined || (Array.isArray(ans[x.id]) && !(ans[x.id] as string[]).length) || ans[x.id] === "").length + (config.adaptive ? total - qs.length : 0);
  const canCheck = cur !== undefined && cur !== "" && !(Array.isArray(cur) && !cur.length);

  const statusOf = (qq: Question): "answered" | "marked" | "none" => marked.has(qq.id) ? "marked" : ans[qq.id] !== undefined && ans[qq.id] !== "" && !(Array.isArray(ans[qq.id]) && !(ans[qq.id] as string[]).length) ? "answered" : "none";

  const Opts = () => {
    if (q.type === "multi") {
      const sel = (cur as string[]) ?? [];
      return <div className="space-y-2" role="group" aria-label="Select all that apply">{q.options!.map((o, k) => { const on = sel.includes(String(k)); return (
        <button key={k} disabled={!!verdict} role="checkbox" aria-checked={on} onClick={() => setAnswer(on ? sel.filter((x) => x !== String(k)) : [...sel, String(k)])} className={cn("flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition", on ? "border-oxford bg-oxford-50" : "border-line hover:border-oxford-300")}><span className={cn("flex h-5 w-5 items-center justify-center rounded border", on ? "border-oxford bg-oxford text-white" : "border-slate-300")}>{on && "✓"}</span>{o}</button>); })}</div>;
    }
    if (q.type === "tf") return <div className="flex gap-3" role="radiogroup">{["True", "False"].map((o) => <button key={o} role="radio" aria-checked={cur === o} disabled={!!verdict} onClick={() => setAnswer(o)} className={cn("flex-1 rounded-xl border-2 py-3 text-sm font-medium transition", cur === o ? "border-oxford bg-oxford-50" : "border-line hover:border-oxford-300")}>{o}</button>)}</div>;
    if (q.type === "fill" || q.type === "numerical") return <Input value={(cur as string) ?? ""} disabled={!!verdict} onChange={(e) => setAnswer(e.target.value)} placeholder={q.type === "numerical" ? "Enter a number" : "Type your answer"} aria-label="Your answer" className="max-w-sm" />;
    if (q.type === "short" || q.type === "long") return <div><Textarea rows={q.type === "long" ? 8 : 4} value={(cur as string) ?? ""} disabled={!!verdict} onChange={(e) => setAnswer(e.target.value)} placeholder="Write your answer…" aria-label="Your answer" /><p className="mt-1 text-xs text-slate-400">{((cur as string) ?? "").trim().split(/\s+/).filter(Boolean).length} words · scored by keyword matching in this prototype</p></div>;
    return <div className="space-y-2" role="radiogroup">{q.options!.map((o, k) => { const on = cur === String(k); const right = verdict && String(k) === q.answer; return (
      <button key={k} role="radio" aria-checked={on} disabled={!!verdict} onClick={() => setAnswer(String(k))} className={cn("flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition", right ? "border-success bg-success-50" : on && verdict ? "border-crimson bg-crimson-50" : on ? "border-oxford bg-oxford-50" : "border-line hover:border-oxford-300")}><span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", on ? "border-oxford bg-oxford text-white" : "border-slate-300 text-slate-500")}>{String.fromCharCode(65 + k)}</span>{o}</button>); })}</div>;
  };

  const lowTime = timeLeft !== null && timeLeft < 60;

  return (
    <div className={cn("mx-auto", config.examStyle ? "max-w-6xl" : "max-w-3xl")}>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl2 border border-line bg-white p-3 shadow-card">
        <div className="min-w-0 flex-1"><p className="truncate font-semibold text-oxford">{config.title}</p><p className="text-xs text-slate-500">Question {i + 1} of {total}{config.adaptive && <span className="ml-2"><Badge tone="blue">Adaptive · {q.difficulty}</Badge></span>}</p></div>
        <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-semibold", lowTime ? "bg-crimson-50 text-crimson" : "bg-oxford-50 text-oxford")} role="timer" aria-label="Timer"><Clock className="h-4 w-4" />{formatTime(timeLeft ?? elapsed)}</div>
        <Button variant="ghost" size="sm" onClick={() => setExitAsk(true)}>Exit</Button>
      </div>
      <Progress value={((i + 1) / total) * 100} tone="blue" className="mb-4" />

      <div className={cn("grid gap-4", config.showNavPanel && "lg:grid-cols-[1fr_280px]")}>
        <Card className="p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2"><Badge tone="blue">{TYPE_LABEL[q.type]}</Badge><Badge tone="neutral">{q.chapter}</Badge><Badge tone={q.difficulty === "Easy" ? "green" : q.difficulty === "Medium" ? "amber" : "red"}>{q.difficulty}</Badge><span className="ml-auto text-xs text-slate-500">{q.marks} mark{q.marks > 1 ? "s" : ""}</span></div>
          {q.passage && <div className="mb-3 rounded-xl border-l-4 border-sun bg-sun-50 p-3 text-sm text-ink"><b>Read the passage: </b>{q.passage}</div>}
          <p className="mb-4 whitespace-pre-line text-lg font-medium text-oxford dark:text-white">{q.text}</p>
          <Opts />
          {hint[q.id] && !verdict && <p className="mt-3 rounded-lg bg-sun-50 px-3 py-2 text-sm"><b>Hint: </b>Re-read the question and think about which rule or formula from <b>{q.topic}</b> applies.</p>}
          {verdict && (
            <div role="status" className={cn("mt-4 rounded-xl border p-4 text-sm", verdict.status === "correct" ? "border-success/40 bg-success-50" : verdict.status === "partial" ? "border-warn/40 bg-warn-50" : "border-crimson/30 bg-crimson-50")}>
              <p className="flex items-center gap-2 font-semibold">{verdict.status === "correct" ? <><CheckCircle2 className="h-4 w-4 text-success-700" />Correct</> : verdict.status === "partial" ? <><AlertTriangle className="h-4 w-4 text-warn-700" />Partially correct</> : <><XCircle className="h-4 w-4 text-crimson" />Not quite</>}<span className="font-normal text-slate-500">· {verdict.score}/{q.marks}</span></p>
              <p className="mt-1.5 text-slate-700">{q.explanation}</p>
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button variant={marked.has(q.id) ? "yellow" : "outline"} size="sm" onClick={() => setMarked((m) => { const x = new Set(m); x.has(q.id) ? x.delete(q.id) : x.add(q.id); return x; })}><Flag className="h-4 w-4" />{marked.has(q.id) ? "Marked" : "Mark for review"}</Button>
            {config.instantFeedback && !verdict && <Button variant="ghost" size="sm" onClick={() => setHint((h) => ({ ...h, [q.id]: true }))}><Lightbulb className="h-4 w-4" />Hint</Button>}
            <div className="flex-1" />
            {!config.adaptive && <Button variant="outline" size="sm" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft className="h-4 w-4" />Previous</Button>}
            {config.instantFeedback && !verdict ? (
              <Button disabled={!canCheck} onClick={() => setChecked((c) => ({ ...c, [q.id]: true }))}>Check answer</Button>
            ) : (
              <Button onClick={goNext}>{(config.adaptive ? qs.length >= total : i === qs.length - 1) ? <>Finish<Send className="h-4 w-4" /></> : <>Next<ChevronRight className="h-4 w-4" /></>}</Button>
            )}
          </div>
        </Card>

        {config.showNavPanel && (
          <Card className="h-fit p-4">
            <p className="mb-3 font-semibold text-oxford">Question palette</p>
            <div className="grid grid-cols-5 gap-2">{qs.map((qq, k) => { const st = statusOf(qq); return (
              <button key={qq.id} onClick={() => setI(k)} aria-label={`Question ${k + 1}, ${st}`} className={cn("h-10 rounded-lg border text-sm font-medium", k === i && "ring-2 ring-crimson ring-offset-1", st === "answered" ? "border-success bg-success text-white" : st === "marked" ? "border-sun bg-sun text-oxford" : "border-line bg-white text-slate-600")}>{k + 1}</button>); })}</div>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-500"><li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-success" />Answered</li><li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-sun" />Marked for review</li><li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-line" />Not answered</li></ul>
            <Button className="mt-4 w-full justify-center" variant="accent" onClick={() => setConfirm(true)}>Submit test</Button>
          </Card>
        )}
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Submit your test?" footer={<><Button variant="outline" onClick={() => setConfirm(false)}>Keep working</Button><Button variant="accent" onClick={submit}>Submit now</Button></>}>
        <p className="text-sm text-slate-600">You have answered <b>{total - unanswered}</b> of {total} questions{marked.size ? ` and marked ${marked.size} for review` : ""}. {unanswered > 0 ? `${unanswered} unanswered question${unanswered > 1 ? "s" : ""} will score zero.` : "Everything is answered."}</p>
      </Modal>
      <Modal open={exitAsk} onClose={() => setExitAsk(false)} title="Leave this test?" footer={<><Button variant="outline" onClick={() => setExitAsk(false)}>Continue test</Button><Button variant="danger" onClick={onExit}>Leave without submitting</Button></>}>
        <p className="text-sm text-slate-600">Your answers for this attempt will be discarded.</p>
      </Modal>
    </div>
  );
}
