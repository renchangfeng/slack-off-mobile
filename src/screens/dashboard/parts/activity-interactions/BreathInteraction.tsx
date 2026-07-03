import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { ActionButton } from "../SharedControls";
import { isStepComplete, markBreathRounds } from "./interactionProgress";
import { StepSummary } from "./StepSummary";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

type Phase = "inhale" | "hold" | "exhale" | "idle";

export function BreathInteraction({
  step,
  progress,
  onChange,
  reducedMotion,
  disabled
}: ActivityStepInteractionProps) {
  const required = step.requiredRounds ?? 1;
  const completedRounds = progress.breathRounds?.[step.id] ?? 0;
  const completed = isStepComplete(step, progress);
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const completedRoundsRef = useRef(completedRounds);

  useEffect(() => {
    completedRoundsRef.current = completedRounds;
  }, [completedRounds]);

  useEffect(() => {
    if (phase === "idle" || secondsLeft <= 0) return;
    const tick = setInterval(() => {
      setSecondsLeft((current) => {
        const next = current - 1;
        if (next <= 0) {
          advancePhase();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [phase, secondsLeft]);

  useEffect(() => {
    if (reducedMotion || phase === "idle") return;
    if (phase === "inhale") {
      Animated.timing(scale, {
        toValue: 1.25,
        duration: inhale * 1000,
        useNativeDriver: true
      }).start();
    } else if (phase === "hold") {
      // keep scale
    } else if (phase === "exhale") {
      Animated.timing(scale, {
        toValue: 1,
        duration: exhale * 1000,
        useNativeDriver: true
      }).start();
    }
  }, [phase, reducedMotion]);

  const inhale = step.inhaleSeconds ?? 4;
  const hold = step.holdSeconds ?? 0;
  const exhale = step.exhaleSeconds ?? 4;

  function advancePhase() {
    if (phase === "inhale") {
      if (hold > 0) {
        setPhase("hold");
        setSecondsLeft(hold);
      } else {
        setPhase("exhale");
        setSecondsLeft(exhale);
      }
    } else if (phase === "hold") {
      setPhase("exhale");
      setSecondsLeft(exhale);
    } else if (phase === "exhale") {
      const nextRound = completedRoundsRef.current + 1;
      markBreathRounds(onChange, step.id, nextRound);
      if (nextRound >= required) {
        setPhase("idle");
      } else {
        setPhase("inhale");
        setSecondsLeft(inhale);
      }
    }
  }

  function start() {
    if (disabled) return;
    setPhase("inhale");
    setSecondsLeft(inhale);
  }

  if (disabled) {
    return <StepSummary step={step} progress={progress} />;
  }

  const phaseLabel = {
    idle: "准备开始",
    inhale: "吸气",
    hold: "屏息",
    exhale: "呼气"
  }[phase];

  return (
    <View>
      <View style={{ alignItems: "center", marginTop: 12 }}>
        <Animated.View
          style={{
            alignItems: "center",
            backgroundColor: "#e7f4ed",
            borderColor: "#82b99f",
            borderRadius: reducedMotion ? 8 : 64,
            borderWidth: 2,
            height: reducedMotion ? 72 : 128,
            justifyContent: "center",
            transform: reducedMotion ? undefined : [{ scale }],
            width: reducedMotion ? "100%" : 128
          }}
        >
          <Text style={{ color: "#1f8f62", fontSize: reducedMotion ? 18 : 22, fontWeight: "900" as const }}>
            {phase === "idle" ? required : secondsLeft}
          </Text>
          {reducedMotion && phase !== "idle" ? (
            <Text style={{ color: "#1f8f62", fontSize: 13, fontWeight: "900" as const, marginTop: 2 }}>
              {phaseLabel}
            </Text>
          ) : null}
        </Animated.View>
        <Text style={{ color: "#232323", fontSize: 15, fontWeight: "900" as const, marginTop: 12 }}>
          {phaseLabel} · {completedRounds}/{required} 轮
        </Text>
        {reducedMotion ? (
          <Text style={styles.helperText}>已开启减弱动态效果，按文字提示吸气、呼气即可完成。</Text>
        ) : null}
      </View>
      <ActionButton
        label={completed ? "呼吸完成" : phase === "idle" ? "开始呼吸" : "呼吸中"}
        onPress={start}
        disabled={phase !== "idle" || completed || disabled}
      />
    </View>
  );
}
