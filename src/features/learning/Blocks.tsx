import React from "react";
import type { Block } from "@/data/mock-conversations";
import { Lightbulb } from "lucide-react";

export function moonPath(i: number, r = 20) {
  const fr = [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25][i];
  const waxing = i <= 4;
  if (i === 0) return "";
  if (i === 4) return `M0 -${r} A${r} ${r} 0 1 1 0 ${r} A${r} ${r} 0 1 1 0 -${r}`;
  const rx = Math.abs(1 - 2 * fr) * r;
  const sweepOuter = waxing ? 1 : 0;
  const sweepInner = (fr < 0.5) === waxing ? 1 : 0;
  return `M0 -${r} A${r} ${r} 0 0 ${sweepOuter} 0 ${r} A${rx} ${r} 0 0 ${sweepInner} 0 -${r}`;
}

export function MoonPhases() {
  const names = ["New", "Waxing crescent", "First quarter", "Waxing gibbous", "Full", "Waning gibbous", "Last quarter", "Waning crescent"];
  return (
    <figure className="my-3 overflow-x-auto rounded-xl bg-oxford p-4" aria-label="Diagram of the eight phases of the Moon">
      <div className="flex min-w-[520px] justify-between gap-2">
        {names.map((name, i) => (
          <div key={i} className="flex w-16 flex-col items-center text-center">
            <svg width="48" height="48" viewBox="-24 -24 48 48"><circle r="20" fill="#1D3557" stroke="#4F77A8" /><path d={moonPath(i)} fill="#FFC20E" /></svg>
            <span className="mt-1 text-[10px] leading-tight text-white/80">{name}</span>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-center text-xs text-white/60">Illustration · the Sun always lights half of the Moon</figcaption>
    </figure>
  );
}

export function Triangle() {
  return (
    <figure className="my-3 rounded-xl bg-white p-3" aria-label="Right-angled triangle with sides a, b and hypotenuse c">
      <svg viewBox="0 0 240 150" className="mx-auto w-full max-w-xs">
        <polygon points="30,120 190,120 30,30" fill="#EEF3FA" stroke="#002147" strokeWidth="2.5" />
        <rect x="30" y="106" width="14" height="14" fill="none" stroke="#DC143C" strokeWidth="2" />
        <text x="110" y="140" textAnchor="middle" fontSize="14" fill="#002147" fontWeight="700">b</text>
        <text x="16" y="80" textAnchor="middle" fontSize="14" fill="#002147" fontWeight="700">a</text>
        <text x="122" y="68" fontSize="14" fill="#DC143C" fontWeight="700">c (hypotenuse)</text>
      </svg>
    </figure>
  );
}

export function RenderBlocks({ blocks, onFollow }: { blocks: Block[]; onFollow?: (t: string) => void }) {
  return (
    <div className="space-y-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h": return <h4 key={i} className="pt-1 font-display text-lg text-oxford dark:text-white">{b.text}</h4>;
          case "p": return <p key={i}>{b.text}</p>;
          case "list": return <ul key={i} className="list-disc space-y-1 pl-5">{b.items.map((x) => <li key={x}>{x}</li>)}</ul>;
          case "formula": return <div key={i} className="rounded-xl bg-oxford-50 px-4 py-3 text-center font-display text-xl text-oxford">{b.text}</div>;
          case "table": return (
            <div key={i} className="overflow-x-auto rounded-xl border border-line"><table className="w-full text-sm"><thead className="bg-oxford-50 text-oxford"><tr>{b.head.map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
              <tbody>{b.rows.map((r, ri) => <tr key={ri} className="border-t border-line">{r.map((c, ci) => <td key={ci} className="px-3 py-2">{c}</td>)}</tr>)}</tbody></table></div>);
          case "moon": return <MoonPhases key={i} />;
          case "triangle": return <Triangle key={i} />;
          case "example": return <div key={i} className="flex gap-2 rounded-xl border-l-4 border-sun bg-sun-50 px-3 py-2.5 text-sm text-ink"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn-700" /><span><b>Example: </b>{b.text}</span></div>;
          case "follow": return (
            <div key={i} className="pt-1"><p className="font-medium text-oxford dark:text-white">{b.text}</p>
              {onFollow && <div className="mt-2 flex flex-wrap gap-2">{["Yes, please", "Quiz me", "Explain simpler"].map((o) => <button key={o} onClick={() => onFollow(o)} className="rounded-full border border-oxford-200 bg-white px-3 py-1 text-xs font-medium text-oxford hover:bg-oxford-50">{o}</button>)}</div>}</div>);
        }
      })}
    </div>
  );
}
