import { Text, View } from "react-native";
import { Pressable } from "react-native";
import { EmptyState, SectionHeader } from "../../../ui/components";
import { DashboardCard } from "./DashboardCard";
import type { ProgressionClaimResult, ProgressionSummary } from "../../../api/progression";
import type { Achievement, AchievementList, AchievementRecommendation } from "../../../api/achievements";
import { ActionButton, ProgressBar } from "./SharedControls";
import {
  achievementCategoryLabel,
  achievementProgressLabel,
  findGoal,
  pickAchievementFocus,
  rarityLabel
} from "../helpers";
import styles from "../styles";
import type { DerivedGameplayStep } from "../types";
import { FishTankOutcomeReceipt } from "./fishTankOutcomeReceipt";

export function ProgressionOverview({ progression }: { progression: ProgressionSummary | null }) {
  return (
    <View style={styles.progressionPanel}>
      <View style={styles.progressionHeader}>
        <View>
          <Text style={styles.darkKicker}>成长进度</Text>
          <Text style={styles.progressionLevel}>LV {progression?.level ?? 1}</Text>
        </View>
        <Text style={styles.progressionXp}>{progression?.experience ?? 0} XP</Text>
      </View>
      <ProgressBar
        value={progression?.currentLevelExperience ?? 0}
        max={progression?.nextLevelExperience ?? 100}
        color="#f0c95a"
        trackColor="#514d48"
      />
      <Text style={styles.progressionMeta}>
        距离下一级还差{" "}
        {(progression?.nextLevelExperience ?? 100) -
          (progression?.currentLevelExperience ?? 0)}{" "}
        XP
      </Text>
    </View>
  );
}

export function DailyGoals({
  progression,
  loading,
  onClaim
}: {
  progression: ProgressionSummary | null;
  loading: boolean;
  onClaim: () => void | Promise<void>;
}) {
  return (
    <GoalPeriodPanel
      kicker="今日目标"
      title="完成一点就算赢"
      period={progression?.dailyGoals ?? null}
      loading={loading}
      onClaim={onClaim}
    />
  );
}

export function WeeklyGoals({
  progression,
  loading,
  onClaim
}: {
  progression: ProgressionSummary | null;
  loading: boolean;
  onClaim: () => void | Promise<void>;
}) {
  return (
    <GoalPeriodPanel
      kicker="本周目标"
      title="这一周，慢慢攒"
      period={progression?.weeklyGoals ?? null}
      loading={loading}
      onClaim={onClaim}
    />
  );
}

export function GoalPeriodPanel({
  kicker,
  title,
  period,
  loading,
  onClaim
}: {
  kicker: string;
  title: string;
  period: ProgressionSummary["dailyGoals"] | null;
  loading: boolean;
  onClaim: () => void | Promise<void>;
}) {
  return (
    <DashboardCard>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <SectionHeader kicker={kicker} title={title} />
        </View>
        <Text style={styles.goalCount}>
          {period?.completed ?? 0}/{period?.total ?? 3}
        </Text>
      </View>
      {period?.goals.map((goal) => (
        <View key={goal.code} style={[styles.listRow, goal.completed && styles.listRowCompleted]}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{goal.title}</Text>
            <Text style={styles.rowMeta}>{goal.description}</Text>
            <ProgressBar
              value={goal.current}
              max={goal.target}
              color={goal.completed ? "#17a36b" : "#d4a838"}
              trackColor="#e2dbd0"
            />
          </View>
          <Text style={goal.completed ? styles.completedMark : styles.progressValue}>
            {goal.current}/{goal.target}
          </Text>
        </View>
      )) ?? <Text style={styles.emptyText}>正在读取今天的休息安排。</Text>}
      {period ? (
        <View style={styles.goalRewardRow}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>整组奖励</Text>
            <Text style={styles.rowMeta}>
              +{period.reward.score} 分 · 抽豆进度 +{period.reward.drawProgress}
            </Text>
          </View>
          <Text style={period.rewardClaimed ? styles.completedMark : styles.pendingMark}>
            {period.rewardClaimed
              ? "已领取"
              : period.allCompleted
                ? "待领取"
                : "未解锁"}
          </Text>
        </View>
      ) : null}
      {period?.allCompleted && !period.rewardClaimed ? (
        <ActionButton label="领取成长奖励" disabled={loading} onPress={onClaim} />
      ) : null}
    </DashboardCard>
  );
}

