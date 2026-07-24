import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArtSlot } from "../../ui/art/ArtSlot";
import { artAssets, listArtSlotDefinitions, resolveArtAsset } from "../../ui/art/registry";
import type { ArtAssetKind, ArtSlotId } from "../../ui/art/types";
import type { ActivityAssignment, ActivityHistorySession, ActivityInteractionProgress } from "../../api/activities";
import {
  BreathInteraction,
  ChoiceInteraction,
  FallbackInteraction,
  MicroJournalInteraction,
  MiniGameInteraction,
  ReactionInteraction,
  RevealInteraction,
  ShufflePickInteraction,
  SortInteraction,
  TapPatternInteraction
} from "../dashboard/parts/activity-interactions";
import { ActivityInteractionRunner } from "../dashboard/parts/ActivityInteractionRunner";
import { FishTankCard } from "../dashboard/parts/FishTankCard";
import { FishTankPicker } from "../dashboard/parts/FishTankPicker";
import { DashboardFeedbackBanner } from "../dashboard/parts/DashboardFeedbackBanner";
import { CheckInResult } from "../dashboard/parts/ResultPanels";
import { ProgressionClaimResultPanel } from "../dashboard/parts/GoalPanels";
import { FishTankOutcomeReceipt } from "../dashboard/parts/fishTankOutcomeReceipt";
import {
  createDashboardFeedback,
  localizedGoalUnit
} from "../dashboard/dashboardCoherence";
import {
  ActivityHistoryCard,
  ActivityHistoryDetail,
  ActivityHistorySection
} from "../dashboard/ActivitiesTab";
import type {
  CareInteractionResult,
  DecorationInventoryItem,
  EquipDecorationResult,
  FishTankFish,
  FishTankSummary,
  HatchResult
} from "../../api/fishTank";
import type { components } from "../../api/generated";

type FishTankResourceOutcome = components["schemas"]["FishTankResourceOutcome"];
type CheckInFinishResult = components["schemas"]["CheckInFinishResult"];
type ActivityCompleteResult = components["schemas"]["ActivityCompleteResult"];
type ProgressionClaimResult = components["schemas"]["ProgressionClaimResult"];

type MiniStep = ActivityAssignment["interaction"]["steps"][number];

import {
  ActivityPreviewCard,
  BrandManifestoCard,
  EmptyState,
  FramedCard,
  IconTile,
  Pill,
  PrimaryButton,
  ProgressMeter,
  RewardRow,
  SectionHeader,
  SignalTile,
  StatusBadge,
  Surface
} from "../../ui/components";
import { MotionFeedback } from "../../ui/motion/MotionFeedback";
import { useReducedMotion } from "../../ui/motion/useReducedMotion";
import type { MotionFeedbackVariant } from "../../ui/motion/types";
import { useTheme, useThemeSwitcher } from "../../ui/theme/useTheme";
import { colors, radius, spacing, typography } from "../../ui/tokens";
import { deriveTodayPlayLoop, type TodayLoopViewModel } from "../../gameplay/todayLoop";
import { resourceIcon, resolveHistoryPresentation } from "../dashboard/helpers";
import { CoreSurfaceSpecimens } from "./CoreSurfaceSpecimens";

function groupSlotsByKind(
  slots: ReturnType<typeof listArtSlotDefinitions>
): Array<[ArtAssetKind, typeof slots]> {
  const groups = new Map<ArtAssetKind, typeof slots>();
  for (const slot of slots) {
    const list = groups.get(slot.kind) ?? [];
    list.push(slot);
    groups.set(slot.kind, list);
  }
  return Array.from(groups.entries());
}

const TONE_PREVIEWS = [
  {
    tone: "absurd",
    badge: "加载中演员",
    headline: "表情进度条缓慢前进",
    scene: "眉头轻皱，像是在等待一个非常重要的响应。",
    prompt: "选择你的加载中表情，维持短短几秒。",
    statLabel: "表演值",
    statValue: "83%"
  },
  {
    tone: "calm",
    badge: "水杯研究所",
    headline: "凝视水杯，暂停世界",
    scene: "这只杯子什么都不催，是难得的稳定同事。",
    prompt: "盯住它 30 秒，不分析根因。",
    statLabel: "液体哲学",
    statValue: "58%"
  },
  {
    tone: "game",
    badge: "像素挑战",
    headline: "三秒破纪录",
    scene: "短时决策小游戏，专注度比手速重要。",
    prompt: "三秒内完成组合键。",
    statLabel: "反应",
    statValue: "92%"
  },
  {
    tone: "physical",
    badge: "工位伸展",
    headline: "脊椎的请愿书",
    scene: "让上半身告状的部分稍息片刻。",
    prompt: "30 秒拉伸肩颈。",
    statLabel: "韧带",
    statValue: "65%"
  },
  {
    tone: "daydream",
    badge: "神游太虚",
    headline: "假装在思考方案",
    scene: "目光失焦，进入合法的精神离线。",
    prompt: "三分钟不被打断。",
    statLabel: "灵感",
    statValue: "47%"
  }
];

