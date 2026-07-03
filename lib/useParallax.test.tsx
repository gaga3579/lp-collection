import { describe, it, expect, afterEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { useParallax } from "./useParallax";

function Probe({ rate }: { rate?: number }) {
  const ref = useParallax<HTMLDivElement>(rate);
  return <div ref={ref} data-testid="probe" />;
}

function setScrollY(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
}

afterEach(() => {
  setScrollY(0);
});

describe("useParallax", () => {
  it("translates the element by rate × scrollY on scroll", () => {
    const { getByTestId } = render(<Probe rate={0.3} />);
    setScrollY(100);
    fireEvent.scroll(window);
    expect(getByTestId("probe").style.transform).toBe(
      "translate3d(0, 30px, 0)"
    );
  });

  it("applies the initial offset on mount", () => {
    setScrollY(200);
    const { getByTestId } = render(<Probe rate={0.5} />);
    expect(getByTestId("probe").style.transform).toBe(
      "translate3d(0, 100px, 0)"
    );
  });

  it("clears the transform and stops listening on unmount", () => {
    const { getByTestId, unmount } = render(<Probe rate={0.3} />);
    const el = getByTestId("probe");
    unmount();
    expect(el.style.transform).toBe("");
    setScrollY(500);
    fireEvent.scroll(window);
    expect(el.style.transform).toBe("");
  });

  it("does nothing under prefers-reduced-motion", () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    try {
      const { getByTestId } = render(<Probe rate={0.3} />);
      setScrollY(100);
      fireEvent.scroll(window);
      expect(getByTestId("probe").style.transform).toBe("");
    } finally {
      window.matchMedia = original;
    }
  });
});
