/**
 * End-to-end API tests against a real database (DATABASE_URL in server/.env, seeded with `npm run db:seed`).
 *   npm test
 */
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";

const app = createApp();
const run = Date.now().toString(36);
const email = (who: string) => `${who}.${run}@test.carawin`;
const PASSWORD = "correct-horse-42";

let studentToken = "", parentToken = "", otherParentToken = "", adminToken = "", studentId = "", studentCookie = "";
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  const s = await request(app).post("/api/v1/auth/register").send({ name: "Aarav Test", email: email("student"), password: PASSWORD, role: "STUDENT" });
  expect(s.status).toBe(201);
  studentToken = s.body.accessToken; studentId = s.body.user.id;
  studentCookie = String(s.headers["set-cookie"]).split(";")[0];
  parentToken = (await request(app).post("/api/v1/auth/register").send({ name: "Ananya Test", email: email("parent"), password: PASSWORD, role: "PARENT" })).body.accessToken;
  otherParentToken = (await request(app).post("/api/v1/auth/register").send({ name: "Other Parent", email: email("other"), password: PASSWORD, role: "PARENT" })).body.accessToken;
  const a = await request(app).post("/api/v1/auth/login").send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  expect(a.status).toBe(200);
  adminToken = a.body.accessToken;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: `${run}@test.carawin` } } });
  await prisma.$disconnect();
});

describe("health & auth", () => {
  it("reports health", async () => {
    const r = await request(app).get("/health");
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });
  it("rejects a duplicate email and a weak password", async () => {
    expect((await request(app).post("/api/v1/auth/register").send({ name: "Dup", email: email("student"), password: PASSWORD, role: "STUDENT" })).status).toBe(409);
    const weak = await request(app).post("/api/v1/auth/register").send({ name: "Weak", email: email("weak"), password: "123", role: "STUDENT" });
    expect(weak.status).toBe(400);
    expect(weak.body.error.details[0].field).toBe("password");
  });
  it("does not allow self-registering as admin", async () => {
    expect((await request(app).post("/api/v1/auth/register").send({ name: "Sneaky", email: email("sneaky"), password: PASSWORD, role: "ADMIN" })).status).toBe(400);
  });
  it("rejects a wrong password with a generic message", async () => {
    const r = await request(app).post("/api/v1/auth/login").send({ email: email("student"), password: "wrong-password" });
    expect(r.status).toBe(401);
    expect(r.body.error.message).toBe("Email or password is incorrect.");
  });
  it("returns the signed-in user, never the password hash", async () => {
    const r = await request(app).get("/api/v1/auth/me").set(auth(studentToken));
    expect(r.status).toBe(200);
    expect(r.body.user.role).toBe("STUDENT");
    expect(JSON.stringify(r.body)).not.toContain("passwordHash");
    expect(r.body.profile.inviteCode).toMatch(/^[A-Z0-9]{8}$/);
  });
  it("needs a token and enforces roles", async () => {
    expect((await request(app).get("/api/v1/students/me/profile")).status).toBe(401);
    expect((await request(app).get("/api/v1/admin/users").set(auth(studentToken))).status).toBe(403);
    expect((await request(app).get("/api/v1/students/me/profile").set(auth(parentToken))).status).toBe(403);
  });
  it("rotates refresh tokens and detects reuse of an old one", async () => {
    const r1 = await request(app).post("/api/v1/auth/refresh").set("Cookie", studentCookie);
    expect(r1.status).toBe(200);
    expect(r1.body.accessToken).toBeTruthy();
    const newCookie = String(r1.headers["set-cookie"]).split(";")[0];
    // Re-using the first cookie is treated as theft: it fails and signs out every session.
    expect((await request(app).post("/api/v1/auth/refresh").set("Cookie", studentCookie)).status).toBe(401);
    expect((await request(app).post("/api/v1/auth/refresh").set("Cookie", newCookie)).status).toBe(401);
  });
});

