import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import {
  AchievementApi,
  type Achievement,
  type AchievementList,
  type AchievementRecommendation,
  type CosmeticInventory
} from "../../api/achievements";
import {
  ActivityApi,
  type ActivityAssignment,
  type ActivityCatalog,
  type ActivityCategory,
  type ActivityCompleteResult,
  type ActivityFeedbackResponse,
  type ActivityFeedbackType,
  type ActivityInteractionProgress,
  type ActivitySkipReason
} from "../../api/activities";
import {
  BeanApi,
  type BeanCollection,
  type BeanDrawResult,
  type BeanTheme
} from "../../api/beans";
import { ApiClient } from "../../api/client";
import { CheckInApi, type CheckInFinishResult, type CheckInSession } from "../../api/checkins";
import {
  LeaderboardApi,
  type LeaderboardResponse,
  type LeaderboardScope,
  type LeaderboardWindow
} from "../../api/leaderboards";
import {
  ProgressionApi,
  type ProgressionClaimResult,
  type ProgressionPeriod,
  type ProgressionSummary
} from "../../api/progression";
import { env } from "../../config/env";
import { SocialApi, type SocialReactionType, type SocialSummary } from "../../api/social";
import {
  dashboardTabs,
  getDashboardTab,
  type DashboardTab
} from "../../gameplay/dashboardTabs";
import { deriveGameplayStep } from "../../gameplay/nextStep";
import { deriveTodayPlayLoop, type TodayLoopAction } from "../../gameplay/todayLoop";
import { logEvent } from "../../observability/logger";
import { useBrandName } from "../../ui/useBrandName";
import { BottomNav } from "../../ui/BottomNav";
import { AchievementUnlockOverlay } from "./parts/AchievementUnlockOverlay";
import { HomeTab } from "./HomeTab";
import { ActivitiesTab } from "./ActivitiesTab";
import { BeansTab } from "./BeansTab";
import { LeaderboardsTab } from "./LeaderboardsTab";
import { ProfileTab } from "./ProfileTab";
import { formatDuration, findGoal, isActivityInteractionComplete } from "./helpers";
import styles from "./styles";
import type {
  AchievementUnlockFeedback,
  HomeScreenProps
} from "./types";