function ThemeSpecimen() {
  const { theme, themeId, availableThemes, setThemeId } = useThemeSwitcher();
  const specimenBlockStyle = {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border
  };
  const colorKeys: Array<keyof typeof theme.colors> = Object.keys(theme.colors) as Array<keyof typeof theme.colors>;
  const spacingKeys: Array<keyof typeof theme.spacing> = Object.keys(
    theme.spacing
  ) as Array<keyof typeof theme.spacing>;
  const radiusKeys: Array<keyof typeof theme.radius> = Object.keys(theme.radius) as Array<keyof typeof theme.radius>;
  const activityToneKeys = Object.keys(theme.gameplay.activityAccents) as Array<keyof typeof theme.gameplay.activityAccents>;
  const rarityKeys = Object.keys(theme.gameplay.rarityAccents) as Array<keyof typeof theme.gameplay.rarityAccents>;

  return (
    <Surface>
      <SectionHeader title="Theme" kicker="ACTIVE THEME" />
      <View style={styles.specimenMeta}>
        <Text style={styles.specimenName}>{theme.name}</Text>
        <Text style={styles.specimenId}>{themeId} / {theme.art.iconStyle}</Text>
      </View>

      <Text style={styles.specimenSection}>Brand</Text>
      <View style={styles.specimenRow}>
        <View style={[styles.specimenBrandBlock, specimenBlockStyle]}>
          <Text style={styles.specimenBrandName}>{theme.brand.appName}</Text>
          {theme.brand.shortName ? (
            <Text style={styles.specimenBrandShort}>{theme.brand.shortName}</Text>
          ) : null}
          {theme.brand.tagline ? (
            <Text style={styles.specimenBrandTagline}>{theme.brand.tagline}</Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.specimenSection}>Colors</Text>
      <View style={styles.colorGrid}>
        {colorKeys.map((key) => (
          <View key={key} style={styles.colorSwatch}>
            <View
              style={[
                styles.colorBlock,
                {
                  backgroundColor: theme.colors[key],
                  borderColor: theme.colors.border
                }
              ]}
            />
            <Text style={[styles.colorLabel, { color: theme.colors.textMuted }]}>{key}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.specimenSection}>Spacing</Text>
      <View style={styles.scaleRow}>
        {spacingKeys.map((key) => (
          <View key={key} style={styles.scaleItem}>
            <View
              style={[
                styles.spacingBlock,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radius.sm,
                  width: theme.spacing[key],
                  height: theme.spacing[key]
                }
              ]}
            />
            <Text style={[styles.scaleLabel, { color: theme.colors.textMuted }]}>{key}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.specimenSection}>Radius</Text>
      <View style={styles.scaleRow}>
        {radiusKeys.map((key) => (
          <View key={key} style={styles.scaleItem}>
            <View
              style={[
                styles.radiusBlock,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radius[key],
                  width: Math.max(24, theme.radius[key] * 3),
                  height: Math.max(24, theme.radius[key] * 3)
                }
              ]}
            />
            <Text style={[styles.scaleLabel, { color: theme.colors.textMuted }]}>{key}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.specimenSection}>Activity accents</Text>
      <View style={styles.colorGrid}>
        {activityToneKeys.map((key) => (
          <View key={key} style={styles.colorSwatch}>
            <View
              style={[
                styles.colorBlock,
                {
                  backgroundColor: theme.gameplay.activityAccents[key],
                  borderColor: theme.colors.border
                }
              ]}
            />
            <Text style={[styles.colorLabel, { color: theme.colors.textMuted }]}>{key}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.specimenSection}>Rarity accents</Text>
      <View style={styles.colorGrid}>
        {rarityKeys.map((key) => (
          <View key={key} style={styles.colorSwatch}>
            <View
              style={[
                styles.colorBlock,
                {
                  backgroundColor: theme.gameplay.rarityAccents[key],
                  borderColor: theme.colors.border
                }
              ]}
            />
            <Text style={[styles.colorLabel, { color: theme.colors.textMuted }]}>{key}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.specimenSection}>Preview themes (local/dev only)</Text>
      <View style={styles.themeSwitchRow}>
        {availableThemes.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setThemeId(t.id)}
            style={[
              styles.themeButton,
              t.id === themeId && {
                backgroundColor: theme.colors.text,
                borderColor: theme.colors.text
              }
            ]}
          >
            <Text
              style={[
                styles.themeButtonText,
                { color: theme.colors.text },
                t.id === themeId && { color: theme.colors.surface }
              ]}
            >
              {t.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </Surface>
  );
}

type UiLabScreenProps = {
  onClose: () => void;
};

type MotionTriggers = {
  [key: string]: number;
};

const MINI_INTERACTION_SPECIMENS: MiniStep[] = [
  {
    id: "tap",
    type: "tap-pattern",
    title: "点掉 5 个焦虑泡泡",
    description: "每点一下，想象一个念头暂时浮走。",
    required: true,
    requiredTaps: 5,
    tapLabel: "泡泡"
  },
  {
    id: "choice",
    type: "choice",
    title: "选择呼吸借口",
    description: "给这次离线配一个听起来合理的名义。",
    required: true,
    options: [
      { id: "latency", label: "降低脑延迟", resultText: "脑延迟优化开始。" },
      { id: "cache", label: "清理情绪缓存", resultText: "缓存清理中。" },
      { id: "reboot", label: "温柔重启", resultText: "重启不用关机。" }
    ]
  },
  {
    id: "shuffle",
    type: "shuffle-pick",
    title: "抽一个云的名字",
    description: "云没有意见，名字由你临时颁布。",
    required: true,
    items: [
      { id: "cotton", label: "棉花糖观测员" },
      { id: "wander", label: "流浪水汽" },
      { id: "afternoon", label: "午后缓存云" }
    ]
  },
  {
    id: "sort",
    type: "sort",
    title: "把内容按重要程度排序",
    description: "拖动条目，排成你觉得合理的优先级。",
    required: true,
    items: [
      { id: "deadline", label: "deadline 迫近" },
      { id: "noise", label: "无关通知" },
      { id: "decision", label: "待决策项" },
      { id: "reference", label: "参考资料" }
    ]
  },
  {
    id: "breath",
    type: "breath",
    title: "跟着节奏呼吸 2 轮",
    description: "吸气、呼气，不用着急。",
    required: true,
    requiredRounds: 2,
    inhaleSeconds: 3,
    holdSeconds: 1,
    exhaleSeconds: 3
  },
  {
    id: "reaction",
    type: "reaction",
    title: "看到雷达消失再点",
    description: "圆环消失时快速点击，允许一次走神。",
    required: true,
    requiredSuccessCount: 2,
    reactionRounds: 3
  },
  {
    id: "journal",
    type: "micro-journal",
    title: "写一句给下班后的自己",
    description: "短一点，像一张便签。",
    required: true,
    journalMode: "text",
    textMinLength: 3,
    textMaxLength: 40
  },
  {
    id: "reveal",
    type: "reveal",
    title: "翻开今日摸鱼签",
    description: "点一下翻开，作为这次留言的邮戳。",
    required: true,
    items: [
      { id: "early", label: "准点下班" },
      { id: "water", label: "多喝一口" },
      { id: "window", label: "看云五秒" }
    ]
  },
  {
    id: "mini-game",
    type: "mini_game",
    title: "轻量小游戏入口",
    description: "快速点击 5 次完成占位小游戏。",
    required: true,
    gameCode: "reaction_tap",
    requiredResult: "点击 5 次"
  },
  {
    id: "fallback",
    type: "unknown_step" as unknown as MiniStep["type"],
    title: "未知互动类型",
    description: "当服务端下发新版本暂不支持的 step 类型时，显示安全回退。",
    required: true
  } as unknown as MiniStep
];

function StepComponent({
  step,
  progress,
  onChange,
  reducedMotion,
  disabled = false
}: {
  step: MiniStep;
  progress: ActivityInteractionProgress;
  onChange: React.Dispatch<React.SetStateAction<ActivityInteractionProgress>>;
  reducedMotion: boolean;
  disabled?: boolean;
}) {
  const props = { step, progress, onChange, reducedMotion, disabled };
  if (step.type === "tap-pattern") {
    return <TapPatternInteraction {...props} />;
  }
  if (step.type === "choice") {
    return <ChoiceInteraction {...props} />;
  }
  if (step.type === "shuffle-pick") {
    return <ShufflePickInteraction {...props} />;
  }
  if (step.type === "sort") {
    return <SortInteraction {...props} />;
  }
  if (step.type === "breath") {
    return <BreathInteraction {...props} />;
  }
  if (step.type === "reaction") {
    return <ReactionInteraction {...props} />;
  }
  if (step.type === "micro-journal") {
    return <MicroJournalInteraction {...props} />;
  }
  if (step.type === "reveal") {
    return <RevealInteraction {...props} />;
  }
  if (step.type === "mini_game") {
    return <MiniGameInteraction {...props} />;
  }
  return <FallbackInteraction {...props} />;
}

function makeDisabledProgress(step: MiniStep): ActivityInteractionProgress {
  if (step.type === "tap-pattern") {
    return { tapCounts: { [step.id]: step.requiredTaps ?? 1 } };
  }
  if (step.type === "choice") {
    const option = step.options?.[0];
    return option ? { choiceAnswers: { [step.id]: option.id } } : {};
  }
  if (step.type === "shuffle-pick" || step.type === "reveal") {
    const item = step.items?.[0];
    return item ? { selectedOptions: { [step.id]: item.id } } : {};
  }
  if (step.type === "sort") {
    return { sortedItemIds: { [step.id]: step.items?.map((item) => item.id) ?? [] } };
  }
  if (step.type === "breath") {
    return { breathRounds: { [step.id]: step.requiredRounds ?? 1 } };
  }
  if (step.type === "reaction") {
    const successCount = step.requiredSuccessCount ?? 1;
    return {
      reactionResults: {
        [step.id]: { successCount, attempts: step.reactionRounds ?? successCount }
      }
    };
  }
  if (step.type === "micro-journal") {
    const mode = step.journalMode ?? "text";
    if (mode === "tags") {
      const tag = step.tags?.[0];
      return tag ? { journalEntries: { [step.id]: { tagIds: [tag.id] } } } : {};
    }
    return { journalEntries: { [step.id]: { text: "下班后就离线" } } };
  }
  if (step.type === "mini_game") {
    return { miniGameResults: { [step.id]: { passed: true, score: 5 } } };
  }
  return {};
}

function MiniInteractionSpecimens() {
  const systemReducedMotion = useReducedMotion();
  const [forceReducedMotion, setForceReducedMotion] = useState(false);
  const reducedMotion = systemReducedMotion || forceReducedMotion;

  return (
    <View style={styles.stack}>
      <Text style={[styles.copy, { color: colors.inkMuted }]}>
        {reducedMotion
          ? "Reduced motion preview: breath and reaction avoid large movement."
          : "Tap each specimen to see pending → active → completed transitions."}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setForceReducedMotion((v) => !v)}
        style={styles.motionButton}
      >
        <Text style={styles.motionButtonText}>
          {forceReducedMotion ? "恢复默认动态" : "强制减弱动态"}
        </Text>
      </Pressable>
      <View style={styles.miniSpecimenGrid}>
        {MINI_INTERACTION_SPECIMENS.map((step) => (
          <MiniInteractionCard key={step.id} step={step} reducedMotion={reducedMotion} />
        ))}
      </View>
      <Text style={[styles.copy, { color: colors.inkMuted, marginTop: 16 }]}>
        Disabled / summary states for completed, skipped, or expired assignments.
      </Text>
      <View style={styles.miniSpecimenGrid}>
        {MINI_INTERACTION_SPECIMENS.map((step) => (
          <MiniInteractionCard
            key={`${step.id}-disabled`}
            step={step}
            reducedMotion={reducedMotion}
            progress={makeDisabledProgress(step)}
            disabled
          />
        ))}
      </View>
    </View>
  );
}

function MiniInteractionCard({
  step,
  reducedMotion,
  progress: initialProgress,
  disabled = false
}: {
  step: MiniStep;
  reducedMotion: boolean;
  progress?: ActivityInteractionProgress;
  disabled?: boolean;
}) {
  const [progress, setProgress] = useState<ActivityInteractionProgress>(initialProgress ?? {});

  return (
    <FramedCard style={styles.miniSpecimenCard}>
      <Text style={styles.miniSpecimenType}>{step.type}{disabled ? " · disabled" : ""}</Text>
      <Text style={styles.miniSpecimenTitle}>{step.title}</Text>
      <StepComponent
        step={step}
        progress={progress}
        onChange={setProgress}
        reducedMotion={reducedMotion}
        disabled={disabled}
      />
      {disabled ? null : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setProgress({})}
          style={styles.miniSpecimenReset}
        >
          <Text style={styles.miniSpecimenResetText}>重置</Text>
        </Pressable>
      )}
    </FramedCard>
  );
}

const FLOW_SPECIMENS: ActivityAssignment[] = [
  makeFlowAssignment("rest", "rest_flow", "Rest flow", "呼吸 + 标签", [
    {
      id: "rest_choice",
      type: "choice",
      title: "选择呼吸借口",
      description: "给这次离线配一个听起来合理的名义。",
      required: true,
      options: [
        { id: "latency", label: "降低脑延迟", resultText: "脑延迟优化开始。" },
        { id: "cache", label: "清理情绪缓存", resultText: "缓存清理中。" },
        { id: "reboot", label: "温柔重启", resultText: "重启不用关机。" }
      ]
    },
    {
      id: "rest_breath",
      type: "breath",
      title: "跟着节奏呼吸 2 轮",
      description: "吸气、呼气，不用着急。",
      required: true,
      requiredRounds: 2,
      inhaleSeconds: 3,
      holdSeconds: 1,
      exhaleSeconds: 3
    },
    {
      id: "rest_tags",
      type: "micro-journal",
      title: "标记一下此刻状态",
      description: "选一个最轻的标签，不用写小作文。",
      required: false,
      journalMode: "tags",
      tags: [
        { id: "calm", label: "平静", resultText: "平静已记录。" },
        { id: "tired", label: "累", resultText: "累已记录。" },
        { id: "wired", label: "紧绷", resultText: "紧绷已记录。" }
      ],
      minTagCount: 1,
      maxTagCount: 1
    }
  ]),
  makeFlowAssignment("office_theater", "office_flow", "Office theater flow", "选择 + 反应", [
    {
      id: "office_choice",
      type: "choice",
      title: "选择加载中表情",
      description: "要低调，但要让人相信你正在处理一件复杂的事。",
      required: true,
      options: [
        { id: "latency", label: "接口延迟脸", resultText: "像是在等某个响应。" },
        { id: "deep_bug", label: "深层问题脸", resultText: "像是看见了历史包袱。" },
        { id: "budget", label: "预算不足脸", resultText: "像是方案被砍过三轮。" }
      ]
    },
    {
      id: "office_reaction",
      type: "reaction",
      title: "看到雷达消失再点",
      description: "圆环消失时快速点击，允许一次走神。",
      required: true,
      requiredSuccessCount: 2,
      reactionRounds: 3
    }
  ]),
  makeFlowAssignment("imagination", "imagination_flow", "Imagination flow", "记录 + 翻开", [
    {
      id: "imagination_journal",
      type: "micro-journal",
      title: "写一句给下班后的自己",
      description: "短一点，像一张便签。",
      required: true,
      journalMode: "text",
      textMinLength: 3,
      textMaxLength: 40
    },
    {
      id: "imagination_reveal",
      type: "reveal",
      title: "翻开今日摸鱼签",
      description: "点一下翻开，作为这次留言的邮戳。",
      required: true,
      items: [
        { id: "early", label: "准点下班" },
        { id: "water", label: "多喝一口" },
        { id: "window", label: "看云五秒" }
      ]
    }
  ]),
  makeFlowAssignment("physical", "physical_flow", "Physical flow", "点击 + 呼吸", [
    {
      id: "physical_tap",
      type: "tap-pattern",
      title: "给肩膀 6 次上线信号",
      description: "每点一下，轻轻转一次肩膀，不疼为准。",
      required: true,
      requiredTaps: 6,
      tapLabel: "次转动"
    },
    {
      id: "physical_breath",
      type: "breath",
      title: "配合呼吸 2 轮",
      description: "肩膀放松的同时，慢慢吸气呼气。",
      required: true,
      requiredRounds: 2,
      inhaleSeconds: 3,
      holdSeconds: 1,
      exhaleSeconds: 3
    }
  ])
];

const FLOW_PRESETS: Record<string, ActivityInteractionProgress> = {
  pending: {},
  partial: {
    choiceAnswers: { rest_choice: "latency", office_choice: "deep_bug" },
    tapCounts: { physical_tap: 3 }
  },
  completed: {
    choiceAnswers: { rest_choice: "latency", office_choice: "deep_bug" },
    breathRounds: { rest_breath: 2, physical_breath: 2 },
    journalEntries: {
      rest_tags: { tagIds: ["calm"] },
      imagination_journal: { text: "下班后就离线" }
    },
    selectedOptions: { imagination_reveal: "water" },
    reactionResults: { office_reaction: { successCount: 2, attempts: 3 } },
    tapCounts: { physical_tap: 6 }
  }
};

function makeFlowAssignment(
  category: ActivityAssignment["category"],
  code: string,
  title: string,
  flavorLabel: string,
  steps: MiniStep[]
): ActivityAssignment {
  const estimatedSeconds = steps.reduce((total, step) => total + (step.durationSeconds ?? 0), 30);
  const interaction = {
    mode: "guided" as const,
    estimatedSeconds,
    proofPolicy: "none" as const,
    flavorLabel,
    steps,
    completionFeedback: ["流程完成"],
    resultSummary: { title: "流程完成", copy: "这是一次 UI Lab 预览流程。" }
  };
  const summary = {
    stepCount: steps.length,
    estimatedSeconds,
    hasTimer: steps.some((s) => s.type === "timer"),
    hasChoice: steps.some((s) => s.type === "choice"),
    hasMiniGame: steps.some((s) => s.type === "mini_game"),
    hasTapPattern: steps.some((s) => s.type === "tap-pattern"),
    hasShufflePick: steps.some((s) => s.type === "shuffle-pick"),
    hasSort: steps.some((s) => s.type === "sort"),
    hasBreath: steps.some((s) => s.type === "breath"),
    hasReaction: steps.some((s) => s.type === "reaction"),
    hasMicroJournal: steps.some((s) => s.type === "micro-journal"),
    hasReveal: steps.some((s) => s.type === "reveal"),
    proofPolicy: "none" as const,
    flavorLabel
  };
  return {
    assignmentId: `ui-lab-${code}`,
    code,
    title,
    description: "UI Lab 多步互动预览",
    category,
    difficulty: "easy",
    status: "active",
    rewardPreview: { score: 5, drawProgress: 1 },
    presentation: {
      badge: "UI Lab",
      tone: "calm",
      accentColor: "#2f6f8f",
      headline: title,
      scene: "多步互动流程预览",
      prompt: "在 UI Lab 中预览完整的多步互动流程。",
      statLabel: "预览",
      statValue: "100%"
    },
    interaction,
    interactionSummary: summary,
    assignedAt: new Date().toISOString(),
    completedAt: null,
    expiresAt: null,
    rewarded: false
  };
}

function MultiStepFlowSpecimens() {
  const [preset, setPreset] = useState<"pending" | "partial" | "completed">("pending");
  const systemReducedMotion = useReducedMotion();
  const [forceReducedMotion, setForceReducedMotion] = useState(false);
  const reducedMotion = systemReducedMotion || forceReducedMotion;
  const progress = FLOW_PRESETS[preset];

  return (
    <View style={styles.stack}>
      <Text style={[styles.copy, { color: colors.inkMuted }]}>
        {reducedMotion
          ? "Reduced motion preview: breath uses text cues instead of large scale animation."
          : "Multi-step activity previews showing pending, partial, and completed states."}
      </Text>
      <View style={styles.flowControlRow}>
        {([
          { key: "pending", label: "待完成" },
          { key: "partial", label: "完成一半" },
          { key: "completed", label: "已完成" }
        ] as const).map((option) => (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            onPress={() => setPreset(option.key)}
            style={[styles.flowButton, preset === option.key && styles.flowButtonActive]}
          >
            <Text
              style={[
                styles.flowButtonText,
                preset === option.key && styles.flowButtonTextActive
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => setForceReducedMotion((v) => !v)}
          style={styles.flowButton}
        >
          <Text style={styles.flowButtonText}>
            {forceReducedMotion ? "恢复默认动态" : "强制减弱动态"}
          </Text>
        </Pressable>
      </View>
      <View style={styles.flowSpecimenGrid}>
        {FLOW_SPECIMENS.map((assignment) => (
          <FramedCard key={assignment.code} style={styles.flowSpecimenCard}>
            <Text style={styles.miniSpecimenType}>{assignment.category}</Text>
            <Text style={styles.miniSpecimenTitle}>{assignment.title}</Text>
            <ActivityInteractionRunner
              assignment={assignment}
              progress={progress}
              onChange={() => undefined}
            />
          </FramedCard>
        ))}
      </View>
    </View>
  );
}

function ActivityFeedbackSpecimens() {
  const options = ["有点意思", "还行", "下次别来这个", "来点更怪的", "短一点"];
  return (
    <View style={styles.flowSpecimenGrid}>
      <FramedCard style={styles.flowSpecimenCard}>
        <Text style={styles.miniSpecimenType}>pending</Text>
        <Text style={styles.miniSpecimenTitle}>这次摸鱼感觉如何？</Text>
        <Text style={styles.copy}>可选反馈，只影响以后推荐，不影响本次奖励。</Text>
        <View style={styles.feedbackChipRow}>
          {options.map((option) => (
            <Pill key={option} label={option} selected={false} />
          ))}
        </View>
      </FramedCard>
      <FramedCard style={styles.flowSpecimenCard}>
        <Text style={styles.miniSpecimenType}>submitted</Text>
        <Text style={styles.miniSpecimenTitle}>这次摸鱼感觉如何？</Text>
        <Text style={styles.copy}>收到，下次多安排这种手感的摸鱼。</Text>
        <RewardRow icon="⭐" label="奖励仍然可见" value="+8 分 · 进度 +1" positive />
      </FramedCard>
    </View>
  );
}

function makeHistorySession(partial: Partial<ActivityHistorySession> & Pick<ActivityHistorySession, "assignmentId" | "status" | "sessionAt">): ActivityHistorySession {
  const base: ActivityHistorySession = {
    assignmentId: partial.assignmentId,
    templateId: "template-1",
    code: "lab-code",
    title: "Lab activity",
    description: "UI Lab specimen session.",
    category: "rest",
    difficulty: "easy",
    status: partial.status,
    flavor: "quick",
    presentation: {
      badge: "UI Lab",
      tone: "calm",
      accentColor: "#2f6f8f",
      headline: "Lab activity",
      scene: "A specimen session for the UI Lab.",
      prompt: "Preview the history card layout.",
      statLabel: "预览",
      statValue: "100%"
    },
    rewardSummary: { score: 8, drawProgress: 1, rewarded: partial.status === "completed" },
    assignedAt: partial.sessionAt,
    completedAt: partial.status === "completed" ? partial.sessionAt : null,
    sessionAt: partial.sessionAt,
    skipReason: partial.status === "skipped" ? "not_interested" : null,
    feedback: partial.status === "completed" ? { type: "liked", acknowledgement: "收到，下次多安排这种手感的摸鱼。" } : null,
    replayHint: {
      sourceAssignmentId: partial.assignmentId,
      sourceTemplateId: "template-1",
      preferredCategory: "rest",
      preferredFlavor: "quick",
      excludeTemplateId: "template-1"
    }
  };
  return { ...base, ...partial };
}

function ActivityHistorySpecimens() {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const populated: ActivityHistorySession[] = [
    makeHistorySession({ assignmentId: "lab-completed", status: "completed", sessionAt: now, title: "完成的小休息" }),
    makeHistorySession({ assignmentId: "lab-skipped", status: "skipped", sessionAt: yesterday, title: "跳过的脑洞", category: "imagination", skipReason: "too_much_work" }),
    makeHistorySession({ assignmentId: "lab-expired", status: "expired", sessionAt: yesterday, title: "过期的办公室表演", category: "office_theater" })
  ];
  return (
    <View style={styles.stack}>
      <Text style={[styles.copy, { color: colors.inkMuted }]}>
        Empty, populated, and expandable history receipts. Tap a card to expand the detail receipt; skipped sessions show the skip reason and a try-similar action.
      </Text>
      <FramedCard style={styles.flowSpecimenCard}>
        <ActivityHistorySection
          loading={false}
          error={null}
          history={[]}
          cursor={null}
          onTrySimilar={() => undefined}
          onLoadMore={() => undefined}
        />
      </FramedCard>
      <FramedCard style={styles.flowSpecimenCard}>
        <ActivityHistorySection
          loading={false}
          error={null}
          history={populated}
          cursor="lab-cursor"
          onTrySimilar={() => undefined}
          onLoadMore={() => undefined}
        />
      </FramedCard>
      <ActivityHistoryPolishSpecimens />
    </View>
  );
}

function ActivityHistoryPolishSpecimens() {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const emptyReport: ActivityHistorySession[] = [];
  const populatedReport: ActivityHistorySession[] = [
    makeHistorySession({
      assignmentId: "lab-report-completed",
      status: "completed",
      sessionAt: now,
      title: "完成的小休息",
      category: "rest",
      flavor: "recharge"
    }),
    makeHistorySession({
      assignmentId: "lab-report-skipped",
      status: "skipped",
      sessionAt: now,
      title: "跳过的脑洞",
      category: "imagination",
      flavor: "weird",
      skipReason: "want_weirder"
    })
  ];
  const skipHeavy: ActivityHistorySession[] = [
    makeHistorySession({ assignmentId: "lab-skip-1", status: "skipped", sessionAt: yesterday, skipReason: "too_much_work" }),
    makeHistorySession({ assignmentId: "lab-skip-2", status: "skipped", sessionAt: twoDaysAgo, skipReason: "too_much_work" }),
    makeHistorySession({ assignmentId: "lab-skip-3", status: "completed", sessionAt: twoDaysAgo })
  ];
  const completedSession = makeHistorySession({
    assignmentId: "lab-card-completed",
    status: "completed",
    sessionAt: now,
    title: "已完成的小休息",
    category: "rest",
    flavor: "recharge"
  });
  const skippedSession = makeHistorySession({
    assignmentId: "lab-card-skipped",
    status: "skipped",
    sessionAt: now,
    title: "已跳过的脑洞",
    category: "imagination",
    flavor: "weird",
    skipReason: "not_interested"
  });
  const expiredSession = makeHistorySession({
    assignmentId: "lab-card-expired",
    status: "expired",
    sessionAt: now,
    title: "已过期的办公室表演",
    category: "office_theater",
    flavor: "quick"
  });

  return (
    <View style={styles.stack}>
      <Text style={[styles.copy, { color: colors.inkMuted }]}>
        Daily report, insights, status cards, and memento detail. All data is local mock state; no API calls are made.
      </Text>
      <FramedCard style={styles.flowSpecimenCard}>
        <ActivityHistorySection
          loading={false}
          error={null}
          history={emptyReport}
          cursor={null}
          onTrySimilar={() => undefined}
          onLoadMore={() => undefined}
        />
      </FramedCard>
      <FramedCard style={styles.flowSpecimenCard}>
        <ActivityHistorySection
          loading={false}
          error={null}
          history={populatedReport}
          cursor={null}
          onTrySimilar={() => undefined}
          onLoadMore={() => undefined}
        />
      </FramedCard>
      <FramedCard style={styles.flowSpecimenCard}>
        <ActivityHistorySection
          loading={false}
          error={null}
          history={skipHeavy}
          cursor={null}
          onTrySimilar={() => undefined}
          onLoadMore={() => undefined}
        />
      </FramedCard>
      <FramedCard style={styles.flowSpecimenCard}>
        <Text style={styles.miniSpecimenType}>completed card</Text>
        <ActivityHistoryCard session={completedSession} onTrySimilar={() => undefined} />
      </FramedCard>
      <FramedCard style={styles.flowSpecimenCard}>
        <Text style={styles.miniSpecimenType}>skipped card</Text>
        <ActivityHistoryCard session={skippedSession} onTrySimilar={() => undefined} />
      </FramedCard>
      <FramedCard style={styles.flowSpecimenCard}>
        <Text style={styles.miniSpecimenType}>expired card</Text>
        <ActivityHistoryCard session={expiredSession} onTrySimilar={() => undefined} />
      </FramedCard>
      <FramedCard style={styles.flowSpecimenCard}>
        <Text style={styles.miniSpecimenType}>memento detail</Text>
        <ActivityHistoryDetail
          session={completedSession}
          presentation={resolveHistoryPresentation(completedSession)}
          onTrySimilar={() => undefined}
        />
      </FramedCard>
    </View>
  );
}

function PlayLoopSpecimens() {
  const incompleteGoal = (code: "check_in" | "activity" | "bean_draw") => ({
    code,
    title: code,
    description: `${code} progress`,
    current: 0,
    target: 1,
    unit: "times" as const,
    completed: false
  });
  const completeGoal = (code: "check_in" | "activity" | "bean_draw") => ({
    ...incompleteGoal(code),
    current: 1,
    completed: true
  });
  const progression = ({
    dailyGoals: {
      allCompleted: false,
      rewardClaimed: true,
      reward: { score: 12, drawProgress: 1 },
      goals: [completeGoal("check_in"), incompleteGoal("activity"), incompleteGoal("bean_draw")]
    },
    weeklyGoals: {
      allCompleted: false,
      rewardClaimed: true,
      reward: { score: 30, drawProgress: 2 },
      goals: []
    }
  }) as never;
  const claimableProgression = ({
    dailyGoals: {
      allCompleted: true,
      rewardClaimed: false,
      reward: { score: 12, drawProgress: 1 },
      goals: [completeGoal("check_in"), completeGoal("activity"), completeGoal("bean_draw")]
    },
    weeklyGoals: {
      allCompleted: false,
      rewardClaimed: true,
      reward: { score: 30, drawProgress: 2 },
      goals: []
    }
  }) as never;
  const doneProgression = ({
    dailyGoals: {
      allCompleted: true,
      rewardClaimed: true,
      reward: { score: 12, drawProgress: 1 },
      goals: [completeGoal("check_in"), completeGoal("activity"), completeGoal("bean_draw")]
    },
    weeklyGoals: {
      allCompleted: false,
      rewardClaimed: true,
      reward: { score: 30, drawProgress: 2 },
      goals: []
    }
  }) as never;
  const achievementList = ({
    achievements: [],
    recommendations: {
      today: [
        {
          id: "lab-achievement",
          code: "lab-achievement",
          name: "离摸鱼大师只差一步",
          recommendationReason: "今天顺手能推进",
          remainingEffortLabel: "还差 1 次",
          actionHint: { section: "activities", label: "去活动" },
          targetSection: "activities",
          progress: { current: 4, target: 5, unit: "count", percent: 80, completed: false }
        }
      ],
      nearest: [],
      long_term: []
    }
  }) as never;

  const specimens: Array<{ label: string; vm: TodayLoopViewModel }> = [
    {
      label: "Empty morning",
      vm: deriveTodayPlayLoop({
        activeSession: null,
        lastResult: null,
        activityAssignment: null,
        activityResult: null,
        beanCollection: { drawChances: 0, drawProgress: 0 } as never,
        beanDrawResult: null,
        progression: null,
        achievementList: null,
        activityUnavailable: false
      })
    },
    {
      label: "Active check-in",
      vm: deriveTodayPlayLoop({
        activeSession: { id: "lab-session", userId: "lab", startedAt: new Date().toISOString() } as never,
        lastResult: null,
        activityAssignment: null,
        activityResult: null,
        beanCollection: { drawChances: 1, drawProgress: 2 } as never,
        beanDrawResult: null,
        progression: null,
        achievementList: null,
        activityUnavailable: false
      })
    },
    {
      label: "Active activity",
      vm: deriveTodayPlayLoop({
        activeSession: null,
        lastResult: null,
        activityAssignment: { assignmentId: "lab-activity", status: "active" } as never,
        activityResult: null,
        beanCollection: { drawChances: 0, drawProgress: 1 } as never,
        beanDrawResult: null,
        progression,
        achievementList: null,
        activityUnavailable: false
      })
    },
    {
      label: "Draw available",
      vm: deriveTodayPlayLoop({
        activeSession: null,
        lastResult: null,
        activityAssignment: null,
        activityResult: { reward: { drawChancesGranted: 1 } } as never,
        beanCollection: { drawChances: 1, drawProgress: 0 } as never,
        beanDrawResult: null,
        progression: null,
        achievementList: null,
        activityUnavailable: false
      })
    },
    {
      label: "Recent result + route",
      vm: deriveTodayPlayLoop({
        activeSession: null,
        lastResult: { reward: { drawChancesGranted: 0 } } as never,
        activityAssignment: null,
        activityResult: null,
        beanCollection: { drawChances: 0, drawProgress: 1 } as never,
        beanDrawResult: null,
        progression,
        achievementList: null,
        activityUnavailable: false
      })
    },
    {
      label: "Goal claimable",
      vm: deriveTodayPlayLoop({
        activeSession: null,
        lastResult: null,
        activityAssignment: null,
        activityResult: null,
        beanCollection: { drawChances: 0, drawProgress: 0 } as never,
        beanDrawResult: null,
        progression: claimableProgression,
        achievementList: null,
        activityUnavailable: true
      })
    },
    {
      label: "Done for now",
      vm: deriveTodayPlayLoop({
        activeSession: null,
        lastResult: null,
        activityAssignment: null,
        activityResult: null,
        beanCollection: { drawChances: 0, drawProgress: 0 } as never,
        beanDrawResult: null,
        progression: doneProgression,
        achievementList: null,
        activityUnavailable: true
      })
    },
    {
      label: "Achievement optional",
      vm: deriveTodayPlayLoop({
        activeSession: null,
        lastResult: null,
        activityAssignment: null,
        activityResult: null,
        beanCollection: { drawChances: 0, drawProgress: 0 } as never,
        beanDrawResult: null,
        progression: doneProgression,
        achievementList,
        activityUnavailable: true
      })
    }
  ];

  return (
    <View style={styles.flowSpecimenGrid}>
      {specimens.map(({ label, vm }) => (
        <FramedCard key={label} style={styles.flowSpecimenCard}>
          <Text style={styles.miniSpecimenType}>{label}</Text>
          <Text style={styles.miniSpecimenTitle}>{vm.routeDelight.title}</Text>
          <Text style={styles.themeMeta}>
            {vm.routeDelight.mood} · {vm.routeProgress.progressLabel} · 360px QA
          </Text>
          <Text style={styles.copy}>{vm.loopMessage}</Text>
          <Text style={styles.copy}>{vm.routeDelight.copy}</Text>
          {vm.resultDelight ? (
            <View style={styles.playLoopSpecimenReceipt}>
              <Text style={styles.miniSpecimenType}>{vm.resultDelight.receiptTitle}</Text>
              <Text style={styles.playLoopSpecimenText}>{vm.resultDelight.title}</Text>
              <Text style={styles.themeMeta}>{vm.resultDelight.rewardLabel}</Text>
            </View>
          ) : null}
          {vm.routeSteps.slice(0, 4).map((step) => (
            <View key={step.id} style={styles.playLoopSpecimenRow}>
              <StatusBadge
                tone={step.status === "completed" ? "completed" : step.status === "active" ? "active" : "default"}
                label={step.status}
              />
              <Text style={styles.playLoopSpecimenText}>{step.title}</Text>
            </View>
          ))}
        </FramedCard>
      ))}
    </View>
  );
}

function makeFishSummary(
  partial: Partial<FishTankSummary> & Pick<FishTankSummary, "initialized" | "fish" | "nextAction">
): FishTankSummary {
  const defaultItems = partial.fish?.map((f) => ({
    definitionId: f.definitionId,
    name: f.name,
    rarity: f.rarity,
    personality: f.personality,
    artKey: f.artKey,
    sourceHint: f.acquiredSource,
    owned: true as const
  })) ?? [];
  const nextAction = partial.nextAction;
  const feedAvailable = nextAction === "feed";
  const bubbleAvailable = nextAction === "bubble";
  const displayedFish = partial.displayedFish ?? partial.fish?.slice(0, 3) ?? [];
  return {
    displayedFish,
    eligibleFish: partial.eligibleFish ?? partial.fish ?? [],
    moodCopy: partial.mood?.copy ?? "小鱼正在假装工作。",
    mood: {
      code: "idle",
      title: "一起发呆",
      copy: "小鱼正在假装工作。",
      ambientArtKey: "tank-mood-idle"
    },
    decorations: {
      equipped: [],
      inventory: []
    },
    careAvailability: {
      feed: {
        available: feedAvailable,
        nextAvailableAt: feedAvailable ? null : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        cooldownRemainingSeconds: feedAvailable ? 0 : 30 * 60
      },
      bubble: {
        available: bubbleAvailable,
        nextAvailableAt: bubbleAvailable ? null : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        cooldownRemainingSeconds: bubbleAvailable ? 0 : 60 * 60
      }
    },
    hatchAvailability: {
      available: nextAction === "hatch",
      reason: nextAction === "hatch" ? "ready" : "insufficient_progress",
      currentProgress: nextAction === "hatch" ? 3 : 0,
      cost: 3,
      missingProgress: nextAction === "hatch" ? 0 : 3
    },
    collection: {
      owned: defaultItems.length,
      total: Math.max(2, defaultItems.length + 1),
      percent: Math.round((defaultItems.length / Math.max(2, defaultItems.length + 1)) * 100),
      complete: false,
      items: defaultItems
    },
    resourceSummary: {
      resources: [
        { resourceType: "food", quantity: 0, label: "鱼食" },
        { resourceType: "bubble", quantity: 0, label: "气泡" },
        { resourceType: "hatch_progress", quantity: 0, label: "孵化进度" }
      ],
      totalFood: 0,
      totalBubbles: 0,
      totalHatchProgress: 0
    },
    costs: {
      feed: 1,
      bubble: 1
    },
    guidance: {
      foodSource: "draw",
      bubbleSource: "draw"
    },
    ...partial,
    nextAction
  };
}

const FISH_TANK_SPECIMENS: Array<{
  label: string;
  summary: FishTankSummary | null;
  loading: boolean;
  error: string | null;
  resultCopy?: string | null;
  fishTankResult?: CareInteractionResult | null;
  bubbleLoading?: boolean;
  reducedMotionOverride?: boolean;
}> = [
  {
    label: "Loading",
    summary: null,
    loading: true,
    error: null
  },
  {
    label: "Uninitialized",
    summary: makeFishSummary({
      initialized: false,
      fish: [],
      nextAction: "initialize",
      mood: {
        code: "idle",
        title: "空缸待机",
        copy: "这里还空着，放一条小鱼进来。",
        ambientArtKey: "tank-mood-idle"
      }
    }),
    loading: false,
    error: null
  },
  {
    label: "One fish · care available",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-1",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "feed"
    }),
    loading: false,
    error: null
  },
  {
    label: "Two fish · positive mood",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-two-1",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        },
        {
          id: "lab-fish-two-2",
          definitionId: "lab-bluefish",
          name: "蓝屏",
          rarity: "rare",
          theme: "daydream",
          personality: "偶尔假装断线",
          artKey: "fish-tank-fish",
          acquiredSource: "hatch",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "companionship",
      mood: {
        code: "sparkly",
        title: "闪闪发亮",
        copy: "两条小鱼正在交换今日份的好心情。",
        ambientArtKey: "tank-mood-sparkly"
      }
    }),
    loading: false,
    error: null
  },
  {
    label: "Three fish · populated scene",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-three-1",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        },
        {
          id: "lab-fish-three-2",
          definitionId: "lab-bluefish",
          name: "蓝屏",
          rarity: "rare",
          theme: "daydream",
          personality: "偶尔假装断线",
          artKey: "fish-tank-fish",
          acquiredSource: "hatch",
          createdAt: new Date().toISOString()
        },
        {
          id: "lab-fish-three-3",
          definitionId: "lab-nightfish",
          name: "夜班",
          rarity: "epic",
          theme: "restroom",
          personality: "只在下班后活跃",
          artKey: "fish-tank-fish",
          acquiredSource: "hatch",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "feed",
      resourceSummary: {
        resources: [
          { resourceType: "food", quantity: 2, label: "鱼食" },
          { resourceType: "bubble", quantity: 3, label: "气泡" },
          { resourceType: "hatch_progress", quantity: 1, label: "孵化进度" }
        ],
        totalFood: 2,
        totalBubbles: 3,
        totalHatchProgress: 1
      }
    }),
    loading: false,
    error: null
  },
  {
    label: "Cooldown",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-2",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "companionship",
      mood: {
        code: "cozy",
        title: "吃饱发呆",
        copy: "小鱼吃饱了，正在发呆。",
        ambientArtKey: "tank-mood-cozy"
      },
      careAvailability: {
        feed: {
          available: false,
          nextAvailableAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
          cooldownRemainingSeconds: 25 * 60
        },
        bubble: {
          available: false,
          nextAvailableAt: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
          cooldownRemainingSeconds: 55 * 60
        }
      }
    }),
    loading: false,
    error: null
  },
  {
    label: "Success receipt",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-3",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "companionship",
      mood: {
        code: "excited",
        title: "刚吃饱",
        copy: "投喂成功，小鱼很开心。",
        ambientArtKey: "tank-mood-excited"
      },
      careAvailability: {
        feed: {
          available: false,
          nextAvailableAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          cooldownRemainingSeconds: 30 * 60
        },
        bubble: {
          available: false,
          nextAvailableAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          cooldownRemainingSeconds: 60 * 60
        }
      }
    }),
    loading: false,
    error: null,
    resultCopy: "小鱼打了个饱嗝，卷度 -5。"
  },
  {
    label: "Bubble pending",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-bubble-pending",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "bubble",
      resourceSummary: {
        resources: [
          { resourceType: "food", quantity: 0, label: "鱼食" },
          { resourceType: "bubble", quantity: 2, label: "气泡" },
          { resourceType: "hatch_progress", quantity: 0, label: "孵化进度" }
        ],
        totalFood: 0,
        totalBubbles: 2,
        totalHatchProgress: 0
      }
    }),
    loading: false,
    error: null,
    bubbleLoading: true
  },
  {
    label: "Bubble replay receipt",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-bubble-replay",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "companionship",
      resourceSummary: {
        resources: [
          { resourceType: "food", quantity: 0, label: "鱼食" },
          { resourceType: "bubble", quantity: 1, label: "气泡" },
          { resourceType: "hatch_progress", quantity: 0, label: "孵化进度" }
        ],
        totalFood: 0,
        totalBubbles: 1,
        totalHatchProgress: 0
      }
    }),
    loading: false,
    error: null,
    resultCopy: "旧气泡请求已安全回放，没有再次扣减。",
    fishTankResult: {
      success: true,
      replayed: true,
      outcomeCode: "bubble_applied",
      resultCopy: "旧气泡请求已安全回放，没有再次扣减。",
      resourceType: "bubble",
      cost: 1,
      resourceBalance: 1,
      tank: makeFishSummary({
        initialized: true,
        fish: [],
        nextAction: "companionship"
      })
    }
  },
  {
    label: "With resources",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-4",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "feed",
      resourceSummary: {
        resources: [
          { resourceType: "bubble", quantity: 3, label: "气泡" },
          { resourceType: "food", quantity: 2, label: "鱼食" },
          { resourceType: "hatch_progress", quantity: 1, label: "孵化进度" }
        ],
        totalBubbles: 3,
        totalFood: 2,
        totalHatchProgress: 1
      }
    }),
    loading: false,
    error: null
  },
  {
    label: "Unknown error · no cached scene",
    summary: null,
    loading: false,
    error: "小鱼临时失联，请稍后再试。"
  },
  {
    label: "Conflict/error · preserve scene",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-scoped-error",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "feed"
    }),
    loading: false,
    error: "展示顺序刚被其他设备更新；旧场景仍保留，可安全重试。"
  },
  {
    label: "Reduced motion · static semantic fallback",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-reduced-motion",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "companionship",
      mood: {
        code: "cozy",
        title: "静静陪伴",
        copy: "静态姿态、对比和文字保留了相同的状态含义。",
        ambientArtKey: "tank-mood-cozy"
      }
    }),
    loading: false,
    error: null,
    reducedMotionOverride: true
  }
];

