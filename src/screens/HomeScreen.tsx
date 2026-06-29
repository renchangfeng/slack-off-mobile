import { StatusBar } from "expo-status-bar";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import {
  AchievementApi,
  type Achievement,
  type AchievementList,
  type AchievementRecommendation,
  type CosmeticInventory,
  type OwnedCosmetic
} from "../api/achievements";
import {
  ActivityApi,
  type ActivityAssignment,
  type ActivityCatalog,
  type ActivityCategory,
  type ActivityCompleteResult,
  type ActivityInteractionProgress,
  type ActivityPresentation,
  type ActivitySkipReason
} from "../api/activities";
import {
  BeanApi,
  type BeanCollection,
  type BeanDrawResult,
  type BeanTheme
} from "../api/beans";
import { ApiClient } from "../api/client";
import { CheckInApi, type CheckInFinishResult, type CheckInSession } from "../api/checkins";
import {
  LeaderboardApi,
  type LeaderboardResponse,
  type LeaderboardScope,
  type LeaderboardWindow
} from "../api/leaderboards";
import {
  ProgressionApi,
  type ProgressionClaimResult,
  type ProgressionPeriod,
  type ProgressionSummary
} from "../api/progression";
import { env } from "../config/env";
import { SocialApi, type SocialReactionType, type SocialSummary } from "../api/social";
import {
  dashboardTabs,
  getDashboardTab,
  type DashboardTab
} from "../gameplay/dashboardTabs";
import { deriveGameplayStep } from "../gameplay/nextStep";
import { logEvent } from "../observability/logger";
import { useBrandName } from "../ui/useBrandName";
import { BottomNav } from "../ui/BottomNav";
import { colors } from "../ui/tokens";
import {
  EmptyState,
  FramedCard,
  IconTile,
  PixelArtPlaceholder,
  PrimaryButton,
  SectionHeader,
  StatusBadge
} from "../ui/components";

type HomeScreenProps = {
  authLabel?: string;
  getAccessToken: () => Promise<string | null>;
  onOpenUiLab?: () => void;
  onSignOut: () => Promise<void>;
};

type AchievementUnlockFeedback = {
  id: string;
  code: string;
  name: string;
  unlockedAt: string;
  rewards: {
    score: number;
    drawProgress: number;
    drawChances: number;
    cosmetic: string | null;
  };
};

