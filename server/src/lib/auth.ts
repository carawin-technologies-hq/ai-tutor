import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt } from "node:crypto";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { config } from "../config.js";
import { prisma, type Role, type User } from "../db.js";

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export interface AccessClaims { sub: string; role: Role }

export function signAccessToken(user: Pick<User, "id" | "role">) {
  return jwt.sign({ role: user.role } satisfies Omit<AccessClaims, "sub">, config.JWT_ACCESS_SECRET, {
    subject: user.id, expiresIn: config.accessTokenTtlSec, algorithm: "HS256",
  });
}
export function verifyAccessToken(token: string): AccessClaims {
  const p = jwt.verify(token, config.JWT_ACCESS_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;
  return { sub: String(p.sub), role: p.role as Role };
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const REFRESH_COOKIE = "carawin_rt";

/** Create a refresh-token session and set it as an httpOnly cookie. */
export async function startSession(res: Response, userId: string, userAgent?: string) {
  const token = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 864e5);
  await prisma.session.create({ data: { userId, tokenHash: sha256(token), userAgent: userAgent?.slice(0, 300), expiresAt } });
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.isProd ? "none" : "lax",
    path: "/api/v1/auth",
    expires: expiresAt,
  });
}

/** Rotate a refresh token: the old one is revoked, a new one issued. Reuse of a revoked token revokes all of that user's sessions. */
export async function rotateSession(res: Response, token: string, userAgent?: string) {
  const s = await prisma.session.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!s) return null;
  if (s.revokedAt) { await prisma.session.updateMany({ where: { userId: s.userId, revokedAt: null }, data: { revokedAt: new Date() } }); return null; }
  if (s.expiresAt < new Date() || s.user.status !== "ACTIVE") return null;
  await prisma.session.update({ where: { id: s.id }, data: { revokedAt: new Date() } });
  await startSession(res, s.userId, userAgent);
  return s.user;
}

export async function endSession(res: Response, token?: string) {
  if (token) await prisma.session.updateMany({ where: { tokenHash: sha256(token), revokedAt: null }, data: { revokedAt: new Date() } });
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
}

/** 8-character invite code a parent types to link to a student (no look-alike characters). */
export function newInviteCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => A[randomInt(A.length)]).join("");
}

/** Public view of a user (never includes password hash or Google id). */
export const publicUser = (u: User) => ({ id: u.id, email: u.email, name: u.name, avatar: u.avatar, role: u.role, status: u.status, createdAt: u.createdAt });
