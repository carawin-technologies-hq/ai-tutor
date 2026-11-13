/** Admin tools: users, curriculum, question bank, tests, lessons, videos, library, content items, settings, stats. */
import { Router } from "express";
import { z } from "zod";
import { prisma, Prisma } from "../db.js";
import { hashPassword, newInviteCode, publicUser } from "../lib/auth.js";
import { badRequest, body, conflict, notFound, Pagination, paged, query } from "../lib/http.js";
import { me, requireAuth, requireRole } from "../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("ADMIN"));

const id = (req: { params: Record<string, unknown> }) => String(req.params.id);
const contains = (s?: string) => (s ? { contains: s, mode: "insensitive" as const } : undefined);

// ───────── Dashboard ─────────
adminRouter.get("/stats", async (_req, res) => {
  const since = new Date(Date.now() - 7 * 864e5);
  const [students, parents, activeStudents, questions, assessments, attempts, conversations, activity] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.user.count({ where: { role: "STUDENT", lastActiveAt: { gte: since } } }),
    prisma.question.count(),
    prisma.assessment.count({ where: { status: "PUBLISHED" } }),
    prisma.attempt.count({ where: { submittedAt: { gte: since } } }),
    prisma.conversation.count({ where: { createdAt: { gte: since } } }),
    prisma.activity.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, studentId: true } }),
  ]);
  const days = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10));
  const sessions = days.map((d) => ({ date: d, day: new Date(d).toLocaleDateString("en-IN", { weekday: "short" }), activeStudents: new Set(activity.filter((a) => a.createdAt.toISOString().startsWith(d)).map((a) => a.studentId)).size }));
  res.json({ students, parents, activeStudents7d: activeStudents, questions, publishedTests: assessments, attempts7d: attempts, conversations7d: conversations, dailyActiveStudents: sessions });
});

// ───────── Users ─────────
adminRouter.get("/users", async (req, res) => {
  const q = query(req, Pagination.extend({ role: z.enum(["STUDENT", "PARENT", "ADMIN"]).optional(), status: z.enum(["ACTIVE", "INACTIVE"]).optional(), q: z.string().optional() }));
  const where: Prisma.UserWhereInput = { role: q.role, status: q.status, OR: q.q ? [{ name: contains(q.q) }, { email: contains(q.q) }] : undefined };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize,
      include: { studentProfile: { select: { classLevel: true, board: true, language: true } }, _count: { select: { parentLinks: true, attempts: true } } } }),
    prisma.user.count({ where }),
  ]);
  res.json(paged(users.map((u) => ({ ...publicUser(u), lastActiveAt: u.lastActiveAt, profile: u.studentProfile, children: u._count.parentLinks, attempts: u._count.attempts })), total, q.page, q.pageSize));
});
const NewUser = z.object({ name: z.string().min(2).max(80), email: z.email().transform((e) => e.toLowerCase()), password: z.string().min(8).max(128), role: z.enum(["STUDENT", "PARENT", "ADMIN"]) });
adminRouter.post("/users", async (req, res) => {
  const d = body(req, NewUser);
  if (await prisma.user.findUnique({ where: { email: d.email } })) throw conflict("An account with this email already exists.");
  const u = await prisma.user.create({ data: { name: d.name, email: d.email, role: d.role, passwordHash: await hashPassword(d.password),
    studentProfile: d.role === "STUDENT" ? { create: { inviteCode: newInviteCode() } } : undefined } });
  res.status(201).json(publicUser(u));
});
adminRouter.patch("/users/:id", async (req, res) => {
  const d = body(req, z.object({ status: z.enum(["ACTIVE", "INACTIVE"]).optional(), name: z.string().min(2).max(80).optional() }));
  if (id(req) === me(req).id && d.status === "INACTIVE") throw badRequest("You can't deactivate your own account.");
  const u = await prisma.user.update({ where: { id: id(req) }, data: d });
  if (d.status === "INACTIVE") await prisma.session.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
  res.json(publicUser(u));
});

