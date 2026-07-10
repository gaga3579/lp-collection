import { describe, it, expect, vi, beforeAll } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarRatingInput from "./StarRatingInput";

beforeAll(() => {
  // jsdom has no PointerEvent; MouseEvent carries the clientX we need.
  if (!window.PointerEvent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).PointerEvent = window.MouseEvent;
  }
});

/** Controlled harness so keyboard steps accumulate like in the real form. */
function Harness({
  initial = null,
  onChange,
}: {
  initial?: number | null;
  onChange?: (v: number | null) => void;
}) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <StarRatingInput
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

function getSlider(): HTMLElement {
  return screen.getByRole("slider", { name: "Rating" });
}

describe("StarRatingInput", () => {
  it("renders an unrated slider at 0", () => {
    render(<Harness />);
    const slider = getSlider();
    expect(slider).toHaveAttribute("aria-valuenow", "0");
    expect(slider).toHaveAttribute("aria-valuetext", "Not rated");
  });

  it("steps up by 0.5 with ArrowRight", () => {
    render(<Harness />);
    const slider = getSlider();
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider).toHaveAttribute("aria-valuenow", "0.5");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider).toHaveAttribute("aria-valuenow", "1");
  });

  it("steps down by 0.5 with ArrowLeft and clears below 0.5", () => {
    render(<Harness initial={1} />);
    const slider = getSlider();
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(slider).toHaveAttribute("aria-valuenow", "0.5");
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(slider).toHaveAttribute("aria-valuenow", "0");
    expect(slider).toHaveAttribute("aria-valuetext", "Not rated");
  });

  it("caps at 5 and supports Home/End", () => {
    render(<Harness initial={5} />);
    const slider = getSlider();
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider).toHaveAttribute("aria-valuenow", "5");
    fireEvent.keyDown(slider, { key: "Home" });
    expect(slider).toHaveAttribute("aria-valuenow", "0.5");
    fireEvent.keyDown(slider, { key: "End" });
    expect(slider).toHaveAttribute("aria-valuenow", "5");
  });

  it("clears with Delete", () => {
    const onChange = vi.fn();
    render(<Harness initial={3.5} onChange={onChange} />);
    fireEvent.keyDown(getSlider(), { key: "Delete" });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("commits a half-star value from a pointer drag", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const slider = getSlider();
    // 5 stars of 26px + 4 gaps of 2px = 138px track.
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 138,
      top: 0,
      right: 138,
      bottom: 26,
      height: 26,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerDown(slider, { clientX: 10, pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 65, pointerId: 1 });
    // 65/138 → 47.1% of 10 half-steps → ceil(4.71) = 5 halves = 2.5
    fireEvent.pointerUp(slider, { clientX: 65, pointerId: 1 });

    expect(onChange).toHaveBeenLastCalledWith(2.5);
    expect(slider).toHaveAttribute("aria-valuenow", "2.5");
  });

  it("clamps a drag past the left edge to 0.5", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const slider = getSlider();
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 138,
      top: 0,
      right: 138,
      bottom: 26,
      height: 26,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1 });
    fireEvent.pointerUp(slider, { clientX: -40, pointerId: 1 });

    expect(onChange).toHaveBeenLastCalledWith(0.5);
  });

  it("shows a clear button only when rated, and it clears", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(
      screen.queryByRole("button", { name: "Clear rating" })
    ).not.toBeInTheDocument();

    fireEvent.keyDown(getSlider(), { key: "End" });
    const clear = screen.getByRole("button", { name: "Clear rating" });
    await user.click(clear);
    expect(getSlider()).toHaveAttribute("aria-valuenow", "0");
  });
});
