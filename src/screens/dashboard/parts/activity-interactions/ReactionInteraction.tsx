import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ActionButton } from "../SharedControls";
import { isStepComplete, markReactionResult } from "./interactionProgress";
import { StepSummary } from "./StepSummary";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

type ReactionState = "idle" | "waiting" | "ready" | "missed" | "hit";

export function ReactionInteraction({
  step,
  progress,
  onChange,
  reducedMotion,
  disabled
}: ActivityStepInteractionProps) {
  const required = step.requiredSuccessCount ?? 1;
  const totalRounds = step.reactionRounds ?? required;
  const currentResult = progress.reactionResults?.[step.id] ?? {
    successCount: 0,
    attempts: 0
  };
  const completed = isStepComplete(step, progress);
  const [state, setState] = useState<ReactionState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef(currentResult);

  useEffect(() => {
    resultRef.current = currentResult;
  }, [currentResult]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (windowRef.current) clearTimeout(windowRef.current);
    };
  }, []);

  function startRound() {
    if (disabled || resultRef.current.attempts >= totalRounds || completed) return;
    setState("waiting");
    const delay = 1000 + Math.random() * 1500;
    timeoutRef.current = setTimeout(() => {
      setState("ready");
      windowRef.current = setTimeout(() => {
        finishRound(false);
      }, reducedMotion ? 1400 : 1100);
    }, delay);
  }

  function tap() {
    if (disabled || state !== "ready") return;
    if (windowRef.current) clearTimeout(windowRef.current);
    finishRound(true);
  }

  function finishRound(success: boolean) {
    const next = {
      successCount: resultRef.current.successCount + (success ? 1 : 0),
      attempts: resultRef.current.attempts + 1
    };
    markReactionResult(onChange, step.id, next);
    setState(success ? "hit" : "missed");
  }

  const canStart = state === "idle" || state === "hit" || state === "missed";
  const remainingAttempts = Math.max(0, totalRounds - currentResult.attempts);

  const stateLabel: Record<ReactionState, string> = {
    idle: "准备开始",
    waiting: "等待信号…",
    ready: "点！",
    missed: "没点到，再试一轮",
    hit: "命中"
  };

  if (disabled) {
    return <StepSummary step={step} progress={progress} />;
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`反应区域，${stateLabel[state]}`}
        onPress={tap}
        disabled={state !== "ready" || disabled}
        style={{
          alignItems: "center",
          backgroundColor:
            state === "ready" ? "#1f8f62" : state === "missed" ? "#a23b3b" : "#f4f0e8",
          borderColor:
            state === "ready" ? "#1f8f62" : state === "missed" ? "#a23b3b" : "#d8d0c4",
          borderRadius: 8,
          borderWidth: 1,
          justifyContent: "center",
          marginTop: 12,
          minHeight: 96,
          padding: 12
        }}
      >
        <Text
          style={{
            color: state === "ready" || state === "missed" ? "#ffffff" : "#625b52",
            fontSize: 18,
            fontWeight: "900" as const
          }}
        >
          {stateLabel[state]}
        </Text>
      </Pressable>
      <Text style={{ color: "#232323", fontSize: 15, fontWeight: "900" as const, marginTop: 12 }}>
        命中 {currentResult.successCount}/{required} · 剩余 {remainingAttempts} 轮
      </Text>
      {reducedMotion ? (
        <Text style={styles.helperText}>
          已开启减弱动态效果：当区域变成深绿色并显示“点！”时点击即可。
        </Text>
      ) : (
        <Text style={styles.helperText}>
          {state === "idle"
            ? "点击开始，圆环变绿时快速点击。"
            : state === "waiting"
              ? "保持注意，颜色会变。"
              : state === "ready"
                ? "就是现在。"
                : completed
                  ? "已完成反应挑战。"
                  : "点击开始下一轮。"}
        </Text>
      )}
      <ActionButton
        label={completed ? "反应挑战完成" : canStart ? "开始" : "进行中"}
        onPress={startRound}
        disabled={!canStart || completed || disabled}
      />
    </View>
  );
}
