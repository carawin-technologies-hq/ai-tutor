/** Progress figures computed from real attempts, lessons and activity (replaces the app's demo numbers). */
import { prisma } from "../db.js";

const DAY = 864e5;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const pct = (got: number, max: number) => (max > 0 ? Math.round((got / max) * 100) : null);

export async function studentProgress(studentId: string) {
  const now = new Date();
  const since90 = new Date(now.getTime() - 90 * DAY);
  const since6m = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [profile, items, tests, activities, lessonsDone, lessonCounts] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: studentId } }),
    // Every graded answer in the last 90 days, with its subject/chapter.
    prisma.attemptItem.findMany({
      where: { attempt: { studentId, submittedAt: { gte: since90 } }, verdict: { not: null } },
      select: { score: true, verdict: true, question: { select: { marks: true, chapter: { select: { subject: true, name: true } } } } },
    }),
    prisma.attempt.findMany({ where: { studentId, mode: "TEST", submittedAt: { not: null } }, orderBy: { submittedAt: "desc" }, take: 8, select: { id: true, title: true, score: true, maxScore: true, submittedAt: true } }),
    prisma.activity.findMany({ where: { studentId, createdAt: { gte: since6m } }, orderBy: { createdAt: "desc" } }),
    prisma.lessonProgress.findMany({ where: { studentId, state: "COMPLETED" }, select: { lesson: { select: { chapter: { select: { subject: true } } } } } }),
    profile_lessons(studentId),
  ]);

  // Subjects & chapters (topic mastery).
  const subj = new Map<string, { got: number; max: number; chapters: Map<string, { got: number; max: number }> }>();
  let answered = 0, correct = 0;
  for (const it of items) {
    const s = it.question.chapter.subject, c = it.question.chapter.name;
    const e = subj.get(s) ?? { got: 0, max: 0, chapters: new Map() };
    e.got += it.score; e.max += it.question.marks;
    const ch = e.chapters.get(c) ?? { got: 0, max: 0 };
    ch.got += it.score; ch.max += it.question.marks; e.chapters.set(c, ch);
    subj.set(s, e);
    if (it.verdict !== "skipped") answered++;
    if (it.verdict === "correct") correct++;
  }
  const doneBySubject = new Map<string, number>();
  for (const l of lessonsDone) doneBySubject.set(l.lesson.chapter.subject, (doneBySubject.get(l.lesson.chapter.subject) ?? 0) + 1);

  const subjectNames = Array.from(new Set([...(profile?.subjects ?? []), ...subj.keys()]));
  const subjects = subjectNames.map((name) => {
    const e = subj.get(name);
    const total = lessonCounts.get(name) ?? 0;
    return {
      subject: name,
      score: e ? pct(e.got, e.max) : null,
      progress: total ? Math.round(((doneBySubject.get(name) ?? 0) / total) * 100) : null,
    };
  });
  const topicMastery = Object.fromEntries(Array.from(subj, ([s, e]) => [s, Array.from(e.chapters, ([topic, x]) => ({ topic, pct: pct(x.got, x.max) ?? 0 })).sort((a, b) => b.pct - a.pct)]));

  // Weekly minutes (last 7 days, oldest first).
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(now.getTime() - (6 - i) * DAY); return { date: dayKey(d), day: d.toLocaleDateString("en-IN", { weekday: "short" }), minutes: 0 }; });
  const weekIdx = new Map(week.map((w, i) => [w.date, i]));
  for (const a of activities) { const i = weekIdx.get(dayKey(a.createdAt)); if (i !== undefined) week[i].minutes += a.minutes; }
  week.forEach((w) => (w.minutes = Math.round(w.minutes)));

  // Monthly trend (accuracy from submitted attempts, hours from activity).
  const monthly = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleDateString("en-IN", { month: "short" }), got: 0, max: 0, minutes: 0 }; });
  const mIdx = new Map(monthly.map((m, i) => [m.key, i]));
  for (const a of activities) { const i = mIdx.get(`${a.createdAt.getFullYear()}-${a.createdAt.getMonth()}`); if (i !== undefined) monthly[i].minutes += a.minutes; }
  const monthAttempts = await prisma.attempt.findMany({ where: { studentId, submittedAt: { gte: since6m } }, select: { submittedAt: true, score: true, maxScore: true } });
  for (const a of monthAttempts) { const i = mIdx.get(`${a.submittedAt!.getFullYear()}-${a.submittedAt!.getMonth()}`); if (i !== undefined) { monthly[i].got += a.score ?? 0; monthly[i].max += a.maxScore ?? 0; } }

  // Streak: consecutive days (ending today or yesterday) with any activity.
  const days = new Set(activities.map((a) => dayKey(a.createdAt)));
  let streak = 0;
  for (let d = days.has(dayKey(now)) ? now : new Date(now.getTime() - DAY); days.has(dayKey(d)); d = new Date(d.getTime() - DAY)) streak++;

  const totalMinutes = activities.reduce((s, a) => s + a.minutes, 0);
  const allGot = Array.from(subj.values()).reduce((s, e) => s + e.got, 0), allMax = Array.from(subj.values()).reduce((s, e) => s + e.max, 0);

  return {
    totals: { hours: Math.round((totalMinutes / 60) * 10) / 10, lessonsCompleted: lessonsDone.length, questionsAnswered: answered, correct, averageScore: pct(allGot, allMax), streakDays: streak },
    subjects,
    topicMastery,
    weeklyActivity: week,
    monthlyTrend: monthly.map((m) => ({ month: m.month, accuracy: pct(m.got, m.max), hours: Math.round((m.minutes / 60) * 10) / 10 })),
    testScores: tests.reverse().map((t) => ({ id: t.id, test: t.title, score: pct(t.score ?? 0, t.maxScore ?? 0), date: t.submittedAt })),
    recentActivity: activities.slice(0, 12).map((a) => ({ kind: a.kind, summary: a.summary, minutes: a.minutes, subject: a.subject, at: a.createdAt })),
  };

  async function profile_lessons(_id: string) {
    // Published lessons per subject for the student's board and class.
    const p = await prisma.studentProfile.findUnique({ where: { userId: _id } });
    const rows = await prisma.lesson.findMany({ where: { status: "PUBLISHED", chapter: p ? { board: p.board, classLevel: p.classLevel } : undefined }, select: { chapter: { select: { subject: true } } } });
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.chapter.subject, (m.get(r.chapter.subject) ?? 0) + 1));
    return m;
  }
}

/** Strongest/weakest chapters, homework and plan completion — the parent report extras. */
export async function parentReport(studentId: string) {
  const progress = await studentProgress(studentId);
  const mastery = Object.values(progress.topicMastery).flat();
  const sorted = [...mastery].sort((a, b) => b.pct - a.pct);
  const today = dayKey(new Date());
  const weekAgo = dayKey(new Date(Date.now() - 7 * DAY));
  const tasks = await prisma.plannerTask.findMany({ where: { studentId, date: { gte: weekAgo, lte: today } } });
  const homework = tasks.filter((t) => t.kind === "HOMEWORK");
  return {
    ...progress,
    strengths: sorted.slice(0, 3),
    weaknesses: sorted.filter((m) => m.pct < 70).slice(-3).reverse(),
    homework: { done: homework.filter((t) => t.done).length, total: homework.length },
    plan: { done: tasks.filter((t) => t.done).length, total: tasks.length },
  };
}
