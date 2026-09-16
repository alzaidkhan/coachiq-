import { describe, expect, it } from "vitest";
import { bowlingPhasePerformance, dismissalTrend } from "./matchAnalytics";

describe("CoachIQ filtered match analytics", () => {
  const selectedMatches = [
    { dismissalType: "Caught", bowlingPhase: "Powerplay", overs: 2.4, wickets: 2, runsConceded: 16 },
    { dismissalType: "Bowled", overs: 1.2, wickets: 1, runsConceded: 10, bowlingSpells: [{ id: "split-one", phase: "Powerplay", overs: 1.2, wickets: 1, runsConceded: 10, maidens: 0 }, { id: "split-two", phase: "Death", overs: 2.0, wickets: 1, runsConceded: 18, maidens: 0 }] },
    { dismissalType: "Caught", bowlingPhase: "Death", overs: 2.0, wickets: 1, runsConceded: 18 },
    { dismissalType: "Not out", overs: 0, wickets: 0, runsConceded: 0 },
  ];

  it("counts only recorded dismissals and excludes not-out scorecards", () => {
    expect(dismissalTrend(selectedMatches)).toEqual([
      { name: "Caught", dismissals: 2 },
      { name: "Bowled", dismissals: 1 },
    ]);
  });

  it("aggregates logged spells by their selected cricket phase with correct legal-ball economy", () => {
    expect(bowlingPhasePerformance(selectedMatches)).toEqual([
      { name: "Powerplay", wickets: 3, economy: 6.5, overs: "4.0" },
      { name: "Death", wickets: 2, economy: 9, overs: "4.0" },
    ]);
  });
});
