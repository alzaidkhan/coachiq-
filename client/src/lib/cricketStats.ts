export function oversToBalls(value: string | number) {
  const match = String(value).trim().match(/^(\d+)(?:\.(\d))?$/);
  if (!match) return null;
  const fullOvers = Number(match[1]);
  const extraBalls = Number(match[2] ?? 0);
  if (!Number.isInteger(fullOvers) || extraBalls > 5) return null;
  return fullOvers * 6 + extraBalls;
}

export function ballsToOvers(value: number) {
  const balls = Math.max(0, Math.floor(value));
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

/** Move a scorecard spell by exactly one legal ball while preserving cricket notation. */
export function stepOvers(value: string | number, direction: -1 | 1, maximumOvers = 50) {
  const currentBalls = oversToBalls(value) ?? 0;
  const maximumBalls = Math.max(0, Math.floor(maximumOvers)) * 6;
  return ballsToOvers(Math.min(maximumBalls, Math.max(0, currentBalls + direction)));
}

export function normalizeOvers(value: string | number) {
  const balls = oversToBalls(value);
  return balls === null ? 0 : Number(ballsToOvers(balls));
}

export function economyFor(runs: number, overs: string | number) {
  const balls = oversToBalls(overs);
  return balls ? (runs / (balls / 6)).toFixed(1) : "Not calculated";
}

export function validateScorecard(values: { runs: number; fours: number; sixes: number; overs: string; maidens: number }) {
  const boundaryRuns = values.fours * 4 + values.sixes * 6;
  const balls = values.overs ? oversToBalls(values.overs) : 0;
  if (boundaryRuns > values.runs) return "Boundaries exceed runs.";
  if (values.overs && balls === null) return "Use valid cricket-over notation.";
  if (balls && balls > 300) return "A single spell cannot exceed 50 overs.";
  if (balls && values.maidens > Math.floor(balls / 6)) return "Maidens exceed completed overs.";
  return null;
}
