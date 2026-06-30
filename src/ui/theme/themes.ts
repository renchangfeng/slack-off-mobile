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
    text: colors.ink,
    textMuted: colors.inkMuted,
    primary: colors.primary,
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
  art: {
    iconStyle: "pseudo-pixel",
    placeholderStyle: "pseudo-pixel"
  }
};

export const defaultThemeId = pixelRestTheme.id;

export const themeRegistry: Record<string, MobileTheme> = {
  [pixelRestTheme.id]: pixelRestTheme
};

export function resolveTheme(themeId: string | null | undefined): MobileTheme {
  if (!themeId) return pixelRestTheme;
  return themeRegistry[themeId] ?? pixelRestTheme;
}

export function listThemes(): MobileTheme[] {
  return Object.values(themeRegistry);
}
