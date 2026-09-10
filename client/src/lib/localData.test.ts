import { describe, expect, it } from "vitest";
import { clearCoachIQData, parseImportedCoachIQData, readCoachIQData, writeCoachIQData } from "./localData";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } as Storage;
}

describe("CoachIQ local data", () => {
  it("migrates legacy local keys into a versioned envelope", () => {
    const storage = memoryStorage({ "coachiq-profile": JSON.stringify({ goal: "Build match stamina" }), "coachiq-activity": JSON.stringify({ sessions: [] }), "coachiq-schedule": JSON.stringify({ 0: { status: "planned" } }) });
    const restored = readCoachIQData(storage);
    expect(restored.migrated).toBe(true);
    expect(restored.data.version).toBe(1);
    expect(restored.data.profile.goal).toBe("Build match stamina");
  });

  it("writes, parses, and clears a valid export safely", () => {
    const storage = memoryStorage();
    const result = writeCoachIQData(storage, { profile: { goal: "Build strength" }, activity: { sessions: [] }, schedule: {} });
    expect(result.stored).toBe(true);
    expect(parseImportedCoachIQData(JSON.stringify(result.envelope))?.profile.goal).toBe("Build strength");
    expect(parseImportedCoachIQData("not json")).toBeNull();
    clearCoachIQData(storage);
    expect(storage.getItem("coachiq-data")).toBeNull();
  });

  it("keeps the player flow safe when browser storage is unavailable or rejects writes", () => {
    const blockedStorage = { getItem: () => { throw new Error("Blocked"); }, setItem: () => { throw new Error("Blocked"); }, removeItem: () => { throw new Error("Blocked"); } } as unknown as Storage;
    const restored = readCoachIQData(blockedStorage);
    expect(restored.data.profile).toEqual({});
    expect(writeCoachIQData(blockedStorage, { profile: {}, activity: {}, schedule: {} }).stored).toBe(false);
    expect(clearCoachIQData(blockedStorage)).toBe(false);
  });
});
