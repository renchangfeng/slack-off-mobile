import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArtSlot } from "../../ui/art/ArtSlot";
import { artAssets, listArtSlotDefinitions, resolveArtAsset } from "../../ui/art/registry";
import type { ArtAssetKind, ArtSlotId } from "../../ui/art/types";
import type { ActivityAssignment, ActivityInteractionProgress } from "../../api/activities";
import {
  BreathInteraction,
  ChoiceInteraction,
  MicroJournalInteraction,
  ReactionInteraction,
  RevealInteraction,
  ShufflePickInteraction,
  SortInteraction,
  TapPatternInteraction
} from "../dashboard/parts/activity-interactions";

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
  }
];

function StepComponent({
  step,
  progress,
  onChange,
  reducedMotion
}: {
  step: MiniStep;
  progress: ActivityInteractionProgress;
  onChange: React.Dispatch<React.SetStateAction<ActivityInteractionProgress>>;
  reducedMotion: boolean;
}) {
  if (step.type === "tap-pattern") {
    return <TapPatternInteraction step={step} progress={progress} onChange={onChange} reducedMotion={reducedMotion} />;
  }
  if (step.type === "choice") {
    return <ChoiceInteraction step={step} progress={progress} onChange={onChange} reducedMotion={reducedMotion} />;
  }
  if (step.type === "shuffle-pick") {
    return <ShufflePickInteraction step={step} progress={progress} onChange={onChange} reducedMotion={reducedMotion} />;
  }
  if (step.type === "sort") {
    return <SortInteraction step={step} progress={progress} onChange={onChange} reducedMotion={reducedMotion} />;
  }
  if (step.type === "breath") {
    return <BreathInteraction step={step} progress={progress} onChange={onChange} reducedMotion={reducedMotion} />;
  }
  if (step.type === "reaction") {
    return <ReactionInteraction step={step} progress={progress} onChange={onChange} reducedMotion={reducedMotion} />;
  }
  if (step.type === "micro-journal") {
    return <MicroJournalInteraction step={step} progress={progress} onChange={onChange} reducedMotion={reducedMotion} />;
  }
  if (step.type === "reveal") {
    return <RevealInteraction step={step} progress={progress} onChange={onChange} reducedMotion={reducedMotion} />;
  }
  return <Text style={styles.copy}>Unsupported step type</Text>;
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
    </View>
  );
}

function MiniInteractionCard({
  step,
  reducedMotion
}: {
  step: MiniStep;
  reducedMotion: boolean;
}) {
  const [progress, setProgress] = useState<ActivityInteractionProgress>({});

  return (
    <FramedCard style={styles.miniSpecimenCard}>
      <Text style={styles.miniSpecimenType}>{step.type}</Text>
      <Text style={styles.miniSpecimenTitle}>{step.title}</Text>
      <StepComponent step={step} progress={progress} onChange={setProgress} reducedMotion={reducedMotion} />
      <Pressable
        accessibilityRole="button"
        onPress={() => setProgress({})}
        style={styles.miniSpecimenReset}
      >
        <Text style={styles.miniSpecimenResetText}>重置</Text>
      </Pressable>
    </FramedCard>
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
          <SectionHeader title="Activity mini-interactions" kicker="STEP COMPONENTS" />
          <MiniInteractionSpecimens />
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
  }
});
