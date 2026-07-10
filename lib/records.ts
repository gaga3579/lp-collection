import { createPublicClient } from "@/lib/supabase/public";
import type { Record } from "@/lib/types";

/**
 * Postgres `numeric` columns are serialized as JSON *strings* by PostgREST to
 * preserve arbitrary precision, so `purchase_price` and `rating` arrive as e.g.
 * "12500" / "3.5" at runtime even though the type declares `number | null`.
 * Coerce them once here so every consumer gets a real number — otherwise
 * `sum + price` silently does string concatenation and totals come out as
 * garbage like "0125003400".
 */
function normalize(row: Record): Record {
  return {
    ...row,
    purchase_price:
      row.purchase_price == null ? null : Number(row.purchase_price),
    rating: row.rating == null ? null : Number(row.rating),
  };
}

/**
 * Fetch every record, newest first. Returns an empty array when Supabase isn't
 * configured or the query fails, so public pages always render.
 */
export async function getRecords(): Promise<Record[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load records:", error.message);
    return [];
  }

  return ((data ?? []) as Record[]).map(normalize);
}

/** Fetch a single record by id, or `null` if missing / unconfigured. */
export async function getRecord(id: string): Promise<Record | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return normalize(data as Record);
}