export function DashboardScreen({
  authLabel,
  getAccessToken,
  onOpenUiLab,
  onSignOut
}: HomeScreenProps) {
  const api = useMemo(() => {
    const client = new ApiClient({ baseUrl: env.apiBaseUrl, getAccessToken });
    return {
      achievements: new AchievementApi(client),
      activities: new ActivityApi(client),
      beans: new BeanApi(client),
      checkIns: new CheckInApi(client),
      leaderboards: new LeaderboardApi(client),
      progression: new ProgressionApi(client),
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
  const [activityFeedbackAck, setActivityFeedbackAck] = useState<ActivityFeedbackResponse | null>(null);
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
    setActivityFeedbackAck(null);
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
    unlocks.forEach((achievement) => {
      logEvent("info", "analytics.achievement.unlocked", {
        achievementId: achievement.id,
        achievementCode: achievement.code,
        achievementName: achievement.name
      });
    });
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

  async function submitActivityFeedback(feedbackType: ActivityFeedbackType) {
    if (!activityResult) {
      return;
    }
    setLoading(true);
    setActivityMessage(null);
    const response = await api.activities.submitFeedback(activityResult.assignment.assignmentId, {
      feedbackType,
      source: "completion"
    });
    setLoading(false);
    if (response.error) {
      setActivityMessage(response.error.message);
      return;
    }
    setActivityFeedbackAck(response.data);
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
    await Promise.all([
      refreshAchievements(),
      refreshLeaderboard(leaderboardWindow, leaderboardScope)
    ]);
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
  const todayLoop = deriveTodayPlayLoop({
    activeSession,
    lastResult,
    activityAssignment,
    activityResult,
    beanCollection,
    beanDrawResult,
    progression,
    achievementList,
    activityUnavailable
  });
  const tabMeta = getDashboardTab(selectedTab);

  function jumpToAchievementTarget(achievement: AchievementRecommendation) {
    if (achievement.targetSection === "leaderboards") {
      setSelectedTab("rankings");
    } else {
      setSelectedTab(achievement.targetSection);
    }
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

  async function runTodayLoopAction(action: TodayLoopAction) {
    if (action.kind === "check-in") {
      setSelectedTab("home");
      if (activeSession) {
        await finishSession();
      } else {
        await startSession();
      }
      return;
    }
    if (action.kind === "activity") {
      setSelectedTab("activities");
      if (activityAssignment?.status === "active") {
        return;
      }
      await randomActivity();
      return;
    }
    if (action.kind === "bean-draw") {
      setSelectedTab("beans");
      if ((beanCollection?.drawChances ?? 0) > 0) {
        await drawBean();
      }
      return;
    }
    if (action.kind === "goal-reward") {
      setSelectedTab("home");
      await claimProgressionReward(action.meta?.period === "weekly" ? "weekly" : "daily");
      return;
    }
    setSelectedTab(action.targetSection);
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
          <HomeTab
            loading={loading}
            progression={progression}
            activeSession={activeSession}
            elapsedLabel={elapsedLabel}
            activeSessionOverLimit={activeSessionOverLimit}
            lastResult={lastResult}
            progressionClaim={progressionClaim}
            nextStep={nextStep}
            todayLoop={todayLoop}
            actions={{
              startSession,
              finishSession,
              claimDailyReward: () => claimProgressionReward("daily"),
              claimWeeklyReward: () => claimProgressionReward("weekly"),
              runNextStep,
              runTodayLoopAction
            }}
          />
        ) : null}

        {selectedTab === "activities" ? (
          <ActivitiesTab
            loading={loading}
            goal={findGoal(progression, "activity")}
            assignment={activityAssignment}
            result={activityResult}
            catalog={activityCatalog}
            history={activityHistory}
            feedbackAck={activityFeedbackAck}
            message={activityMessage}
            unavailable={activityUnavailable}
            category={activityCategory}
            progress={activityProgress}
            skipReason={activitySkipReason}
            nextStep={nextStep}
            todayLoop={todayLoop}
            actions={{
              setCategory: setActivityCategory,
              setProgress: setActivityProgress,
              setSkipReason: setActivitySkipReason,
              randomActivity,
              completeActivity,
              submitFeedback: submitActivityFeedback,
              skipActivity,
              runTodayLoopAction
            }}
          />
        ) : null}

        {selectedTab === "beans" ? (
          <BeansTab
            loading={loading}
            goal={findGoal(progression, "bean_draw")}
            collection={beanCollection}
            drawResult={beanDrawResult}
            selectedTheme={beanTheme}
            showcasePosition={showcasePosition}
            nextStep={nextStep}
            todayLoop={todayLoop}
            actions={{
              setTheme: setBeanTheme,
              setShowcasePosition,
              drawBean,
              exchangeFragments: exchangeBeanFragments,
              setShowcase: setBeanShowcase,
              runTodayLoopAction
            }}
          />
        ) : null}

        {selectedTab === "rankings" ? (
          <LeaderboardsTab
            loading={loading}
            leaderboardLoading={leaderboardLoading}
            leaderboard={leaderboard}
            window={leaderboardWindow}
            scope={leaderboardScope}
            social={social}
            socialInput={socialInput}
            actions={{
              selectWindow: selectLeaderboardWindow,
              selectScope: selectLeaderboardScope,
              setSocialInput,
              submitSocialAction,
              leaveGroup: leaveSocialGroup,
              sendReaction
            }}
          />
        ) : null}

        {selectedTab === "profile" ? (
          <ProfileTab
            authLabel={authLabel}
            progression={progression}
            achievementList={achievementList}
            cosmeticInventory={cosmeticInventory}
            categoryFilter={achievementCategoryFilter}
            actions={{
              setCategoryFilter: setAchievementCategoryFilter,
              equipCosmetic,
              signOut: onSignOut,
              jumpToAchievementTarget
            }}
          />
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
