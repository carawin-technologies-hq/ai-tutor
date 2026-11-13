"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X, Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/* ---------- Button ---------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "outline" | "ghost" | "soft" | "yellow" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};
export const Button = React.forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { className, variant = "primary", size = "md", ...props }, ref) {
  const v = {
    primary: "bg-oxford text-white hover:bg-oxford-600 shadow-sm",
    accent: "bg-crimson text-white hover:bg-crimson-600 shadow-sm",
    yellow: "bg-sun text-oxford hover:bg-sun-600 font-semibold",
    outline: "border border-line bg-white text-ink hover:bg-oxford-50 dark:bg-transparent dark:text-slate-100 dark:border-[#2A3F63] dark:hover:bg-[#16284a]",
    ghost: "text-ink hover:bg-oxford-50 dark:text-slate-100 dark:hover:bg-[#16284a]",
    soft: "bg-oxford-50 text-oxford hover:bg-oxford-100 dark:bg-[#16284a] dark:text-slate-100",
    danger: "bg-crimson-50 text-crimson hover:bg-crimson-100",
  }[variant];
  const s = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base", icon: "h-10 w-10 justify-center" }[size];
  return (
    <button ref={ref}
      className={cn("inline-flex items-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap", v, s, className)}
      {...props} />
  );
});

/* ---------- Card ---------- */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-surface", className)} {...p} />;
}
export function CardHeader({ title, subtitle, action, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="min-w-0">
        <h3 className="font-semibold text-base text-oxford dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Badge ---------- */
export function Badge({ tone = "neutral", className, children }: { tone?: "neutral" | "blue" | "red" | "yellow" | "green" | "amber"; className?: string; children: React.ReactNode }) {
  const t = {
    neutral: "bg-slate-100 text-slate-700",
    blue: "bg-oxford-50 text-oxford",
    red: "bg-crimson-50 text-crimson",
    yellow: "bg-sun-50 text-warn-700",
    green: "bg-success-50 text-success-700",
    amber: "bg-warn-50 text-warn-700",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", t, className)}>{children}</span>;
}

export function MasteryBadge({ pct }: { pct: number }) {
  if (pct >= 80) return <Badge tone="green">Strong</Badge>;
  if (pct >= 55) return <Badge tone="amber">Developing</Badge>;
  return <Badge tone="red">Needs revision</Badge>;
}

export function DemoTag({ children = "Demonstration data" }: { children?: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">{children}</span>;
}

export function ComingSoon({ children = "Coming soon" }: { children?: React.ReactNode }) {
  return <Badge tone="yellow">{children}</Badge>;
}

/* ---------- Progress ---------- */
export function Progress({ value, className, tone }: { value: number; className?: string; tone?: "auto" | "blue" | "green" | "red" | "amber" }) {
  const t = tone ?? "auto";
  const color = t === "auto" ? (value >= 80 ? "bg-success" : value >= 55 ? "bg-warn" : "bg-crimson") : { blue: "bg-oxford", green: "bg-success", red: "bg-crimson", amber: "bg-warn" }[t];
  return (
    <div className={cn("h-2 w-full rounded-full bg-slate-100 overflow-hidden", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function RingProgress({ value, size = 72, stroke = 8, label }: { value: number; size?: number; stroke?: number; label?: React.ReactNode }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E3E8EF" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#002147" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} className="transition-all duration-700" />
      </svg>
      <div className="absolute text-sm font-semibold text-oxford">{label ?? `${Math.round(value)}%`}</div>
    </div>
  );
}

/* ---------- Form controls ---------- */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn("h-10 w-full rounded-xl border border-line bg-white px-3 text-sm placeholder:text-slate-400 focus:border-oxford focus:outline-none focus:ring-2 focus:ring-oxford/15 dark:bg-[#0F1C33] dark:border-[#2A3F63] dark:text-slate-100", className)} {...p} />;
});
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn("w-full rounded-xl border border-line bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-oxford focus:outline-none focus:ring-2 focus:ring-oxford/15 dark:bg-[#0F1C33] dark:border-[#2A3F63] dark:text-slate-100", className)} {...p} />;
});
export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn("h-10 w-full appearance-none rounded-xl border border-line bg-white pl-3 pr-8 text-sm focus:border-oxford focus:outline-none focus:ring-2 focus:ring-oxford/15 dark:bg-[#0F1C33] dark:border-[#2A3F63] dark:text-slate-100", className)} {...p}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
    </div>
  );
}
export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-oxford dark:text-slate-200">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-crimson" role="alert">{error}</span>}
    </label>
  );
}
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-oxford" : "bg-slate-300")}>
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors", checked ? "bg-oxford border-oxford text-white" : "bg-white border-slate-300")}>
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ---------- Tabs ---------- */
export function Tabs({ tabs, value, onChange, className }: { tabs: { id: string; label: React.ReactNode }[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div role="tablist" className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 scroll-thin", className)}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cn("whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors", value === t.id ? "bg-white text-oxford shadow-sm" : "text-slate-600 hover:text-oxford")}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  React.useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-oxford-900/50 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" aria-label={title}
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            className={cn("relative flex max-h-[90vh] w-full flex-col rounded-t-2xl sm:rounded-2xl bg-white text-ink shadow-lift", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-oxford">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto px-5 py-4 scroll-thin">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Accordion ---------- */
export function Accordion({ items }: { items: { id: string; title: React.ReactNode; content: React.ReactNode }[] }) {
  const [open, setOpen] = React.useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-white">
      {items.map((it) => (
        <div key={it.id}>
          <button className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-oxford" aria-expanded={open === it.id} onClick={() => setOpen(open === it.id ? null : it.id)}>
            {it.title}
            <ChevronDown className={cn("h-4 w-4 transition-transform", open === it.id && "rotate-180")} />
          </button>
          {open === it.id && <div className="px-4 pb-4 text-sm text-slate-600">{it.content}</div>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Tooltip ---------- */
export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span role="tooltip" className="pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-oxford px-2.5 py-1 text-xs text-white opacity-0 shadow-lift transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{text}</span>
    </span>
  );
}

/* ---------- Dropdown ---------- */
export function Dropdown({ trigger, children, align = "right" }: { trigger: React.ReactNode; children: (close: () => void) => React.ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, []);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className={cn("absolute z-50 mt-2 min-w-[200px] rounded-xl border border-line bg-white p-1.5 text-ink shadow-lift", align === "right" ? "right-0" : "left-0")}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
export function MenuItem({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-oxford-50", active && "bg-oxford-50 font-medium text-oxford")}>
      <span className="flex items-center gap-2">{children}</span>
      {active && <Check className="h-4 w-4" />}
    </button>
  );
}

/* ---------- Skeleton / Empty / Spinner ---------- */
export function Skeleton({ className }: { className?: string }) { return <div className={cn("skeleton", className)} />; }
export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} aria-label="Loading" />;
}
export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-oxford-50 text-oxford">{icon}</div>}
      <p className="font-semibold text-oxford">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Stat ---------- */
export function StatCard({ icon, label, value, sub, tone = "blue" }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "blue" | "red" | "yellow" | "green" }) {
  const t = { blue: "bg-oxford-50 text-oxford", red: "bg-crimson-50 text-crimson", yellow: "bg-sun-50 text-warn-700", green: "bg-success-50 text-success-700" }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", t)}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-semibold text-oxford dark:text-white leading-tight">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-display text-2xl sm:text-3xl text-oxford dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 max-w-2xl">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
