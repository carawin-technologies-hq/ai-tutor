/** Mouth shapes (Oculus viseme set) and a simple letter-to-viseme mapping for text-driven lip-sync. */
export const VISEMES = ["sil", "PP", "FF", "TH", "DD", "kk", "CH", "SS", "nn", "RR", "aa", "E", "I", "O", "U"] as const;
export type Viseme = (typeof VISEMES)[number];

export function charViseme(text: string, i: number): Viseme {
  const c = text[i]?.toLowerCase() ?? " ";
  const n = text[i + 1]?.toLowerCase() ?? "";
  if (c === "t" && n === "h") return "TH";
  if ((c === "c" || c === "s") && n === "h") return "CH";
  if ("a".includes(c)) return "aa";
  if ("e".includes(c)) return "E";
  if ("iy".includes(c)) return "I";
  if ("o".includes(c)) return "O";
  if ("uw".includes(c)) return "U";
  if ("bmp".includes(c)) return "PP";
  if ("fv".includes(c)) return "FF";
  if ("dtl".includes(c)) return "DD";
  if ("kgcq".includes(c)) return "kk";
  if ("jx".includes(c)) return "CH";
  if ("sz".includes(c)) return "SS";
  if ("n".includes(c)) return "nn";
  if ("r".includes(c)) return "RR";
  if ("h".includes(c)) return "E";
  return "sil";
}
