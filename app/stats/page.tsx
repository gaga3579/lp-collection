import Link from "next/link";
import Nav from "@/components/Nav";
import GenreDot from "@/components/GenreDot";
import StarRating from "@/components/StarRating";
import { GENRES, GENRE_COLORS, GENRE_LABELS, type Genre } from "@/lib/types";
import { getRecords } from "@/lib/records";

export default async function StatsPage() {
  const records = await getRecords();

  // Genre breakdown
  const genreCounts = GENRES.map((g) => ({
    genre: g,
    count: records.filter((r) => r.genre === g).length,
  })).filter((g) => g.count > 0);
  const maxGenre = Math.max(1, ...genreCounts.map((g) => g.count));

  // By decade
  const decadeMap = new Map<number, number>();
  for (const r of records) {
    if (r.year == null) continue;
    const decade = Math.floor(r.year / 10) * 10;
    decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + 1);
  }
  const decades = [...decadeMap.entries()].sort((a, b) => a[0] - b[0]);
  const maxDecade = Math.max(1, ...decades.map(([, c]) => c));

  // Top rated
  const topRated = [...records]
    .filter((r) => r.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-5xl">Collection Statistics</h1>
        <p className="mt-2 text-muted">
          A look across {records.length} records.
        </p>

        {records.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed border-line bg-card py-20 text-center text-muted">
            No data yet.
          </div>
        ) : (
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            {/* Genre bar chart */}
            <section>
              <h2 className="font-display text-2xl">By genre</h2>
              <ul className="mt-6 space-y-3">
                {genreCounts.map((g) => (
                  <li key={g.genre}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <GenreDot genre={g.genre} />
                        {GENRE_LABELS[g.genre]}
                      </span>
                      <span className="text-muted">{g.count}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(g.count / maxGenre) * 100}%`,
                          backgroundColor: GENRE_COLORS[g.genre as Genre],
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* By decade */}
            <section>
              <h2 className="font-display text-2xl">By decade</h2>
              {decades.length === 0 ? (
                <p className="mt-6 text-muted">No years recorded.</p>
              ) : (
                <div className="mt-6 flex h-48 items-end gap-3">
                  {decades.map(([decade, count]) => (
                    <div
                      key={decade}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <span className="text-sm text-muted">{count}</span>
                      <div
                        className="w-full rounded-t bg-ink"
                        style={{
                          height: `${(count / maxDecade) * 100}%`,
                          minHeight: 4,
                        }}
                      />
                      <span className="text-xs text-muted">{decade}s</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Top rated */}
            <section className="md:col-span-2">
              <h2 className="font-display text-2xl">Top rated</h2>
              <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-card">
                {topRated.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/record/${r.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-canvas"
                    >
                      <span>
                        <span className="text-sm text-muted">{r.artist}</span>
                        <span className="block font-display text-lg leading-tight">
                          {r.title}
                        </span>
                      </span>
                      <StarRating value={r.rating} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
