import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { notify } from "../lib/activity.js";
import { publicUser } from "../lib/auth.js";
import { body, conflict, notFound } from "../lib/http.js";
import { assertCanViewStudent, me, requireAuth, requireRole } from "../middleware/auth.js";
import { parentReport } from "../services/progress.js";

export const parentsRouter = Router();
parentsRouter.use(requireAuth, requireRole("PARENT"));

/** Link a child with the invite code shown in the child's settings. */
parentsRouter.post("/me/children", async (req, res) => {
  const { code } = body(req, z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8}$/, "The code has 8 letters and numbers.") }));
  const profile = await prisma.studentProfile.findUnique({ where: { inviteCode: code }, include: { user: true } });
  if (!profile) throw notFound("Student with this code");
  const parentId = me(req).id;
  const exists = await prisma.parentLink.findUnique({ where: { parentId_studentId: { parentId, studentId: profile.userId } } });
  if (exists) throw conflict("This child is already linked to your account.");
  await prisma.parentLink.create({ data: { parentId, studentId: profile.userId } });
  const parent = await prisma.user.findUniqueOrThrow({ where: { id: parentId } });
  await notify([profile.userId], "Parent linked", `${parent.name} can now see your progress and reports.`, "info");
  res.status(201).json({ ...publicUser(profile.user), classLevel: profile.classLevel, board: profile.board, school: profile.school });
});

parentsRouter.get("/me/children", async (req, res) => {
  const links = await prisma.parentLink.findMany({ where: { parentId: me(req).id }, include: { student: { include: { studentProfile: true } } } });
  res.json(links.map(({ student: s }) => ({
    ...publicUser(s),
    classLevel: s.studentProfile?.classLevel, board: s.studentProfile?.board, school: s.studentProfile?.school,
    lastActiveAt: s.lastActiveAt,
  })));
});

parentsRouter.delete("/me/children/:studentId", async (req, res) => {
  await prisma.parentLink.delete({ where: { parentId_studentId: { parentId: me(req).id, studentId: String(req.params.studentId) } } });
  res.status(204).end();
});

/** Full report for one linked child: progress, strengths, weaknesses, homework, plan, timeline. */
parentsRouter.get("/me/children/:studentId/report", async (req, res) => {
  const studentId = String(req.params.studentId);
  await assertCanViewStudent(me(req), studentId);
  res.json(await parentReport(studentId));
});

parentsRouter.get("/me/children/:studentId/tasks", async (req, res) => {
  const studentId = String(req.params.studentId);
  await assertCanViewStudent(me(req), studentId);
  res.json(await prisma.plannerTask.findMany({ where: { studentId }, orderBy: { date: "asc" }, take: 100 }));
});