function FishTankPickerSpecimen({ summary }: { summary: FishTankSummary }) {
  const [draft, setDraft] = useState<FishTankFish[] | null>(null);
  return (
    <FishTankPicker
      summary={summary}
      draft={draft}
      loading={false}
      onChangeDraft={setDraft}
      onSave={() => undefined}
      onClose={() => undefined}
    />
  );
}

function FishTankSpecimens({ reducedMotion }: { reducedMotion: boolean }) {
  const pickerSummary = FISH_TANK_SPECIMENS.find(({ label }) => label.startsWith("Three fish"))?.summary;
  return (
    <View style={{ gap: spacing.lg }}>
      <Text style={styles.themeMeta}>
        {reducedMotion
          ? "Reduced motion active: static pose, contrast, availability and receipt copy remain visible."
          : "Motion active; enable system reduced motion to review the equivalent static cues."}
      </Text>
      <View style={styles.flowSpecimenGrid}>
        {FISH_TANK_SPECIMENS.map(({ label, summary, loading, error, resultCopy, fishTankResult, bubbleLoading, reducedMotionOverride }) => (
          <FramedCard key={label} style={styles.flowSpecimenCard}>
            <Text style={styles.miniSpecimenType}>{label}</Text>
            <FishTankCard
              loading={loading}
              summary={summary}
              error={error}
              resultCopy={resultCopy ?? null}
              fishTankResult={fishTankResult ?? null}
              bubbleLoading={bubbleLoading ?? false}
              reducedMotionOverride={reducedMotionOverride ?? false}
              hatchResult={null}
              hatchError={null}
              hatchLoading={false}
              equipResult={null}
              equipError={null}
              equipLoading={false}
              onInitialize={() => undefined}
              onFeed={() => undefined}
              onBubble={() => undefined}
              onHatch={() => undefined}
              onDismissHatchResult={() => undefined}
              onEquipDecoration={() => undefined}
              onDismissEquipResult={() => undefined}
              onRetry={() => undefined}
            />
          </FramedCard>
        ))}
      </View>
      {pickerSummary ? (
        <FramedCard>
          <Text style={styles.miniSpecimenType}>Picker · selected/order/capacity states</Text>
          <FishTankPickerSpecimen summary={pickerSummary} />
        </FramedCard>
      ) : null}
      {pickerSummary ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            {([360, 390, 640] as const).map((width) => (
              <View key={width} style={{ width }}>
                <Text style={styles.miniSpecimenType}>{width}px fish-tank viewport</Text>
                <FishTankCard
                  loading={false}
                  summary={pickerSummary}
                  error={null}
                  hatchResult={null}
                  hatchError={null}
                  hatchLoading={false}
                  equipResult={null}
                  equipError={null}
                  equipLoading={false}
                  onInitialize={() => undefined}
                  onFeed={() => undefined}
                  onBubble={() => undefined}
                  onHatch={() => undefined}
                  onDismissHatchResult={() => undefined}
                  onEquipDecoration={() => undefined}
                  onDismissEquipResult={() => undefined}
                  onRetry={() => undefined}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function makeHatchResult(partial: Partial<HatchResult> & Pick<HatchResult, "success" | "outcomeCode">): HatchResult {
  return {
    replayed: false,
    discoveredFish: null,
    cost: 0,
    resultTitle: "孵化结果",
    resultCopy: "结果走丢了。",
    nextHint: "返回鱼缸。",
    tank: makeFishSummary({ initialized: true, fish: [], nextAction: "companionship" }),
    ...partial
  };
}

const HATCH_SPECIMENS: Array<{
  label: string;
  summary: FishTankSummary;
  hatchResult: HatchResult | null;
  hatchError: string | null;
  hatchLoading: boolean;
}> = [
  {
    label: "Ready to hatch",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-1",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "hatch",
      hatchAvailability: {
        available: true,
        reason: "ready",
        currentProgress: 3,
        cost: 3,
        missingProgress: 0
      }
    }),
    hatchResult: null,
    hatchError: null,
    hatchLoading: false
  },
  {
    label: "Insufficient progress",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-1",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "companionship",
      hatchAvailability: {
        available: false,
        reason: "insufficient_progress",
        currentProgress: 1,
        cost: 3,
        missingProgress: 2
      }
    }),
    hatchResult: null,
    hatchError: null,
    hatchLoading: false
  },
  {
    label: "Hatching loading",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-1",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "hatch",
      hatchAvailability: {
        available: true,
        reason: "ready",
        currentProgress: 3,
        cost: 3,
        missingProgress: 0
      }
    }),
    hatchResult: null,
    hatchError: null,
    hatchLoading: true
  },
  {
    label: "Successful reveal",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-1",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "feed",
      hatchAvailability: {
        available: false,
        reason: "insufficient_progress",
        currentProgress: 0,
        cost: 3,
        missingProgress: 3
      }
    }),
    hatchResult: makeHatchResult({
      success: true,
      outcomeCode: "DISCOVERED",
      replayed: false,
      discoveredFish: {
        id: "lab-fish-2",
        definitionId: "lab-printer",
        name: "打印机和平贝塔",
        rarity: "common",
        theme: "office",
        personality: "宽容卡纸的",
        artKey: "fish-tank-fish",
        acquiredSource: "hatch",
        createdAt: new Date().toISOString()
      },
      cost: 3,
      resultTitle: "新鱼登场",
      resultCopy: "打印机和平贝塔 从进度里游了出来，鱼缸又热闹了一点。",
      nextHint: "返回鱼缸看看新邻居。"
    }),
    hatchError: null,
    hatchLoading: false
  },
  {
    label: "Replay result",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-1",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "feed",
      hatchAvailability: {
        available: true,
        reason: "ready",
        currentProgress: 3,
        cost: 3,
        missingProgress: 0
      }
    }),
    hatchResult: makeHatchResult({
      success: true,
      outcomeCode: "DISCOVERED",
      replayed: true,
      discoveredFish: {
        id: "lab-fish-2",
        definitionId: "lab-printer",
        name: "打印机和平贝塔",
        rarity: "common",
        theme: "office",
        personality: "宽容卡纸的",
        artKey: "fish-tank-fish",
        acquiredSource: "hatch",
        createdAt: new Date().toISOString()
      },
      cost: 3,
      resultTitle: "孵化结果已保存",
      resultCopy: "这条鱼已经在你缸里了，不用再花进度。",
      nextHint: "看看鱼缸或者继续攒进度。"
    }),
    hatchError: null,
    hatchLoading: false
  },
  {
    label: "Catalog complete",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-1",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "companionship",
      hatchAvailability: {
        available: false,
        reason: "catalog_complete",
        currentProgress: 3,
        cost: 3,
        missingProgress: 0
      },
      collection: { owned: 5, total: 5, percent: 100, complete: true, items: [] }
    }),
    hatchResult: null,
    hatchError: null,
    hatchLoading: false
  },
  {
    label: "Hatch error",
    summary: makeFishSummary({
      initialized: true,
      fish: [
        {
          id: "lab-fish-1",
          definitionId: "lab-goldfish",
          name: "摸摸",
          rarity: "common",
          theme: "office",
          personality: "在键盘上吐泡泡",
          artKey: "fish-tank-fish",
          acquiredSource: "starter",
          createdAt: new Date().toISOString()
        }
      ],
      nextAction: "hatch",
      hatchAvailability: {
        available: true,
        reason: "ready",
        currentProgress: 3,
        cost: 3,
        missingProgress: 0
      }
    }),
    hatchResult: null,
    hatchError: "孵化请求失败了，请重试。",
    hatchLoading: false
  }
];

