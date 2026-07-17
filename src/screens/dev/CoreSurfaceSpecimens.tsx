import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  CoreSurfaceGrid,
  DurableReceipt,
  PrimaryActionPanel,
  SummaryCard
} from "../../ui/CoreSurface";
import { SectionHeader } from "../../ui/components";
import { SectionSwitcher } from "../../ui/SectionSwitcher";
import { useReducedMotion } from "../../ui/motion/useReducedMotion";
import { useTheme } from "../../ui/theme/useTheme";
import { spacing } from "../../ui/tokens";
import {
  activitiesModes,
  beansModes,
  homeModes,
  profileModes,
  rankingsModes,
  resolveSemanticDestination
} from "../dashboard/coreSurface";
import { HomeTab } from "../dashboard/HomeTab";
import { ActivitiesTab } from "../dashboard/ActivitiesTab";
import { BeansTab } from "../dashboard/BeansTab";
import { LeaderboardsTab } from "../dashboard/LeaderboardsTab";
import { ProfileTab } from "../dashboard/ProfileTab";
import type {
  AnyDashboardMode,
  DashboardSemanticAnchor,
  DashboardSemanticDestination
} from "../dashboard/coreSurface";
import { DashboardFeedbackBanner } from "../dashboard/parts/DashboardFeedbackBanner";
import { createDashboardFeedback } from "../dashboard/dashboardCoherence";
import type { HomeTabProps } from "../dashboard/types";
import type { ActivitiesTabProps } from "../dashboard/types";
import type { BeansTabProps } from "../dashboard/types";
import type { LeaderboardsTabProps } from "../dashboard/types";
import type { ProfileTabProps } from "../dashboard/types";

const noop = () => undefined;
const noopAsync = async () => undefined;

function ModeNavigationSpecimens() {
  const [modes, setModes] = useState<Record<string, AnyDashboardMode>>({
    home: "today",
    activities: "play",
    beans: "tank",
    rankings: "ranking",
    profile: "overview"
  });

  const groups = [
    { label: "Home", tab: "home", modes: homeModes },
    { label: "Activities", tab: "activities", modes: activitiesModes },
    { label: "Beans", tab: "beans", modes: beansModes },
    { label: "Rankings", tab: "rankings", modes: rankingsModes },
    { label: "Profile", tab: "profile", modes: profileModes }
  ];

  return (
    <View style={{ gap: spacing.md }}>
      {groups.map((group) => (
        <SectionSwitcher
          key={group.tab}
          options={group.modes.map((m) => ({ value: m.value, label: m.label }))}
          selected={modes[group.tab]}
          onSelect={(value) =>
            setModes((current) => ({ ...current, [group.tab]: value as AnyDashboardMode }))
          }
          accessibilityLabel={`${group.label} mode`}
        />
      ))}
      <SectionSwitcher
        options={[
          { value: "current", label: "当前推荐与进行中的任务" },
          { value: "history", label: "历史记录与今日洞察" },
          { value: "preferences", label: "偏好与筛选条件" }
        ]}
        selected="current"
        onSelect={noop}
        accessibilityLabel="长中文标签模式"
      />
    </View>
  );
}

function PrimitiveSpecimens() {
  const theme = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <PrimaryActionPanel accentColor={theme.colors.primary}>
        <Text style={{ color: theme.colors.text, fontWeight: "900" }}>
          Primary action panel
        </Text>
        <Text style={{ color: theme.colors.textMuted, marginTop: spacing.xs }}>
          Dominant action lives here, with an accent border.
        </Text>
      </PrimaryActionPanel>
      <SummaryCard
        title="Summary card"
        status="Compact status line"
        actionLabel="Action"
        onAction={noop}
      />
      <DurableReceipt
        title="Durable receipt"
        outcome="Outcome line that stays visible after the action completes."
        nextActionLabel="下一步"
        onNext={noop}
        onDismiss={noop}
      />
      <CoreSurfaceGrid>
        <SummaryCard title="Grid item A" status="Narrow stacks, wide goes row." />
        <SummaryCard title="Grid item B" status="Second item" />
      </CoreSurfaceGrid>
      <SummaryCard
        title="一段用于检查动态文字放大和长中文换行能力的摘要标题"
        status="状态说明也故意写得更长，确保窄屏不会为了保持单行而撑出页面级横向滚动。"
        actionLabel="查看完整详情"
        onAction={noop}
      />
      <DurableReceipt
        title="操作未完成"
        outcome="这是一个持久错误标本：网络恢复后可以重试，切换到其他分区再回来时仍应保留。"
        nextActionLabel="重新尝试"
        onNext={noop}
        onDismiss={noop}
      />
    </View>
  );
}

