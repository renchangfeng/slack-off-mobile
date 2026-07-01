import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { ActivityInteractionProgress } from "../../../../api/activities";
import { ActionButton } from "../SharedControls";
import { markTapPattern } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

export function TapPatternInteraction({
  step,
  progress,
  onChange,
  reducedMotion: _reducedMotion
}: ActivityStepInteractionProps) {
  const required = step.requiredTaps ?? 1;
  const current = progress.tapCounts?.[step.id] ?? 0;
  const completed = current >= required;
  const [pulse, setPulse] = useState(false);

  function tap() {
    if (completed) return;
    const next = current + 1;
    markTapPattern(onChange, step.id, next);
    setPulse(true);
    setTimeout(() => setPulse(false), 120);
  }

  return (
    <View>
      <Text style={styles.timerMini}>
        {current}/{required} {step.tapLabel ?? "次"}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`点击区域，当前 ${current}/${required}`}
        disabled={completed}
        onPress={tap}
        style={({ pressed }) => [
          tapStyles.area,
          (pressed || pulse) && tapStyles.pulse
        ]}
      >
        <Text style={tapStyles.areaText}>
          {completed ? "已完成" : step.tapLabel ? `点一下${step.tapLabel}` : "点一下"}
        </Text>
      </Pressable>
      {completed ? null : (
        <ActionButton
          label="点一次"
          onPress={tap}
          disabled={completed}
        />
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
  }
};
