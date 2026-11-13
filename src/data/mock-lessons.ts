export type Stage = "Welcome" | "Concept" | "Definition" | "Real-world example" | "Worked example" | "Check" | "Recap";

export interface TeachBeat {
  kind: "teach"; id: string; stage: Stage; title: string;
  text: string; styleText?: Record<string, string>; hi?: string;
  equation?: string; visual?: { left: string; right: string; note?: string };
  steps?: { text: string; eq: string }[]; simpler?: string;
}
export interface QuestionBeat {
  kind: "question"; id: string; title: string; prompt: string; equation?: string;
  qtype: "mcq" | "input"; options?: string[]; answer: string; partial?: string[];
  hint: string; wrong: string; partialMsg?: string; correct: string; explain: string;
}
export type Beat = TeachBeat | QuestionBeat;

export interface Lesson { id: string; chapter: string; title: string; objective: string; beats: Beat[] }

export const LESSONS: Record<string, Lesson> = {
  "le-1": {
    id: "le-1", chapter: "Linear Equations in One Variable", title: "What is a linear equation?",
    objective: "Recognise a linear equation in one variable and identify its parts.",
    beats: [
      { kind: "teach", id: "a1", stage: "Welcome", title: "Welcome back!", text: "Today we start with a simple idea: an equation is a balanced statement. Think of a see-saw with equal weight on both sides." },
      { kind: "teach", id: "a2", stage: "Definition", title: "Key definition", text: "A **linear equation in one variable** has one unknown (like x), the unknown has power 1, and there is an equals sign.", equation: "2x + 3 = 11" },
      { kind: "question", id: "q1", title: "Quick check", prompt: "Which of these is a linear equation in one variable?", qtype: "mcq", options: ["x² + 1 = 5", "3x − 7 = 8", "x + y = 4", "5 + 3 = 8"], answer: "3x − 7 = 8", hint: "Look for one unknown with power 1 only.", wrong: "Not quite. x² has power 2, x + y has two unknowns, and 5 + 3 = 8 has no unknown at all.", correct: "Exactly! One unknown (x), power 1, with an equals sign.", explain: "3x − 7 = 8 has a single variable x with power 1, so it is linear." },
    ],
  },
  "le-2": {
    id: "le-2", chapter: "Linear Equations in One Variable", title: "Solving x + a = b",
    objective: "Solve equations of the form x + a = b by performing the same operation on both sides.",
    beats: [
      { kind: "teach", id: "b1", stage: "Welcome", title: "Let's get started", text: "Hi Aarav! Today we'll learn how to find the unknown number in an equation like x + 4 = 10. By the end, you'll be able to solve these in seconds — and explain why it works.",
        styleText: {
          "Strict examination teacher": "Aarav, this topic carries 3–4 marks in school tests. Learn the method, show every step, and write the final answer with the check. Let's begin.",
          "Socratic teacher": "Aarav, before I explain anything: if I think of a number, add 4, and get 10 — how might you find my number? Hold that thought; we'll come back to it.",
          "Story-based teacher": "Aarav, once upon a time a shopkeeper had a mystery box of chocolates. Let's find out how many were inside — using nothing but logic.",
          "Revision teacher": "Quick recap mode, Aarav: one rule, three examples, two checks. Ready?",
          "Visual teacher": "Aarav, today we'll *see* equations as a balance scale. Watch the pans carefully.",
          "Step-by-step mathematics teacher": "Aarav, we'll solve this in numbered steps: identify, isolate, compute, verify.",
        },
        hi: "नमस्ते आरव! आज हम सीखेंगे कि x + 4 = 10 जैसे समीकरण में अज्ञात संख्या कैसे ज्ञात करें। इस पाठ के अंत तक आप इसे आसानी से हल कर पाएँगे।" },
      { kind: "teach", id: "b2", stage: "Concept", title: "The balance idea", text: "An equation is like a balance scale. The left side and right side weigh the same. If we want to keep it balanced, whatever we do to one side, we must do to the other.",
        styleText: {
          "Visual teacher": "Look at the scale: left pan has the unknown box x plus 4 counters; right pan has 10 counters. They balance. Remove 4 from both pans and the box alone equals 6 counters.",
          "Strict examination teacher": "Rule to remember (and write in the exam): *the same operation on both sides keeps the equation true.* Always state which operation you performed.",
          "Socratic teacher": "If the scale is balanced and I take 4 counters off the left, what must I do on the right to keep it balanced? Why?",
        },
        hi: "समीकरण एक तराज़ू की तरह है। बाएँ और दाएँ पलड़े का वज़न बराबर होता है। संतुलन बनाए रखने के लिए जो भी हम एक तरफ़ करें, वही दूसरी तरफ़ भी करना होगा।",
        visual: { left: "x + 4", right: "10", note: "x + 4 = 10 — both pans balance" },
        simpler: "Think of two friends with the same number of sweets. If both give away 2 sweets, they still have the same number. Equations work the same way." },
      { kind: "teach", id: "b3", stage: "Definition", title: "Important terms", text: "**Variable** — a letter (like x) standing for an unknown number.\n**Solution** — the value of the variable that makes both sides equal.\n**Inverse operation** — the operation that undoes another (subtraction undoes addition).", hi: "**चर** — अज्ञात संख्या को दर्शाने वाला अक्षर (जैसे x)।\n**हल** — चर का वह मान जिससे दोनों पक्ष बराबर हो जाएँ।" },
      { kind: "teach", id: "b4", stage: "Real-world example", title: "A real-life example", text: "You have some chocolates, x. A friend gives you 4 more, and now you have 10. How many did you start with?", equation: "x + 4 = 10", simpler: "Start with some chocolates. Get 4 more. Now 10. To find the start, go backwards: take away the 4." },
      { kind: "teach", id: "b5", stage: "Worked example", title: "Worked example: x + 7 = 15", text: "Let's solve this one together, step by step.", steps: [
        { text: "Write the equation.", eq: "x + 7 = 15" },
        { text: "Subtract 7 from both sides (the inverse of +7).", eq: "x + 7 − 7 = 15 − 7" },
        { text: "Simplify each side.", eq: "x = 8" },
        { text: "Check: put x = 8 back in.", eq: "8 + 7 = 15 ✓" },
      ] },
      { kind: "question", id: "q1", title: "Your turn", prompt: "If x + 4 = 10, what value should x have?", equation: "x + 4 = 10", qtype: "mcq", options: ["4", "6", "14", "10"], answer: "6",
        hint: "Which operation undoes “+ 4”? Do it on both sides.", wrong: "Not quite. Adding 4 gives 14, but we need to *undo* the +4. Try subtracting 4 from both sides: 10 − 4 = ?", correct: "Correct! x = 6, because 6 + 4 = 10.", explain: "Subtract 4 from both sides: x + 4 − 4 = 10 − 4, so x = 6. Check: 6 + 4 = 10 ✓" },
      { kind: "question", id: "q2", title: "Type your answer", prompt: "Solve for x: x + 9 = 23", equation: "x + 9 = 23", qtype: "input", answer: "14", partial: ["23-9", "23 - 9", "x=14", "x = 14"],
        hint: "Subtract 9 from both sides. What is 23 − 9?", partialMsg: "You have the right idea! Now carry out the subtraction and give me just the value of x.", wrong: "Not yet. Remember: undo “+ 9” by subtracting 9 from both sides. 23 − 9 = ?", correct: "Yes! x = 14. And 14 + 9 = 23 ✓", explain: "x + 9 = 23 → x = 23 − 9 = 14. Always check by substituting back." },
      { kind: "question", id: "q3", title: "Spot the mistake", prompt: "A student solved x − 5 = 12 and wrote x = 12 − 5 = 7. What went wrong?", qtype: "mcq", options: ["Nothing, it's correct", "They should have added 5 to both sides", "They should have multiplied by 5", "The answer should be 17 − 5"], answer: "They should have added 5 to both sides",
        hint: "The equation has “− 5”. Which operation undoes subtraction?", wrong: "Think again: x − 5 means 5 was taken away. The inverse operation is adding 5, not subtracting it again.", correct: "Right! x − 5 + 5 = 12 + 5, so x = 17.", explain: "Inverse of “− 5” is “+ 5”. So x = 12 + 5 = 17. Check: 17 − 5 = 12 ✓" },
      { kind: "teach", id: "b6", stage: "Recap", title: "Understanding confirmed", text: "Well done, Aarav! You can now solve equations of the form x + a = b: identify the operation, undo it on both sides, then check your answer. Next up: variables on both sides." },
    ],
  },
  "le-3": {
    id: "le-3", chapter: "Linear Equations in One Variable", title: "Variables on both sides",
    objective: "Collect variable terms on one side and constants on the other.",
    beats: [
      { kind: "teach", id: "c1", stage: "Welcome", title: "Next level", text: "Sometimes x appears on both sides, like 3x + 2 = x + 8. Our goal stays the same: get all the x terms on one side." },
      { kind: "teach", id: "c2", stage: "Worked example", title: "Worked example", text: "Solve 3x + 2 = x + 8.", steps: [
        { text: "Subtract x from both sides.", eq: "2x + 2 = 8" },
        { text: "Subtract 2 from both sides.", eq: "2x = 6" },
        { text: "Divide both sides by 2.", eq: "x = 3" },
        { text: "Check.", eq: "3(3) + 2 = 11 and 3 + 8 = 11 ✓" },
      ] },
      { kind: "question", id: "q1", title: "Quick check", prompt: "Solve: 5x = 3x + 10", qtype: "input", answer: "5", partial: ["2x=10", "2x = 10"], hint: "Subtract 3x from both sides first.", partialMsg: "Good — 2x = 10 is correct. One more step: divide by 2.", wrong: "Subtract 3x from both sides to get 2x = 10, then divide by 2.", correct: "Correct! x = 5.", explain: "5x − 3x = 10 → 2x = 10 → x = 5." },
    ],
  },
};

export const LESSON_ORDER = ["le-1", "le-2", "le-3"];

export const FOLLOWUP_RESPONSES: { match: RegExp; answer: string }[] = [
  { match: /why|both side/i, answer: "Great question! An equation says two things are equal. If you change only one side, the equality breaks — like removing weight from one pan of a balance. Doing the same on both sides keeps it true." },
  { match: /negative|minus|subtract/i, answer: "Subtraction is the inverse of addition. If x has 4 added to it, subtracting 4 brings you back to x. We do it on both sides to keep the balance." },
  { match: /check|verify/i, answer: "To check, put your answer back in the original equation. For x = 6 in x + 4 = 10: 6 + 4 = 10 ✓. If both sides match, your solution is correct." },
  { match: /exam|marks|test/i, answer: "In exams, write: (1) the equation, (2) the operation on both sides, (3) the simplified result, (4) a verification line. Teachers award marks for each step." },
  { match: /example|another/i, answer: "Here is another: x + 12 = 20. Subtract 12 from both sides: x = 8. Check: 8 + 12 = 20 ✓. Want me to give you a practice question like this?" },
];
