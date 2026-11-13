import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function masteryState(pct: number): "strong" | "developing" | "revise" {
  if (pct >= 80) return "strong";
  if (pct >= 55) return "developing";
  return "revise";
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
