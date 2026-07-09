import { describe, it, expect } from "vitest";
import { formatDuration, formatKRW } from "./format";

// Smoke test proving the Vitest setup works. Per-directory suites are added by
// the analysis/test workflow; this anchors the toolchain.
describe("formatKRW (smoke)", () => {
  it("formats an integer as Korean won", () => {
    expect(formatKRW(1250000)).toBe("₩ 1,250,000");
  });

  it("rounds fractional values", () => {
    expect(formatKRW(999.6)).toBe("₩ 1,000");
  });
});

describe("formatKRW (extended)", () => {
  it("formats zero", () => {
    expect(formatKRW(0)).toBe("₩ 0");
  });

  it("rounds half up to the nearest integer", () => {
    expect(formatKRW(0.5)).toBe("₩ 1");
    // Math.round rounds .5 toward +Infinity, so -0.5 rounds to 0 (no sign).
    expect(formatKRW(2.5)).toBe("₩ 3");
  });

  it("rounds down values below the halfway point", () => {
    expect(formatKRW(1.4)).toBe("₩ 1");
    expect(formatKRW(1234.49)).toBe("₩ 1,234");
  });

  it("groups large numbers with thousands separators", () => {
    expect(formatKRW(1000000)).toBe("₩ 1,000,000");
    expect(formatKRW(12345678)).toBe("₩ 12,345,678");
  });

  it("formats negative values with the minus sign before the symbol's amount", () => {
    expect(formatKRW(-1500)).toBe("₩ -1,500");
  });

  it("rounds negative fractions toward positive infinity (Math.round semantics)", () => {
    // Math.round(-1000.5) === -1000
    expect(formatKRW(-1000.5)).toBe("₩ -1,000");
    // Math.round(-1000.6) === -1001
    expect(formatKRW(-1000.6)).toBe("₩ -1,001");
  });
});

describe("formatDuration", () => {
  it("formats a whole number of minutes", () => {
    expect(formatDuration(180000)).toBe("3:00");
  });

  it("pads single-digit seconds", () => {
    expect(formatDuration(61000)).toBe("1:01");
  });

  it("does not pad the minutes portion", () => {
    expect(formatDuration(561000)).toBe("9:21");
  });

  it("rounds to the nearest second", () => {
    expect(formatDuration(59600)).toBe("1:00");
    expect(formatDuration(59400)).toBe("0:59");
  });

  it("formats durations under a minute", () => {
    expect(formatDuration(5000)).toBe("0:05");
  });

  it("formats durations over an hour without an hours component", () => {
    expect(formatDuration(3661000)).toBe("61:01");
  });
});
