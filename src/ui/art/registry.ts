import {
  PixelRestAchievementBadge,
  PixelRestActivityIllustration,
  PixelRestActivityStepStar,
  PixelRestBean,
  PixelRestBeanMachine,
  PixelRestBeanShowcase,
  PixelRestEmptyStateActivities,
  PixelRestEmptyStateBeans,
  PixelRestEmptyStateGeneric,
  PixelRestEmptyStateProfile,
  PixelRestFish,
  PixelRestHatchEgg,
  PixelRestHatchReveal,
  PixelRestHomeCharacter,
  PixelRestLockedSilhouette
} from "./assets/pixel-rest";
import {
  calmOfficeTheme,
  pixelRestTheme
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
  "bean-draw-machine": {
    id: "bean-draw-machine",
    kind: "scene-prop",
    defaultSize: 80,
    fallbackGlyph: "🎰",
    alt: "抽豆机",
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
  },
  "tank-bg-default": {
    id: "tank-bg-default",
    kind: "scene-prop",
    defaultSize: 80,
    fallbackGlyph: "🫗",
    alt: "基础水缸背景",
    aspectRatio: 1
  },
  "tank-bg-restroom-blue-tile": {
    id: "tank-bg-restroom-blue-tile",
    kind: "scene-prop",
    defaultSize: 80,
    fallbackGlyph: "🚿",
    alt: "洗手台蓝砖背景",
    aspectRatio: 1
  },
  "tank-bg-office-window": {
    id: "tank-bg-office-window",
    kind: "scene-prop",
    defaultSize: 80,
    fallbackGlyph: "🪟",
    alt: "工位窗景背景",
    aspectRatio: 1
  },
  "tank-bg-daydream-cloud": {
    id: "tank-bg-daydream-cloud",
    kind: "scene-prop",
    defaultSize: 80,
    fallbackGlyph: "☁️",
    alt: "白日梦云层背景",
    aspectRatio: 1
  },
  "tank-plant-default": {
    id: "tank-plant-default",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "🌿",
    alt: "基础水草",
    aspectRatio: 1
  },
  "tank-plant-kelp-forest": {
    id: "tank-plant-kelp-forest",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "🌾",
    alt: "海藻丛",
    aspectRatio: 1
  },
  "tank-plant-lotus-leaf": {
    id: "tank-plant-lotus-leaf",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "🪷",
    alt: "小荷叶",
    aspectRatio: 1
  },
  "tank-prop-empty": {
    id: "tank-prop-empty",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "🪨",
    alt: "空石头",
    aspectRatio: 1
  },
  "tank-prop-coral": {
    id: "tank-prop-coral",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "🪸",
    alt: "小珊瑚",
    aspectRatio: 1
  },
  "tank-prop-sunken-keyboard": {
    id: "tank-prop-sunken-keyboard",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "⌨️",
    alt: "沉底键盘",
    aspectRatio: 1
  },
  "tank-prop-paper-boat": {
    id: "tank-prop-paper-boat",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "⛵",
    alt: "纸船",
    aspectRatio: 1
  },
  "tank-ambient-bubbles": {
    id: "tank-ambient-bubbles",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "🫧",
    alt: "基础泡泡",
    aspectRatio: 1
  },
  "tank-ambient-neon-bubbles": {
    id: "tank-ambient-neon-bubbles",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "💡",
    alt: "霓虹泡泡",
    aspectRatio: 1
  },
  "tank-ambient-starry-water": {
    id: "tank-ambient-starry-water",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "✨",
    alt: "星光水面",
    aspectRatio: 1
  },
  "tank-ambient-coffee-steam": {
    id: "tank-ambient-coffee-steam",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "☕",
    alt: "咖啡蒸汽",
    aspectRatio: 1
  },
  "tank-decor-locked-silhouette": {
    id: "tank-decor-locked-silhouette",
    kind: "scene-prop",
    defaultSize: 40,
    fallbackGlyph: "🔒",
    alt: "未解锁装扮",
    aspectRatio: 1
  },
  "fish-tank-fish": {
    id: "fish-tank-fish",
    kind: "fish",
    defaultSize: 80,
    fallbackGlyph: "🐟",
    alt: "鱼缸里的小鱼",
    aspectRatio: 1
  },
  "fish-tank-empty": {
    id: "fish-tank-empty",
    kind: "empty-state",
    defaultSize: 80,
    fallbackGlyph: "🫗",
    alt: "空鱼缸",
    aspectRatio: 1
  },
  "fish-tank-position-1": {
    id: "fish-tank-position-1",
    kind: "fish",
    defaultSize: 80,
    fallbackGlyph: "🐟",
    alt: "鱼缸主位小鱼",
    aspectRatio: 1
  },
  "fish-tank-position-2": {
    id: "fish-tank-position-2",
    kind: "fish",
    defaultSize: 72,
    fallbackGlyph: "🐠",
    alt: "鱼缸左侧小鱼",
    aspectRatio: 1
  },
  "fish-tank-position-3": {
    id: "fish-tank-position-3",
    kind: "fish",
    defaultSize: 64,
    fallbackGlyph: "🐡",
    alt: "鱼缸右侧小鱼",
    aspectRatio: 1
  },
  "fish-tank-bubble-rise": {
    id: "fish-tank-bubble-rise",
    kind: "scene-prop",
    defaultSize: 56,
    fallbackGlyph: "🫧",
    alt: "鱼缸气泡",
    aspectRatio: 1
  },
  "fish-hatch-egg": {
    id: "fish-hatch-egg",
    kind: "scene-prop",
    defaultSize: 80,
    fallbackGlyph: "🥚",
    alt: "孵化蛋",
    aspectRatio: 1
  },
  "fish-hatch-reveal": {
    id: "fish-hatch-reveal",
    kind: "scene-prop",
    defaultSize: 96,
    fallbackGlyph: "✨",
    alt: "孵化揭晓",
    aspectRatio: 1
  },
  "fish-locked-silhouette": {
    id: "fish-locked-silhouette",
    kind: "fish",
    defaultSize: 56,
    fallbackGlyph: "🔒",
    alt: "未解锁小鱼",
    aspectRatio: 1
  }
};

