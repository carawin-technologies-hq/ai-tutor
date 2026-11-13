import type { StudentProfile } from "@/types";

export const DEMO_STUDENT: StudentProfile = {
  name: "Aarav Sharma",
  avatar: "🦉",
  age: "13",
  classLevel: "8",
  board: "CBSE",
  session: "2026–27",
  school: "Delhi Public School, Dwarka",
  medium: "English",
  subjects: ["Mathematics", "Science", "English", "Social Science"],
  language: "English",
  styles: ["Step-by-step teaching", "Examination-focused teaching"],
  teachingStyle: "Friendly teacher",
};

export const AVATARS = ["🦉", "🦊", "🐼", "🦁", "🐬", "🚀", "🌟", "🎯"];

export const PARENT = { name: "Ananya Sharma", email: "ananya.sharma@example.com", phone: "+91 98XXX XXXXX" };

export const CHILDREN = [
  { id: "aarav", name: "Aarav Sharma", classLevel: "8", board: "CBSE", school: "Delhi Public School, Dwarka", avatar: "🦉", hours: 18.5, lessons: 24, questions: 212, avg: 76,
    subjects: [
      { name: "Mathematics", score: 74, trend: +9 }, { name: "Science", score: 79, trend: +4 },
      { name: "English", score: 83, trend: +2 }, { name: "Social Science", score: 68, trend: -3 } ],
    weekly: [35, 50, 28, 62, 45, 70, 40] },
  { id: "diya", name: "Diya Sharma", classLevel: "5", board: "CBSE", school: "Delhi Public School, Dwarka", avatar: "🦊", hours: 11.2, lessons: 17, questions: 128, avg: 84,
    subjects: [
      { name: "Mathematics", score: 81, trend: +5 }, { name: "EVS", score: 88, trend: +3 },
      { name: "English", score: 86, trend: +6 }, { name: "Hindi", score: 79, trend: -1 } ],
    weekly: [20, 30, 25, 40, 35, 45, 30] },
];

const first = ["Aarav","Diya","Vihaan","Ishita","Kabir","Meera","Reyansh","Saanvi","Arjun","Anika","Rohan","Kiara","Advait","Myra","Dev","Tara","Yash","Navya","Ishaan","Riya","Karthik","Priya","Aditya","Sneha"];
const last = ["Sharma","Iyer","Patel","Reddy","Nair","Gupta","Das","Khan","Singh","Menon","Joshi","Banerjee"];
const boards = ["CBSE","CBSE","CBSE","ICSE","State Board"];
export const ADMIN_STUDENTS = Array.from({ length: 24 }, (_, i) => ({
  id: `STU-${1001 + i}`,
  name: `${first[i % first.length]} ${last[(i * 5) % last.length]}`,
  classLevel: String(5 + (i % 6)),
  board: boards[i % boards.length],
  status: i % 7 === 0 ? "Inactive" : "Active",
  language: ["English","Hindi","Tamil","Bengali","Marathi","Telugu"][i % 6],
  lessons: 8 + ((i * 7) % 40),
  avg: 55 + ((i * 11) % 40),
  lastActive: `${1 + (i % 9)} day${i % 9 ? "s" : ""} ago`,
}));
