export type Role = "student" | "parent" | "admin";

export interface StudentProfile {
  name: string;
  avatar: string; // emoji or initials key
  age: string;
  classLevel: string;
  board: string;
  session: string;
  school: string;
  medium: string;
  subjects: string[];
  language: string;
  styles: string[];
  teachingStyle: string;
}

export type QuestionType =
  | "mcq" | "multi" | "tf" | "fill" | "short" | "long" | "numerical" | "case" | "assertion" | "competency";

export interface Question {
  id: string;
  board: string;
  classLevel: string;
  subject: string;
  chapter: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: QuestionType;
  text: string;
  options?: string[];
  answer: string | string[]; // option index(es) as string, or text
  explanation: string;
  marks: number;
  passage?: string;
  keywords?: string[];
  status?: "Approved" | "In review" | "Draft";
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  date: string; // yyyy-mm-dd
  duration: number; // minutes
  priority: "High" | "Medium" | "Low";
  kind: "Study" | "Homework" | "Revision" | "Test";
  done: boolean;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  kind: "info" | "success" | "warning";
}