// ───────── Curriculum ─────────
// "order" has no schema default so partial updates don't reset it (the database defaults it to 0 on create).
const ChapterIn = z.object({ board: z.string().min(1), classLevel: z.string().min(1), subject: z.string().min(1), name: z.string().min(1).max(160), order: z.number().int().optional() });
const TopicIn = z.object({ chapterId: z.string(), name: z.string().min(1).max(160), objectives: z.string().max(2000).optional(), order: z.number().int().optional() });
adminRouter.get("/chapters", async (req, res) => {
  const q = query(req, z.object({ board: z.string().optional(), classLevel: z.string().optional(), subject: z.string().optional() }));
  res.json(await prisma.chapter.findMany({ where: q, orderBy: [{ board: "asc" }, { classLevel: "asc" }, { subject: "asc" }, { order: "asc" }],
    include: { topics: { orderBy: { order: "asc" } }, _count: { select: { questions: true, lessons: true } } } }));
});
adminRouter.post("/chapters", async (req, res) => res.status(201).json(await prisma.chapter.create({ data: body(req, ChapterIn) })));
adminRouter.patch("/chapters/:id", async (req, res) => res.json(await prisma.chapter.update({ where: { id: id(req) }, data: body(req, ChapterIn.partial()) })));
adminRouter.delete("/chapters/:id", async (req, res) => { await prisma.chapter.delete({ where: { id: id(req) } }); res.status(204).end(); });
adminRouter.post("/topics", async (req, res) => res.status(201).json(await prisma.topic.create({ data: body(req, TopicIn) })));
adminRouter.patch("/topics/:id", async (req, res) => res.json(await prisma.topic.update({ where: { id: id(req) }, data: body(req, TopicIn.omit({ chapterId: true }).partial()) })));
adminRouter.delete("/topics/:id", async (req, res) => { await prisma.topic.delete({ where: { id: id(req) } }); res.status(204).end(); });

// ───────── Question bank ─────────
const TYPES = ["mcq", "multi", "tf", "fill", "short", "long", "numerical", "case", "assertion", "competency"] as const;
const QuestionIn = z.object({
  chapterId: z.string(), topicId: z.string().nullable().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]), type: z.enum(TYPES),
  text: z.string().min(1).max(5000), passage: z.string().max(5000).nullable().optional(),
  options: z.array(z.string().max(500)).max(8).default([]),
  answer: z.union([z.string().max(5000), z.array(z.string().max(5)).max(8)]),
  explanation: z.string().max(5000).default(""), marks: z.number().int().min(1).max(20).default(1),
  keywords: z.array(z.string().max(60)).max(20).default([]),
  status: z.enum(["APPROVED", "IN_REVIEW", "DRAFT"]).default("DRAFT"),
}).superRefine((q, ctx) => {
  const choice = ["mcq", "multi", "case", "assertion", "competency"].includes(q.type);
  if (choice && q.options.length < 2) ctx.addIssue({ code: "custom", path: ["options"], message: "Choice questions need at least 2 options." });
  if (q.type === "multi" && !Array.isArray(q.answer)) ctx.addIssue({ code: "custom", path: ["answer"], message: "Multiple-select answers are a list of option indexes." });
  if (choice && q.type !== "multi" && (Array.isArray(q.answer) || !(Number(q.answer) >= 0 && Number(q.answer) < q.options.length))) ctx.addIssue({ code: "custom", path: ["answer"], message: "Answer must be the index of a correct option (\"0\", \"1\"…)." });
  if ((q.type === "short" || q.type === "long") && q.keywords.length === 0) ctx.addIssue({ code: "custom", path: ["keywords"], message: "Add keywords so written answers can be marked." });
});
adminRouter.get("/questions", async (req, res) => {
  const q = query(req, Pagination.extend({
    chapterId: z.string().optional(), subject: z.string().optional(), type: z.enum(TYPES).optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(), status: z.enum(["APPROVED", "IN_REVIEW", "DRAFT"]).optional(), q: z.string().optional(),
  }));
  const where: Prisma.QuestionWhereInput = { chapterId: q.chapterId, type: q.type, difficulty: q.difficulty, status: q.status, text: contains(q.q), chapter: q.subject ? { subject: q.subject } : undefined };
  const [items, total] = await Promise.all([
    prisma.question.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize, include: { chapter: true, topic: true } }),
    prisma.question.count({ where }),
  ]);
  res.json(paged(items, total, q.page, q.pageSize));
});
adminRouter.post("/questions", async (req, res) => res.status(201).json(await prisma.question.create({ data: { ...body(req, QuestionIn), createdById: me(req).id } })));
adminRouter.put("/questions/:id", async (req, res) => res.json(await prisma.question.update({ where: { id: id(req) }, data: body(req, QuestionIn) })));
adminRouter.patch("/questions/:id/status", async (req, res) => {
  const { status } = body(req, z.object({ status: z.enum(["APPROVED", "IN_REVIEW", "DRAFT"]) }));
  res.json(await prisma.question.update({ where: { id: id(req) }, data: { status } }));
});
adminRouter.delete("/questions/:id", async (req, res) => { await prisma.question.delete({ where: { id: id(req) } }); res.status(204).end(); });

