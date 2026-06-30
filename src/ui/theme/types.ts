export type MobileThemeBrand = {
  appName: string;
  shortName?: string;
  tagline?: string;
  manifestoTitle?: string;
  manifestoCopy?: string;
};

export type MobileThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceWarm: string;
  text: string;
  textMuted: string;
  primary: string;
  accent: string;
  border: string;
  danger: string;
  warning: string;
  success: string;
};

export type MobileThemeSpacing = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

export type MobileThemeRadius = {
  sm: number;
  md: number;
  lg: number;
};

export type MobileThemeBorders = {
  cardWidth: number;
  strongWidth: number;
};

export type MobileThemeTypography = {
  displayFamilyHint: "system" | "pixel" | string;
  bodyFamilyHint: "system" | string;
};

export type MobileThemeGameplay = {
  activityAccents: Record<string, string>;
  rarityAccents: Record<string, string>;
};

export type MobileThemeArt = {
  iconStyle: "pseudo-pixel" | "line" | string;
  placeholderStyle: "pseudo-pixel" | string;
};

export type MobileThemeStatusTone = {
  bg: string;
  fg: string;
  border: string;
};

export type MobileTheme = {
  id: string;
  name: string;
  brand: MobileThemeBrand;
  colors: MobileThemeColors;
  spacing: MobileThemeSpacing;
  radius: MobileThemeRadius;
  borders: MobileThemeBorders;
  typography: MobileThemeTypography;
  gameplay: MobileThemeGameplay;
  status: {
    active: MobileThemeStatusTone;
    completed: MobileThemeStatusTone;
    locked: MobileThemeStatusTone;
    warning: MobileThemeStatusTone;
    default: MobileThemeStatusTone;
  };
  art: MobileThemeArt;
};
