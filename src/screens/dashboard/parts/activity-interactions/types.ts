import type {
  ActivityAssignment,
  ActivityInteractionProgress
} from "../../../../api/activities";
import type { Dispatch, SetStateAction } from "react";

export type ActivityStep = ActivityAssignment["interaction"]["steps"][number];

export type ActivityStepInteractionProps = {
  step: ActivityStep;
  progress: ActivityInteractionProgress;
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>;
  reducedMotion: boolean;
};