describe("student profile & parent linking", () => {
  it("saves onboarding details", async () => {
    const r = await request(app).put("/api/v1/students/me/profile").set(auth(studentToken))
      .send({ classLevel: "8", board: "CBSE", subjects: ["Mathematics", "Science"], language: "English", teachingStyle: "Friendly teacher", onboarded: true });
    expect(r.status).toBe(200);
    expect(r.body.profile.subjects).toEqual(["Mathematics", "Science"]);
  });
  it("links a parent with the student's invite code", async () => {
    const code = (await request(app).get("/api/v1/auth/me").set(auth(studentToken))).body.profile.inviteCode;
    expect((await request(app).post("/api/v1/parents/me/children").set(auth(parentToken)).send({ code: "WRONG123" })).status).toBe(404);
    const r = await request(app).post("/api/v1/parents/me/children").set(auth(parentToken)).send({ code: code.toLowerCase() });
    expect(r.status).toBe(201);
    expect((await request(app).post("/api/v1/parents/me/children").set(auth(parentToken)).send({ code })).status).toBe(409);
    const kids = await request(app).get("/api/v1/parents/me/children").set(auth(parentToken));
    expect(kids.body.map((k: { id: string }) => k.id)).toContain(studentId);
    const notes = await request(app).get("/api/v1/notifications").set(auth(studentToken));
    expect(notes.body[0].title).toBe("Parent linked");
  });
  it("keeps other parents out of the child's report", async () => {
    expect((await request(app).get(`/api/v1/parents/me/children/${studentId}/report`).set(auth(otherParentToken))).status).toBe(403);
    expect((await request(app).get(`/api/v1/parents/me/children/${studentId}/report`).set(auth(parentToken))).status).toBe(200);
  });
});

describe("practice & tests", () => {
  it("serves practice questions without answers and grades on the server", async () => {
    const s = await request(app).post("/api/v1/practice").set(auth(studentToken)).send({ subject: "Mathematics", count: 5 });
    expect(s.status).toBe(201);
    expect(s.body.questions).toHaveLength(5);
    for (const q of s.body.questions) { expect(q.answer).toBeUndefined(); expect(q.explanation).toBeUndefined(); }

    // Answer the first one correctly and the second one wrongly.
    const [q1, q2] = s.body.questions;
    const real1 = await prisma.question.findUniqueOrThrow({ where: { id: q1.id } });
    const a1 = await request(app).post(`/api/v1/attempts/${s.body.id}/answers`).set(auth(studentToken)).send({ questionId: q1.id, response: real1.answer, timeSec: 20 });
    expect(a1.body.verdict).toBe("correct");
    expect(a1.body.explanation).toBeTruthy();
    const a2 = await request(app).post(`/api/v1/attempts/${s.body.id}/answers`).set(auth(studentToken)).send({ questionId: q2.id, response: q2.type === "multi" ? ["9"] : "definitely wrong", timeSec: 10 });
    expect(a2.body.verdict).toBe("wrong");

    const done = await request(app).post(`/api/v1/attempts/${s.body.id}/submit`).set(auth(studentToken));
    expect(done.status).toBe(200);
    expect(done.body.score).toBe(real1.marks);
    expect(done.body.rows.filter((r: { verdict: string }) => r.verdict === "skipped")).toHaveLength(3);
    expect((await request(app).post(`/api/v1/attempts/${s.body.id}/submit`).set(auth(studentToken))).status).toBe(409);
  });
  it("hides answers during a test, then notifies parents with the result", async () => {
    const list = await request(app).get("/api/v1/assessments").set(auth(studentToken));
    expect(list.status).toBe(200);
    const test = list.body.find((a: { name: string }) => a.name.startsWith("Chapter test"));
    expect(test).toBeTruthy();
    const t = await request(app).post(`/api/v1/assessments/${test.id}/attempts`).set(auth(studentToken));
    expect(t.status).toBe(201);
    expect(t.body.endsAt).toBeTruthy();
    for (const q of t.body.questions) {
      const real = await prisma.question.findUniqueOrThrow({ where: { id: q.id } });
      // Written answers are marked by keywords, so write an answer that uses them (like a full worked answer would).
      const response = real.type === "short" || real.type === "long" ? `${real.answer} ${real.keywords.join(" ")}` : real.answer;
      const r = await request(app).post(`/api/v1/attempts/${t.body.id}/answers`).set(auth(studentToken)).send({ questionId: q.id, response });
      expect(r.body).toEqual({ saved: true }); // no verdict until submitted
    }
    const result = await request(app).post(`/api/v1/attempts/${t.body.id}/submit`).set(auth(studentToken));
    expect(result.body.percent).toBe(100);
    const notes = await request(app).get("/api/v1/notifications").set(auth(parentToken));
    expect(notes.body[0].body).toContain("100%");
  });
  it("cannot see another student's attempt", async () => {
    const other = await request(app).post("/api/v1/auth/register").send({ name: "Other Kid", email: email("kid2"), password: PASSWORD, role: "STUDENT" });
    const mine = await request(app).get("/api/v1/attempts").set(auth(studentToken));
    expect((await request(app).get(`/api/v1/attempts/${mine.body.items[0].id}`).set(auth(other.body.accessToken))).status).toBe(404);
  });
});

