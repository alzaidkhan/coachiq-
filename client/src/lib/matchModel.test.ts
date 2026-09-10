import { describe, expect, it } from "vitest";
import { normalizeBowlingSpells, normalizeScoringZones, scoringZoneTotal, spellTotals } from "./matchModel";

describe("CoachIQ match model", () => {
  it("migrates a legacy aggregate spell into one separately editable legal-ball spell", () => {
    const spells = normalizeBowlingSpells(undefined, { phase: "Powerplay", overs: 2.4, wickets: 2, runsConceded: 16, maidens: 0 });
    expect(spells).toEqual([{ id: "spell-1", phase: "Powerplay", overs: 2.4, wickets: 2, runsConceded: 16, maidens: 0 }]);
  });

  it("combines separate spells using legal balls rather than invalid decimal arithmetic", () => {
    expect(spellTotals([
      { id: "one", phase: "Powerplay", overs: 1.5, wickets: 1, runsConceded: 8, maidens: 0 },
      { id: "two", phase: "Death", overs: 2.2, wickets: 2, runsConceded: 17, maidens: 0 },
    ])).toEqual({ overs: 4.1, wickets: 3, runsConceded: 25, maidens: 0 });
  });

  it("keeps only known numeric scoring zones and totals the player-entered runs", () => {
    const zones = normalizeScoringZones({ cover: 14, midWicket: "6", unknown: 99, fineLeg: -1 });
    expect(zones).toEqual({ cover: 14, midWicket: 6 });
    expect(scoringZoneTotal(zones)).toBe(20);
  });
});
