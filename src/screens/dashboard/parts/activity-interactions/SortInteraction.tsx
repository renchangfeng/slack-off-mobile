import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ActionButton } from "../SharedControls";
import { isStepComplete, markSortedItems } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

export function SortInteraction({
  step,
  progress,
  onChange,
  reducedMotion: _reducedMotion
}: ActivityStepInteractionProps) {
  const items = step.items ?? [];
  const submitted = progress.sortedItemIds?.[step.id];
  const [order, setOrder] = useState<string[]>(submitted ?? items.map((item) => item.id));
  const completed = isStepComplete(step, progress);

  function move(id: string, direction: -1 | 1) {
    const index = order.indexOf(id);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setOrder(next);
  }

  function submit() {
    markSortedItems(onChange, step.id, order);
  }

  return (
    <View>
      <View style={{ gap: 6, marginTop: 12 }}>
        {order.map((id) => {
          const item = items.find((i) => i.id === id);
          if (!item) return null;
          return (
            <View
              key={id}
              style={{
                alignItems: "center",
                backgroundColor: "#f4f0e8",
                borderColor: "#d8d0c4",
                borderRadius: 8,
                borderWidth: 1,
                flexDirection: "row",
                justifyContent: "space-between",
                minHeight: 44,
                paddingHorizontal: 10
              }}
            >
              <Text style={{ color: "#232323", fontSize: 14, fontWeight: "900" as const }}>
                {item.label}
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <SortArrow onPress={() => move(id, -1)} label="↑" />
                <SortArrow onPress={() => move(id, 1)} label="↓" />
              </View>
            </View>
          );
        })}
      </View>
      <ActionButton
        label={completed ? "已提交排序" : "提交排序"}
        onPress={submit}
        disabled={completed}
      />
      {submitted && step.correctOrder && step.correctOrder.length > 0 ? (
        <Text style={styles.helperText}>
          {completed ? "顺序匹配" : "顺序不完全正确，可以继续调整"}
        </Text>
      ) : null}
    </View>
  );
}

function SortArrow({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#cfc7bb",
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 32,
        minWidth: 32
      }}
    >
      <Text style={{ color: "#625b52", fontSize: 14, fontWeight: "900" as const }}>{label}</Text>
    </Pressable>
  );
}