// ───────── Tests ─────────
const AssessmentIn = z.object({
  name: z.string().min(1).max(160), type: z.enum(["CHAPTER_TEST", "UNIT_TEST", "SAMPLE_PAPER", "REVISION_TEST"]),
  board: z.string(), classLevel: z.string(), subject: z.string().nullable().optional(), minutes: z.number().int().min(1).max(300),
  status: z.enum(["PUBLISHED", "DRAFT"]).default("DRAFT"), questionIds: z.array(z.string()).max(200).default([]),
});
adminRouter.get("/assessments", async (_req, res) => {
  res.json(await prisma.assessment.findMany({ orderBy: { updatedAt: "desc" }, include: { _count: { select: { questions: true, attempts: true } } } }));
});
adminRouter.get("/assessments/:id", async (req, res) => {
  const a = await prisma.assessment.findUnique({ where: { id: id(req) }, include: { questions: { orderBy: { order: "asc" }, include: { question: true } } } });
  if (!a) throw notFound("Test");
  res.json(a);
});
const qLinks = (ids: string[]) => ({ create: ids.map((questionId, order) => ({ questionId, order })) });
adminRouter.post("/assessments", async (req, res) => {
  const { questionIds, ...d } = body(req, AssessmentIn);
  res.status(201).json(await prisma.assessment.create({ data: { ...d, questions: qLinks(questionIds) } }));
});
adminRouter.put("/assessments/:id", async (req, res) => {
  const { questionIds, ...d } = body(req, AssessmentIn);
  const [, a] = await prisma.$transaction([
    prisma.assessmentQuestion.deleteMany({ where: { assessmentId: id(req) } }),
    prisma.assessment.update({ where: { id: id(req) }, data: { ...d, questions: qLinks(questionIds) } }),
  ]);
  res.json(a);
});
adminRouter.delete("/assessments/:id", async (req, res) => { await prisma.assessment.delete({ where: { id: id(req) } }); res.status(204).end(); });

// ───────── Lessons, videos, library, content items ─────────
const LessonIn = z.object({ chapterId: z.string(), title: z.string().min(1).max(160), objective: z.string().max(1000), beats: z.array(z.record(z.string(), z.unknown())).max(200), order: z.number().int().default(0), status: z.enum(["PUBLISHED", "DRAFT"]).default("DRAFT") });
adminRouter.get("/lessons", async (req, res) => {
  const q = query(req, z.object({ chapterId: z.string().optional() }));
  res.json(await prisma.lesson.findMany({ where: q, orderBy: [{ chapterId: "asc" }, { order: "asc" }], include: { chapter: true } }));
});
adminRouter.post("/lessons", async (req, res) => { const d = body(req, LessonIn); res.status(201).json(await prisma.lesson.create({ data: { ...d, beats: d.beats as Prisma.InputJsonValue } })); });
adminRouter.put("/lessons/:id", async (req, res) => { const d = body(req, LessonIn); res.json(await prisma.lesson.update({ where: { id: id(req) }, data: { ...d, beats: d.beats as Prisma.InputJsonValue } })); });
adminRouter.delete("/lessons/:id", async (req, res) => { await prisma.lesson.delete({ where: { id: id(req) } }); res.status(204).end(); });

