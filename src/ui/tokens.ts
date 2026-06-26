const pixelRestColors = {
  background: "#f4efe4",
  backgroundCool: "#e9eef0",
  surface: "#fffdf8",
  surfaceWarm: "#fff6df",
  surfaceMuted: "#f7f2e8",
  surfaceSignal: "#eef7f3",
  ink: "#232323",
  inkBlue: "#18232b",
  inkMuted: "#5f574d",
  inkSoft: "#746b60",
  border: "#d8d0c4",
  borderStrong: "#232323",
  primary: "#17a36b",
  primaryDeep: "#116548",
  primarySoft: "#e2f5ec",
  warning: "#b9821f",
  warningSoft: "#fff4c9",
  danger: "#9d4f3f",
  coral: "#d96b53",
  blue: "#2f6f8f",
  cyan: "#4ca6a8",
  purple: "#6655d8",
  lilac: "#b9a7ef",
  acid: "#b7f05a",
  white: "#ffffff"
} as const;

const pixelRestActivityToneColors = {
  absurd: "#8b4d36",
  calm: "#1f8f62",
  game: "#6655d8",
  physical: "#b9821f",
  daydream: "#2d7d90"
} as const;

const compactSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28
} as const;

const softPixelRadius = {
  sm: 6,
  md: 8,
  lg: 8
} as const;

const sturdyTypography = {
  kicker: {
    fontSize: 12,
    fontWeight: "900" as const
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  title: {
    fontSize: 21,
    fontWeight: "900" as const
  },
  display: {
    fontSize: 30,
    fontWeight: "900" as const
  },
  hero: {
    fontSize: 34,
    fontWeight: "900" as const,
    lineHeight: 40
  }
} as const;

const pixelRestBrandVoice = {
  name: "摸鱼证",
  concept: "反内卷休息许可证",
  mantra: "开心一下，休息一下，再决定要不要拯救世界。",
  motifs: ["低电量", "休息许可", "像素豆仓", "摸鱼任务", "精神离线"]
} as const;

const softShadows = {
  none: {},
  raised: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  }
} as const;

export type UiTheme = {
  id: "pixel-rest";
  name: string;
  brandVoice: typeof pixelRestBrandVoice;
  colors: typeof pixelRestColors;
  activityToneColors: typeof pixelRestActivityToneColors;
  spacing: typeof compactSpacing;
  radius: typeof softPixelRadius;
  typography: typeof sturdyTypography;
  shadows: typeof softShadows;
  borderStyle: {
    hairlineWidth: number;
    strongWidth: number;
    pixelCornerSize: number;
  };
  iconStyle: "pseudo-pixel";
  illustrationStyle: "transparent-png-pixel" | "pseudo-pixel";
  componentMood: "playful-rest-game";
  targetViewport: {
    minWidth: number;
    comfortableWidth: number;
    maxContentWidth: number;
  };
};

export const uiThemes = {
  pixelRest: {
    id: "pixel-rest",
    name: "伪像素休息风",
    brandVoice: pixelRestBrandVoice,
    colors: pixelRestColors,
    activityToneColors: pixelRestActivityToneColors,
    spacing: compactSpacing,
    radius: softPixelRadius,
    typography: sturdyTypography,
    shadows: softShadows,
    borderStyle: {
      hairlineWidth: 1,
      strongWidth: 2,
      pixelCornerSize: 6
    },
    iconStyle: "pseudo-pixel",
    illustrationStyle: "pseudo-pixel",
    componentMood: "playful-rest-game",
    targetViewport: {
      minWidth: 360,
      comfortableWidth: 390,
      maxContentWidth: 480
    }
  }
} as const satisfies Record<string, UiTheme>;

export const activeTheme = uiThemes.pixelRest;

export const colors = activeTheme.colors;
export const activityToneColors = activeTheme.activityToneColors;
export const spacing = activeTheme.spacing;
export const radius = activeTheme.radius;
export const typography = activeTheme.typography;
export const brandVoice = activeTheme.brandVoice;
export const shadows = activeTheme.shadows;
export const borderStyle = activeTheme.borderStyle;
export const targetViewport = activeTheme.targetViewport;

export type ActivityTone = keyof typeof activityToneColors;

export function activityAccentForTone(tone: string | null | undefined): string {
  return activityToneColors[tone as ActivityTone] ?? colors.blue;
}
