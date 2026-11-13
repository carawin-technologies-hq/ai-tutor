"use client";
/**
 * Classroom whiteboard: the teacher "writes" each part of the answer with a marker,
 * in step with what she is saying (or at a reading pace when voice is off).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Caveat } from "next/font/google";
import type { Block } from "@/data/mock-conversations";
import type { VoiceSignal } from "@/hooks/useTeacherVoice";
import { cn } from "@/lib/utils";
import { moonPath } from "./Blocks";
import { speechPlan, speechPosition, type BoardPointer } from "./speech";

const hand = Caveat({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

const INK = { blue: "#1E3A8A", red: "#C8102E", green: "#15803D", black: "#1F2937" };
/** Characters per second for silent (voice off) writing. */
const SILENT_CPS = 26;

export type BoardMode = "speech" | "timer" | "static";

function useBoardPosition(mode: BoardMode, runKey: string, signal: React.MutableRefObject<VoiceSignal>, total: number, onDone?: () => void) {
  const [pos, setPos] = useState(mode === "static" ? Infinity : 0);
  const posRef = useRef(pos); posRef.current = pos;
  const doneRef = useRef(onDone); doneRef.current = onDone;
  useEffect(() => {
    if (mode === "static") { setPos(Infinity); return; }
    const start = performance.now();
    let raf = 0, last = 0, finished = false;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 40) return; last = now;
      const p = mode === "speech" ? (signal.current.speaking ? speechPosition(signal.current) : Infinity) : ((now - start) / 1000) * SILENT_CPS;
      setPos(p);
      if (mode === "timer" && p > total + 10 && !finished) { finished = true; doneRef.current?.(); }
    };
    setPos(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, runKey, signal, total]);
  return { pos, posRef };
}

/** Marker nib that follows the writing. */
function Nib({ color }: { color: string }) {
  return (
    <span data-nib className="relative inline-block h-0 w-0 align-baseline" aria-hidden>
      <svg width="34" height="34" viewBox="0 0 34 34" className="pointer-events-none absolute -top-7 left-0 drop-shadow-md">
        <g transform="rotate(35 17 17)">
          <rect x="13" y="0" width="8" height="20" rx="2" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="0.8" />
          <rect x="13" y="0" width="8" height="6" rx="2" fill={color} />
          <path d="M13 20 L21 20 L18.5 27 L15.5 27 Z" fill="#4B5563" />
          <path d="M15.5 27 L18.5 27 L17 31 Z" fill={color} />
        </g>
      </svg>
    </span>
  );
}

/** Text that appears letter by letter; unwritten text keeps its space so the board never reflows. */
function Written({ text, p, color, active }: { text: string; p: number; color: string; active: boolean }) {
  const n = Math.round(Math.max(0, Math.min(1, p)) * text.length);
  return (
    <span style={{ color }}>
      {text.slice(0, n)}
      {active && n < text.length && <Nib color={color} />}
      <span className="opacity-0">{text.slice(n)}</span>
    </span>
  );
}

function Underline({ p, color }: { p: number; color: string }) {
  return (
    <svg viewBox="0 0 300 10" preserveAspectRatio="none" className="mt-0.5 h-2.5 w-full max-w-md" aria-hidden>
      <path d="M2 6 C 70 2, 150 9, 298 4" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - Math.max(0, Math.min(1, p))} />
    </svg>
  );
}

function BoardMoon({ p }: { p: number }) {
  const names = ["New", "Crescent", "1st qtr", "Gibbous", "Full", "Gibbous", "Last qtr", "Crescent"];
  const shown = p * 8;
  return (
    <div className="my-2 flex flex-wrap justify-center gap-x-3 gap-y-2" role="img" aria-label="Hand-drawn phases of the Moon">
      {names.map((name, i) => {
        const local = Math.max(0, Math.min(1, shown - i));
        return (
          <div key={i} className="flex w-[58px] flex-col items-center" style={{ opacity: local > 0 ? 1 : 0 }}>
            <svg width="50" height="50" viewBox="-25 -25 50 50">
              <circle r="20" fill="none" stroke={INK.black} strokeWidth="2" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - Math.min(1, local * 1.6)} transform="rotate(-90)" />
              {local > 0.6 && i !== 0 && <path d={moonPath(i)} fill={INK.blue} fillOpacity={0.55 * Math.min(1, (local - 0.6) / 0.4)} />}
            </svg>
            <span className="text-lg leading-none" style={{ color: INK.red }}>{local > 0.8 ? name : " "}</span>
          </div>
        );
      })}
    </div>
  );
}

