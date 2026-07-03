import { Text } from "react-native";
import { summarizeStep } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

export function StepSummary({
  step,
  progress
}: Pick<ActivityStepInteractionProps, "step" | "progress">) {
  return <Text style={styles.helperText}>{summarizeStep(step, progress)}</Text>;
}
