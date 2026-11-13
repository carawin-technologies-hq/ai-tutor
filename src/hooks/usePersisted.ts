"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** localStorage-backed state for demo persistence. SSR-safe: hydrates after mount. */
export function usePersisted<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("carawin:" + key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; }
    try { localStorage.setItem("carawin:" + key, JSON.stringify(value)); } catch {}
  }, [key, value, ready]);

  const set = useCallback((v: T | ((p: T) => T)) => setValue(v as any), []);
  return [value, set, ready];
}