function BoardTriangle({ p }: { p: number }) {
  const seg = (a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));
  return (
    <svg viewBox="0 0 260 170" className="my-2 w-full max-w-sm" role="img" aria-label="Hand-drawn right-angled triangle with sides a, b and hypotenuse c">
      <path d="M40 140 L40 30" stroke={INK.black} strokeWidth="3" strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - seg(0, 0.2)} />
      <path d="M40 140 L210 140" stroke={INK.black} strokeWidth="3" strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - seg(0.15, 0.4)} />
      <path d="M210 140 L40 30" stroke={INK.red} strokeWidth="3.5" strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - seg(0.55, 0.8)} />
      <path d="M40 124 L56 124 L56 140" stroke={INK.blue} strokeWidth="2.5" fill="none" opacity={seg(0.4, 0.45)} />
      <text x="22" y="92" fontSize="30" fill={INK.blue} className={hand.className} opacity={seg(0.3, 0.4)}>a</text>
      <text x="120" y="164" fontSize="30" fill={INK.blue} className={hand.className} opacity={seg(0.4, 0.5)}>b</text>
      <text x="132" y="76" fontSize="28" fill={INK.red} className={hand.className} opacity={seg(0.8, 0.95)}>c (hypotenuse)</text>
    </svg>
  );
}

