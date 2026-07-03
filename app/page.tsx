import Nav from "@/components/Nav";
import CollectionView from "@/components/CollectionView";
import HeroStats from "@/components/HeroStats";
import { getRecords } from "@/lib/records";
import { collectionStats } from "@/lib/stats";

// Always render at request time so data is fetched with runtime env vars,
// never baked into a build-time static prerender.
export const dynamic = "force-dynamic";

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

export default async function HomePage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const records = await getRecords();
  const { total, avg, totalValue } = collectionStats(records);

  return (
    <>
      <Nav />
      <main className="pb-24">
        {!configured && (
          <div className="gutter mt-8">
            <div
              lang="ko"
              className="rounded-lg border border-[#b34a3a]/40 bg-[#b34a3a]/5 px-5 py-4 text-sm text-[#b34a3a]"
            >
              <strong>Supabase가 설정되지 않았습니다.</strong> 배포 환경에{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> 와{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
              환경변수를 추가한 뒤 재배포하세요.
            </div>
          </div>
        )}

        <section className="gutter pt-12 lg:pt-[72px]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
            My Vinyl Collection — <span lang="ko">내가 모은 것들, 내가 들은 것들</span>
          </p>
          <h1 className="mt-6 max-w-[900px] text-[40px] font-medium leading-[1.04] tracking-[-0.03em] sm:text-[52px] lg:text-[64px]">
            A living gallery of{" "}
            <span className="font-display italic tracking-[-0.01em]">
              {countPhrase(total)}.
            </span>
          </h1>
          <HeroStats total={total} avg={avg} totalValue={totalValue} />
        </section>

        <CollectionView records={records} />
      </main>
    </>
  );
}
