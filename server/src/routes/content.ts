/** Learning content for signed-in users: curriculum, lessons, videos, library, notifications. */
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { logActivity } from "../lib/activity.js";
import { body, notFound, query } from "../lib/http.js";
import { me, requireAuth, requireRole } from "../middleware/auth.js";

export const contentRouter = Router();
// Guard only this router's own paths (it is mounted at the API root alongside other routers).
contentRouter.use(["/curriculum", "/lessons", "/videos", "/library", "/notifications"], requireAuth);

/** Defaults board/class to the signed-in student's profile. */
async function scope(userId: string, q: { board?: string; classLevel?: string }) {
  if (q.board && q.classLevel) return { board: q.board, classLevel: q.classLevel };
  const p = await prisma.studentProfile.findUnique({ where: { userId } });
  return { board: q.board ?? p?.board ?? "CBSE", classLevel: q.classLevel ?? p?.classLevel ?? "8" };
}

// ── Curriculum tree: subjects → chapters → topics ──
contentRouter.get("/curriculum", async (req, res) => {
  const q = query(req, z.object({ board: z.string().optional(), classLevel: z.string().optional(), subject: z.string().optional() }));
  const s = await scope(me(req).id, q);
  const chapters = await prisma.chapter.findMany({
    where: { ...s, subject: q.subject }, orderBy: [{ subject: "asc" }, { order: "asc" }],
    include: { topics: { orderBy: { order: "asc" } } },
  });
  const subjects: Record<string, typeof chapters> = {};
  for (const c of chapters) (subjects[c.subject] ??= []).push(c);
  res.json({ ...s, subjects });
});

// ── Lessons ──
contentRouter.get("/lessons", async (req, res) => {
  const q = query(req, z.object({ chapterId: z.string().optional(), subject: z.string().optional() }));
  const s = await scope(me(req).id, {});
  const lessons = await prisma.lesson.findMany({
    where: { status: "PUBLISHED", chapterId: q.chapterId, chapter: q.chapterId ? undefined : { ...s, subject: q.subject } },
    orderBy: [{ chapterId: "asc" }, { order: "asc" }],
    select: { id: true, title: true, objective: true, order: true, chapter: { select: { id: true, name: true, subject: true } },
      progress: { where: { studentId: me(req).id }, select: { state: true, completedAt: true } } },
  });
  res.json(lessons.map(({ progress, ...l }) => ({ ...l, state: progress[0]?.state ?? null })));
});
contentRouter.get("/lessons/:id", async (req, res) => {
  const l = await prisma.lesson.findFirst({ where: { id: String(req.params.id), status: "PUBLISHED" }, include: { chapter: true } });
  if (!l) throw notFound("Lesson");
  res.json(l);
});
contentRouter.post("/lessons/:id/progress", requireRole("STUDENT"), async (req, res) => {
  const d = body(req, z.object({ state: z.enum(["IN_PROGRESS", "COMPLETED"]), minutes: z.number().min(0).max(240).default(0) }));
  const lessonId = String(req.params.id), studentId = me(req).id;
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { chapter: true } });
  if (!lesson) throw notFound("Lesson");
  const completedAt = d.state === "COMPLETED" ? new Date() : null;
  const p = await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    create: { studentId, lessonId, state: d.state, completedAt }, update: { state: d.state, completedAt },
  });
  if (d.minutes > 0 || d.state === "COMPLETED") await logActivity(studentId, "LESSON", d.minutes, `${d.state === "COMPLETED" ? "Completed" : "Studied"} lesson: ${lesson.title}`, lesson.chapter.subject);
  res.json(p);
});

