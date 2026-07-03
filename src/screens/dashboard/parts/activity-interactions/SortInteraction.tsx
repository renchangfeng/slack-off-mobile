import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ActionButton } from "../SharedControls";
import { isStepComplete, markSortedItems } from "./interactionProgress";
import { StepSummary } from "./StepSummary";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

export function SortInteraction({
  step,
  progress,
  onChange,
  disabled
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

  const accepted = submitted && isStepComplete(step, progress);
  const needsCorrectOrder = step.correctOrder && step.correctOrder.length > 0;

  if (disabled) {
    return <StepSummary step={step} progress={progress} />;
  }

  return (
    <View>
      <View style={{ gap: 6, marginTop: 12 }}>
        {order.map((id, index) => {
          const item = items.find((i) => i.id === id);
          if (!item) return null;
          return (
            <View key={id} style={styles.sortRow}>
              <Text style={styles.sortLabel}>{index + 1}. {item.label}</Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <SortArrow onPress={() => move(id, -1)} label="↑" disabled={Boolean(completed || disabled)} />
                <SortArrow onPress={() => move(id, 1)} label="↓" disabled={Boolean(completed || disabled)} />
              </View>
            </View>
          );
        })}
      </View>
      <ActionButton
        label={accepted ? "已提交排序" : "提交排序"}
        onPress={submit}
        disabled={completed || disabled}
      />
      {submitted ? (
        <Text style={styles.helperText}>
          {accepted
            ? needsCorrectOrder
              ? "顺序匹配，已完成。"
              : "排序已记录，已完成。"
            : needsCorrectOrder
              ? "顺序不完全正确，可以继续调整。"
              : "排序已提交。"}
        </Text>
      ) : (
        <Text style={styles.helperText}>
          {needsCorrectOrder
            ? "调整顺序，直到与目标顺序一致。"
            : "拖动上下箭头，排成你觉得合理的顺序。"}
        </Text>
      )}
    </View>
  );
}

function SortArrow({
  onPress,
  label,
  disabled
}: {
  onPress: () => void;
  label: string;
  disabled: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={{
        alignItems: "center",
        backgroundColor: disabled ? "#f4f0e8" : "#ffffff",
        borderColor: "#cfc7bb",
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 40,
        minWidth: 40,
        opacity: disabled ? 0.5 : 1
      }}
    >
      <Text style={{ color: "#625b52", fontSize: 14, fontWeight: "900" as const }}>{label}</Text>
    </Pressable>
  );
}
