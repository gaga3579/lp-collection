import type { Record } from "@/lib/types";

export interface CollectionStats {
  /** Number of records in the collection. */
  total: number;
  /** Mean rating across rated records (0 when none are rated). */
  avg: number;
  /** Sum of every record's purchase price (0 when none recorded). */
  totalValue: number;
}

/**
 * Top-line collection figures shared by the home hero (app/page.tsx) and the
 * stats band (components/CollectionView.tsx). Centralized so the averaging /
 * summing logic lives in exactly one place and can't drift between the two.
 */
export function collectionStats(records: Record[]): CollectionStats {
  const rated = records.filter((r) => r.rating != null);
  const avg = rated.length
    ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
    : 0;
  const totalValue = records.reduce((s, r) => s + (r.purchase_price ?? 0), 0);
  return { total: records.length, avg, totalValue };
}
