export function durationToSeconds(duration: string) {
  const minutes = Number.parseInt(duration, 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : 0;
}

export function formatCountdown(totalSeconds: number) {
  const bounded = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(bounded / 60);
  const seconds = bounded % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function sessionProgress(totalSeconds: number, remainingSeconds: number) {
  if (totalSeconds <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)));
}
