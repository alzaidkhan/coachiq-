export type ScheduleStatus = "planned" | "completed" | "skipped" | "moved" | "rest";
export type ScheduleEntry = { status: ScheduleStatus; movedTo?: number };
export type Schedule = Record<number, ScheduleEntry>;

export function moveCollides(schedule: Schedule, destination: number) {
  const entry = schedule[destination];
  return Boolean(entry && entry.status !== "rest");
}

export function shouldConfirmFinalSkip(schedule: Schedule) {
  const remaining = Object.values(schedule).filter((entry) => entry.status === "planned" || entry.status === "moved").length;
  return remaining <= 1;
}

export function completeMovedEntry(previous: ScheduleEntry | undefined, next: ScheduleEntry): ScheduleEntry {
  return next.status === "completed" && previous?.status === "moved" ? { ...next, movedTo: previous.movedTo } : next;
}

export function isDayReset(previous: ScheduleEntry | undefined, next: ScheduleEntry) {
  return next.status === "planned" && Boolean(previous && previous.status !== "planned");
}

export function availabilityChanged(previous: string | undefined, next: string) {
  return Boolean(previous && previous !== next);
}
