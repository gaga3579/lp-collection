"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for use in Client Components (auth, admin mutations).
 * Returns `null` when the project isn't configured yet so the UI can degrade
 * gracefully instead of throwing.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createBrowserClient(url, key);
}

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
