import Nav from "@/components/Nav";
import CollectionView from "@/components/CollectionView";
import { getRecords } from "@/lib/records";

export default async function HomePage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const records = await getRecords();

  const rated = records.filter((r) => r.rating != null);
  const avg =
    rated.length > 0
      ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
      : 0;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-12">
        {!configured && (
          <div className="mb-8 rounded-lg border border-[#b34a3a]/40 bg-[#b34a3a]/5 px-5 py-4 text-sm text-[#b34a3a]">
            <strong>Supabase가 설정되지 않았습니다.</strong> 배포 환경에{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> 와{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            환경변수를 추가한 뒤 재배포하세요.
          </div>
        )}
        <section className="mb-16 border-b-2 border-[#dcd8d0] pb-14">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Modern Archive
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[1.05] sm:text-6xl">
            My Vinyl Collection
          </h1>
          <p className="mt-4 font-display text-xl italic text-muted/90">
            내가 모은 것들, 내가 들은 것들
          </p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-muted">
            <span>
              <span className="font-display text-2xl text-ink">
                {records.length}
              </span>{" "}
              records
            </span>
            <span>
              <span className="font-display text-2xl text-ink">
                {avg.toFixed(1)}
              </span>{" "}
              average rating
            </span>
          </div>
        </section>

        <CollectionView records={records} />
      </main>
    </>
  );
}
