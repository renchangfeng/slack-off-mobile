import {
  pixelRestTheme,
  calmOfficeTheme,
  defaultThemeId
} from "../theme/themes";
import type {
  ArtAsset,
  ArtAssetKind,
  ArtSlotDefinition,
  ArtSlotId
} from "./types";

const artSlotDefinitions: Record<ArtSlotId, ArtSlotDefinition> = {
  "home-check-in-character": {
    id: "home-check-in-character",
    kind: "character",
    defaultSize: 64,
    fallbackGlyph: "🐟",
    alt: "首页打卡状态角色",
    aspectRatio: 1
  },
  "activities-card-illustration": {
    id: "activities-card-illustration",
    kind: "activity",
    defaultSize: 80,
    fallbackGlyph: "🎯",
    alt: "活动卡片插画",
    aspectRatio: 1.25
  },
  "activity-step-feedback": {
    id: "activity-step-feedback",
    kind: "scene-prop",
    defaultSize: 40,
    fallbackGlyph: "✓",
    alt: "活动步骤完成反馈",
    aspectRatio: 1
  },
  "bean-draw-result": {
    id: "bean-draw-result",
    kind: "bean",
    defaultSize: 80,
    fallbackGlyph: "🫘",
    alt: "抽豆结果",
    aspectRatio: 1
  },
  "bean-gallery-item": {
    id: "bean-gallery-item",
    kind: "bean",
    defaultSize: 56,
    fallbackGlyph: "🫘",
    alt: "豆子图鉴项",
    aspectRatio: 1
  },
  "bean-showcase-slot": {
    id: "bean-showcase-slot",
    kind: "bean",
    defaultSize: 48,
    fallbackGlyph: "🫘",
    alt: "展示柜槽位",
    aspectRatio: 1
  },
  "achievement-badge": {
    id: "achievement-badge",
    kind: "badge",
    defaultSize: 64,
    fallbackGlyph: "🏅",
    alt: "成就徽章",
    aspectRatio: 1
  },
  "empty-state-activities": {
    id: "empty-state-activities",
    kind: "empty-state",
    defaultSize: 80,
    fallbackGlyph: "🪣",
    alt: "活动空状态",
    aspectRatio: 1
  },
  "empty-state-beans": {
    id: "empty-state-beans",
    kind: "empty-state",
    defaultSize: 80,
    fallbackGlyph: "🫘",
    alt: "豆子空状态",
    aspectRatio: 1
  },
  "empty-state-profile": {
    id: "empty-state-profile",
    kind: "empty-state",
    defaultSize: 80,
    fallbackGlyph: "✨",
    alt: "个人页空状态",
    aspectRatio: 1
  },
  "empty-state-generic": {
    id: "empty-state-generic",
    kind: "empty-state",
    defaultSize: 80,
    fallbackGlyph: "🌫️",
    alt: "通用空状态",
    aspectRatio: 1
  }
};

