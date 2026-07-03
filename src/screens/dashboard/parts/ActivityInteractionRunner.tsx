import { Text, View } from "react-native";
import type { ActivityAssignment, ActivityInteractionProgress } from "../../../api/activities";
import { ArtSlot } from "../../../ui/art/ArtSlot";
import { MotionFeedback } from "../../../ui/motion/MotionFeedback";
import { useReducedMotion } from "../../../ui/motion/useReducedMotion";
import {
  activityStepTypeLabel,
  isActivityStepComplete
} from "../helpers";
import styles from "../styles";
import { AckInteraction } from "./activity-interactions/AckInteraction";
import { BreathInteraction } from "./activity-interactions/BreathInteraction";
import { ChoiceInteraction } from "./activity-interactions/ChoiceInteraction";
import { FallbackInteraction } from "./activity-interactions/FallbackInteraction";
import { MicroJournalInteraction } from "./activity-interactions/MicroJournalInteraction";
import { MiniGameInteraction } from "./activity-interactions/MiniGameInteraction";
import { ReactionInteraction } from "./activity-interactions/ReactionInteraction";
import { RevealInteraction } from "./activity-interactions/RevealInteraction";
import { ShufflePickInteraction } from "./activity-interactions/ShufflePickInteraction";
import { SortInteraction } from "./activity-interactions/SortInteraction";
import { TapPatternInteraction } from "./activity-interactions/TapPatternInteraction";
import { TimerInteraction } from "./activity-interactions/TimerInteraction";
import type { ActivityStepInteractionProps } from "./activity-interactions/types";
import type { ComponentType, Dispatch, SetStateAction } from "react";

const STEP_COMPONENTS: Record<
  ActivityAssignment["interaction"]["steps"][number]["type"],
  ComponentType<ActivityStepInteractionProps>
> = {
  ack: AckInteraction,
  timer: TimerInteraction,
  choice: ChoiceInteraction,
  mini_game: MiniGameInteraction,
  "tap-pattern": TapPatternInteraction,
  "shuffle-pick": ShufflePickInteraction,
  sort: SortInteraction,
  breath: BreathInteraction,
  reaction: ReactionInteraction,
  "micro-journal": MicroJournalInteraction,
  reveal: RevealInteraction
};

export function ActivityInteractionRunner({
  assignment,
  progress,
  onChange
}: {
  assignment: ActivityAssignment;
  progress: ActivityInteractionProgress;
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>;
}) {
  const steps = assignment.interaction.steps;
  const completed = steps.filter((step) => isActivityStepComplete(step, progress)).length;
  return (
    <View style={styles.interactionPanel}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>互动流程</Text>
          <Text style={styles.rowTitle}>
            {completed}/{steps.length} 步 · 约 {assignment.interaction.estimatedSeconds} 秒
          </Text>
        </View>
        <Text style={completed === steps.length ? styles.completedMark : styles.progressValue}>
          {completed === steps.length ? "可领取" : "进行中"}
        </Text>
      </View>
      {steps.map((step, index) => (
        <ActivityStepCard
          key={step.id}
          index={index}
          step={step}
          progress={progress}
          onChange={onChange}
          status={assignment.status}
        />
      ))}
    </View>
  );
}

function ActivityStepCard({
  index,
  step,
  progress,
  onChange,
  status
}: {
  index: number;
  step: ActivityAssignment["interaction"]["steps"][number];
  progress: ActivityInteractionProgress;
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>;
  status: ActivityAssignment["status"];
}) {
  const reducedMotion = useReducedMotion();
  const completed = isActivityStepComplete(step, progress);
  const disabled = status !== "active";
  const Body = STEP_COMPONENTS[step.type] ?? FallbackInteraction;

  return (
    <MotionFeedback variant="activity-step" trigger={completed ? `${step.id}:done` : undefined}>
      <View
        style={[
          styles.interactionStep,
          completed && styles.interactionStepDone,
          disabled && styles.interactionStepDisabled
        ]}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.kicker}>第 {index + 1} 步 · {activityStepTypeLabel(step.type)}</Text>
          <View style={{ alignItems: "center", flexDirection: "row", gap: 6 }}>
            {completed ? <ArtSlot slotId="activity-step-feedback" size={24} /> : null}
            <Text style={completed ? styles.completedMark : styles.pendingMark}>
              {completed ? "完成" : "待完成"}
            </Text>
          </View>
        </View>
        <Text style={styles.rowTitle}>{step.title}</Text>
        <Text style={styles.rowMeta}>{step.description}</Text>
        <Body
          step={step}
          progress={progress}
          onChange={onChange}
          reducedMotion={reducedMotion}
          disabled={disabled}
        />
      </View>
    </MotionFeedback>
  );
}
