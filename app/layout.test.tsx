import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

// next/font/google can't run under jsdom (it requires the Next build-time font
// loader), so stub the two loaders this layout uses. Each returns a className /
// CSS-variable handle, mirroring the real loader's return shape.
vi.mock("next/font/google", () => ({
  Instrument_Sans: () => ({
    variable: "--font-instrument-sans",
    className: "font-instrument-sans",
  }),
  Instrument_Serif: () => ({
    variable: "--font-instrument-serif",
    className: "font-instrument-serif",
  }),
}));

// globals.css is a Tailwind entrypoint; ignore it in the test environment.
vi.mock("./globals.css", () => ({}));

import RootLayout, { metadata } from "./layout";

describe("app/layout", () => {
  it("exports page metadata (title + description)", () => {
    expect(metadata.title).toBe("Vinyl Archive");
    expect(metadata.description).toBe(
      "A personal collection of LP vinyl records."
    );
  });

  // RootLayout returns the document shell (<html><body>...). jsdom/RTL strip
  // <html>/<body> when mounting into a <div>, so we inspect the returned React
  // element tree directly instead of rendering it.
  it("returns an <html> shell with a <body> wrapping the children", () => {
    const tree = RootLayout({ children: <p>hello archive</p> }) as ReactElement<{
      children: ReactElement<{ children: unknown }>;
    }>;
    expect(tree.type).toBe("html");
    const body = tree.props.children;
    expect(body.type).toBe("body");
  });

  it("wires the font CSS variables and html/body sizing classes", () => {
    const tree = RootLayout({ children: <span>child</span> }) as ReactElement<{
      className: string;
      children: ReactElement<{ className: string }>;
    }>;
    expect(tree.props.className).toContain("--font-instrument-sans");
    expect(tree.props.className).toContain("--font-instrument-serif");
    expect(tree.props.className).toContain("h-full");
    expect(tree.props.children.props.className).toContain("min-h-full");
  });

  it("forwards the exact children node to the body", () => {
    const child = <span>specific child node</span>;
    const tree = RootLayout({ children: child }) as ReactElement<{
      children: ReactElement<{ children: unknown }>;
    }>;
    expect(tree.props.children.props.children).toBe(child);
  });
});
