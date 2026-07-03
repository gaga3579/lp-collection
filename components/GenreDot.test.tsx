import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import GenreDot from "./GenreDot";
import { GENRE_COLORS, GENRE_LABELS } from "@/lib/types";

// GenreDot renders a span with no text content, so we query the DOM directly.
function renderDot(ui: React.ReactElement) {
  const { container } = render(ui);
  return container.firstChild as HTMLElement;
}

describe("GenreDot", () => {
  it("paints the dot with the color for the given genre", () => {
    const el = renderDot(<GenreDot genre="jazz" />);
    // jsdom normalises hex to rgb in inline styles.
    expect(el.style.backgroundColor).toBe("rgb(47, 143, 131)"); // #2f8f83
  });

  it("uses a 9px square by default", () => {
    const el = renderDot(<GenreDot genre="rock" />);
    expect(el.style.width).toBe("9px");
    expect(el.style.height).toBe("9px");
  });

  it("honours a custom size", () => {
    const el = renderDot(<GenreDot genre="rock" size={11} />);
    expect(el.style.width).toBe("11px");
    expect(el.style.height).toBe("11px");
  });

  it("sets the human-readable genre label as the title tooltip", () => {
    const el = renderDot(<GenreDot genre="rnb" />);
    expect(el.getAttribute("title")).toBe(GENRE_LABELS.rnb);
    expect(el.getAttribute("title")).toBe("R&B");
  });

  it("renders a known color for every genre", () => {
    for (const genre of Object.keys(GENRE_COLORS) as (keyof typeof GENRE_COLORS)[]) {
      const el = renderDot(<GenreDot genre={genre} />);
      expect(el.style.backgroundColor).not.toBe("");
    }
  });
});