function HatchSpecimens() {
  return (
    <View style={styles.flowSpecimenGrid}>
      {HATCH_SPECIMENS.map(({ label, summary, hatchResult, hatchError, hatchLoading }) => (
        <FramedCard key={label} style={styles.flowSpecimenCard}>
          <Text style={styles.miniSpecimenType}>{label}</Text>
          <FishTankCard
            loading={false}
            summary={summary}
            error={null}
            resultCopy={null}
            hatchResult={hatchResult}
            hatchError={hatchError}
            hatchLoading={hatchLoading}
            equipResult={null}
            equipError={null}
            equipLoading={false}
            onInitialize={() => undefined}
            onFeed={() => undefined}
            onBubble={() => undefined}
            onHatch={() => undefined}
            onDismissHatchResult={() => undefined}
            onEquipDecoration={() => undefined}
            onDismissEquipResult={() => undefined}
            onRetry={() => undefined}
          />
        </FramedCard>
      ))}
    </View>
  );
}

function makeDecorItem(
  partial: Partial<DecorationInventoryItem> & Pick<DecorationInventoryItem, "definitionId" | "slot">
): DecorationInventoryItem {
  return {
    code: partial.definitionId,
    name: "装饰",
    type: partial.slot,
    rarity: "common",
    artKey: "tank-prop-empty",
    unlockHint: "解锁提示",
    owned: true,
    equipped: false,
    ...partial
  } as DecorationInventoryItem;
}

