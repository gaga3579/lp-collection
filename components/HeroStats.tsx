"use client";

import { formatKRW } from "@/lib/format";
import { useCountUp } from "@/lib/useCountUp";

interface HeroStatsProps {
  total: number;
  avg: number;
  totalValue: number;
}

export default function HeroStats({ total, avg, totalValue }: HeroStatsProps) {
  const animTotal = useCountUp(total, 1200);
  const animAvg = useCountUp(avg, 1400);
  const animValue = useCountUp(totalValue, 1600);

  return (
    <p className="mt-[26px] flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted">
      <span>
        <span className="font-semibold text-ink tabular-nums">
          {Math.round(animTotal)}
        </span>{" "}
        records
      </span>
      <span aria-hidden>·</span>
      <span>
        <span className="font-semibold text-ink tabular-nums">
          {animAvg.toFixed(1)}
        </span>{" "}
        average rating
      </span>
      {totalValue > 0 && (
        <>
          <span aria-hidden>·</span>
          <span>
            est.{" "}
            <span className="font-semibold text-ink tabular-nums">
              {formatKRW(Math.round(animValue))}
            </span>
          </span>
        </>
      )}
    </p>
  );
}
