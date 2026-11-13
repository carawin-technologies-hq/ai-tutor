/** Teacher chat: saved conversations with real AI answers written as whiteboard blocks. */
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { config } from "../config.js";
import { prisma, Prisma } from "../db.js";
import { logActivity } from "../lib/activity.js";
import { body, HttpError, notFound } from "../lib/http.js";
import { me, requireAuth, requireRole } from "../middleware/auth.js";
import { askTeacher, type Block, type Turn } from "../services/teacher.js";

export const chatRouter = Router();
chatRouter.use(requireAuth, requireRole("STUDENT"));

const askLimiter = rateLimit({
  windowMs: 60_000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  message: { error: { code: "rate_limited", message: "You're asking very quickly. Take a breath and try again in a minute." } },
});

const Ask = z.object({ text: z.string().trim().min(1, "Type a question.").max(2000) });

async function dailyLimitCheck(studentId: string) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const used = await prisma.message.count({ where: { role: "TEACHER", createdAt: { gte: start }, conversation: { studentId } } });
  if (used >= config.CHAT_DAILY_LIMIT) throw new HttpError(429, "daily_limit", "You've reached today's limit of teacher answers. Come back tomorrow!");
}

/** Saves the student's question, asks the teacher, saves and returns the answer. */
async function exchange(conversationId: string | null, studentId: string, text: string) {
  await dailyLimitCheck(studentId);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: studentId }, include: { studentProfile: true } });
  const history: Turn[] = conversationId
    ? (await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" }, take: 40 }))
        .map((m) => ({ role: m.role, text: m.text, blocks: m.blocks as Block[] | null }))
    : [];

  const started = Date.now();
  const answer = await askTeacher(history, text, user.studentProfile, user.name);

  const conversation = conversationId
    ? await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } })
    : await prisma.conversation.create({ data: { studentId, title: answer.title.slice(0, 120), subject: answer.subject.slice(0, 40) } });
  const [studentMessage, teacherMessage] = await prisma.$transaction([
    prisma.message.create({ data: { conversationId: conversation.id, role: "STUDENT", text } }),
    prisma.message.create({ data: { conversationId: conversation.id, role: "TEACHER", blocks: answer.blocks as Prisma.InputJsonValue } }),
  ]);
  // Rough reading/listening time for the activity log.
  await logActivity(studentId, "CHAT", Math.max(1, (Date.now() - started) / 60_000 + answer.blocks.length * 0.3), `Asked the AI teacher: ${text.slice(0, 120)}`, conversation.subject);
  return { conversation, studentMessage, teacherMessage };
}

chatRouter.get("/conversations", async (req, res) => {
  res.json(await prisma.conversation.findMany({ where: { studentId: me(req).id }, orderBy: { updatedAt: "desc" }, take: 100,
    select: { id: true, title: true, subject: true, createdAt: true, updatedAt: true, _count: { select: { messages: true } } } }));
});

/** Start a conversation with a first question. */
chatRouter.post("/conversations", askLimiter, async (req, res) => {
  const { text } = body(req, Ask);
  res.status(201).json(await exchange(null, me(req).id, text));
});

chatRouter.get("/conversations/:id", async (req, res) => {
  const c = await prisma.conversation.findFirst({ where: { id: String(req.params.id), studentId: me(req).id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!c) throw notFound("Conversation");
  res.json(c);
});

chatRouter.post("/conversations/:id/messages", askLimiter, async (req, res) => {
  const { text } = body(req, Ask);
  const c = await prisma.conversation.findFirst({ where: { id: String(req.params.id), studentId: me(req).id } });
  if (!c) throw notFound("Conversation");
  res.status(201).json(await exchange(c.id, me(req).id, text));
});

chatRouter.patch("/conversations/:id", async (req, res) => {
  const d = body(req, z.object({ title: z.string().trim().min(1).max(120) }));
  const r = await prisma.conversation.updateMany({ where: { id: String(req.params.id), studentId: me(req).id }, data: d });
  if (!r.count) throw notFound("Conversation");
  res.json({ ok: true });
});

/** Clear messages (keep the conversation) or delete it entirely. */
chatRouter.delete("/conversations/:id/messages", async (req, res) => {
  const c = await prisma.conversation.findFirst({ where: { id: String(req.params.id), studentId: me(req).id } });
  if (!c) throw notFound("Conversation");
  await prisma.message.deleteMany({ where: { conversationId: c.id } });
  res.status(204).end();
});
chatRouter.delete("/conversations/:id", async (req, res) => {
  const r = await prisma.conversation.deleteMany({ where: { id: String(req.params.id), studentId: me(req).id } });
  if (!r.count) throw notFound("Conversation");
  res.status(204).end();
});

/** Save / unsave a teacher answer to Learning History. */
chatRouter.patch("/messages/:id", async (req, res) => {
  const { saved } = body(req, z.object({ saved: z.boolean() }));
  const r = await prisma.message.updateMany({ where: { id: String(req.params.id), role: "TEACHER", conversation: { studentId: me(req).id } }, data: { saved } });
  if (!r.count) throw notFound("Message");
  res.json({ saved });
});

chatRouter.get("/saved", async (req, res) => {
  res.json(await prisma.message.findMany({ where: { saved: true, conversation: { studentId: me(req).id } }, orderBy: { createdAt: "desc" },
    include: { conversation: { select: { id: true, title: true, subject: true } } } }));
});