function makeDecorSummary(partial: Partial<FishTankSummary> & { decorations: FishTankSummary["decorations"] }): FishTankSummary {
  return makeFishSummary({
    initialized: true,
    fish: [
      {
        id: "lab-fish-1",
        definitionId: "lab-goldfish",
        name: "摸摸",
        rarity: "common",
        theme: "office",
        personality: "在键盘上吐泡泡",
        artKey: "fish-tank-fish",
        acquiredSource: "starter",
        createdAt: new Date().toISOString()
      }
    ],
    nextAction: "companionship",
    ...partial,
    decorations: partial.decorations
  });
}

const DECOR_SPECIMENS: Array<{
  label: string;
  summary: FishTankSummary;
  equipResult?: EquipDecorationResult | null;
  equipError?: string | null;
}> = [
  {
    label: "Default decor",
    summary: makeDecorSummary({
      decorations: {
        equipped: [
          {
            slot: "background",
            definitionId: "def-bg-default",
            code: "default_tank_background",
            name: "基础水缸",
            type: "background",
            rarity: "common",
            artKey: "tank-bg-default"
          }
        ],
        inventory: [
          makeDecorItem({ definitionId: "def-bg-default", slot: "background", name: "基础水缸", artKey: "tank-bg-default" }),
          makeDecorItem({ definitionId: "def-plant-default", slot: "plant", name: "基础水草", artKey: "tank-plant-default" }),
          makeDecorItem({ definitionId: "def-prop-empty", slot: "prop", name: "空石头", artKey: "tank-prop-empty" }),
          makeDecorItem({ definitionId: "def-ambient-bubbles", slot: "ambient", name: "基础泡泡", artKey: "tank-ambient-bubbles" })
        ]
      }
    })
  },
  {
    label: "Equipped set",
    summary: makeDecorSummary({
      decorations: {
        equipped: [
          { slot: "background", definitionId: "bg-office", code: "office_window_background", name: "工位窗景", type: "background", rarity: "rare", artKey: "tank-bg-office-window" },
          { slot: "plant", definitionId: "plant-kelp", code: "kelp_forest_plant", name: "海藻丛", type: "plant", rarity: "uncommon", artKey: "tank-plant-kelp-forest" },
          { slot: "prop", definitionId: "prop-coral", code: "coral_prop", name: "小珊瑚", type: "prop", rarity: "uncommon", artKey: "tank-prop-coral" },
          { slot: "ambient", definitionId: "ambient-neon", code: "neon_bubbles_ambient", name: "霓虹泡泡", type: "ambient", rarity: "uncommon", artKey: "tank-ambient-neon-bubbles" }
        ],
        inventory: []
      }
    })
  },
  {
    label: "Owned unequipped",
    summary: makeDecorSummary({
      decorations: {
        equipped: [],
        inventory: [
          makeDecorItem({ definitionId: "bg-office", slot: "background", name: "工位窗景", rarity: "rare", artKey: "tank-bg-office-window" }),
          makeDecorItem({ definitionId: "plant-kelp", slot: "plant", name: "海藻丛", rarity: "uncommon", artKey: "tank-plant-kelp-forest" })
        ]
      }
    })
  },
  {
    label: "Locked decor",
    summary: makeDecorSummary({
      decorations: {
        equipped: [],
        inventory: [
          makeDecorItem({ definitionId: "bg-daydream", slot: "background", name: "白日梦云层", rarity: "epic", artKey: "tank-bg-daydream-cloud", owned: false }),
          makeDecorItem({ definitionId: "prop-paper-boat", slot: "prop", name: "纸船", rarity: "epic", artKey: "tank-prop-paper-boat", owned: false })
        ]
      }
    })
  },
  {
    label: "Equip error",
    summary: makeDecorSummary({
      decorations: {
        equipped: [],
        inventory: [
          makeDecorItem({ definitionId: "bg-office", slot: "background", name: "工位窗景", rarity: "rare", artKey: "tank-bg-office-window" })
        ]
      }
    }),
    equipError: "这件装扮不能装备到这个位置。"
  },
  {
    label: "Equip result",
    summary: makeDecorSummary({
      decorations: {
        equipped: [
          { slot: "background", definitionId: "bg-office", code: "office_window_background", name: "工位窗景", type: "background", rarity: "rare", artKey: "tank-bg-office-window" }
        ],
        inventory: []
      }
    }),
    equipResult: {
      success: true,
      replayed: false,
      outcomeCode: "EQUIPPED",
      resultTitle: "装扮已更换",
      resultCopy: "工位窗景 已经放进鱼缸的 背景 位置。",
      equipped: {
        slot: "background",
        definitionId: "bg-office",
        code: "office_window_background",
        name: "工位窗景",
        type: "background",
        rarity: "rare",
        artKey: "tank-bg-office-window"
      },
      tank: null as never
    }
  }
];

