/**
 * Seeds the database with the app's starter content (from ../src/data) and the first admin account.
 *   npm run db:seed
 * Safe to run more than once: existing records are kept, missing ones are added.
 */
import { prisma, type Difficulty, type QuestionType, type DocKind, type AssessmentType } from "../src/db.js";
import { hashPassword } from "../src/lib/auth.js";
import { CHAPTERS, TOPICS } from "../../src/data/mock-curriculum.js";
import { QUESTION_BANK } from "../../src/data/mock-questions.js";
import { LESSONS, LESSON_ORDER } from "../../src/data/mock-lessons.js";
import { VIDEOS } from "../../src/data/mock-videos.js";
import { SEED_DOCS, SAMPLE_PAGES } from "../../src/data/mock-library.js";
import { SEED_ASSESSMENTS, SEED_CONTENT } from "../../src/data/mock-admin.js";

const BOARD = "CBSE", CLASS = "8";
const log = (s: string) => console.log("  " + s);

async function main() {
  console.log("Seeding CARAWIN database…");

  // ── Admin ──
  const email = process.env.ADMIN_EMAIL?.toLowerCase(), password = process.env.ADMIN_PASSWORD;
  if (email && password && password.length >= 8) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (!exists) { await prisma.user.create({ data: { email, name: "Administrator", role: "ADMIN", passwordHash: await hashPassword(password) } }); log(`admin account created: ${email}`); }
    else log(`admin account exists: ${email}`);
  } else log("skipped admin account (set ADMIN_EMAIL and ADMIN_PASSWORD, 8+ characters)");

  // ── Curriculum ──
  const chapterId = new Map<string, string>();
  for (const [subject, names] of Object.entries(CHAPTERS)) {
    for (const [order, name] of names.entries()) {
      const c = await prisma.chapter.upsert({
        where: { board_classLevel_subject_name: { board: BOARD, classLevel: CLASS, subject, name } },
        create: { board: BOARD, classLevel: CLASS, subject, name, order }, update: {},
      });
      chapterId.set(name, c.id);
      for (const [tOrder, topic] of (TOPICS[name] ?? []).entries()) {
        await prisma.topic.upsert({ where: { chapterId_name: { chapterId: c.id, name: topic } }, create: { chapterId: c.id, name: topic, order: tOrder, objectives: `Understand and apply ${topic.toLowerCase()}.` }, update: {} });
      }
    }
  }
  log(`chapters: ${chapterId.size}`);

  // ── Question bank ──
  const qIdsByChapter = new Map<string, string[]>();
  if ((await prisma.question.count()) === 0) {
    for (const q of QUESTION_BANK) {
      const cid = chapterId.get(q.chapter);
      if (!cid) continue;
      const topic = await prisma.topic.upsert({ where: { chapterId_name: { chapterId: cid, name: q.topic } }, create: { chapterId: cid, name: q.topic }, update: {} });
      const created = await prisma.question.create({ data: {
        chapterId: cid, topicId: topic.id, difficulty: q.difficulty.toUpperCase() as Difficulty, type: q.type as QuestionType,
        text: q.text, passage: q.passage, options: q.options ?? [], answer: q.answer, explanation: q.explanation,
        marks: q.marks, keywords: q.keywords ?? [], status: "APPROVED",
      } });
      qIdsByChapter.set(q.chapter, [...(qIdsByChapter.get(q.chapter) ?? []), created.id]);
    }
    log(`questions: ${QUESTION_BANK.length}`);
  } else {
    for (const q of await prisma.question.findMany({ include: { chapter: true } })) qIdsByChapter.set(q.chapter.name, [...(qIdsByChapter.get(q.chapter.name) ?? []), q.id]);
    log("questions: already present");
  }

  // ── Tests ──
  const math = ["Linear Equations", "Factorisation", "Algebraic Expressions", "Exponents and Powers"].flatMap((c) => qIdsByChapter.get(c) ?? []);
  const sci = ["Force and Pressure", "Microorganisms", "Crop Production and Management"].flatMap((c) => qIdsByChapter.get(c) ?? []);
  const pick: Record<string, { ids: string[]; type: AssessmentType; subject: string | null }> = {
    as1: { ids: qIdsByChapter.get("Linear Equations") ?? [], type: "CHAPTER_TEST", subject: "Mathematics" },
    as2: { ids: math.slice(0, 10), type: "UNIT_TEST", subject: "Mathematics" },
    as3: { ids: [...math.slice(0, 8), ...sci.slice(0, 6)], type: "SAMPLE_PAPER", subject: null },
    as4: { ids: [...(qIdsByChapter.get("Factorisation") ?? []), ...(qIdsByChapter.get("Force and Pressure") ?? [])].slice(0, 6), type: "REVISION_TEST", subject: null },
  };
  for (const a of SEED_ASSESSMENTS) {
    if (await prisma.assessment.findFirst({ where: { name: a.name } })) continue;
    const p = pick[a.id];
    await prisma.assessment.create({ data: {
      name: a.name, type: p.type, board: BOARD, classLevel: CLASS, subject: p.subject, minutes: a.minutes,
      status: a.status === "Published" ? "PUBLISHED" : "DRAFT",
      questions: { create: p.ids.map((questionId, order) => ({ questionId, order })) },
    } });
  }
  log(`tests: ${await prisma.assessment.count()}`);

  // ── Lessons (interactive Linear Equations lessons) ──
  const leId = chapterId.get("Linear Equations");
  if (leId) for (const [order, key] of LESSON_ORDER.entries()) {
    const l = LESSONS[key];
    if (await prisma.lesson.findFirst({ where: { chapterId: leId, title: l.title } })) continue;
    await prisma.lesson.create({ data: { chapterId: leId, title: l.title, objective: l.objective, beats: l.beats as object[], order, status: "PUBLISHED" } });
  }
  log(`lessons: ${await prisma.lesson.count()}`);

  // ── Videos ──
  for (const v of VIDEOS) {
    if (await prisma.video.findFirst({ where: { title: v.title } })) continue;
    await prisma.video.create({ data: {
      title: v.title, subject: v.subject, chapterId: chapterId.get(v.chapter) ?? null, topic: v.topic, language: v.language, duration: v.duration,
      description: v.desc, objectives: v.objectives, takeaways: v.takeaways, questions: v.questions, status: "PUBLISHED",
    } });
  }
  log(`videos: ${await prisma.video.count()}`);

  // ── Library (platform documents) ──
  for (const d of SEED_DOCS) {
    if (await prisma.libraryDoc.findFirst({ where: { title: d.title, ownerId: null } })) continue;
    const content = SAMPLE_PAGES[d.id] ?? [];
    await prisma.libraryDoc.create({ data: { title: d.title, kind: d.kind.toUpperCase() as DocKind, subject: d.subject, chapter: d.chapter, pages: content.length || d.pages, content } });
  }
  log(`library documents: ${await prisma.libraryDoc.count({ where: { ownerId: null } })}`);

  // ── Admin content items ──
  for (const c of SEED_CONTENT) {
    if (await prisma.contentItem.findFirst({ where: { title: c.title } })) continue;
    await prisma.contentItem.create({ data: { title: c.title, kind: c.kind, subject: c.subject, chapter: c.chapter, language: c.language,
      status: c.status === "Approved" ? "APPROVED" : c.status === "In review" ? "IN_REVIEW" : "DRAFT" } });
  }
  log(`content items: ${await prisma.contentItem.count()}`);

  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
