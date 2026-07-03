import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWishlist } from "./useWishlist";

const KEY = "vinyl-archive:wishlist";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("useWishlist", () => {
  it("starts empty when localStorage has no entry", () => {
    const { result } = renderHook(() => useWishlist());
    expect(result.current.ids).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.has("anything")).toBe(false);
  });

  it("reads a pre-existing wishlist from localStorage on mount", () => {
    window.localStorage.setItem(KEY, JSON.stringify(["a", "b"]));
    const { result } = renderHook(() => useWishlist());
    expect(result.current.ids).toEqual(["a", "b"]);
    expect(result.current.count).toBe(2);
    expect(result.current.has("a")).toBe(true);
    expect(result.current.has("c")).toBe(false);
  });

  it("adds an id via toggle and persists it to localStorage", () => {
    const { result } = renderHook(() => useWishlist());
    act(() => {
      result.current.toggle("rec-1");
    });
    expect(result.current.ids).toContain("rec-1");
    expect(result.current.has("rec-1")).toBe(true);
    expect(result.current.count).toBe(1);
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual(["rec-1"]);
  });

  it("removes an id when toggled a second time", () => {
    const { result } = renderHook(() => useWishlist());
    act(() => {
      result.current.toggle("rec-1");
    });
    act(() => {
      result.current.toggle("rec-1");
    });
    expect(result.current.has("rec-1")).toBe(false);
    expect(result.current.count).toBe(0);
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual([]);
  });

  it("keeps multiple ids and toggles them independently", () => {
    const { result } = renderHook(() => useWishlist());
    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("b"));
    act(() => result.current.toggle("a")); // remove just "a"
    expect(result.current.ids).toEqual(["b"]);
  });

  it("keeps two hook instances in sync within the same tab", () => {
    const first = renderHook(() => useWishlist());
    const second = renderHook(() => useWishlist());

    act(() => {
      first.result.current.toggle("shared");
    });

    expect(first.result.current.has("shared")).toBe(true);
    expect(second.result.current.has("shared")).toBe(true);
  });

  it("falls back to an empty list when stored JSON is corrupt", () => {
    window.localStorage.setItem(KEY, "{not valid json");
    const { result } = renderHook(() => useWishlist());
    expect(result.current.ids).toEqual([]);
  });
});
