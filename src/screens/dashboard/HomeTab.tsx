import { Pressable, Text, View } from "react-native";
import { ArtSlot } from "../../ui/art/ArtSlot";
import { EmptyState, SectionHeader } from "../../ui/components";
import {
  CoreSurfaceGrid,
  PrimaryActionPanel,
  SummaryCard
} from "../../ui/CoreSurface";
import { MotionFeedback } from "../../ui/motion/MotionFeedback";
import { DashboardCard } from "./parts/DashboardCard";
import { ActionButton, ProgressBar } from "./parts/SharedControls";
import { ProgressionClaimResultPanel } from "./parts/GoalPanels";
import { CheckInResult, RewardPreview } from "./parts/ResultPanels";
import { deriveHomeSurface, type HomeGoalSummary } from "./homeSurface";
import styles from "./styles";
import type { HomeTabProps } from "./types";
import type { TodayLoopAction, TodayLoopStep } from "../../gameplay/todayLoop";

export function HomeTab(props: HomeTabProps) {
  const { loading, actions } = props;
  const surface = deriveHomeSurface(props);

  return (
    <>
      <HomeStatusPanel surface={surface} loading={loading} actions={actions} />
      {surface.primaryAction ? (
        <HomePrimaryActionPanel
          action={surface.primaryAction}
          loading={loading}
          onAction={actions.runTodayLoopAction}
        />
      ) : surface.fallbackStep ? (
        <HomeFallbackPanel
          step={surface.fallbackStep}
          loading={loading}
          onAction={actions.runNextStep}
        />
      ) : null}
      {surface.durableResults.map((result, index) =>
        result.kind === "check-in" ? (
          <CheckInResult
            key={`check-in-result-${index}`}
            result={result.result}
            nextStep={props.nextStep}
            delight={
              props.todayLoop.resultDelight?.kind === "check-in"
                ? props.todayLoop.resultDelight
                : null
            }
          />
        ) : (
          <ProgressionClaimResultPanel
            key={`progression-claim-${index}`}
            result={result.result}
            nextStep={props.nextStep}
          />
        )
      )}
      <HomeProgressPanel surface={surface} loading={loading} actions={actions} />
      {surface.secondaryActions.length ? (
        <HomeSecondaryActions
          actions={surface.secondaryActions}
          loading={loading}
          onAction={actions.runTodayLoopAction}
        />
      ) : null}
    </>
  );
}