const VideoIn = z.object({
  title: z.string().min(1).max(160), subject: z.string(), chapterId: z.string().nullable().optional(), topic: z.string().max(160).optional(),
  language: z.string().default("English"), duration: z.string().max(10).optional(), description: z.string().max(5000).default(""),
  url: z.url().nullable().optional(), objectives: z.array(z.string().max(300)).default([]), takeaways: z.array(z.string().max(300)).default([]),
  questions: z.array(z.object({ q: z.string(), options: z.array(z.string()).min(2), answer: z.number().int().min(0) })).default([]),
  status: z.enum(["PUBLISHED", "DRAFT"]).default("DRAFT"),
});
adminRouter.get("/videos", async (_req, res) => res.json(await prisma.video.findMany({ orderBy: { createdAt: "desc" } })));
adminRouter.post("/videos", async (req, res) => res.status(201).json(await prisma.video.create({ data: body(req, VideoIn) })));
adminRouter.put("/videos/:id", async (req, res) => res.json(await prisma.video.update({ where: { id: id(req) }, data: body(req, VideoIn) })));
adminRouter.delete("/videos/:id", async (req, res) => { await prisma.video.delete({ where: { id: id(req) } }); res.status(204).end(); });

const DocIn = z.object({ title: z.string().min(1).max(160), kind: z.enum(["TEXTBOOK", "NOTES", "WORKSHEET", "PDF"]), subject: z.string(), chapter: z.string().optional(), content: z.array(z.string().max(20_000)).max(500).default([]), fileUrl: z.url().nullable().optional() });
adminRouter.get("/library", async (_req, res) => res.json(await prisma.libraryDoc.findMany({ where: { ownerId: null }, orderBy: { createdAt: "desc" } })));
adminRouter.post("/library", async (req, res) => { const d = body(req, DocIn); res.status(201).json(await prisma.libraryDoc.create({ data: { ...d, pages: Math.max(1, d.content.length) } })); });
adminRouter.put("/library/:id", async (req, res) => { const d = body(req, DocIn); res.json(await prisma.libraryDoc.update({ where: { id: id(req), ownerId: null }, data: { ...d, pages: Math.max(1, d.content.length) } })); });
adminRouter.delete("/library/:id", async (req, res) => { await prisma.libraryDoc.delete({ where: { id: id(req), ownerId: null } }); res.status(204).end(); });

const ContentIn = z.object({ title: z.string().min(1).max(160), kind: z.string().max(60), subject: z.string(), chapter: z.string().optional(), language: z.string().default("English"), status: z.enum(["APPROVED", "IN_REVIEW", "DRAFT"]).default("DRAFT"), body: z.string().max(50_000).optional() });
adminRouter.get("/content", async (_req, res) => res.json(await prisma.contentItem.findMany({ orderBy: { updatedAt: "desc" } })));
adminRouter.post("/content", async (req, res) => res.status(201).json(await prisma.contentItem.create({ data: body(req, ContentIn) })));
adminRouter.put("/content/:id", async (req, res) => res.json(await prisma.contentItem.update({ where: { id: id(req) }, data: body(req, ContentIn) })));
adminRouter.delete("/content/:id", async (req, res) => { await prisma.contentItem.delete({ where: { id: id(req) } }); res.status(204).end(); });

// ───────── Settings (e.g. AI teacher configuration) ─────────
adminRouter.get("/settings", async (_req, res) => {
  const rows = await prisma.setting.findMany();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});
adminRouter.put("/settings/:key", async (req, res) => {
  const key = z.string().regex(/^[a-zA-Z0-9_.-]{1,60}$/).parse(req.params.key);
  const value = (req.body?.value ?? null) as Prisma.InputJsonValue;
  res.json(await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }));
});
