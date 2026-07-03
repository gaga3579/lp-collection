import { describe, it, expect } from "vitest";
import {
  GENRES,
  GENRE_LABELS,
  GENRE_COLORS,
  CONDITIONS,
  SORT_OPTIONS,
} from "./types";

describe("GENRES / GENRE_LABELS / GENRE_COLORS alignment", () => {
  it("lists nine unique genres in a stable order", () => {
    expect(GENRES).toEqual([
      "jazz",
      "rock",
      "soul",
      "rnb",
      "rap",
      "pop",
      "electronic",
      "classical",
      "other",
    ]);
    expect(new Set(GENRES).size).toBe(GENRES.length);
  });

  it("has a label for every genre and no extras", () => {
    expect(Object.keys(GENRE_LABELS).sort()).toEqual([...GENRES].sort());
    for (const g of GENRES) {
      expect(GENRE_LABELS[g]).toBeTruthy();
    }
  });

  it("has a color for every genre and no extras", () => {
    expect(Object.keys(GENRE_COLORS).sort()).toEqual([...GENRES].sort());
  });

  it("maps every genre to a valid 6-digit hex color", () => {
    for (const g of GENRES) {
      expect(GENRE_COLORS[g]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("assigns a distinct color to each genre", () => {
    const colors = GENRES.map((g) => GENRE_COLORS[g]);
    expect(new Set(colors).size).toBe(GENRES.length);
  });

  it("renders R&B with an ampersand rather than naive capitalization", () => {
    expect(GENRE_LABELS.rnb).toBe("R&B");
  });
});

describe("CONDITIONS", () => {
  it("lists the four grades best-to-worst", () => {
    expect(CONDITIONS.map((c) => c.value)).toEqual(["mint", "vg+", "vg", "g"]);
  });

  it("gives every condition a non-empty human label", () => {
    for (const c of CONDITIONS) {
      expect(c.label).toBeTruthy();
      expect(typeof c.label).toBe("string");
    }
  });

  it("uses unique values", () => {
    const values = CONDITIONS.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("SORT_OPTIONS", () => {
  it("exposes the four documented sort keys", () => {
    expect(SORT_OPTIONS.map((o) => o.value)).toEqual([
      "recent",
      "year",
      "rating",
      "artist",
    ]);
  });

  it("gives every sort option a non-empty label", () => {
    for (const o of SORT_OPTIONS) {
      expect(o.label).toBeTruthy();
    }
  });
});
