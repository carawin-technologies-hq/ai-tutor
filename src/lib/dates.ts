export const todayStr = () => new Date().toISOString().slice(0, 10);
export function addDays(base: string | Date, n: number) {
  const d = new Date(base); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
}
export function daysUntil(dateStr: string) {
  const a = new Date(todayStr()).getTime(); const b = new Date(dateStr).getTime();
  return Math.round((b - a) / 86400000);
}
export function fmtDate(dateStr: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", opts);
}
