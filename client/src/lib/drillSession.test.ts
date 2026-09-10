import { describe, expect, it } from "vitest";
import { durationToSeconds, formatCountdown, sessionProgress } from "./drillSession";

describe("drill session timing", () => {
  it("converts visible drill durations into seconds", () => {
    expect(durationToSeconds("12 min")).toBe(720);
    expect(durationToSeconds("20 min")).toBe(1200);
    expect(durationToSeconds("unplanned")).toBe(0);
  });

  it("formats a resilient countdown value", () => {
    expect(formatCountdown(720)).toBe("12:00");
    expect(formatCountdown(65.7)).toBe("01:05");
    expect(formatCountdown(-10)).toBe("00:00");
  });

  it("bounds guided-session progress", () => {
    expect(sessionProgress(720, 720)).toBe(0);
    expect(sessionProgress(720, 360)).toBe(50);
    expect(sessionProgress(720, -30)).toBe(100);
  });
});
