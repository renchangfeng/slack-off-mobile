import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { markTapPattern } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

export function TapPatternInteraction({
  step,
  progress,
  onChange,
  reducedMotion
}: ActivityStepInteractionProps) {
  const required = step.requiredTaps ?? 1;
  const current = progress.tapCounts?.[step.id] ?? 0;
  const completed = current >= required;
  const remaining = Math.max(0, required - current);
  const [pulse, setPulse] = useState(false);

  function tap() {
    if (completed) return;
    const next = current + 1;
    markTapPattern(onChange, step.id, next);
    setPulse(true);
    setTimeout(() => setPulse(false), reducedMotion ? 50 : 120);
  }

  const actionLabel = step.tapLabel ? `点一下${step.tapLabel}` : "点一下";

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel}，还剩 ${remaining} 次`}
        disabled={completed}
        onPress={tap}
        style={({ pressed }) => [
          tapStyles.area,
          (pressed || pulse) && tapStyles.pulse,
          completed && styles.tapAreaCompleted
        ]}
      >
        <Text
          style={[
            tapStyles.areaText,
            completed && styles.tapAreaCompletedText
          ]}
        >
          {completed ? "已完成" : actionLabel}
        </Text>
        <Text style={tapStyles.countText}>
          {completed ? `${required}/${required}` : `${current}/${required}`}
        </Text>
      </Pressable>
      {completed ? (
        <Text style={styles.helperText}>点够了，这一步已完成。</Text>
      ) : (
        <Text style={styles.helperText}>
          再点 {remaining} 次即可完成
        </Text>
      )}
    </View>
  );
}

const tapStyles = {
  area: {
    alignItems: "center" as const,
    backgroundColor: "#f4f0e8",
    borderColor: "#d8d0c4",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center" as const,
    marginTop: 12,
    minHeight: 96,
    padding: 12,
    width: "100%"
  },
  pulse: {
    backgroundColor: "#e7f4ed",
    borderColor: "#82b99f"
  },
  areaText: {
    color: "#625b52",
    fontSize: 15,
    fontWeight: "900" as const
  },
  countText: {
    color: "#746b60",
    fontSize: 12,
    fontWeight: "900" as const,
    marginTop: 4
  }
};
