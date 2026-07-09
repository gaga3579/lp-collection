/** Format a number as Korean won, e.g. 1250000 → "₩ 1,250,000". */
export function formatKRW(value: number): string {
  return `₩ ${Math.round(value).toLocaleString("ko-KR")}`;
}
