import type { ImageSourcePropType, ViewStyle } from "react-native";

export type ArtAssetKind =
  | "character"
  | "activity"
  | "bean"
  | "badge"
  | "empty-state"
  | "scene-prop";

export type ArtSlotId =
  | "home-check-in-character"
  | "activities-card-illustration"
  | "activity-step-feedback"
  | "bean-draw-result"
  | "bean-gallery-item"
  | "bean-showcase-slot"
  | "achievement-badge"
  | "empty-state-activities"
  | "empty-state-beans"
  | "empty-state-profile"
  | "empty-state-generic";

export type ArtAsset = {
  id: string;
  slotId: ArtSlotId;
  kind: ArtAssetKind;
  themeId?: string;
  source?: ImageSourcePropType;
  fallbackGlyph: string;
  alt: string;
  aspectRatio: number;
  dominantColor?: string;
};

export type ArtSlotDefinition = {
  id: ArtSlotId;
  kind: ArtAssetKind;
  defaultSize: number;
  fallbackGlyph: string;
  alt: string;
  aspectRatio: number;
};

export type ArtSlotProps = {
  slotId: ArtSlotId;
  size?: number;
  style?: ViewStyle;
  placeholderStyle?: "pseudo-pixel" | "minimal";
};
