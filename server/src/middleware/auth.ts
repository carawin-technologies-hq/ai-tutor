import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth.js";
import { forbidden, unauthorized } from "../lib/http.js";
import { prisma, type Role } from "../db.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: { id: string; role: Role } }
  }
}

/** Requires a valid "Authorization: Bearer <access token>" header. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return next(unauthorized());
  try {
    const c = verifyAccessToken(h.slice(7));
    req.user = { id: c.sub, role: c.role };
    next();
  } catch {
    next(unauthorized("Your session has expired. Please sign in again."));
  }
}

export const requireRole = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) =>
  req.user && roles.includes(req.user.role) ? next() : next(forbidden());

export const me = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

/** A parent may read a student's data only when linked; admins may read any student. */
export async function assertCanViewStudent(viewer: { id: string; role: Role }, studentId: string) {
  if (viewer.role === "ADMIN" || viewer.id === studentId) return;
  if (viewer.role === "PARENT") {
    const link = await prisma.parentLink.findUnique({ where: { parentId_studentId: { parentId: viewer.id, studentId } } });
    if (link) return;
  }
  throw forbidden();
}
