import { useEffect, useMemo, useState } from "react";

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function prefersReducedMotion(): boolean {
  if (import.meta.env.MODE === "test") return true;
  if (typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useCountUp(target: number, duration = 900): number {
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  if (reduced) return target;

  return value;
}
