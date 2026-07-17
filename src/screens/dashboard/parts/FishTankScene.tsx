import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArtSlot } from "../../../ui/art/ArtSlot";
import { StatusBadge } from "../../../ui/components";
import { MotionFeedback } from "../../../ui/motion/MotionFeedback";
import { useReducedMotion } from "../../../ui/motion/useReducedMotion";
import { useTheme } from "../../../ui/theme/useTheme";
import type { ArtSlotId } from "../../../ui/art/types";
import type { FishTankSummary, FishTankFish } from "../../../api/fishTank";
import {
  companionshipLine,
  deriveDisplayedFishSlots,
  deriveMoodPresentation
} from "./fishTankHelpers";

type FishTankSceneProps = {
  summary: FishTankSummary | null;
  onCompanionship?: () => void;
  companionshipCopy?: string | null;
  reducedMotionOverride?: boolean;
};

const POSITION_SLOT_IDS: ArtSlotId[] = [
  "fish-tank-position-1",
  "fish-tank-position-2",
  "fish-tank-position-3"
];

export function FishTankScene({
  summary,
  onCompanionship,
  companionshipCopy,
  reducedMotionOverride = false
}: FishTankSceneProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion() || reducedMotionOverride;
  const mood = deriveMoodPresentation(summary?.mood);
  const displayedFish = deriveDisplayedFishSlots(summary);
  const [tapTrigger, setTapTrigger] = useState<string | null>(null);
  const [companionshipLineCopy, setCompanionshipLineCopy] = useState(() => companionshipLine());

  const handleFishTap = useCallback(
    (fish: FishTankFish) => {
      setTapTrigger(`${fish.id}_${Date.now()}`);
      setCompanionshipLineCopy(companionshipLine());
      onCompanionship?.();
    },
    [onCompanionship]
  );

  const equippedDecor = summary?.decorations?.equipped ?? [];
  const background = equippedDecor.find((d) => d.slot === "background");
  const plant = equippedDecor.find((d) => d.slot === "plant");
  const prop = equippedDecor.find((d) => d.slot === "prop");
  const ambient = equippedDecor.find((d) => d.slot === "ambient");

  const sceneBackground = background?.artKey as ArtSlotId | undefined;
  const scenePlant = plant?.artKey as ArtSlotId | undefined;
  const sceneProp = prop?.artKey as ArtSlotId | undefined;
  const sceneAmbient = ambient?.artKey as ArtSlotId | undefined;

  if (!summary || !summary.initialized || displayedFish.length === 0) {
    return (
      <View
        style={[
          styles.scene,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border
          }
        ]}
      >
        <View style={styles.emptyScene}>
          <ArtSlot slotId="fish-tank-empty" size={80} />
          <Text style={[styles.emptyCopy, { color: theme.colors.textMuted }]}>
            {mood.copy}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.scene,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border
        }
      ]}
    >
      <View style={StyleSheet.absoluteFill}>
        {sceneBackground ? (
          <ArtSlot slotId={sceneBackground} size={320} style={styles.backgroundLayer} />
        ) : null}
        {scenePlant ? (
          <View style={styles.plantLayer}>
            <ArtSlot slotId={scenePlant} size={64} />
          </View>
        ) : null}
        {sceneProp ? (
          <View style={styles.propLayer}>
            <ArtSlot slotId={sceneProp} size={56} />
          </View>
        ) : null}
        {sceneAmbient ? (
          <View style={styles.ambientLayer}>
            <ArtSlot slotId={sceneAmbient} size={72} />
          </View>
        ) : null}
      </View>

      <View style={styles.moodBadge}>
        <StatusBadge tone="active" label={mood.title} />
      </View>

      <View style={styles.fishLayer}>
        {displayedFish.map((fish, index) => {
          const slotId = (fish.artKey as ArtSlotId) ?? POSITION_SLOT_IDS[index] ?? "fish-tank-fish";
          const positionStyle = FISH_POSITION_STYLES[index] ?? FISH_POSITION_STYLES[0];
          return (
            <Pressable
              key={fish.id}
              accessibilityRole="button"
              accessibilityLabel={`${fish.name}，点击一起发呆`}
              onPress={() => handleFishTap(fish)}
              style={[styles.fishPressable, positionStyle]}
            >
              <MotionFeedback
                variant="fish-tap"
                trigger={tapTrigger === `${fish.id}_${tapTrigger?.split("_")[1]}` ? tapTrigger : null}
                animateOnMount={false}
                disabled={reducedMotion}
              >
                <ArtSlot slotId={slotId} size={FISH_SIZES[index] ?? 64} />
              </MotionFeedback>
              <Text style={[styles.fishName, { color: theme.colors.textMuted }]}>
                {fish.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {companionshipCopy || companionshipLineCopy ? (
        <View style={styles.companionshipBox}>
          <Text style={[styles.companionshipCopy, { color: theme.colors.textMuted }]}>
            {companionshipCopy ?? companionshipLineCopy}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const FISH_SIZES = [88, 72, 64];

const FISH_POSITION_STYLES = [
  { alignSelf: "center" as const, marginTop: 12 },
  { alignSelf: "flex-start" as const, marginLeft: 12, marginTop: 8 },
  { alignSelf: "flex-end" as const, marginRight: 12, marginTop: -8 }
];

const styles = StyleSheet.create({
  scene: {
    aspectRatio: 1.8,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "space-between",
    marginTop: 12,
    overflow: "hidden"
  },
  emptyScene: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  emptyCopy: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    textAlign: "center"
  },
  backgroundLayer: {
    height: "100%",
    opacity: 0.26,
    position: "absolute",
    width: "100%"
  },
  plantLayer: {
    bottom: 8,
    left: 8,
    opacity: 0.72,
    position: "absolute"
  },
  propLayer: {
    bottom: 10,
    opacity: 0.72,
    position: "absolute",
    right: 10
  },
  ambientLayer: {
    opacity: 0.48,
    position: "absolute",
    right: 12,
    top: 32
  },
  moodBadge: {
    alignSelf: "flex-start",
    left: 10,
    position: "absolute",
    top: 10,
    zIndex: 2
  },
  fishLayer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 24,
    zIndex: 1
  },
  fishPressable: {
    alignItems: "center"
  },
  fishName: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center"
  },
  companionshipBox: {
    alignItems: "center",
    backgroundColor: "rgba(255, 253, 248, 0.86)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 2
  },
  companionshipCopy: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center"
  }
});
