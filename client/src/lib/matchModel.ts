import { ballsToOvers, oversToBalls } from "./cricketStats";

export const scoringZones = [
  { id: "fineLeg", label: "Fine leg", x: 52, y: 12 },
  { id: "squareLeg", label: "Square leg", x: 82, y: 30 },
  { id: "midWicket", label: "Mid-wicket", x: 88, y: 62 },
  { id: "longOn", label: "Long on", x: 64, y: 87 },
  { id: "longOff", label: "Long off", x: 36, y: 87 },
  { id: "cover", label: "Cover", x: 12, y: 62 },
  { id: "point", label: "Point", x: 18, y: 30 },
  { id: "thirdMan", label: "Third man", x: 48, y: 12 },
] as const;

export type ScoringZoneId = (typeof scoringZones)[number]["id"];
export type ScoringZones = Partial<Record<ScoringZoneId, number>>;
export type BowlingSpell = { id: string; phase?: string; overs: number; wickets: number; runsConceded: number; maidens: number };

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const boundedNumber = (value: unknown, maximum: number) => Number.isFinite(Number(value)) ? Math.min(Math.max(0, Math.floor(Number(value))), maximum) : 0;

export function normalizeScoringZones(value: unknown): ScoringZones {
  const source = asRecord(value);
  return scoringZones.reduce<ScoringZones>((zones, zone) => {
    const runs = boundedNumber(source[zone.id], 500);
    if (runs) zones[zone.id] = runs;
    return zones;
  }, {});
}

export function scoringZoneTotal(zones: ScoringZones | undefined) {
  return scoringZones.reduce((total, zone) => total + (zones?.[zone.id] ?? 0), 0);
}

export function normalizeBowlingSpells(value: unknown, fallback: Omit<BowlingSpell, "id">): BowlingSpell[] {
  const source = Array.isArray(value) ? value.slice(0, 8) : [];
  const spells = source.map(asRecord).map((spell, index) => ({
    id: typeof spell.id === "string" && spell.id.trim() ? spell.id : `spell-${index + 1}`,
    phase: typeof spell.phase === "string" ? spell.phase.slice(0, 40) : undefined,
    overs: Number(ballsToOvers(oversToBalls(typeof spell.overs === "number" || typeof spell.overs === "string" ? spell.overs : 0) ?? 0)),
    wickets: boundedNumber(spell.wickets, 20),
    runsConceded: boundedNumber(spell.runsConceded, 500),
    maidens: boundedNumber(spell.maidens, 50),
  })).filter((spell) => spell.overs || spell.wickets || spell.runsConceded || spell.maidens || spell.phase);
  if (spells.length || source.length) return spells;
  const legacyOvers = Number(ballsToOvers(oversToBalls(fallback.overs) ?? 0));
  const legacy = { id: "spell-1", phase: fallback.phase, overs: legacyOvers, wickets: boundedNumber(fallback.wickets, 20), runsConceded: boundedNumber(fallback.runsConceded, 500), maidens: boundedNumber(fallback.maidens, 50) };
  return legacy.overs || legacy.wickets || legacy.runsConceded || legacy.maidens || legacy.phase ? [legacy] : [];
}

export function spellTotals(spells: BowlingSpell[]) {
  const balls = spells.reduce((total, spell) => total + (oversToBalls(spell.overs) ?? 0), 0);
  return {
    overs: Number(ballsToOvers(balls)),
    wickets: spells.reduce((total, spell) => total + spell.wickets, 0),
    runsConceded: spells.reduce((total, spell) => total + spell.runsConceded, 0),
    maidens: spells.reduce((total, spell) => total + spell.maidens, 0),
  };
}
