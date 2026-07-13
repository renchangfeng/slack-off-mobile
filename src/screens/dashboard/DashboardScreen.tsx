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
  type ActivityHistorySession,
  type ActivityInteractionProgress,
  type ActivityRandomRequest,
  type ActivitySkipReason
} from "../../api/activities";
import {
  BeanApi,
  type BeanCollection,
  type BeanDrawResult,
  type BeanTheme
} from "../../api/beans";
import { ApiClient } from "../../api/client";
import {
  FishTankApi,
  createFishTankIdempotencyKey,
  type DecorationInventoryItem,
  type EquipDecorationResult,
  type FishTankSummary,
  type HatchResult
} from "../../api/fishTank";
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
import { DashboardFeedbackBanner } from "./parts/DashboardFeedbackBanner";
import { HomeTab } from "./HomeTab";
import { ActivitiesTab } from "./ActivitiesTab";
import { BeansTab } from "./BeansTab";
import { LeaderboardsTab } from "./LeaderboardsTab";
import { ProfileTab } from "./ProfileTab";
import { buildReplaySimilarRequest, formatDuration, findGoal, isActivityInteractionComplete } from "./helpers";
import styles from "./styles";
import type {
  AchievementUnlockFeedback,
  HomeScreenProps
} from "./types";
import {
  clearFeedbackListForScope,
  createDashboardFeedback,
  DASHBOARD_FEEDBACK_TIMEOUT_MS,
  expireDashboardFeedbackFromList,
  fishTankInventoryFollowUp,
  localizedApiError,
  planDashboardNavigation,
  replaceFeedbackForScope,
  resolveLandingOffset,
  runSingleFlight,
  selectLatestLoopResults,
  synchronizeFishTankAfterBeanDraw,
  visibleDashboardFeedbackFromList,
  type DashboardApiError,
  type DashboardFeedback,
  type DashboardLandingTarget
} from "./dashboardCoherence";

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
      fishTank: new FishTankApi(client),
      leaderboards: new LeaderboardApi(client),
      progression: new ProgressionApi(client),
      social: new SocialApi(client)
    };
  }, [getAccessToken]);

  const brand = useBrandName();
  const scrollViewRef = useRef<ScrollView>(null);
  const selectedTabRef = useRef<DashboardTab>("home");
  const feedbackSequenceRef = useRef(0);
  const feedbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const landingOffsetsRef = useRef<Partial<Record<DashboardLandingTarget, number>>>({});
  const pendingLandingRef = useRef<{ tab: DashboardTab; target: DashboardLandingTarget } | null>(null);
  const routeActionPendingRef = useRef(false);

  const [selectedTab, setSelectedTab] = useState<DashboardTab>("home");
  const [activeSession, setActiveSession] = useState<CheckInSession | null>(null);
  const [progression, setProgression] = useState<ProgressionSummary | null>(null);
  const [progressionClaim, setProgressionClaim] = useState<ProgressionClaimResult | null>(null);
  const [beanCollection, setBeanCollection] = useState<BeanCollection | null>(null);
  const [beanDrawResult, setBeanDrawResult] = useState<BeanDrawResult | null>(null);
  const [beanTheme, setBeanTheme] = useState<BeanTheme>("office");
  const [showcasePosition, setShowcasePosition] = useState(1);
  const [fishTank, setFishTank] = useState<FishTankSummary | null>(null);
  const [fishTankLoading, setFishTankLoading] = useState(false);
  const [fishTankError, setFishTankError] = useState<string | null>(null);
  const [fishTankResultCopy, setFishTankResultCopy] = useState<string | null>(null);
  const [hatchResult, setHatchResult] = useState<HatchResult | null>(null);
  const [hatchError, setHatchError] = useState<string | null>(null);
  const [hatchLoading, setHatchLoading] = useState(false);
  const hatchIdempotencyKeyRef = useRef<string | null>(null);
  const [equipResult, setEquipResult] = useState<EquipDecorationResult | null>(null);
  const [equipError, setEquipError] = useState<string | null>(null);
  const [equipLoading, setEquipLoading] = useState(false);
  const equipIdempotencyKeyRef = useRef<Record<string, string | null>>({});
  const [lastResult, setLastResult] = useState<CheckInFinishResult | null>(null);
  const [latestLoopResult, setLatestLoopResult] = useState<
    "check-in" | "activity" | "bean-draw" | null
  >(null);
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
  const [activityHistory, setActivityHistory] = useState<ActivityHistorySession[]>([]);
  const [activityHistoryLoading, setActivityHistoryLoading] = useState(false);
  const [activityHistoryError, setActivityHistoryError] = useState<string | null>(null);
  const [activityHistoryCursor, setActivityHistoryCursor] = useState<string | null>(null);
  const [cosmeticInventory, setCosmeticInventory] = useState<CosmeticInventory | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [leaderboardWindow, setLeaderboardWindow] = useState<LeaderboardWindow>("daily");
  const [leaderboardScope, setLeaderboardScope] = useState<LeaderboardScope>("global");
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [social, setSocial] = useState<SocialSummary | null>(null);
  const [socialInput, setSocialInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<DashboardFeedback[]>([]);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const leaderboardRequestId = useRef(0);

  const showFeedback = useCallback(
    (kind: DashboardFeedback["kind"], message: string, scope = selectedTabRef.current) => {
      feedbackSequenceRef.current += 1;
      const next = createDashboardFeedback({
          id: `dashboard_feedback_${feedbackSequenceRef.current}`,
          kind,
          scope,
          message
        });
      setFeedback((current) => replaceFeedbackForScope(current, next));
    },
    []
  );

  const clearCurrentFeedback = useCallback(() => {
    const scope = selectedTabRef.current;
    setFeedback((current) => clearFeedbackListForScope(current, scope));
  }, []);

  const setMessage = useCallback(
    (message: string | null) => {
      if (message === null) {
        clearCurrentFeedback();
        return;
      }
      showFeedback("error", message);
    },
    [clearCurrentFeedback, showFeedback]
  );

  const setNotice = useCallback(
    (message: string | null) => {
      if (message === null) {
        clearCurrentFeedback();
        return;
      }
      showFeedback("success", message);
    },
    [clearCurrentFeedback, showFeedback]
  );

  const showApiError = useCallback(
    (
      error: DashboardApiError | null | undefined,
      scope: DashboardTab,
      fallback?: string
    ) => showFeedback("error", localizedApiError(error, fallback), scope),
    [showFeedback]
  );

  const scrollToLanding = useCallback((target: DashboardLandingTarget) => {
    scrollViewRef.current?.scrollTo({
      y: resolveLandingOffset(target, landingOffsetsRef.current),
      animated: true
    });
  }, []);

  const navigateDashboard = useCallback(
    (tab: DashboardTab, target: DashboardLandingTarget = "top") => {
      const plan = planDashboardNavigation({
        currentTab: selectedTabRef.current,
        destinationTab: tab,
        target,
        offsets: landingOffsetsRef.current
      });
      setFeedback((current) => clearFeedbackListForScope(current, plan.clearScope));
      selectedTabRef.current = plan.destinationTab;
      pendingLandingRef.current = { tab: plan.destinationTab, target: plan.target };
      setSelectedTab(plan.destinationTab);
      if (plan.reselect) {
        setTimeout(() => scrollToLanding(target), 0);
      }
    },
    [scrollToLanding]
  );

  const registerLandingOffset = useCallback(
    (target: DashboardLandingTarget, y: number) => {
      landingOffsetsRef.current[target] = y;
      const pending = pendingLandingRef.current;
      if (pending?.tab === selectedTabRef.current && pending.target === target) {
        pendingLandingRef.current = null;
        setTimeout(() => scrollToLanding(target), 0);
      }
    },
    [scrollToLanding]
  );

  useEffect(() => {
    const pending = pendingLandingRef.current;
    if (!pending || pending.tab !== selectedTab) return;
    const timer = setTimeout(() => {
      scrollToLanding(pending.target);
      if (pending.target === "top" || landingOffsetsRef.current[pending.target] !== undefined) {
        pendingLandingRef.current = null;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [scrollToLanding, selectedTab]);

  useEffect(() => {
    const activeIds = new Set(feedback.map((item) => item.id));
    feedbackTimersRef.current.forEach((timer, id) => {
      if (!activeIds.has(id)) {
        clearTimeout(timer);
        feedbackTimersRef.current.delete(id);
      }
    });
    feedback
      .filter((item) => item.autoDismiss && !feedbackTimersRef.current.has(item.id))
      .forEach((item) => {
        const timer = setTimeout(() => {
          feedbackTimersRef.current.delete(item.id);
          setFeedback((current) => expireDashboardFeedbackFromList(current, item.id));
        }, DASHBOARD_FEEDBACK_TIMEOUT_MS);
        feedbackTimersRef.current.set(item.id, timer);
      });
  }, [feedback]);

  useEffect(
    () => () => {
      feedbackTimersRef.current.forEach(clearTimeout);
      feedbackTimersRef.current.clear();
    },
    []
  );

  const refreshProgression = useCallback(async () => {
    const response = await api.progression.getSummary();
    if (response.error) {
      showApiError(response.error, "home");
      return;
    }
    setProgression(response.data);
  }, [api.progression]);

  const refreshBeans = useCallback(async () => {
    const response = await api.beans.getCollection();
    if (response.error) {
      showApiError(response.error, "beans");
      return;
    }
    setBeanCollection(response.data);
  }, [api.beans]);

  const refreshFishTank = useCallback(async (): Promise<boolean> => {
    setFishTankLoading(true);
    setFishTankError(null);
    const response = await api.fishTank.getSummary();
    setFishTankLoading(false);
    if (response.error) {
      setFishTankError(localizedApiError(response.error, "鱼缸库存同步失败，请重试。"));
      return false;
    }
    setFishTank(response.data);
    return true;
  }, [api.fishTank]);

  const refreshAchievements = useCallback(async () => {
    const [achievementResponse, cosmeticResponse] = await Promise.all([
      api.achievements.getAchievements(),
      api.achievements.getCosmetics()
    ]);
    if (achievementResponse.error || cosmeticResponse.error) {
      showApiError(
        achievementResponse.error ?? cosmeticResponse.error,
        "profile",
        "个人档案加载失败，请重试。"
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
        showApiError(response.error, "rankings");
        return;
      }
      setLeaderboard(response.data);
    },
    [api.leaderboards]
  );

  const refreshSocial = useCallback(async () => {
    const response = await api.social.getSummary();
    if (response.error) {
      showApiError(response.error, "rankings");
      return;
    }
    setSocial(response.data);
  }, [api.social]);

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const activeResponse = await api.checkIns.getActive();
    if (activeResponse.error) {
      showApiError(activeResponse.error, "home");
    } else {
      setActiveSession(activeResponse.data);
    }
    await Promise.all([
      refreshProgression(),
      refreshBeans(),
      refreshFishTank(),
      refreshAchievements(),
      refreshLeaderboard("daily", "global"),
      refreshSocial()
    ]);
    setLoading(false);
  }, [
    api.checkIns,
    refreshAchievements,
    refreshBeans,
    refreshFishTank,
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
    setActivityResult(null);
  }, [activityAssignment?.assignmentId]);

  async function refreshActivityData(category: ActivityCategory | null = activityCategory) {
    setActivityHistoryLoading(true);
    setActivityHistoryError(null);
    const [catalogResponse, historyResponse] = await Promise.all([
      api.activities.getCatalog(category ?? undefined),
      api.activities.getHistory({ window: "recent", limit: 20 })
    ]);
    setActivityHistoryLoading(false);
    if (catalogResponse.error || historyResponse.error) {
      const localizedError = localizedApiError(
        historyResponse.error ?? catalogResponse.error,
        "活动资料加载失败，请重试。"
      );
      setActivityHistoryError(localizedError);
      setActivityMessage(localizedError);
      return;
    }
    setActivityCatalog(catalogResponse.data);
    setActivityHistory(historyResponse.data?.items ?? []);
    setActivityHistoryCursor(historyResponse.data?.nextCursor ?? null);
  }

  async function refreshAfterReward(options: { fishTank?: boolean } = {}): Promise<boolean> {
    const [, , , , fishTankCurrent] = await Promise.all([
      refreshProgression(),
      refreshBeans(),
      refreshAchievements(),
      refreshLeaderboard(leaderboardWindow, leaderboardScope),
      options.fishTank ? refreshFishTank() : Promise.resolve(true)
    ]);
    return fishTankCurrent;
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
      showApiError(response.error, "home");
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
      showApiError(response.error, "home");
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
      showApiError(response.error, "home");
      return;
    }
    setActiveSession(null);
    setLastResult(response.data);
    setLatestLoopResult("check-in");
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
      showApiError(response.error, "beans");
      return;
    }
    setBeanDrawResult(response.data);
    setLatestLoopResult("bean-draw");
    setNotice(
      `抽到了${response.data?.bean.name ?? "一颗豆"}，还剩 ${response.data?.remainingDrawChances ?? 0} 次机会。`
    );
    enqueueAchievementUnlocks(response.data?.achievementsUnlocked ?? []);
    const syncState = await synchronizeFishTankAfterBeanDraw(response.data, () =>
      refreshAfterReward({ fishTank: true })
    );
    if (syncState === "not-required") {
      await refreshAfterReward();
    } else if (syncState === "stale") {
      setMessage("奖励已经到账，但鱼缸库存同步失败。请在鱼缸卡片中重试。");
    }
  }

  async function initializeTank() {
    setFishTankLoading(true);
    setFishTankError(null);
    const response = await api.fishTank.initializeTank();
    setFishTankLoading(false);
    if (response.error) {
      setFishTankError(localizedApiError(response.error, "鱼缸开启失败，请重试。"));
      return;
    }
    setFishTank(response.data);
    setFishTankResultCopy(null);
  }

  async function feedFish() {
    setFishTankLoading(true);
    setFishTankError(null);
    const response = await api.fishTank.interact("feed");
    setFishTankLoading(false);
    if (response.error) {
      setFishTankError(localizedApiError(response.error, "鱼缸互动失败，请重试。"));
      return;
    }
    setFishTankResultCopy(response.data?.resultCopy ?? null);
    setFishTank(response.data?.tank ?? null);
  }

  function ensureHatchIdempotencyKey(): string {
    if (!hatchIdempotencyKeyRef.current) {
      hatchIdempotencyKeyRef.current = createFishTankIdempotencyKey("fish_tank_hatch");
    }
    return hatchIdempotencyKeyRef.current!;
  }

  async function hatchFish() {
    setHatchLoading(true);
    setHatchError(null);
    const idempotencyKey = ensureHatchIdempotencyKey();
    const response = await api.fishTank.hatch(idempotencyKey);
    setHatchLoading(false);
    if (response.error) {
      setHatchError(localizedApiError(response.error, "孵化没有成功，请重试。"));
      return;
    }
    setHatchResult(response.data);
    if (response.data?.tank) {
      setFishTank(response.data.tank);
    }
  }

  function dismissHatchResult() {
    setHatchResult(null);
    setHatchError(null);
    hatchIdempotencyKeyRef.current = null;
  }

  function ensureEquipIdempotencyKey(definitionId: string): string {
    if (!equipIdempotencyKeyRef.current[definitionId]) {
      equipIdempotencyKeyRef.current[definitionId] = createFishTankIdempotencyKey("fish_tank_equip");
    }
    return equipIdempotencyKeyRef.current[definitionId]!;
  }

  async function equipFishTankDecoration(item: DecorationInventoryItem) {
    setEquipLoading(true);
    setEquipError(null);
    const idempotencyKey = ensureEquipIdempotencyKey(item.definitionId);
    const response = await api.fishTank.equipDecoration(
      item.slot,
      item.definitionId,
      idempotencyKey
    );
    setEquipLoading(false);
    if (response.error) {
      setEquipError(localizedApiError(response.error, "装扮没有装备成功，请重试。"));
      return;
    }
    setEquipResult(response.data);
    if (response.data?.tank) {
      setFishTank(response.data.tank);
    }
  }

  function dismissEquipResult() {
    setEquipResult(null);
    setEquipError(null);
    equipIdempotencyKeyRef.current = {};
  }

  async function exchangeBeanFragments() {
    setLoading(true);
    setMessage(null);
    setNotice(null);
    const response = await api.beans.exchangeFragments();
    setLoading(false);
    if (response.error) {
      showApiError(response.error, "beans");
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
      showApiError(response.error, "beans");
      return;
    }
    setNotice(`已放入展示柜第 ${showcasePosition} 格。`);
    await refreshBeans();
  }

  async function randomActivity(request: ActivityRandomRequest = {}) {
    setLoading(true);
    setMessage(null);
    setNotice(null);
    setActivityMessage(null);
    setActivityResult(null);
    setActivityFeedbackAck(null);
    const response = await api.activities.random({
      category: activityCategory ?? undefined,
      ...request
    });
    setLoading(false);
    if (response.error) {
      if (response.error.code === "NO_ELIGIBLE_ACTIVITY") {
        setActivityUnavailable(true);
        setActivityMessage("当前任务都在冷却中，晚一点再来领取。");
      } else {
        setActivityMessage(localizedApiError(response.error, "任务领取失败，请重试。"));
      }
      return;
    }
    setActivityUnavailable(false);
    setActivityAssignment(response.data);
    setActivityProgress({});
    setNotice("任务已领取。完成后回到活动页领取奖励。");
    await refreshActivityData();
  }

  async function trySimilarActivity(session: ActivityHistorySession) {
    await randomActivity(buildReplaySimilarRequest(session));
  }

  async function loadMoreHistory() {
    if (!activityHistoryCursor || activityHistoryLoading) {
      return;
    }
    setActivityHistoryLoading(true);
    const response = await api.activities.getHistory({
      window: "recent",
      limit: 20,
      cursor: activityHistoryCursor
    });
    setActivityHistoryLoading(false);
    if (response.error) {
      setActivityHistoryError(localizedApiError(response.error, "更多活动记录加载失败，请重试。"));
      return;
    }
    setActivityHistory((current) => [...current, ...(response.data?.items ?? [])]);
    setActivityHistoryCursor(response.data?.nextCursor ?? null);
  }

  function selectActivityCategory(category: ActivityCategory | null) {
    setActivityCategory(category);
    setActivityUnavailable(false);
    setActivityMessage(null);
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
      setActivityMessage(localizedApiError(response.error, "活动结算失败，请重试。"));
      return;
    }
    if (!response.data) {
      setActivityMessage("活动结果走丢了，请稍后重试。");
      return;
    }
    setActivityResult(response.data);
    setLatestLoopResult("activity");
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
      setActivityMessage(localizedApiError(response.error, "反馈提交失败，请重试。"));
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
    setActivityResult(null);
    setActivityFeedbackAck(null);
    const response = await api.activities.skip(activityAssignment.assignmentId, activitySkipReason);
    setLoading(false);
    if (response.error) {
      setActivityMessage(localizedApiError(response.error, "任务放弃失败，请重试。"));
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
      showApiError(response.error, "profile");
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
      showApiError(response.error, "rankings");
      return;
    }
    setSocial(response.data);
    setSocialInput("");
    await refreshLeaderboard(leaderboardWindow, leaderboardScope);
  }

  async function sendReaction(userId: string, reactionType: SocialReactionType) {
    const response = await api.social.react(userId, reactionType);
    if (response.error) {
      showApiError(response.error, "rankings");
      return;
    }
    setNotice(response.data?.resultCopy ?? (response.data?.created ? "心意已送达。" : "今天已经送过这份心意了。"));
    await refreshSocial();
    await refreshLeaderboard(leaderboardWindow, leaderboardScope);
  }

  async function leaveSocialGroup(kind: "squad" | "company") {
    const response = await api.social.leaveGroup(kind);
    if (response.error) {
      showApiError(response.error, "rankings");
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
  const latestLoopResults = selectLatestLoopResults(latestLoopResult, {
    lastResult,
    activityResult,
    beanDrawResult
  });
  const todayLoop = deriveTodayPlayLoop({
    activeSession,
    lastResult: latestLoopResults.lastResult,
    activityAssignment,
    activityResult: latestLoopResults.activityResult,
    beanCollection,
    beanDrawResult: latestLoopResults.beanDrawResult,
    progression,
    achievementList,
    activityUnavailable
  });
  const tabMeta = getDashboardTab(selectedTab);
  const visibleFeedback = visibleDashboardFeedbackFromList(feedback, selectedTab);

  function jumpToAchievementTarget(achievement: AchievementRecommendation) {
    if (achievement.targetSection === "leaderboards") {
      navigateDashboard("rankings");
    } else {
      navigateDashboard(achievement.targetSection);
    }
  }

  async function runNextStep() {
    await runSingleFlight(routeActionPendingRef, async () => {
      const landingTarget: DashboardLandingTarget =
        nextStep.kind === "draw-bean"
          ? "draw-result"
          : nextStep.kind === "complete-activity"
            ? "current-activity"
            : "top";
      navigateDashboard(nextStep.targetSection, landingTarget);
      if (nextStep.kind === "start-checkin") await startSession();
      else if (nextStep.kind === "finish-checkin") await finishSession();
      else if (nextStep.kind === "draw-bean") await drawBean();
      else if (nextStep.kind === "complete-activity") await completeActivity();
      else if (nextStep.kind === "claim-daily-reward") await claimProgressionReward("daily");
      else if (nextStep.kind === "claim-weekly-reward") await claimProgressionReward("weekly");
      else await randomActivity();
    });
  }

  async function runTodayLoopAction(action: TodayLoopAction) {
    await runSingleFlight(routeActionPendingRef, async () => {
      const landingTarget: DashboardLandingTarget =
        action.kind === "activity"
          ? "current-activity"
          : action.kind === "bean-draw" && action.execution === "mutate"
            ? "draw-result"
            : "top";
      navigateDashboard(action.targetSection, landingTarget);
      if (action.execution === "navigate") return;
      if (action.kind === "check-in") {
        if (activeSession) await finishSession();
        else await startSession();
      } else if (action.kind === "activity") {
        await randomActivity();
      } else if (action.kind === "bean-draw") {
        if ((beanCollection?.drawChances ?? 0) > 0) await drawBean();
      } else if (action.kind === "goal-reward") {
        await claimProgressionReward(action.meta?.period === "weekly" ? "weekly" : "daily");
      }
    });
  }

  async function inspectFishTank() {
    navigateDashboard(fishTankInventoryFollowUp.tab, fishTankInventoryFollowUp.target);
    if (fishTankError) {
      const current = await refreshFishTank();
      if (!current) {
        setMessage("鱼缸库存还没有同步成功，请在鱼缸卡片中重试。");
      }
    }
  }

  return (
    <View style={styles.app}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container}>
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
        {visibleFeedback ? (
          <DashboardFeedbackBanner
            feedback={visibleFeedback}
            onDismiss={() =>
              setFeedback((current) =>
                current.filter((item) => item.id !== visibleFeedback.id)
              )
            }
          />
        ) : null}

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
            onLandingLayout={(target, y) => registerLandingOffset(target, y)}
            loading={loading}
            goal={findGoal(progression, "activity")}
            assignment={activityAssignment}
            result={activityResult}
            catalog={activityCatalog}
            history={activityHistory}
            historyLoading={activityHistoryLoading}
            historyError={activityHistoryError}
            historyCursor={activityHistoryCursor}
            feedbackAck={activityFeedbackAck}
            message={activityMessage}
            unavailable={activityUnavailable}
            category={activityCategory}
            progress={activityProgress}
            skipReason={activitySkipReason}
            nextStep={nextStep}
            todayLoop={todayLoop}
            actions={{
              setCategory: selectActivityCategory,
              setProgress: setActivityProgress,
              setSkipReason: setActivitySkipReason,
              randomActivity,
              trySimilarActivity,
              loadMoreHistory,
              completeActivity,
              submitFeedback: submitActivityFeedback,
              skipActivity,
              runTodayLoopAction
            }}
          />
        ) : null}

        {selectedTab === "beans" ? (
          <BeansTab
            onLandingLayout={(target, y) => registerLandingOffset(target, y)}
            loading={loading}
            goal={findGoal(progression, "bean_draw")}
            collection={beanCollection}
            drawResult={beanDrawResult}
            selectedTheme={beanTheme}
            showcasePosition={showcasePosition}
            nextStep={nextStep}
            todayLoop={todayLoop}
            fishTank={fishTank}
            fishTankLoading={fishTankLoading}
            fishTankError={fishTankError}
            fishTankResultCopy={fishTankResultCopy}
            hatchResult={hatchResult}
            hatchError={hatchError}
            hatchLoading={hatchLoading}
            equipResult={equipResult}
            equipError={equipError}
            equipLoading={equipLoading}
            actions={{
              setTheme: setBeanTheme,
              setShowcasePosition,
              drawBean,
              exchangeFragments: exchangeBeanFragments,
              setShowcase: setBeanShowcase,
              runTodayLoopAction,
              initializeTank,
              feedFish,
              hatchFish,
              dismissHatchResult,
              refreshFishTank,
              inspectFishTank,
              equipDecoration: equipFishTankDecoration,
              dismissEquipResult
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
        onSelect={(tab) => navigateDashboard(tab, "top")}
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
