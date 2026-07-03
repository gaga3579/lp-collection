"use client";

import Link from "next/link";
import { GENRE_LABELS, type Record } from "@/lib/types";
import { formatKST } from "@/lib/date";
import { useParallax } from "@/lib/useParallax";
import { useReveal } from "@/lib/useReveal";
import StarRating from "./StarRating";
import WishlistButton from "./WishlistButton";

export default function AlbumCard({
  record,
  featured = false,
  index = 0,
  eyebrow = "Latest addition",
}: {
  record: Record;
  /** Hero treatment: large floating cover beside an editorial info column. */
  featured?: boolean;
  /** Position within the grid — drives the 80ms reveal stagger. */
  index?: number;
  /** Kicker above the hero title, e.g. "Latest addition". */
  eyebrow?: string;
}) {
  const { ref: revealRef, revealed } = useReveal<HTMLDivElement>();
  const parallaxRef = useParallax<HTMLDivElement>();

  const genreLabel = GENRE_LABELS[record.genre] ?? record.genre;

  const cover = (
    <div
      className={`relative aspect-square rounded-[2px] transition-[translate,box-shadow] duration-300 ease-out group-hover:-translate-y-1.5 ${
        featured
          ? "shadow-cover-lg group-hover:shadow-cover-lg-hover"
          : "shadow-cover group-hover:shadow-cover-hover"
      }`}
    >
      {record.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external album-art hosts
        <img
          src={record.cover_url}
          alt={`${record.title} cover`}
          className="absolute inset-0 h-full w-full rounded-[2px] object-cover"
          loading={featured ? "eager" : "lazy"}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center rounded-[2px] bg-line text-muted">
          <span className={`font-display ${featured ? "text-6xl" : "text-3xl"}`}>
            ♪
          </span>
        </div>
      )}
      <div className={`absolute ${featured ? "right-3.5 top-3.5" : "right-3 top-3"}`}>
        <WishlistButton id={record.id} size={featured ? 17 : 15} />
      </div>
    </div>
  );

  // Fade/rise reveal on the outer wrapper; the cover's hover lift lives on its
  // own element so the two transforms never fight.
  const revealClass = `transition-[opacity,translate] duration-700 ease-out ${
    revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  }`;

  if (featured) {
    return (
      <div ref={revealRef} className={revealClass}>
        <Link
          href={`/record/${record.id}`}
          className="group grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,660px)_1fr] lg:items-end lg:gap-[72px]"
        >
          {/* Parallax wrapper: the lead cover drifts slower than the page. */}
          <div ref={parallaxRef}>{cover}</div>
          <div className="lg:pb-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              {eyebrow} · {genreLabel}
            </p>
            <h2 className="mt-[18px] text-[28px] font-medium leading-[1.05] tracking-[-0.025em] sm:text-4xl lg:text-[40px]">
              {record.title}
            </h2>
            <p className="mt-3 font-display text-xl italic text-muted">
              {record.artist}
              {record.year ? `, ${record.year}` : ""}
            </p>
            <div className="mt-[22px] flex items-center gap-3.5">
              <StarRating value={record.rating} size={14} />
              <span className="text-[13px] text-muted">
                <span lang="ko">등록</span> {formatKST(record.created_at)}
              </span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={revealRef}
      className={revealClass}
      style={{ transitionDelay: `${(index % 3) * 80}ms` }}
    >
      <Link href={`/record/${record.id}`} className="group block">
        {cover}
        <div className="mt-5 flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-muted">
              {record.artist}
            </p>
            <h3 className="mt-1.5 break-words text-[17.5px] font-semibold leading-[1.3] tracking-[-0.015em] line-clamp-2">
              {record.title}
            </h3>
            <p className="mt-[7px] text-[12.5px] text-muted">
              <span>{record.year ?? "—"}</span> · <span>{genreLabel}</span>
            </p>
          </div>
          <StarRating value={record.rating} size={12} className="flex-none" />
        </div>
      </Link>
    </div>
  );
}
