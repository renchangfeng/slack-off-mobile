import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ActionButton } from "../SharedControls";
import { markTimer } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

import { StepSummary } from "./StepSummary";

export function TimerInteraction({
  step,
  progress,
  onChange,
  disabled
}: ActivityStepInteractionProps) {
  const completed = (progress.timerSeconds?.[step.id] ?? 0) >= (step.durationSeconds ?? 0);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (disabled || remaining === null || remaining <= 0 || completed) return;
    const timer = setInterval(() => {
      setRemaining((current) => {
        const next = Math.max(0, (current ?? 0) - 1);
        if (next === 0) {
          markTimer(onChange, step.id, step.durationSeconds ?? 0);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [disabled, completed, onChange, remaining, step.durationSeconds, step.id]);

  function start() {
    if (disabled) return;
    setRemaining(step.durationSeconds ?? 0);
  }

  if (disabled) {
    return <StepSummary step={step} progress={progress} />;
  }

  return (
    <View>
      <Text style={styles.timerMini}>
        {completed
          ? "00"
          : remaining === null
            ? `${step.durationSeconds ?? 0}`
            : `${remaining.toString().padStart(2, "0")}`}
        s
      </Text>
      <ActionButton
        label={completed ? "倒计时完成" : remaining === null ? "开始倒计时" : "倒计时中"}
        onPress={start}
        disabled={completed || remaining !== null || disabled}
      />
    </View>
  );
}
