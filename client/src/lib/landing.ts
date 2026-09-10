export const COACHIQ_APP_ROUTE = "/app";

export const landingSections = [
  { label: "About", path: COACHIQ_APP_ROUTE },
  { label: "My Week", path: `${COACHIQ_APP_ROUTE}?view=plan` },
  { label: "Drills", path: `${COACHIQ_APP_ROUTE}?view=drills` },
  { label: "Dashboard", path: `${COACHIQ_APP_ROUTE}?view=progress` },
] as const;

export function isCoachIQAppRoute(path: string) {
  return path === COACHIQ_APP_ROUTE;
}
