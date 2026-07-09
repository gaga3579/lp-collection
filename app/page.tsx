import Nav from "@/components/Nav";
import CollectionView from "@/components/CollectionView";
import { getRecords } from "@/lib/records";

// Always render at request time so data is fetched with runtime env vars,
// never baked into a build-time static prerender.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const records = await getRecords();

  return (
    <>
      <Nav />
      <main className="pb-24">
        {!configured && (
          <div className="gutter mt-8">
            <div
              lang="ko"
              className="rounded-lg border border-accent/40 bg-accent/5 px-5 py-4 text-sm text-accent"
            >
              <strong>Supabase가 설정되지 않았습니다.</strong> 배포 환경에{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> 와{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
              환경변수를 추가한 뒤 재배포하세요.
            </div>
          </div>
        )}

        <CollectionView records={records} />
      </main>
    </>
  );
}
