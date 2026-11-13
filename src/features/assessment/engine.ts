import type { Question } from "@/types";

export type Answer = string | string[];
export interface Verdict { status: "correct" | "partial" | "wrong" | "skipped"; score: number }

const n = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function evaluate(q: Question, a: Answer | undefined): Verdict {
  if (a === undefined || (Array.isArray(a) ? a.length === 0 : a.trim() === "")) return { status: "skipped", score: 0 };
  switch (q.type) {
    case "multi": {
      const got = [...(a as string[])].sort().join(","); const want = [...(q.answer as string[])].sort().join(",");
      return got === want ? { status: "correct", score: q.marks } : { status: "wrong", score: 0 };
    }
    case "fill": case "numerical": case "tf":
      return n(a as string) === n(q.answer as string) ? { status: "correct", score: q.marks } : { status: "wrong", score: 0 };
    case "short": case "long": {
      const text = n(a as string); const kws = q.keywords ?? [];
      const hit = kws.filter((k) => text.includes(k.toLowerCase())).length;
      const ratio = kws.length ? hit / kws.length : 0;
      if (ratio >= 0.6) return { status: "correct", score: q.marks };
      if (ratio >= 0.3) return { status: "partial", score: Math.round(q.marks * 0.5 * 10) / 10 };
      return { status: "wrong", score: 0 };
    }
    default: // mcq, case, assertion, competency
      return a === q.answer ? { status: "correct", score: q.marks } : { status: "wrong", score: 0 };
  }
}

export function answerText(q: Question): string {
  if (q.options && (q.type === "multi")) return (q.answer as string[]).map((i) => q.options![+i]).join("; ");
  if (q.options) return q.options[+(q.answer as string)];
  return q.answer as string;
}
export function givenText(q: Question, a?: Answer): string {
  if (a === undefined || (Array.isArray(a) && !a.length) || a === "") return "Not answered";
  if (q.options && q.type === "multi") return (a as string[]).map((i) => q.options![+i]).join("; ");
  if (q.options) return q.options[+(a as string)];
  return a as string;
}

export interface SessionResult {
  title: string; total: number; maxScore: number; score: number; timeSpent: number;
  rows: { q: Question; a?: Answer; v: Verdict; time: number; marked: boolean }[];
}

export function topicBreakdown(r: SessionResult) {
  const m = new Map<string, { got: number; max: number }>();
  r.rows.forEach(({ q, v }) => { const k = q.chapter; const x = m.get(k) ?? { got: 0, max: 0 }; x.got += v.score; x.max += q.marks; m.set(k, x); });
  return Array.from(m, ([topic, x]) => ({ topic, pct: Math.round((x.got / x.max) * 100), got: x.got, max: x.max }));
}

const ORDER = ["Easy", "Medium", "Hard"] as const;
/** Adaptive: harder after a correct answer, easier after a wrong one. */
export function pickNext(pool: Question[], used: Set<string>, lastDiff: Question["difficulty"], lastCorrect: boolean | null): Question | undefined {
  let i = ORDER.indexOf(lastDiff);
  if (lastCorrect === true) i = Math.min(2, i + 1); else if (lastCorrect === false) i = Math.max(0, i - 1);
  const target = ORDER[i];
  const left = pool.filter((p) => !used.has(p.id));
  const byDist = [...left].sort((a, b) => Math.abs(ORDER.indexOf(a.difficulty) - i) - Math.abs(ORDER.indexOf(b.difficulty) - i));
  return left.find((p) => p.difficulty === target) ?? byDist[0];
}
