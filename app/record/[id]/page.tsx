import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import GenreDot from "@/components/GenreDot";
import StarRating from "@/components/StarRating";
import WishlistButton from "@/components/WishlistButton";
import { CONDITIONS, GENRE_LABELS } from "@/lib/types";
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

  const conditionLabel =
    CONDITIONS.find((c) => c.value === record.condition)?.label ??
    record.condition ??
    "—";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-muted transition hover:text-ink"
        >
          ← Back to collection
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <div className="relative self-start overflow-hidden rounded-[2px] shadow-cover-lg">
            <div className="aspect-square">
              {record.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary external album-art hosts
                <img
                  src={record.cover_url}
                  alt={`${record.title} cover`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted">
                  <span className="font-display text-6xl">♪</span>
                </div>
              )}
            </div>
            <div className="absolute right-3 top-3">
              <WishlistButton id={record.id} size={20} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted">
              <GenreDot genre={record.genre} />
              {GENRE_LABELS[record.genre] ?? record.genre}
            </div>
            <p className="mt-4 text-lg text-muted">{record.artist}</p>
            <h1 className="font-display text-5xl leading-tight">
              {record.title}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <StarRating value={record.rating} size={20} />
              {record.rating != null && (
                <span className="text-muted">{record.rating}/5</span>
              )}
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-8">
              <Field label="Year" value={record.year ?? "—"} />
              <Field label="Condition" value={conditionLabel} />
              <Field
                label="Purchase price"
                value={
                  record.purchase_price != null
                    ? formatKRW(Number(record.purchase_price))
                    : "—"
                }
              />
              <Field
                label="Purchase date"
                value={record.purchase_date ?? "—"}
              />
              <Field
                label={<span lang="ko">등록일시 (KST)</span>}
                value={formatKST(record.created_at)}
              />
            </dl>

            {record.notes && (
              <div className="mt-8 border-t border-line pt-8">
                <p className="text-xs uppercase tracking-wide text-muted">
                  Notes
                </p>
                <p className="mt-2 leading-relaxed">{record.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function Field({
  label,
  value,
}: {
  label: React.ReactNode;
  value: string | number;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-lg">{value}</dd>
    </div>
  );
}