// ── Videos ──
contentRouter.get("/videos", async (req, res) => {
  const q = query(req, z.object({ subject: z.string().optional(), language: z.string().optional(), chapterId: z.string().optional() }));
  res.json(await prisma.video.findMany({ where: { status: "PUBLISHED", ...q }, orderBy: { createdAt: "desc" } }));
});
contentRouter.get("/videos/:id", async (req, res) => {
  const v = await prisma.video.findFirst({ where: { id: String(req.params.id), status: "PUBLISHED" } });
  if (!v) throw notFound("Video");
  res.json(v);
});
contentRouter.post("/videos/:id/watched", requireRole("STUDENT"), async (req, res) => {
  const { minutes } = body(req, z.object({ minutes: z.number().min(0).max(240) }));
  const v = await prisma.video.findUnique({ where: { id: String(req.params.id) } });
  if (!v) throw notFound("Video");
  await logActivity(me(req).id, "VIDEO", minutes, `Watched video: ${v.title}`, v.subject);
  res.status(204).end();
});

// ── Library: platform documents + the student's own ──
const KindEnum = z.enum(["TEXTBOOK", "NOTES", "WORKSHEET", "PDF"]);
contentRouter.get("/library", async (req, res) => {
  const q = query(req, z.object({ subject: z.string().optional(), kind: KindEnum.optional(), q: z.string().optional() }));
  const userId = me(req).id;
  const docs = await prisma.libraryDoc.findMany({
    where: { OR: [{ ownerId: null }, { ownerId: userId }], subject: q.subject, kind: q.kind, title: q.q ? { contains: q.q, mode: "insensitive" } : undefined },
    orderBy: { createdAt: "desc" },
    select: { id: true, ownerId: true, title: true, kind: true, subject: true, chapter: true, pages: true, fileUrl: true, createdAt: true,
      favorites: { where: { userId }, select: { userId: true } } },
  });
  res.json(docs.map(({ favorites, ownerId, ...d }) => ({ ...d, own: ownerId === userId, fav: favorites.length > 0 })));
});
contentRouter.get("/library/:id", async (req, res) => {
  const d = await prisma.libraryDoc.findFirst({ where: { id: String(req.params.id), OR: [{ ownerId: null }, { ownerId: me(req).id }] } });
  if (!d) throw notFound("Document");
  res.json(d);
});
const OwnDoc = z.object({
  title: z.string().trim().min(1).max(160), kind: KindEnum.default("NOTES"), subject: z.string().max(40), chapter: z.string().max(120).optional(),
  content: z.array(z.string().max(20_000)).min(1).max(200),
});
contentRouter.post("/library", requireRole("STUDENT"), async (req, res) => {
  const d = body(req, OwnDoc);
  res.status(201).json(await prisma.libraryDoc.create({ data: { ...d, pages: d.content.length, ownerId: me(req).id } }));
});
contentRouter.delete("/library/:id", requireRole("STUDENT"), async (req, res) => {
  const r = await prisma.libraryDoc.deleteMany({ where: { id: String(req.params.id), ownerId: me(req).id } });
  if (!r.count) throw notFound("Document");
  res.status(204).end();
});
contentRouter.put("/library/:id/favorite", async (req, res) => {
  const { fav } = body(req, z.object({ fav: z.boolean() }));
  const userId = me(req).id, docId = String(req.params.id);
  const doc = await prisma.libraryDoc.findFirst({ where: { id: docId, OR: [{ ownerId: null }, { ownerId: userId }] } });
  if (!doc) throw notFound("Document");
  if (fav) await prisma.libraryFavorite.upsert({ where: { userId_docId: { userId, docId } }, create: { userId, docId }, update: {} });
  else await prisma.libraryFavorite.deleteMany({ where: { userId, docId } });
  res.json({ fav });
});

// ── Notifications ──
contentRouter.get("/notifications", async (req, res) => {
  res.json(await prisma.notification.findMany({ where: { userId: me(req).id }, orderBy: { createdAt: "desc" }, take: 50 }));
});
contentRouter.post("/notifications/read-all", async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: me(req).id, read: false }, data: { read: true } });
  res.status(204).end();
});
contentRouter.post("/notifications/:id/read", async (req, res) => {
  await prisma.notification.updateMany({ where: { id: String(req.params.id), userId: me(req).id }, data: { read: true } });
  res.status(204).end();
});
