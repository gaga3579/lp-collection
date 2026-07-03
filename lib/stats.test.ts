import { describe, it, expect } from "vitest";
import { collectionStats } from "./stats";
import type { Record } from "./types";

function rec(overrides: Partial<Record> = {}): Record {
  return {
    id: "r",
    artist: "A",
    title: "T",
    year: 2000,
    genre: "jazz",
    rating: null,
    notes: null,
    cover_url: null,
    purchase_price: null,
    purchase_date: null,
    condition: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("collectionStats", () => {
  it("returns zeros for an empty collection", () => {
    expect(collectionStats([])).toEqual({ total: 0, avg: 0, totalValue: 0 });
  });

  it("counts every record in total regardless of rating/price", () => {
    const stats = collectionStats([rec(), rec(), rec()]);
    expect(stats.total).toBe(3);
  });

  it("averages only rated records and ignores null ratings", () => {
    const stats = collectionStats([
      rec({ rating: 4 }),
      rec({ rating: 5 }),
      rec({ rating: null }), // excluded from the average
    ]);
    expect(stats.avg).toBe(4.5);
  });

  it("yields avg 0 when no record is rated", () => {
    const stats = collectionStats([rec({ rating: null }), rec({ rating: null })]);
    expect(stats.avg).toBe(0);
  });

  it("sums purchase prices, treating null as 0", () => {
    const stats = collectionStats([
      rec({ purchase_price: 10000 }),
      rec({ purchase_price: 25000 }),
      rec({ purchase_price: null }),
    ]);
    expect(stats.totalValue).toBe(35000);
  });

  it("computes all three figures together", () => {
    const stats = collectionStats([
      rec({ rating: 3, purchase_price: 1000 }),
      rec({ rating: 5, purchase_price: 3000 }),
    ]);
    expect(stats).toEqual({ total: 2, avg: 4, totalValue: 4000 });
  });
});