const semanticLandingFixtures: Array<
  DashboardSemanticDestination & { label: string }
> = [
  { label: "当前活动", tab: "activities", anchor: "current-activity" },
  { label: "活动历史", tab: "activities", anchor: "activity-history" },
  { label: "鱼缸", tab: "beans", anchor: "fish-tank" },
  { label: "抽豆", tab: "beans", anchor: "draw" },
  { label: "抽豆结果", tab: "beans", anchor: "draw-result" },
  { label: "豆子收藏", tab: "beans", anchor: "bean-collection" },
  { label: "排行榜", tab: "rankings", anchor: "ranking" },
  { label: "社交管理", tab: "rankings", anchor: "social" },
  { label: "成就", tab: "profile", anchor: "achievement" },
  { label: "装扮奖励", tab: "profile", anchor: "cosmetic" }
];

function SemanticLandingSpecimens() {
  const [selectedAnchor, setSelectedAnchor] = useState<DashboardSemanticAnchor>(
    "current-activity"
  );
  const fixture =
    semanticLandingFixtures.find((item) => item.anchor === selectedAnchor) ??
    semanticLandingFixtures[0];
  const resolved = resolveSemanticDestination(fixture);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {semanticLandingFixtures.map((item) => {
          const destination = resolveSemanticDestination(item);
          return (
            <SummaryCard
              key={item.anchor}
              title={item.label}
              status={`${destination.tab} / ${destination.mode} / ${destination.anchor}`}
              actionLabel="预览落点"
              onAction={() => setSelectedAnchor(item.anchor ?? "top")}
              style={{ minWidth: 240 }}
            />
          );
        })}
      </View>
      <DurableReceipt
        title={`语义落点：${fixture.label}`}
        outcome={`先激活 ${resolved.tab}，再切换 ${resolved.mode}，最后等待 ${resolved.anchor} 布局完成。导航本身不会执行 mutation。`}
      />
    </View>
  );
}

function ScopedFeedbackSpecimens() {
  const historyError = createDashboardFeedback({
    id: "ui-lab-history-error",
    kind: "error",
    scope: "activities:history",
    message: "活动历史暂时加载失败；切回任务模式时不应显示。"
  });
  const drawError = createDashboardFeedback({
    id: "ui-lab-draw-error",
    kind: "error",
    scope: "beans:draw",
    message: "抽豆没有成功；鱼缸和收藏模式不应显示这条错误。"
  });

  return (
    <View style={{ gap: spacing.md }}>
      <SpecimenCard
        label="activities:history scoped error"
        component={<DashboardFeedbackBanner feedback={historyError} onDismiss={noop} />}
      />
      <SpecimenCard
        label="beans:draw scoped error"
        component={<DashboardFeedbackBanner feedback={drawError} onDismiss={noop} />}
      />
    </View>
  );
}

function ReducedMotionSpecimen() {
  const reducedMotion = useReducedMotion();
  return (
    <DurableReceipt
      title={reducedMotion ? "减弱动态已开启" : "减弱动态未开启"}
      outcome="即使没有位移或 reveal 动画，选中态、结果标题、结果内容和下一步仍通过静态文字与边框保持可理解。"
      nextActionLabel="静态下一步"
      onNext={noop}
    />
  );
}

