import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StarRating from "./StarRating";

function filledCount(container: HTMLElement): number {
  // A star is "filled" when its svg has fill set to the ink color.
  return container.querySelectorAll('svg[fill="#141412"]').length;
}

describe("StarRating", () => {
  it("always renders five stars", () => {
    const { container } = render(<StarRating value={3} />);
    expect(container.querySelectorAll("svg")).toHaveLength(5);
  });

  it("fills exactly `value` stars", () => {
    const { container } = render(<StarRating value={3} />);
    expect(filledCount(container)).toBe(3);
  });

  it("fills no stars and labels itself 'Not rated' when value is null", () => {
    const { container } = render(<StarRating value={null} />);
    expect(filledCount(container)).toBe(0);
    expect(screen.getByLabelText("Not rated")).toBeInTheDocument();
  });

  it("fills no stars when value is 0", () => {
    const { container } = render(<StarRating value={0} />);
    expect(filledCount(container)).toBe(0);
  });

  it("fills all five stars at value 5", () => {
    const { container } = render(<StarRating value={5} />);
    expect(filledCount(container)).toBe(5);
  });

  it("exposes an accessible 'N out of 5 stars' label", () => {
    render(<StarRating value={4} />);
    expect(screen.getByLabelText("4 out of 5 stars")).toBeInTheDocument();
  });

  it("applies the requested size to each star svg", () => {
    const { container } = render(<StarRating value={2} size={20} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("height")).toBe("20");
  });

  it("merges a custom className onto the wrapper", () => {
    render(<StarRating value={2} className="custom-cls" />);
    expect(screen.getByLabelText("2 out of 5 stars")).toHaveClass("custom-cls");
  });
});
