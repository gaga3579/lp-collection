import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import HeroStats from "./HeroStats";

// useCountUp animates with setTimeout over `duration` ms (rAF is intentionally
// avoided). We drive the animation deterministically with fake timers and
// advance past the longest duration (1600ms) so every counter lands on target.
function flushCountUp() {
  act(() => {
    vi.advanceTimersByTime(2000);
  });
}

describe("HeroStats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts up to the final total and average once the animation completes", () => {
    render(<HeroStats total={42} avg={4.2} totalValue={0} />);
    flushCountUp();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("4.2")).toBeInTheDocument();
  });

  it("renders the static 'records' and 'average rating' labels", () => {
    render(<HeroStats total={10} avg={3} totalValue={0} />);
    flushCountUp();
    expect(screen.getByText("records")).toBeInTheDocument();
    expect(screen.getByText("average rating")).toBeInTheDocument();
  });

  it("formats and shows the estimated value as KRW when greater than 0", () => {
    render(<HeroStats total={5} avg={3} totalValue={1250000} />);
    flushCountUp();
    expect(screen.getByText("₩ 1,250,000")).toBeInTheDocument();
    expect(screen.getByText("est.")).toBeInTheDocument();
  });

  it("hides the estimated value block when totalValue is 0", () => {
    render(<HeroStats total={5} avg={3} totalValue={0} />);
    flushCountUp();
    expect(screen.queryByText("est.")).not.toBeInTheDocument();
  });

  it("shows the average to one decimal place", () => {
    render(<HeroStats total={3} avg={3.75} totalValue={0} />);
    flushCountUp();
    // 3.75 -> toFixed(1) -> "3.8"
    expect(screen.getByText("3.8")).toBeInTheDocument();
  });

  it("renders 0 immediately when total is 0 (no animation)", () => {
    render(<HeroStats total={0} avg={0} totalValue={0} />);
    // target === 0 short-circuits to 0 without scheduling timers.
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("0.0")).toBeInTheDocument();
  });
});
