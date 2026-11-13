/**
 * The AI teacher: asks Claude for an answer as whiteboard blocks the app can write and speak.
 * Structured outputs guarantee the reply matches the board's block format.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { config } from "../config.js";
import type { StudentProfile } from "../db.js";
import { HttpError } from "../lib/http.js";

// Same block types the whiteboard renders (src/data/mock-conversations.ts → Block).
export const Block = z.discriminatedUnion("t", [
  z.object({ t: z.literal("h"), text: z.string().describe("Short heading") }),
  z.object({ t: z.literal("p"), text: z.string().describe("A short paragraph (1-3 sentences)") }),
  z.object({ t: z.literal("list"), items: z.array(z.string()) }),
  z.object({ t: z.literal("formula"), text: z.string().describe("One equation or formula, using Unicode symbols like ² ³ √ × ÷ − ⟹") }),
  z.object({ t: z.literal("table"), head: z.array(z.string()), rows: z.array(z.array(z.string())) }),
  z.object({ t: z.literal("example"), text: z.string().describe("An everyday or worked example") }),
  z.object({ t: z.literal("follow"), text: z.string().describe("A question inviting the student to continue") }),
  z.object({ t: z.literal("moon"), }).describe("Diagram of the 8 phases of the Moon. Only for Moon-phase topics."),
  z.object({ t: z.literal("triangle") }).describe("Diagram of a right-angled triangle with sides a, b and hypotenuse c. Only for Pythagoras / right triangles."),
]);
export type Block = z.infer<typeof Block>;

const Answer = z.object({
  title: z.string().describe("A short title for this conversation topic, e.g. 'Why the Moon changes shape'"),
  subject: z.string().describe("School subject: Mathematics, Science, English, Social Science, Hindi, Computer Science, or General"),
  blocks: z.array(Block),
});
export type TeacherAnswer = z.infer<typeof Answer>;

// Stable, cacheable instructions (kept byte-identical between requests).
const SYSTEM = `You are Ms. Cara, a warm, patient school teacher on CARAWIN AI TUTOR, teaching Indian school students (CBSE, ICSE and State Boards, classes 1–12).

You teach at a whiteboard. Your reply is written on the board and read aloud, so:
- Use the block types provided. Keep each paragraph to 1–3 short sentences. Prefer 4–9 blocks in total.
- Start by answering the question directly, then explain why, step by step.
- Put every equation in its own "formula" block. Use a "table" for comparisons, a "list" for steps or points, and an "example" for an everyday or worked example.
- Use the "moon" diagram only for phases of the Moon and the "triangle" diagram only for Pythagoras / right-angled triangles. Never invent other diagram types.
- End with exactly one "follow" block: a short question that checks understanding or offers what to learn next.
- Match the student's class level: simple words for younger classes, exam-relevant precision for older ones. Follow the NCERT/board syllabus and terminology.
- Adapt to the student's preferred teaching style and learning preferences when given.
- Write in English. If the student's preferred language is not English, you may add the key term in that language in brackets.
- If the student asks for a direct answer to homework, still show the method so they learn it.
- Stay on learning topics suitable for school students. If a request is unsafe or unrelated to learning, kindly steer back to studies.`;

const studentContext = (p: StudentProfile | null, name: string) => p ? [
  `Student: ${name.split(" ")[0]}, class ${p.classLevel}, ${p.board}${p.medium ? `, ${p.medium} medium` : ""}.`,
  p.subjects.length ? `Subjects: ${p.subjects.join(", ")}.` : "",
  p.teachingStyle ? `Preferred teaching style: ${p.teachingStyle}.` : "",
  p.styles.length ? `Learning preferences: ${p.styles.join(", ")}.` : "",
  `Preferred language: ${p.language}.`,
].filter(Boolean).join("\n") : `Student: ${name.split(" ")[0]}.`;

/** Plain-text version of earlier board answers, so Claude sees the conversation so far. */
export function blocksToText(blocks: Block[]): string {
  return blocks.map((b) => {
    switch (b.t) {
      case "h": case "p": case "formula": case "example": case "follow": return b.text;
      case "list": return b.items.map((i) => `- ${i}`).join("\n");
      case "table": return [b.head.join(" | "), ...b.rows.map((r) => r.join(" | "))].join("\n");
      case "moon": return "[diagram: phases of the Moon]";
      case "triangle": return "[diagram: right-angled triangle]";
    }
  }).join("\n");
}

let client: Anthropic | null = null;

export interface Turn { role: "STUDENT" | "TEACHER"; text?: string | null; blocks?: Block[] | null }

export async function askTeacher(history: Turn[], question: string, profile: StudentProfile | null, studentName: string): Promise<TeacherAnswer> {
  if (!config.ANTHROPIC_API_KEY) throw new HttpError(503, "ai_not_configured", "The AI teacher isn't set up on this server yet.");
  client ??= new Anthropic({ apiKey: config.ANTHROPIC_API_KEY, timeout: 90_000, maxRetries: 2 });

  const messages: Anthropic.Beta.BetaMessageParam[] = [];
  for (const t of history.slice(-12)) {
    const content = t.role === "STUDENT" ? (t.text ?? "") : blocksToText(t.blocks ?? []);
    if (!content.trim()) continue;
    messages.push({ role: t.role === "STUDENT" ? "user" : "assistant", content });
  }
  // The API needs the first message to be from the user.
  while (messages.length && messages[0].role !== "user") messages.shift();
  messages.push({ role: "user", content: question });

  let response;
  try {
    response = await client.beta.messages.parse({
      model: config.CLAUDE_MODEL,
      max_tokens: 16000,
      // If a safety check declines on this model, the API retries on a suitable fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: studentContext(profile, studentName) },
      ],
      output_config: { effort: "medium", format: betaZodOutputFormat(Answer) },
      messages,
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) throw new HttpError(503, "ai_busy", "The AI teacher is busy right now. Please try again in a moment.");
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      console.error("Claude API credentials problem:", err.message);
      throw new HttpError(503, "ai_not_configured", "The AI teacher isn't available right now.");
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`Claude API error ${err.status}:`, err.message);
      throw new HttpError(502, "ai_error", "The AI teacher couldn't answer just now. Please try again.");
    }
    throw err;
  }

  if (response.stop_reason === "refusal") {
    return { title: "Let's get back to learning", subject: "General", blocks: [
      { t: "p", text: "I can't help with that one, but I'd love to help you learn something from your syllabus." },
      { t: "follow", text: "Which subject or chapter would you like to explore?" },
    ] };
  }
  const out = response.parsed_output;
  if (!out || !out.blocks.length) throw new HttpError(502, "ai_error", "The AI teacher's answer was incomplete. Please ask again.");
  return out;
}
