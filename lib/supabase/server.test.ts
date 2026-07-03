import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the SSR server-client factory and Next's async cookies() store.
// The mock's parameters mirror the real createServerClient signature so
// that mock.calls is a correctly typed tuple (no casts needed below).
type ServerClientOptions = {
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (
      cookiesToSet: { name: string; value: string; options: object }[]
    ) => void;
  };
};
const createServerClient = vi.fn(
  (_url: string, _key: string, _options: ServerClientOptions) => ({
    __kind: "server",
  })
);
vi.mock("@supabase/ssr", () => ({ createServerClient }));

const cookieStore = {
  getAll: vi.fn(() => [{ name: "sb-token", value: "abc" }]),
  set: vi.fn(),
};
const cookies = vi.fn(async () => cookieStore);
vi.mock("next/headers", () => ({ cookies }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createClient (server)", () => {
  it("returns null when env vars are missing and never reads cookies", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const { createClient } = await import("./server");
    await expect(createClient()).resolves.toBeNull();
    expect(cookies).not.toHaveBeenCalled();
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("awaits cookies() and constructs a cookie-wired server client", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-123");

    const { createClient } = await import("./server");
    const client = await createClient();

    expect(client).toEqual({ __kind: "server" });
    expect(cookies).toHaveBeenCalled();

    const [url, key, options] = createServerClient.mock.calls[0];
    expect(url).toBe("https://proj.supabase.co");
    expect(key).toBe("anon-123");

    // getAll proxies to the Next cookie store.
    expect(options.cookies.getAll()).toEqual([
      { name: "sb-token", value: "abc" },
    ]);
    expect(cookieStore.getAll).toHaveBeenCalled();
  });

  it("forwards each cookie to the store in setAll", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-123");

    const { createClient } = await import("./server");
    await createClient();

    const options = createServerClient.mock.calls[0][2];
    options.cookies.setAll([
      { name: "a", value: "1", options: { path: "/" } },
      { name: "b", value: "2", options: {} },
    ]);

    expect(cookieStore.set).toHaveBeenCalledTimes(2);
    expect(cookieStore.set).toHaveBeenCalledWith("a", "1", { path: "/" });
    expect(cookieStore.set).toHaveBeenCalledWith("b", "2", {});
  });

  it("swallows errors from a read-only cookie store in setAll (Server Component context)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-123");
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error("read-only");
    });

    const { createClient } = await import("./server");
    await createClient();

    const options = createServerClient.mock.calls[0][2];
    // Should not throw even though the first set() throws.
    expect(() =>
      options.cookies.setAll([{ name: "a", value: "1", options: {} }])
    ).not.toThrow();
  });
});