function BoardTable({ head, rows, p }: { head: string[]; rows: string[][]; p: number }) {
  const shownRows = p * (rows.length + 1);
  return (
    <div className="my-2 overflow-x-auto">
      <table className="text-[22px] leading-tight" style={{ color: INK.blue }}>
        <thead>
          <tr style={{ opacity: shownRows > 0 ? 1 : 0 }}>
            {head.map((h) => <th key={h} className="border-b-[3px] px-3 pb-1 text-left font-bold" style={{ borderColor: INK.black, color: INK.black }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ opacity: Math.max(0, Math.min(1, shownRows - 1 - ri)) }}>
              {r.map((c, ci) => <td key={ci} className={cn("px-3 py-0.5", ci > 0 && "border-l-2")} style={{ borderColor: "#9CA3AF" }}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BoardList({ items, p, active }: { items: string[]; p: number; active: boolean }) {
  const total = items.reduce((s, x) => s + x.length, 0);
  let used = 0;
  return (
    <ol className="my-1 space-y-0.5">
      {items.map((it, i) => {
        const local = (p * total - used) / it.length; used += it.length;
        const on = local > 0 && local < 1;
        return (
          <li key={i} className="flex gap-2" style={{ opacity: local > 0 ? 1 : 0 }}>
            <span style={{ color: INK.red }}>{i + 1}.</span>
            <Written text={it} p={local} color={INK.blue} active={active && on} />
          </li>
        );
      })}
    </ol>
  );
}

function BoardBlock({ b, p, active, onFollow }: { b: Block; p: number; active: boolean; onFollow?: (t: string) => void }) {
  switch (b.t) {
    case "h": return <div className="pt-2 text-[34px] font-bold leading-tight"><Written text={b.text} p={p * 1.15} color={INK.black} active={active} /><Underline p={(p - 0.75) * 4} color={INK.red} /></div>;
    case "p": return <p className="text-[26px] leading-snug"><Written text={b.text} p={p} color={INK.blue} active={active} /></p>;
    case "list": return <div className="text-[26px] leading-snug"><BoardList items={b.items} p={p} active={active} /></div>;
    case "formula": return (
      <div className="my-2 flex justify-center">
        <div className="relative rounded-[40%_50%_45%_55%/55%_45%_55%_45%] border-[3px] px-6 py-2 text-[36px] font-bold" style={{ borderColor: p >= 1 ? INK.red : "transparent", transition: "border-color .4s" }}>
          <Written text={b.text} p={p * 1.2} color={INK.black} active={active} />
        </div>
      </div>
    );
    case "table": return <BoardTable head={b.head} rows={b.rows} p={p} />;
    case "moon": return <BoardMoon p={p} />;
    case "triangle": return <div className="flex justify-center"><BoardTriangle p={p} /></div>;
    case "example": return (
      <div className="my-1 rounded-lg border-2 border-dashed px-3 py-1 text-[25px] leading-snug" style={{ borderColor: p > 0 ? INK.green : "transparent" }}>
        <Written text={"e.g.  " + b.text} p={p} color={INK.green} active={active} />
      </div>
    );
    case "follow": return (
      <div className="pt-2 text-[27px] font-semibold leading-snug">
        <Written text={"→ " + b.text} p={p} color={INK.red} active={active} />
        {onFollow && p >= 1 && (
          <div className="mt-2 flex flex-wrap gap-2 font-sans text-sm font-medium">
            {["Yes, please", "Quiz me", "Explain simpler"].map((o) => (
              <button key={o} onClick={(e) => { e.stopPropagation(); onFollow(o); }} className="rounded-full border border-oxford-200 bg-white px-3 py-1 text-oxford shadow-sm hover:bg-oxford-50">{o}</button>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default function Whiteboard({
  blocks, question, subject, mode, runKey, signal, onDone, onFollow, className,
  pointer, focusIdx, onBlockClick, reserveRight = 0, footer,
}: {
  blocks: Block[]; question?: string; subject?: string; mode: BoardMode; runKey: string;
  signal: React.MutableRefObject<VoiceSignal>; onDone?: () => void; onFollow?: (t: string) => void; className?: string;
  /** Shared with the 3D teacher so she can point at what is being written. */
  pointer?: React.MutableRefObject<BoardPointer>;
  /** Block the teacher is currently re-explaining (highlighted and pointed at). */
  focusIdx?: number | null;
  onBlockClick?: (i: number) => void;
  /** Pixels on the right kept clear for the teacher standing at the board. */
  reserveRight?: number;
  footer?: React.ReactNode;
}) {
  const plan = useMemo(() => speechPlan(blocks), [blocks]);
  const { pos, posRef } = useBoardPosition(mode, runKey, signal, plan.text.length, onDone);
  const activeIdx = plan.ranges.findIndex(([s, e]) => pos >= s && pos < e);
  const scroller = useRef<HTMLDivElement>(null);
  const activeEl = useRef<HTMLDivElement>(null);
  const blockEls = useRef<(HTMLDivElement | null)[]>([]);

  // Tell the teacher where to point: the marker nib while writing, or the block she's re-explaining.
  // She points while writing the first part of each line, then turns to the class and explains with her hands.
  useEffect(() => {
    if (!pointer) return;
    let raf = 0;
    // Point just past the right end of an item's visible content (her arm comes from the right, so it won't cover it).
    const pointBeside = (el: HTMLElement, ptr: BoardPointer) => {
      const range = document.createRange(); range.selectNodeContents(el);
      const r = range.getBoundingClientRect(), box = el.getBoundingClientRect();
      const cr = r.width > 0 ? r : box;
      ptr.x = Math.min(cr.right + 14, box.right); ptr.y = cr.top + Math.min(cr.height / 2, 30); ptr.active = true;
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const ptr = pointer.current;
      if (focusIdx != null && signal.current.speaking) {
        const el = blockEls.current[focusIdx];
        if (el) { pointBeside(el, ptr); return; }
      }
      const p = posRef.current;
      const i = plan.ranges.findIndex(([s, e]) => p >= s && p < e);
      if (mode === "static" || i < 0) { ptr.active = false; return; }
      const [s, e] = plan.ranges[i];
      const local = (p - s) / Math.max(1, e - s);
      const nib = scroller.current?.querySelector("[data-nib]") as HTMLElement | null;
      const el = nib ?? blockEls.current[i];
      if (!el || local > 0.6) { ptr.active = false; return; }
      if (!nib) { pointBeside(el, ptr); return; }
      const r = el.getBoundingClientRect();
      ptr.x = r.left; ptr.y = r.top - 8; ptr.active = true;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); pointer.current.active = false; };
  }, [pointer, focusIdx, signal, mode, plan, posRef]);

  useEffect(() => { activeEl.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [activeIdx]);

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className={cn("relative flex flex-col rounded-2xl p-3 shadow-lift", className)} style={{ background: "linear-gradient(145deg,#d9dde3,#aeb5bf 45%,#cfd4db)" }}>
      {/* Board surface */}
      <div
        ref={scroller}
        className={cn(hand.className, "relative min-h-0 flex-1 overflow-y-auto rounded-lg px-6 pb-10 pt-5 scroll-thin sm:px-10")}
        style={{
          paddingRight: reserveRight ? reserveRight : undefined,
          background:
            "radial-gradient(ellipse at 20% 15%, rgba(255,255,255,.95), transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(200,210,225,.18), transparent 60%), radial-gradient(ellipse at 60% 30%, rgba(30,58,138,.035), transparent 30%), linear-gradient(180deg,#fbfcfd,#f1f4f7)",
          boxShadow: "inset 0 2px 6px rgba(0,0,0,.12)",
        }}
        aria-live="polite"
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          {question ? (
            <div className="max-w-[70%] -rotate-1 rounded-sm bg-[#FFF3A3] px-3 py-1.5 text-[22px] leading-tight text-[#5b4a00] shadow-md">
              Q: {question}
            </div>
          ) : <span />}
          <div className="shrink-0 text-right text-[22px] leading-tight" style={{ color: INK.black }}>
            <div>{today}</div>
            {subject && <div style={{ color: INK.red }}>{subject}</div>}
          </div>
        </div>
        <div className="space-y-1">
          {blocks.map((b, i) => {
            const [s, e] = plan.ranges[i];
            const p = pos >= e ? 1 : pos <= s ? 0 : (pos - s) / Math.max(1, e - s);
            if (p <= 0 && i !== activeIdx) return null;
            const clickable = !!onBlockClick && p >= 1 && b.t !== "follow";
            return (
              <div
                key={i}
                ref={(el) => { blockEls.current[i] = el; if (i === activeIdx) (activeEl as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
                onClick={clickable ? () => onBlockClick!(i) : undefined}
                title={clickable ? "Tap to have Ms. Cara explain this part again" : undefined}
                className={cn("-mx-2 rounded-lg px-2 transition-colors", clickable && "cursor-pointer hover:bg-sky-100/40")}
                style={focusIdx === i ? { background: "linear-gradient(transparent 12%, rgba(255,226,70,.45) 12%, rgba(255,226,70,.45) 88%, transparent 88%)" } : undefined}
              >
                <BoardBlock b={b} p={p} active={i === activeIdx} onFollow={onFollow} />
              </div>
            );
          })}
        </div>
        {footer}
      </div>
      {/* Marker tray */}
      <div className="mx-auto mt-2 flex h-4 w-2/3 items-center justify-center gap-3 rounded-b-lg bg-gradient-to-b from-[#c4c9d0] to-[#9aa1ab] px-4 shadow-inner" aria-hidden>
        {[INK.blue, INK.red, INK.green, INK.black].map((c) => (
          <span key={c} className="h-2.5 w-12 rounded-full" style={{ background: `linear-gradient(90deg, ${c} 0 22%, #f3f4f6 22% 100%)`, boxShadow: "0 1px 1px rgba(0,0,0,.3)" }} />
        ))}
        <span className="h-3 w-10 rounded-sm bg-gradient-to-b from-[#374151] to-[#111827]" />
      </div>
    </div>
  );
}
