export const TOPIC_MASTERY = {
  Mathematics: [
    { topic: "Linear Equations", pct: 92 }, { topic: "Algebraic Expressions", pct: 72 },
    { topic: "Factorisation", pct: 38 }, { topic: "Exponents and Powers", pct: 85 },
    { topic: "Rational Numbers", pct: 81 }, { topic: "Data Handling", pct: 66 },
  ],
  Science: [
    { topic: "Crop Production", pct: 88 }, { topic: "Microorganisms", pct: 74 },
    { topic: "Force and Pressure", pct: 65 }, { topic: "Cell Structure", pct: 58 },
  ],
  English: [
    { topic: "Grammar: Tenses", pct: 90 }, { topic: "Reading Comprehension", pct: 82 }, { topic: "Letter Writing", pct: 71 },
  ],
  "Social Science": [
    { topic: "Colonial Rule", pct: 70 }, { topic: "The Constitution", pct: 64 }, { topic: "Secularism", pct: 52 },
  ],
} as Record<string, { topic: string; pct: number }[]>;

export const SUBJECT_PROGRESS = [
  { subject: "Mathematics", progress: 62, score: 74 },
  { subject: "Science", progress: 55, score: 79 },
  { subject: "English", progress: 70, score: 83 },
  { subject: "Social Science", progress: 41, score: 68 },
];

export const WEEKLY_ACTIVITY = [
  { day: "Mon", minutes: 35 }, { day: "Tue", minutes: 50 }, { day: "Wed", minutes: 28 },
  { day: "Thu", minutes: 62 }, { day: "Fri", minutes: 45 }, { day: "Sat", minutes: 70 }, { day: "Sun", minutes: 40 },
];

export const MONTHLY_TREND = [
  { month: "Jun", accuracy: 58, hours: 9 }, { month: "Jul", accuracy: 63, hours: 12 },
  { month: "Aug", accuracy: 67, hours: 14 }, { month: "Sep", accuracy: 71, hours: 16 },
  { month: "Oct", accuracy: 74, hours: 18 }, { month: "Nov", accuracy: 78, hours: 11 },
];

export const TEST_SCORES = [
  { test: "Ch. 1 Test", score: 64 }, { test: "Unit 1", score: 70 }, { test: "Ch. 4 Test", score: 72 },
  { test: "Mock 1", score: 69 }, { test: "Ch. 7 Test", score: 78 }, { test: "Unit 2", score: 81 },
];

export const LINEAR_EQ_TREND = [
  { week: "W1", pct: 55 }, { week: "W2", pct: 61 }, { week: "W3", pct: 70 }, { week: "W4", pct: 82 }, { week: "W5", pct: 92 },
];

export const INSIGHTS = [
  { tone: "green", title: "You are improving in Mathematics", body: "Your performance in Linear Equations has increased from 55% to 82% over four weeks, mainly because you now check each step before moving on." },
  { tone: "red", title: "Factorisation needs revision", body: "Your accuracy is 38%. Most errors are in 'taking out the common factor' when a term has a negative sign. A 15-minute revision will help before you attempt Algebraic Identities." },
  { tone: "amber", title: "Force and Pressure is developing", body: "You understand the formula for pressure but lose marks on unit conversion (cm² to m²). Try 5 numerical questions this week." },
];

export const DASHBOARD_STATS = { minutesToday: 48, lessonsDone: 3, questionsSolved: 27, streak: 12 };

export const STUDY_PLAN_TODAY = [
  { id: "p1", title: "Revise Factorisation — common factors", subject: "Mathematics", time: "5:00 PM", mins: 20, done: true },
  { id: "p2", title: "Science: Force and Pressure lesson", subject: "Science", time: "5:30 PM", mins: 30, done: false },
  { id: "p3", title: "English: Letter writing practice", subject: "English", time: "6:15 PM", mins: 20, done: false },
  { id: "p4", title: "Practise 10 weak-topic questions", subject: "Mathematics", time: "7:00 PM", mins: 15, done: false },
];

export const EXAMS = [
  { id: "e1", name: "Unit Test 3", subject: "Mathematics", date: "2026-11-26", syllabus: 72, kind: "Unit test" },
  { id: "e2", name: "Half-Yearly Examination", subject: "All subjects", date: "2026-12-14", syllabus: 58, kind: "Half-yearly" },
  { id: "e3", name: "Annual Examination", subject: "All subjects", date: "2027-03-10", syllabus: 41, kind: "Annual" },
];
