import { ballsToOvers, oversToBalls } from "./cricketStats";
import { normalizeBowlingSpells, type BowlingSpell } from "./matchModel";

export type MatchAnalyticsRow = {
  dismissalType?: string;
  bowlingPhase?: string;
  bowlingSpells?: BowlingSpell[];
  overs: number;
  wickets: number;
  runsConceded: number;
};

const phaseOrder = ["Powerplay", "Middle overs", "Death"];

export function dismissalTrend(matches: MatchAnalyticsRow[]) {
  const totals = new Map<string, number>();
  for (const match of matches) {
    const dismissal = match.dismissalType?.trim();
    if (!dismissal || dismissal === "Not out") continue;
    totals.set(dismissal, (totals.get(dismissal) ?? 0) + 1);
  }
  return Array.from(totals, ([name, dismissals]) => ({ name, dismissals })).sort((left, right) => right.dismissals - left.dismissals || left.name.localeCompare(right.name));
}

export function bowlingPhasePerformance(matches: MatchAnalyticsRow[]) {
  const totals = new Map<string, { balls: number; wickets: number; runsConceded: number }>();
  for (const match of matches) {
    const spells = normalizeBowlingSpells(match.bowlingSpells, { phase: match.bowlingPhase, overs: match.overs, wickets: match.wickets, runsConceded: match.runsConceded, maidens: 0 });
    for (const spell of spells) {
      const phase = spell.phase?.trim();
      const balls = oversToBalls(spell.overs);
      if (!phase || !balls) continue;
      const existing = totals.get(phase) ?? { balls: 0, wickets: 0, runsConceded: 0 };
      existing.balls += balls;
      existing.wickets += Math.max(0, Number(spell.wickets) || 0);
      existing.runsConceded += Math.max(0, Number(spell.runsConceded) || 0);
      totals.set(phase, existing);
    }
  }
  return Array.from(totals, ([name, value]) => ({
    name,
    wickets: value.wickets,
    economy: Number((value.runsConceded / (value.balls / 6)).toFixed(1)),
    overs: ballsToOvers(value.balls),
  })).sort((left, right) => {
    const leftOrder = phaseOrder.indexOf(left.name);
    const rightOrder = phaseOrder.indexOf(right.name);
    return (leftOrder === -1 ? phaseOrder.length : leftOrder) - (rightOrder === -1 ? phaseOrder.length : rightOrder) || left.name.localeCompare(right.name);
  });
}
