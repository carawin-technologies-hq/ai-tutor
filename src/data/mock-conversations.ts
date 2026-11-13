export type Block =
  | { t: "h"; text: string } | { t: "p"; text: string } | { t: "list"; items: string[] }
  | { t: "formula"; text: string } | { t: "table"; head: string[]; rows: string[][] }
  | { t: "moon" } | { t: "triangle" } | { t: "example"; text: string } | { t: "follow"; text: string };

export interface Msg { id: string; from: "me" | "ai"; text?: string; blocks?: Block[]; saved?: boolean }
export interface Conversation { id: string; title: string; subject: string; date: string; messages: Msg[] }

export const SUGGESTED = [
  "Why does the moon change its shape?",
  "Explain the Pythagoras theorem",
  "What is photosynthesis?",
  "How do I solve x + 4 = 10?",
  "Give me tips for my Maths exam",
];

const KB: { match: RegExp; subject: string; title: string; blocks: Block[] }[] = [
  { match: /moon|phase/i, subject: "Science", title: "Why the Moon changes shape", blocks: [
    { t: "p", text: "The Moon does not actually change its shape. What changes is the part of the Moon illuminated by the Sun that we can see from Earth." },
    { t: "h", text: "Why it happens" },
    { t: "p", text: "The Moon orbits the Earth about once every 29.5 days. Half of the Moon is always lit by the Sun — but as it moves around us, we see different amounts of that lit half." },
    { t: "moon" },
    { t: "table", head: ["Phase", "What we see", "Approx. day"], rows: [["New Moon", "Nothing (dark side faces us)", "0"], ["First Quarter", "Right half lit", "≈ 7"], ["Full Moon", "Whole face lit", "≈ 15"], ["Last Quarter", "Left half lit", "≈ 22"]] },
    { t: "example", text: "Hold a ball near a lamp in a dark room and slowly walk around it. The ball always has a lit half, but your view of it changes — exactly like the Moon." },
    { t: "follow", text: "Would you like me to show you the four main phases in more detail, or quiz you on them?" },
  ]},
  { match: /pythag|right.?angle|hypotenuse/i, subject: "Mathematics", title: "Pythagoras theorem", blocks: [
    { t: "p", text: "In a right-angled triangle, the square of the longest side (the hypotenuse) equals the sum of the squares of the other two sides." },
    { t: "formula", text: "a² + b² = c²" },
    { t: "triangle" },
    { t: "example", text: "If the two shorter sides are 3 cm and 4 cm: c² = 9 + 16 = 25, so c = 5 cm." },
    { t: "table", head: ["a", "b", "c"], rows: [["3", "4", "5"], ["5", "12", "13"], ["8", "15", "17"]] },
    { t: "follow", text: "Want to try one? A right triangle has sides 6 cm and 8 cm. What is the hypotenuse?" },
  ]},
  { match: /photosynth|plant.*food|chlorophyll/i, subject: "Science", title: "Photosynthesis", blocks: [
    { t: "p", text: "Photosynthesis is how green plants make their own food using sunlight, water and carbon dioxide." },
    { t: "formula", text: "6CO₂ + 6H₂O  —(sunlight, chlorophyll)→  C₆H₁₂O₆ + 6O₂" },
    { t: "list", items: ["Leaves absorb sunlight using chlorophyll.", "Roots absorb water; leaves take in carbon dioxide through stomata.", "Glucose (food) is made and oxygen is released."] },
    { t: "follow", text: "Shall I explain why leaves are green, or give you a quick quiz?" },
  ]},
  { match: /x\s*\+\s*4|solve|equation|linear/i, subject: "Mathematics", title: "Solving x + 4 = 10", blocks: [
    { t: "p", text: "To solve x + 4 = 10, undo the “+ 4” by subtracting 4 from both sides so the equation stays balanced." },
    { t: "formula", text: "x + 4 − 4 = 10 − 4  ⟹  x = 6" },
    { t: "example", text: "Check: 6 + 4 = 10 ✓" },
    { t: "follow", text: "Ready for a trickier one? Try: x − 5 = 12." },
  ]},
  { match: /exam|tip|prepare|revision|study/i, subject: "General", title: "Maths exam tips", blocks: [
    { t: "h", text: "Five tips for your Maths exam" },
    { t: "list", items: ["Revise formulas daily using flashcards.", "Practise weak topics first — for you, that's Factorisation.", "Show every step; marks are awarded for method.", "Check each answer by substituting back.", "Attempt a timed mock paper once a week."] },
    { t: "follow", text: "Should I add a revision plan for the next 14 days to your study planner?" },
  ]},
];

export function mockReply(q: string): { title: string; subject: string; blocks: Block[] } {
  const hit = KB.find((k) => k.match.test(q));
  if (hit) return hit;
  return { title: q.slice(0, 40), subject: "General", blocks: [
    { t: "p", text: "That's a good question! In this prototype, the teacher has detailed demo answers for a few topics (the Moon, Pythagoras theorem, photosynthesis, linear equations and exam tips)." },
    { t: "p", text: "A real response would be tailored to your board, class and chapter. Try one of the suggested questions below to see a full answer." },
    { t: "follow", text: "Would you like to try “Why does the moon change its shape?”" },
  ]};
}

export const SEED_CONVERSATIONS: Conversation[] = [
  { id: "c1", title: "Pythagoras theorem", subject: "Mathematics", date: "2026-11-10", messages: [
    { id: "m1", from: "me", text: "Explain the Pythagoras theorem" },
    { id: "m2", from: "ai", blocks: KB[1].blocks },
  ]},
  { id: "c2", title: "Photosynthesis", subject: "Science", date: "2026-11-08", messages: [
    { id: "m3", from: "me", text: "What is photosynthesis?" },
    { id: "m4", from: "ai", blocks: KB[2].blocks },
  ]},
];
