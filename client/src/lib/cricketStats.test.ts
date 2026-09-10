import { describe, expect, it } from "vitest";
import { ballsToOvers, economyFor, normalizeOvers, oversToBalls, stepOvers, validateScorecard } from "./cricketStats";

describe("CoachIQ cricket scorecard domain", () => {
  it("parses legal cricket overs and rejects invalid ball notation", () => {
    expect(oversToBalls("3.4")).toBe(22);
    expect(oversToBalls("3.6")).toBeNull();
    expect(oversToBalls("three")).toBeNull();
  });

  it("shows unavailable economy rather than a false zero when no balls are logged", () => {
    expect(economyFor(18, "")).toBe("Not calculated");
    expect(economyFor(18, "3.0")).toBe("6.0");
  });

  it("formats a spell using six legal balls per over and normalizes legacy invalid values safely", () => {
    expect(ballsToOvers(0)).toBe("0.0");
    expect(ballsToOvers(5)).toBe("0.5");
    expect(ballsToOvers(6)).toBe("1.0");
    expect(ballsToOvers(22)).toBe("3.4");
    expect(normalizeOvers("3.4")).toBe(3.4);
    expect(normalizeOvers("0.7")).toBe(0);
  });

  it("steps through spells one legal ball at a time without creating invalid decimal overs", () => {
    expect(stepOvers("0.5", 1)).toBe("1.0");
    expect(stepOvers("1.0", -1)).toBe("0.5");
    expect(stepOvers("", 1)).toBe("0.1");
    expect(stepOvers("50.0", 1)).toBe("50.0");
  });

  it("validates partial scorecards without forcing unused sections", () => {
    expect(validateScorecard({ runs: 0, fours: 0, sixes: 0, overs: "", maidens: 0 })).toBeNull();
    expect(validateScorecard({ runs: 5, fours: 2, sixes: 0, overs: "", maidens: 0 })).toBe("Boundaries exceed runs.");
    expect(validateScorecard({ runs: 0, fours: 0, sixes: 0, overs: "2.3", maidens: 1 })).toBeNull();
    expect(validateScorecard({ runs: 0, fours: 0, sixes: 0, overs: "2.3", maidens: 3 })).toBe("Maidens exceed completed overs.");
  });
});