const artAssets: ArtAsset[] = [
  {
    id: "pixel-rest.home-check-in-character",
    slotId: "home-check-in-character",
    kind: "character",
    themeId: pixelRestTheme.id,
    fallbackGlyph: "🐟",
    alt: "像素休息风打卡角色",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.primary
  },
  {
    id: "calm-office.home-check-in-character",
    slotId: "home-check-in-character",
    kind: "character",
    themeId: calmOfficeTheme.id,
    fallbackGlyph: "🌿",
    alt: "安静办公室风打卡角色",
    aspectRatio: 1,
    dominantColor: calmOfficeTheme.colors.primary
  },
  {
    id: "pixel-rest.activities-card-illustration",
    slotId: "activities-card-illustration",
    kind: "activity",
    themeId: pixelRestTheme.id,
    fallbackGlyph: "🎯",
    alt: "像素休息风活动插画",
    aspectRatio: 1.25,
    dominantColor: pixelRestTheme.colors.warning
  },
  {
    id: "pixel-rest.bean-draw-result",
    slotId: "bean-draw-result",
    kind: "bean",
    themeId: pixelRestTheme.id,
    fallbackGlyph: "🫘",
    alt: "像素休息风抽豆结果",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.primary
  },
  {
    id: "calm-office.bean-gallery-item",
    slotId: "bean-gallery-item",
    kind: "bean",
    themeId: calmOfficeTheme.id,
    fallbackGlyph: "🫘",
    alt: "安静办公室风豆子图鉴",
    aspectRatio: 1,
    dominantColor: calmOfficeTheme.colors.accent
  },
  {
    id: "default.achievement-badge",
    slotId: "achievement-badge",
    kind: "badge",
    fallbackGlyph: "🏅",
    alt: "成就徽章",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.accent
  },
  {
    id: "default.empty-state-activities",
    slotId: "empty-state-activities",
    kind: "empty-state",
    fallbackGlyph: "🪣",
    alt: "活动空状态",
    aspectRatio: 1
  },
  {
    id: "default.empty-state-beans",
    slotId: "empty-state-beans",
    kind: "empty-state",
    fallbackGlyph: "🫘",
    alt: "豆子空状态",
    aspectRatio: 1
  },
  {
    id: "default.empty-state-profile",
    slotId: "empty-state-profile",
    kind: "empty-state",
    fallbackGlyph: "✨",
    alt: "个人页空状态",
    aspectRatio: 1
  },
  {
    id: "default.activity-step-feedback",
    slotId: "activity-step-feedback",
    kind: "scene-prop",
    fallbackGlyph: "✓",
    alt: "活动步骤完成反馈",
    aspectRatio: 1
  },
  {
    id: "default.bean-gallery-item",
    slotId: "bean-gallery-item",
    kind: "bean",
    fallbackGlyph: "🫘",
    alt: "豆子图鉴项",
    aspectRatio: 1
  },
  {
    id: "default.bean-showcase-slot",
    slotId: "bean-showcase-slot",
    kind: "bean",
    fallbackGlyph: "🫘",
    alt: "展示柜槽位",
    aspectRatio: 1
  }
];

export function getArtSlotDefinition(slotId: ArtSlotId): ArtSlotDefinition {
  return artSlotDefinitions[slotId];
}

export function listArtSlotIds(): ArtSlotId[] {
  return Object.keys(artSlotDefinitions) as ArtSlotId[];
}

export function listArtSlotDefinitions(): ArtSlotDefinition[] {
  return Object.values(artSlotDefinitions);
}

function makeFallbackAsset(slotId: ArtSlotId): ArtAsset {
  const def = artSlotDefinitions[slotId] ?? artSlotDefinitions["empty-state-generic"];
  return {
    id: `fallback.${slotId}`,
    slotId: def.id,
    kind: def.kind,
    fallbackGlyph: def.fallbackGlyph,
    alt: def.alt,
    aspectRatio: def.aspectRatio
  };
}

export function resolveArtAsset(
  themeId: string | undefined,
  slotId: ArtSlotId
): ArtAsset {
  const def = artSlotDefinitions[slotId];
  if (!def) {
    return makeFallbackAsset(slotId);
  }

  if (themeId) {
    const themeAsset = artAssets.find(
      (asset) => asset.slotId === slotId && asset.themeId === themeId
    );
    if (themeAsset) return themeAsset;
  }

  const defaultAsset = artAssets.find(
    (asset) => asset.slotId === slotId && !asset.themeId
  );
  if (defaultAsset) return defaultAsset;

  const anyAsset = artAssets.find((asset) => asset.slotId === slotId);
  if (anyAsset) return anyAsset;

  return makeFallbackAsset(slotId);
}

export function resolveArtAssetSource(
  themeId: string | undefined,
  slotId: ArtSlotId
): { source?: ArtAsset["source"]; kind: ArtAssetKind; alt: string } {
  const asset = resolveArtAsset(themeId, slotId);
  return {
    source: asset.source,
    kind: asset.kind,
    alt: asset.alt
  };
}

export function listArtAssetsForTheme(themeId: string): ArtAsset[] {
  return listArtSlotIds().map((slotId) => resolveArtAsset(themeId, slotId));
}

export { artAssets, artSlotDefinitions, defaultThemeId };
