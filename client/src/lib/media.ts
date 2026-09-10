import type { SyntheticEvent } from "react";
import { portableAssets } from "./portableAssets";
import { avatarPresets } from "./avatarPresets";

export type AssetKind = "brand" | "hero" | "drill" | "nutrition" | "batting" | "bowling" | "recovery" | "avatar";

const fallbackAssets: Record<AssetKind, string> = {
  brand: portableAssets.mark,
  hero: portableAssets.hero,
  drill: portableAssets.batting,
  batting: portableAssets.batting,
  bowling: portableAssets.bowling,
  recovery: portableAssets.recovery,
  nutrition: portableAssets.nutrition,
  avatar: avatarPresets[0].url,
};

export function assetKindFromSource(source = ""): AssetKind {
  const lower = source.toLowerCase();
  if (lower.includes("avatar") || lower.includes("profile") || lower.includes("player")) return "avatar";
  if (lower.includes("mark") || lower.includes("logo") || lower.includes("icon")) return "brand";
  if (lower.includes("nutrition") || lower.includes("fuel") || lower.includes("meal")) return "nutrition";
  if (lower.includes("bowl")) return "bowling";
  if (lower.includes("bat")) return "batting";
  if (lower.includes("recover")) return "recovery";
  if (lower.includes("drill")) return "drill";
  return "hero";
}

export function handleAssetImageError(event: SyntheticEvent<HTMLImageElement>, explicitKind?: AssetKind) {
  const image = event.currentTarget;
  if (image.dataset.assetFallbackApplied === "true") return;
  const source = image.currentSrc || image.src;
  const kind = explicitKind ?? assetKindFromSource(source);
  image.dataset.assetFallbackApplied = "true";
  image.src = fallbackAssets[kind] || portableAssets.batting;
  image.classList.add("asset-fallback");
  // Graceful fallback applied without throwing or crashing
}
