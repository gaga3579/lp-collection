import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCountUp } from "./useCountUp";

// useCountUp keys its easing off Date.now(). We pin the system clock so that
// both the setTimeout queue AND Date.now() are driven by the same fake clock;
// advanceTimersByTime moves both forward together, making the eased value
// deterministic regardless of host speed.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-22T00:00:00.000Z"));
  // Default: motion is allowed (not reduced).
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches: false } as unknown as MediaQueryList);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("useCountUp", () => {
  it("stays at 0 immediately when the target is 0", () => {
    const { result } = renderHook(() => useCountUp(0));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(0);
  });

  it("animates upward but not past the target mid-flight", () => {
    const { result } = renderHook(() => useCountUp(100, 1000));
    act(() => {
      vi.advanceTimersByTime(500); // halfway through the duration
    });
    // ease-out cubic at progress ~0.5 => 1 - 0.5^3 = 0.875 => ~87.5.
    // The last committed tick lands just under the 500ms mark (16ms steps),
    // so assert the value sits in the expected ease-out band rather than an
    // exact figure.
    expect(result.current).toBeGreaterThan(80);
    expect(result.current).toBeLessThan(90);
  });

  it("reaches exactly the target once the duration elapses", () => {
    const { result } = renderHook(() => useCountUp(250, 1000));
    act(() => {
      vi.advanceTimersByTime(1200); // past the full duration
    });
    expect(result.current).toBe(250);
  });

  it("jumps straight to the target when reduced motion is preferred", () => {
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true } as unknown as MediaQueryList);

    const { result } = renderHook(() => useCountUp(500, 1000));
    // No timer advance: reduced-motion path sets the value synchronously.
    expect(result.current).toBe(500);
  });

  it("clears its pending timer on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = renderHook(() => useCountUp(100, 1000));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
