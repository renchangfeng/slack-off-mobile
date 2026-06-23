import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  AchievementApi,
  type AchievementList,
  type CosmeticInventory
} from "../api/achievements";
import {
  ActivityApi,
  type ActivityAssignment,
  type ActivityCatalog,
  type ActivityCategory,
  type ActivityCompleteResult
} from "../api/activities";
import { BeanApi, type BeanCollection, type BeanDrawResult } from "../api/beans";
import { ApiClient } from "../api/client";
import { CheckInApi, type CheckInFinishResult, type CheckInSession } from "../api/checkins";
import {
  LeaderboardApi,
  type LeaderboardResponse,
  type LeaderboardWindow
} from "../api/leaderboards";
import {
  ProgressionApi,
  type ProgressionClaimResult,
  type ProgressionPeriod,
  type ProgressionSummary
} from "../api/progression";
import { env } from "../config/env";
import {
  dashboardTabs,
  getDashboardTab,
  type DashboardTab
} from "../gameplay/dashboardTabs";
import { deriveGameplayStep } from "../gameplay/nextStep";
import { logEvent } from "../observability/logger";

type HomeScreenProps = {
  authLabel?: string;
  getAccessToken: () => Promise<string | null>;
  onSignOut: () => Promise<void>;
};

export function HomeScreen({ authLabel, getAccessToken, onSignOut }: HomeScreenProps) {
  const api = useMemo(() => {
    const client = new ApiClient({ baseUrl: env.apiBaseUrl, getAccessToken });
    return {
      achievements: new AchievementApi(client),
      activities: new ActivityApi(client),
      beans: new BeanApi(client),
      checkIns: new CheckInApi(client),
      leaderboards: new LeaderboardApi(client),
      progression: new ProgressionApi(client)
    };
  }, [getAccessToken]);

  const [selectedTab, setSelectedTab] = useState<DashboardTab>("home");
  const [activeSession, setActiveSession] = useState<CheckInSession | null>(null);
  const [progression, setProgression] = useState<ProgressionSummary | null>(null);
  const [progressionClaim, setProgressionClaim] = useState<ProgressionClaimResult | null>(null);
  const [beanCollection, setBeanCollection] = useState<BeanCollection | null>(null);
  const [beanDrawResult, setBeanDrawResult] = useState<BeanDrawResult | null>(null);
  const [lastResult, setLastResult] = useState<CheckInFinishResult | null>(null);
  const [achievementList, setAchievementList] = useState<AchievementList | null>(null);
  const [activityAssignment, setActivityAssignment] = useState<ActivityAssignment | null>(null);
  const [activityResult, setActivityResult] = useState<ActivityCompleteResult | null>(null);
  const [activityMessage, setActivityMessage] = useState<string | null>(null);
  const [activityUnavailable, setActivityUnavailable] = useState(false);
  const [activityCategory, setActivityCategory] = useState<ActivityCategory | null>(null);
  const [activityCatalog, setActivityCatalog] = useState<ActivityCatalog | null>(null);
  const [activityHistory, setActivityHistory] = useState<ActivityAssignment[]>([]);
  const [cosmeticInventory, setCosmeticInventory] = useState<CosmeticInventory | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [leaderboardWindow, setLeaderboardWindow] = useState<LeaderboardWindow>("daily");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());

  const refreshProgression = useCallback(async () => {
    const response = await api.progression.getSummary();
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setProgression(response.data);
  }, [api.progression]);

  const refreshBeans = useCallback(async () => {
    const response = await api.beans.getCollection();
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setBeanCollection(response.data);
  }, [api.beans]);

  const refreshAchievements = useCallback(async () => {
    const [achievementResponse, cosmeticResponse] = await Promise.all([
      api.achievements.getAchievements(),
      api.achievements.getCosmetics()
    ]);
    if (achievementResponse.error || cosmeticResponse.error) {
      setMessage(
        achievementResponse.error?.message ??
          cosmeticResponse.error?.message ??
          "个人档案加载失败"
      );
      return;
    }
    setAchievementList(achievementResponse.data);
    setCosmeticInventory(cosmeticResponse.data);
  }, [api.achievements]);

  const refreshLeaderboard = useCallback(
    async (window: LeaderboardWindow = leaderboardWindow) => {
      const response = await api.leaderboards.getLeaderboard(window);
      if (response.error) {
        setMessage(response.error.message);
        return;
      }
      setLeaderboard(response.data);
    },
    [api.leaderboards, leaderboardWindow]
  );

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const activeResponse = await api.checkIns.getActive();
    if (activeResponse.error) {
      setMessage(activeResponse.error.message);
    } else {
      setActiveSession(activeResponse.data);
    }
    await Promise.all([
      refreshProgression(),
      refreshBeans(),
      refreshAchievements(),
      refreshLeaderboard()
    ]);
    setLoading(false);
  }, [
    api.checkIns,
    refreshAchievements,
    refreshBeans,
    refreshLeaderboard,
    refreshProgression
  ]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    if (!activeSession) {
      return;
    }
    setClockNow(Date.now());
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  useEffect(() => {
    if (selectedTab === "activities") {
      void refreshActivityData(activityCategory);
    }
  }, [activityCategory, selectedTab]);

  async function refreshActivityData(category: ActivityCategory | null = activityCategory) {
    const [catalogResponse, historyResponse] = await Promise.all([
      api.activities.getCatalog(category ?? undefined),
      api.activities.getHistory()
    ]);
    if (catalogResponse.error || historyResponse.error) {
      setActivityMessage(
        catalogResponse.error?.message ??
          historyResponse.error?.message ??
          "活动资料加载失败"
      );
      return;
    }
    setActivityCatalog(catalogResponse.data);
    setActivityHistory(historyResponse.data?.items ?? []);
  }

  async function refreshAfterReward() {
    await Promise.all([
      refreshProgression(),
      refreshBeans(),
      refreshAchievements(),
      refreshLeaderboard()
    ]);
  }

  async function claimProgressionReward(period: ProgressionPeriod) {
    setLoading(true);
    setMessage(null);
    setNotice(null);
    setProgressionClaim(null);
    const response = await api.progression.claim(period);
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    if (!response.data) {
      setMessage("成长奖励结果走丢了，请稍后重试。");
      return;
    }
    setProgressionClaim(response.data);
    setNotice(
      response.data.awarded
        ? `${period === "daily" ? "今日" : "本周"}成长奖励已领取。`
        : "这份成长奖励已经领取过了。"
    );
    await refreshAfterReward();
  }

  async function startSession() {
    setLoading(true);
    setMessage(null);
    setNotice(null);
    setLastResult(null);
    const response = await api.checkIns.start();
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setActiveSession(response.data);
    setClockNow(Date.now());
    setNotice("计时已经开始。休息够了再回来结算。");
    logEvent("info", "analytics.checkin.started", { sessionId: response.data?.id });
  }

  async function finishSession() {
    if (!activeSession) {
      return;
    }
    setLoading(true);
    setMessage(null);
    setNotice(null);
    const response = await api.checkIns.finish(activeSession.id);
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setActiveSession(null);
    setLastResult(response.data);
    setNotice("打卡已结算，今日进度也同步更新了。");
    logAchievementUnlocks(response.data?.reward.achievementsUnlocked ?? []);
    await refreshAfterReward();
  }

  async function drawBean() {
    setLoading(true);
    setMessage(null);
    setNotice(null);
    const response = await api.beans.draw();
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setBeanDrawResult(response.data);
    setNotice(
      `抽到了${response.data?.bean.name ?? "一颗豆"}，还剩 ${response.data?.remainingDrawChances ?? 0} 次机会。`
    );
    logAchievementUnlocks(response.data?.achievementsUnlocked ?? []);
    await refreshAfterReward();
  }

  async function randomActivity() {
    setLoading(true);
    setMessage(null);
    setNotice(null);
    setActivityMessage(null);
    setActivityResult(null);
    const response = await api.activities.random(activityCategory ?? undefined);
    setLoading(false);
    if (response.error) {
      if (response.error.code === "NO_ELIGIBLE_ACTIVITY") {
        setActivityUnavailable(true);
        setActivityMessage("当前任务都在冷却中，晚一点再来领取。");
      } else {
        setActivityMessage(response.error.message);
      }
      return;
    }
    setActivityUnavailable(false);
    setActivityAssignment(response.data);
    setNotice("任务已领取。完成后回到活动页领取奖励。");
    await refreshActivityData();
  }

  async function completeActivity() {
    if (!activityAssignment) {
      return;
    }
    setLoading(true);
    setMessage(null);
    setNotice(null);
    setActivityMessage(null);
    const response = await api.activities.complete(activityAssignment.assignmentId);
    setLoading(false);
    if (response.error) {
      setActivityMessage(response.error.message);
      return;
    }
    if (!response.data) {
      setActivityMessage("活动结果走丢了，请稍后重试。");
      return;
    }
    setActivityResult(response.data);
    setActivityAssignment(response.data.assignment);
    setNotice(
      response.data.reward.drawChancesGranted > 0
        ? `活动完成，获得 ${response.data.reward.drawChancesGranted} 次抽豆机会。`
        : "活动完成，奖励和今日目标已经更新。"
    );
    logAchievementUnlocks(response.data.reward.achievementsUnlocked);
    await Promise.all([refreshAfterReward(), refreshActivityData()]);
  }

  async function equipCosmetic(id: string) {
    setLoading(true);
    setMessage(null);
    const response = await api.achievements.equipCosmetic(id);
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    await Promise.all([refreshAchievements(), refreshLeaderboard()]);
  }

  async function selectLeaderboardWindow(window: LeaderboardWindow) {
    setLeaderboardWindow(window);
    await refreshLeaderboard(window);
  }

  const elapsedLabel = activeSession ? formatDuration(activeSession.startedAt, clockNow) : "00:00";
  const activeSessionOverLimit = activeSession
    ? clockNow - Date.parse(activeSession.startedAt) > 45 * 60 * 1000
    : false;
  const unlockedAchievements =
    achievementList?.achievements.filter((achievement) => achievement.unlockedAt) ?? [];
  const recentUnlocks = [
    ...(lastResult?.reward.achievementsUnlocked ?? []),
    ...(beanDrawResult?.achievementsUnlocked ?? [])
  ];
  const nextStep = deriveGameplayStep({
    hasActiveCheckIn: Boolean(activeSession),
    drawChances: beanCollection?.drawChances ?? 0,
    activityStatus: activityAssignment?.status,
    activityUnavailable,
    hasProgress: Boolean(
      lastResult ||
        activityResult ||
        beanDrawResult ||
        (beanCollection?.drawProgress ?? 0) > 0 ||
        activityAssignment
    )
  });
  const tabMeta = getDashboardTab(selectedTab);

  async function runNextStep() {
    if (nextStep.kind === "start-checkin") {
      setSelectedTab("home");
      await startSession();
      return;
    }
    if (nextStep.kind === "finish-checkin") {
      setSelectedTab("home");
      await finishSession();
      return;
    }
    if (nextStep.kind === "draw-bean") {
      setSelectedTab("beans");
      await drawBean();
      return;
    }
    if (nextStep.kind === "complete-activity") {
      setSelectedTab("activities");
      await completeActivity();
      return;
    }
    setSelectedTab("activities");
    await randomActivity();
  }

  return (
    <View style={styles.app}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>Slack Off</Text>
          <Text style={styles.pageTitle}>{tabMeta.title}</Text>
          <Text style={styles.pageSubtitle}>{tabMeta.subtitle}</Text>
        </View>

        {loading ? <ActivityIndicator color="#232323" style={styles.topLoader} /> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        {selectedTab === "home" ? (
          <>
            <ProgressionOverview progression={progression} />
            {progressionClaim ? <ProgressionClaimResultPanel result={progressionClaim} /> : null}
            <DailyGoals
              progression={progression}
              loading={loading}
              onClaim={() => claimProgressionReward("daily")}
            />
            <WeeklyGoals
              progression={progression}
              loading={loading}
              onClaim={() => claimProgressionReward("weekly")}
            />
            <View style={styles.panel}>
              <Text style={styles.kicker}>当前打卡</Text>
              <Text style={styles.timer}>{elapsedLabel}</Text>
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
                  onPress={startSession}
                />
                <ActionButton
                  label="结束"
                  dark
                  disabled={loading || !activeSession}
                  onPress={finishSession}
                />
              </View>
            </View>
            <View style={styles.nextStepPanel}>
              <Text style={styles.darkKicker}>下一步</Text>
              <Text style={styles.nextStepTitle}>{nextStep.title}</Text>
              <Text style={styles.nextStepCopy}>{nextStep.description}</Text>
              <ActionButton label={nextStep.actionLabel} onPress={runNextStep} disabled={loading} />
            </View>
            {lastResult ? <CheckInResult result={lastResult} /> : null}
            {recentUnlocks.length ? (
              <View style={styles.panel}>
                <Text style={styles.kicker}>刚刚解锁</Text>
                {recentUnlocks.map((achievement) => (
                  <View key={achievement.id} style={styles.listRow}>
                    <View style={styles.flex}>
                      <Text style={styles.rowTitle}>{achievement.name}</Text>
                      <Text style={styles.rowMeta}>奖励 +{achievement.rewards.score} 分</Text>
                    </View>
                    <Text style={styles.completedMark}>完成</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        {selectedTab === "activities" ? (
          <>
            <GoalBanner goal={findGoal(progression, "activity")} />
            <View style={styles.panel}>
              <Text style={styles.kicker}>这次想怎么休息</Text>
              <Text style={styles.sectionTitle}>选一个偏好，推荐会更懂你</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                <CategoryChip
                  label="全部"
                  selected={activityCategory === null}
                  onPress={() => setActivityCategory(null)}
                />
                {activityCategories.map((category) => (
                  <CategoryChip
                    key={category}
                    label={activityCategoryLabel(category)}
                    selected={activityCategory === category}
                    onPress={() => setActivityCategory(category)}
                  />
                ))}
              </ScrollView>
            </View>
            <View style={styles.featurePanel}>
              {activityAssignment ? (
                <>
                  <Text style={styles.kicker}>当前任务</Text>
                  <Text style={styles.sectionTitle}>{activityAssignment.title}</Text>
                  <Text style={styles.copy}>{activityAssignment.description}</Text>
                  <Text style={styles.accentMeta}>
                    {activityCategoryLabel(activityAssignment.category)} ·{" "}
                    {difficultyLabel(activityAssignment.difficulty)} · +
                    {activityAssignment.rewardPreview.score} 分 · 进度 +
                    {activityAssignment.rewardPreview.drawProgress}
                  </Text>
                  <Text style={styles.helperText}>
                    先在现实里完成它，再点击下面的按钮领取奖励。
                  </Text>
                  <ActionButton
                    label={
                      activityAssignment.status === "active"
                        ? "我做完了，领取奖励"
                        : "本次活动已完成"
                    }
                    disabled={loading || activityAssignment.status !== "active"}
                    onPress={completeActivity}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.kicker}>暂无任务</Text>
                  <Text style={styles.sectionTitle}>给自己找个合理的离线理由</Text>
                  <Text style={styles.copy}>系统会从安全、荒诞的小任务中随机选一个。</Text>
                </>
              )}
              {activityResult ? (
                <View style={styles.resultBox}>
                  <Text style={styles.rowTitle}>活动奖励已结算</Text>
                  <Text style={styles.rowMeta}>
                    +{activityResult.reward.score} 分 · 进度 +
                    {activityResult.reward.drawProgress} · 抽豆机会 +
                    {activityResult.reward.drawChancesGranted}
                  </Text>
                </View>
              ) : null}
              {activityMessage ? <Text style={styles.message}>{activityMessage}</Text> : null}
              {activityAssignment?.status !== "active" ? (
                <ActionButton
                  label={
                    activityUnavailable
                      ? "暂无可领取任务"
                      : activityAssignment
                        ? "按偏好再推荐一个"
                        : "推荐一个摸鱼任务"
                  }
                  disabled={loading || activityUnavailable}
                  onPress={randomActivity}
                />
              ) : null}
            </View>
            <View style={styles.panel}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Text style={styles.kicker}>活动目录</Text>
                  <Text style={styles.sectionTitle}>
                    {activityCategory ? activityCategoryLabel(activityCategory) : "全部活动"}
                  </Text>
                </View>
                <Text style={styles.goalCount}>{activityCatalog?.items.length ?? 0}</Text>
              </View>
              {activityCatalog?.items.length ? (
                activityCatalog.items.map((item) => (
                  <View key={item.templateId} style={styles.activityCatalogRow}>
                    <View style={styles.flex}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowMeta}>
                        {activityCategoryLabel(item.category)} ·{" "}
                        {difficultyLabel(item.difficulty)} · 完成 {item.completedCount} 次
                      </Text>
                      <Text style={styles.smallCopy}>{item.description}</Text>
                    </View>
                    <Text style={item.eligible ? styles.readyMark : styles.cooldownMark}>
                      {item.eligible
                        ? "可推荐"
                        : formatCooldown(item.cooldownRemainingSeconds)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>这个分类暂时没有活动。</Text>
              )}
            </View>
            <View style={styles.panel}>
              <Text style={styles.kicker}>完成记录</Text>
              <Text style={styles.sectionTitle}>最近休息过什么</Text>
              {activityHistory.length ? (
                activityHistory.map((item) => (
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
                <Text style={styles.emptyText}>还没有完成记录，挑一个顺眼的开始。</Text>
              )}
            </View>
          </>
        ) : null}

        {selectedTab === "beans" ? (
          <>
            <GoalBanner goal={findGoal(progression, "bean_draw")} />
            <View style={styles.featurePanel}>
              <Text style={styles.kicker}>抽豆账户</Text>
              <Text style={styles.sectionTitle}>
                {beanCollection?.drawChances ?? 0} 次机会
              </Text>
              <Text style={styles.copy}>
                当前进度 {beanCollection?.drawProgress ?? 0}/3。每满 3 点自动兑换一次机会。
              </Text>
              <ProgressBar
                value={beanCollection?.drawProgress ?? 0}
                max={3}
                color="#1f8f62"
              />
              <ActionButton
                label="抽一颗工位命运豆"
                disabled={loading || (beanCollection?.drawChances ?? 0) <= 0}
                onPress={drawBean}
              />
              {beanDrawResult ? (
                <View style={styles.resultBox}>
                  <Text style={styles.sectionTitle}>{beanDrawResult.bean.name}</Text>
                  <Text style={styles.accentMeta}>
                    {rarityLabel(beanDrawResult.bean.rarity)}
                    {beanDrawResult.duplicate ? " · 重复收藏" : " · 新豆入袋"}
                  </Text>
                  <Text style={styles.copy}>{beanDrawResult.bean.description}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.panel}>
              <Text style={styles.kicker}>豆子图鉴</Text>
              <Text style={styles.sectionTitle}>
                已收集 {beanCollection?.beans.filter((bean) => bean.owned).length ?? 0}/
                {beanCollection?.beans.length ?? 0}
              </Text>
              <View style={styles.grid}>
                {beanCollection?.beans.map((bean) => (
                  <View key={bean.id} style={[styles.beanTile, bean.owned && styles.beanTileOwned]}>
                    <Text style={styles.rowTitle}>{bean.name}</Text>
                    <Text style={styles.rowMeta}>
                      {rarityLabel(bean.rarity)} · x{bean.quantity}
                    </Text>
                    <Text style={styles.smallCopy}>
                      {bean.owned ? bean.description : "尚未获得，先保持一点神秘。"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {selectedTab === "rankings" ? (
          <View style={styles.panel}>
            <View style={styles.segmented}>
              {leaderboardWindows.map((window) => (
                <Pressable
                  key={window.value}
                  accessibilityRole="button"
                  onPress={() => void selectLeaderboardWindow(window.value)}
                  style={[
                    styles.segment,
                    leaderboardWindow === window.value && styles.segmentActive
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      leaderboardWindow === window.value && styles.segmentTextActive
                    ]}
                  >
                    {window.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {leaderboard?.items.length ? (
              leaderboard.items.map((item) => (
                <View key={`${item.rank}-${item.userId}`} style={styles.rankRow}>
                  <Text style={styles.rankNo}>#{item.rank}</Text>
                  <View style={styles.flex}>
                    <Text style={styles.rowTitle}>{item.displayName}</Text>
                    <Text style={styles.rowMeta}>
                      {item.equippedBadge ?? item.equippedTitle ?? "认真摸鱼中"}
                    </Text>
                  </View>
                  <Text style={styles.rankScore}>{item.score}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>榜单还空着，第一位休息的人会获得心理优势。</Text>
            )}
            {leaderboard?.currentUser ? (
              <View style={styles.myRank}>
                <Text style={styles.myRankText}>
                  你现在第 {leaderboard.currentUser.rank} 名 ·{" "}
                  {leaderboard.currentUser.score} 分
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {selectedTab === "profile" ? (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>LV {progression?.level ?? 1}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.sectionTitle}>{authLabel ?? "摸鱼同学"}</Text>
                <Text style={styles.rowMeta}>
                  连续休息 {progression?.currentStreakDays ?? 0} 天 · 最长{" "}
                  {progression?.longestStreakDays ?? 0} 天
                </Text>
              </View>
            </View>
            <LifetimeStats progression={progression} />
            <View style={styles.panel}>
              <Text style={styles.kicker}>休息连续性</Text>
              <Text style={styles.sectionTitle}>
                已连续 {progression?.currentStreakDays ?? 0} 天
              </Text>
              <Text style={styles.copy}>
                最长记录 {progression?.longestStreakDays ?? 0} 天。漏掉一天不会扣分，也不需要付费恢复，想起来时继续就好。
              </Text>
            </View>
            <View style={styles.panel}>
              <Text style={styles.kicker}>成就</Text>
              <Text style={styles.sectionTitle}>
                已解锁 {unlockedAchievements.length}/
                {achievementList?.achievements.length ?? 0}
              </Text>
              {achievementList?.achievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[styles.listRow, achievement.unlockedAt && styles.listRowCompleted]}
                >
                  <View style={styles.flex}>
                    <Text style={styles.rowTitle}>{achievement.name}</Text>
                    <Text style={styles.rowMeta}>{achievement.description}</Text>
                  </View>
                  <Text style={achievement.unlockedAt ? styles.completedMark : styles.pendingMark}>
                    {achievement.unlockedAt ? "完成" : "未完成"}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.panel}>
              <Text style={styles.kicker}>徽章与称号</Text>
              {cosmeticInventory?.cosmetics.length ? (
                cosmeticInventory.cosmetics.map((cosmetic) => (
                  <Pressable
                    key={cosmetic.id}
                    accessibilityRole="button"
                    disabled={loading || cosmetic.equipped}
                    onPress={() => void equipCosmetic(cosmetic.id)}
                    style={[
                      styles.cosmeticRow,
                      cosmetic.equipped && styles.listRowCompleted
                    ]}
                  >
                    <View style={styles.flex}>
                      <Text style={styles.rowTitle}>{cosmetic.name}</Text>
                      <Text style={styles.rowMeta}>
                        {cosmetic.cosmeticType === "badge" ? "徽章" : "称号"}
                      </Text>
                    </View>
                    <Text style={cosmetic.equipped ? styles.completedMark : styles.pendingMark}>
                      {cosmetic.equipped ? "使用中" : "装备"}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyText}>还没有装扮，先认真完成几次休息。</Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => void onSignOut()}
              style={styles.signOutButton}
            >
              <Text style={styles.signOutText}>退出当前账号</Text>
            </Pressable>
          </>
        ) : null}

        <StatusBar style="auto" />
      </ScrollView>

      <View style={styles.bottomNav}>
        {dashboardTabs.map((tab) => {
          const selected = selectedTab === tab.value;
          return (
            <Pressable
              key={tab.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSelectedTab(tab.value)}
              style={styles.navItem}
            >
              <View style={[styles.navGlyph, selected && styles.navGlyphActive]}>
                <Text style={[styles.navGlyphText, selected && styles.navGlyphTextActive]}>
                  {tab.glyph}
                </Text>
              </View>
              <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ProgressionOverview({ progression }: { progression: ProgressionSummary | null }) {
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

function DailyGoals({
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

function WeeklyGoals({
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

function GoalPeriodPanel({
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
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
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
              color={goal.completed ? "#1f8f62" : "#d4a838"}
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
    </View>
  );
}

function ProgressionClaimResultPanel({ result }: { result: ProgressionClaimResult }) {
  return (
    <View style={[styles.resultPanel, result.progression.leveledUp && styles.levelUpPanel]}>
      <Text style={styles.kicker}>
        {result.progression.leveledUp ? "等级提升" : "成长奖励"}
      </Text>
      <Text style={styles.sectionTitle}>
        {result.progression.leveledUp
          ? `LV ${result.progression.previousLevel} → LV ${result.progression.currentLevel}`
          : result.awarded
            ? "这份努力被正式记下了"
            : "这份奖励已经领过了"}
      </Text>
      <Text style={styles.copy}>
        得分 +{result.reward.score} · 抽豆进度 +{result.reward.drawProgress} · 机会 +
        {result.reward.drawChancesGranted}
      </Text>
    </View>
  );
}

function GoalBanner({
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

function LifetimeStats({ progression }: { progression: ProgressionSummary | null }) {
  const stats = [
    ["打卡", progression?.lifetime.totalSessions ?? 0],
    ["休息分钟", progression?.lifetime.eligibleRestMinutes ?? 0],
    ["活动", progression?.lifetime.completedActivities ?? 0],
    ["豆种", progression?.lifetime.collectedBeanTypes ?? 0]
  ];
  return (
    <View style={styles.statGrid}>
      {stats.map(([label, value]) => (
        <View key={label} style={styles.statCell}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function CheckInResult({ result }: { result: CheckInFinishResult }) {
  return (
    <View style={styles.resultPanel}>
      <Text style={styles.kicker}>本次结算</Text>
      <Text style={styles.sectionTitle}>
        {result.reward.rewarded ? "这次休息被系统正式承认" : "这次太短，精神上仍然算数"}
      </Text>
      <Text style={styles.copy}>
        得分 +{result.reward.score} · 抽豆进度 +{result.reward.drawProgress} · 机会 +
        {result.reward.drawChancesGranted ?? 0}
      </Text>
    </View>
  );
}

function CategoryChip({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
    >
      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  disabled = false,
  dark = false
}: {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  dark?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => void onPress()}
      style={({ pressed }) => [
        styles.actionButton,
        dark && styles.actionButtonDark,
        (pressed || disabled) && styles.buttonMuted
      ]}
    >
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

function ProgressBar({
  value,
  max,
  color
}: {
  value: number;
  max: number;
  color: string;
}) {
  const percent = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { backgroundColor: color, width: `${percent}%` }]} />
    </View>
  );
}

function findGoal(
  progression: ProgressionSummary | null,
  code: "check_in" | "activity" | "bean_draw"
) {
  return progression?.dailyGoals.goals.find((goal) => goal.code === code) ?? null;
}

function rarityLabel(rarity: string): string {
  return (
    {
      common: "普通",
      uncommon: "少见",
      rare: "稀有",
      epic: "史诗",
      legendary: "传说"
    }[rarity] ?? rarity
  );
}

function difficultyLabel(difficulty: string): string {
  return ({ easy: "轻松", normal: "正常", hard: "硬核" }[difficulty] ?? difficulty);
}

function activityCategoryLabel(category: string): string {
  return (
    {
      rest: "安静休息",
      game: "小游戏",
      office_theater: "办公室表演",
      physical: "身体活动",
      imagination: "脑洞任务"
    }[category] ?? category
  );
}

function formatCooldown(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} 秒`;
  }
  if (seconds < 60 * 60) {
    return `${Math.ceil(seconds / 60)} 分钟`;
  }
  return `${Math.ceil(seconds / 3600)} 小时`;
}

function formatActivityTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function logAchievementUnlocks(
  achievements: Array<{ id: string; code: string; name: string }>
) {
  achievements.forEach((achievement) => {
    logEvent("info", "analytics.achievement.unlocked", {
      achievementId: achievement.id,
      achievementCode: achievement.code,
      achievementName: achievement.name
    });
  });
}

const leaderboardWindows: Array<{ value: LeaderboardWindow; label: string }> = [
  { value: "daily", label: "日榜" },
  { value: "weekly", label: "周榜" },
  { value: "monthly", label: "月榜" },
  { value: "all_time", label: "总榜" }
];

const activityCategories: ActivityCategory[] = [
  "rest",
  "game",
  "office_theater",
  "physical",
  "imagination"
];

function formatDuration(startedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
  if (seconds > 45 * 60) {
    return "45:00+";
  }
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  app: { backgroundColor: "#f3efe7", flex: 1 },
  container: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: 760,
    padding: 20,
    paddingBottom: 32,
    paddingTop: 52,
    width: "100%"
  },
  header: { marginBottom: 22 },
  brand: { color: "#1f8f62", fontSize: 14, fontWeight: "900" },
  pageTitle: { color: "#232323", fontSize: 30, fontWeight: "900", marginTop: 8 },
  pageSubtitle: { color: "#625b52", fontSize: 15, lineHeight: 22, marginTop: 6 },
  topLoader: { marginBottom: 12 },
  panel: {
    backgroundColor: "#fffdf8",
    borderColor: "#d8d0c4",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18
  },
  featurePanel: {
    backgroundColor: "#fffdf8",
    borderColor: "#2f6f8f",
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 16,
    padding: 18
  },
  progressionPanel: {
    backgroundColor: "#232323",
    borderRadius: 8,
    marginBottom: 16,
    padding: 18
  },
  progressionHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressionLevel: { color: "#ffffff", fontSize: 34, fontWeight: "900", marginTop: 5 },
  progressionXp: { color: "#f0c95a", fontSize: 18, fontWeight: "900" },
  progressionMeta: { color: "#c8c1b7", fontSize: 13, marginTop: 8 },
  darkKicker: { color: "#bdb5aa", fontSize: 12, fontWeight: "900" },
  kicker: { color: "#756c61", fontSize: 12, fontWeight: "900" },
  sectionTitle: { color: "#232323", fontSize: 21, fontWeight: "900", marginTop: 6 },
  timer: { color: "#232323", fontSize: 58, fontWeight: "900", marginTop: 8 },
  copy: { color: "#47413a", fontSize: 15, lineHeight: 22, marginTop: 8 },
  smallCopy: { color: "#746b60", fontSize: 12, lineHeight: 18, marginTop: 7 },
  helperText: { color: "#746b60", fontSize: 13, lineHeight: 19, marginTop: 10 },
  accentMeta: { color: "#2f6f8f", fontSize: 13, fontWeight: "900", marginTop: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#1f8f62",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 12
  },
  actionButtonDark: { backgroundColor: "#232323" },
  actionButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "900", textAlign: "center" },
  buttonMuted: { opacity: 0.42 },
  nextStepPanel: {
    backgroundColor: "#232323",
    borderRadius: 8,
    marginBottom: 16,
    padding: 18
  },
  nextStepTitle: { color: "#ffffff", fontSize: 21, fontWeight: "900", marginTop: 7 },
  nextStepCopy: { color: "#d5cec4", fontSize: 14, lineHeight: 21, marginTop: 7 },
  resultPanel: {
    backgroundColor: "#e7f4ed",
    borderColor: "#1f8f62",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18
  },
  levelUpPanel: { backgroundColor: "#fff4c9", borderColor: "#d4a838" },
  resultBox: {
    backgroundColor: "#eef7f3",
    borderRadius: 8,
    marginTop: 14,
    padding: 14
  },
  categoryRow: { gap: 8, paddingTop: 14 },
  categoryChip: {
    alignItems: "center",
    borderColor: "#cfc7bb",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 13
  },
  categoryChipSelected: { backgroundColor: "#232323", borderColor: "#232323" },
  categoryChipText: { color: "#625b52", fontSize: 13, fontWeight: "900" },
  categoryChipTextSelected: { color: "#ffffff" },
  activityCatalogRow: {
    alignItems: "flex-start",
    borderTopColor: "#e2dbd0",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14
  },
  readyMark: { color: "#1f8f62", fontSize: 12, fontWeight: "900" },
  cooldownMark: {
    color: "#8b4d36",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right"
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  goalCount: { color: "#1f8f62", fontSize: 26, fontWeight: "900" },
  listRow: {
    alignItems: "center",
    borderColor: "#e2dbd0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    minHeight: 62,
    padding: 12
  },
  listRowCompleted: { backgroundColor: "#edf8f2", borderColor: "#82b99f" },
  rowTitle: { color: "#232323", fontSize: 15, fontWeight: "900" },
  rowMeta: { color: "#746b60", fontSize: 12, lineHeight: 17, marginTop: 3 },
  completedMark: { color: "#1f8f62", fontSize: 12, fontWeight: "900" },
  pendingMark: { color: "#8b4d36", fontSize: 12, fontWeight: "900" },
  progressValue: {
    color: "#8b4d36",
    fontSize: 13,
    fontWeight: "900",
    minWidth: 44,
    textAlign: "right"
  },
  goalRewardRow: {
    alignItems: "center",
    backgroundColor: "#f4f0e8",
    borderRadius: 8,
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    minHeight: 58,
    padding: 12
  },
  flex: { flex: 1 },
  goalBanner: {
    backgroundColor: "#fff7df",
    borderColor: "#d4a838",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14
  },
  goalBannerCompleted: { backgroundColor: "#edf8f2", borderColor: "#82b99f" },
  progressTrack: {
    backgroundColor: "#514d48",
    borderRadius: 4,
    height: 8,
    marginTop: 14,
    overflow: "hidden"
  },
  progressFill: { borderRadius: 4, height: 8 },
  grid: { gap: 10, marginTop: 14 },
  beanTile: {
    borderColor: "#dfd8ce",
    borderRadius: 8,
    borderWidth: 1,
    padding: 13
  },
  beanTileOwned: { backgroundColor: "#edf8f2", borderColor: "#82b99f" },
  segmented: {
    backgroundColor: "#eee8df",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
    marginBottom: 16,
    padding: 4
  },
  segment: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 38
  },
  segmentActive: { backgroundColor: "#232323" },
  segmentText: { color: "#625b52", fontSize: 13, fontWeight: "900" },
  segmentTextActive: { color: "#ffffff" },
  rankRow: {
    alignItems: "center",
    borderTopColor: "#e4ddd3",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingVertical: 10
  },
  rankNo: { color: "#1f8f62", fontSize: 17, fontWeight: "900", width: 44 },
  rankScore: { color: "#232323", fontSize: 20, fontWeight: "900" },
  myRank: { backgroundColor: "#232323", borderRadius: 8, marginTop: 14, padding: 13 },
  myRankText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  profileHeader: {
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
    padding: 18
  },
  levelBadge: {
    alignItems: "center",
    backgroundColor: "#232323",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    width: 70
  },
  levelBadgeText: { color: "#f0c95a", fontSize: 16, fontWeight: "900" },
  statGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCell: {
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 82,
    padding: 8
  },
  statValue: { color: "#232323", fontSize: 22, fontWeight: "900" },
  statLabel: { color: "#746b60", fontSize: 11, marginTop: 4, textAlign: "center" },
  cosmeticRow: {
    alignItems: "center",
    borderColor: "#e2dbd0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 10,
    padding: 12
  },
  signOutButton: {
    alignItems: "center",
    borderColor: "#8b4d36",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48
  },
  signOutText: { color: "#8b4d36", fontSize: 15, fontWeight: "900" },
  message: {
    color: "#a23b3b",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12
  },
  notice: {
    color: "#1f6f4f",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginBottom: 12
  },
  emptyText: { color: "#746b60", fontSize: 14, lineHeight: 21, marginTop: 12 },
  bottomNav: {
    alignSelf: "center",
    backgroundColor: "#fffdf8",
    borderTopColor: "#d6cec2",
    borderTopWidth: 1,
    flexDirection: "row",
    maxWidth: 760,
    paddingBottom: 10,
    paddingHorizontal: 8,
    paddingTop: 8,
    width: "100%"
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
    justifyContent: "center",
    minHeight: 54
  },
  navGlyph: {
    alignItems: "center",
    borderRadius: 6,
    height: 26,
    justifyContent: "center",
    width: 30
  },
  navGlyphActive: { backgroundColor: "#1f8f62" },
  navGlyphText: { color: "#6f675d", fontSize: 13, fontWeight: "900" },
  navGlyphTextActive: { color: "#ffffff" },
  navLabel: { color: "#6f675d", fontSize: 11, fontWeight: "800" },
  navLabelActive: { color: "#1f8f62" }
});