export function makeHomeProps(
  overrides?: Partial<HomeTabProps>
): HomeTabProps {
  return {
    loading: false,
    progression: null,
    activeSession: null,
    elapsedLabel: "00:00",
    activeSessionOverLimit: false,
    lastResult: null,
    progressionClaim: null,
    nextStep: {
      kind: "start-checkin",
      title: "从一次带薪休息开始",
      description: "开始计时。",
      actionLabel: "开始打卡",
      execution: "mutate",
      targetSection: "home",
      rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 }
    } as HomeTabProps["nextStep"],
    todayLoop: {
      routeSteps: [],
      primaryNextAction: null,
      secondaryActions: [],
      todayObjectives: [],
      loopMessage: "UI Lab 预览",
      routeProgress: {
        completedCoreSteps: 0,
        totalCoreSteps: 4,
        percent: 0,
        progressLabel: "0/4",
        stageLabel: "今日路线还没开张"
      },
      routeDelight: {
        mood: "first-open",
        title: "今日路线还没开张",
        copy: "先坐下，合法休息一下。",
        doneForToday: false
      },
      resultDelight: null,
      resultFollowUps: { primary: null, secondary: [] },
      drawChanceSource: null
    },
    actions: {
      startSession: noopAsync,
      finishSession: noopAsync,
      claimDailyReward: noopAsync,
      claimWeeklyReward: noopAsync,
      runNextStep: noopAsync,
      runTodayLoopAction: noopAsync
    },
    ...overrides
  } as HomeTabProps;
}

function HomeSurfaceSpecimens() {
  const reducedMotion = useReducedMotion();
  const empty = makeHomeProps();
  const active = makeHomeProps({
    activeSession: { id: "lab", startedAt: new Date().toISOString() } as any,
    elapsedLabel: "12:34",
    todayLoop: {
      ...empty.todayLoop,
      primaryNextAction: {
        kind: "check-in",
        title: "先把这次休息坐实",
        description: "计时正在进行。",
        actionLabel: "结束并结算",
        execution: "mutate",
        targetSection: "home",
        rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 }
      },
      routeDelight: {
        mood: "in-progress",
        title: "正在推进今日路线",
        copy: "休息计时中。",
        doneForToday: false
      },
      routeProgress: {
        completedCoreSteps: 1,
        totalCoreSteps: 4,
        percent: 25,
        progressLabel: "1/4",
        stageLabel: "当前：正在休息"
      }
    }
  });
  const claimable = makeHomeProps({
    progression: {
      level: 2,
      experience: 80,
      currentLevelExperience: 30,
      nextLevelExperience: 100,
      progressPercent: 30,
      currentStreakDays: 3,
      longestStreakDays: 5,
      lifetime: {},
      dailyGoals: {
        period: "daily",
        completed: 3,
        total: 3,
        allCompleted: true,
        rewardClaimed: false,
        claimedAt: null,
        reward: { score: 10, drawProgress: 1 },
        goals: []
      },
      weeklyGoals: {
        period: "weekly",
        completed: 1,
        total: 3,
        allCompleted: false,
        rewardClaimed: true,
        claimedAt: null,
        reward: { score: 20, drawProgress: 2 },
        goals: []
      },
      nextActions: []
    } as any,
    todayLoop: {
      ...empty.todayLoop,
      primaryNextAction: {
        kind: "goal-reward",
        title: "今日目标已达成",
        description: "领取今日成长奖励。",
        actionLabel: "领取今日奖励",
        execution: "mutate",
        targetSection: "home",
        rewardPreview: { score: 10, drawProgress: 1, drawChances: 0 },
        meta: { period: "daily" }
      },
      routeDelight: {
        mood: "reward-ready",
        title: "奖励已经在门口探头",
        copy: "目标奖励可以领了。",
        doneForToday: false
      }
    }
  });
  const done = makeHomeProps({
    todayLoop: {
      ...empty.todayLoop,
      routeDelight: {
        mood: "done-for-today",
        title: "今日收工",
        copy: "已经够会休息了。",
        doneForToday: true
      },
      routeProgress: {
        completedCoreSteps: 4,
        totalCoreSteps: 4,
        percent: 100,
        progressLabel: "4/4",
        stageLabel: "今日收工"
      }
    }
  });
  const loading = makeHomeProps({ loading: true });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text style={{ color: "#746b60", fontSize: 12 }}>
        Reduced motion: {reducedMotion ? "on" : "off"}. Each specimen is a full HomeTab render.
      </Text>
      <SpecimenCard label="Empty morning" component={<HomeTab {...empty} />} />
      <SpecimenCard label="Active check-in" component={<HomeTab {...active} />} />
      <SpecimenCard label="Claimable reward" component={<HomeTab {...claimable} />} />
      <SpecimenCard label="Done for today" component={<HomeTab {...done} />} />
      <SpecimenCard label="Loading" component={<HomeTab {...loading} />} />
    </View>
  );
}

