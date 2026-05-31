/**
 * Format an ISO timestamp in Korea Standard Time (Asia/Seoul) as
 * "YYYY. MM. DD HH:mm", e.g. "2026. 05. 31 01:23".
 *
 * Uses Intl with an explicit timeZone, so output is identical on the server
 * and client regardless of the host timezone (no hydration mismatch).
 */
export function formatKST(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}. ${get("month")}. ${get("day")} ${get("hour")}:${get("minute")}`;
}