function DecorSpecimens() {
  return (
    <View style={styles.flowSpecimenGrid}>
      {DECOR_SPECIMENS.map(({ label, summary, equipResult, equipError }) => (
        <FramedCard key={label} style={styles.flowSpecimenCard}>
          <Text style={styles.miniSpecimenType}>{label}</Text>
          <FishTankCard
            loading={false}
            summary={summary}
            error={null}
            resultCopy={null}
            hatchResult={null}
            hatchError={null}
            hatchLoading={false}
            equipResult={equipResult ?? null}
            equipError={equipError ?? null}
            equipLoading={false}
            onInitialize={() => undefined}
            onFeed={() => undefined}
            onBubble={() => undefined}
            onHatch={() => undefined}
            onDismissHatchResult={() => undefined}
            onEquipDecoration={() => undefined}
            onDismissEquipResult={() => undefined}
            onRetry={() => undefined}
          />
        </FramedCard>
      ))}
    </View>
  );
}

const MOOD_SPECIMENS: Array<{ label: string; mood: FishTankSummary["mood"] }> = [
  {
    label: "Idle",
    mood: { code: "idle", title: "一起发呆", copy: "小鱼游得很慢。", ambientArtKey: "tank-mood-idle" }
  },
  {
    label: "Cozy",
    mood: { code: "cozy", title: "吃饱发呆", copy: "刚刚投喂过。", ambientArtKey: "tank-mood-cozy" }
  },
  {
    label: "Excited",
    mood: { code: "excited", title: "游得很快", copy: "鱼缸里有新鲜事。", ambientArtKey: "tank-mood-excited" }
  },
  {
    label: "Sleepy",
    mood: { code: "sleepy", title: "困了", copy: "小鱼在角落里 slows down。", ambientArtKey: "tank-mood-sleepy" }
  },
  {
    label: "Sparkly",
    mood: { code: "sparkly", title: "新鱼光临", copy: "刚孵化出新邻居。", ambientArtKey: "tank-mood-sparkly" }
  }
];

function MoodSpecimens() {
  return (
    <View style={styles.flowSpecimenGrid}>
      {MOOD_SPECIMENS.map(({ label, mood }) => (
        <FramedCard key={label} style={styles.flowSpecimenCard}>
          <Text style={styles.miniSpecimenType}>{label}</Text>
          <FishTankCard
            loading={false}
            summary={makeFishSummary({
              initialized: true,
              fish: [
                {
                  id: "lab-fish-1",
                  definitionId: "lab-goldfish",
                  name: "摸摸",
                  rarity: "common",
                  theme: "office",
                  personality: "在键盘上吐泡泡",
                  artKey: "fish-tank-fish",
                  acquiredSource: "starter",
                  createdAt: new Date().toISOString()
                }
              ],
              nextAction: "companionship",
              mood
            })}
            error={null}
            resultCopy={null}
            hatchResult={null}
            hatchError={null}
            hatchLoading={false}
            equipResult={null}
            equipError={null}
            equipLoading={false}
            onInitialize={() => undefined}
            onFeed={() => undefined}
            onBubble={() => undefined}
            onHatch={() => undefined}
            onDismissHatchResult={() => undefined}
            onEquipDecoration={() => undefined}
            onDismissEquipResult={() => undefined}
            onRetry={() => undefined}
          />
        </FramedCard>
      ))}
    </View>
  );
}

const DRAW_OUTCOME_SPECIMENS: FishTankResourceOutcome[] = [
  {
    resourceType: "bubble",
    quantity: 1,
    label: "气泡",
    copy: "气泡 +1：鱼缸看起来更像在认真摸鱼。"
  },
  {
    resourceType: "hatch_progress",
    quantity: 1,
    label: "孵化进度",
    copy: "孵化进度 +1：新邻居正在路上。"
  },
  {
    resourceType: "food",
    quantity: 2,
    label: "鱼食",
    copy: "重复豆没有白来，鱼缸库存 +2。"
  }
];

function BeanDrawOutcomeSpecimens() {
  return (
    <View style={styles.flowSpecimenGrid}>
      <FramedCard style={styles.flowSpecimenCard}>
        <Text style={styles.miniSpecimenType}>new bean</Text>
        <Text style={styles.miniSpecimenTitle}>新豆入仓 + 鱼缸反馈</Text>
        {DRAW_OUTCOME_SPECIMENS.slice(0, 2).map((outcome) => (
          <RewardRow
            key={outcome.resourceType}
            icon={resourceIcon(outcome.resourceType)}
            label={outcome.label}
            value={`+${outcome.quantity}`}
            positive
          />
        ))}
        <Text style={styles.copy}>{DRAW_OUTCOME_SPECIMENS[0]?.copy}</Text>
      </FramedCard>
      <FramedCard style={styles.flowSpecimenCard}>
        <Text style={styles.miniSpecimenType}>duplicate rare</Text>
        <Text style={styles.miniSpecimenTitle}>重复稀有豆 + 鱼缸反馈</Text>
        {[
          DRAW_OUTCOME_SPECIMENS[0],
          { ...DRAW_OUTCOME_SPECIMENS[2], quantity: 2 }
        ].map((outcome) => (
          <RewardRow
            key={outcome.resourceType}
            icon={resourceIcon(outcome.resourceType)}
            label={outcome.label}
            value={`+${outcome.quantity}`}
            positive
          />
        ))}
        <Text style={styles.copy}>{DRAW_OUTCOME_SPECIMENS[2]?.copy}</Text>
      </FramedCard>
    </View>
  );
}

const MOCK_NEXT_STEP: import("../../gameplay/nextStep").GameplayStep = {
  kind: "get-activity",
  title: "领取下一个摸鱼任务",
  description: "继续攒抽豆进度。",
  actionLabel: "领取摸鱼任务",
  execution: "mutate",
  targetSection: "activities",
  rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
};

const CHECK_IN_OUTCOME_SPECIMENS: Array<{ label: string; result: CheckInFinishResult }> = [
  {
    label: "check-in granted",
    result: {
      session: {
        id: "lab-check-in-1",
        status: "completed",
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: 300,
        eligibleDurationSeconds: 300,
        rewarded: true
      },
      reward: { score: 1, drawProgress: 1, drawChancesGranted: 0, rewarded: true, achievementsUnlocked: [] },
      fishTankOutcomes: [{ resourceType: "food", quantity: 1, label: "鱼食", copy: "打卡完成，鱼食 +1。" }]
    } as never
  },
  {
    label: "check-in unrewarded",
    result: {
      session: {
        id: "lab-check-in-2",
        status: "completed",
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: 10,
        eligibleDurationSeconds: 10,
        rewarded: false
      },
      reward: { score: 0, drawProgress: 0, drawChancesGranted: 0, rewarded: false, achievementsUnlocked: [] },
      fishTankOutcomes: []
    } as never
  },
  {
    label: "check-in replayed",
    result: {
      session: {
        id: "lab-check-in-3",
        status: "completed",
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: 300,
        eligibleDurationSeconds: 300,
        rewarded: true
      },
      reward: { score: 0, drawProgress: 0, drawChancesGranted: 0, rewarded: false, achievementsUnlocked: [] },
      fishTankOutcomes: [{ resourceType: "food", quantity: 1, label: "鱼食", copy: "打卡完成，鱼食 +1。（已领取）" }]
    } as never
  }
];

const ACTIVITY_OUTCOME_SPECIMENS: Array<{ label: string; result: ActivityCompleteResult }> = [
  {
    label: "activity granted",
    result: {
      assignment: {
        assignmentId: "lab-activity-1",
        code: "lab-template",
        title: "整理桌面",
        description: "把桌面图标按颜色排序。",
        category: "physical",
        difficulty: "easy",
        flavor: "calm",
        interactionSummary: { flavorLabel: "轻整理", stepCount: 1, estimatedSeconds: 60, proofPolicy: "none", hasTimer: false, hasChoice: false, hasMiniGame: false, hasTapPattern: false, hasShufflePick: false, hasSort: true, hasBreath: false, hasReaction: false, hasReveal: false, hasMicroJournal: false },
        rewardPreview: { score: 5, drawProgress: 1 },
        recommendationExplanation: "久坐提醒。",
        eligible: true,
        cooldownRemainingSeconds: 0,
        status: "completed"
      },
      reward: { score: 5, drawProgress: 1, drawChancesGranted: 0, rewarded: true, reason: null, achievementsUnlocked: [] },
      feedback: "整理完毕，桌面看起来没那么累了。",
      resultTitle: "活动奖励已结算",
      resultCopy: "这次摸鱼记录已经归档。",
      stepSummaries: [],
      fishTankOutcomes: [{ resourceType: "bubble", quantity: 1, label: "气泡", copy: "活动完成，气泡 +1。" }]
    } as never
  },
  {
    label: "activity daily-limit no reward",
    result: {
      assignment: {
        assignmentId: "lab-activity-2",
        code: "lab-template",
        title: "整理桌面",
        description: "把桌面图标按颜色排序。",
        category: "physical",
        difficulty: "easy",
        interactionSummary: { flavorLabel: "轻整理", stepCount: 1, estimatedSeconds: 60, proofPolicy: "none", hasTimer: false, hasChoice: false, hasMiniGame: false, hasTapPattern: false, hasShufflePick: false, hasSort: true, hasBreath: false, hasReaction: false, hasReveal: false, hasMicroJournal: false },
        rewardPreview: { score: 5, drawProgress: 1 },
        eligible: true,
        cooldownRemainingSeconds: 0,
        status: "completed"
      },
      reward: { score: 0, drawProgress: 0, drawChancesGranted: 0, rewarded: false, reason: "daily_limit", achievementsUnlocked: [] },
      feedback: "今日活动奖励已达上限。",
      resultTitle: "活动已记录",
      resultCopy: "这次没有发放奖励，但休息本身算数。",
      stepSummaries: [],
      fishTankOutcomes: []
    } as never
  }
];

const GOAL_OUTCOME_SPECIMENS: Array<{ label: string; result: ProgressionClaimResult }> = [
  {
    label: "daily goal granted",
    result: {
      period: "daily",
      awarded: true,
      claimedAt: new Date().toISOString(),
      reward: { score: 15, drawProgress: 1, drawChancesGranted: 0 },
      progression: { level: 2, previousLevel: 2, currentLevel: 2, leveledUp: false, experience: 210, currentLevelExperience: 10, nextLevelExperience: 100, progressPercent: 10 },
      fishTankOutcomes: [{ resourceType: "hatch_progress", quantity: 1, label: "孵化进度", copy: "每日目标完成，孵化进度 +1。" }]
    } as never
  },
  {
    label: "weekly goal level-up",
    result: {
      period: "weekly",
      awarded: true,
      claimedAt: new Date().toISOString(),
      reward: { score: 50, drawProgress: 2, drawChancesGranted: 1 },
      progression: { level: 3, previousLevel: 2, currentLevel: 3, leveledUp: true, experience: 295, currentLevelExperience: 5, nextLevelExperience: 120, progressPercent: 4 },
      fishTankOutcomes: [{ resourceType: "hatch_progress", quantity: 2, label: "孵化进度", copy: "每周目标完成，孵化进度 +2。" }]
    } as never
  },
  {
    label: "goal replayed",
    result: {
      period: "daily",
      awarded: false,
      claimedAt: new Date().toISOString(),
      reward: { score: 0, drawProgress: 0, drawChancesGranted: 0 },
      progression: { level: 2, previousLevel: 2, currentLevel: 2, leveledUp: false, experience: 210, currentLevelExperience: 10, nextLevelExperience: 100, progressPercent: 10 },
      fishTankOutcomes: [{ resourceType: "hatch_progress", quantity: 1, label: "孵化进度", copy: "每日目标完成，孵化进度 +1。（已领取）" }]
    } as never
  }
];

