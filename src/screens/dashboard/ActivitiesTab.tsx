import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ArtSlot } from "../../ui/art/ArtSlot";
import { EmptyState, RewardRow, SectionHeader, StatusBadge } from "../../ui/components";
import { MotionFeedback } from "../../ui/motion/MotionFeedback";
import { DashboardCard } from "./parts/DashboardCard";
import { ActivityInteractionRunner } from "./parts/ActivityInteractionRunner";
import { StepReceipt } from "./parts/activity-interactions/StepReceipt";
import { ActionButton, CategoryChip } from "./parts/SharedControls";
import { GoalBanner } from "./parts/GoalPanels";
import {
  activityCategories,
  activityCategoryLabel,
  activityInteractionSummaryLabel,
  deriveActivityDisplayState,
  deriveHistorySections,
  difficultyLabel,
  flavorLabel,
  formatActivityTime,
  formatCooldown,
  formatHistorySessionTime,
  historyStatusLabel,
  resolveActivityPresentation,
  resolveHistoryPresentation
} from "./helpers";
import styles from "./styles";
import type { ActivitiesTabProps } from "./types";
import type { TodayLoopAction } from "../../gameplay/todayLoop";
import type { ActivityHistorySession, ActivitySkipReason } from "../../api/activities";

const activityFeedbackOptions: Array<{
  label: string;
  value: Parameters<ActivitiesTabProps["actions"]["submitFeedback"]>[0];
}> = [
  { label: "有点意思", value: "liked" },
  { label: "还行", value: "neutral" },
  { label: "下次别来这个", value: "dislike_similar" },
  { label: "来点更怪的", value: "want_weirder" },
  { label: "短一点", value: "shorter" }
];

