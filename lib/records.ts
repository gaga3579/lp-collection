import { createClient } from "@/lib/supabase/server";
import type { Record } from "@/lib/types";

/**
 * Fetch every record, newest first. Returns an empty array when Supabase isn't
 * configured or the query fails, so public pages always render.
 */
export async function getRecords(): Promise<Record[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load records:", error.message);
    return [];
  }

  return (data ?? []) as Record[];
}

/** Fetch a single record by id, or `null` if missing / unconfigured. */
export async function getRecord(id: string): Promise<Record | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Record;
}
