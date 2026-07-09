import Link from "next/link";
import { GENRE_COLORS, type Record } from "@/lib/types";

interface Crate {
  label: string;
  items: Record[];
}

/**
 * The collection drawn as record crates: one spine per LP, standing on a
 * shelf line, grouped by decade. Spine color = genre color, so the chart
 * shows genre and era in a single picture. Every spine links to its record.
 */
export default function ShelfChart({ records }: { records: Record[] }) {
  const byDecade = new Map<number, Record[]>();
  const undated: Record[] = [];

  for (const r of records) {
    if (r.year == null) {
      undated.push(r);
      continue;
    }
    const decade = Math.floor(r.year / 10) * 10;
    byDecade.set(decade, [...(byDecade.get(decade) ?? []), r]);
  }

  const crates: Crate[] = [...byDecade.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, items]) => ({
      label: `${decade}s`,
      items: items.sort(
        (a, b) => (a.year ?? 0) - (b.year ?? 0) || a.artist.localeCompare(b.artist)
      ),
    }));
  if (undated.length > 0) crates.push({ label: "Undated", items: undated });

  if (crates.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-x-12 gap-y-14">
      {crates.map((crate) => (
        <div key={crate.label}>
          <div className="flex items-end gap-[3px] border-b-2 border-ink/60 px-1 pb-0">
            {crate.items.map((r) => (
              <Link
                key={r.id}
                href={`/record/${r.id}`}
                title={`${r.title}, ${r.artist}`}
                aria-label={`${r.title}, ${r.artist}`}
                className="block h-28 w-[13px] rounded-t-[1px] transition-transform duration-200 ease-out hover:-translate-y-2 sm:h-36 sm:w-[15px]"
                style={{
                  backgroundColor: GENRE_COLORS[r.genre] ?? GENRE_COLORS.other,
                }}
              />
            ))}
          </div>
          <p className="mt-2.5 text-[12px] text-muted">{crate.label}</p>
        </div>
      ))}
    </div>
  );
}
