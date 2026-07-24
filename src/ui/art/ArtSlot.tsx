import { Image, Text, View } from "react-native";
import { PixelArtPlaceholder } from "../components";
import { useTheme } from "../theme/useTheme";
import { resolveArtAsset } from "./registry";
import type { ArtAssetKind, ArtSlotId, ArtSlotProps } from "./types";

const PLACEHOLDER_KINDS: Record<
  ArtAssetKind,
  "bean" | "badge" | "activity" | "character" | "fish"
> = {
  bean: "bean",
  badge: "badge",
  activity: "activity",
  character: "character",
  "empty-state": "character",
  "scene-prop": "badge",
  fish: "fish"
};

export function ArtSlot({ slotId, size, style, placeholderStyle, fallback }: ArtSlotProps) {
  const theme = useTheme();
  const asset = resolveArtAsset(theme.id, slotId as ArtSlotId);
  const resolvedSize = size ?? (asset.aspectRatio >= 1 ? 64 : 80);
  const placeholderKind = PLACEHOLDER_KINDS[asset.kind];

  if (asset.component) {
    const Component = asset.component;
    return (
      <View accessibilityLabel={asset.alt} style={style}>
        <Component size={resolvedSize} />
      </View>
    );
  }

  if (asset.source) {
    return (
      <View
        accessibilityLabel={asset.alt}
        style={[
          {
            width: resolvedSize,
            aspectRatio: asset.aspectRatio,
            backgroundColor: theme.colors.surfaceMuted,
            borderRadius: theme.radius.md,
            overflow: "hidden"
          },
          style
        ]}
      >
        <Image
          accessibilityLabel={asset.alt}
          resizeMode="contain"
          source={asset.source}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    );
  }

  if (fallback) {
    return (
      <View
        accessibilityLabel={asset.alt}
        style={[
          {
            alignItems: "center",
            justifyContent: "center",
            width: resolvedSize,
            height: resolvedSize
          },
          style
        ]}
      >
        <Text style={{ fontSize: resolvedSize * 0.55 }}>{fallback}</Text>
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={asset.alt}
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          width: resolvedSize
        },
        style
      ]}
    >
      <PixelArtPlaceholder
        kind={placeholderKind}
        size={resolvedSize}
        style={placeholderStyle === "minimal" ? { opacity: 0.8 } : undefined}
      />
    </View>
  );
}
