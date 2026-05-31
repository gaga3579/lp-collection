import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Plain Supabase client for PUBLIC, read-only data (collection, detail, stats).
 *
 * Unlike the cookie-based SSR client, this needs no request cookies — public
 * reads are governed purely by RLS. Avoiding `cookies()` means the route's
 * static/dynamic nature no longer depends on env-var presence at build time,
 * which previously caused pages to be prerendered empty on the host.
 *
 * Returns `null` when the project isn't configured.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
