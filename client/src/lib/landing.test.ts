import { describe, expect, it } from "vitest";
import { COACHIQ_APP_ROUTE, isCoachIQAppRoute, landingSections } from "./landing";

describe("premium landing page routing", () => {
  it("keeps every primary conversion action aimed at the login-free CoachIQ app", () => {
    expect(COACHIQ_APP_ROUTE).toBe("/app");
    expect(isCoachIQAppRoute("/app")).toBe(true);
    expect(isCoachIQAppRoute("/")).toBe(false);
  });

  it("retains the intended premium landing-page navigation sections", () => {
    expect(landingSections.map((item) => item.label)).toEqual(["About", "My Week", "Drills", "Dashboard"]);
    expect(landingSections.every((item) => item.path.startsWith("/app"))).toBe(true);
  });
});
