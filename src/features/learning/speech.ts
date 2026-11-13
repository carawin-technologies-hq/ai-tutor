import type { Block } from "@/data/mock-conversations";
import type { VoiceSignal } from "@/hooks/useTeacherVoice";

const SUP: Record<string, string> = { "²": " squared", "³": " cubed" };

/** How a teacher would read a written formula out loud. */
function formulaToSpeech(f: string): string {
  if (/[₀-₉]/.test(f)) return "Let me write the equation on the board.";
  return f
    .replace(/[²³]/g, (m) => SUP[m])
    .replace(/⟹/g, ", so ")
    .replace(/→/g, " gives ")
    .replace(/[−-]/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/=/g, " equals ")
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ");
}

/** What the teacher says while writing each block on the board. */
export function blockSpeech(b: Block): string {
  switch (b.t) {
    case "h": return b.text + ".";
    case "p": case "follow": return b.text;
    case "example": return "For example: " + b.text;
    case "list": return b.items.join(" ");
    case "formula": return formulaToSpeech(b.text) + ".";
    case "table": return "Let's put this in a table. " + b.rows.map((r) => r.join(", ")).join(". ") + ".";
    case "moon": return "Let me draw the phases of the Moon. New moon, crescent, first quarter, gibbous, and full moon, then back again.";
    case "triangle": return "Let me draw a right-angled triangle. These two shorter sides are a and b, and the longest side, opposite the right angle, is c, the hypotenuse.";
  }
}

export interface SpeechPlan { text: string; ranges: [number, number][] }

/** Full spoken script plus the character range of each block, so the board can write in step with the voice. */
export function speechPlan(blocks: Block[] = []): SpeechPlan {
  let text = "";
  const ranges: [number, number][] = [];
  for (const b of blocks) {
    const s = blockSpeech(b).replace(/\s+/g, " ").trim();
    if (text) text += " ";
    const start = text.length;
    text += s;
    ranges.push([start, text.length]);
  }
  return { text, ranges };
}

/** Best estimate of the character currently being spoken. */
export function speechPosition(sig: VoiceSignal): number {
  return sig.charIndex + ((performance.now() - sig.syncAt) / 1000) * sig.cps;
}

/** Where on screen (client px) the teacher should point, shared between the board and the 3D teacher. */
export interface BoardPointer { x: number; y: number; active: boolean }

/**
 * Layout of the teacher standing at the right-hand end of the whiteboard.
 * halfV: half the visible height in cm; s: px per cm; avatarX: her centre in px from the stage's left;
 * reserve: px of board on the right that text should keep clear of.
 */
export function presenterLayout(W: number, H: number) {
  // Thighs-up framing so her hands and gestures are always in view.
  const halfV = W < 640 ? 88 : H < 480 ? 74 : 66;
  const s = H / (2 * halfV);
  const avatarX = W - 50 * s;
  const reserve = Math.min(105 * s, W * 0.5);
  return { halfV, s, avatarX, reserve, centerY: 194 - halfV };
}
