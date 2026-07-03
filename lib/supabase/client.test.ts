import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the SSR browser-client factory so no real client is constructed.
const createBrowserClient = vi.fn(() => ({ __kind: "browser" }));
vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// client.ts's sole export is createClient(), which reads the NEXT_PUBLIC_* env
// vars at *call* time (inside the function body), so vi.stubEnv lets us drive
// both the unconfigured (null) and configured branches deterministically.
describe("createClient (browser)", () => {
  it("returns null and does not construct a client when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const { createClient } = await import("./client");
    expect(createClient()).toBeNull();
    expect(createBrowserClient).not.toHaveBeenCalled();
  });

  it("returns null when only one of the two env vars is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const { createClient } = await import("./client");
    expect(createClient()).toBeNull();
    expect(createBrowserClient).not.toHaveBeenCalled();
  });

  it("constructs a browser client with the public URL and anon key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-123");

    const { createClient } = await import("./client");
    const client = createClient();

    expect(client).toEqual({ __kind: "browser" });
    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      "anon-123"
    );
  });
});
