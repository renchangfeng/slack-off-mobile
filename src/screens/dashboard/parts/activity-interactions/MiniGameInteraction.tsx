import { useState } from "react";
import { Text, View } from "react-native";
import { ActionButton } from "../SharedControls";
import { markMiniGame } from "./interactionProgress";
import { StepSummary } from "./StepSummary";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

export function MiniGameInteraction({
  step,
  progress,
  onChange,
  disabled
}: ActivityStepInteractionProps) {
  const completed = progress.miniGameResults?.[step.id]?.passed === true;
  const [tapCount, setTapCount] = useState(0);

  function tap() {
    if (disabled) return;
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      markMiniGame(onChange, step.id, next);
    }
  }

  if (disabled) {
    return <StepSummary step={step} progress={progress} />;
  }

  return (
    <View>
      <Text style={styles.helperText}>
        {step.gameCode ?? "mini_game"} · {step.requiredResult ?? "完成即可"}
      </Text>
      <Text style={styles.timerMini}>{Math.min(5, tapCount)}/5</Text>
      <ActionButton
        label={completed ? "小游戏通过" : "快速点击"}
        onPress={tap}
        disabled={completed || disabled}
      />
    </View>
  );
}
