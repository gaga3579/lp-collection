import Link from "next/link";
import { VinylRecordIcon } from "@phosphor-icons/react/dist/ssr";
import Nav from "@/components/Nav";
import GenreDot from "@/components/GenreDot";
import ShelfChart from "@/components/ShelfChart";
import StarRating from "@/components/StarRating";
import { GENRES, GENRE_LABELS } from "@/lib/types";
import { getRecords } from "@/lib/records";

// Always render at request time using runtime env vars.
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const records = await getRecords();

  const genreCounts = GENRES.map((g) => ({
    genre: g,
    count: records.filter((r) => r.genre === g).length,
  })).filter((g) => g.count > 0);

  const topRated = [...records]
    .filter((r) => r.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  return (
    <>
      <Nav />
      <main className="pb-24">
        <div className="gutter pt-12 lg:pt-16">
          <h1 className="text-[36px] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
            The shelf, by the numbers.
          </h1>
          <p className="mt-4 text-sm text-muted">
            {records.length} records, one spine each, grouped by decade.
          </p>
        </div>

        {records.length === 0 ? (
          <div className="gutter mt-14">
            <div className="border border-dashed border-line py-24 text-center text-muted">
              No data yet.
            </div>
          </div>
        ) : (
          <>
            {/* The shelf — each spine is a record, colored by genre. */}
            <div className="gutter mt-14 lg:mt-16">
              <ShelfChart records={records} />
              <div className="mt-9 flex flex-wrap gap-x-[22px] gap-y-2.5 text-[13px] text-muted">
                {genreCounts.map((g) => (
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

            {/* Top rated — a short row of covers, not a table. */}
            {topRated.length > 0 && (
              <div className="gutter mt-20 border-t border-line pt-14 lg:mt-24">
                <h2 className="text-2xl font-medium tracking-[-0.02em]">
                  Top rated
                </h2>
                <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-8">
                  {topRated.map((r) => (
                    <Link key={r.id} href={`/record/${r.id}`} className="group">
                      <div className="relative aspect-square rounded-[2px] shadow-cover transition-[translate,box-shadow] duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-cover-hover">
                        {r.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external album-art hosts
                          <img
                            src={r.cover_url}
                            alt={`${r.title} cover`}
                            className="absolute inset-0 h-full w-full rounded-[2px] object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            role="img"
                            aria-label="No cover art"
                            className="absolute inset-0 grid place-items-center rounded-[2px] bg-line text-muted"
                          >
                            <VinylRecordIcon size={36} weight="thin" />
                          </div>
                        )}
                      </div>
                      <p className="mt-3.5 truncate text-[12.5px] text-muted">
                        {r.artist}
                      </p>
                      <p className="mt-1 break-words text-[15px] font-semibold leading-snug line-clamp-2">
                        {r.title}
                      </p>
                      <StarRating value={r.rating} size={11} className="mt-2" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
