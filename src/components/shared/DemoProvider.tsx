"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePersisted } from "@/hooks/usePersisted";
import { DEMO_STUDENT } from "@/data/mock-students";
import type { Role, StudentProfile, Notice } from "@/types";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Toast { id: number; msg: string; kind: "success" | "info" | "warn" }
interface Ctx {
  role: Role; setRole: (r: Role) => void;
  profile: StudentProfile; setProfile: (p: Partial<StudentProfile>) => void;
  onboarded: boolean; setOnboarded: (v: boolean) => void;
  theme: "light" | "dark"; setTheme: (t: "light" | "dark") => void;
  toast: (msg: string, kind?: Toast["kind"]) => void;
  notices: Notice[]; setNotices: (n: Notice[] | ((p: Notice[]) => Notice[])) => void;
  resetDemo: () => void;
}
const C = createContext<Ctx | null>(null);
export const useDemo = () => { const c = useContext(C); if (!c) throw new Error("DemoProvider missing"); return c; };

const INITIAL_NOTICES: Notice[] = [
  { id: "n1", title: "Revision suggested", body: "Factorisation accuracy is 38%. A 15-minute revision is recommended.", time: "10 min ago", read: false, kind: "warning" },
  { id: "n2", title: "Streak: 12 days 🔥", body: "You have studied 12 days in a row. Keep going!", time: "2 h ago", read: false, kind: "success" },
  { id: "n3", title: "Unit Test 3 in 14 days", body: "Your Mathematics syllabus completion is 72%.", time: "Yesterday", read: true, kind: "info" },
];

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleS] = usePersisted<Role>("role", "student");
  const [profile, setProfileS] = usePersisted<StudentProfile>("profile", DEMO_STUDENT);
  const [onboarded, setOnboarded] = usePersisted<boolean>("onboarded", true);
  const [theme, setTheme] = usePersisted<"light" | "dark">("theme", "light");
  const [notices, setNotices] = usePersisted<Notice[]>("notices", INITIAL_NOTICES);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);

  const toast = useCallback((msg: string, kind: Toast["kind"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const resetDemo = () => {
    Object.keys(localStorage).filter((k) => k.startsWith("carawin:")).forEach((k) => localStorage.removeItem(k));
    location.href = "/";
  };

  return (
    <C.Provider value={{
      role, setRole: setRoleS, profile, setProfile: (p) => setProfileS((x) => ({ ...x, ...p })),
      onboarded, setOnboarded, theme, setTheme, toast, notices, setNotices, resetDemo,
    }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
              className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl bg-oxford px-4 py-3 text-sm text-white shadow-lift">
              {t.kind === "success" ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : t.kind === "warn" ? <AlertTriangle className="h-4 w-4 text-sun" /> : <Info className="h-4 w-4 text-sky-300" />}
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </C.Provider>
  );
}
