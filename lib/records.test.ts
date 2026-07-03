import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the public client factory so records.ts never touches the network/DB.
vi.mock("@/lib/supabase/public", () => ({
  createPublicClient: vi.fn(),
}));

import { getRecords, getRecord } from "./records";
import { createPublicClient } from "@/lib/supabase/public";
import type { Record } from "./types";

const mockedCreate = vi.mocked(createPublicClient);

function sampleRecord(overrides: Partial<Record> = {}): Record {
  return {
    id: "rec-1",
    artist: "Miles Davis",
    title: "Kind of Blue",
    year: 1959,
    genre: "jazz",
    rating: 5,
    notes: null,
    cover_url: null,
    purchase_price: 30000,
    purchase_date: "2026-01-01",
    condition: "mint",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * Builds a chainable Supabase query mock. `getRecords` calls
 * .from().select().order() and awaits the final result; `getRecord` calls
 * .from().select().eq().single().
 */
function makeClient(opts: {
  orderResult?: { data: unknown; error: unknown };
  singleResult?: { data: unknown; error: unknown };
}) {
  const order = vi.fn().mockResolvedValue(opts.orderResult);
  const single = vi.fn().mockResolvedValue(opts.singleResult);
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ order, eq }));
  const from = vi.fn(() => ({ select }));
  return { client: { from }, from, select, order, eq, single };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getRecords", () => {
  it("returns an empty array when Supabase is not configured", async () => {
    mockedCreate.mockReturnValue(null);
    await expect(getRecords()).resolves.toEqual([]);
  });

  it("returns the rows newest-first via order(created_at desc)", async () => {
    const rows = [sampleRecord({ id: "a" }), sampleRecord({ id: "b" })];
    const m = makeClient({ orderResult: { data: rows, error: null } });
    mockedCreate.mockReturnValue(m.client as never);

    const result = await getRecords();

    expect(result).toEqual(rows);
    expect(m.from).toHaveBeenCalledWith("records");
    expect(m.select).toHaveBeenCalledWith("*");
    expect(m.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("returns an empty array (not null) when the query yields null data", async () => {
    const m = makeClient({ orderResult: { data: null, error: null } });
    mockedCreate.mockReturnValue(m.client as never);
    await expect(getRecords()).resolves.toEqual([]);
  });

  it("coerces PostgREST numeric-string purchase_price into a real number", async () => {
    // PostgREST serializes `numeric` columns as JSON strings to preserve
    // precision, so purchase_price arrives as e.g. "12500" at runtime even
    // though the type says number | null. normalize() must coerce it.
    const rows = [
      sampleRecord({ id: "a", purchase_price: "12500" as never }),
      sampleRecord({ id: "b", purchase_price: null }),
    ];
    const m = makeClient({ orderResult: { data: rows, error: null } });
    mockedCreate.mockReturnValue(m.client as never);

    const result = await getRecords();

    expect(result[0].purchase_price).toBe(12500);
    expect(typeof result[0].purchase_price).toBe("number");
    // null stays null (not coerced to 0 via Number(null)).
    expect(result[1].purchase_price).toBeNull();
  });

  it("swallows query errors and returns an empty array", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const m = makeClient({
      orderResult: { data: null, error: { message: "boom" } },
    });
    mockedCreate.mockReturnValue(m.client as never);

    await expect(getRecords()).resolves.toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("getRecord", () => {
  it("returns null when Supabase is not configured", async () => {
    mockedCreate.mockReturnValue(null);
    await expect(getRecord("rec-1")).resolves.toBeNull();
  });

  it("fetches a single record by id", async () => {
    const row = sampleRecord({ id: "rec-42" });
    const m = makeClient({ singleResult: { data: row, error: null } });
    mockedCreate.mockReturnValue(m.client as never);

    const result = await getRecord("rec-42");

    expect(result).toEqual(row);
    expect(m.from).toHaveBeenCalledWith("records");
    expect(m.eq).toHaveBeenCalledWith("id", "rec-42");
    expect(m.single).toHaveBeenCalled();
  });

  it("returns null when the record is missing / errors", async () => {
    const m = makeClient({
      singleResult: { data: null, error: { message: "not found" } },
    });
    mockedCreate.mockReturnValue(m.client as never);
    await expect(getRecord("nope")).resolves.toBeNull();
  });

  it("normalizes the single row's numeric-string purchase_price", async () => {
    const row = sampleRecord({ id: "rec-7", purchase_price: "8900" as never });
    const m = makeClient({ singleResult: { data: row, error: null } });
    mockedCreate.mockReturnValue(m.client as never);

    const result = await getRecord("rec-7");

    expect(result?.purchase_price).toBe(8900);
    expect(typeof result?.purchase_price).toBe("number");
  });
});
