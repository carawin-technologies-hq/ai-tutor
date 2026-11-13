import { CHAPTERS, TOPICS } from "./mock-curriculum";

export interface CurEntry { id: string; board: string; session: string; classLevel: string; subject: string; chapter: string; topic: string; subtopic: string; objectives: string }
export function seedCurriculum(): CurEntry[] {
  const out: CurEntry[] = []; let n = 0;
  (["Mathematics", "Science"] as const).forEach((s) => CHAPTERS[s].slice(0, 6).forEach((ch) => {
    const ts = TOPICS[ch] ?? ["Introduction"];
    ts.slice(0, 2).forEach((t) => out.push({ id: "cur" + ++n, board: "CBSE", session: "2026–27", classLevel: "8", subject: s, chapter: ch, topic: t, subtopic: "—", objectives: `Understand and apply ${t.toLowerCase()}.` }));
  }));
  out.push({ id: "cur" + ++n, board: "ICSE", session: "2026–27", classLevel: "8", subject: "Mathematics", chapter: "Linear Equations", topic: "Solving equations", subtopic: "—", objectives: "Solve linear equations in one variable." });
  return out;
}

export interface ContentItem { id: string; title: string; kind: string; subject: string; chapter: string; language: string; status: "Approved" | "In review" | "Draft"; updated: string }
export const SEED_CONTENT: ContentItem[] = [
  { id: "ct1", title: "Linear Equations — chapter material", kind: "Chapter material", subject: "Mathematics", chapter: "Linear Equations", language: "English", status: "Approved", updated: "2026-11-02" },
  { id: "ct2", title: "Linear Equations — Hindi explanation", kind: "Notes", subject: "Mathematics", chapter: "Linear Equations", language: "Hindi", status: "In review", updated: "2026-11-05" },
  { id: "ct3", title: "Factorisation worked examples", kind: "Examples", subject: "Mathematics", chapter: "Factorisation", language: "English", status: "Approved", updated: "2026-10-28" },
  { id: "ct4", title: "Pressure explainer video", kind: "Video", subject: "Science", chapter: "Force and Pressure", language: "English", status: "Draft", updated: "2026-11-09" },
  { id: "ct5", title: "Microorganisms question set", kind: "Questions", subject: "Science", chapter: "Microorganisms", language: "English", status: "Approved", updated: "2026-10-30" },
];

export const SEED_ASSESSMENTS = [
  { id: "as1", name: "Chapter test — Linear Equations", type: "Chapter test", questions: 8, minutes: 20, status: "Published" },
  { id: "as2", name: "Unit test 3 — Mathematics", type: "Unit test", questions: 10, minutes: 30, status: "Published" },
  { id: "as3", name: "Half-yearly sample paper (illustrative)", type: "Sample paper", questions: 14, minutes: 45, status: "Draft" },
  { id: "as4", name: "Revision test — weak chapters", type: "Revision test", questions: 6, minutes: 12, status: "Published" },
];

export const SEED_ADMIN_VIDEOS = [
  { id: "av1", title: "Solving x + a = b with a balance scale", subject: "Mathematics", language: "English", status: "Placeholder", duration: "6:30" },
  { id: "av2", title: "फैक्टराइज़ेशन: साझा गुणनखंड", subject: "Mathematics", language: "Hindi", status: "Placeholder", duration: "7:45" },
  { id: "av3", title: "What is pressure?", subject: "Science", language: "English", status: "Placeholder", duration: "5:50" },
];

export const PLATFORM_ACTIVITY = [
  { day: "Mon", sessions: 1240 }, { day: "Tue", sessions: 1380 }, { day: "Wed", sessions: 1190 }, { day: "Thu", sessions: 1510 },
  { day: "Fri", sessions: 1320 }, { day: "Sat", sessions: 1760 }, { day: "Sun", sessions: 1620 },
];
export const SEED_PARENTS = [
  { id: "P1", name: "Ananya Sharma", email: "ananya.sharma@example.com", children: 2, status: "Active", joined: "2026-06-12" },
  { id: "P2", name: "Rajesh Iyer", email: "rajesh.iyer@example.com", children: 1, status: "Active", joined: "2026-07-03" },
  { id: "P3", name: "Fatima Khan", email: "fatima.khan@example.com", children: 2, status: "Active", joined: "2026-07-18" },
  { id: "P4", name: "Suresh Reddy", email: "suresh.reddy@example.com", children: 1, status: "Inactive", joined: "2026-08-02" },
  { id: "P5", name: "Meena Nair", email: "meena.nair@example.com", children: 3, status: "Active", joined: "2026-09-21" },
];
