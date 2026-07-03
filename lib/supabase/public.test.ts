import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the plain supabase-js factory; public.ts imports it aliased as
// `createClient as createSupabaseClient`.
const createSupabaseClient = vi.fn(() => ({ __kind: "public" }));
vi.mock("@supabase/supabase-js", () => ({ createClient: createSupabaseClient }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createPublicClient", () => {
  it("returns null when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const { createPublicClient } = await import("./public");
    expect(createPublicClient()).toBeNull();
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it("constructs a cookie-free client with sessions disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-123");

    const { createPublicClient } = await import("./public");
    const client = createPublicClient();

    expect(client).toEqual({ __kind: "public" });
    expect(createSupabaseClient).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      "anon-123",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  });
});
