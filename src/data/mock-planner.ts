import type { Task } from "@/types";
import { addDays, todayStr } from "@/lib/dates";

export function initialTasks(): Task[] {
  const t = todayStr();
  return [
    { id: "t1", title: "Revise Factorisation — common factors", subject: "Mathematics", date: t, duration: 20, priority: "High", kind: "Revision", done: true },
    { id: "t2", title: "Force and Pressure — lesson", subject: "Science", date: t, duration: 30, priority: "Medium", kind: "Study", done: false },
    { id: "t3", title: "Letter writing practice", subject: "English", date: t, duration: 20, priority: "Low", kind: "Homework", done: false },
    { id: "t4", title: "10 weak-topic questions", subject: "Mathematics", date: t, duration: 15, priority: "High", kind: "Revision", done: false },
    { id: "t5", title: "Algebraic Identities worksheet", subject: "Mathematics", date: addDays(t, 1), duration: 30, priority: "Medium", kind: "Homework", done: false },
    { id: "t6", title: "Microorganisms — flashcards", subject: "Science", date: addDays(t, 1), duration: 20, priority: "Low", kind: "Revision", done: false },
    { id: "t7", title: "The Constitution — read chapter", subject: "Social Science", date: addDays(t, 2), duration: 25, priority: "Medium", kind: "Study", done: false },
    { id: "t8", title: "Chapter test: Exponents and Powers", subject: "Mathematics", date: addDays(t, 3), duration: 40, priority: "High", kind: "Test", done: false },
    { id: "t9", title: "Cell Structure — diagrams", subject: "Science", date: addDays(t, 4), duration: 25, priority: "Medium", kind: "Study", done: false },
    { id: "t10", title: "Unit Test 3 revision (Maths)", subject: "Mathematics", date: addDays(t, 6), duration: 45, priority: "High", kind: "Revision", done: false },
  ];
}
