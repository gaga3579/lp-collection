"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animate a number up to `target` (ease-out cubic) once the component mounts on
 * the client.
 *
 * State is seeded with `target` (not 0) so the server-rendered HTML and the
 * no-JS fallback show the real figure — the page is force-dynamic precisely to
 * fetch real data, so we don't want to throw that away by emitting 0. After
 * hydration the entrance animation restarts from 0 and counts up.
 *
 * Uses setTimeout rather than requestAnimationFrame on purpose: rAF is fully
 * paused while a tab is hidden, which would leave the value frozen until the
 * tab is focused. A setTimeout loop keyed on wall-clock elapsed time keeps
 * progressing (throttled in background tabs, but it always completes) and jumps
 * straight to the target for users who prefer reduced motion.
 *
 * All setState calls happen inside setTimeout callbacks (never synchronously in
 * the effect body) so we don't trip react-hooks/set-state-in-effect.
 */
export function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(target);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Nothing to animate — settle on the final value asynchronously.
    if (target === 0 || duration <= 0 || prefersReduced) {
      timerRef.current = setTimeout(() => setValue(target), 0);
      return () => {
        if (timerRef.current != null) clearTimeout(timerRef.current);
      };
    }

    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(target * eased);
      if (progress < 1) timerRef.current = setTimeout(tick, 16);
      else setValue(target);
    };
    // First tick runs on the next macrotask with progress≈0, so the value
    // starts the count-up from ~0 without a synchronous setState in the body.
    timerRef.current = setTimeout(tick, 0);

    return () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    };
  }, [target, duration]);

  return value;
}
