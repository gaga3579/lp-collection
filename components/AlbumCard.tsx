import Link from "next/link";
import { GENRE_LABELS, type Record } from "@/lib/types";
import { formatKST } from "@/lib/date";
import GenreDot from "./GenreDot";
import StarRating from "./StarRating";
import WishlistButton from "./WishlistButton";

/** A single album in the collection grid. */
export default function AlbumCard({ record }: { record: Record }) {
  return (
    <Link
      href={`/record/${record.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="relative aspect-square overflow-hidden bg-canvas">
        {record.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external album-art hosts
          <img
            src={record.cover_url}
            alt={`${record.title} cover`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <span className="font-display text-3xl">♪</span>
          </div>
        )}

        <div className="absolute right-2 top-2">
          <WishlistButton id={record.id} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
          <GenreDot genre={record.genre} />
          <span className="truncate">{GENRE_LABELS[record.genre] ?? record.genre}</span>
        </div>
        <p className="mt-1 truncate text-sm text-muted">{record.artist}</p>
        <h3 className="font-display text-lg leading-tight break-words line-clamp-2">
          {record.title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm text-muted">{record.year ?? "—"}</span>
          <StarRating value={record.rating} />
        </div>
        <p className="mt-1 text-xs text-muted">
          등록 {formatKST(record.created_at)}
        </p>
      </div>
    </Link>
  );
}
