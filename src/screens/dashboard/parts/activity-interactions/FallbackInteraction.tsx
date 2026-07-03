import { Text, View } from "react-native";
import { StepSummary } from "./StepSummary";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

export function FallbackInteraction({
  step,
  progress,
  disabled
}: ActivityStepInteractionProps) {
  if (disabled) {
    return <StepSummary step={step} progress={progress} />;
  }
  return (
    <View>
      <Text style={styles.helperText}>
        当前版本暂未针对此互动类型定制界面。请换一个任务，或更新 App 后再试。
      </Text>
    </View>
  );
}
