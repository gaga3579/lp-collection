/** Format a number as Korean won, e.g. 1250000 → "₩ 1,250,000". */
export function formatKRW(value: number): string {
  return `₩ ${Math.round(value).toLocaleString("ko-KR")}`;
}

/** Format a duration in milliseconds as "m:ss", e.g. 561000 → "9:21". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