export function HomeScreen({ authLabel, getAccessToken, onOpenUiLab, onSignOut }: HomeScreenProps) {
  const api = useMemo(() => {
    const client = new ApiClient({ baseUrl: env.apiBaseUrl, getAccessToken });
    return {
      achievements: new AchievementApi(client),
      activities: new ActivityApi(client),
      beans: new BeanApi(client),
      checkIns: new CheckInApi(client),
      leaderboards: new LeaderboardApi(client),
      progression: new ProgressionApi(client)
      ,
      social: new SocialApi(client)
    };
  }, [getAccessToken]);

  const brand = useBrandName();

  const [selectedTab, setSelectedTab] = useState<DashboardTab>("home");
  const [activeSession, setActiveSession] = useState<CheckInSession | null>(null);
  const [progression, setProgression] = useState<ProgressionSummary | null>(null);
  const [progressionClaim, setProgressionClaim] = useState<ProgressionClaimResult | null>(null);
  const [beanCollection, setBeanCollection] = useState<BeanCollection | null>(null);
  const [beanDrawResult, setBeanDrawResult] = useState<BeanDrawResult | null>(null);
  const [beanTheme, setBeanTheme] = useState<BeanTheme>("office");
  const [showcasePosition, setShowcasePosition] = useState(1);
  const [lastResult, setLastResult] = useState<CheckInFinishResult | null>(null);
  const [achievementList, setAchievementList] = useState<AchievementList | null>(null);
  const [achievementCategoryFilter, setAchievementCategoryFilter] =
    useState<Achievement["category"] | "all">("all");
  const [achievementUnlockQueue, setAchievementUnlockQueue] = useState<
    AchievementUnlockFeedback[]
  >([]);
  const [activityAssignment, setActivityAssignment] = useState<ActivityAssignment | null>(null);
  const [activityResult, setActivityResult] = useState<ActivityCompleteResult | null>(null);
  const [activityProgress, setActivityProgress] = useState<ActivityInteractionProgress>({});
  const [activitySkipReason, setActivitySkipReason] = useState<ActivitySkipReason>("not_interested");
  const [activityMessage, setActivityMessage] = useState<string | null>(null);
  const [activityUnavailable, setActivityUnavailable] = useState(false);
  const [activityCategory, setActivityCategory] = useState<ActivityCategory | null>(null);
  const [activityCatalog, setActivityCatalog] = useState<ActivityCatalog | null>(null);
  const [activityHistory, setActivityHistory] = useState<ActivityAssignment[]>([]);
  const [cosmeticInventory, setCosmeticInventory] = useState<CosmeticInventory | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [leaderboardWindow, setLeaderboardWindow] = useState<LeaderboardWindow>("daily");
  const [leaderboardScope, setLeaderboardScope] = useState<LeaderboardScope>("global");
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [social, setSocial] = useState<SocialSummary | null>(null);
  const [socialInput, setSocialInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const leaderboardRequestId = useRef(0);

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
    async (window: LeaderboardWindow, scope: LeaderboardScope) => {
      const requestId = leaderboardRequestId.current + 1;
      leaderboardRequestId.current = requestId;
      setLeaderboardLoading(true);
      const response = await api.leaderboards.getLeaderboard(window, scope);
      if (requestId !== leaderboardRequestId.current) {
        return;
      }
      setLeaderboardLoading(false);
      if (response.error) {
        setMessage(response.error.message);
        return;
      }
      setLeaderboard(response.data);
    },
    [api.leaderboards]
  );

  const refreshSocial = useCallback(async () => {
    const response = await api.social.getSummary();
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setSocial(response.data);
  }, [api.social]);

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
      refreshLeaderboard("daily", "global"),
      refreshSocial()
    ]);
    setLoading(false);
  }, [
    api.checkIns,
    refreshAchievements,
    refreshBeans,
    refreshLeaderboard,
    refreshProgression,
    refreshSocial
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

  useEffect(() => {
    setActivityProgress({});
    setActivitySkipReason("not_interested");
  }, [activityAssignment?.assignmentId]);

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
      refreshLeaderboard(leaderboardWindow, leaderboardScope)
    ]);
  }

  function enqueueAchievementUnlocks(unlocks: AchievementUnlockFeedback[]) {
    if (!unlocks.length) return;
    logAchievementUnlocks(unlocks);
    setAchievementUnlockQueue((current) => [...current, ...unlocks]);
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
    enqueueAchievementUnlocks(response.data?.reward.achievementsUnlocked ?? []);
    await refreshAfterReward();
  }

  async function drawBean() {
    setLoading(true);
    setMessage(null);
    setNotice(null);
    const response = await api.beans.draw(beanTheme);
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setBeanDrawResult(response.data);
    setNotice(
      `抽到了${response.data?.bean.name ?? "一颗豆"}，还剩 ${response.data?.remainingDrawChances ?? 0} 次机会。`
    );
    enqueueAchievementUnlocks(response.data?.achievementsUnlocked ?? []);
    await refreshAfterReward();
  }

  async function exchangeBeanFragments() {
    setLoading(true);
    setMessage(null);
    setNotice(null);
    const response = await api.beans.exchangeFragments();
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setNotice("豆子碎片已兑换为 1 次抽取机会。");
    await refreshBeans();
  }

  async function setBeanShowcase(beanId: string) {
    setLoading(true);
    setMessage(null);
    setNotice(null);
    const response = await api.beans.setShowcase(showcasePosition, beanId);
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setNotice(`已放入展示柜第 ${showcasePosition} 格。`);
    await refreshBeans();
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
    setActivityProgress({});
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
    if (!isActivityInteractionComplete(activityAssignment, activityProgress)) {
      setLoading(false);
      setActivityMessage("先完成上面的互动步骤，再领取奖励。");
      return;
    }
    const response = await api.activities.complete(activityAssignment.assignmentId, activityProgress);
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
    setActivityProgress({});
    setNotice(
      response.data.reward.drawChancesGranted > 0
        ? `活动完成，获得 ${response.data.reward.drawChancesGranted} 次抽豆机会。`
        : response.data.feedback
    );
    enqueueAchievementUnlocks(response.data.reward.achievementsUnlocked);
    await Promise.all([refreshAfterReward(), refreshActivityData()]);
  }

  async function skipActivity() {
    if (!activityAssignment) return;
    setLoading(true);
    setMessage(null);
    setNotice(null);
    setActivityMessage(null);
    const response = await api.activities.skip(activityAssignment.assignmentId, activitySkipReason);
    setLoading(false);
    if (response.error) {
      setActivityMessage(response.error.message);
      return;
    }
    setActivityAssignment(response.data);
    setActivityProgress({});
    setNotice("这次任务已放弃，不发奖励。换一个更顺眼的就好。");
    await refreshActivityData();
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
    await Promise.all([refreshAchievements(), refreshLeaderboard(leaderboardWindow, leaderboardScope)]);
  }

  async function selectLeaderboardWindow(window: LeaderboardWindow) {
    if (window === leaderboardWindow || leaderboardLoading) return;
    setMessage(null);
    setLeaderboardWindow(window);
    await refreshLeaderboard(window, leaderboardScope);
  }

  async function selectLeaderboardScope(scope: LeaderboardScope) {
    if (scope === leaderboardScope || leaderboardLoading) return;
    setMessage(null);
    setLeaderboardScope(scope);
    await refreshLeaderboard(leaderboardWindow, scope);
  }

  async function submitSocialAction(action: "friend" | "squad" | "company") {
    const value = socialInput.trim();
    if (!value) return;
    setLoading(true);
    const response =
      action === "friend"
        ? await api.social.addFriend(value)
        : social?.[action]
          ? await api.social.joinGroup(action, value)
          : value.includes("#")
            ? await api.social.joinGroup(action, value.replace("#", ""))
            : await api.social.createGroup(action, value);
    setLoading(false);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setSocial(response.data);
    setSocialInput("");
    await refreshLeaderboard(leaderboardWindow, leaderboardScope);
  }

  async function sendReaction(userId: string, reactionType: SocialReactionType) {
    const response = await api.social.react(userId, reactionType);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setNotice(response.data?.resultCopy ?? (response.data?.created ? "心意已送达。" : "今天已经送过这份心意了。"));
    await refreshSocial();
    await refreshLeaderboard(leaderboardWindow, leaderboardScope);
  }

  async function leaveSocialGroup(kind: "squad" | "company") {
    const response = await api.social.leaveGroup(kind);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    setSocial(response.data);
    if (leaderboardScope === kind) {
      await refreshLeaderboard(leaderboardWindow, leaderboardScope);
    }
  }

  const elapsedLabel = activeSession ? formatDuration(activeSession.startedAt, clockNow) : "00:00";
  const activeSessionOverLimit = activeSession
    ? clockNow - Date.parse(activeSession.startedAt) > 45 * 60 * 1000
    : false;
  const unlockedAchievements =
    achievementList?.achievements.filter((achievement) => achievement.unlockedAt) ?? [];
  const sortedAchievements = [...(achievementList?.achievements ?? [])].sort((left, right) => {
    if (Boolean(left.unlockedAt) !== Boolean(right.unlockedAt)) {
      return left.unlockedAt ? 1 : -1;
    }
    return right.progress.percent - left.progress.percent;
  });
  const filteredAchievements = sortedAchievements.filter(
    (achievement) =>
      achievementCategoryFilter === "all" || achievement.category === achievementCategoryFilter
  );
  const achievementFocus = pickAchievementFocus(achievementList);
  const secondaryAchievementRecommendations = achievementList
    ? [
        ...achievementList.recommendations.nearest,
        ...achievementList.recommendations.today,
        ...achievementList.recommendations.long_term
      ].filter((achievement) => achievement.id !== achievementFocus?.id)
    : [];
  const equippedTitle = cosmeticInventory?.equippedTitle?.name ?? null;
  const equippedBadge = cosmeticInventory?.equippedBadge?.name ?? null;
  const nextStep = deriveGameplayStep({
    hasActiveCheckIn: Boolean(activeSession),
    drawChances: beanCollection?.drawChances ?? 0,
    activityStatus: activityAssignment?.status,
    activityUnavailable,
    serverNextActions: progression?.nextActions ?? [],
    hasProgress: Boolean(
      lastResult ||
        activityResult ||
        beanDrawResult ||
        (beanCollection?.drawProgress ?? 0) > 0 ||
        activityAssignment
    )
  });
  const activityCanComplete = activityAssignment
    ? isActivityInteractionComplete(activityAssignment, activityProgress)
    : false;
  const activityPresentation = activityAssignment
    ? resolveActivityPresentation(activityAssignment)
    : null;
  const activityResultPresentation = activityResult
    ? resolveActivityPresentation(activityResult.assignment)
    : null;
  const activityAccentColor = activityPresentation?.accentColor ?? "#2f6f8f";
  const tabMeta = getDashboardTab(selectedTab);

  function jumpToAchievementTarget(achievement: AchievementRecommendation) {
    setSelectedTab(achievementTargetTab(achievement));
  }

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
    if (nextStep.kind === "claim-daily-reward") {
      setSelectedTab("home");
      await claimProgressionReward("daily");
      return;
    }
    if (nextStep.kind === "claim-weekly-reward") {
      setSelectedTab("home");
      await claimProgressionReward("weekly");
      return;
    }
    setSelectedTab("activities");
    await randomActivity();
  }

  async function runDailyGoalAction(code: string) {
    if (code === "check_in") {
      setSelectedTab("home");
      if (activeSession) {
        await finishSession();
      } else {
        await startSession();
      }
      return;
    }
    if (code === "activity") {
      setSelectedTab("activities");
      if (activityAssignment?.status === "active") {
        await completeActivity();
      } else {
        await randomActivity();
      }
      return;
    }
    if (code === "bean_draw") {
      setSelectedTab("beans");
      if ((beanCollection?.drawChances ?? 0) > 0) {
        await drawBean();
      } else {
        setNotice("还差一点抽豆进度。先完成打卡或摸鱼任务，机会就会自己冒出来。");
      }
    }
  }

  return (
    <View style={styles.app}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.brand}>{brand}</Text>
            {onOpenUiLab ? (
              <Pressable
                accessibilityRole="button"
                onPress={onOpenUiLab}
                style={styles.uiLabButton}
              >
                <Text style={styles.uiLabButtonText}>UI Lab</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.pageTitle}>{tabMeta.title}</Text>
          <Text style={styles.pageSubtitle}>{tabMeta.subtitle}</Text>
        </View>

        {loading ? <ActivityIndicator color="#232323" style={styles.topLoader} /> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        {selectedTab === "home" ? (
          <>
            <ProgressionOverview progression={progression} />
            {progressionClaim ? (
              <ProgressionClaimResultPanel result={progressionClaim} nextStep={nextStep} />
            ) : null}
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
              <RewardPreview preview={nextStep.rewardPreview ?? null} dark />
              <ActionButton label={nextStep.actionLabel} onPress={runNextStep} disabled={loading} />
            </View>
            <DailyRhythmChecklist
              progression={progression}
              loading={loading}
              onRunGoal={runDailyGoalAction}
            />
            {lastResult ? <CheckInResult result={lastResult} nextStep={nextStep} /> : null}
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
                  <View
                    style={[
                      styles.activityHeroCard,
                      { borderColor: activityAccentColor }
                    ]}
                  >
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
                    <Text style={styles.kicker}>
                      {activityCategoryLabel(activityAssignment.category)} ·{" "}
                      {difficultyLabel(activityAssignment.difficulty)}
                    </Text>
                    <Text style={styles.activityHeadline}>
                      {activityPresentation?.headline ?? activityAssignment.title}
                    </Text>
                    <Text style={styles.activityScene}>
                      {activityPresentation?.scene ?? activityAssignment.description}
                    </Text>
                    <View style={styles.activityPromptBox}>
                      <Text style={styles.activityPrompt}>
                        {activityPresentation?.prompt ?? activityAssignment.description}
                      </Text>
                    </View>
                    <Text style={styles.accentMeta}>
                      +{activityAssignment.rewardPreview.score} 分 · 进度 +
                      {activityAssignment.rewardPreview.drawProgress} ·{" "}
                      {activityAssignment.interactionSummary.flavorLabel}
                    </Text>
                  </View>
                  {activityAssignment.recommendationExplanation ? (
                    <Text style={styles.helperText}>
                      推荐理由：{activityAssignment.recommendationExplanation}
                    </Text>
                  ) : null}
                  <ActivityInteractionRunner
                    assignment={activityAssignment}
                    progress={activityProgress}
                    onChange={setActivityProgress}
                  />
                  <ActionButton
                    label={
                      activityAssignment.status === "active"
                        ? activityCanComplete
                          ? "领取互动奖励"
                          : "先完成互动步骤"
                        : "本次活动已完成"
                    }
                    disabled={
                      loading ||
                      activityAssignment.status !== "active" ||
                      !activityCanComplete
                    }
                    onPress={completeActivity}
                  />
                  {activityAssignment.status === "active" ? (
                    <>
                      <View style={styles.skipReasonBox}>
                        <Text style={styles.kicker}>不想做的原因</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.categoryRow}
                        >
                          {activitySkipReasonOptions.map((option) => (
                            <CategoryChip
                              key={option.value}
                              label={option.label}
                              selected={activitySkipReason === option.value}
                              onPress={() => setActivitySkipReason(option.value)}
                            />
                          ))}
                        </ScrollView>
                      </View>
                      <ActionButton
                        label="按原因换一个"
                        dark
                        disabled={loading}
                        onPress={skipActivity}
                      />
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.kicker}>暂无任务</Text>
                  <Text style={styles.sectionTitle}>给自己找个合理的离线理由</Text>
                  <Text style={styles.copy}>系统会从安全、荒诞的小任务中随机选一个。</Text>
                </>
              )}
              {activityResult ? (
                <View
                  style={[
                    styles.activityResultCertificate,
                    { borderColor: activityResultPresentation?.accentColor ?? "#1f8f62" }
                  ]}
                >
                  <Text
                    style={[
                      styles.activityBadge,
                      { backgroundColor: activityResultPresentation?.accentColor ?? "#1f8f62" }
                    ]}
                  >
                    {activityResultPresentation?.badge ?? "活动完成"}
                  </Text>
                  <Text style={styles.activityResultTitle}>
                    {activityResult.resultTitle ?? "活动奖励已结算"}
                  </Text>
                  {activityResult.resultCopy ? (
                    <Text style={styles.helperText}>{activityResult.resultCopy}</Text>
                  ) : null}
                  <Text style={styles.rowMeta}>
                    +{activityResult.reward.score} 分 · 进度 +
                    {activityResult.reward.drawProgress} · 抽豆机会 +
                    {activityResult.reward.drawChancesGranted}
                  </Text>
                  <Text style={styles.helperText}>{activityResult.feedback}</Text>
                  <Text style={styles.helperText}>下一步：{nextStep.title}</Text>
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
                activityCatalog.items.map((item) => {
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
            <FramedCard>
              <SectionHeader kicker="抽豆账户" title={`${beanCollection?.drawChances ?? 0} 次机会`} />
              <Text style={styles.copy}>
                当前进度 {beanCollection?.drawProgress ?? 0}/3。每满 3 点自动兑换一次机会。
              </Text>
              <View style={styles.beanCollectionSummary}>
                <View style={styles.flex}>
                  <Text style={styles.kickerSection}>图鉴完成度</Text>
                  <Text style={styles.rowTitle}>
                    {beanCollection?.summary.collected ?? 0}/
                    {beanCollection?.summary.total ?? 0} ·{" "}
                    {beanCollection?.summary.percent ?? 0}%
                  </Text>
                  <ProgressBar
                    value={beanCollection?.summary.percent ?? 0}
                    max={100}
                    color="#1f8f62"
                    trackColor="#d5e9dc"
                  />
                </View>
                <Text style={styles.pendingMark}>
                  {beanCollection?.nextTarget
                    ? `追 ${beanCollection.nextTarget.name}`
                    : "全图鉴"}
                </Text>
              </View>
              <Text style={styles.helperText}>
                {beanCollection?.nextTarget?.hint ??
                  beanCollection?.summary.nextAction ??
                  "继续攒机会，给豆仓一点命运的响动。"}
              </Text>
              <ProgressBar
                value={beanCollection?.drawProgress ?? 0}
                max={3}
                color="#1f8f62"
              />
              <Text style={styles.kickerSection}>选择主题卡池</Text>
              <View style={styles.beanThemeRow}>
                {beanThemes.map((theme) => {
                  const summary = beanCollection?.themes.find((item) => item.theme === theme);
                  return (
                    <Pressable
                      key={theme}
                      accessibilityRole="button"
                      accessibilityState={{ selected: beanTheme === theme }}
                      onPress={() => setBeanTheme(theme)}
                      style={[
                        styles.beanThemeButton,
                        beanTheme === theme && styles.beanThemeButtonActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.beanThemeButtonText,
                          beanTheme === theme && styles.beanThemeButtonTextActive
                        ]}
                      >
                        {beanThemeLabel(theme)}
                      </Text>
                      <Text
                        style={[
                          styles.beanThemeCount,
                          beanTheme === theme && styles.beanThemeButtonTextActive
                        ]}
                      >
                        {summary?.collected ?? 0}/{summary?.total ?? 0}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.beanEconomyGrid}>
                <View style={styles.beanEconomyCell}>
                  <Text style={styles.kicker}>稀有保底</Text>
                  <Text style={styles.beanEconomyValue}>
                    {beanCollection?.pityCount ?? 0}/{beanCollection?.pityThreshold ?? 8}
                  </Text>
                  <Text style={styles.smallCopy}>第 8 次必出稀有以上</Text>
                </View>
                <View style={styles.beanEconomyCell}>
                  <Text style={styles.kicker}>重复碎片</Text>
                  <Text style={styles.beanEconomyValue}>
                    {beanCollection?.fragments ?? 0}
                  </Text>
                  <Text style={styles.smallCopy}>
                    {beanCollection?.fragmentExchangeCost ?? 10} 个换 1 次
                  </Text>
                </View>
              </View>
              <ActionButton
                label={`从${beanThemeLabel(beanTheme)}抽一颗`}
                disabled={loading || (beanCollection?.drawChances ?? 0) <= 0}
                onPress={drawBean}
              />
              <ActionButton
                label="用碎片兑换 1 次机会"
                dark
                disabled={
                  loading ||
                  (beanCollection?.fragments ?? 0) <
                    (beanCollection?.fragmentExchangeCost ?? 10)
                }
                onPress={exchangeBeanFragments}
              />
              {beanDrawResult ? (
                <View style={styles.resultBox}>
                  <Text style={styles.kicker}>抽豆结果</Text>
                  <Text style={styles.sectionTitle}>
                    {beanDrawResult.resultTitle ?? beanDrawResult.bean.name}
                  </Text>
                  <Text style={styles.accentMeta}>
                    {beanDrawResult.bean.name} ·{" "}
                    {beanThemeLabel(beanDrawResult.bean.theme)} ·{" "}
                    {rarityLabel(beanDrawResult.bean.rarity)}
                    {beanDrawResult.pityTriggered ? " · 保底生效" : ""}
                  </Text>
                  <Text style={styles.copy}>{beanDrawResult.bean.description}</Text>
                  <Text style={styles.helperText}>
                    {beanDrawResult.resultCopy ??
                      (beanDrawResult.duplicate
                        ? `重复收藏，数量增加并获得 ${beanDrawResult.fragmentsGranted} 个碎片。`
                        : "新豆入袋，图鉴完成度已更新。")}
                  </Text>
                  <Text style={styles.helperText}>
                    下一步：{beanDrawResult.nextHint ?? nextStep.title}
                  </Text>
                </View>
              ) : null}
            </FramedCard>
            <FramedCard>
              <SectionHeader kicker="展示柜" title="选一个槽位，再点一颗已拥有的豆" />
              <View style={styles.showcaseRow}>
                {[1, 2, 3].map((position) => {
                  const item = beanCollection?.showcase.find(
                    (showcase) => showcase.position === position
                  );
                  return (
                    <Pressable
                      key={position}
                      accessibilityRole="button"
                      accessibilityState={{ selected: showcasePosition === position }}
                      onPress={() => setShowcasePosition(position)}
                      style={[
                        styles.showcaseSlot,
                        showcasePosition === position && styles.showcaseSlotActive
                      ]}
                    >
                      <PixelArtPlaceholder kind="bean" size={48} style={styles.showcasePlaceholder} />
                      <Text style={styles.kicker}>第 {position} 格</Text>
                      <Text style={styles.showcaseBeanName}>
                        {item?.bean.name ?? "空位"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </FramedCard>
            <FramedCard>
              <SectionHeader
                kicker="豆子图鉴"
                title={`已收集 ${beanCollection?.beans.filter((bean) => bean.owned).length ?? 0}/${beanCollection?.beans.length ?? 0}`}
              />
              <View style={styles.raritySummaryRow}>
                {beanRarities.map((rarity) => {
                  const rarityBeans = beanCollection?.beans.filter(
                    (bean) => bean.rarity === rarity
                  ) ?? [];
                  return (
                    <View key={rarity} style={styles.raritySummaryCell}>
                      <Text style={styles.kicker}>{rarityLabel(rarity)}</Text>
                      <Text style={styles.raritySummaryValue}>
                        {rarityBeans.filter((bean) => bean.owned).length}/{rarityBeans.length}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {beanCollection?.beans.filter((bean) => bean.theme === beanTheme).length ? (
                <View style={styles.grid}>
                  {beanCollection?.beans
                    .filter((bean) => bean.theme === beanTheme)
                    .map((bean) => (
                    <Pressable
                      key={bean.id}
                      accessibilityRole={bean.owned ? "button" : undefined}
                      disabled={!bean.owned || loading}
                      onPress={() => setBeanShowcase(bean.id)}
                      style={[styles.beanTile, bean.owned && styles.beanTileOwned]}
                    >
                      <PixelArtPlaceholder kind="bean" size={56} style={styles.beanTileArt} />
                      <Text style={styles.rowTitle}>{bean.name}</Text>
                      <Text style={styles.rowMeta}>
                        {rarityLabel(bean.rarity)} · x{bean.quantity}
                      </Text>
                      <Text style={styles.smallCopy}>
                        {bean.owned ? bean.description : "尚未获得，先保持一点神秘。"}
                      </Text>
                      {bean.owned ? (
                        <Text style={styles.showcaseHint}>放入第 {showcasePosition} 格</Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="这个卡池空空如也"
                  body="完成任意一次活动来攒抽豆机会"
                  icon="🫘"
                />
              )}
            </FramedCard>
            <FramedCard>
              <SectionHeader kicker="豆子组合" title="只看收藏，不消耗豆子" />
              {beanCollection?.combinations.length ? (
                beanCollection.combinations.map((combination) => (
                  <View
                    key={combination.code}
                    style={[styles.listRow, combination.completed && styles.listRowCompleted]}
                  >
                    <View style={styles.flex}>
                      <Text style={styles.rowTitle}>{combination.name}</Text>
                      <Text style={styles.rowMeta}>收集指定豆子即可自动完成</Text>
                    </View>
                    <Text style={combination.completed ? styles.completedMark : styles.progressValue}>
                      {combination.owned}/{combination.required}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState
                  title="组合表还在路上"
                  body="先把豆子收齐，组合就会自动出现"
                  icon="🧩"
                />
              )}
            </FramedCard>
          </>
        ) : null}

        {selectedTab === "rankings" ? (
          <>
          <FramedCard>
            <SectionHeader
              kicker="今日休息榜"
              title={`${social?.reactions.remainingToday ?? 0}/${social?.reactions.dailyLimit ?? 10} 次善意额度`}
            />
            <View style={styles.segmented}>
              {leaderboardScopes.map((scope) => (
                <Pressable
                  key={scope.value}
                  accessibilityRole="button"
                  onPress={() => void selectLeaderboardScope(scope.value)}
                  style={[styles.segment, leaderboardScope === scope.value && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, leaderboardScope === scope.value && styles.segmentTextActive]}>
                    {scope.label}
                  </Text>
                </Pressable>
              ))}
            </View>
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
            <View style={styles.leaderboardBody}>
              {leaderboard?.items.length ? (
                leaderboard.items.map((item) => {
                  const isCurrentUser =
                    !!item.userId && item.userId === leaderboard?.currentUser?.userId;
                  return (
                    <View
                      key={`${item.rank}-${item.userId}`}
                      style={[styles.rankRow, isCurrentUser && styles.rankRowMine]}
                    >
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankNo}>#{item.rank}</Text>
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.rowTitle}>
                          {item.displayName}
                          {isCurrentUser ? "（你）" : ""}
                        </Text>
                        <Text style={styles.rowMeta}>
                          {item.equippedBadge ?? item.equippedTitle ?? "认真摸鱼中"}
                        </Text>
                      </View>
                      <View style={styles.rankActions}>
                        <Text style={styles.rankScore}>{item.score}</Text>
                        {item.userId && item.userId !== leaderboard.currentUser?.userId ? (
                          <View style={styles.reactionRow}>
                            <Pressable accessibilityRole="button" onPress={() => void sendReaction(item.userId!, "tissue")} style={styles.reactionButton}>
                              <Text style={styles.reactionText}>纸 {item.reactions.tissue}</Text>
                            </Pressable>
                            <Pressable accessibilityRole="button" onPress={() => void sendReaction(item.userId!, "like")} style={styles.reactionButton}>
                              <Text style={styles.reactionText}>赞 {item.reactions.like}</Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              ) : (
                <EmptyState
                  title={
                    leaderboard?.suppressed
                      ? leaderboard.suppressionReason === "COMPANY_TOO_SMALL"
                        ? "公司榜还差几位"
                        : "加入小队或公司后开始热闹"
                      : "榜单还空着"
                  }
                  body={
                    leaderboard?.suppressed
                      ? leaderboard.suppressionReason === "COMPANY_TOO_SMALL"
                        ? "公司榜至少需要 3 位成员，避免一眼认出谁是谁。"
                        : "加入对应的小队或公司后，这里才会开始热闹。"
                      : "完成一次摸鱼活动，就能挤进前三名。"
                  }
                  icon="🐟"
                />
              )}
              <View style={styles.myRankSlot}>
                {leaderboard?.currentUser ? (
                  <View style={styles.myRank}>
                    <Text style={styles.myRankText}>
                      你现在第 {leaderboard.currentUser.rank} 名 ·{" "}
                      {leaderboard.currentUser.score} 分
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </FramedCard>
          <FramedCard>
            <SectionHeader kicker="轻社交" title={`好友码 ${social?.friendCode ?? "加载中"}`} />
            <Text style={styles.smallCopy}>
              没有私信，没有动态，只有排行和一点善意。今天已送{" "}
              {social?.reactions.sentToday ?? 0} 次。
            </Text>
            <TextInput
              accessibilityLabel="好友码、小队名或邀请码"
              autoCapitalize="characters"
              onChangeText={setSocialInput}
              placeholder="输入好友码；小队名；或 #邀请码"
              placeholderTextColor="#8a8176"
              style={styles.socialInput}
              value={socialInput}
            />
            <View style={styles.socialActions}>
              <ActionButton label="加好友" disabled={loading || !socialInput.trim()} onPress={() => submitSocialAction("friend")} />
              <ActionButton label="小队：新建/加入" disabled={loading || !socialInput.trim() || Boolean(social?.squad)} onPress={() => submitSocialAction("squad")} dark />
              <ActionButton label="公司：新建/加入" disabled={loading || !socialInput.trim() || Boolean(social?.company)} onPress={() => submitSocialAction("company")} />
            </View>
            <Text style={styles.kickerSection}>好友 {social?.friends.length ?? 0}</Text>
            {social?.friends.map((friend) => (
              <Text key={friend.userId} style={styles.rowMeta}>{friend.displayName}</Text>
            ))}
            {social?.squad ? (
              <>
                <Text style={styles.accentMeta}>小队：{social.squad.name} · #{social.squad.inviteCode} · {social.squad.memberCount} 人</Text>
                <ActionButton label="离开小队" onPress={() => leaveSocialGroup("squad")} dark />
              </>
            ) : null}
            {social?.company ? (
              <>
                <Text style={styles.accentMeta}>公司：{social.company.name} · 匿名身份 {social.company.anonymousAlias} · #{social.company.inviteCode}</Text>
                <ActionButton label="离开公司" onPress={() => leaveSocialGroup("company")} dark />
              </>
            ) : null}
          </FramedCard>
          </>
        ) : null}

        {selectedTab === "profile" ? (
          <>
            <FramedCard>
              <IconTile size={64} accent={colors.gold} style={styles.profileLevelTile}>
                <Text style={styles.profileLevelText}>
                  LV {progression?.level ?? 1}
                </Text>
              </IconTile>
              <View style={styles.flex}>
                <Text style={styles.profileName}>{authLabel ?? "摸鱼同学"}</Text>
                <Text style={styles.rowMeta}>
                  连续休息 {progression?.currentStreakDays ?? 0} 天 · 最长{" "}
                  {progression?.longestStreakDays ?? 0} 天
                </Text>
                <Text style={styles.accentMeta}>
                  {equippedTitle ? `称号：${equippedTitle}` : "称号：还没装备"} ·{" "}
                  {equippedBadge ? `徽章：${equippedBadge}` : "徽章：还没装备"}
                </Text>
              </View>
            </FramedCard>
            <LifetimeStats progression={progression} />
            <FramedCard>
              <SectionHeader kicker="休息连续性" title={`已连续 ${progression?.currentStreakDays ?? 0} 天`} />
              <Text style={styles.copy}>
                最长记录 {progression?.longestStreakDays ?? 0} 天。漏掉一天不会扣分，也不需要付费恢复，想起来时继续就好。
              </Text>
            </FramedCard>
            <FramedCard>
              <SectionHeader kicker="目标板" title="今天别乱卷，挑一个顺手的" />
              <AchievementFocusCard
                achievement={achievementFocus}
                unlockedCount={unlockedAchievements.length}
                totalCount={achievementList?.achievements.length ?? 0}
                onPress={jumpToAchievementTarget}
              />
              <Text style={styles.kickerSection}>近期进展</Text>
              <Text style={styles.rowMeta}>
                今日目标 {progression?.dailyGoals.completed ?? 0}/
                {progression?.dailyGoals.total ?? 3} · 本周目标{" "}
                {progression?.weeklyGoals.completed ?? 0}/
                {progression?.weeklyGoals.total ?? 3} · 成就解锁{" "}
                {unlockedAchievements.length}/{achievementList?.achievements.length ?? 0}
              </Text>
              <Text style={styles.kickerSection}>推荐追逐目标</Text>
              <AchievementRecommendationSection
                title="离你最近"
                items={achievementList?.recommendations?.nearest ?? []}
                focusId={achievementFocus?.id}
                onPress={jumpToAchievementTarget}
              />
              <AchievementRecommendationSection
                title="今天顺手能做"
                items={achievementList?.recommendations?.today ?? []}
                focusId={achievementFocus?.id}
                onPress={jumpToAchievementTarget}
              />
              <AchievementRecommendationSection
                title="长期目标"
                items={achievementList?.recommendations?.long_term ?? []}
                focusId={achievementFocus?.id}
                onPress={jumpToAchievementTarget}
              />
              {!achievementFocus && !secondaryAchievementRecommendations.length ? (
                <EmptyState
                  title="今天没有催你的目标"
                  body="成就板很安静，你已经把休息做得挺像回事了。"
                  icon="🌿"
                />
              ) : null}
            </FramedCard>
            <FramedCard>
              <SectionHeader
                kicker="成就墙"
                title={`已解锁 ${unlockedAchievements.length}/${achievementList?.achievements.length ?? 0}`}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                <CategoryChip
                  label="全部"
                  selected={achievementCategoryFilter === "all"}
                  onPress={() => setAchievementCategoryFilter("all")}
                />
                {achievementCategories.map((category) => (
                  <CategoryChip
                    key={category}
                    label={achievementCategoryLabel(category)}
                    selected={achievementCategoryFilter === category}
                    onPress={() => setAchievementCategoryFilter(category)}
                  />
                ))}
              </ScrollView>
              {filteredAchievements.length ? (
                filteredAchievements.map((achievement) => (
                  <AchievementWallRow
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))
              ) : (
                <EmptyState
                  title="这个分类还没有成就"
                  body="完成任意一个活动来解锁第一枚徽章"
                  icon="🎖️"
                />
              )}
            </FramedCard>
            <FramedCard>
              <SectionHeader kicker="徽章与称号" title="奖励墙" />
              {cosmeticInventory?.cosmetics.length ? (
                cosmeticInventory.cosmetics.map((cosmetic) => (
                  <CosmeticRewardRow
                    key={cosmetic.id}
                    cosmetic={cosmetic}
                    loading={loading}
                    onEquip={equipCosmetic}
                  />
                ))
              ) : (
                <EmptyState
                  title="还没有装扮"
                  body="先认真完成几次休息，再来挑一个喜欢的称号"
                  icon="✨"
                />
              )}
            </FramedCard>
            <PrimaryButton
              label="退出当前账号"
              dark
              onPress={() => void onSignOut()}
            />
          </>
        ) : null}

        <StatusBar style="auto" />
      </ScrollView>

      <BottomNav
        tabs={dashboardTabs}
        selected={selectedTab}
        onSelect={setSelectedTab}
      />
      <AchievementUnlockOverlay
        unlock={achievementUnlockQueue[0] ?? null}
        cosmeticInventory={cosmeticInventory}
        remaining={Math.max(0, achievementUnlockQueue.length - 1)}
        loading={loading}
        onEquip={equipCosmetic}
        onDismiss={() => setAchievementUnlockQueue((current) => current.slice(1))}
      />
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
    </View>
  );
}

function ProgressionClaimResultPanel({
  result,
  nextStep
}: {
  result: ProgressionClaimResult;
  nextStep: ReturnType<typeof deriveGameplayStep>;
}) {
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
      <Text style={styles.helperText}>下一步：{nextStep.title}</Text>
    </View>
  );
}

function DailyRhythmChecklist({
  progression,
  loading,
  onRunGoal
}: {
  progression: ProgressionSummary | null;
  loading: boolean;
  onRunGoal: (code: string) => void | Promise<void>;
}) {
  const goals = progression?.dailyGoals.goals ?? [];
  const incompleteGoals = goals.filter((goal) => !goal.completed);

  return (
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>今天还能做什么</Text>
          <Text style={styles.sectionTitle}>
            {incompleteGoals.length ? "把闭环补完整" : "今天已经很会休息"}
          </Text>
        </View>
        <Text style={styles.goalCount}>
          {progression?.dailyGoals.completed ?? 0}/{progression?.dailyGoals.total ?? 3}
        </Text>
      </View>
      {incompleteGoals.length ? (
        incompleteGoals.map((goal) => (
          <View key={goal.code} style={styles.rhythmRow}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{goal.title}</Text>
              <Text style={styles.rowMeta}>{goal.description}</Text>
              <ProgressBar
                value={goal.current}
                max={goal.target}
                color="#d4a838"
                trackColor="#e2dbd0"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => void onRunGoal(goal.code)}
              style={({ pressed }) => [
                styles.inlineActionButton,
                (pressed || loading) && styles.buttonMuted
              ]}
            >
              <Text style={styles.inlineActionText}>{goalActionLabel(goal.code)}</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>
          今日目标已经完成，领完奖励后就可以去抽豆、看榜，或者什么都不做。
        </Text>
      )}
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

function ActivityInteractionRunner({
  assignment,
  progress,
  onChange
}: {
  assignment: ActivityAssignment;
  progress: ActivityInteractionProgress;
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>;
}) {
  const steps = assignment.interaction.steps;
  const completed = steps.filter((step) => isActivityStepComplete(step, progress)).length;
  return (
    <View style={styles.interactionPanel}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>互动流程</Text>
          <Text style={styles.rowTitle}>
            {completed}/{steps.length} 步 · 约 {assignment.interaction.estimatedSeconds} 秒
          </Text>
        </View>
        <Text style={completed === steps.length ? styles.completedMark : styles.progressValue}>
          {completed === steps.length ? "可领取" : "进行中"}
        </Text>
      </View>
      {steps.map((step, index) => (
        <ActivityStepCard
          key={step.id}
          index={index}
          step={step}
          progress={progress}
          onChange={onChange}
        />
      ))}
    </View>
  );
}

function ActivityStepCard({
  index,
  step,
  progress,
  onChange
}: {
  index: number;
  step: ActivityAssignment["interaction"]["steps"][number];
  progress: ActivityInteractionProgress;
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>;
}) {
  const completed = isActivityStepComplete(step, progress);
  const selectedChoice = step.options?.find(
    (option) => option.id === progress.choiceAnswers?.[step.id]
  );
  const [remaining, setRemaining] = useState<number | null>(null);
  const [miniTapCount, setMiniTapCount] = useState(0);

  useEffect(() => {
    if (remaining === null || remaining <= 0 || completed) {
      return;
    }
    const timer = setTimeout(() => {
      setRemaining((current) => {
        const next = Math.max(0, (current ?? 0) - 1);
        if (next === 0) {
          markTimerStep(onChange, step.id, step.durationSeconds ?? 0);
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [completed, onChange, remaining, step.durationSeconds, step.id]);

  function startTimer() {
    setRemaining(step.durationSeconds ?? 0);
  }

  function tapMiniGame() {
    const next = miniTapCount + 1;
    setMiniTapCount(next);
    if (next >= 5) {
      markMiniGameStep(onChange, step.id, next);
    }
  }

  return (
    <View style={[styles.interactionStep, completed && styles.interactionStepDone]}>
      <View style={styles.rowBetween}>
        <Text style={styles.kicker}>第 {index + 1} 步 · {activityStepTypeLabel(step.type)}</Text>
        <Text style={completed ? styles.completedMark : styles.pendingMark}>
          {completed ? "完成" : "待完成"}
        </Text>
      </View>
      <Text style={styles.rowTitle}>{step.title}</Text>
      <Text style={styles.rowMeta}>{step.description}</Text>
      {step.type === "ack" ? (
        <ActionButton
          label={completed ? "已确认" : "我照做了"}
          disabled={completed}
          onPress={() => markAckStep(onChange, step.id)}
        />
      ) : null}
      {step.type === "timer" ? (
        <>
          <Text style={styles.timerMini}>
            {completed
              ? "00"
              : remaining === null
                ? `${step.durationSeconds ?? 0}`
                : `${remaining.toString().padStart(2, "0")}`}
            s
          </Text>
          <ActionButton
            label={completed ? "倒计时完成" : remaining === null ? "开始倒计时" : "倒计时中"}
            disabled={completed || remaining !== null}
            onPress={startTimer}
          />
        </>
      ) : null}
      {step.type === "choice" ? (
        <>
          <View style={styles.choiceGrid}>
            {step.options?.map((option) => {
              const selected = selectedChoice?.id === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => markChoiceStep(onChange, step.id, option.id)}
                  style={[styles.choiceButton, selected && styles.choiceButtonSelected]}
                >
                  <Text
                    style={[
                      styles.choiceButtonText,
                      selected && styles.choiceButtonTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {selectedChoice ? <Text style={styles.helperText}>{selectedChoice.resultText}</Text> : null}
        </>
      ) : null}
      {step.type === "mini_game" ? (
        <>
          <Text style={styles.helperText}>
            {step.gameCode ?? "mini_game"} · {step.requiredResult ?? "完成即可"}
          </Text>
          <Text style={styles.timerMini}>{Math.min(5, miniTapCount)}/5</Text>
          <ActionButton
            label={completed ? "小游戏通过" : "快速点击"}
            disabled={completed}
            onPress={tapMiniGame}
          />
        </>
      ) : null}
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

function AchievementRecommendationSection({
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

function AchievementFocusCard({
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

function AchievementWallRow({ achievement }: { achievement: Achievement }) {
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

function CosmeticRewardRow({
  cosmetic,
  loading,
  onEquip
}: {
  cosmetic: OwnedCosmetic;
  loading: boolean;
  onEquip: (id: string) => Promise<void>;
}) {
  const owned = cosmetic.owned ?? Boolean(cosmetic.unlockedAt);
  const canEquip = owned && !cosmetic.equipped;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading || !canEquip}
      onPress={() => void onEquip(cosmetic.id)}
      style={[
        styles.cosmeticRow,
        cosmetic.equipped && styles.listRowCompleted,
        !owned && styles.cosmeticRowLocked
      ]}
    >
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{cosmetic.name}</Text>
        <Text style={styles.rowMeta}>
          {cosmetic.cosmeticType === "badge" ? "徽章" : "称号"} · {rarityLabel(cosmetic.rarity)}
        </Text>
        <Text style={styles.smallCopy}>{cosmetic.unlockSummary ?? cosmetic.description}</Text>
      </View>
      <Text
        style={
          cosmetic.equipped
            ? styles.completedMark
            : owned
              ? styles.pendingMark
              : styles.cooldownMark
        }
      >
        {cosmetic.equipped ? "使用中" : owned ? "立即装备" : "未解锁"}
      </Text>
    </Pressable>
  );
}

function CheckInResult({
  result,
  nextStep
}: {
  result: CheckInFinishResult;
  nextStep: ReturnType<typeof deriveGameplayStep>;
}) {
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
      <Text style={styles.helperText}>下一步：{nextStep.title}</Text>
    </View>
  );
}

function RewardPreview({
  preview,
  dark = false
}: {
  preview: { score: number; drawProgress: number; drawChances: number } | null;
  dark?: boolean;
}) {
  if (!preview) return null;
  const items = [
    preview.score > 0 ? `+${preview.score} 分` : null,
    preview.drawProgress > 0 ? `抽豆进度 +${preview.drawProgress}` : null,
    preview.drawChances > 0 ? `${preview.drawChances} 次机会` : null
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <View style={[styles.rewardPreview, dark && styles.rewardPreviewDark]}>
      <Text style={[styles.rewardPreviewText, dark && styles.rewardPreviewTextDark]}>
        预计收获：{items.join(" · ")}
      </Text>
    </View>
  );
}

function AchievementUnlockOverlay({
  unlock,
  cosmeticInventory,
  remaining,
  loading,
  onEquip,
  onDismiss
}: {
  unlock: AchievementUnlockFeedback | null;
  cosmeticInventory: CosmeticInventory | null;
  remaining: number;
  loading: boolean;
  onEquip: (id: string) => Promise<void>;
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!unlock) return;
    let active = true;
    opacity.setValue(0);
    translateY.setValue(24);
    scale.setValue(0.96);
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      if (reduceMotion) {
        opacity.setValue(1);
        translateY.setValue(0);
        scale.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 16,
          stiffness: 180,
          useNativeDriver: true
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 14,
          stiffness: 170,
          useNativeDriver: true
        })
      ]).start();
    });
    return () => {
      active = false;
    };
  }, [opacity, scale, translateY, unlock]);

  if (!unlock) return null;
  const unlockedCosmetic = unlock.rewards.cosmetic
    ? cosmeticInventory?.cosmetics.find(
        (cosmetic) =>
          cosmetic.name === unlock.rewards.cosmetic &&
          (cosmetic.owned ?? Boolean(cosmetic.unlockedAt))
      )
    : null;

  return (
    <Modal transparent animationType="none" visible onRequestClose={onDismiss}>
      <View style={styles.unlockBackdrop}>
        <Animated.View
          style={[
            styles.unlockPanel,
            { opacity, transform: [{ translateY }, { scale }] }
          ]}
        >
          <Text style={styles.unlockEyebrow}>成就解锁</Text>
          <Text style={styles.unlockMark}>ACHIEVED</Text>
          <Text style={styles.unlockTitle}>{unlock.name}</Text>
          <View style={styles.unlockRule} />
          <Text style={styles.unlockRewardTitle}>本次奖励</Text>
          <Text style={styles.unlockRewardCopy}>
            +{unlock.rewards.score} 分 · 抽豆进度 +{unlock.rewards.drawProgress} · 机会 +
            {unlock.rewards.drawChances}
          </Text>
          {unlock.rewards.cosmetic ? (
            <View style={styles.cosmeticReveal}>
              <Text style={styles.kicker}>新装扮</Text>
              <Text style={styles.rowTitle}>{unlock.rewards.cosmetic}</Text>
              {unlockedCosmetic && !unlockedCosmetic.equipped ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={() => void onEquip(unlockedCosmetic.id)}
                  style={styles.inlineEquipButton}
                >
                  <Text style={styles.inlineEquipText}>立即装备</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {remaining > 0 ? (
            <Text style={styles.unlockRemaining}>还有 {remaining} 个成就等待展示</Text>
          ) : null}
          <ActionButton
            label={remaining > 0 ? "查看下一个" : "收下这份荣誉"}
            onPress={onDismiss}
          />
        </Animated.View>
      </View>
    </Modal>
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
  color,
  trackColor = "#514d48"
}: {
  value: number;
  max: number;
  color: string;
  trackColor?: string;
}) {
  const percent = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
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

function pickAchievementFocus(list: AchievementList | null): AchievementRecommendation | null {
  if (!list) return null;
  return (
    list.recommendations.today[0] ??
    list.recommendations.nearest[0] ??
    list.recommendations.long_term[0] ??
    null
  );
}

function achievementTargetTab(achievement: AchievementRecommendation): DashboardTab {
  if (achievement.targetSection === "leaderboards") {
    return "rankings";
  }
  return achievement.targetSection;
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

function beanThemeLabel(theme: string): string {
  return (
    {
      office: "工位卡池",
      restroom: "隔间卡池",
      daydream: "白日梦卡池"
    }[theme] ?? theme
  );
}

function difficultyLabel(difficulty: string): string {
  return ({ easy: "轻松", normal: "正常", hard: "硬核" }[difficulty] ?? difficulty);
}

function achievementProgressLabel(progress: {
  current: number;
  target: number;
  unit: string;
}): string {
  if (progress.unit === "minutes") return `${progress.current}/${progress.target} 分钟`;
  if (progress.unit === "days") return `${progress.current}/${progress.target} 天`;
  if (progress.unit === "rank") {
    return progress.current > 0 ? `第 ${progress.current}/前 ${progress.target}` : `未上榜/前 ${progress.target}`;
  }
  return `${progress.current}/${progress.target}`;
}

function goalActionLabel(code: string): string {
  if (code === "check_in") return "去打卡";
  if (code === "activity") return "去活动";
  if (code === "bean_draw") return "去抽豆";
  return "去完成";
}

function activityStepTypeLabel(type: string): string {
  if (type === "timer") return "倒计时";
  if (type === "choice") return "选择";
  if (type === "mini_game") return "小游戏";
  return "确认";
}

function activityInteractionSummaryLabel(
  summary: ActivityCatalog["items"][number]["interactionSummary"]
): string {
  const traits = [
    summary.hasTimer ? "倒计时" : null,
    summary.hasChoice ? "选择题" : null,
    summary.hasMiniGame ? "小游戏" : null
  ].filter(Boolean);
  const summaryText = `${summary.stepCount} 步 · 约 ${summary.estimatedSeconds} 秒${
    traits.length ? ` · ${traits.join("/")}` : ""
  }`;
  return summary.flavorLabel ? `${summary.flavorLabel} · ${summaryText}` : summaryText;
}

function isActivityInteractionComplete(
  assignment: ActivityAssignment,
  progress: ActivityInteractionProgress
): boolean {
  return assignment.interaction.steps
    .filter((step) => step.required)
    .every((step) => isActivityStepComplete(step, progress));
}

function isActivityStepComplete(
  step: ActivityAssignment["interaction"]["steps"][number],
  progress: ActivityInteractionProgress
): boolean {
  if (step.type === "ack") {
    return Boolean(progress.completedStepIds?.includes(step.id));
  }
  if (step.type === "timer") {
    return (progress.timerSeconds?.[step.id] ?? 0) >= (step.durationSeconds ?? 0);
  }
  if (step.type === "choice") {
    const answer = progress.choiceAnswers?.[step.id];
    return Boolean(answer && (!step.correctOptionId || answer === step.correctOptionId));
  }
  if (step.type === "mini_game") {
    return progress.miniGameResults?.[step.id]?.passed === true;
  }
  return false;
}

function markAckStep(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string
) {
  onChange((current) => ({
    ...current,
    completedStepIds: Array.from(new Set([...(current.completedStepIds ?? []), stepId]))
  }));
}

function markTimerStep(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  seconds: number
) {
  onChange((current) => ({
    ...current,
    timerSeconds: {
      ...(current.timerSeconds ?? {}),
      [stepId]: seconds
    }
  }));
}

function markChoiceStep(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  optionId: string
) {
  onChange((current) => ({
    ...current,
    choiceAnswers: {
      ...(current.choiceAnswers ?? {}),
      [stepId]: optionId
    }
  }));
}

function markMiniGameStep(
  onChange: Dispatch<SetStateAction<ActivityInteractionProgress>>,
  stepId: string,
  score: number
) {
  onChange((current) => ({
    ...current,
    miniGameResults: {
      ...(current.miniGameResults ?? {}),
      [stepId]: { passed: true, score }
    }
  }));
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

function resolveActivityPresentation(activity: {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  code?: string;
  presentation?: ActivityPresentation;
}): ActivityPresentation {
  if (activity.presentation) {
    return activity.presentation;
  }
  const statValue = fallbackActivityStatValue(activity.code ?? activity.title, activity.difficulty);
  if (activity.category === "game") {
    return {
      badge: "小游戏入口",
      tone: "game",
      accentColor: "#6655d8",
      headline: activity.title,
      scene: "屏幕前的短暂叛逃，手指负责把大脑带离工位。",
      prompt: activity.description,
      statLabel: "手眼协调",
      statValue
    };
  }
  if (activity.category === "rest") {
    return {
      badge: "精神离线",
      tone: "calm",
      accentColor: "#1f8f62",
      headline: activity.title,
      scene: "把注意力从消息红点里拽出来，给自己留一小块静音区。",
      prompt: activity.description,
      statLabel: "回血概率",
      statValue
    };
  }
  if (activity.category === "physical") {
    return {
      badge: "身体重启",
      tone: "physical",
      accentColor: "#b9821f",
      headline: activity.title,
      scene: "椅子已经连续获胜太久，现在轮到身体拿回一点控制权。",
      prompt: activity.description,
      statLabel: "关节上线",
      statValue
    };
  }
  if (activity.category === "imagination") {
    return {
      badge: "脑洞逃逸",
      tone: "daydream",
      accentColor: "#2d7d90",
      headline: activity.title,
      scene: "现实先放旁边，给脑内小剧场批准一张临时通行证。",
      prompt: activity.description,
      statLabel: "离谱指数",
      statValue
    };
  }
  return {
    badge: "工位表演",
    tone: "absurd",
    accentColor: "#8b4d36",
    headline: activity.title,
    scene: "这是一场不需要观众的办公室独幕剧，表演结束就能继续装忙。",
    prompt: activity.description,
    statLabel: "戏剧张力",
    statValue
  };
}

function fallbackActivityStatValue(seed: string, difficulty: string): string {
  const base = difficulty === "hard" ? 70 : difficulty === "normal" ? 55 : 40;
  const hash = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
  return `${Math.min(96, base + (hash % 22))}%`;
}

function achievementCategoryLabel(category: string): string {
  return (
    {
      new_user: "新手",
      check_in: "打卡",
      activity: "活动",
      bean_draw: "抽豆",
      leaderboard: "排行",
      social: "社交"
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
const leaderboardScopes: Array<{ value: LeaderboardScope; label: string }> = [
  { value: "global", label: "全站" },
  { value: "friends", label: "好友" },
  { value: "squad", label: "小队" },
  { value: "company", label: "公司" }
];

const activityCategories: ActivityCategory[] = [
  "rest",
  "game",
  "office_theater",
  "physical",
  "imagination"
];

const achievementCategories: Achievement["category"][] = [
  "new_user",
  "check_in",
  "activity",
  "bean_draw",
  "leaderboard",
  "social"
];

const activitySkipReasonOptions: Array<{ value: ActivitySkipReason; label: string }> = [
  { value: "not_interested", label: "没兴趣" },
  { value: "too_much_work", label: "太麻烦" },
  { value: "not_convenient", label: "不方便" },
  { value: "want_weirder", label: "来点怪的" },
  { value: "other", label: "换个口味" }
];

const beanThemes: BeanTheme[] = ["office", "restroom", "daydream"];
const beanRarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;

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
  app: { backgroundColor: "#f4efe4", flex: 1 },
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
  headerTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  brand: { color: "#17a36b", fontSize: 14, fontWeight: "900" },
  uiLabButton: {
    alignItems: "center",
    borderColor: "#18232b",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 10
  },
  uiLabButtonText: {
    color: "#18232b",
    fontSize: 12,
    fontWeight: "900"
  },
  pageTitle: { color: "#18232b", fontSize: 30, fontWeight: "900", marginTop: 8 },
  pageSubtitle: { color: "#5f574d", fontSize: 15, lineHeight: 22, marginTop: 6 },
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
    borderColor: "#4ca6a8",
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 16,
    padding: 18
  },
  activityHeroCard: {
    backgroundColor: "#fff6df",
    borderLeftWidth: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  activityCardTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  activityBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  activityStat: {
    color: "#625b52",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 18,
    paddingTop: 4
  },
  activityHeadline: {
    color: "#18232b",
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 29
  },
  activityScene: {
    color: "#47413a",
    fontSize: 14,
    lineHeight: 21
  },
  activityPromptBox: {
    backgroundColor: "#ffffff",
    borderColor: "#e2dbd0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
    padding: 12
  },
  activityPrompt: {
    color: "#2f2a25",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21
  },
  progressionPanel: {
    backgroundColor: "#18232b",
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
  progressionXp: { color: "#b7f05a", fontSize: 18, fontWeight: "900" },
  progressionMeta: { color: "#c8c1b7", fontSize: 13, marginTop: 8 },
  darkKicker: { color: "#bdb5aa", fontSize: 12, fontWeight: "900" },
  kicker: { color: "#756c61", fontSize: 12, fontWeight: "900" },
  sectionTitle: { color: "#18232b", fontSize: 21, fontWeight: "900", marginTop: 6 },
  timer: { color: "#18232b", fontSize: 58, fontWeight: "900", marginTop: 8 },
  copy: { color: "#47413a", fontSize: 15, lineHeight: 22, marginTop: 8 },
  smallCopy: { color: "#746b60", fontSize: 12, lineHeight: 18, marginTop: 7 },
  helperText: { color: "#746b60", fontSize: 13, lineHeight: 19, marginTop: 10 },
  kickerSection: { color: "#756c61", fontSize: 12, fontWeight: "900", marginTop: 20 },
  accentMeta: { color: "#2f6f8f", fontSize: 13, fontWeight: "900", marginTop: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#17a36b",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 12
  },
  actionButtonDark: { backgroundColor: "#18232b" },
  actionButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "900", textAlign: "center" },
  buttonMuted: { opacity: 0.42 },
  inlineActionButton: {
    alignItems: "center",
    backgroundColor: "#18232b",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 74,
    paddingHorizontal: 12
  },
  inlineActionText: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  nextStepPanel: {
    backgroundColor: "#18232b",
    borderRadius: 8,
    marginBottom: 16,
    padding: 18
  },
  nextStepTitle: { color: "#ffffff", fontSize: 21, fontWeight: "900", marginTop: 7 },
  nextStepCopy: { color: "#d5cec4", fontSize: 14, lineHeight: 21, marginTop: 7 },
  rewardPreview: {
    alignSelf: "flex-start",
    backgroundColor: "#eef7f3",
    borderColor: "#b7d9c8",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  rewardPreviewDark: {
    backgroundColor: "#35322e",
    borderColor: "#6d655b"
  },
  rewardPreviewText: { color: "#1f8f62", fontSize: 12, fontWeight: "900" },
  rewardPreviewTextDark: { color: "#f0c95a" },
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
  activityResultCertificate: {
    backgroundColor: "#eef7f3",
    borderLeftWidth: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 14
  },
  activityResultTitle: {
    color: "#232323",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: 10
  },
  interactionPanel: {
    backgroundColor: "#f7f2e8",
    borderColor: "#d8d0c4",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 12
  },
  interactionStep: {
    backgroundColor: "#fffdf8",
    borderColor: "#e2dbd0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  interactionStepDone: {
    backgroundColor: "#edf8f2",
    borderColor: "#82b99f"
  },
  timerMini: {
    color: "#232323",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 10
  },
  choiceGrid: {
    gap: 8,
    marginTop: 12
  },
  choiceButton: {
    borderColor: "#cfc7bb",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  choiceButtonSelected: {
    backgroundColor: "#232323",
    borderColor: "#232323"
  },
  choiceButtonText: { color: "#625b52", fontSize: 13, fontWeight: "900" },
  choiceButtonTextSelected: { color: "#ffffff" },
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
  skipReasonBox: {
    gap: 4,
    paddingTop: 4
  },
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
  rhythmRow: {
    alignItems: "center",
    borderColor: "#e2dbd0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    minHeight: 72,
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
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 13
  },
  beanTileOwned: { backgroundColor: colors.mintLight, borderColor: colors.mintMid },
  beanTileArt: { marginBottom: 8 },
  beanThemeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  beanThemeButton: {
    alignItems: "center",
    borderColor: "#cfc7bb",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    padding: 7
  },
  beanThemeButtonActive: { backgroundColor: "#232323", borderColor: "#232323" },
  beanThemeButtonText: { color: "#625b52", fontSize: 12, fontWeight: "900", textAlign: "center" },
  beanThemeButtonTextActive: { color: "#ffffff" },
  beanThemeCount: { color: "#746b60", fontSize: 11, marginTop: 3 },
  beanCollectionSummary: {
    alignItems: "center",
    backgroundColor: "#eef7f3",
    borderColor: "#b7d9c8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 12
  },
  beanEconomyGrid: { flexDirection: "row", gap: 10, marginTop: 14 },
  beanEconomyCell: {
    backgroundColor: "#f4f0e8",
    borderRadius: 8,
    flex: 1,
    minHeight: 102,
    padding: 12
  },
  beanEconomyValue: { color: "#232323", fontSize: 24, fontWeight: "900", marginTop: 5 },
  showcaseRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  showcaseSlot: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 76,
    padding: 10
  },
  showcaseSlotActive: { backgroundColor: colors.warningSoft, borderColor: colors.goldDeep },
  showcasePlaceholder: { marginBottom: 6 },
  showcaseBeanName: { color: colors.ink, fontSize: 13, fontWeight: "900", marginTop: 7 },
  showcaseHint: { color: colors.primary, fontSize: 11, fontWeight: "900", marginTop: 9 },
  raritySummaryRow: { flexDirection: "row", gap: 5, marginTop: 14 },
  raritySummaryCell: {
    alignItems: "center",
    backgroundColor: "#f4f0e8",
    borderRadius: 6,
    flex: 1,
    minHeight: 50,
    padding: 6
  },
  raritySummaryValue: { color: "#232323", fontSize: 14, fontWeight: "900", marginTop: 3 },
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
  leaderboardBody: {
    minHeight: 156
  },
  leaderboardEmptyState: {
    justifyContent: "center",
    minHeight: 78
  },
  rankRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingVertical: 10
  },
  rankRowMine: {
    backgroundColor: colors.mintLight,
    borderRadius: 8,
    marginTop: 6,
    paddingHorizontal: 8
  },
  rankBadge: {
    alignItems: "center",
    backgroundColor: colors.acid,
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 32,
    minWidth: 44
  },
  rankNo: { color: colors.inkBlue, fontSize: 14, fontWeight: "900" },
  rankScore: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  rankActions: { alignItems: "flex-end", gap: 6 },
  reactionRow: { flexDirection: "row", gap: 5 },
  reactionButton: { backgroundColor: colors.surfaceMuted, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 5 },
  reactionText: { color: colors.inkMuted, fontSize: 11, fontWeight: "900" },
  socialInput: {
    backgroundColor: "#f4f0e8",
    borderColor: "#d8d0c4",
    borderRadius: 8,
    borderWidth: 1,
    color: "#232323",
    fontSize: 14,
    marginTop: 14,
    minHeight: 46,
    paddingHorizontal: 12
  },
  socialActions: { flexDirection: "row", gap: 7 },
  myRankSlot: { minHeight: 54 },
  myRank: { backgroundColor: "#232323", borderRadius: 8, marginTop: 14, padding: 13 },
  myRankText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  profileLevelTile: {
    backgroundColor: colors.ink,
    borderColor: colors.goldDeep,
    borderWidth: 2
  },
  profileLevelText: { color: colors.gold, fontSize: 18, fontWeight: "900" },
  profileName: { color: colors.ink, fontSize: 22, fontWeight: "900", marginBottom: 4 },
  statGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 82,
    padding: 8
  },
  statValue: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  statLabel: { color: colors.inkMuted, fontSize: 11, marginTop: 4, textAlign: "center" },
  recommendationBlock: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12
  },
  focusAchievementCard: {
    alignItems: "center",
    backgroundColor: colors.mintLight,
    borderColor: colors.mintMid,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 14
  },
  recommendationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8
  },
  cosmeticRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 10,
    padding: 12
  },
  cosmeticRowLocked: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.82
  },
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
  unlockBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(20, 19, 17, 0.72)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  unlockPanel: {
    backgroundColor: "#fffdf8",
    borderColor: "#d4a838",
    borderRadius: 8,
    borderWidth: 2,
    maxWidth: 460,
    padding: 24,
    width: "100%"
  },
  unlockEyebrow: {
    color: "#8b6b16",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  unlockMark: {
    color: "#d4a838",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 14,
    textAlign: "center"
  },
  unlockTitle: {
    color: "#232323",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center"
  },
  unlockRule: {
    alignSelf: "center",
    backgroundColor: "#d4a838",
    height: 3,
    marginVertical: 18,
    width: 54
  },
  unlockRewardTitle: { color: "#756c61", fontSize: 12, fontWeight: "900", textAlign: "center" },
  unlockRewardCopy: {
    color: "#232323",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: 6,
    textAlign: "center"
  },
  cosmeticReveal: {
    backgroundColor: "#fff4c9",
    borderRadius: 8,
    marginTop: 16,
    padding: 13
  },
  inlineEquipButton: {
    alignItems: "center",
    backgroundColor: "#232323",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 36,
    paddingHorizontal: 12
  },
  inlineEquipText: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  unlockRemaining: {
    color: "#746b60",
    fontSize: 12,
    marginTop: 14,
    textAlign: "center"
  },
  emptyText: { color: "#746b60", fontSize: 14, lineHeight: 21, marginTop: 12 }
});
