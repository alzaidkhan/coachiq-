import type { SyntheticEvent } from "react";
import { portableAssets } from "./portableAssets";
import { avatarPresets } from "./avatarPresets";

import heroImg from "../../../src/assets/images/regenerated_image_1789206212792.jpg";
import battingDrillImg from "../../../src/assets/images/regenerated_image_1789137357882.png";
import bowlingDrillImg from "../../../src/assets/images/regenerated_image_1789137368036.jpg";
import recoveryDrillImg from "../../../src/assets/images/regenerated_image_1789137376807.png";

export type AssetKind =
  | "brand"
  | "hero"
  | "drill"
  | "nutrition"
  | "batting"
  | "bowling"
  | "recovery"
  | "matchInsight"
  | "todayFocus"
  | "avatar";

export const ASSET_IMAGES = {
  hero: heroImg,
  matchInsight: heroImg,
  batting: battingDrillImg,
  bowling: bowlingDrillImg,
  recovery: recoveryDrillImg,
  nutrition: portableAssets.nutrition,
  todayFocus: heroImg,
} as const;

const fallbackAssets: Record<AssetKind, string> = {
  brand: portableAssets.mark,
  hero: heroImg,
  drill: battingDrillImg,
  batting: battingDrillImg,
  bowling: bowlingDrillImg,
  recovery: recoveryDrillImg,
  nutrition: portableAssets.nutrition,
  matchInsight: heroImg,
  todayFocus: heroImg,
  avatar: avatarPresets[0].url,
};

export function assetKindFromSource(source = ""): AssetKind {
  const lower = source.toLowerCase();
  if (lower.includes("avatar") || lower.includes("profile") || lower.includes("player")) return "avatar";
  if (lower.includes("mark") || lower.includes("logo") || lower.includes("icon")) return "brand";
  if (lower.includes("match-insight") || lower.includes("insight")) return "matchInsight";
  if (lower.includes("cinematic") || lower.includes("focus")) return "todayFocus";
  if (lower.includes("nutrition") || lower.includes("fuel") || lower.includes("meal")) return "nutrition";
  if (lower.includes("bowl")) return "bowling";
  if (lower.includes("bat")) return "batting";
  if (lower.includes("recover") || lower.includes("mobility")) return "recovery";
  if (lower.includes("drill")) return "drill";
  return "hero";
}

export function handleAssetImageError(event: SyntheticEvent<HTMLImageElement>, explicitKind?: AssetKind) {
  const image = event.currentTarget;
  if (image.dataset.assetFallbackApplied === "true") return;
  const source = image.currentSrc || image.src;
  const kind = explicitKind ?? assetKindFromSource(source);
  image.dataset.assetFallbackApplied = "true";
  image.src = fallbackAssets[kind] || portableAssets.hero;
  image.classList.add("asset-fallback");
}