export function makeActivitiesProps(
  overrides?: Partial<ActivitiesTabProps>
): ActivitiesTabProps {
  const base: ActivitiesTabProps = {
    mode: "play",
    onLandingLayout: noop,
    loading: false,
    goal: null,
    assignment: null,
    result: null,
    catalog: null,
    history: [],
    historyLoading: false,
    historyError: null,
    historyCursor: null,
    feedbackAck: null,
    message: null,
    unavailable: false,
    category: null,
    progress: {},
    skipReason: "not_interested",
    nextStep: {
      kind: "get-activity",
      title: "领取摸鱼任务",
      description: "完成随机摸鱼任务。",
      actionLabel: "领取任务",
      execution: "mutate",
      targetSection: "activities",
      rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
    } as ActivitiesTabProps["nextStep"],
    todayLoop: {
      routeSteps: [],
      primaryNextAction: null,
      secondaryActions: [],
      todayObjectives: [],
      loopMessage: "",
      routeProgress: {
        completedCoreSteps: 0,
        totalCoreSteps: 4,
        percent: 0,
        progressLabel: "0/4",
        stageLabel: ""
      },
      routeDelight: {
        mood: "first-open",
        title: "",
        copy: "",
        doneForToday: false
      },
      resultDelight: null,
      resultFollowUps: { primary: null, secondary: [] },
      drawChanceSource: null
    },
    actions: {
      setCategory: noop,
      setProgress: noop,
      setSkipReason: noop,
      randomActivity: noopAsync,
      trySimilarActivity: noopAsync,
      loadMoreHistory: noopAsync,
      completeActivity: noopAsync,
      submitFeedback: noopAsync,
      skipActivity: noopAsync,
      runTodayLoopAction: noopAsync
    }
  };
  return { ...base, ...overrides } as ActivitiesTabProps;
}

function ActivitiesSurfaceSpecimens() {
  const play = makeActivitiesProps({ mode: "play" });
  const history = makeActivitiesProps({ mode: "history" });
  const loading = makeActivitiesProps({ loading: true });
  return (
    <View style={{ gap: spacing.lg }}>
      <SpecimenCard label="Play mode" component={<ActivitiesTab {...play} />} />
      <SpecimenCard label="History mode" component={<ActivitiesTab {...history} />} />
      <SpecimenCard label="Loading" component={<ActivitiesTab {...loading} />} />
    </View>
  );
}

