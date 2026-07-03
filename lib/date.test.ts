import { describe, it, expect } from "vitest";
import { formatKST } from "./date";

// formatKST always renders in Asia/Seoul (UTC+9) via an explicit Intl timeZone,
// so these assertions are independent of the host machine's timezone.
describe("formatKST", () => {
  it("formats a UTC ISO timestamp in Korea Standard Time (UTC+9)", () => {
    // 2026-05-30 16:23 UTC -> 2026-05-31 01:23 KST
    expect(formatKST("2026-05-30T16:23:00.000Z")).toBe("2026. 05. 31 01:23");
  });

  it("zero-pads month, day, hour, and minute", () => {
    // 2026-01-02 00:05 UTC -> 2026-01-02 09:05 KST
    expect(formatKST("2026-01-02T00:05:00.000Z")).toBe("2026. 01. 02 09:05");
  });

  it("uses a 24-hour clock (h23) for afternoon times", () => {
    // 2026-06-22 04:00 UTC -> 2026-06-22 13:00 KST
    expect(formatKST("2026-06-22T04:00:00.000Z")).toBe("2026. 06. 22 13:00");
  });

  it("rolls the date forward when KST crosses midnight", () => {
    // 2026-12-31 15:30 UTC -> 2027-01-01 00:30 KST
    expect(formatKST("2026-12-31T15:30:00.000Z")).toBe("2027. 01. 01 00:30");
  });

  it("renders midnight as 00 under the h23 hour cycle", () => {
    // 2026-03-09 15:00 UTC -> 2026-03-10 00:00 KST
    expect(formatKST("2026-03-09T15:00:00.000Z")).toBe("2026. 03. 10 00:00");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatKST("not-a-date")).toBe("");
  });

  it("returns an empty string for an empty input", () => {
    expect(formatKST("")).toBe("");
  });
});
