"use client";

import Link from "next/link";
import { VinylRecordIcon } from "@phosphor-icons/react";
import { GENRE_COLORS, GENRE_LABELS, type Record } from "@/lib/types";
import { formatKST } from "@/lib/date";
import { useReveal } from "@/lib/useReveal";
import GenreDot from "./GenreDot";
import StarRating from "./StarRating";
import VinylDisc from "./VinylDisc";
import WishlistButton from "./WishlistButton";

export default function AlbumCard({
  record,
  featured = false,
  index = 0,
  eyebrow = "Latest addition",
}: {
  record: Record;
  /** Hero treatment: editorial info column beside a large floating cover. */
  featured?: boolean;
  /** Position within the grid — drives the 80ms reveal stagger. */
  index?: number;
  /** Kicker above the hero title, e.g. "Latest addition". */
  eyebrow?: string;
}) {
  const { ref: revealRef, revealed } = useReveal<HTMLDivElement>();

  const genreLabel = GENRE_LABELS[record.genre] ?? record.genre;
  const genreColor = GENRE_COLORS[record.genre] ?? GENRE_COLORS.other;

  // Sleeve + disc: the grooved disc sits behind the cover and slides out on
  // hover, wearing the genre color on its label.
  const cover = (
    <div className="relative">
      <VinylDisc genreColor={genreColor} />
      <div
        className={`relative z-10 aspect-square rounded-[2px] transition-[translate,box-shadow] duration-300 ease-out group-hover:-translate-y-1.5 ${
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
          <div
            role="img"
            aria-label="No cover art"
            className="absolute inset-0 grid place-items-center rounded-[2px] bg-line text-muted"
          >
            <VinylRecordIcon size={featured ? 72 : 40} weight="thin" />
          </div>
        )}
        <div
          className={`absolute ${featured ? "right-3.5 top-3.5" : "right-3 top-3"}`}
        >
          <WishlistButton id={record.id} size={featured ? 17 : 15} />
        </div>
      </div>
    </div>
  );

  // Fade/rise reveal on the outer wrapper; the cover's hover lift lives on its
  // own element so the two transforms never fight.
  const revealClass = `relative transition-[opacity,translate] duration-700 ease-out hover:z-10 ${
    revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  }`;

  if (featured) {
    return (
      <div ref={revealRef} className={revealClass}>
        <Link
          href={`/record/${record.id}`}
          className="group grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:items-center lg:gap-[72px]"
        >
          <div className="order-2 lg:order-1">
            <p className="text-[13px] text-muted">{eyebrow}</p>
            <h2 className="mt-4 text-[32px] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[40px] lg:text-[48px]">
              {record.title}
            </h2>
            <p className="mt-3 text-xl italic text-muted">
              {record.artist}
              {record.year ? `, ${record.year}` : ""}
            </p>
            <div className="mt-[22px] flex flex-wrap items-center gap-x-3.5 gap-y-2">
              <StarRating value={record.rating} size={14} />
              <span className="inline-flex items-center gap-[7px] text-[13px] text-muted">
                <GenreDot genre={record.genre} size={7} />
                {genreLabel}
              </span>
            </div>
            <p className="mt-2.5 text-[13px] text-muted">
              <span lang="ko">등록</span> {formatKST(record.created_at)}
            </p>
          </div>
          {/* Drift wrapper: the lead cover eases down slightly as the page scrolls. */}
          <div className="hero-drift order-1 lg:order-2">{cover}</div>
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
            <p className="truncate text-[13px] text-muted">{record.artist}</p>
            <h3 className="mt-1 break-words text-[17.5px] font-semibold leading-[1.3] tracking-[-0.015em] line-clamp-2">
              {record.title}
            </h3>
            <p className="mt-[7px] text-[12.5px] text-muted">
              {record.year != null && (
                <>
                  <span>{record.year}</span>
                  {" · "}
                </>
              )}
              <span>{genreLabel}</span>
            </p>
          </div>
          <StarRating value={record.rating} size={12} className="flex-none" />
        </div>
      </Link>
    </div>
  );
}
