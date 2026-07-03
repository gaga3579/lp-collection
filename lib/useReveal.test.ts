import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReveal } from "./useReveal";

// jsdom has no IntersectionObserver, which exercises the immediate-reveal
// fallback path (the same one used by hidden tabs / preview environments).
describe("useReveal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts unrevealed", () => {
    const { result } = renderHook(() => useReveal<HTMLDivElement>());
    expect(result.current.revealed).toBe(false);
  });

  it("reveals via the setTimeout fallback when IntersectionObserver is missing", () => {
    const { result } = renderHook(() => useReveal<HTMLDivElement>());
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.revealed).toBe(true);
  });

  it("stays revealed once flipped", () => {
    const { result, rerender } = renderHook(() => useReveal<HTMLDivElement>());
    act(() => {
      vi.advanceTimersByTime(1);
    });
    rerender();
    expect(result.current.revealed).toBe(true);
  });

  it("returns a ref object to attach to the element", () => {
    const { result } = renderHook(() => useReveal<HTMLDivElement>());
    expect(result.current.ref).toHaveProperty("current", null);
  });
});