export function makeBeansProps(overrides?: Partial<BeansTabProps>): BeansTabProps {
  const base: BeansTabProps = {
    mode: "tank",
    onLandingLayout: noop,
    loading: false,
    goal: null,
    collection: null,
    drawResult: null,
    selectedTheme: "office",
    showcasePosition: 1,
    nextStep: {
      kind: "draw-bean",
      title: "你有 0 次抽豆机会",
      description: "",
      actionLabel: "抽一颗",
      execution: "mutate",
      targetSection: "beans",
      rewardPreview: { score: 0, drawProgress: 0, drawChances: 0 }
    } as BeansTabProps["nextStep"],
    todayLoop: {
      routeSteps: [],
      primaryNextAction: null,
      secondaryActions: [],
      todayObjectives: [],
      loopMessage: "",
      routeProgress: {
        completedCoreSteps: 0,
        totalCoreSteps: 4,
        percent: 0,
        progressLabel: "0/4",
        stageLabel: ""
      },
      routeDelight: {
        mood: "first-open",
        title: "",
        copy: "",
        doneForToday: false
      },
      resultDelight: null,
      resultFollowUps: { primary: null, secondary: [] },
      drawChanceSource: null
    },
    fishTank: null,
    fishTankLoading: false,
    fishTankError: null,
    fishTankResultCopy: null,
    fishTankResult: null,
    bubbleLoading: false,
    displayedFishLoading: false,
    displayedFishDraft: null,
    hatchResult: null,
    hatchError: null,
    hatchLoading: false,
    equipResult: null,
    equipError: null,
    equipLoading: false,
    actions: {
      setTheme: noop,
      setShowcasePosition: noop,
      drawBean: noopAsync,
      exchangeFragments: noopAsync,
      setShowcase: noopAsync,
      runTodayLoopAction: noopAsync,
      initializeTank: noopAsync,
      feedFish: noopAsync,
      bubbleFish: noopAsync,
      hatchFish: noopAsync,
      dismissHatchResult: noop,
      refreshFishTank: async () => true,
      inspectFishTank: noopAsync,
      reorderDisplayedFish: noopAsync,
      setDisplayedFishDraft: noop,
      equipDecoration: noopAsync,
      dismissEquipResult: noop,
      dismissFishTankResult: noop
    }
  };
  return { ...base, ...overrides } as BeansTabProps;
}

function BeansSurfaceSpecimens() {
  const tank = makeBeansProps({ mode: "tank" });
  const draw = makeBeansProps({ mode: "draw" });
  const collection = makeBeansProps({ mode: "collection" });
  const loading = makeBeansProps({ loading: true });
  return (
    <View style={{ gap: spacing.lg }}>
      <SpecimenCard label="Tank mode" component={<BeansTab {...tank} />} />
      <SpecimenCard label="Draw mode" component={<BeansTab {...draw} />} />
      <SpecimenCard label="Collection mode" component={<BeansTab {...collection} />} />
      <SpecimenCard label="Loading" component={<BeansTab {...loading} />} />
    </View>
  );
}

export function makeLeaderboardsProps(
  overrides?: Partial<LeaderboardsTabProps>
): LeaderboardsTabProps {
  const base: LeaderboardsTabProps = {
    mode: "ranking",
    onLandingLayout: noop,
    loading: false,
    leaderboardLoading: false,
    leaderboard: null,
    window: "daily",
    scope: "global",
    social: null,
    socialInput: "",
    actions: {
      selectWindow: noopAsync,
      selectScope: noopAsync,
      setSocialInput: noop,
      submitSocialAction: noopAsync,
      leaveGroup: noopAsync,
      sendReaction: noopAsync
    }
  };
  return { ...base, ...overrides } as LeaderboardsTabProps;
}

function LeaderboardsSurfaceSpecimens() {
  const ranking = makeLeaderboardsProps({ mode: "ranking" });
  const social = makeLeaderboardsProps({ mode: "social" });
  const loading = makeLeaderboardsProps({ loading: true });
  return (
    <View style={{ gap: spacing.lg }}>
      <SpecimenCard label="Ranking mode" component={<LeaderboardsTab {...ranking} />} />
      <SpecimenCard label="Social mode" component={<LeaderboardsTab {...social} />} />
      <SpecimenCard label="Loading" component={<LeaderboardsTab {...loading} />} />
    </View>
  );
}

export function makeProfileProps(overrides?: Partial<ProfileTabProps>): ProfileTabProps {
  const base: ProfileTabProps = {
    mode: "overview",
    onLandingLayout: noop,
    authLabel: "摸鱼同学",
    progression: null,
    achievementList: null,
    cosmeticInventory: null,
    categoryFilter: "all",
    actions: {
      setCategoryFilter: noop,
      equipCosmetic: noopAsync,
      signOut: noopAsync,
      jumpToAchievementTarget: noop
    }
  };
  return { ...base, ...overrides } as ProfileTabProps;
}

