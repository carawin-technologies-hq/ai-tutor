import { cn } from "@/lib/utils";
export function Logo({ className, light, compact }: { className?: string; light?: boolean; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden>
        <rect width="40" height="40" rx="11" fill={light ? "#fff" : "#002147"} />
        <path d="M11 24.5 20 11l9 13.5" stroke="#FFC20E" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M14.5 29h11" stroke="#DC143C" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className={cn("font-display text-[17px] font-bold tracking-wide", light ? "text-white" : "text-oxford dark:text-white")}>CARAWIN</div>
          <div className={cn("mt-0.5 text-[10px] font-semibold tracking-[0.22em]", light ? "text-sun" : "text-crimson")}>AI TUTOR</div>
        </div>
      )}
    </div>
  );
}
