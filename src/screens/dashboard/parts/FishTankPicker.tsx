import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ArtSlot } from "../../../ui/art/ArtSlot";
import { SectionHeader, StatusBadge } from "../../../ui/components";
import { MotionFeedback } from "../../../ui/motion/MotionFeedback";
import { useTheme } from "../../../ui/theme/useTheme";
import type { ArtSlotId } from "../../../ui/art/types";
import type { FishTankFish, FishTankSummary } from "../../../api/fishTank";
import { ActionButton } from "./SharedControls";
import {
  deriveEligibleFishForPicker,
  derivePickerCapacityLabel
} from "./fishTankHelpers";
import { rarityLabel } from "../helpers";
import styles from "../styles";

type FishTankPickerProps = {
  summary: FishTankSummary | null;
  draft: FishTankFish[] | null;
  loading: boolean;
  onChangeDraft: (draft: FishTankFish[] | null) => void;
  onSave: (displayedFishIds: string[]) => void | Promise<void>;
  onClose: () => void;
};

export function FishTankPicker({
  summary,
  draft,
  loading,
  onChangeDraft,
  onSave,
  onClose
}: FishTankPickerProps) {
  const theme = useTheme();
  const eligibleFish = deriveEligibleFishForPicker(summary);
  const authoritativeDisplayed = summary?.displayedFish ?? [];
  const selectedIds = useMemo(
    () => (draft ?? authoritativeDisplayed).map((fish) => fish.id),
    [draft, authoritativeDisplayed]
  );
  const [justSaved, setJustSaved] = useState(false);

  const toggleSelection = useCallback(
    (fish: FishTankFish) => {
      setJustSaved(false);
      const current = draft ?? authoritativeDisplayed;
      const exists = current.find((f) => f.id === fish.id);
      if (exists) {
        onChangeDraft(current.filter((f) => f.id !== fish.id));
      } else if (current.length < 3) {
        onChangeDraft([...current, fish]);
      }
    },
    [draft, authoritativeDisplayed, onChangeDraft]
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      setJustSaved(false);
      const current = draft ?? authoritativeDisplayed;
      const next = [...current];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onChangeDraft(next);
    },
    [draft, authoritativeDisplayed, onChangeDraft]
  );

  const moveDown = useCallback(
    (index: number) => {
      const current = draft ?? authoritativeDisplayed;
      if (index >= current.length - 1) return;
      setJustSaved(false);
      const next = [...current];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      onChangeDraft(next);
    },
    [draft, authoritativeDisplayed, onChangeDraft]
  );

  const hasChanges = useMemo(() => {
    if (!draft) return false;
    const authoritativeIds = authoritativeDisplayed.map((f) => f.id);
    return (
      draft.length !== authoritativeIds.length ||
      draft.some((fish, index) => fish.id !== authoritativeIds[index])
    );
  }, [draft, authoritativeDisplayed]);

  const handleSave = useCallback(async () => {
    const current = draft ?? authoritativeDisplayed;
    await onSave(current.slice(0, 3).map((fish) => fish.id));
    setJustSaved(true);
  }, [draft, authoritativeDisplayed, onSave]);

  const capacityLabel = derivePickerCapacityLabel(selectedIds.length);
  const currentOrder = draft ?? authoritativeDisplayed;

  return (
    <View>
      <SectionHeader
        kicker="展示顺序"
        title={`选择最多 3 条小鱼 · ${capacityLabel}`}
        trailing={
          <Pressable accessibilityRole="button" onPress={onClose}>
            <Text style={[styles.accentMeta, { marginTop: 0 }]}>完成</Text>
          </Pressable>
        }
      />

      <View style={{ gap: 8, marginTop: 10 }}>
        {eligibleFish.map((fish) => {
          const selected = selectedIds.includes(fish.id);
          const selectedIndex = currentOrder.findIndex((f) => f.id === fish.id);
          const slotId = (fish.artKey as ArtSlotId) ?? "fish-tank-fish";
          return (
            <View
              key={fish.id}
              style={[
                styles.decorItemRow,
                selected && {
                  backgroundColor: theme.colors.surfaceWarm,
                  borderColor: theme.colors.primary
                }
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${fish.name}，${selected ? `第 ${selectedIndex + 1} 位` : "未选中"}`}
                disabled={loading}
                onPress={() => toggleSelection(fish)}
                style={{ alignItems: "center", flex: 1, flexDirection: "row" }}
              >
                <ArtSlot slotId={slotId} size={48} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.rowTitle}>{fish.name}</Text>
                  <Text style={styles.rowMeta}>
                    {rarityLabel(fish.rarity)} · {fish.personality}
                  </Text>
                </View>
                {selected ? null : <Text style={styles.helperText}>点击选中</Text>}
              </Pressable>
              {selected ? (
                <View style={{ alignItems: "center", flexDirection: "row", gap: 6 }}>
                  <StatusBadge tone="completed" label={`${selectedIndex + 1}`} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="上移"
                    disabled={selectedIndex <= 0 || loading}
                    onPress={() => moveUp(selectedIndex)}
                    style={({ pressed }) => [
                      styles.inlineEquipButton,
                      { minWidth: 44, paddingHorizontal: 10 },
                      (pressed || selectedIndex <= 0) && styles.buttonMuted
                    ]}
                  >
                    <Text style={styles.inlineEquipText}>↑</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="下移"
                    disabled={selectedIndex >= currentOrder.length - 1 || loading}
                    onPress={() => moveDown(selectedIndex)}
                    style={({ pressed }) => [
                      styles.inlineEquipButton,
                      { minWidth: 44, paddingHorizontal: 10 },
                      (pressed || selectedIndex >= currentOrder.length - 1) && styles.buttonMuted
                    ]}
                  >
                    <Text style={styles.inlineEquipText}>↓</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {hasChanges ? (
        <MotionFeedback variant="reorder-shuffle" trigger={draft?.length} animateOnMount>
          <View style={{ marginTop: 12 }}>
            <ActionButton
              label={loading ? "保存中…" : "保存展示顺序"}
              disabled={loading}
              dark
              onPress={handleSave}
            />
          </View>
        </MotionFeedback>
      ) : null}

      {justSaved && !hasChanges ? (
        <Text style={[styles.helperText, { color: theme.colors.success, marginTop: 10 }]}>
          展示顺序已保存
        </Text>
      ) : null}
    </View>
  );
}