const artAssets: ArtAsset[] = [
  {
    id: "pixel-rest.home-check-in-character",
    slotId: "home-check-in-character",
    kind: "character",
    themeId: pixelRestTheme.id,
    component: PixelRestHomeCharacter,
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
    component: PixelRestActivityIllustration,
    fallbackGlyph: "🎯",
    alt: "像素休息风活动插画",
    aspectRatio: 1.25,
    dominantColor: pixelRestTheme.colors.warning
  },
  {
    id: "pixel-rest.activity-step-feedback",
    slotId: "activity-step-feedback",
    kind: "scene-prop",
    themeId: pixelRestTheme.id,
    component: PixelRestActivityStepStar,
    fallbackGlyph: "✓",
    alt: "像素休息风步骤完成星标",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.accent
  },
  {
    id: "pixel-rest.bean-draw-result",
    slotId: "bean-draw-result",
    kind: "bean",
    themeId: pixelRestTheme.id,
    component: PixelRestBean,
    fallbackGlyph: "🫘",
    alt: "像素休息风抽豆结果",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.primary
  },
  {
    id: "pixel-rest.bean-draw-machine",
    slotId: "bean-draw-machine",
    kind: "scene-prop",
    themeId: pixelRestTheme.id,
    component: PixelRestBeanMachine,
    fallbackGlyph: "🎰",
    alt: "像素休息风抽豆机",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.text
  },
  {
    id: "pixel-rest.bean-gallery-item",
    slotId: "bean-gallery-item",
    kind: "bean",
    themeId: pixelRestTheme.id,
    component: PixelRestBean,
    fallbackGlyph: "🫘",
    alt: "像素休息风豆子图鉴",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.primary
  },
  {
    id: "pixel-rest.bean-showcase-slot",
    slotId: "bean-showcase-slot",
    kind: "bean",
    themeId: pixelRestTheme.id,
    component: PixelRestBeanShowcase,
    fallbackGlyph: "🫘",
    alt: "像素休息风展示柜豆",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.warning
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
    id: "pixel-rest.achievement-badge",
    slotId: "achievement-badge",
    kind: "badge",
    themeId: pixelRestTheme.id,
    component: PixelRestAchievementBadge,
    fallbackGlyph: "🏅",
    alt: "像素休息风成就徽章",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.warning
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
    id: "pixel-rest.empty-state-activities",
    slotId: "empty-state-activities",
    kind: "empty-state",
    themeId: pixelRestTheme.id,
    component: PixelRestEmptyStateActivities,
    fallbackGlyph: "🪣",
    alt: "像素休息风活动空状态",
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
    id: "pixel-rest.empty-state-beans",
    slotId: "empty-state-beans",
    kind: "empty-state",
    themeId: pixelRestTheme.id,
    component: PixelRestEmptyStateBeans,
    fallbackGlyph: "🫘",
    alt: "像素休息风豆子空状态",
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
    id: "pixel-rest.empty-state-profile",
    slotId: "empty-state-profile",
    kind: "empty-state",
    themeId: pixelRestTheme.id,
    component: PixelRestEmptyStateProfile,
    fallbackGlyph: "✨",
    alt: "像素休息风个人页空状态",
    aspectRatio: 1
  },
  {
    id: "default.empty-state-generic",
    slotId: "empty-state-generic",
    kind: "empty-state",
    fallbackGlyph: "🌫️",
    alt: "通用空状态",
    aspectRatio: 1
  },
  {
    id: "pixel-rest.empty-state-generic",
    slotId: "empty-state-generic",
    kind: "empty-state",
    themeId: pixelRestTheme.id,
    component: PixelRestEmptyStateGeneric,
    fallbackGlyph: "🌫️",
    alt: "像素休息风通用空状态",
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
  },
  {
    id: "default.bean-draw-result",
    slotId: "bean-draw-result",
    kind: "bean",
    fallbackGlyph: "🫘",
    alt: "抽豆结果",
    aspectRatio: 1
  },
  {
    id: "pixel-rest.fish-tank-fish",
    slotId: "fish-tank-fish",
    kind: "fish",
    themeId: pixelRestTheme.id,
    component: PixelRestFish,
    fallbackGlyph: "🐟",
    alt: "像素休息风小鱼",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.primary
  },
  {
    id: "default.fish-tank-empty",
    slotId: "fish-tank-empty",
    kind: "empty-state",
    fallbackGlyph: "🫗",
    alt: "空鱼缸",
    aspectRatio: 1
  },
  {
    id: "pixel-rest.fish-tank-position-1",
    slotId: "fish-tank-position-1",
    kind: "fish",
    themeId: pixelRestTheme.id,
    component: PixelRestFish,
    fallbackGlyph: "🐟",
    alt: "像素休息风鱼缸主位小鱼",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.primary
  },
  {
    id: "pixel-rest.fish-tank-position-2",
    slotId: "fish-tank-position-2",
    kind: "fish",
    themeId: pixelRestTheme.id,
    component: PixelRestFish,
    fallbackGlyph: "🐠",
    alt: "像素休息风鱼缸左侧小鱼",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.primary
  },
  {
    id: "pixel-rest.fish-tank-position-3",
    slotId: "fish-tank-position-3",
    kind: "fish",
    themeId: pixelRestTheme.id,
    component: PixelRestFish,
    fallbackGlyph: "🐡",
    alt: "像素休息风鱼缸右侧小鱼",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.primary
  },
  {
    id: "pixel-rest.fish-tank-bubble-rise",
    slotId: "fish-tank-bubble-rise",
    kind: "scene-prop",
    themeId: pixelRestTheme.id,
    fallbackGlyph: "🫧",
    alt: "像素休息风鱼缸气泡",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.accent
  },
  {
    id: "default.fish-tank-position-1",
    slotId: "fish-tank-position-1",
    kind: "fish",
    fallbackGlyph: "🐟",
    alt: "鱼缸主位小鱼",
    aspectRatio: 1
  },
  {
    id: "default.fish-tank-position-2",
    slotId: "fish-tank-position-2",
    kind: "fish",
    fallbackGlyph: "🐠",
    alt: "鱼缸左侧小鱼",
    aspectRatio: 1
  },
  {
    id: "default.fish-tank-position-3",
    slotId: "fish-tank-position-3",
    kind: "fish",
    fallbackGlyph: "🐡",
    alt: "鱼缸右侧小鱼",
    aspectRatio: 1
  },
  {
    id: "default.fish-tank-bubble-rise",
    slotId: "fish-tank-bubble-rise",
    kind: "scene-prop",
    fallbackGlyph: "🫧",
    alt: "鱼缸气泡",
    aspectRatio: 1
  },
  {
    id: "pixel-rest.fish-tank-empty",
    slotId: "fish-tank-empty",
    kind: "empty-state",
    themeId: pixelRestTheme.id,
    component: PixelRestEmptyStateGeneric,
    fallbackGlyph: "🫗",
    alt: "像素休息风空鱼缸",
    aspectRatio: 1
  },
  {
    id: "pixel-rest.fish-hatch-egg",
    slotId: "fish-hatch-egg",
    kind: "scene-prop",
    themeId: pixelRestTheme.id,
    component: PixelRestHatchEgg,
    fallbackGlyph: "🥚",
    alt: "像素休息风孵化蛋",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.surfaceMuted
  },
  {
    id: "pixel-rest.fish-hatch-reveal",
    slotId: "fish-hatch-reveal",
    kind: "scene-prop",
    themeId: pixelRestTheme.id,
    component: PixelRestHatchReveal,
    fallbackGlyph: "✨",
    alt: "像素休息风孵化揭晓",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.primary
  },
  {
    id: "pixel-rest.fish-locked-silhouette",
    slotId: "fish-locked-silhouette",
    kind: "fish",
    themeId: pixelRestTheme.id,
    component: PixelRestLockedSilhouette,
    fallbackGlyph: "🔒",
    alt: "像素休息风未解锁小鱼",
    aspectRatio: 1,
    dominantColor: pixelRestTheme.colors.text
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

export { artAssets, artSlotDefinitions };
