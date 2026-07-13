import { Pressable, Text, View } from "react-native";
import { ArtSlot } from "../../ui/art/ArtSlot";
import { SectionHeader } from "../../ui/components";
import { MotionFeedback } from "../../ui/motion/MotionFeedback";
import { DashboardCard } from "./parts/DashboardCard";
import {
  DailyGoals,
  ProgressionClaimResultPanel,
  ProgressionOverview,
  WeeklyGoals
} from "./parts/GoalPanels";
import { ActionButton } from "./parts/SharedControls";
import { CheckInResult, RewardPreview } from "./parts/ResultPanels";
import styles from "./styles";
import type { HomeTabProps } from "./types";
import type { TodayLoopAction, TodayLoopStep } from "../../gameplay/todayLoop";
import { localizedGoalUnit } from "./dashboardCoherence";

export function HomeTab({
  loading,
  progression,
  activeSession,
  elapsedLabel,
  activeSessionOverLimit,
  lastResult,
  progressionClaim,
  nextStep,
  todayLoop,
  actions
}: HomeTabProps) {
  const hasRoutePrimaryAction = Boolean(todayLoop.primaryNextAction);
  const shouldShowFallback =
    !hasRoutePrimaryAction &&
    !todayLoop.routeDelight.doneForToday &&
    todayLoop.routeDelight.mood !== "optional-follow-up";

  return (
    <>
      <ProgressionOverview progression={progression} />
      <DashboardCard>
        <SectionHeader kicker="当前打卡" title={elapsedLabel} />
        <MotionFeedback
          variant="check-in"
          trigger={activeSession ? "active" : "idle"}
          style={{ alignItems: "center", marginVertical: 8 }}
        >
          <ArtSlot slotId="home-check-in-character" size={48} />
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
      <TodayPlayRoute
        loading={loading}
        todayLoop={todayLoop}
        onAction={actions.runTodayLoopAction}
      />
      {shouldShowFallback ? (
        <View style={styles.nextStepFallbackPanel}>
          <Text style={styles.darkKicker}>备用下一步</Text>
          <Text style={styles.nextStepTitle}>{nextStep.title}</Text>
          <Text style={styles.nextStepCopy}>{nextStep.description}</Text>
          <RewardPreview preview={nextStep.rewardPreview ?? null} dark />
          <ActionButton
            label={nextStep.actionLabel}
            onPress={actions.runNextStep}
            disabled={loading}
          />
        </View>
      ) : null}
      {lastResult ? (
        <CheckInResult
          result={lastResult}
          nextStep={nextStep}
          delight={todayLoop.resultDelight?.kind === "check-in" ? todayLoop.resultDelight : null}
        />
      ) : null}
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
    </>
  );
}

function TodayPlayRoute({
  loading,
  todayLoop,
  onAction
}: {
  loading: boolean;
  todayLoop: HomeTabProps["todayLoop"];
  onAction: (action: TodayLoopAction) => void | Promise<void>;
}) {
  const primary = todayLoop.primaryNextAction;
  return (
    <DashboardCard>
      <View style={styles.todayRouteHeader}>
        <View style={styles.flex}>
          <SectionHeader kicker="今日摸鱼路线" title={todayLoop.routeDelight.title} />
        </View>
        <View style={styles.todayRouteProgressPill}>
          <Text style={styles.todayRouteProgressText}>{todayLoop.routeProgress.progressLabel}</Text>
        </View>
      </View>
      <View style={styles.todayRouteProgressTrack}>
        <View
          style={[
            styles.todayRouteProgressFill,
            { width: `${todayLoop.routeProgress.percent}%` }
          ]}
        />
      </View>
      <Text style={styles.kickerSection}>{todayLoop.routeProgress.stageLabel}</Text>
      <Text style={styles.copy}>{todayLoop.loopMessage}</Text>
      <View
        style={[
          styles.todayRouteDelightBox,
          todayLoop.routeDelight.doneForToday && styles.todayRouteDelightBoxDone
        ]}
      >
        <Text style={styles.rowTitle}>{todayLoop.routeDelight.title}</Text>
        <Text style={styles.rowMeta}>{todayLoop.routeDelight.copy}</Text>
      </View>
      <View style={styles.todayRouteList}>
        {todayLoop.routeSteps.slice(0, 5).map((step) => (
          <RouteStep key={step.id} step={step} />
        ))}
      </View>
      {primary ? (
        <View style={styles.todayRoutePrimary}>
          <Text style={styles.kicker}>当前最该做</Text>
          <Text style={styles.rowTitle}>{primary.title}</Text>
          <Text style={styles.rowMeta}>{primary.description}</Text>
          <RewardPreview preview={primary.rewardPreview} />
          <ActionButton
            label={primary.actionLabel}
            disabled={loading}
            onPress={() => onAction(primary)}
          />
        </View>
      ) : null}
      {todayLoop.secondaryActions.length ? (
        <View style={styles.todayRouteSecondaryRow}>
          {todayLoop.secondaryActions.map((action) => (
            <Pressable
              key={`${action.kind}-${action.title}`}
              accessibilityLabel={action.actionLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
              disabled={loading}
              onPress={() => void onAction(action)}
              style={({ pressed }) => [
                styles.todayRouteSecondaryButton,
                (pressed || loading) && styles.buttonMuted
              ]}
            >
              <Text style={styles.inlineActionText}>{action.actionLabel}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {todayLoop.todayObjectives.length ? (
        <View style={styles.todayObjectiveGrid}>
          {todayLoop.todayObjectives.slice(0, 4).map((objective) => (
            <View
              key={objective.code}
              style={[
                styles.todayObjectiveCell,
                objective.completed && styles.todayObjectiveCellDone
              ]}
            >
              <Text style={styles.kicker}>{objective.completed ? "已完成" : "进行中"}</Text>
              <Text style={styles.rowTitle}>{objective.title}</Text>
              <Text style={styles.rowMeta}>
                {objective.current}/{objective.target} {localizedGoalUnit(objective.unit)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </DashboardCard>
  );
}

function RouteStep({ step }: { step: TodayLoopStep }) {
  return (
    <View style={[styles.todayRouteStep, routeStepStyle(step.status)]}>
      <Text style={styles.todayRouteStepGlyph}>{routeStepGlyph(step.status)}</Text>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{step.title}</Text>
        <Text style={styles.rowMeta}>{step.description}</Text>
      </View>
      <Text style={styles.pendingMark}>{routeStepStatusLabel(step.status)}</Text>
    </View>
  );
}

function routeStepStyle(status: TodayLoopStep["status"]) {
  if (status === "completed") return styles.todayRouteStepDone;
  if (status === "active") return styles.todayRouteStepActive;
  if (status === "claimable") return styles.todayRouteStepClaimable;
  if (status === "optional") return styles.todayRouteStepOptional;
  return undefined;
}

function routeStepGlyph(status: TodayLoopStep["status"]) {
  if (status === "completed") return "✓";
  if (status === "active") return "▶";
  if (status === "claimable") return "!";
  if (status === "optional") return "?";
  return "·";
}

function routeStepStatusLabel(status: TodayLoopStep["status"]) {
  if (status === "completed") return "完成";
  if (status === "active") return "进行中";
  if (status === "claimable") return "可做";
  if (status === "optional") return "可选";
  return "待开始";
}
