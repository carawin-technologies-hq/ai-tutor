/** Practice sessions and tests: questions are served without answers; grading happens here on the server. */
import { Router } from "express";
import { z } from "zod";
import { prisma, type Question } from "../db.js";
import { logActivity, notify, parentIdsOf } from "../lib/activity.js";
import { grade } from "../lib/grading.js";
import { badRequest, body, conflict, HttpError, notFound, Pagination, paged, query } from "../lib/http.js";
import { me, requireAuth, requireRole } from "../middleware/auth.js";

export const practiceRouter = Router();
// Guard only this router's own paths (it is mounted at the API root alongside other routers).
practiceRouter.use(["/practice", "/assessments", "/attempts"], requireAuth, requireRole("STUDENT"));

const DIFF = { Easy: "EASY", Medium: "MEDIUM", Hard: "HARD" } as const;
const TYPES = ["mcq", "multi", "tf", "fill", "short", "long", "numerical", "case", "assertion", "competency"] as const;

/** What a student may see before answering (no answer, explanation or keywords). */
const forStudent = (q: Question & { chapter?: { name: string; subject: string }; topic?: { name: string } | null }) => ({
  id: q.id, type: q.type, difficulty: q.difficulty, text: q.text, passage: q.passage, options: q.options, marks: q.marks,
  chapter: q.chapter?.name, subject: q.chapter?.subject, topic: q.topic?.name,
});
/** Full review after answering / submitting. */
const reveal = (q: Question) => ({ answer: q.answer, explanation: q.explanation });

const shuffle = <T>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

async function loadAttempt(id: string, studentId: string) {
  const a = await prisma.attempt.findFirst({
    where: { id, studentId },
    include: { items: { orderBy: { order: "asc" }, include: { question: { include: { chapter: true, topic: true } } } } },
  });
  if (!a) throw notFound("Attempt");
  return a;
}
const deadlinePassed = (a: { minutes: number | null; startedAt: Date }) => a.minutes != null && Date.now() > a.startedAt.getTime() + (a.minutes * 60 + 30) * 1000;

// ── Start a practice session ──
const NewPractice = z.object({
  subject: z.string().min(1),
  chapterId: z.string().optional(),
  topicId: z.string().optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  types: z.array(z.enum(TYPES)).optional(),
  count: z.number().int().min(1).max(30).default(10),
});
practiceRouter.post("/practice", async (req, res) => {
  const d = body(req, NewPractice);
  const studentId = me(req).id;
  const p = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
  const pool = await prisma.question.findMany({
    where: {
      status: "APPROVED",
      chapterId: d.chapterId, topicId: d.topicId,
      difficulty: d.difficulty ? DIFF[d.difficulty] : undefined,
      type: d.types?.length ? { in: d.types } : undefined,
      chapter: { subject: d.subject, board: p?.board, classLevel: p?.classLevel },
    },
    select: { id: true },
  });
  if (!pool.length) throw new HttpError(404, "no_questions", "No questions match these filters yet. Try another chapter or difficulty.");
  const picked = shuffle(pool).slice(0, d.count);
  const chapter = d.chapterId ? await prisma.chapter.findUnique({ where: { id: d.chapterId } }) : null;
  const attempt = await prisma.attempt.create({
    data: {
      studentId, mode: "PRACTICE", subject: d.subject, title: `Practice — ${chapter?.name ?? d.subject}`,
      items: { create: picked.map((q, order) => ({ questionId: q.id, order })) },
    },
  });
  res.status(201).json(await attemptView(attempt.id, studentId));
});

