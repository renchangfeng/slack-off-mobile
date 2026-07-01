import { Text, View } from "react-native";
import { ArtSlot } from "../../ui/art/ArtSlot";
import { SectionHeader } from "../../ui/components";
import { MotionFeedback } from "../../ui/motion/MotionFeedback";
import { DashboardCard } from "./parts/DashboardCard";
import {
  DailyGoals,
  DailyRhythmChecklist,
  ProgressionClaimResultPanel,
  ProgressionOverview,
  WeeklyGoals
} from "./parts/GoalPanels";
import { ActionButton } from "./parts/SharedControls";
import { CheckInResult, RewardPreview } from "./parts/ResultPanels";
import styles from "./styles";
import type { HomeTabProps } from "./types";

export function HomeTab({
  loading,
  progression,
  activeSession,
  elapsedLabel,
  activeSessionOverLimit,
  lastResult,
  progressionClaim,
  nextStep,
  actions
}: HomeTabProps) {
  return (
    <>
      <ProgressionOverview progression={progression} />
      {progressionClaim ? (
        <ProgressionClaimResultPanel result={progressionClaim} nextStep={nextStep} />
      ) : null}
      <DailyGoals
        progression={progression}
        loading={loading}
        onClaim={actions.claimDailyReward}
      />
      <WeeklyGoals
        progression={progression}
        loading={loading}
        onClaim={actions.claimWeeklyReward}
      />
      <DashboardCard>
        <SectionHeader kicker="当前打卡" title={elapsedLabel} />
        <MotionFeedback
          variant="check-in"
          trigger={activeSession ? "active" : "idle"}
          style={{ alignItems: "center", marginVertical: 12 }}
        >
          <ArtSlot slotId="home-check-in-character" size={64} />
        </MotionFeedback>
        <Text style={styles.copy}>
          {activeSession
            ? activeSessionOverLimit
              ? "奖励时长已按 45 分钟封顶，但本次打卡仍会正常完成并获得奖励。"
              : "正在认真休息。时间会自动更新，结束后统一结算。"
            : "现在没有进行中的打卡。先给自己留一点空白。"}
        </Text>
        <View style={styles.actions}>
          <ActionButton
            label="开始"
            disabled={loading || Boolean(activeSession)}
            onPress={actions.startSession}
          />
          <ActionButton
            label="结束"
            dark
            disabled={loading || !activeSession}
            onPress={actions.finishSession}
          />
        </View>
      </DashboardCard>
      <View style={styles.nextStepPanel}>
        <Text style={styles.darkKicker}>下一步</Text>
        <Text style={styles.nextStepTitle}>{nextStep.title}</Text>
        <Text style={styles.nextStepCopy}>{nextStep.description}</Text>
        <RewardPreview preview={nextStep.rewardPreview ?? null} dark />
        <ActionButton label={nextStep.actionLabel} onPress={actions.runNextStep} disabled={loading} />
      </View>
      <DailyRhythmChecklist
        progression={progression}
        loading={loading}
        onRunGoal={actions.runDailyGoalAction}
      />
      {lastResult ? <CheckInResult result={lastResult} nextStep={nextStep} /> : null}
    </>
  );
}
