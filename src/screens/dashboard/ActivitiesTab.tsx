import { ScrollView, Text, View } from "react-native";
import { ArtSlot } from "../../ui/art/ArtSlot";
import { EmptyState, RewardRow, SectionHeader, StatusBadge } from "../../ui/components";
import { MotionFeedback } from "../../ui/motion/MotionFeedback";
import { DashboardCard } from "./parts/DashboardCard";
import { ActivityInteractionRunner } from "./parts/ActivityInteractionRunner";
import { ActionButton, CategoryChip } from "./parts/SharedControls";
import { GoalBanner } from "./parts/GoalPanels";
import {
  activityCategories,
  activityCategoryLabel,
  activityInteractionSummaryLabel,
  difficultyLabel,
  formatActivityTime,
  formatCooldown,
  isActivityInteractionComplete,
  resolveActivityPresentation
} from "./helpers";
import styles from "./styles";
import type { ActivitiesTabProps } from "./types";

export function ActivitiesTab({
  loading,
  goal,
  assignment,
  result,
  catalog,
  history,
  message,
  unavailable,
  category,
  progress,
  skipReason,
  nextStep,
  actions
}: ActivitiesTabProps) {
  const activityPresentation = assignment ? resolveActivityPresentation(assignment) : null;
  const activityResultPresentation = result ? resolveActivityPresentation(result.assignment) : null;
  const activityAccentColor = activityPresentation?.accentColor ?? "#2f6f8f";
  const activityCanComplete = assignment
    ? isActivityInteractionComplete(assignment, progress)
    : false;

  return (
    <>
      <GoalBanner goal={goal} />
      <DashboardCard>
        <SectionHeader kicker="这次想怎么休息" title="选一个偏好，推荐会更懂你" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <CategoryChip
            label="全部"
            selected={category === null}
            onPress={() => actions.setCategory(null)}
          />
          {activityCategories.map((activityCategory) => (
            <CategoryChip
              key={activityCategory}
              label={activityCategoryLabel(activityCategory)}
              selected={category === activityCategory}
              onPress={() => actions.setCategory(activityCategory)}
            />
          ))}
        </ScrollView>
      </DashboardCard>
      <DashboardCard>
        {assignment ? (
          <>
            <View
              style={[
                styles.activityHeroCard,
                { borderColor: activityAccentColor }
              ]}
            >
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <ArtSlot slotId="activities-card-illustration" size={80} />
              </View>
              <View style={styles.activityCardTopRow}>
                <Text
                  style={[
                    styles.activityBadge,
                    { backgroundColor: activityAccentColor }
                  ]}
                >
                  {activityPresentation?.badge ?? "当前任务"}
                </Text>
                <Text style={styles.activityStat}>
                  {activityPresentation?.statLabel ?? "摸鱼指数"}{" "}
                  {activityPresentation?.statValue ?? "--"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <StatusBadge
                  tone="active"
                  label={activityCategoryLabel(assignment.category)}
                />
                <StatusBadge tone="default" label={difficultyLabel(assignment.difficulty)} />
              </View>
              <Text style={styles.activityHeadline}>
                {activityPresentation?.headline ?? assignment.title}
              </Text>
              <Text style={styles.activityScene}>
                {activityPresentation?.scene ?? assignment.description}
              </Text>
              <View style={styles.activityPromptBox}>
                <Text style={styles.activityPrompt}>
                  {activityPresentation?.prompt ?? assignment.description}
                </Text>
              </View>
              <View style={{ marginTop: 8 }}>
                <RewardRow
                  icon="⭐"
                  label="预计奖励"
                  value={`+${assignment.rewardPreview.score} 分 · 进度 +${assignment.rewardPreview.drawProgress}`}
                  positive
                />
                <RewardRow
                  icon="🫘"
                  label="交互方式"
                  value={assignment.interactionSummary.flavorLabel}
                />
              </View>
            </View>
            {assignment.recommendationExplanation ? (
              <Text style={styles.helperText}>
                推荐理由：{assignment.recommendationExplanation}
              </Text>
            ) : null}
            <ActivityInteractionRunner
              assignment={assignment}
              progress={progress}
              onChange={actions.setProgress}
            />
            <ActionButton
              label={
                assignment.status === "active"
                  ? activityCanComplete
                    ? "领取互动奖励"
                    : "先完成互动步骤"
                  : "本次活动已完成"
              }
              disabled={
                loading ||
                assignment.status !== "active" ||
                !activityCanComplete
              }
              onPress={actions.completeActivity}
            />
            {assignment.status === "active" ? (
              <>
                <View style={styles.skipReasonBox}>
                  <Text style={styles.kicker}>不想做的原因</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryRow}
                  >
                    {[
                      { value: "not_interested", label: "没兴趣" },
                      { value: "too_much_work", label: "太麻烦" },
                      { value: "not_convenient", label: "不方便" },
                      { value: "want_weirder", label: "来点怪的" },
                      { value: "other", label: "换个口味" }
                    ].map((option) => (
                      <CategoryChip
                        key={option.value}
                        label={option.label}
                        selected={skipReason === option.value}
                        onPress={() => actions.setSkipReason(option.value as typeof skipReason)}
                      />
                    ))}
                  </ScrollView>
                </View>
                <ActionButton
                  label="按原因换一个"
                  dark
                  disabled={loading}
                  onPress={actions.skipActivity}
                />
              </>
            ) : null}
          </>
        ) : (
          <View style={{ alignItems: "center" }}>
            <ArtSlot
              slotId="empty-state-activities"
              size={80}
              style={{ marginBottom: 12 }}
            />
            <EmptyState
              title="还没有任务"
              body="给自己找个合理的离线理由，点下面的按钮抽一个"
              icon="🪣"
            />
          </View>
        )}
        {result ? (
          <MotionFeedback
            variant="activity-complete"
            trigger={result.assignment.assignmentId}
            animateOnMount
          >
            <View
              style={[
                styles.activityResultCertificate,
                { borderColor: activityResultPresentation?.accentColor ?? "#17a36b" }
              ]}
            >
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <ArtSlot slotId="activities-card-illustration" size={72} />
              </View>
              <Text
                style={[
                  styles.activityBadge,
                  { backgroundColor: activityResultPresentation?.accentColor ?? "#17a36b" }
                ]}
              >
                {activityResultPresentation?.badge ?? "活动完成"}
              </Text>
              <Text style={styles.activityResultTitle}>
                {result.resultTitle ?? "活动奖励已结算"}
              </Text>
              {result.resultCopy ? (
                <Text style={styles.helperText}>{result.resultCopy}</Text>
              ) : null}
              <Text style={styles.rowMeta}>
                +{result.reward.score} 分 · 进度 +
                {result.reward.drawProgress} · 抽豆机会 +
                {result.reward.drawChancesGranted}
              </Text>
              <Text style={styles.helperText}>{result.feedback}</Text>
              <Text style={styles.helperText}>下一步：{nextStep.title}</Text>
            </View>
          </MotionFeedback>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {assignment?.status !== "active" ? (
          <ActionButton
            label={
              unavailable
                ? "暂无可领取任务"
                : assignment
                  ? "按偏好再推荐一个"
                  : "推荐一个摸鱼任务"
            }
            disabled={loading || unavailable}
            onPress={actions.randomActivity}
          />
        ) : null}
      </DashboardCard>
      <DashboardCard>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <SectionHeader
              kicker="活动目录"
              title={category ? activityCategoryLabel(category) : "全部活动"}
            />
          </View>
          <Text style={styles.goalCount}>{catalog?.items.length ?? 0}</Text>
        </View>
        {catalog?.items.length ? (
          catalog.items.map((item) => {
            const itemPresentation = resolveActivityPresentation(item);
            return (
              <View key={item.templateId} style={styles.activityCatalogRow}>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowMeta}>
                    {activityCategoryLabel(item.category)} ·{" "}
                    {difficultyLabel(item.difficulty)} · 完成 {item.completedCount} 次
                  </Text>
                  <Text style={styles.rowMeta}>
                    {itemPresentation.badge} ·{" "}
                    {activityInteractionSummaryLabel(item.interactionSummary)}
                  </Text>
                  <Text style={styles.smallCopy}>{item.description}</Text>
                </View>
                <Text style={item.eligible ? styles.readyMark : styles.cooldownMark}>
                  {item.eligible
                    ? "可推荐"
                    : formatCooldown(item.cooldownRemainingSeconds)}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={{ alignItems: "center" }}>
            <ArtSlot
              slotId="empty-state-generic"
              size={64}
              style={{ marginBottom: 12 }}
            />
            <EmptyState
              title="这个分类暂时没有活动"
              body="换个分类，或者抽一个随机的"
              icon="🌫️"
            />
          </View>
        )}
      </DashboardCard>
      <DashboardCard>
        <SectionHeader kicker="完成记录" title="最近休息过什么" />
        {history.length ? (
          history.map((item) => (
            <View key={item.assignmentId} style={styles.listRow}>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>
                  {activityCategoryLabel(item.category)} ·{" "}
                  {formatActivityTime(item.completedAt ?? item.assignedAt)}
                </Text>
              </View>
              <Text style={item.rewarded ? styles.completedMark : styles.pendingMark}>
                {item.rewarded ? "已奖励" : "无奖励"}
              </Text>
            </View>
          ))
        ) : (
          <View style={{ alignItems: "center" }}>
            <ArtSlot
              slotId="empty-state-activities"
              size={64}
              style={{ marginBottom: 12 }}
            />
            <EmptyState
              title="还没有完成记录"
              body="挑一个顺眼的活动开始今天的摸鱼"
              icon="🐟"
            />
          </View>
        )}
      </DashboardCard>
    </>
  );
}
