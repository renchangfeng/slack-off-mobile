import { Text, View } from "react-native";
import { ArtSlot } from "../../../ui/art/ArtSlot";
import type { ArtSlotId } from "../../../ui/art/types";
import type { FishTankResourceOutcome, FishTankResourceType } from "../../../api/fishTank";
import styles from "../styles";

const RESOURCE_TYPE_ICONS: Record<FishTankResourceType, string> = {
  food: "🍥",
  bubble: "🫧",
  hatch_progress: "🥚"
};

const RESOURCE_TYPE_ART_KEYS: Record<FishTankResourceType, ArtSlotId> = {
  food: "fish-tank-resource-food",
  bubble: "fish-tank-resource-bubble",
  hatch_progress: "fish-tank-resource-hatch-progress"
};

const MAX_DISPLAY_QUANTITY = 999;

export type FishTankOutcomeReceiptRow = {
  resourceType: FishTankResourceType;
  label: string;
  quantity: number;
  displayQuantity: string;
  copy: string;
  icon: string;
  artKey: ArtSlotId;
  accessibilityLabel: string;
};

export function buildFishTankOutcomeRows(
  outcomes: FishTankResourceOutcome[] | null | undefined
): FishTankOutcomeReceiptRow[] | null {
  if (!outcomes || outcomes.length === 0) {
    return null;
  }
  return outcomes.map((outcome) => {
    const clamped = Math.max(0, Math.min(MAX_DISPLAY_QUANTITY, outcome.quantity));
    const displayQuantity = clamped === 0 ? "0" : `+${clamped}`;
    const icon = RESOURCE_TYPE_ICONS[outcome.resourceType] ?? "🐟";
    const artKey = RESOURCE_TYPE_ART_KEYS[outcome.resourceType] ?? "fish-tank-resource-generic";
    const accessibilityLabel = `${outcome.label} ${displayQuantity}。${outcome.copy}`;
    return {
      resourceType: outcome.resourceType,
      label: outcome.label,
      quantity: outcome.quantity,
      displayQuantity,
      copy: outcome.copy,
      icon,
      artKey,
      accessibilityLabel
    };
  });
}

export function FishTankOutcomeReceipt({
  outcomes,
  testID
}: {
  outcomes: FishTankResourceOutcome[] | null | undefined;
  testID?: string;
}) {
  const rows = buildFishTankOutcomeRows(outcomes);
  if (!rows || rows.length === 0) {
    return null;
  }
  return (
    <View
      style={styles.resultReceiptBox}
      accessibilityRole="summary"
      accessibilityLabel="鱼缸资源奖励"
      testID={testID}
    >
      <Text style={styles.kicker}>鱼缸奖励</Text>
      {rows.map((row) => (
        <View
          key={row.resourceType}
          style={styles.fishTankOutcomeRow}
          accessibilityLabel={row.accessibilityLabel}
          accessibilityRole="text"
        >
          <View style={styles.fishTankOutcomeIcon}>
            <ArtSlot slotId={row.artKey} size={28} fallback={row.icon} />
          </View>
          <Text style={styles.fishTankOutcomeLabel}>{row.label}</Text>
          <Text style={styles.fishTankOutcomeQuantity}>{row.displayQuantity}</Text>
        </View>
      ))}
      {rows.length > 0 ? (
        <Text style={styles.helperText}>{rows.map((row) => row.copy).join(" ")}</Text>
      ) : null}
    </View>
  );
}