function HomeStatusPanel({
  surface,
  loading,
  actions
}: {
  surface: ReturnType<typeof deriveHomeSurface>;
  loading: boolean;
  actions: HomeTabProps["actions"];
}) {
  const { identity, activeCheckIn } = surface;
  return (
    <PrimaryActionPanel style={styles.homeStatusPanel}>
      <View style={styles.homeStatusTopRow}>
        <View>
          <Text style={styles.kicker}>摸鱼同学</Text>
          <Text style={styles.homeLevelText}>LV {identity.level}</Text>
        </View>
        <View style={styles.homeStreakBox}>
          <Text style={styles.homeStreakValue}>{identity.currentStreak}</Text>
          <Text style={styles.homeStreakLabel}>连续休息天</Text>
        </View>
      </View>
      <Text style={styles.homeXpText}>
        {identity.xp} XP · 距下一级还差 {identity.xpToNext} XP
      </Text>
      <ProgressBar
        value={identity.levelXp}
        max={identity.nextLevelXp}
        color="#f0c95a"
        trackColor="#e2dbd0"
      />
      <View style={styles.homeCheckInRow}>
        <View style={styles.flex}>
          <MotionFeedback
            variant="check-in"
            trigger={activeCheckIn.isActive ? "active" : "idle"}
          >
            <ArtSlot slotId="home-check-in-character" size={40} />
          </MotionFeedback>
          <Text style={styles.timerMini}>{activeCheckIn.elapsedLabel}</Text>
          <Text style={styles.smallCopy}>
            {activeCheckIn.isActive
              ? activeCheckIn.overLimit
                ? "奖励时长已封顶，仍可正常结算。"
                : "正在认真休息，结束后统一结算。"
              : "没有进行中的打卡。"}
          </Text>
        </View>
        <View style={styles.homeCheckInActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="开始打卡"
            accessibilityState={{ disabled: activeCheckIn.canStart === false }}
            disabled={activeCheckIn.canStart === false}
            onPress={() => void actions.startSession()}
            style={({ pressed }) => [
              styles.homeCheckInButton,
              (pressed || loading || activeCheckIn.isActive) && styles.buttonMuted
            ]}
          >
            <Text style={styles.homeCheckInButtonText}>开始</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="结束打卡"
            accessibilityState={{ disabled: activeCheckIn.canFinish === false }}
            disabled={activeCheckIn.canFinish === false}
            onPress={() => void actions.finishSession()}
            style={({ pressed }) => [
              styles.homeCheckInButton,
              styles.homeCheckInButtonDark,
              (pressed || loading || !activeCheckIn.isActive) && styles.buttonMuted
            ]}
          >
            <Text style={styles.homeCheckInButtonText}>结束</Text>
          </Pressable>
        </View>
      </View>
    </PrimaryActionPanel>
  );
}

function HomePrimaryActionPanel({
  action,
  loading,
  onAction
}: {
  action: TodayLoopAction;
  loading: boolean;
  onAction(action: TodayLoopAction): void | Promise<void>;
}) {
  return (
    <DashboardCard style={styles.homePrimaryCard}>
      <View style={styles.homePrimaryHeader}>
        <SectionHeader kicker="当前最该做" title={action.title} />
        <RewardPreview preview={action.rewardPreview} />
      </View>
      <Text style={styles.copy}>{action.description}</Text>
      <ActionButton
        label={action.actionLabel}
        disabled={loading}
        onPress={() => void onAction(action)}
      />
    </DashboardCard>
  );
}

function HomeFallbackPanel({
  step,
  loading,
  onAction
}: {
  step: NonNullable<ReturnType<typeof deriveHomeSurface>["fallbackStep"]>;
  loading: boolean;
  onAction(): void | Promise<void>;
}) {
  return (
    <DashboardCard style={styles.nextStepFallbackPanel}>
      <Text style={styles.darkKicker}>备用下一步</Text>
      <Text style={styles.nextStepTitle}>{step.title}</Text>
      <Text style={styles.nextStepCopy}>{step.description}</Text>
      <RewardPreview preview={step.rewardPreview ?? null} dark />
      <ActionButton label={step.actionLabel} onPress={onAction} disabled={loading} />
    </DashboardCard>
  );
}

function HomeProgressPanel({
  surface,
  loading,
  actions
}: {
  surface: ReturnType<typeof deriveHomeSurface>;
  loading: boolean;
  actions: HomeTabProps["actions"];
}) {
  return (
    <DashboardCard>
      <SectionHeader kicker="今日路线" title={surface.routeProgress.stageLabel} />
      <View style={styles.homeRouteProgressRow}>
        <View style={styles.flex}>
          <ProgressBar
            value={surface.routeProgress.percent}
            max={100}
            color="#1f8f62"
            trackColor="#d5e9dc"
          />
        </View>
        <Text style={styles.homeRouteProgressLabel}>
          {surface.routeProgress.progressLabel}
        </Text>
      </View>
      <View style={styles.homeRouteStepList}>
        {surface.doneForToday ? (
          <EmptyState
            title="今日路线已收工"
            body="该做的做了，该领的领了，剩下的可以交给明天。"
            icon="🌿"
          />
        ) : (
          <RouteStepList surface={surface} />
        )}
      </View>
      <Text style={styles.kickerSection}>目标进度</Text>
      <CoreSurfaceGrid>
        {surface.goalSummaries.map((summary) => (
          <GoalPeriodSummary
            key={summary.period}
            summary={summary}
            loading={loading}
            onClaim={
              summary.period === "daily"
                ? actions.claimDailyReward
                : actions.claimWeeklyReward
            }
            isPrimaryAction={
              surface.primaryAction?.kind === "goal-reward" &&
              (surface.primaryAction.meta?.period ?? "daily") === summary.period
            }
          />
        ))}
      </CoreSurfaceGrid>
    </DashboardCard>
  );
}

function RouteStepList({
  surface
}: {
  surface: ReturnType<typeof deriveHomeSurface>;
}) {
  const steps = surface.routeSteps.slice(0, 5);
  if (!steps.length) return null;
  return (
    <>
      {steps.map((step) => (
        <RouteStep key={step.id} step={step} />
      ))}
    </>
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

function GoalPeriodSummary({
  summary,
  loading,
  onClaim,
  isPrimaryAction
}: {
  summary: HomeGoalSummary;
  loading: boolean;
  onClaim(): void | Promise<void>;
  isPrimaryAction: boolean;
}) {
  const status = summary.claimable
    ? "奖励可领取"
    : summary.claimed
      ? "奖励已入账"
      : `${summary.completed}/${summary.total} 完成`;
  return (
    <SummaryCard
      title={summary.title}
      status={status}
      actionLabel={summary.claimable && !isPrimaryAction ? "领取" : undefined}
      disabled={loading || !summary.claimable}
      onAction={onClaim}
      style={styles.homeGoalSummary}
    />
  );
}

function HomeSecondaryActions({
  actions,
  loading,
  onAction
}: {
  actions: TodayLoopAction[];
  loading: boolean;
  onAction(action: TodayLoopAction): void | Promise<void>;
}) {
  return (
    <DashboardCard>
      <SectionHeader kicker="还可以做" title="顺手推进，不用勉强" />
      <View style={styles.homeSecondaryRow}>
        {actions.map((action) => (
          <Pressable
            key={`${action.kind}-${action.title}`}
            accessibilityLabel={action.actionLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            disabled={loading}
            onPress={() => void onAction(action)}
            style={({ pressed }) => [
              styles.homeSecondaryButton,
              (pressed || loading) && styles.buttonMuted
            ]}
          >
            <Text style={styles.inlineActionText}>{action.actionLabel}</Text>
          </Pressable>
        ))}
      </View>
    </DashboardCard>
  );
}
