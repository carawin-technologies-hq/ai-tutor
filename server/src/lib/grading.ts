/**
 * Server-side grading — same rules as the app's assessment engine (src/features/assessment/engine.ts),
 * so scores never depend on the browser.
 */
import type { Question } from "../db.js";

export type Response = string | string[];
export interface Graded { verdict: "correct" | "partial" | "wrong" | "skipped"; score: number }

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
/** Numbers compare by value ("0.040" == "0.04"). */
const sameNumber = (a: string, b: string) => {
  const x = Number(a.replace(/,/g, "")), y = Number(b.replace(/,/g, ""));
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) < 1e-9;
};

export function grade(q: Pick<Question, "type" | "answer" | "marks" | "keywords">, r: Response | undefined | null): Graded {
  if (r === undefined || r === null || (Array.isArray(r) ? r.length === 0 : String(r).trim() === "")) return { verdict: "skipped", score: 0 };
  const answer = q.answer as unknown as Response;
  switch (q.type) {
    case "multi": {
      const got = [...(Array.isArray(r) ? r : [r])].map(String).sort().join(",");
      const want = [...(Array.isArray(answer) ? answer : [answer])].map(String).sort().join(",");
      return got === want ? { verdict: "correct", score: q.marks } : { verdict: "wrong", score: 0 };
    }
    case "numerical":
      return norm(String(r)) === norm(String(answer)) || sameNumber(String(r), String(answer)) ? { verdict: "correct", score: q.marks } : { verdict: "wrong", score: 0 };
    case "fill": case "tf":
      return norm(String(r)) === norm(String(answer)) ? { verdict: "correct", score: q.marks } : { verdict: "wrong", score: 0 };
    case "short": case "long": {
      const text = norm(String(r));
      const kws = q.keywords ?? [];
      const hit = kws.filter((k) => text.includes(k.toLowerCase())).length;
      const ratio = kws.length ? hit / kws.length : 0;
      if (ratio >= 0.6) return { verdict: "correct", score: q.marks };
      if (ratio >= 0.3) return { verdict: "partial", score: Math.round(q.marks * 0.5 * 10) / 10 };
      return { verdict: "wrong", score: 0 };
    }
    default: // mcq, case, assertion, competency — option index as a string
      return String(r) === String(answer) ? { verdict: "correct", score: q.marks } : { verdict: "wrong", score: 0 };
  }
}
