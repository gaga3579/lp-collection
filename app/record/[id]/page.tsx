import Link from "next/link";
import { notFound } from "next/navigation";
import { VinylRecordIcon } from "@phosphor-icons/react/dist/ssr";
import Nav from "@/components/Nav";
import GenreDot from "@/components/GenreDot";
import StarRating from "@/components/StarRating";
import TrackList from "@/components/TrackList";
import VinylDisc from "@/components/VinylDisc";
import WishlistButton from "@/components/WishlistButton";
import { CONDITIONS, GENRE_COLORS, GENRE_LABELS } from "@/lib/types";
import { formatKST } from "@/lib/date";
import { formatKRW } from "@/lib/format";
import { getRecord } from "@/lib/records";

// Always render at request time using runtime env vars.
export const dynamic = "force-dynamic";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getRecord(id);

  if (!record) notFound();

  const conditionLabel = CONDITIONS.find(
    (c) => c.value === record.condition
  )?.label;
  const genreColor = GENRE_COLORS[record.genre] ?? GENRE_COLORS.other;

  // Spec fields render only when the value exists — no placeholder dashes.
  const fields: { label: React.ReactNode; value: string | number }[] = [];
  if (record.year != null) fields.push({ label: "Year", value: record.year });
  if (conditionLabel) fields.push({ label: "Condition", value: conditionLabel });
  if (record.purchase_price != null)
    fields.push({
      label: "Purchase price",
      value: formatKRW(Number(record.purchase_price)),
    });
  if (record.purchase_date)
    fields.push({ label: "Purchase date", value: record.purchase_date });
  fields.push({
    label: <span lang="ko">등록일시 (KST)</span>,
    value: formatKST(record.created_at),
  });

  return (
    <>
      <Nav />
      <main className="gutter pb-24 pt-10">
        <Link href="/" className="text-sm text-muted transition hover:text-ink">
          ← Back to collection
        </Link>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,640px)_1fr] lg:gap-20">
          {/* Sleeve with the record half out — the disc label wears the genre color. */}
          <div className="relative self-start">
            <VinylDisc genreColor={genreColor} out />
            <div className="relative z-10 aspect-square w-[68%] rounded-[2px] shadow-cover-lg">
              {record.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary external album-art hosts
                <img
                  src={record.cover_url}
                  alt={`${record.title} cover`}
                  className="absolute inset-0 h-full w-full rounded-[2px] object-cover"
                />
              ) : (
                <div
                  role="img"
                  aria-label="No cover art"
                  className="absolute inset-0 grid place-items-center rounded-[2px] bg-line text-muted"
                >
                  <VinylRecordIcon size={72} weight="thin" />
                </div>
              )}
              <div className="absolute right-3 top-3">
                <WishlistButton id={record.id} size={18} />
              </div>
            </div>
          </div>

          <div className="max-w-[620px]">
            <p className="inline-flex items-center gap-2 text-[13px] text-muted">
              <GenreDot genre={record.genre} size={7} />
              {GENRE_LABELS[record.genre] ?? record.genre}
            </p>
            <p className="mt-5 text-lg italic text-muted">{record.artist}</p>
            <h1 className="mt-2 text-[36px] font-medium leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              {record.title}
            </h1>

            <div className="mt-5 flex items-center gap-3">
              <StarRating value={record.rating} size={18} />
              {record.rating != null && (
                <span className="text-sm text-muted">{record.rating}/5</span>
              )}
            </div>

            <TrackList artist={record.artist} title={record.title} />

            {record.notes && (
              <p className="mt-9 border-t border-line pt-8 text-[16.5px] leading-relaxed">
                {record.notes}
              </p>
            )}

            <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-8">
              {fields.map((f, i) => (
                <div key={i}>
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">
                    {f.label}
                  </dt>
                  <dd className="mt-1.5 text-lg">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </main>
    </>
  );
}
