import { useState } from "react";
import { Text, View } from "react-native";
import { ActionButton } from "../SharedControls";
import { markMiniGame } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

export function MiniGameInteraction({
  step,
  progress,
  onChange,
  reducedMotion: _reducedMotion
}: ActivityStepInteractionProps) {
  const completed = progress.miniGameResults?.[step.id]?.passed === true;
  const [tapCount, setTapCount] = useState(0);

  function tap() {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      markMiniGame(onChange, step.id, next);
    }
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
        disabled={completed}
      />
    </View>
  );
}