function ProfileSurfaceSpecimens() {
  const overview = makeProfileProps({ mode: "overview" });
  const achievements = makeProfileProps({ mode: "achievements" });
  const rewards = makeProfileProps({ mode: "rewards" });
  const loading = makeProfileProps({
    progression: {
      level: 1,
      experience: 0,
      currentLevelExperience: 0,
      nextLevelExperience: 100,
      progressPercent: 0,
      currentStreakDays: 0,
      longestStreakDays: 0,
      lifetime: {
        totalSessions: 0,
        eligibleRestMinutes: 0,
        completedActivities: 0,
        collectedBeanTypes: 0,
        unlockedAchievements: 0
      },
      dailyGoals: { completed: 0, total: 3 },
      weeklyGoals: { completed: 0, total: 3 },
      nextActions: []
    } as any
  });
  return (
    <View style={{ gap: spacing.lg }}>
      <SpecimenCard label="Overview" component={<ProfileTab {...overview} />} />
      <SpecimenCard label="Achievements" component={<ProfileTab {...achievements} />} />
      <SpecimenCard label="Rewards" component={<ProfileTab {...rewards} />} />
      <SpecimenCard label="With identity" component={<ProfileTab {...loading} />} />
    </View>
  );
}

function SpecimenCard({ label, component }: { label: string; component: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden"
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.surfaceMuted,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm
        }}
      >
        <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: "900" }}>
          {label}
        </Text>
      </View>
      <View style={{ padding: spacing.md }}>{component}</View>
    </View>
  );
}

function ResponsiveSurfaceSpecimens({
  children
}: {
  children: (width: 360 | 390 | 640) => React.ReactNode;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row" }}>
        {([360, 390, 640] as const).map((width) => (
          <View key={width} style={{ width, paddingRight: spacing.md }}>
            <Text style={{ color: "#746b60", fontSize: 12, marginBottom: spacing.sm }}>
              {width}px viewport specimen
            </Text>
            {children(width)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function CoreSurfaceSpecimens() {
  return (
    <View style={{ gap: spacing.lg }}>
      <SectionHeader kicker="CORE SURFACE" title="Section navigation primitives" />
      <ModeNavigationSpecimens />
      <SectionHeader kicker="PRIMITIVES" title="Summary / receipt / grid" />
      <PrimitiveSpecimens />
      <SectionHeader kicker="SEMANTIC LANDING" title="All registered destinations" />
      <SemanticLandingSpecimens />
      <SectionHeader kicker="SCOPED ERROR" title="Errors stay in their owning mode" />
      <ScopedFeedbackSpecimens />
      <SectionHeader kicker="REDUCED MOTION" title="Static cues preserve meaning" />
      <ReducedMotionSpecimen />

      <SectionHeader kicker="HOME" title="Active, claimable, done, loading" />
      <ResponsiveSurfaceSpecimens>{() => <HomeSurfaceSpecimens />}</ResponsiveSurfaceSpecimens>

      <SectionHeader kicker="ACTIVITIES" title="Play / history / loading modes" />
      <ResponsiveSurfaceSpecimens>{() => <ActivitiesSurfaceSpecimens />}</ResponsiveSurfaceSpecimens>

      <SectionHeader kicker="BEANS" title="Tank / draw / collection / loading modes" />
      <ResponsiveSurfaceSpecimens>{() => <BeansSurfaceSpecimens />}</ResponsiveSurfaceSpecimens>

      <SectionHeader kicker="LEADERBOARDS" title="Ranking / social / loading modes" />
      <ResponsiveSurfaceSpecimens>{() => <LeaderboardsSurfaceSpecimens />}</ResponsiveSurfaceSpecimens>

      <SectionHeader kicker="PROFILE" title="Overview / achievements / rewards modes" />
      <ResponsiveSurfaceSpecimens>{() => <ProfileSurfaceSpecimens />}</ResponsiveSurfaceSpecimens>
    </View>
  );
}
