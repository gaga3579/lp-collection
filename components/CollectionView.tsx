"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import {
  GENRES,
  GENRE_LABELS,
  SORT_OPTIONS,
  type Genre,
  type Record,
  type SortKey,
} from "@/lib/types";
import { formatKRW } from "@/lib/format";
import { collectionStats } from "@/lib/stats";
import { useCountUp } from "@/lib/useCountUp";
import AlbumCard from "./AlbumCard";
import GenreDot from "./GenreDot";
import HeroStats from "./HeroStats";

type Filter = Genre | "all";

// Kicker above the lead album, matched to what the current sort surfaces.
const LEAD_EYEBROWS: { [K in SortKey]: string } = {
  recent: "Latest addition",
  rating: "Highest rated",
  year: "Newest release",
  artist: "First in the bins",
};

const NUMBER_WORDS = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

// "A living gallery of *twelve records.*" — the count is spelled out while it
// still reads like prose, then falls back to numerals.
function countPhrase(n: number): string {
  const word = n >= 0 && n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n);
  return `${word} ${n === 1 ? "record" : "records"}`;
}

export default function CollectionView({ records }: { records: Record[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("recent");

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
    const byGenre = GENRES.map((g) => ({
      genre: g,
      count: records.filter((r) => r.genre === g).length,
    })).filter((g) => g.count > 0);
    return { ...collectionStats(records), byGenre };
  }, [records]);

  const [lead, ...rest] = visible;

  const pillClass = (active: boolean) =>
    `border-b-[1.5px] pb-[3px] transition ${
      active
        ? "border-ink font-semibold text-ink"
        : "border-transparent text-muted hover:text-ink"
    }`;

  return (
    <section>
      {/* Hero headline — the one uppercase eyebrow on the page lives here. */}
      <div className="gutter pt-12 lg:pt-16">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
          My Vinyl Collection ·{" "}
          <span lang="ko">내가 모은 것들, 내가 들은 것들</span>
        </p>
        <h1 className="mt-6 max-w-[900px] text-[40px] font-medium leading-[1.04] tracking-[-0.03em] sm:text-[52px] lg:text-[64px]">
          A living gallery of{" "}
          <span className="italic">{countPhrase(stats.total)}.</span>
        </h1>
        <HeroStats
          total={stats.total}
          avg={stats.avg}
          totalValue={stats.totalValue}
        />
      </div>

      {/* Lead album — info column beside the drifting cover. */}
      {lead && (
        <div className="gutter mt-14 lg:mt-16">
          <AlbumCard record={lead} featured eyebrow={LEAD_EYEBROWS[sort]} />
        </div>
      )}

      {/* Filter / search / sort bar */}
      <div className="gutter mt-16 lg:mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-5 border-t border-line pt-7">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2.5 text-[13.5px]">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={pillClass(filter === "all")}
            >
              All {stats.total}
            </button>
            {stats.byGenre.map((g) => (
              <button
                key={g.genre}
                type="button"
                onClick={() => setFilter(g.genre)}
                className={pillClass(filter === g.genre)}
              >
                {GENRE_LABELS[g.genre]} {g.count}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-7 gap-y-2 whitespace-nowrap text-[13px] text-muted">
            <label className="inline-flex items-center gap-[7px]">
              <MagnifyingGlassIcon size={13} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search artist or title"
                className="w-24 border-b border-transparent bg-transparent text-ink outline-none transition-[width,border-color] placeholder:text-muted focus:w-44 focus:border-line"
              />
            </label>
            <label className="inline-flex items-baseline gap-1.5">
              Sorted by
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="cursor-pointer appearance-none bg-transparent text-ink outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Gallery grid of everything after the lead */}
      <div className="gutter mt-12">
        {rest.length > 0 && (
          <div className="grid grid-cols-1 gap-y-20 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-14">
            {rest.map((r, i) => (
              <AlbumCard key={r.id} record={r} index={i} />
            ))}
          </div>
        )}
        {!lead && (
          <div className="border border-dashed border-line py-24 text-center text-muted">
            {records.length === 0
              ? "No records yet. Sign in as the owner to add your first LP."
              : "No records match your search."}
          </div>
        )}
      </div>

      {/* Stats band — the numbers speak for themselves, no kicker needed. */}
      {records.length > 0 && (
        <div className="mt-20 border-t border-line">
          <div className="gutter pb-6 pt-16 text-center lg:pb-10 lg:pt-[72px]">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
              <CountUpStat
                label="Total records"
                target={stats.total}
                format={(n) => String(Math.round(n))}
              />
              <CountUpStat
                label="Average rating"
                target={stats.avg}
                format={(n) => n.toFixed(1)}
              />
              <CountUpStat
                label="Genres"
                target={stats.byGenre.length}
                format={(n) => String(Math.round(n))}
              />
              <CountUpStat
                label={<span lang="ko">총 컬렉션 가치</span>}
                target={stats.totalValue}
                format={(n) => formatKRW(Math.round(n))}
                valueClassName="pt-3.5 text-3xl sm:text-[44px]"
              />
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-x-[22px] gap-y-2.5 text-[13px] text-muted">
              {stats.byGenre.map((g) => (
                <span
                  key={g.genre}
                  className="inline-flex items-center gap-[7px]"
                >
                  <GenreDot genre={g.genre} size={7} />
                  {GENRE_LABELS[g.genre]} {g.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CountUpStat({
  label,
  target,
  format = (n) => String(Math.round(n)),
  valueClassName = "text-5xl sm:text-[64px]",
  duration = 1400,
}: {
  label: ReactNode;
  target: number;
  format?: (n: number) => string;
  valueClassName?: string;
  duration?: number;
}) {
  const value = useCountUp(target, duration);

  return (
    <div>
      <p
        className={`font-medium leading-none tracking-[-0.02em] tabular-nums break-words ${valueClassName}`}
      >
        {format(value)}
      </p>
      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
    </div>
  );
}
