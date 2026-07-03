import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

/**
 * The route handler caches its Spotify client-credentials token in module
 * scope. To keep each test independent we reset the module registry and
 * dynamically re-import `route.ts`, so every test runs against a fresh module
 * with an empty token cache.
 */
async function importGet() {
  vi.resetModules();
  const mod = await import("./route");
  return mod.GET;
}

/**
 * Build a minimal object satisfying the parts of `NextRequest` the handler
 * touches: `request.nextUrl.searchParams.get("q")`. The handler only reads the
 * query string, so we never need the real Next.js request pipeline.
 */
function makeRequest(q?: string | null): NextRequest {
  const url = new URL("https://example.test/api/spotify-search");
  if (q != null) url.searchParams.set("q", q);
  return { nextUrl: url } as unknown as NextRequest;
}

/** Spotify token endpoint response helper. */
function tokenResponse(accessToken = "tok-123", expiresIn = 3600) {
  return {
    ok: true,
    json: async () => ({ access_token: accessToken, expires_in: expiresIn }),
  } as unknown as Response;
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.restoreAllMocks();
  process.env = { ...ORIGINAL_ENV };
  process.env.SPOTIFY_CLIENT_ID = "id-abc";
  process.env.SPOTIFY_CLIENT_SECRET = "secret-xyz";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("GET /api/spotify-search", () => {
  it("returns an empty result set without calling fetch when q is missing", async () => {
    const GET = await importGet();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest(undefined));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns an empty result set when q is only whitespace (trimmed)", async () => {
    const GET = await importGet();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("   "));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 501 when Spotify credentials are not configured", async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
    const GET = await importGet();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("miles davis"));

    expect(res.status).toBe(501);
    await expect(res.json()).resolves.toEqual({
      error: "Spotify is not configured on the server.",
    });
    // Without creds the handler never reaches a network call.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps Spotify albums into the trimmed result shape on success", async () => {
    const GET = await importGet();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const href = input.toString();
      if (href.includes("accounts.spotify.com")) return tokenResponse();
      // Search endpoint
      return {
        ok: true,
        json: async () => ({
          albums: {
            items: [
              {
                name: "Kind of Blue",
                release_date: "1959-08-17",
                images: [{ url: "https://img/kob.jpg" }],
                artists: [{ name: "Miles Davis" }],
              },
              {
                name: "Collab",
                release_date: "", // missing date -> year null
                images: [], // no image -> cover_url null
                artists: [{ name: "A" }, { name: "B" }],
              },
            ],
          },
        }),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("miles davis"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      results: [
        {
          artist: "Miles Davis",
          title: "Kind of Blue",
          year: 1959,
          cover_url: "https://img/kob.jpg",
        },
        {
          artist: "A, B",
          title: "Collab",
          year: null,
          cover_url: null,
        },
      ],
    });

    // Token fetch first, then the search request.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const searchUrl = fetchMock.mock.calls[1][0].toString();
    expect(searchUrl).toContain("api.spotify.com/v1/search");
    expect(searchUrl).toContain("type=album");
    expect(searchUrl).toContain("limit=8");
    expect(searchUrl).toContain("q=miles+davis");
  });

  it("returns an empty results array when Spotify omits the albums field", async () => {
    const GET = await importGet();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (input.toString().includes("accounts.spotify.com")) {
        return tokenResponse();
      }
      return {
        ok: true,
        json: async () => ({}),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("obscure"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ results: [] });
  });

  it("propagates the upstream status when the Spotify search fails", async () => {
    const GET = await importGet();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (input.toString().includes("accounts.spotify.com")) {
        return tokenResponse();
      }
      return { ok: false, status: 429 } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("rate limited"));

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({
      error: "Spotify search failed.",
    });
  });

  it("returns 501 when the token request itself fails (token null)", async () => {
    const GET = await importGet();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (input.toString().includes("accounts.spotify.com")) {
        return { ok: false, status: 400 } as unknown as Response;
      }
      throw new Error("search should not be reached");
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest("anything"));

    expect(res.status).toBe(501);
    await expect(res.json()).resolves.toEqual({
      error: "Spotify is not configured on the server.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the cached token across calls within the same module instance", async () => {
    const GET = await importGet();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (input.toString().includes("accounts.spotify.com")) {
        return tokenResponse("cached-tok", 3600);
      }
      return {
        ok: true,
        json: async () => ({ albums: { items: [] } }),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    await GET(makeRequest("first"));
    await GET(makeRequest("second"));

    // Token fetched once, two search calls -> 3 total (cache hit on 2nd call).
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const tokenCalls = fetchMock.mock.calls.filter((c) =>
      c[0].toString().includes("accounts.spotify.com")
    );
    expect(tokenCalls).toHaveLength(1);
  });
});
