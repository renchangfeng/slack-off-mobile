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
import {
  ActivityHistoryCard,
  ActivityHistoryDetail,
  ActivityHistorySection
} from "../dashboard/ActivitiesTab";
import type { FishTankSummary } from "../../api/fishTank";

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
import { resolveHistoryPresentation } from "../dashboard/helpers";

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
  return {
    moodCopy: "小鱼正在假装工作。",
    careAvailability: {
      feed: {
        available: partial.nextAction === "feed",
        nextAvailableAt: null,
        cooldownRemainingSeconds: 0
      }
    },
    ...partial
  };
}

const FISH_TANK_SPECIMENS: Array<{
  label: string;
  summary: FishTankSummary | null;
  loading: boolean;
  error: string | null;
  resultCopy?: string | null;
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
      moodCopy: "这里还空着，放一条小鱼进来。"
    }),
    loading: false,
    error: null
  },
  {
    label: "Care available",
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
      nextAction: "wait",
      moodCopy: "小鱼吃饱了，正在发呆。",
      careAvailability: {
        feed: {
          available: false,
          nextAvailableAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
          cooldownRemainingSeconds: 25 * 60
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
      nextAction: "wait",
      moodCopy: "投喂成功，小鱼很开心。",
      careAvailability: {
        feed: {
          available: false,
          nextAvailableAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          cooldownRemainingSeconds: 30 * 60
        }
      }
    }),
    loading: false,
    error: null,
    resultCopy: "小鱼打了个饱嗝，卷度 -5。"
  },
  {
    label: "Error",
    summary: null,
    loading: false,
    error: "小鱼临时失联，请稍后再试。"
  }
];

function FishTankSpecimens() {
  return (
    <View style={styles.flowSpecimenGrid}>
      {FISH_TANK_SPECIMENS.map(({ label, summary, loading, error, resultCopy }) => (
        <FramedCard key={label} style={styles.flowSpecimenCard}>
          <Text style={styles.miniSpecimenType}>{label}</Text>
          <FishTankCard
            loading={loading}
            summary={summary}
            error={error}
            resultCopy={resultCopy ?? null}
            onInitialize={() => undefined}
            onFeed={() => undefined}
            onRetry={() => undefined}
          />
        </FramedCard>
      ))}
    </View>
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
            Loading, uninitialized, care-available, cooldown, success receipt, and error states.
          </Text>
          <FishTankSpecimens />
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
