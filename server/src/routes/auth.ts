import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { config } from "../config.js";
import { prisma, type User } from "../db.js";
import {
  checkPassword, endSession, hashPassword, newInviteCode, publicUser, REFRESH_COOKIE, rotateSession, signAccessToken, startSession,
} from "../lib/auth.js";
import { badRequest, body, conflict, HttpError, notFound, unauthorized } from "../lib/http.js";
import { me, requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

// Slow down password guessing and sign-up spam.
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many attempts. Please wait a few minutes and try again." } } });

const SelfRole = z.enum(["STUDENT", "PARENT"]);
const Register = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Use at least 8 characters.").max(128),
  role: SelfRole,
});
const Login = z.object({ email: z.email().transform((e) => e.toLowerCase()), password: z.string().min(1) });
const Google = z.object({ credential: z.string().min(10), role: SelfRole.optional() });

/** Creates the role-specific records a new account needs. */
async function createUser(data: { name: string; email: string; role: "STUDENT" | "PARENT"; passwordHash?: string; googleId?: string; avatar?: string }) {
  return prisma.user.create({
    data: {
      ...data,
      studentProfile: data.role === "STUDENT" ? { create: { inviteCode: newInviteCode() } } : undefined,
    },
  });
}

async function issue(res: import("express").Response, user: User, ua?: string) {
  if (user.status !== "ACTIVE") throw new HttpError(403, "account_inactive", "This account is inactive. Please contact support.");
  await startSession(res, user.id, ua);
  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  return { user: publicUser(user), accessToken: signAccessToken(user), expiresIn: config.accessTokenTtlSec };
}

authRouter.post("/register", authLimiter, async (req, res) => {
  const d = body(req, Register);
  if (await prisma.user.findUnique({ where: { email: d.email } })) throw conflict("An account with this email already exists. Try signing in.");
  const user = await createUser({ name: d.name, email: d.email, role: d.role, passwordHash: await hashPassword(d.password) });
  res.status(201).json(await issue(res, user, req.get("user-agent")));
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const d = body(req, Login);
  const user = await prisma.user.findUnique({ where: { email: d.email } });
  // Same message for unknown email and wrong password, so accounts can't be discovered.
  if (!user?.passwordHash || !(await checkPassword(d.password, user.passwordHash))) throw unauthorized("Email or password is incorrect.");
  res.json(await issue(res, user, req.get("user-agent")));
});

let google: OAuth2Client | null = null;
authRouter.post("/google", authLimiter, async (req, res) => {
  if (!config.GOOGLE_CLIENT_ID) throw new HttpError(503, "not_configured", "Google sign-in is not set up on this server.");
  const d = body(req, Google);
  google ??= new OAuth2Client(config.GOOGLE_CLIENT_ID);
  let payload;
  try {
    payload = (await google.verifyIdToken({ idToken: d.credential, audience: config.GOOGLE_CLIENT_ID })).getPayload();
  } catch { throw unauthorized("Google sign-in failed. Please try again."); }
  if (!payload?.sub || !payload.email || !payload.email_verified) throw unauthorized("Your Google account email is not verified.");
  const email = payload.email.toLowerCase();

  let user = await prisma.user.findFirst({ where: { OR: [{ googleId: payload.sub }, { email }] } });
  if (user && !user.googleId) user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub } });
  if (!user) {
    // First Google sign-in: the app must say whether this is a student or a parent.
    if (!d.role) throw new HttpError(428, "role_required", "Choose whether you are a student or a parent to finish creating your account.");
    user = await createUser({ name: payload.name ?? email.split("@")[0], email, role: d.role, googleId: payload.sub, avatar: payload.picture });
  }
  res.json(await issue(res, user, req.get("user-agent")));
});

/** New access token from the httpOnly refresh cookie (rotates the cookie). */
authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw unauthorized();
  const user = await rotateSession(res, token, req.get("user-agent"));
  if (!user) { await endSession(res); throw unauthorized("Your session has ended. Please sign in again."); }
  res.json({ user: publicUser(user), accessToken: signAccessToken(user), expiresIn: config.accessTokenTtlSec });
});

authRouter.post("/logout", async (req, res) => {
  await endSession(res, req.cookies?.[REFRESH_COOKIE]);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: me(req).id }, include: { studentProfile: true } });
  if (!user) throw notFound("Account");
  res.json({ user: publicUser(user), profile: user.studentProfile });
});

const ChangePassword = z.object({ currentPassword: z.string().optional(), newPassword: z.string().min(8).max(128) });
authRouter.post("/change-password", requireAuth, async (req, res) => {
  const d = body(req, ChangePassword);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me(req).id } });
  if (user.passwordHash) {
    if (!d.currentPassword || !(await checkPassword(d.currentPassword, user.passwordHash))) throw badRequest("Current password is incorrect.");
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(d.newPassword) } }),
    // Sign out other devices.
    prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  await startSession(res, user.id, req.get("user-agent"));
  res.json({ ok: true });
});
