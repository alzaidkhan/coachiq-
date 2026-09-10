import { describe, expect, it } from "vitest";
import { parseFeedback } from "./feedback";

describe("parseFeedback", () => {
  it("rejects a note that is too short to act on", () => {
    expect(parseFeedback({ topic: "Issue", message: "short" })).toBeNull();
  });

  it("trims valid feedback and provides safe defaults", () => {
    expect(parseFeedback({ message: "  Please add a printable weekly plan.  " })).toEqual({ topic: "Other", message: "Please add a printable weekly plan.", source: "public" });
  });

  it("bounds user-provided fields before server logging", () => {
    const note = parseFeedback({ topic: "x".repeat(50), message: "A useful note for CoachIQ.", source: "y".repeat(80) });
    expect(note?.topic).toHaveLength(32);
    expect(note?.source).toHaveLength(48);
  });
});
