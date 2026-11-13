import React from "react";

/** Renders **bold**, *italic* and newlines */
export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <div className={className}>
      {lines.map((ln, i) => (
        <p key={i} className={i ? "mt-2" : ""}>
          {ln.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, j) =>
            p.startsWith("**") ? <strong key={j} className="font-semibold text-oxford dark:text-white">{p.slice(2, -2)}</strong>
              : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <em key={j}>{p.slice(1, -1)}</em> : <React.Fragment key={j}>{p}</React.Fragment>)}
        </p>
      ))}
    </div>
  );
}

export function Equation({ children, big }: { children: React.ReactNode; big?: boolean }) {
  return <div className={`my-3 rounded-xl border border-oxford-100 bg-white px-4 py-3 text-center font-display tracking-wide text-oxford ${big ? "text-3xl" : "text-xl"}`}>{children}</div>;
}

/** Balance-scale illustration for equations like x + 4 = 10 */
export function BalanceVisual({ left, right, note }: { left: string; right: string; note?: string }) {
  const counters = (n: number, x0: number, y0: number, color: string) =>
    Array.from({ length: n }, (_, i) => <circle key={i} cx={x0 + (i % 5) * 15} cy={y0 - Math.floor(i / 5) * 15} r={6} fill={color} />);
  const hasX = left.includes("x");
  const a = parseInt(left.replace(/[^0-9]/g, "") || "0", 10);
  const b = parseInt(right.replace(/[^0-9]/g, "") || "0", 10);
  return (
    <figure className="my-3 rounded-xl border border-line bg-white p-3" aria-label={`Balance scale showing ${left} equals ${right}`}>
      <svg viewBox="0 0 360 190" className="mx-auto w-full max-w-md">
        <rect x="170" y="40" width="20" height="120" rx="4" fill="#B7CBE6" />
        <rect x="110" y="160" width="140" height="12" rx="6" fill="#002147" />
        <rect x="40" y="38" width="280" height="8" rx="4" fill="#002147" />
        {/* left pan */}
        <path d="M50 46 L30 110 H130 L110 46" fill="none" stroke="#8AA9D0" strokeWidth="2" />
        <rect x="26" y="108" width="108" height="8" rx="4" fill="#DC143C" />
        {hasX && <g><rect x="40" y="70" width="34" height="34" rx="6" fill="#FFC20E" /><text x="57" y="94" textAnchor="middle" fontWeight="700" fontSize="20" fill="#002147">x</text></g>}
        {counters(Math.min(a, 10), hasX ? 84 : 44, 96, "#002147")}
        {/* right pan */}
        <path d="M250 46 L230 110 H330 L310 46" fill="none" stroke="#8AA9D0" strokeWidth="2" />
        <rect x="226" y="108" width="108" height="8" rx="4" fill="#DC143C" />
        {counters(Math.min(b, 15), 240, 96, "#002147")}
        <text x="180" y="24" textAnchor="middle" fontSize="13" fill="#002147" fontWeight="600">{left} = {right}</text>
      </svg>
      {note && <figcaption className="text-center text-xs text-slate-500">{note}</figcaption>}
    </figure>
  );
}