// ── Tests ──
practiceRouter.get("/assessments", async (req, res) => {
  const p = await prisma.studentProfile.findUnique({ where: { userId: me(req).id } });
  const list = await prisma.assessment.findMany({
    where: { status: "PUBLISHED", board: p?.board, classLevel: p?.classLevel },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } }, attempts: { where: { studentId: me(req).id, submittedAt: { not: null } }, select: { score: true, maxScore: true, submittedAt: true }, orderBy: { submittedAt: "desc" }, take: 1 } },
  });
  res.json(list.map(({ _count, attempts, ...a }) => ({ ...a, questionCount: _count.questions, lastResult: attempts[0] ?? null })));
});
practiceRouter.post("/assessments/:id/attempts", async (req, res) => {
  const a = await prisma.assessment.findFirst({ where: { id: String(req.params.id), status: "PUBLISHED" }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!a) throw notFound("Test");
  if (!a.questions.length) throw badRequest("This test has no questions yet.");
  const attempt = await prisma.attempt.create({
    data: {
      studentId: me(req).id, mode: "TEST", assessmentId: a.id, title: a.name, subject: a.subject, minutes: a.minutes,
      items: { create: a.questions.map((q, order) => ({ questionId: q.questionId, order })) },
    },
  });
  res.status(201).json(await attemptView(attempt.id, me(req).id));
});

// ── Answer one question ──
const Answer = z.object({
  questionId: z.string(),
  response: z.union([z.string().max(10_000), z.array(z.string().max(20)).max(20)]).nullable(),
  timeSec: z.number().int().min(0).max(36_000).default(0),
});
practiceRouter.post("/attempts/:id/answers", async (req, res) => {
  const d = body(req, Answer);
  const a = await loadAttempt(String(req.params.id), me(req).id);
  if (a.submittedAt) throw conflict("This attempt has already been submitted.");
  if (deadlinePassed(a)) throw new HttpError(409, "time_up", "Time is up for this test. Please submit it.");
  const item = a.items.find((i) => i.questionId === d.questionId);
  if (!item) throw notFound("Question in this attempt");
  const g = grade(item.question, d.response ?? undefined);
  await prisma.attemptItem.update({
    where: { attemptId_questionId: { attemptId: a.id, questionId: d.questionId } },
    data: { response: d.response ?? undefined, verdict: g.verdict, score: g.score, timeSec: d.timeSec, answeredAt: new Date() },
  });
  // Practice gives instant feedback; tests reveal answers only after submitting.
  res.json(a.mode === "PRACTICE" ? { ...g, ...reveal(item.question) } : { saved: true });
});

// ── Submit ──
practiceRouter.post("/attempts/:id/submit", async (req, res) => {
  const studentId = me(req).id;
  const a = await loadAttempt(String(req.params.id), studentId);
  if (a.submittedAt) throw conflict("This attempt has already been submitted.");
  const score = a.items.reduce((s, i) => s + i.score, 0);
  const maxScore = a.items.reduce((s, i) => s + i.question.marks, 0);
  const unanswered = a.items.filter((i) => !i.verdict).map((i) => i.questionId);
  await prisma.$transaction([
    prisma.attemptItem.updateMany({ where: { attemptId: a.id, questionId: { in: unanswered } }, data: { verdict: "skipped", score: 0 } }),
    prisma.attempt.update({ where: { id: a.id }, data: { submittedAt: new Date(), score, maxScore } }),
  ]);
  const minutes = Math.min((Date.now() - a.startedAt.getTime()) / 60_000, a.minutes ?? 180);
  const pct = maxScore ? Math.round((score / maxScore) * 100) : 0;
  await logActivity(studentId, a.mode === "TEST" ? "TEST" : "PRACTICE", minutes, `${a.title}: ${score}/${maxScore} (${pct}%)`, a.subject);
  if (a.mode === "TEST") {
    const s = await prisma.user.findUniqueOrThrow({ where: { id: studentId } });
    await notify(await parentIdsOf(studentId), `${s.name} finished a test`, `${a.title}: scored ${pct}%.`, pct >= 60 ? "success" : "warning");
  }
  res.json(await resultView(a.id, studentId));
});

practiceRouter.get("/attempts", async (req, res) => {
  const q = query(req, Pagination.extend({ mode: z.enum(["PRACTICE", "TEST"]).optional() }));
  const where = { studentId: me(req).id, mode: q.mode, submittedAt: { not: null } };
  const [items, total] = await Promise.all([
    prisma.attempt.findMany({ where, orderBy: { submittedAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize,
      select: { id: true, title: true, mode: true, subject: true, score: true, maxScore: true, startedAt: true, submittedAt: true } }),
    prisma.attempt.count({ where }),
  ]);
  res.json(paged(items, total, q.page, q.pageSize));
});

practiceRouter.get("/attempts/:id", async (req, res) => {
  const a = await prisma.attempt.findFirst({ where: { id: String(req.params.id), studentId: me(req).id } });
  if (!a) throw notFound("Attempt");
  res.json(a.submittedAt ? await resultView(a.id, me(req).id) : await attemptView(a.id, me(req).id));
});

/** In-progress view: questions without answers, plus what's been answered so far. */
async function attemptView(id: string, studentId: string) {
  const a = await loadAttempt(id, studentId);
  return {
    id: a.id, mode: a.mode, title: a.title, subject: a.subject, startedAt: a.startedAt, minutes: a.minutes,
    endsAt: a.minutes ? new Date(a.startedAt.getTime() + a.minutes * 60_000) : null,
    questions: a.items.map((i) => ({ ...forStudent(i.question), answered: !!i.verdict, response: i.response,
      ...(a.mode === "PRACTICE" && i.verdict ? { verdict: i.verdict, score: i.score, ...reveal(i.question) } : {}) })),
  };
}

/** Result view: every question with the student's answer, the right answer, explanation and per-chapter breakdown. */
async function resultView(id: string, studentId: string) {
  const a = await loadAttempt(id, studentId);
  const byChapter = new Map<string, { got: number; max: number }>();
  for (const i of a.items) {
    const k = i.question.chapter.name; const x = byChapter.get(k) ?? { got: 0, max: 0 };
    x.got += i.score; x.max += i.question.marks; byChapter.set(k, x);
  }
  return {
    id: a.id, mode: a.mode, title: a.title, subject: a.subject, startedAt: a.startedAt, submittedAt: a.submittedAt,
    score: a.score, maxScore: a.maxScore, percent: a.maxScore ? Math.round(((a.score ?? 0) / a.maxScore) * 100) : 0,
    timeSpentSec: a.items.reduce((s, i) => s + i.timeSec, 0),
    breakdown: Array.from(byChapter, ([chapter, x]) => ({ chapter, got: x.got, max: x.max, pct: x.max ? Math.round((x.got / x.max) * 100) : 0 })),
    rows: a.items.map((i) => ({ ...forStudent(i.question), ...reveal(i.question), response: i.response, verdict: i.verdict, score: i.score, timeSec: i.timeSec })),
  };
}
