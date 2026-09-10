import { describe, expect, it } from "vitest";
import { availabilityChanged, completeMovedEntry, isDayReset, moveCollides, shouldConfirmFinalSkip } from "./weeklyPlan";

describe("CoachIQ weekly-plan recovery", () => {
  it("identifies a move collision but treats a rest day as available", () => {
    expect(moveCollides({ 2: { status: "planned" } }, 2)).toBe(true);
    expect(moveCollides({ 2: { status: "rest" } }, 2)).toBe(false);
  });

  it("warns before skipping the final remaining planned session", () => {
    expect(shouldConfirmFinalSkip({ 0: { status: "planned" }, 1: { status: "completed" } })).toBe(true);
    expect(shouldConfirmFinalSkip({ 0: { status: "planned" }, 1: { status: "moved" } })).toBe(false);
  });

  it("retains a moved-session note on completion and identifies reset-after-edits", () => {
    expect(completeMovedEntry({ status: "moved", movedTo: 3 }, { status: "completed" })).toEqual({ status: "completed", movedTo: 3 });
    expect(isDayReset({ status: "skipped" }, { status: "planned" })).toBe(true);
    expect(availabilityChanged("Weekdays", "Weekends")).toBe(true);
  });
});
