export interface LibDoc {
  id: string; title: string; kind: "Textbook" | "Notes" | "Worksheet" | "PDF"; subject: string; chapter: string;
  pages: number; fav: boolean; added: string; size: string; sample?: boolean; text?: string; hasFile?: boolean;
}
export const SEED_DOCS: LibDoc[] = [
  { id: "d1", title: "NCERT Mathematics — Class 8 (sample extract)", kind: "Textbook", subject: "Mathematics", chapter: "Linear Equations", pages: 24, fav: true, added: "2026-11-09", size: "3.2 MB", sample: true },
  { id: "d2", title: "Factorisation — Revision Notes", kind: "Notes", subject: "Mathematics", chapter: "Factorisation", pages: 4, fav: false, added: "2026-11-11", size: "120 KB", sample: true },
  { id: "d3", title: "Force and Pressure Worksheet", kind: "Worksheet", subject: "Science", chapter: "Force and Pressure", pages: 3, fav: true, added: "2026-11-06", size: "480 KB", sample: true },
  { id: "d4", title: "Microorganisms — Class Notes", kind: "Notes", subject: "Science", chapter: "Microorganisms", pages: 6, fav: false, added: "2026-10-28", size: "210 KB", sample: true },
  { id: "d5", title: "Letter Writing Formats", kind: "PDF", subject: "English", chapter: "Writing Skills", pages: 5, fav: false, added: "2026-10-20", size: "390 KB", sample: true },
];

export const SAMPLE_PAGES: Record<string, string[]> = {
  d1: [
    "Chapter 2 · Linear Equations in One Variable\n\nAn equation is a statement that two expressions are equal. A linear equation in one variable has only one variable, and its highest power is 1.\n\nExamples: 2x − 3 = 7, 5y + 2 = 17.",
    "Solving equations\n\nThe value of the variable that makes both sides equal is called the solution (or root). To solve, perform the same operation on both sides.\n\nExample: x + 4 = 10 → x = 10 − 4 = 6.",
    "Transposition\n\nTransposing a term changes its sign: + becomes −, × becomes ÷.\n\nExample: 3x − 5 = 16 → 3x = 21 → x = 7.",
    "Applications\n\nWord problems are first written as equations, then solved. Always state the unknown clearly, e.g. “Let the number be x”.",
  ],
  d2: ["Common factors\n\n6x² + 9x = 3x(2x + 3). Always look for the HCF of numbers and variables.", "Identities\n\na² − b² = (a − b)(a + b)\n(a + b)² = a² + 2ab + b²", "Common mistakes\n\n• Forgetting the sign when taking out a negative factor.\n• Not verifying by expanding.", "Practice\n\nFactorise: 12a²b + 15ab², x² − 49, 4y² + 20y + 25."],
  d3: ["Pressure = Force ÷ Area\n\nSI unit: pascal (Pa) = N/m².", "Worksheet Q1–Q5\n\n1. Why do camels have broad feet?\n2. Calculate pressure when F = 200 N, A = 4 m².", "Atmospheric pressure\n\nThe air around us exerts pressure called atmospheric pressure."],
  d4: ["Types of microorganisms\n\nBacteria, fungi, protozoa, algae and viruses.", "Useful microorganisms\n\nLactobacillus makes curd; yeast helps in baking and fermentation.", "Harmful microorganisms\n\nCause diseases such as cholera, typhoid and malaria."],
  d5: ["Formal letter format\n\nSender's address · Date · Receiver · Subject · Salutation · Body · Closing.", "Informal letter\n\nUse a friendly tone and simple language.", "Tips\n\nKeep paragraphs short and state the purpose in the first line."],
};