describe("planner & progress", () => {
  it("creates, updates and lists tasks", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const t = await request(app).post("/api/v1/students/me/tasks").set(auth(studentToken)).send({ title: "Revise factorisation", subject: "Mathematics", date: today, duration: 20, kind: "HOMEWORK" });
    expect(t.status).toBe(201);
    expect((await request(app).patch(`/api/v1/students/me/tasks/${t.body.id}`).set(auth(studentToken)).send({ done: true })).body.done).toBe(true);
    expect((await request(app).post("/api/v1/students/me/tasks").set(auth(studentToken)).send({ title: "Bad", subject: "X", date: "tomorrow", duration: 20 })).status).toBe(400);
  });
  it("computes progress from real activity", async () => {
    const p = await request(app).get("/api/v1/students/me/progress").set(auth(studentToken));
    expect(p.status).toBe(200);
    expect(p.body.totals.questionsAnswered).toBeGreaterThan(0);
    expect(p.body.testScores.at(-1).score).toBe(100);
    expect(p.body.weeklyActivity).toHaveLength(7);
    expect(p.body.totals.streakDays).toBe(1);
    const report = await request(app).get(`/api/v1/parents/me/children/${studentId}/report`).set(auth(parentToken));
    expect(report.body.homework).toEqual({ done: 1, total: 1 });
  });
});

describe("content & admin", () => {
  it("returns the curriculum for the student's class", async () => {
    const c = await request(app).get("/api/v1/curriculum").set(auth(studentToken));
    expect(c.body.subjects.Mathematics.length).toBeGreaterThan(5);
    const lessons = await request(app).get("/api/v1/lessons").set(auth(studentToken));
    expect(lessons.body.length).toBe(3);
    const done = await request(app).post(`/api/v1/lessons/${lessons.body[0].id}/progress`).set(auth(studentToken)).send({ state: "COMPLETED", minutes: 8 });
    expect(done.body.state).toBe("COMPLETED");
  });
  it("lists users, validates questions, and reports stats", async () => {
    const users = await request(app).get("/api/v1/admin/users?role=STUDENT&q=" + run).set(auth(adminToken));
    expect(users.body.total).toBeGreaterThanOrEqual(1);
    const chapter = (await request(app).get("/api/v1/admin/chapters?subject=Mathematics").set(auth(adminToken))).body[0];
    const bad = await request(app).post("/api/v1/admin/questions").set(auth(adminToken)).send({ chapterId: chapter.id, difficulty: "EASY", type: "mcq", text: "2+2?", options: ["4"], answer: "0" });
    expect(bad.status).toBe(400);
    const good = await request(app).post("/api/v1/admin/questions").set(auth(adminToken)).send({ chapterId: chapter.id, difficulty: "EASY", type: "mcq", text: `2+2? (${run})`, options: ["3", "4"], answer: "1", status: "DRAFT" });
    expect(good.status).toBe(201);
    await request(app).delete(`/api/v1/admin/questions/${good.body.id}`).set(auth(adminToken)).expect(204);
    const stats = await request(app).get("/api/v1/admin/stats").set(auth(adminToken));
    expect(stats.body.dailyActiveStudents).toHaveLength(7);
  });
  it("can deactivate an account, which blocks sign-in", async () => {
    const u = await request(app).post("/api/v1/auth/register").send({ name: "To Disable", email: email("disable"), password: PASSWORD, role: "PARENT" });
    await request(app).patch(`/api/v1/admin/users/${u.body.user.id}`).set(auth(adminToken)).send({ status: "INACTIVE" }).expect(200);
    expect((await request(app).post("/api/v1/auth/login").send({ email: email("disable"), password: PASSWORD })).status).toBe(403);
  });
});

describe("AI teacher chat", () => {
  it.runIf(!process.env.ANTHROPIC_API_KEY && !process.env.DEEPSEEK_API_KEY)("explains clearly when the AI key is not configured", async () => {
    const r = await request(app).post("/api/v1/chat/conversations").set(auth(studentToken)).send({ text: "Why does the moon change its shape?" });
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("ai_not_configured");
  });
  it("validates empty questions", async () => {
    expect((await request(app).post("/api/v1/chat/conversations").set(auth(studentToken)).send({ text: "   " })).status).toBe(400);
  });
});
