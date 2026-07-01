import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Pressable, Text, View } from "react-native";
import type { ActivityAssignment, ActivityInteractionProgress } from "../../../api/activities";
import { ArtSlot } from "../../../ui/art/ArtSlot";
import { MotionFeedback } from "../../../ui/motion/MotionFeedback";
import { ActionButton } from "./SharedControls";
import {
  activityStepTypeLabel,
  isActivityStepComplete,
  markAckStep,
  markChoiceStep,
  markMiniGameStep,
  markTimerStep
} from "../helpers";
import styles from "../styles";

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
        />
      ))}
    </View>
  );
}

function ActivityStepCard({
  index,
  step,
  progress,
  onChange
}: {
  index: number;
  step: ActivityAssignment["interaction"]["steps"][number];
  progress: ActivityInteractionProgress;
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>;
}) {
  const completed = isActivityStepComplete(step, progress);
  const selectedChoice = step.options?.find(
    (option) => option.id === progress.choiceAnswers?.[step.id]
  );
  const [remaining, setRemaining] = useState<number | null>(null);
  const [miniTapCount, setMiniTapCount] = useState(0);

  useEffect(() => {
    if (remaining === null || remaining <= 0 || completed) {
      return;
    }
    const timer = setTimeout(() => {
      setRemaining((current) => {
        const next = Math.max(0, (current ?? 0) - 1);
        if (next === 0) {
          markTimerStep(onChange, step.id, step.durationSeconds ?? 0);
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [completed, onChange, remaining, step.durationSeconds, step.id]);

  function startTimer() {
    setRemaining(step.durationSeconds ?? 0);
  }

  function tapMiniGame() {
    const next = miniTapCount + 1;
    setMiniTapCount(next);
    if (next >= 5) {
      markMiniGameStep(onChange, step.id, next);
    }
  }

  return (
    <MotionFeedback variant="activity-step" trigger={completed ? `${step.id}:done` : undefined}>
      <View style={[styles.interactionStep, completed && styles.interactionStepDone]}>
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
      {step.type === "ack" ? (
        <ActionButton
          label={completed ? "已确认" : "我照做了"}
          disabled={completed}
          onPress={() => markAckStep(onChange, step.id)}
        />
      ) : null}
      {step.type === "timer" ? (
        <>
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
            disabled={completed || remaining !== null}
            onPress={startTimer}
          />
        </>
      ) : null}
      {step.type === "choice" ? (
        <>
          <View style={styles.choiceGrid}>
            {step.options?.map((option) => {
              const selected = selectedChoice?.id === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => markChoiceStep(onChange, step.id, option.id)}
                  style={[styles.choiceButton, selected && styles.choiceButtonSelected]}
                >
                  <Text
                    style={[
                      styles.choiceButtonText,
                      selected && styles.choiceButtonTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {selectedChoice ? <Text style={styles.helperText}>{selectedChoice.resultText}</Text> : null}
        </>
      ) : null}
      {step.type === "mini_game" ? (
        <>
          <Text style={styles.helperText}>
            {step.gameCode ?? "mini_game"} · {step.requiredResult ?? "完成即可"}
          </Text>
          <Text style={styles.timerMini}>{Math.min(5, miniTapCount)}/5</Text>
          <ActionButton
            label={completed ? "小游戏通过" : "快速点击"}
            disabled={completed}
            onPress={tapMiniGame}
          />
        </>
      ) : null}
    </View>
    </MotionFeedback>
  );
}
