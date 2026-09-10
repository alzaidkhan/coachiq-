import { describe, expect, it } from "vitest";
import { chartThemes, clearChartTheme, readChartTheme, writeChartTheme } from "./chartThemes";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } as Storage;
}

describe("CoachIQ chart themes", () => {
  it("falls back to the Field Notes theme for missing or invalid preferences", () => {
    expect(readChartTheme(memoryStorage())).toBe("field");
    expect(readChartTheme(memoryStorage({ "coachiq-dashboard-theme": "unknown" }))).toBe("field");
  });

  it("persists a selected theme and clears it safely", () => {
    const storage = memoryStorage();
    expect(writeChartTheme(storage, "ocean")).toBe(true);
    expect(readChartTheme(storage)).toBe("ocean");
    expect(chartThemes.ocean.main).toBe("#176b78");
    expect(clearChartTheme(storage)).toBe(true);
    expect(readChartTheme(storage)).toBe("field");
  });

  it("does not throw when preference storage is blocked", () => {
    const blocked = { getItem: () => { throw new Error("Blocked"); }, setItem: () => { throw new Error("Blocked"); }, removeItem: () => { throw new Error("Blocked"); } } as unknown as Storage;
    expect(readChartTheme(blocked)).toBe("field");
    expect(writeChartTheme(blocked, "ember")).toBe(false);
    expect(clearChartTheme(blocked)).toBe(false);
  });
});
