import { prisma, type ActivityKind, type NoticeKind } from "../db.js";

/** Record study time (feeds weekly activity, streaks and parent timelines). */
export async function logActivity(studentId: string, kind: ActivityKind, minutes: number, summary: string, subject?: string | null) {
  await prisma.$transaction([
    prisma.activity.create({ data: { studentId, kind, minutes: Math.max(0, Math.round(minutes * 10) / 10), summary: summary.slice(0, 300), subject: subject ?? null } }),
    prisma.user.update({ where: { id: studentId }, data: { lastActiveAt: new Date() } }),
  ]);
}

export async function notify(userIds: string[], title: string, body: string, kind: NoticeKind = "info") {
  if (!userIds.length) return;
  await prisma.notification.createMany({ data: userIds.map((userId) => ({ userId, title, body, kind })) });
}

export async function parentIdsOf(studentId: string) {
  return (await prisma.parentLink.findMany({ where: { studentId }, select: { parentId: true } })).map((l) => l.parentId);
}
