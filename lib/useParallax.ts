"use client";

import { useEffect, useRef } from "react";

/**
 * Subtle scroll parallax: translates the element down by `rate` × scrollY so
 * it climbs at (1 − rate)× the page's scroll speed — the handoff's "lead cover
 * moves at a slower rate than scroll".
 *
 * Writes the transform directly on the DOM node from a passive scroll listener
 * (no rAF — it is paused in hidden tabs and some preview environments, see
 * useCountUp). Disabled under prefers-reduced-motion.
 *
 * The handoff suggested 0.3–0.5×, but past ~0.15 the lead cover drifts deep
 * into the grid section below before it leaves the screen; 0.12 keeps the
 * drift visible without the collision.
 */
export function useParallax<T extends HTMLElement>(rate = 0.12) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const onScroll = () => {
      el.style.transform = `translate3d(0, ${window.scrollY * rate}px, 0)`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      el.style.transform = "";
    };
  }, [rate]);

  return ref;
}
