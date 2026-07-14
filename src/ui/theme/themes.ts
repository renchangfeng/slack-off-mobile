import {
  activityToneColors,
  brandVoice,
  colors,
  radius,
  spacing
} from "../tokens";
import type { MobileTheme } from "./types";

export const pixelRestTheme: MobileTheme = {
  id: "pixel-rest",
  name: "伪像素休息风",
  brand: {
    appName: brandVoice.name,
    shortName: brandVoice.name,
    tagline: brandVoice.mantra,
    manifestoTitle: brandVoice.concept,
    manifestoCopy: brandVoice.mantra
  },
  colors: {
    background: colors.background,
    surface: colors.surface,
    surfaceMuted: colors.surfaceMuted,
    surfaceWarm: colors.surfaceWarm,
    text: colors.ink,
    textMuted: colors.inkMuted,
    primary: colors.primaryDeep,
    accent: colors.acid,
    border: colors.border,
    danger: colors.danger,
    warning: colors.warning,
    success: colors.primary
  },
  spacing: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl
  },
  radius: {
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg
  },
  borders: {
    cardWidth: 1,
    strongWidth: 2
  },
  typography: {
    displayFamilyHint: "pixel",
    bodyFamilyHint: "system"
  },
  gameplay: {
    activityAccents: { ...activityToneColors },
    rarityAccents: {
      common: colors.inkMuted,
      rare: colors.blue,
      epic: colors.purple,
      legendary: colors.gold
    }
  },
  status: {
    active: { bg: colors.acid, fg: colors.inkBlue, border: colors.ink },
    completed: { bg: colors.primarySoft, fg: colors.primaryDeep, border: colors.primary },
    locked: { bg: colors.surfaceMuted, fg: colors.inkMuted, border: colors.border },
    warning: { bg: colors.warningSoft, fg: colors.warning, border: colors.warning },
    default: { bg: colors.surface, fg: colors.inkMuted, border: colors.border }
  },
  art: {
    iconStyle: "pseudo-pixel",
    placeholderStyle: "pseudo-pixel"
  }
};

export const calmOfficeTheme: MobileTheme = {
  id: "calm-office",
  name: "安静办公室",
  brand: {
    appName: "离线证",
    shortName: "离线证",
    tagline: "在工位角落，合法地 quiet quit 一分钟。",
    manifestoTitle: "办公室精神离线许可证",
    manifestoCopy: "不是摆烂，是让大脑从会议里溜出来透口气。"
  },
  colors: {
    background: "#eef1ef",
    surface: "#f7f9f8",
    surfaceMuted: "#e8edeb",
    surfaceWarm: "#f2f5f3",
    text: "#2d3430",
    textMuted: "#5d6963",
    primary: "#2f7568",
    accent: "#c9a96e",
    border: "#d4dad7",
    danger: "#b86b6b",
    warning: "#c9a96e",
    success: "#3d8f7f"
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 10
  },
  borders: {
    cardWidth: 1,
    strongWidth: 2
  },
  typography: {
    displayFamilyHint: "system",
    bodyFamilyHint: "system"
  },
  gameplay: {
    activityAccents: {
      absurd: "#8b6b4a",
      calm: "#3d8f7f",
      game: "#5c7a99",
      physical: "#a88b4a",
      daydream: "#6a8a8a"
    },
    rarityAccents: {
      common: "#6e7a74",
      rare: "#5c7a99",
      epic: "#7a6a99",
      legendary: "#c9a96e"
    }
  },
  status: {
    active: { bg: "#c9e5df", fg: "#1f5e52", border: "#3d8f7f" },
    completed: { bg: "#d8ebe7", fg: "#1f5e52", border: "#3d8f7f" },
    locked: { bg: "#e8edeb", fg: "#5d6963", border: "#d4dad7" },
    warning: { bg: "#f2ead9", fg: "#7a5f2a", border: "#c9a96e" },
    default: { bg: "#f7f9f8", fg: "#5d6963", border: "#d4dad7" }
  },
  art: {
    iconStyle: "soft-office",
    placeholderStyle: "minimal-surreal"
  }
};

export const defaultThemeId = pixelRestTheme.id;

export const themeRegistry: Record<string, MobileTheme> = {
  [pixelRestTheme.id]: pixelRestTheme,
  [calmOfficeTheme.id]: calmOfficeTheme
};

export function resolveTheme(themeId?: string | null | undefined): MobileTheme {
  if (!themeId) return pixelRestTheme;
  return themeRegistry[themeId] ?? pixelRestTheme;
}

export function listThemes(): MobileTheme[] {
  return Object.values(themeRegistry);
}
