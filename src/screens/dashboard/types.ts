import type {
  Achievement,
  AchievementList,
  AchievementRecommendation,
  CosmeticInventory,
  OwnedCosmetic
} from "../../api/achievements";
import type {
  ActivityAssignment,
  ActivityCatalog,
  ActivityCategory,
  ActivityCompleteResult,
  ActivityFeedbackResponse,
  ActivityFeedbackType,
  ActivityHistorySession,
  ActivityInteractionProgress,
  ActivityRandomRequest,
  ActivitySkipReason
} from "../../api/activities";
import type { BeanCollection, BeanDrawResult, BeanTheme } from "../../api/beans";
import type { FishTankSummary, HatchResult } from "../../api/fishTank";
import type { CheckInFinishResult, CheckInSession } from "../../api/checkins";
import type { Dispatch, SetStateAction } from "react";
import type { LeaderboardResponse, LeaderboardScope, LeaderboardWindow } from "../../api/leaderboards";
import type { ProgressionClaimResult, ProgressionSummary } from "../../api/progression";
import type { SocialReactionType, SocialSummary } from "../../api/social";
import type { DashboardTab } from "../../gameplay/dashboardTabs";
import type { deriveGameplayStep } from "../../gameplay/nextStep";
import type { TodayLoopAction, TodayLoopViewModel } from "../../gameplay/todayLoop";

export type HomeScreenProps = {
  authLabel?: string;
  getAccessToken: () => Promise<string | null>;
  onOpenUiLab?: () => void;
  onSignOut: () => Promise<void>;
};

export type AchievementUnlockFeedback = {
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

export type DerivedGameplayStep = ReturnType<typeof deriveGameplayStep>;

export type HomeTabProps = {
  loading: boolean;
  progression: ProgressionSummary | null;
  activeSession: CheckInSession | null;
  elapsedLabel: string;
  activeSessionOverLimit: boolean;
  lastResult: CheckInFinishResult | null;
  progressionClaim: ProgressionClaimResult | null;
  nextStep: DerivedGameplayStep;
  todayLoop: TodayLoopViewModel;
  actions: {
    startSession(): void | Promise<void>;
    finishSession(): void | Promise<void>;
    claimDailyReward(): void | Promise<void>;
    claimWeeklyReward(): void | Promise<void>;
    runNextStep(): void | Promise<void>;
    runTodayLoopAction(action: TodayLoopAction): void | Promise<void>;
  };
};

export type ActivitiesTabProps = {
  loading: boolean;
  goal: ProgressionSummary["dailyGoals"]["goals"][number] | null;
  assignment: ActivityAssignment | null;
  result: ActivityCompleteResult | null;
  catalog: ActivityCatalog | null;
  history: ActivityHistorySession[];
  historyLoading: boolean;
  historyError: string | null;
  historyCursor: string | null;
  feedbackAck: ActivityFeedbackResponse | null;
  message: string | null;
  unavailable: boolean;
  category: ActivityCategory | null;
  progress: ActivityInteractionProgress;
  skipReason: ActivitySkipReason;
  nextStep: DerivedGameplayStep;
  todayLoop: TodayLoopViewModel;
  actions: {
    setCategory(category: ActivityCategory | null): void;
    setProgress: Dispatch<SetStateAction<ActivityInteractionProgress>>;
    setSkipReason(reason: ActivitySkipReason): void;
    randomActivity(request?: ActivityRandomRequest): void | Promise<void>;
    trySimilarActivity(session: ActivityHistorySession): void | Promise<void>;
    loadMoreHistory(): void | Promise<void>;
    completeActivity(): void | Promise<void>;
    submitFeedback(feedbackType: ActivityFeedbackType): void | Promise<void>;
    skipActivity(): void | Promise<void>;
    runTodayLoopAction(action: TodayLoopAction): void | Promise<void>;
  };
};

export type BeansTabProps = {
  loading: boolean;
  goal: ProgressionSummary["dailyGoals"]["goals"][number] | null;
  collection: BeanCollection | null;
  drawResult: BeanDrawResult | null;
  selectedTheme: BeanTheme;
  showcasePosition: number;
  nextStep: DerivedGameplayStep;
  todayLoop: TodayLoopViewModel;
  fishTank: FishTankSummary | null;
  fishTankLoading: boolean;
  fishTankError: string | null;
  fishTankResultCopy: string | null;
  hatchResult: HatchResult | null;
  hatchError: string | null;
  hatchLoading: boolean;
  actions: {
    setTheme(theme: BeanTheme): void;
    setShowcasePosition(position: number): void;
    drawBean(): void | Promise<void>;
    exchangeFragments(): void | Promise<void>;
    setShowcase(beanId: string): void | Promise<void>;
    runTodayLoopAction(action: TodayLoopAction): void | Promise<void>;
    initializeTank(): void | Promise<void>;
    feedFish(): void | Promise<void>;
    hatchFish(): void | Promise<void>;
    dismissHatchResult(): void;
    refreshFishTank(): void | Promise<void>;
    inspectFishTank(): void;
  };
};

export type LeaderboardsTabProps = {
  loading: boolean;
  leaderboardLoading: boolean;
  leaderboard: LeaderboardResponse | null;
  window: LeaderboardWindow;
  scope: LeaderboardScope;
  social: SocialSummary | null;
  socialInput: string;
  actions: {
    selectWindow(window: LeaderboardWindow): void | Promise<void>;
    selectScope(scope: LeaderboardScope): void | Promise<void>;
    setSocialInput(value: string): void;
    submitSocialAction(action: "friend" | "squad" | "company"): void | Promise<void>;
    leaveGroup(kind: "squad" | "company"): void | Promise<void>;
    sendReaction(userId: string, type: SocialReactionType): void | Promise<void>;
  };
};

export type ProfileTabProps = {
  authLabel?: string;
  progression: ProgressionSummary | null;
  achievementList: AchievementList | null;
  cosmeticInventory: CosmeticInventory | null;
  categoryFilter: Achievement["category"] | "all";
  actions: {
    setCategoryFilter(category: Achievement["category"] | "all"): void;
    equipCosmetic(id: string): Promise<void>;
    signOut(): void | Promise<void>;
    jumpToAchievementTarget(target: AchievementRecommendation): void;
  };
};

export type { DashboardTab };