function ActivityResultCertificate({
  result,
  nextStep
}: {
  result: ActivityCompleteResult;
  nextStep: import("../../gameplay/nextStep").GameplayStep;
}) {
  return (
    <View style={{ borderColor: "#17a36b", borderWidth: 1, borderRadius: 8, padding: 14, marginTop: 12 }}>
      <Text style={{ color: "#18232b", fontSize: 18, fontWeight: "900" }}>{result.resultTitle}</Text>
      <Text style={{ color: "#746b60", fontSize: 13, marginTop: 6 }}>{result.resultCopy}</Text>
      <View style={{ backgroundColor: "#fffdf8", borderColor: "#d8d0c4", borderWidth: 1, borderRadius: 8, marginTop: 10, padding: 12 }}>
        <Text style={{ color: "#756c61", fontSize: 12, fontWeight: "900" }}>奖励回执</Text>
        <Text style={{ color: "#232323", fontSize: 15, fontWeight: "900", marginTop: 4 }}>
          +{result.reward.score} 分 · 进度 +{result.reward.drawProgress} · 抽豆机会 +{result.reward.drawChancesGranted}
        </Text>
      </View>
      <FishTankOutcomeReceipt outcomes={result.fishTankOutcomes} />
      <Text style={{ color: "#746b60", fontSize: 13, marginTop: 10 }}>下一步：{nextStep.title}</Text>
    </View>
  );
}

