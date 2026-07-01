import { ActionButton } from "../SharedControls";
import { markAck } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";

export function AckInteraction({
  step,
  progress,
  onChange,
  reducedMotion: _reducedMotion
}: ActivityStepInteractionProps) {
  const completed = Boolean(progress.completedStepIds?.includes(step.id));
  return (
    <ActionButton
      label={completed ? "已确认" : "我照做了"}
      onPress={() => markAck(onChange, step.id)}
      disabled={completed}
    />
  );
}
