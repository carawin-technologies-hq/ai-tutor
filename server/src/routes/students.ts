import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { newInviteCode, publicUser } from "../lib/auth.js";
import { body, notFound, query } from "../lib/http.js";
import { me, requireAuth, requireRole } from "../middleware/auth.js";
import { studentProgress } from "../services/progress.js";

export const studentsRouter = Router();
studentsRouter.use(requireAuth, requireRole("STUDENT"));

const Profile = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatar: z.string().max(200).optional(),
  age: z.string().max(3).optional(),
  classLevel: z.string().max(4).optional(),
  board: z.string().max(40).optional(),
  session: z.string().max(20).optional(),
  school: z.string().max(120).optional(),
  medium: z.string().max(40).optional(),
  subjects: z.array(z.string().max(40)).max(20).optional(),
  language: z.string().max(40).optional(),
  styles: z.array(z.string().max(60)).max(10).optional(),
  teachingStyle: z.string().max(60).optional(),
  onboarded: z.boolean().optional(),
});

studentsRouter.get("/me/profile", async (req, res) => {
  const u = await prisma.user.findUnique({ where: { id: me(req).id }, include: { studentProfile: true } });
  if (!u?.studentProfile) throw notFound("Profile");
  res.json({ user: publicUser(u), profile: u.studentProfile });
});

/** Onboarding and settings both save here. */
studentsRouter.put("/me/profile", async (req, res) => {
  const { name, avatar, ...profile } = body(req, Profile);
  const u = await prisma.user.update({
    where: { id: me(req).id },
    data: { name, avatar, studentProfile: { update: profile } },
    include: { studentProfile: true },
  });
  res.json({ user: publicUser(u), profile: u.studentProfile });
});

// ── Parent linking ──
studentsRouter.post("/me/invite-code", async (req, res) => {
  const p = await prisma.studentProfile.update({ where: { userId: me(req).id }, data: { inviteCode: newInviteCode() } });
  res.json({ inviteCode: p.inviteCode });
});
studentsRouter.get("/me/parents", async (req, res) => {
  const links = await prisma.parentLink.findMany({ where: { studentId: me(req).id }, include: { parent: true } });
  res.json(links.map((l) => ({ ...publicUser(l.parent), linkedAt: l.createdAt })));
});
studentsRouter.delete("/me/parents/:parentId", async (req, res) => {
  await prisma.parentLink.delete({ where: { parentId_studentId: { parentId: String(req.params.parentId), studentId: me(req).id } } });
  res.status(204).end();
});

// ── Progress ──
studentsRouter.get("/me/progress", async (req, res) => res.json(await studentProgress(me(req).id)));

// ── Study planner ──
// No .default() here: defaults inside a schema would also fill in on partial updates and overwrite saved values.
const Task = z.object({
  title: z.string().trim().min(1).max(160),
  subject: z.string().max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use yyyy-mm-dd"),
  duration: z.number().int().min(5).max(600),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  kind: z.enum(["STUDY", "HOMEWORK", "REVISION", "TEST"]),
  done: z.boolean(),
});
const NewTask = Task.partial({ priority: true, kind: true, done: true });
const TaskRange = z.object({ from: z.string().optional(), to: z.string().optional() });

studentsRouter.get("/me/tasks", async (req, res) => {
  const r = query(req, TaskRange);
  res.json(await prisma.plannerTask.findMany({
    where: { studentId: me(req).id, date: { gte: r.from, lte: r.to } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  }));
});
studentsRouter.post("/me/tasks", async (req, res) => {
  res.status(201).json(await prisma.plannerTask.create({ data: { priority: "MEDIUM", kind: "STUDY", done: false, ...body(req, NewTask), studentId: me(req).id } }));
});
studentsRouter.patch("/me/tasks/:id", async (req, res) => {
  const d = body(req, Task.partial());
  const r = await prisma.plannerTask.updateMany({ where: { id: String(req.params.id), studentId: me(req).id }, data: d });
  if (!r.count) throw notFound("Task");
  res.json(await prisma.plannerTask.findUnique({ where: { id: String(req.params.id) } }));
});
studentsRouter.delete("/me/tasks/:id", async (req, res) => {
  const r = await prisma.plannerTask.deleteMany({ where: { id: String(req.params.id), studentId: me(req).id } });
  if (!r.count) throw notFound("Task");
  res.status(204).end();
});
