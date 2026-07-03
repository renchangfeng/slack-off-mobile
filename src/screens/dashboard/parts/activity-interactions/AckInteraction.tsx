import { ActionButton } from "../SharedControls";
import { markAck } from "./interactionProgress";
import { StepSummary } from "./StepSummary";
import type { ActivityStepInteractionProps } from "./types";

export function AckInteraction({
  step,
  progress,
  onChange,
  disabled
}: ActivityStepInteractionProps) {
  const completed = Boolean(progress.completedStepIds?.includes(step.id));
  if (disabled) {
    return <StepSummary step={step} progress={progress} />;
  }
  return (
    <ActionButton
      label={completed ? "已确认" : "我照做了"}
      onPress={() => markAck(onChange, step.id)}
      disabled={completed || disabled}
    />
  );
}