function SourceRewardOutcomeSpecimens() {
  const checkInGranted = CHECK_IN_OUTCOME_SPECIMENS[0]!;
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={styles.flowSpecimenGrid}>
        {CHECK_IN_OUTCOME_SPECIMENS.map(({ label, result }) => (
          <FramedCard key={label} style={styles.flowSpecimenCard}>
            <Text style={styles.miniSpecimenType}>{label}</Text>
            <CheckInResult result={result} nextStep={MOCK_NEXT_STEP} />
          </FramedCard>
        ))}
        {ACTIVITY_OUTCOME_SPECIMENS.map(({ label, result }) => (
          <FramedCard key={label} style={styles.flowSpecimenCard}>
            <Text style={styles.miniSpecimenType}>{label}</Text>
            <ActivityResultCertificate result={result} nextStep={MOCK_NEXT_STEP} />
          </FramedCard>
        ))}
        {GOAL_OUTCOME_SPECIMENS.map(({ label, result }) => (
          <FramedCard key={label} style={styles.flowSpecimenCard}>
            <Text style={styles.miniSpecimenType}>{label}</Text>
            <ProgressionClaimResultPanel result={result} nextStep={MOCK_NEXT_STEP} />
          </FramedCard>
        ))}
        <FramedCard style={styles.flowSpecimenCard}>
          <Text style={styles.miniSpecimenType}>multiple resources</Text>
          <FishTankOutcomeReceipt
            outcomes={[
              { resourceType: "food", quantity: 1, label: "鱼食", copy: "打卡完成，鱼食 +1。" },
              { resourceType: "bubble", quantity: 1, label: "气泡", copy: "活动完成，气泡 +1。" },
              { resourceType: "hatch_progress", quantity: 1, label: "孵化进度", copy: "每日目标完成，孵化进度 +1。" }
            ]}
          />
        </FramedCard>
        <FramedCard style={styles.flowSpecimenCard}>
          <Text style={styles.miniSpecimenType}>long copy wrap</Text>
          <FishTankOutcomeReceipt
            outcomes={[
              {
                resourceType: "hatch_progress",
                quantity: 2,
                label: "孵化进度",
                copy: "每周目标全部达成，孵化进度 +2，距离下一条小鱼又近了一步。"
              }
            ]}
          />
        </FramedCard>
        <FramedCard style={styles.flowSpecimenCard}>
          <Text style={styles.miniSpecimenType}>missing-art fallback</Text>
          <FishTankOutcomeReceipt
            outcomes={[
              { resourceType: "food", quantity: 1, label: "神秘资源", copy: "未知资源 fallback 到通用图标。" }
            ]}
          />
        </FramedCard>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          {([360, 390, 640] as const).map((width) => (
            <View key={width} style={{ width }}>
              <Text style={styles.miniSpecimenType}>{width}px combined receipt viewport</Text>
              <CheckInResult result={checkInGranted.result} nextStep={MOCK_NEXT_STEP} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function DashboardCoherenceSpecimens() {
  const [showError, setShowError] = useState(true);
  const success = createDashboardFeedback({
    id: "ui_lab_expiring_success",
    kind: "success",
    scope: "home",
    message: "打卡已结算；这条短反馈会在 4.5 秒后自动收起。"
  });
  const error = createDashboardFeedback({
    id: "ui_lab_dismissible_error",
    kind: "error",
    scope: "rankings",
    message: "没有找到这个好友码。"
  });

  return (
    <Surface>
      <SectionHeader kicker="DASHBOARD COHERENCE" title="导航、反馈与跨系统同步" />
      <View style={styles.stack}>
        <Text style={styles.miniSpecimenType}>expiring success</Text>
        <DashboardFeedbackBanner feedback={success} onDismiss={() => undefined} />
        <Text style={styles.miniSpecimenType}>dismissible error</Text>
        {showError ? (
          <DashboardFeedbackBanner feedback={error} onDismiss={() => setShowError(false)} />
        ) : (
          <PrimaryButton label="重新显示错误标本" onPress={() => setShowError(true)} />
        )}
        <FramedCard>
          <Text style={styles.miniSpecimenType}>localized units</Text>
          <Text style={styles.miniSpecimenTitle}>
            今日打卡 1/3 {localizedGoalUnit("times")} · 休息 10/15 {localizedGoalUnit("minutes")}
          </Text>
        </FramedCard>
        <FramedCard>
          <Text style={styles.miniSpecimenType}>pending direct mutation</Text>
          <PrimaryButton label="正在抽取 1 次…" disabled onPress={() => undefined} />
        </FramedCard>
        <FramedCard>
          <Text style={styles.miniSpecimenType}>synchronized fish-tank outcome</Text>
          <RewardRow label="鱼食库存" value="2 → 4" icon="🍘" positive />
          <RewardRow label="气泡库存" value="1 → 2" icon="🫧" positive />
          <Text style={styles.copy}>抽豆回执保留，鱼缸权威库存已刷新。</Text>
        </FramedCard>
        <FramedCard>
          <Text style={styles.miniSpecimenType}>refresh failure</Text>
          <DashboardFeedbackBanner
            feedback={createDashboardFeedback({
              id: "ui_lab_sync_error",
              kind: "error",
              scope: "beans",
              message: "奖励已经到账，但鱼缸库存同步失败。请在鱼缸卡片中重试。"
            })}
            onDismiss={() => undefined}
          />
          <Text style={styles.copy}>抽豆结果仍然有效；旧库存不会被描述为最新状态。</Text>
        </FramedCard>
      </View>
    </Surface>
  );
}

export function UiLabScreen({ onClose }: UiLabScreenProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const { setThemeId, availableThemes, themeId } = useThemeSwitcher();
  const [triggers, setTriggers] = useState<MotionTriggers>({});

  function bump(variant: string) {
    setTriggers((current) => ({ ...current, [variant]: (current[variant] ?? 0) + 1 }));
  }

  function fireThemeSwitch() {
    const next = availableThemes.find((t) => t.id !== themeId) ?? availableThemes[0];
    if (next) setThemeId(next.id);
    bump("theme-switch");
  }

  return (
    <View style={[styles.app, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.brand, { color: theme.colors.primary }]}>
            {theme.brand.appName} UI Lab
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {theme.brand.tagline}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {theme.brand.manifestoCopy}
          </Text>
          <Text style={[styles.themeMeta, { color: theme.colors.primary }]}>
            {theme.name} / {theme.art.iconStyle}
          </Text>
        </View>

        <ThemeSpecimen />

        <BrandManifestoCard />

        <Surface>
          <SectionHeader title="Signals" />
          <View style={styles.tileRow}>
            <SignalTile
              label="今日卷度"
              value="37%"
              accentColor={theme.colors.accent}
              tilted
            />
            <SignalTile label="离线权" value="已批准" accentColor={theme.colors.primary} />
            <SignalTile label="荒诞值" value="83" accentColor={theme.colors.warning} tilted />
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Actions" />
          <View style={styles.stack}>
            <PrimaryButton label="领取摸鱼任务" onPress={() => undefined} />
            <PrimaryButton label="深色操作" dark onPress={() => undefined} />
            <PrimaryButton label="不可点击状态" disabled onPress={() => undefined} />
          </View>
        </Surface>

        <DashboardCoherenceSpecimens />

        <Surface>
          <SectionHeader title="Pills" />
          <View style={styles.pillRow}>
            <Pill label="全部" selected />
            <Pill label="小游戏" />
            <Pill label="办公室表演" accentColor={theme.colors.danger} selected />
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Progress" />
          <View style={styles.stack}>
            <ProgressMeter label="今日目标" value={2} total={3} />
            <ProgressMeter label="抽豆进度" value={1} total={3} />
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Status badges" />
          <View style={styles.pillRow}>
            <StatusBadge tone="active" label="ACTIVE" />
            <StatusBadge tone="completed" label="完成" />
            <StatusBadge tone="warning" label="即将重置" />
            <StatusBadge tone="locked" label="未解锁" />
            <StatusBadge tone="default" label="默认" />
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Framed cards" />
          <View style={styles.stack}>
            <FramedCard>
              <Text style={styles.cardTitle}>基础 FramedCard</Text>
              <Text style={styles.copy}>没有 pixel 边框，靠 padding 撑开。</Text>
            </FramedCard>
            <FramedCard pixelBorder>
              <Text style={styles.cardTitle}>Pixel 边框</Text>
              <Text style={styles.copy}>2px 实线带软像素角。</Text>
            </FramedCard>
            <FramedCard pixelBorder accent={colors.gold}>
              <Text style={styles.cardTitle}>Pixel 边框 + 金色 accent</Text>
              <Text style={styles.copy}>强调"刚刚解锁"或"特别提醒"。</Text>
            </FramedCard>
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Icon tiles" />
          <View style={styles.tileRow}>
            <IconTile size={48} accent={colors.acid}>
              <Text style={styles.iconTileText}>休</Text>
            </IconTile>
            <IconTile size={36} accent={colors.cyan}>
              <Text style={styles.iconTileText}>豆</Text>
            </IconTile>
            <IconTile size={28} accent={colors.coral}>
              <Text style={styles.iconTileText}>我</Text>
            </IconTile>
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Reward rows" />
          <View style={styles.stack}>
            <RewardRow label="摸鱼指数" value="+12" icon="🐟" positive />
            <RewardRow label="抽豆进度" value="+1/3" icon="🫘" positive />
            <RewardRow label="本次奖励" value="0" />
            <RewardRow label="下一档解锁" value="3/5" icon="🏆" />
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Empty states" />
          <View style={styles.stack}>
            <EmptyState
              icon="🫘"
              title="豆仓还没有收藏"
              body="完成一次抽豆，bean 就会出现在这里。"
            />
            <EmptyState
              icon="🏆"
              title="排行榜暂无人上榜"
              body="等你先完成一个摸鱼打卡。"
            />
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Section headers" />
          <View style={styles.stack}>
            <SectionHeader kicker="TODAY" title="今日摸鱼" />
            <SectionHeader
              kicker="COLLECTION"
              title="你的豆仓"
              trailing={<Pill label="3 / 12" selected accentColor={theme.colors.primary} />}
            />
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Asset pack inventory" kicker="BY KIND" />
          <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
            All registered slots grouped by asset kind. Each slot resolves the
            active theme, then the default asset, then a stable placeholder.
          </Text>
          <View style={styles.stack}>
            {groupSlotsByKind(listArtSlotDefinitions()).map(([kind, slots]) => (
              <View key={kind}>
                <Text style={styles.assetPackKindLabel}>{kind}</Text>
                <View style={styles.artSlotGrid}>
                  {slots.map((slot) => {
                    const asset = resolveArtAsset(theme.id, slot.id);
                    return (
                      <FramedCard key={slot.id} style={styles.artSlotCard}>
                        <ArtSlot slotId={slot.id} size={48} />
                        <Text style={styles.artSlotName}>{slot.id}</Text>
                        <Text style={styles.artSlotMeta}>
                          {asset.fallbackGlyph} · {asset.alt}
                        </Text>
                      </FramedCard>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Pixel-rest first pack" kicker="PREVIEWS" />
          <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
            Component-backed pseudo-pixel assets registered under the pixel-rest
            theme. Each row shows the asset, its fallback glyph, and intended
            surface.
          </Text>
          <View style={styles.stack}>
            {artAssets
              .filter((asset) => asset.themeId === "pixel-rest")
              .map((asset) => (
                <View key={asset.id} style={styles.assetPackRow}>
                  <ArtSlot slotId={asset.slotId} size={56} />
                  <View style={styles.flex}>
                    <Text style={styles.assetPackName}>{asset.id}</Text>
                    <Text style={styles.assetPackMeta}>
                      {asset.slotId} · {asset.kind}
                    </Text>
                    <Text style={styles.assetPackAlt}>{asset.alt}</Text>
                  </View>
                  <Text style={styles.assetPackGlyph}>{asset.fallbackGlyph}</Text>
                </View>
              ))}
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Fallback / missing-asset" kicker="STABILITY" />
          <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
            Unknown themes and unregistered slots must still render a stable
            placeholder with the same layout footprint.
          </Text>
          <View style={styles.tileRow}>
            <View style={styles.pixelArtStack}>
              <ArtSlot slotId="bean-gallery-item" size={24} />
              <Text style={styles.pixelArtLabel}>24px bean</Text>
            </View>
            <View style={styles.pixelArtStack}>
              <ArtSlot slotId="achievement-badge" size={40} />
              <Text style={styles.pixelArtLabel}>40px badge</Text>
            </View>
            <View style={styles.pixelArtStack}>
              <ArtSlot slotId="activities-card-illustration" size={80} />
              <Text style={styles.pixelArtLabel}>80px activity</Text>
            </View>
            <View style={styles.pixelArtStack}>
              <ArtSlot slotId="home-check-in-character" size={64} />
              <Text style={styles.pixelArtLabel}>64px character</Text>
            </View>
          </View>
          <View style={styles.stack}>
            <RewardRow
              icon="🛡️"
              label="Unknown theme fallback"
              value={resolveArtAsset("unknown-theme", "achievement-badge").fallbackGlyph}
            />
            <RewardRow
              icon="🛡️"
              label="Unknown slot fallback"
              value={resolveArtAsset(theme.id, "not-a-slot" as ArtSlotId).slotId}
            />
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Motion specimens" kicker="FIRST CLICK VS REPEAT" />
          <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
            {reducedMotion
              ? "Reduced motion is enabled: feedback uses instant or opacity-only transitions."
              : "Reduced motion is not enabled: feedback uses brief movement. Tap a button repeatedly to confirm the trigger debounces identical values."}
          </Text>
          <View style={styles.motionSpecimenRow}>
            {[
              { key: "check-in", label: "Check-in", slot: "home-check-in-character" as const },
              { key: "activity-step", label: "Activity step", slot: "activity-step-feedback" as const },
              { key: "activity-complete", label: "Activity done", slot: "activities-card-illustration" as const },
              { key: "bean-reveal", label: "Bean reveal", slot: "bean-draw-result" as const },
              { key: "achievement-unlock", label: "Achievement", slot: "achievement-badge" as const },
              { key: "theme-switch", label: "Theme switch", slot: "home-check-in-character" as const }
            ].map((item) => (
              <View key={item.key} style={styles.motionSpecimen}>
                <MotionFeedback
                  variant={item.key as MotionFeedbackVariant}
                  trigger={triggers[item.key]}
                  animateOnMount={false}
                  style={styles.motionBox}
                >
                  <ArtSlot slotId={item.slot} size={32} />
                </MotionFeedback>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => bump(item.key)}
                  style={styles.motionButton}
                >
                  <Text style={styles.motionButtonText}>{item.label}</Text>
                </Pressable>
                <Text style={styles.motionCount}>
                  {triggers[item.key] ?? 0}x
                </Text>
              </View>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={fireThemeSwitch}
            style={styles.inlineActionButton}
          >
            <Text style={styles.inlineActionText}>Fire theme switch motion</Text>
          </Pressable>
        </Surface>

        <Surface>
          <SectionHeader title="Narrow-width QA notes" kicker="REVIEWER NOTES" />
          <View style={styles.stack}>
            <Text style={styles.qaNote}>
              • All art slots keep a fixed size prop; avoid relying on flex-shrink
              to prevent layout jumps on 360–390 px widths.
            </Text>
            <Text style={styles.qaNote}>
              • Component-backed assets use theme tokens, so they remain visible
              under both pixel-rest and calm-office without new files.
            </Text>
            <Text style={styles.qaNote}>
              • Replacement contract: drop a PNG/SVG source into the registry for
              any slot; ArtSlot will prefer source images over the component.
            </Text>
            <Text style={styles.qaNote}>
              • Empty states should always include an ArtSlot above the text to
              keep the visual weight consistent across tabs.
            </Text>
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Daily loop delight" kicker="TODAY ROUTE" />
          <PlayLoopSpecimens />
        </Surface>

        <Surface>
          <SectionHeader title="Activity result feedback" kicker="OPTIONAL FEEDBACK" />
          <ActivityFeedbackSpecimens />
        </Surface>

        <Surface>
          <SectionHeader title="Activity history" kicker="SESSION TIMELINE" />
          <ActivityHistorySpecimens />
        </Surface>

        <Surface>
          <SectionHeader title="Activity mini-interactions" kicker="STEP COMPONENTS" />
          <MiniInteractionSpecimens />
        </Surface>

        <Surface>
          <SectionHeader title="Activity multi-step flows" kicker="REALISTIC FLOWS" />
          <MultiStepFlowSpecimens />
        </Surface>

        <Surface>
          <SectionHeader title="Activity tones" />
          <View style={styles.stack}>
            {TONE_PREVIEWS.map((item) => (
              <ActivityPreviewCard
                key={item.tone}
                badge={item.badge}
                headline={item.headline}
                scene={item.scene}
                prompt={item.prompt}
                statLabel={item.statLabel}
                statValue={item.statValue}
                tone={item.tone}
              />
            ))}
          </View>
        </Surface>

        <Surface>
          <SectionHeader title="Fish tank" kicker="PERSONAL MVP" />
          <Text style={[styles.copy, { color: colors.inkMuted }]}>
            Loading, uninitialized, care-available, cooldown, success receipt, with resources, and error states.
          </Text>
          <FishTankSpecimens reducedMotion={reducedMotion} />
        </Surface>

        <Surface>
          <SectionHeader title="Fish hatching" kicker="HATCH & REVEAL" />
          <Text style={[styles.copy, { color: colors.inkMuted }]}>
            Insufficient progress, ready, loading, successful reveal, replay-safe result, catalog complete, and API error states.
          </Text>
          <HatchSpecimens />
        </Surface>

        <Surface>
          <SectionHeader title="Tank decor" kicker="DECORATIONS & EQUIP" />
          <Text style={[styles.copy, { color: colors.inkMuted }]}>
            Default layout, equipped set, owned unequipped, locked silhouettes, wrong-slot error, and equip result overlay.
          </Text>
          <DecorSpecimens />
        </Surface>

        <Surface>
          <SectionHeader title="Tank mood" kicker="MOOD VARIANTS" />
          <Text style={[styles.copy, { color: colors.inkMuted }]}>
            Idle, cozy, excited, sleepy, and sparkly mood states.
          </Text>
          <MoodSpecimens />
        </Surface>

        <Surface>
          <SectionHeader title="Bean draw to fish tank" kicker="RESOURCE OUTCOMES" />
          <Text style={[styles.copy, { color: colors.inkMuted }]}>
            Outcomes rendered inside the bean draw result for new and duplicate rare draws.
          </Text>
          <BeanDrawOutcomeSpecimens />
        </Surface>

        <Surface>
          <SectionHeader title="Source reward to fish tank" kicker="REWARD OUTCOMES" />
          <Text style={[styles.copy, { color: colors.inkMuted }]}>
            Check-in, activity, and daily/weekly goal outcomes rendered below source receipts.
          </Text>
          <SourceRewardOutcomeSpecimens />
        </Surface>

        <Surface>
          <SectionHeader title="Core surface" kicker="INFORMATION ARCHITECTURE" />
          <CoreSurfaceSpecimens />
        </Surface>

        <PrimaryButton label="返回 App" dark onPress={onClose} />
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1
  },
  container: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: 96
  },
  header: {
    marginBottom: spacing.sm
  },
  brand: {
    color: colors.primary,
    ...typography.kicker
  },
  title: {
    color: colors.ink,
    marginTop: spacing.sm,
    ...typography.display
  },
  subtitle: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.body
  },
  themeMeta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginTop: spacing.md
  },
  specimenMeta: {
    marginTop: spacing.md
  },
  specimenName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  specimenId: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: spacing.xs
  },
  specimenSection: {
    color: colors.inkSoft,
    fontSize: 12,
    fontWeight: "900",
    marginTop: spacing.lg
  },
  specimenRow: {
    marginTop: spacing.sm
  },
  specimenBrandBlock: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md
  },
  specimenBrandName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  specimenBrandShort: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: spacing.xs
  },
  specimenBrandTagline: {
    color: colors.inkSoft,
    fontSize: 14,
    marginTop: spacing.sm
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  colorSwatch: {
    alignItems: "center",
    width: 72
  },
  colorBlock: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 36,
    width: 36
  },
  colorLabel: {
    color: colors.inkMuted,
    fontSize: 10,
    marginTop: spacing.xs,
    textAlign: "center"
  },
  feedbackChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  scaleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm
  },
  scaleItem: {
    alignItems: "center"
  },
  spacingBlock: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm
  },
  radiusBlock: {
    backgroundColor: colors.primary
  },
  scaleLabel: {
    color: colors.inkMuted,
    fontSize: 10,
    marginTop: spacing.xs
  },
  themeSwitchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  themeButton: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  themeButtonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  themeButtonText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  themeButtonTextActive: {
    color: colors.white
  },
  stack: {
    gap: spacing.md,
    marginTop: spacing.md
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  tileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md
  },
  cardTitle: {
    color: colors.ink,
    ...typography.title
  },
  copy: {
    color: colors.inkMuted,
    marginTop: spacing.xs,
    ...typography.body
  },
  iconTileText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  pixelArtStack: {
    alignItems: "center",
    gap: spacing.xs
  },
  pixelArtLabel: {
    color: colors.inkMuted,
    fontSize: 11
  },
  artSlotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  artSlotCard: {
    alignItems: "center",
    padding: spacing.md,
    width: 104
  },
  artSlotName: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "900",
    marginTop: spacing.sm,
    textAlign: "center"
  },
  artSlotMeta: {
    color: colors.inkMuted,
    fontSize: 10,
    marginTop: spacing.xs,
    textAlign: "center"
  },
  assetPackKindLabel: {
    color: colors.inkSoft,
    fontSize: 12,
    fontWeight: "900",
    marginTop: spacing.md,
    textTransform: "uppercase"
  },
  assetPackRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  assetPackName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  assetPackMeta: {
    color: colors.inkMuted,
    fontSize: 11,
    marginTop: spacing.xs
  },
  assetPackAlt: {
    color: colors.inkSoft,
    fontSize: 10,
    marginTop: spacing.xs
  },
  assetPackGlyph: {
    color: colors.inkMuted,
    fontSize: 20,
    marginLeft: "auto"
  },
  flex: {
    flex: 1
  },
  qaNote: {
    color: colors.inkMuted,
    fontSize: 12,
    lineHeight: 18
  },
  motionCount: {
    color: colors.inkMuted,
    fontSize: 10,
    marginTop: spacing.xs
  },
  motionSpecimenRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md
  },
  motionSpecimen: {
    alignItems: "center",
    gap: spacing.sm
  },
  motionBox: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  motionButton: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  motionButtonText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900"
  },
  inlineActionButton: {
    alignItems: "center",
    backgroundColor: colors.inkBlue,
    borderRadius: radius.md,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  inlineActionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900"
  },
  playLoopSpecimenRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  playLoopSpecimenReceipt: {
    backgroundColor: colors.surface,
    borderColor: colors.mintMid,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.sm
  },
  playLoopSpecimenText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "900"
  },
  miniSpecimenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  miniSpecimenCard: {
    flex: 1,
    minWidth: 280,
    padding: spacing.md
  },
  miniSpecimenType: {
    color: colors.inkSoft,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  miniSpecimenTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    marginTop: spacing.xs
  },
  miniSpecimenReset: {
    alignSelf: "flex-start",
    marginTop: spacing.sm
  },
  miniSpecimenResetText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "900"
  },
  flowControlRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  flowButton: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  flowButtonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  flowButtonText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  flowButtonTextActive: {
    color: colors.white
  },
  flowSpecimenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md
  },
  flowSpecimenCard: {
    flex: 1,
    minWidth: 280,
    padding: spacing.md
  }
});
