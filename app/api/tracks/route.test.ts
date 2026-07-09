import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "./route";

function makeRequest(artist?: string | null, title?: string | null): NextRequest {
  const url = new URL("https://example.test/api/tracks");
  if (artist != null) url.searchParams.set("artist", artist);
  if (title != null) url.searchParams.set("title", title);
  return { nextUrl: url } as unknown as NextRequest;
}

function albumSearchResponse(items: unknown[]) {
  return {
    ok: true,
    json: async () => ({ results: items }),
  } as unknown as Response;
}

const KIND_OF_BLUE_ALBUM = {
  wrapperType: "collection",
  collectionId: 111,
  artistName: "Miles Davis",
  collectionName: "Kind of Blue",
};

const KIND_OF_BLUE_TRACKS = {
  ok: true,
  json: async () => ({
    results: [
      { wrapperType: "collection", collectionId: 111 },
      {
        wrapperType: "track",
        kind: "song",
        trackId: 1,
        trackName: "So What",
        trackNumber: 1,
        discNumber: 1,
        trackTimeMillis: 561000,
        previewUrl: "https://preview/so-what.m4a",
      },
      {
        wrapperType: "track",
        kind: "song",
        trackId: 2,
        trackName: "Freddie Freeloader",
        trackNumber: 2,
        discNumber: 1,
        trackTimeMillis: 590000,
        previewUrl: "https://preview/freddie.m4a",
      },
      // Not a song (e.g. a music video entity) — must be filtered out.
      { wrapperType: "track", kind: "music-video", trackId: 3, trackName: "X" },
    ],
  }),
} as unknown as Response;

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/tracks", () => {
  it("returns no tracks without calling fetch when artist is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest(undefined, "Kind of Blue"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ tracks: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns no tracks without calling fetch when title is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("Miles Davis", undefined));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ tracks: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("looks up the album then returns its tracklist, sorted and filtered to songs", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const href = input.toString();
      if (href.includes("/search")) return albumSearchResponse([KIND_OF_BLUE_ALBUM]);
      if (href.includes("/lookup")) return KIND_OF_BLUE_TRACKS;
      throw new Error(`unexpected fetch: ${href}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("Miles Davis", "Kind of Blue"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      tracks: [
        {
          id: 1,
          number: 1,
          title: "So What",
          durationMs: 561000,
          previewUrl: "https://preview/so-what.m4a",
        },
        {
          id: 2,
          number: 2,
          title: "Freddie Freeloader",
          durationMs: 590000,
          previewUrl: "https://preview/freddie.m4a",
        },
      ],
    });

    const lookupUrl = fetchMock.mock.calls[1][0].toString();
    expect(lookupUrl).toContain("id=111");
    expect(lookupUrl).toContain("entity=song");
  });

  it("prefers an exact artist + title match over the first search result", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const href = input.toString();
      if (href.includes("/search")) {
        return albumSearchResponse([
          { wrapperType: "collection", collectionId: 999, artistName: "Cover Band", collectionName: "Kind of Blue (Live)" },
          KIND_OF_BLUE_ALBUM,
        ]);
      }
      if (href.includes("/lookup")) return KIND_OF_BLUE_TRACKS;
      throw new Error(`unexpected fetch: ${href}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await GET(makeRequest("Miles Davis", "Kind of Blue"));

    const lookupUrl = fetchMock.mock.calls[1][0].toString();
    expect(lookupUrl).toContain("id=111");
  });

  it("returns no tracks when the album search comes back empty", async () => {
    const fetchMock = vi.fn(async () => albumSearchResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("Obscure Artist", "Unreleased Demo"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ tracks: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 502 when the album search request fails", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("Miles Davis", "Kind of Blue"));

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      error: "Couldn't reach the track catalog.",
    });
  });

  it("returns 502 when the track lookup request fails", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const href = input.toString();
      if (href.includes("/search")) return albumSearchResponse([KIND_OF_BLUE_ALBUM]);
      return { ok: false, status: 500 } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("Miles Davis", "Kind of Blue"));

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      error: "Couldn't reach the track catalog.",
    });
  });
});
