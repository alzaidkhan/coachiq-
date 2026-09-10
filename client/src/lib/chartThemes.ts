export const chartThemes = {
  field: {
    label: "Field Notes",
    description: "Leaf green with a sunline orange accent",
    main: "#365b44",
    accent: "#e66a2c",
    secondary: "#3b6e82",
    muted: "#7f8d82",
    grid: "#e2e9e2",
    hover: "#f2ebe4",
    tooltip: "#fcfaf7",
    zones: ["#e66a2c", "#365b44", "#7c9a83", "#b9a477"],
  },
  ocean: {
    label: "Ocean Court",
    description: "Deep teal with a clear coral accent",
    main: "#176b78",
    accent: "#e07a5f",
    secondary: "#4f8fa5",
    muted: "#718b91",
    grid: "#dce9eb",
    hover: "#edf5f5",
    tooltip: "#f8fcfc",
    zones: ["#e07a5f", "#176b78", "#4f8fa5", "#b7a26c"],
  },
  ember: {
    label: "Ember",
    description: "Warm terracotta with an evergreen counterpoint",
    main: "#9c4632",
    accent: "#d88a3d",
    secondary: "#6f7f4f",
    muted: "#9b8176",
    grid: "#eee0d7",
    hover: "#fbf0e9",
    tooltip: "#fffaf7",
    zones: ["#d88a3d", "#9c4632", "#6f7f4f", "#b86a5a"],
  },
  dusk: {
    label: "Dusk",
    description: "Indigo and lilac for a quieter dashboard",
    main: "#4b4c83",
    accent: "#b06fa9",
    secondary: "#5f8e9d",
    muted: "#85859d",
    grid: "#e4e3ef",
    hover: "#f4f1fa",
    tooltip: "#fcfbff",
    zones: ["#b06fa9", "#4b4c83", "#5f8e9d", "#b6a26a"],
  },
} as const;

export type ChartThemeId = keyof typeof chartThemes;
const chartThemeKey = "coachiq-dashboard-theme";

export function getChartThemeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readChartTheme(storage: Storage | null | undefined): ChartThemeId {
  try {
    const value = storage?.getItem(chartThemeKey);
    return value && value in chartThemes ? value as ChartThemeId : "field";
  } catch {
    return "field";
  }
}

export function writeChartTheme(storage: Storage | null | undefined, theme: ChartThemeId) {
  try {
    storage?.setItem(chartThemeKey, theme);
    return true;
  } catch {
    return false;
  }
}

export function clearChartTheme(storage: Storage | null | undefined) {
  try {
    storage?.removeItem(chartThemeKey);
    return true;
  } catch {
    return false;
  }
}
