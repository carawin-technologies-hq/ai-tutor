export const CHILD_DETAIL: Record<string, {
  strengths: { topic: string; pct: number }[]; weaknesses: { topic: string; pct: number }[];
  homework: { done: number; total: number }; plan: { done: number; total: number };
  insight: string; recs: string[]; timeline: { date: string; text: string }[]; monthly: { month: string; avg: number; hours: number }[];
  weeklyLessons: number;
}> = {
  aarav: {
    strengths: [{ topic: "Linear Equations", pct: 92 }, { topic: "Exponents and Powers", pct: 85 }, { topic: "Crop Production", pct: 88 }],
    weaknesses: [{ topic: "Factorisation", pct: 38 }, { topic: "Secularism", pct: 52 }, { topic: "Cell Structure", pct: 58 }],
    homework: { done: 9, total: 11 }, plan: { done: 14, total: 19 }, weeklyLessons: 4,
    insight: "Aarav completed 4 Mathematics lessons this week. Performance in Linear Equations improved from 55% to 82%. Factorisation requires additional practice.",
    recs: ["Encourage 15 minutes of Factorisation practice on 3 days this week.", "Ask Aarav to explain the 'balance' idea of equations to you — teaching reinforces understanding.", "Unit Test 3 is in 14 days: plan one mock test this weekend.", "Celebrate the 12-day study streak — consistency is the biggest driver of progress."],
    timeline: [{ date: "Today", text: "Revised Factorisation (20 min) and solved 12 practice questions." }, { date: "Yesterday", text: "Completed lesson: Solving x + a = b. Scored 4/5 in quick practice." }, { date: "3 days ago", text: "Unit Test 2 (Mathematics): 81%." }, { date: "5 days ago", text: "Asked the AI teacher about the Pythagoras theorem." }, { date: "1 week ago", text: "Completed lesson: What is a linear equation?" }],
    monthly: [{ month: "Aug", avg: 67, hours: 14 }, { month: "Sep", avg: 71, hours: 16 }, { month: "Oct", avg: 74, hours: 18 }, { month: "Nov", avg: 76, hours: 11 }],
  },
  diya: {
    strengths: [{ topic: "Fractions", pct: 90 }, { topic: "Reading Comprehension", pct: 88 }, { topic: "Plants around us", pct: 86 }],
    weaknesses: [{ topic: "Hindi grammar: Sandhi", pct: 56 }, { topic: "Perimeter and area", pct: 61 }],
    homework: { done: 7, total: 8 }, plan: { done: 10, total: 12 }, weeklyLessons: 3,
    insight: "Diya completed 3 lessons this week and her English score rose 6 points. Perimeter and area needs a little more practice.",
    recs: ["Try a short daily reading habit — Diya's comprehension is a strength.", "Use everyday objects (a book, a table) to practise perimeter and area.", "Hindi grammar: 10 minutes of Sandhi practice, twice this week."],
    timeline: [{ date: "Today", text: "Practised fractions — 9/10 correct." }, { date: "Yesterday", text: "Watched 'Plants around us' video." }, { date: "4 days ago", text: "Completed English comprehension test: 86%." }],
    monthly: [{ month: "Aug", avg: 78, hours: 8 }, { month: "Sep", avg: 80, hours: 9 }, { month: "Oct", avg: 82, hours: 10 }, { month: "Nov", avg: 84, hours: 6 }],
  },
};

export const PARENT_NOTICES = [
  { id: "pn1", title: "Weekly report ready", body: "Aarav's weekly learning report for 5–11 Nov is ready to view.", time: "Today", kind: "info" },
  { id: "pn2", title: "Revision recommended", body: "Factorisation accuracy is 38%. A short revision plan has been suggested.", time: "Today", kind: "warning" },
  { id: "pn3", title: "12-day study streak 🔥", body: "Aarav has studied 12 days in a row.", time: "Yesterday", kind: "success" },
  { id: "pn4", title: "Unit Test 3 in 14 days", body: "Mathematics syllabus completion: 72%.", time: "2 days ago", kind: "info" },
  { id: "pn5", title: "Diya completed a lesson", body: "Fractions: Equivalent fractions.", time: "3 days ago", kind: "success" },
];