export function ActivitiesTab({
  loading,
  goal,
  assignment,
  result,
  catalog,
  history,
  historyLoading,
  historyError,
  historyCursor,
  feedbackAck,
  message,
  unavailable,
  category,
  progress,
  skipReason,
  nextStep,
  todayLoop,
  actions
}: ActivitiesTabProps) {
  const activityPresentation = assignment ? resolveActivityPresentation(assignment) : null;
  const activityResultPresentation = result ? resolveActivityPresentation(result.assignment) : null;
  const activityAccentColor = activityPresentation?.accentColor ?? "#2f6f8f";
  const displayState = deriveActivityDisplayState(assignment, progress, unavailable);
  const activityDelight =
    todayLoop.resultDelight?.kind === "activity" ? todayLoop.resultDelight : null;

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
        {displayState.kind === "empty" || displayState.kind === "unavailable" ? (
          <View style={{ alignItems: "center" }}>
            <ArtSlot
              slotId={displayState.kind === "unavailable" ? "empty-state-generic" : "empty-state-activities"}
              size={80}
              style={{ marginBottom: 12 }}
            />
            <EmptyState
              title={displayState.kind === "unavailable" ? "暂无可推荐任务" : "还没有任务"}
              body={
                displayState.kind === "unavailable"
                  ? "当前任务都在冷却中，晚一点再来领取。"
                  : "给自己找个合理的离线理由，点下面的按钮抽一个"
              }
              icon={displayState.kind === "unavailable" ? "🌫️" : "🪣"}
            />
          </View>
        ) : (
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
                  tone={displayState.kind === "completed" ? "completed" : "active"}
                  label={activityCategoryLabel(assignment!.category)}
                />
                <StatusBadge tone="default" label={difficultyLabel(assignment!.difficulty)} />
              </View>
              <Text style={styles.activityHeadline}>
                {activityPresentation?.headline ?? assignment!.title}
              </Text>
              <Text style={styles.activityScene}>
                {activityPresentation?.scene ?? assignment!.description}
              </Text>
              <View style={styles.activityPromptBox}>
                <Text style={styles.activityPrompt}>
                  {activityPresentation?.prompt ?? assignment!.description}
                </Text>
              </View>
              <View style={{ marginTop: 8 }}>
                <RewardRow
                  icon="⭐"
                  label="预计奖励"
                  value={`+${assignment!.rewardPreview.score} 分 · 进度 +${assignment!.rewardPreview.drawProgress}`}
                  positive
                />
                <RewardRow
                  icon="🫘"
                  label="交互方式"
                  value={assignment!.interactionSummary.flavorLabel}
                />
              </View>
            </View>
            {assignment!.recommendationExplanation ? (
              <Text style={styles.helperText}>
                推荐理由：{assignment!.recommendationExplanation}
              </Text>
            ) : null}
            {displayState.kind === "completed" ? (
              <ActivityAssignmentStatusPanel
                title="本次活动已完成"
                body="互动记录和奖励回执已经归档在下面，不用再重复操作。"
              />
            ) : displayState.kind === "skipped" ? (
              <ActivityAssignmentStatusPanel
                title="任务已放弃"
                body="这次没有发放奖励，可以换一个更顺眼的任务。"
              />
            ) : (
              <>
                <ActivityInteractionRunner
                  assignment={assignment!}
                  progress={progress}
                  onChange={actions.setProgress}
                />
                <ActionButton
                  label={
                    displayState.kind === "active-ready"
                      ? "领取互动奖励"
                      : "先完成互动步骤"
                  }
                  disabled={loading || displayState.kind !== "active-ready"}
                  onPress={actions.completeActivity}
                />
              </>
            )}
            {displayState.kind === "active-incomplete" || displayState.kind === "active-ready" ? (
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
                {activityDelight?.title ?? result.resultTitle ?? "活动奖励已结算"}
              </Text>
              <Text style={styles.helperText}>
                {activityDelight?.copy ?? result.resultCopy ?? "这次摸鱼记录已经归档。"}
              </Text>
              <View style={styles.resultReceiptBox}>
                <Text style={styles.kicker}>奖励回执</Text>
                <Text style={styles.rowTitle}>
                  {activityDelight?.rewardLabel ??
                    `+${result.reward.score} 分 · 进度 +${result.reward.drawProgress} · 抽豆机会 +${result.reward.drawChancesGranted}`}
                </Text>
              </View>
              {result.stepSummaries?.length ? (
                <StepReceipt summaries={result.stepSummaries} />
              ) : null}
              <Text style={styles.helperText}>{result.feedback}</Text>
              <ActivityFeedbackPrompt
                loading={loading}
                acknowledgement={feedbackAck?.acknowledgement ?? null}
                onSubmit={actions.submitFeedback}
              />
              <Text style={styles.helperText}>
                下一步：{todayLoop.resultFollowUps.primary?.title ?? nextStep.title}
              </Text>
              <ResultFollowUps
                loading={loading}
                todayLoop={todayLoop}
                onAction={actions.runTodayLoopAction}
              />
            </View>
          </MotionFeedback>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {displayState.kind !== "active-incomplete" && displayState.kind !== "active-ready" ? (
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
        <ActivityHistorySection
          loading={historyLoading}
          error={historyError}
          history={history}
          cursor={historyCursor}
          onTrySimilar={actions.trySimilarActivity}
          onLoadMore={actions.loadMoreHistory}
        />
      </DashboardCard>
    </>
  );
}

export function ActivityHistorySection({
  loading,
  error,
  history,
  cursor,
  onTrySimilar,
  onLoadMore
}: {
  loading: boolean;
  error: string | null;
  history: ActivitiesTabProps["history"];
  cursor: string | null;
  onTrySimilar: ActivitiesTabProps["actions"]["trySimilarActivity"];
  onLoadMore: ActivitiesTabProps["actions"]["loadMoreHistory"];
}) {
  const { today, recent } = deriveHistorySections(history);
  const hasAny = today.length > 0 || recent.length > 0;

  return (
    <View>
      <SectionHeader kicker="活动记录" title="最近休息过什么" />
      {error ? <Text style={styles.message}>{error}</Text> : null}
      {!hasAny && !loading ? (
        <View style={{ alignItems: "center" }}>
          <ArtSlot slotId="empty-state-activities" size={64} style={{ marginBottom: 12 }} />
          <EmptyState
            title="还没有完成记录"
            body="挑一个顺眼的活动开始今天的摸鱼"
            icon="🐟"
          />
        </View>
      ) : null}
      {today.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.kicker}>今日</Text>
          {today.map((session) => (
            <ActivityHistoryCard
              key={session.assignmentId}
              session={session}
              onTrySimilar={onTrySimilar}
            />
          ))}
        </View>
      ) : null}
      {recent.length > 0 ? (
        <View>
          {today.length > 0 ? <Text style={styles.kicker}>最近</Text> : null}
          {recent.map((session) => (
            <ActivityHistoryCard
              key={session.assignmentId}
              session={session}
              onTrySimilar={onTrySimilar}
            />
          ))}
        </View>
      ) : null}
      {cursor ? (
        <ActionButton
          label={loading ? "加载中..." : "加载更多"}
          dark
          disabled={loading}
          onPress={onLoadMore}
        />
      ) : null}
    </View>
  );
}

function ActivityHistoryCard({
  session,
  onTrySimilar
}: {
  session: ActivityHistorySession;
  onTrySimilar: ActivitiesTabProps["actions"]["trySimilarActivity"];
}) {
  const [expanded, setExpanded] = useState(false);
  const presentation = resolveHistoryPresentation(session);
  const accentColor = presentation.accentColor ?? "#2f6f8f";
  const statusLabel = historyStatusLabel(session.status, session.rewardSummary.rewarded);

  return (
    <View style={[styles.historyCard, { borderColor: accentColor }]}>
      <Pressable onPress={() => setExpanded((value) => !value)}>
        <View style={styles.historyCardTopRow}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{session.title}</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
              <StatusBadge
                tone={session.status === "completed" ? "completed" : "default"}
                label={activityCategoryLabel(session.category)}
              />
              <StatusBadge tone="default" label={difficultyLabel(session.difficulty)} />
              {session.flavor ? (
                <StatusBadge tone="default" label={flavorLabel(session.flavor)} />
              ) : null}
            </View>
            <Text style={styles.rowMeta}>
              {statusLabel} · {formatHistorySessionTime(session.sessionAt)}
            </Text>
          </View>
          <Text
            style={
              session.rewardSummary.rewarded ? styles.completedMark : styles.pendingMark
            }
          >
            {session.rewardSummary.rewarded ? "已奖励" : "无奖励"}
          </Text>
        </View>
      </Pressable>
      {expanded ? (
        <ActivityHistoryDetail
          session={session}
          presentation={presentation}
          onTrySimilar={onTrySimilar}
        />
      ) : null}
    </View>
  );
}

function ActivityHistoryDetail({
  session,
  presentation,
  onTrySimilar
}: {
  session: ActivityHistorySession;
  presentation: ReturnType<typeof resolveHistoryPresentation>;
  onTrySimilar: ActivitiesTabProps["actions"]["trySimilarActivity"];
}) {
  return (
    <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: "#e5e5e5" }}>
      <Text style={styles.smallCopy}>{presentation.scene ?? session.description}</Text>
      {session.status === "completed" ? (
        <>
          <View style={styles.resultReceiptBox}>
            <Text style={styles.kicker}>奖励回执</Text>
            <Text style={styles.rowTitle}>
              +{session.rewardSummary.score} 分 · 进度 +{session.rewardSummary.drawProgress}
            </Text>
          </View>
          {session.feedback ? (
            <Text style={styles.helperText}>反馈：{session.feedback.acknowledgement}</Text>
          ) : null}
        </>
      ) : (
        <View style={styles.resultReceiptBox}>
          <Text style={styles.kicker}>无奖励</Text>
          <Text style={styles.helperText}>
            {session.skipReason ? `跳过原因：${skipReasonLabel(session.skipReason)}` : "这次没有发放奖励。"}
          </Text>
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
        <ActionButton
          label="来个类似的"
          dark
          onPress={() => onTrySimilar(session)}
        />
      </View>
    </View>
  );
}

function skipReasonLabel(reason: ActivitySkipReason): string {
  return (
    {
      not_interested: "没兴趣",
      too_much_work: "太麻烦",
      not_convenient: "不方便",
      want_weirder: "想来点怪的",
      other: "换个口味"
    }[reason] ?? reason
  );
}

function ActivityFeedbackPrompt({
  loading,
  acknowledgement,
  onSubmit
}: {
  loading: boolean;
  acknowledgement: string | null;
  onSubmit: ActivitiesTabProps["actions"]["submitFeedback"];
}) {
  return (
    <View style={styles.activityFeedbackBox}>
      <Text style={styles.kicker}>这次摸鱼感觉如何？</Text>
      {acknowledgement ? (
        <Text style={styles.helperText}>{acknowledgement}</Text>
      ) : (
        <View style={styles.activityFeedbackRow}>
          {activityFeedbackOptions.map((option) => (
            <CategoryChip
              key={option.value}
              label={option.label}
              selected={false}
              onPress={() => {
                if (!loading) {
                  void onSubmit(option.value);
                }
              }}
            />
          ))}
        </View>
      )}
      {acknowledgement ? null : (
        <Text style={styles.smallCopy}>可选反馈，只影响以后推荐，不影响本次奖励。</Text>
      )}
    </View>
  );
}

function ActivityAssignmentStatusPanel({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={styles.interactionPanel}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>互动流程</Text>
          <Text style={styles.rowTitle}>{title}</Text>
        </View>
        <Text style={styles.completedMark}>完成</Text>
      </View>
      <Text style={styles.helperText}>{body}</Text>
    </View>
  );
}

function ResultFollowUps({
  loading,
  todayLoop,
  onAction
}: {
  loading: boolean;
  todayLoop: ActivitiesTabProps["todayLoop"];
  onAction: (action: TodayLoopAction) => void | Promise<void>;
}) {
  const { primary, secondary } = todayLoop.resultFollowUps;
  if (!primary && !secondary.length) {
    return null;
  }
  return (
    <View style={styles.resultFollowUpBox}>
      <Text style={styles.kicker}>接下来</Text>
      {primary ? (
        <ActionButton
          label={primary.actionLabel}
          disabled={loading}
          onPress={() => onAction(primary)}
        />
      ) : null}
      {secondary.length ? (
        <View style={styles.todayRouteSecondaryRow}>
          {secondary.map((action) => (
            <ActionButton
              key={`${action.kind}-${action.title}`}
              label={action.actionLabel}
              dark
              disabled={loading}
              onPress={() => onAction(action)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