export function ProgressionClaimResultPanel({
  result,
  nextStep
}: {
  result: ProgressionClaimResult;
  nextStep: DerivedGameplayStep;
}) {
  return (
    <DashboardCard>
      <SectionHeader
        kicker={result.progression.leveledUp ? "等级提升" : "成长奖励"}
        title={
          result.progression.leveledUp
            ? `LV ${result.progression.previousLevel} → LV ${result.progression.currentLevel}`
            : result.awarded
              ? "这份努力被正式记下了"
              : "这份奖励已经领过了"
        }
      />
      <Text style={styles.copy}>
        {result.awarded
          ? "这组目标已经盖章，休息也能留下成长痕迹。"
          : "这份奖励已经领过，不重复发放，也不重复催你。"}
      </Text>
      <View style={styles.resultReceiptBox}>
        <Text style={styles.kicker}>奖励回执</Text>
        <Text style={styles.rowTitle}>
          得分 +{result.reward.score} · 抽豆进度 +{result.reward.drawProgress} · 机会 +
          {result.reward.drawChancesGranted}
        </Text>
      </View>
      <FishTankOutcomeReceipt outcomes={result.fishTankOutcomes} testID="goal-claim-fish-tank-outcomes" />
      <Text style={styles.helperText}>下一步：{nextStep.title}</Text>
    </DashboardCard>
  );
}

export function GoalBanner({
  goal
}: {
  goal: ProgressionSummary["dailyGoals"]["goals"][number] | null;
}) {
  return (
    <View style={[styles.goalBanner, goal?.completed && styles.goalBannerCompleted]}>
      <Text style={styles.kicker}>今日目标</Text>
      <Text style={styles.rowTitle}>{goal?.title ?? "完成当前玩法一次"}</Text>
      <Text style={styles.rowMeta}>
        {goal?.completed ? "今天已经完成，可以继续，但不用勉强。" : goal?.description}
      </Text>
    </View>
  );
}

export function AchievementFocusCard({
  achievement,
  unlockedCount,
  totalCount,
  onPress
}: {
  achievement: AchievementRecommendation | null;
  unlockedCount: number;
  totalCount: number;
  onPress: (achievement: AchievementRecommendation) => void;
}) {
  if (!achievement) {
    return (
      <View style={styles.resultBox}>
        <Text style={styles.rowTitle}>今天没有特别催你的成就</Text>
        <Text style={styles.helperText}>
          已解锁 {unlockedCount}/{totalCount}。没有红点逼你上班，挺好。
        </Text>
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(achievement)}
      style={styles.focusAchievementCard}
    >
      <View style={styles.flex}>
        <Text style={styles.kickerSection}>今日焦点</Text>
        <Text style={styles.rowTitle}>{achievement.name}</Text>
        <Text style={styles.rowMeta}>
          {achievement.recommendationReason} · {achievement.remainingEffortLabel}
        </Text>
        <ProgressBar
          value={achievement.progress.percent}
          max={100}
          color="#1f8f62"
          trackColor="#d5e9dc"
        />
      </View>
      <View style={styles.inlineActionButton}>
        <Text style={styles.inlineActionText}>{achievement.actionHint.label}</Text>
      </View>
    </Pressable>
  );
}

export function AchievementRecommendationSection({
  title,
  items,
  focusId,
  onPress
}: {
  title: string;
  items: AchievementRecommendation[];
  focusId?: string;
  onPress: (achievement: AchievementRecommendation) => void;
}) {
  const visibleItems = items.filter((achievement) => achievement.id !== focusId);
  if (!visibleItems.length) {
    return null;
  }
  return (
    <View style={styles.recommendationBlock}>
      <Text style={styles.kickerSection}>{title}</Text>
      {visibleItems.map((achievement) => (
        <Pressable
          accessibilityRole="button"
          key={achievement.id}
          onPress={() => onPress(achievement)}
          style={styles.recommendationRow}
        >
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{achievement.name}</Text>
            <Text style={styles.rowMeta}>
              {achievement.recommendationReason} · {achievement.remainingEffortLabel}
            </Text>
          </View>
          <View style={styles.inlineActionButton}>
            <Text style={styles.inlineActionText}>{achievement.actionHint?.label ?? "去完成"}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function AchievementWallRow({ achievement }: { achievement: Achievement }) {
  return (
    <View style={[styles.listRow, achievement.unlockedAt && styles.listRowCompleted]}>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{achievement.name}</Text>
        <Text style={styles.rowMeta}>
          {achievementCategoryLabel(achievement.category ?? "new_user")} ·{" "}
          {rarityLabel(achievement.rarity ?? "common")} ·{" "}
          {achievement.unlockSummary ?? achievement.description}
        </Text>
        <Text style={styles.smallCopy}>{achievement.description}</Text>
        <ProgressBar
          value={achievement.progress.percent}
          max={100}
          color={achievement.unlockedAt ? "#1f8f62" : "#d4a838"}
          trackColor="#e2dbd0"
        />
      </View>
      <Text style={achievement.unlockedAt ? styles.completedMark : styles.progressValue}>
        {achievement.unlockedAt ? "已解锁" : achievementProgressLabel(achievement.progress)}
      </Text>
    </View>
  );
}

export function pickAchievementFocusExport(list: AchievementList | null) {
  return pickAchievementFocus(list);
}
