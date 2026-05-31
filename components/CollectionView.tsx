"use client";

import { useMemo, useState } from "react";
import {
  GENRES,
  GENRE_LABELS,
  SORT_OPTIONS,
  type Genre,
  type Record,
  type SortKey,
} from "@/lib/types";
import { useWishlist } from "@/lib/useWishlist";
import { formatKRW } from "@/lib/format";
import AlbumCard from "./AlbumCard";
import GenreDot from "./GenreDot";

type Filter = Genre | "all";

export default function CollectionView({ records }: { records: Record[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const { count: wishlistCount } = useWishlist();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = records.filter((r) => {
      const matchesGenre = filter === "all" || r.genre === filter;
      const matchesQuery =
        !q ||
        r.artist.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q);
      return matchesGenre && matchesQuery;
    });

    const sorted = [...filtered];
    switch (sort) {
      case "year":
        sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      case "rating":
        sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "artist":
        sorted.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case "recent":
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return sorted;
  }, [records, query, filter, sort]);

  const stats = useMemo(() => {
    const rated = records.filter((r) => r.rating != null);
    const avg =
      rated.length > 0
        ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
        : 0;
    const byGenre = GENRES.map((g) => ({
      genre: g,
      count: records.filter((r) => r.genre === g).length,
    })).filter((g) => g.count > 0);
    const totalValue = records.reduce(
      (s, r) => s + (r.purchase_price ?? 0),
      0
    );
    return { total: records.length, avg, byGenre, totalValue };
  }, [records]);

  return (
    <section>
      {/* Toolbar */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artist or title…"
            className="w-full rounded-full border border-line bg-card px-5 py-2.5 text-sm outline-none transition focus:border-ink sm:max-w-xs"
          />
          <label className="flex items-center gap-2 text-sm text-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-full border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none transition focus:border-ink"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", ...GENRES] as Filter[]).map((g) => {
            const active = filter === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setFilter(g)}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition ${
                  active
                    ? "border-ink bg-ink text-card"
                    : "border-line bg-card text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {g !== "all" && <GenreDot genre={g} />}
                {g === "all" ? "All" : GENRE_LABELS[g]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((r) => (
            <AlbumCard key={r.id} record={r} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-card py-20 text-center text-muted">
          {records.length === 0
            ? "No records yet. Sign in as the owner to add your first LP."
            : "No records match your search."}
        </div>
      )}

      {/* Stats section — full-bleed warm cream band, magazine-style */}
      {records.length > 0 && (
        <div className="mt-16 -mx-6 border-t border-line bg-[#ede9e1] px-6 py-14 sm:px-10 sm:py-16">
          <p className="mb-6 text-xs uppercase tracking-[0.2em] text-muted">
            By the numbers
          </p>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
          <Stat label="Total records" value={String(stats.total)} />
          <Stat label="Average rating" value={stats.avg.toFixed(1)} />
          <Stat label="On wishlist" value={String(wishlistCount)} />
          <Stat
            label="총 컬렉션 가치"
            value={formatKRW(stats.totalValue)}
            valueClassName="text-2xl sm:text-3xl"
          />
          <div className="bg-card p-6 col-span-2 md:col-span-4">
            <p className="text-xs uppercase tracking-wide text-muted">
              Genres
            </p>
            <ul className="mt-3 space-y-1.5">
              {stats.byGenre.map((g) => (
                <li
                  key={g.genre}
                  className="flex items-center gap-2 text-sm"
                >
                  <GenreDot genre={g.genre} />
                  <span className="flex-1">{GENRE_LABELS[g.genre]}</span>
                  <span className="text-muted">{g.count}</span>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  valueClassName = "text-4xl",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="bg-card p-6">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 font-display ${valueClassName} break-words`}>
        {value}
      </p>
    </div>
  );
}
