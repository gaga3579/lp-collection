"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveal-on-scroll: returns a ref to attach to an element plus a `revealed`
 * flag that flips to true (once, permanently) when the element enters the
 * viewport. The caller styles the fade/rise transition; staggering is done
 * with a per-item transition-delay.
 *
 * IntersectionObserver drives reveals for content scrolled into view, with
 * fallbacks for environments where its callbacks never fire (hidden tabs,
 * preview harnesses — same reasoning as useCountUp's setTimeout loop):
 * - Elements already inside the viewport on mount reveal via setTimeout, so
 *   above-the-fold content never renders invisible.
 * - A passive scroll listener re-runs the same viewport check, covering
 *   programmatic/background-tab scrolling that IO misses.
 * - No IntersectionObserver support or prefers-reduced-motion reveals at once.
 *
 * All setState calls happen inside timer/observer callbacks (never
 * synchronously in the effect body) so we don't trip
 * react-hooks/set-state-in-effect.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const reveal = () => setRevealed(true);

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!el || prefersReduced || typeof IntersectionObserver === "undefined") {
      timers.push(setTimeout(reveal, 0));
      return () => timers.forEach(clearTimeout);
    }

    const inViewport = () => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          cleanup();
        }
      },
      // Trigger slightly before the element's top edge clears the fold.
      { rootMargin: "0px 0px -8% 0px" }
    );

    const onScroll = () => {
      if (inViewport()) {
        reveal();
        cleanup();
      }
    };

    const cleanup = () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };

    if (inViewport()) {
      timers.push(setTimeout(reveal, 0));
    }
    observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cleanup();
      timers.forEach(clearTimeout);
    };
  }, []);

  return { ref, revealed };
}
