import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ActionButton } from "../SharedControls";
import { isStepComplete, markReactionResult } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

type ReactionState = "idle" | "waiting" | "ready" | "missed" | "hit";

export function ReactionInteraction({
  step,
  progress,
  onChange,
  reducedMotion
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (windowRef.current) clearTimeout(windowRef.current);
    };
  }, []);

  function startRound() {
    if (currentResult.attempts >= totalRounds || completed) return;
    setState("waiting");
    const delay = 1000 + Math.random() * 1500;
    timeoutRef.current = setTimeout(() => {
      setState("ready");
      windowRef.current = setTimeout(() => {
        finishRound(false);
      }, 900);
    }, delay);
  }

  function tap() {
    if (state === "ready") {
      if (windowRef.current) clearTimeout(windowRef.current);
      finishRound(true);
    }
  }

  function finishRound(success: boolean) {
    const next = {
      successCount: currentResult.successCount + (success ? 1 : 0),
      attempts: currentResult.attempts + 1
    };
    markReactionResult(onChange, step.id, next);
    setState(success ? "hit" : "missed");
  }

  const canStart = state === "idle" || state === "hit" || state === "missed";

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="反应区域"
        onPress={tap}
        disabled={state !== "ready"}
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
          {state === "idle" && "准备开始"}
          {state === "waiting" && "等待信号…"}
          {state === "ready" && "点！"}
          {state === "missed" && " missed"}
          {state === "hit" && "命中"}
        </Text>
      </Pressable>
      <Text style={{ color: "#232323", fontSize: 15, fontWeight: "900" as const, marginTop: 12 }}>
        命中 {currentResult.successCount}/{required} · 第 {Math.min(totalRounds, currentResult.attempts + 1)}/{totalRounds} 轮
      </Text>
      {reducedMotion ? (
        <Text style={styles.helperText}>已开启减弱动态效果，颜色变化仍可完成挑战。</Text>
      ) : null}
      <ActionButton
        label={completed ? "反应挑战完成" : canStart ? "开始" : "进行中"}
        onPress={startRound}
        disabled={!canStart || completed}
      />
    </View>
  );
}
