import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArtSlot } from "../../../ui/art/ArtSlot";
import {
  RewardRow,
  SectionHeader,
  StatusBadge
} from "../../../ui/components";
import { MotionFeedback } from "../../../ui/motion/MotionFeedback";
import { useTheme } from "../../../ui/theme/useTheme";
import type { ArtSlotId } from "../../../ui/art/types";
import { DashboardCard } from "./DashboardCard";
import { ActionButton, ProgressBar } from "./SharedControls";
import { rarityLabel, resourceIcon } from "../helpers";
import {
  deriveCollectionPreview,
  deriveDecorItemAction,
  deriveDecorSlotGroups,
  deriveEquipResultPresentation,
  deriveHatchButtonLabel,
  deriveHatchProgressLabel,
  deriveHatchResultPresentation,
  deriveHatchUiState,
  deriveMoodPresentation,
  SLOT_LABELS
} from "./fishTankHelpers";
import styles from "../styles";
import type {
  DecorationInventoryItem,
  EquipDecorationResult,
  FishTankSummary,
  HatchResult
} from "../../../api/fishTank";

type FishTankCardProps = {
  loading: boolean;
  summary: FishTankSummary | null;
  error: string | null;
  resultCopy?: string | null;
  hatchResult?: HatchResult | null;
  hatchError?: string | null;
  hatchLoading?: boolean;
  equipResult?: EquipDecorationResult | null;
  equipError?: string | null;
  equipLoading?: boolean;
  onInitialize: () => void | Promise<void>;
  onFeed: () => void | Promise<void>;
  onHatch: () => void | Promise<void>;
  onDismissHatchResult: () => void;
  onEquipDecoration: (item: DecorationInventoryItem) => void | Promise<void>;
  onDismissEquipResult: () => void;
  onRetry: () => void | Promise<void>;
};

export function FishTankCard({
  loading,
  summary,
  error,
  resultCopy,
  hatchResult,
  hatchError,
  hatchLoading = false,
  equipResult,
  equipError,
  equipLoading = false,
  onInitialize,
  onFeed,
  onHatch,
  onDismissHatchResult,
  onEquipDecoration,
  onDismissEquipResult,
  onRetry
}: FishTankCardProps) {
  const theme = useTheme();
  const feedCare = summary?.careAvailability.feed ?? null;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [cooldownReceivedAtMs, setCooldownReceivedAtMs] = useState(() => Date.now());

  useEffect(() => {
    const receivedAt = Date.now();
    setNowMs(receivedAt);
    setCooldownReceivedAtMs(receivedAt);

    if (!feedCare || feedCare.available) {
      return undefined;
    }

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [feedCare?.available, feedCare?.cooldownRemainingSeconds, feedCare?.nextAvailableAt]);

  const cooldownSeconds = calculateLiveCooldownSeconds(feedCare, nowMs, cooldownReceivedAtMs);
  const feedAvailable = Boolean(feedCare?.available) || cooldownSeconds <= 0;
  const cooldownLabel = formatCooldown(cooldownSeconds);

  const hatchState = deriveHatchUiState(summary, hatchLoading);
  const hatchProgressLabel = deriveHatchProgressLabel(hatchState);
  const hatchButtonLabel = deriveHatchButtonLabel(hatchState);
  const canHatch = hatchState.kind === "ready" && !hatchLoading;
  const presentation = deriveHatchResultPresentation(hatchResult ?? null);

  if (loading && !summary) {
    return (
      <DashboardCard>
        <SectionHeader kicker="个人鱼缸" title="加载中..." />
        <View style={{ alignItems: "center", marginVertical: 24 }}>
          <ArtSlot slotId="fish-tank-empty" size={64} />
        </View>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard>
        <SectionHeader kicker="个人鱼缸" title="出错了" />
        <Text style={styles.copy}>{error}</Text>
        <ActionButton label="重试" onPress={onRetry} />
      </DashboardCard>
    );
  }

  if (!summary || !summary.initialized) {
    const mood = deriveMoodPresentation(summary?.mood);
    return (
      <DashboardCard>
        <SectionHeader kicker="个人鱼缸" title="还没有小鱼" />
        <View style={{ alignItems: "center", marginVertical: 12 }}>
          <ArtSlot slotId="fish-tank-empty" size={80} />
        </View>
        <Text style={styles.copy}>{mood.copy}</Text>
        <ActionButton label="放入第一条小鱼" disabled={loading} onPress={onInitialize} />
      </DashboardCard>
    );
  }

  const fish = summary.fish[0];
  const mood = deriveMoodPresentation(summary.mood);
  const decorGroups = deriveDecorSlotGroups(summary);
  const equipPresentation = deriveEquipResultPresentation(equipResult ?? null);

  return (
    <DashboardCard>
      <SectionHeader
        kicker="个人鱼缸"
        title={fish?.name ?? "小鱼"}
        trailing={
          feedAvailable ? (
            <StatusBadge tone="active" label="可投喂" />
          ) : (
            <StatusBadge tone="locked" label={cooldownLabel} />
          )
        }
      />
      <View style={{ alignItems: "center", marginVertical: 12 }}>
        <MotionFeedback variant="fish-feed" trigger={resultCopy} animateOnMount={false}>
          <ArtSlot slotId="fish-tank-fish" size={96} />
        </MotionFeedback>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <StatusBadge tone="active" label={mood.title} />
        <Text style={[styles.copy, { flex: 1, marginBottom: 0 }]}>{mood.copy}</Text>
      </View>

      {decorGroups.length > 0 ? (
        <View style={{ marginVertical: 8 }}>
          <Text style={styles.kicker}>当前装扮</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {decorGroups.map((group) => (
              <View
                key={group.slot}
                style={[
                  styles.decorPreviewCell,
                  {
                    backgroundColor: theme.colors.surfaceWarm,
                    borderColor: theme.colors.border
                  }
                ]}
              >
                <ArtSlot
                  slotId={(group.equipped?.artKey as ArtSlotId) ?? "tank-decor-locked-silhouette"}
                  size={40}
                />
                <Text style={styles.decorPreviewLabel}>{group.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {resultCopy ? (
        <View
          style={[
            styles.resultReceiptBox,
            {
              backgroundColor: theme.colors.surfaceWarm,
              borderColor: theme.colors.primary
            }
          ]}
        >
          <Text style={styles.kicker}>投喂结果</Text>
          <Text style={styles.rowTitle}>{resultCopy}</Text>
        </View>
      ) : null}
      <ActionButton
        label={feedAvailable ? "投喂小鱼" : `冷却中 ${cooldownLabel}`}
        disabled={loading || !feedAvailable}
        onPress={onFeed}
      />

      <View style={{ marginTop: 16 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.kicker}>孵化进度</Text>
          <Text style={styles.helperText}>{hatchProgressLabel}</Text>
        </View>
        <ProgressBar
          value={
            hatchState.kind === "insufficient" || hatchState.kind === "ready"
              ? hatchState.current
              : hatchState.kind === "complete"
                ? summary.collection?.total ?? 0
                : 0
          }
          max={
            hatchState.kind === "insufficient" || hatchState.kind === "ready"
              ? hatchState.cost
              : Math.max(1, summary.collection?.total ?? 1)
          }
          color={canHatch ? theme.colors.success : theme.colors.accent}
          trackColor={theme.colors.border}
        />
        <ActionButton
          label={hatchButtonLabel}
          disabled={!canHatch}
          dark={canHatch}
          onPress={onHatch}
        />
        {hatchError ? <Text style={styles.message}>{hatchError}</Text> : null}
      </View>

      {summary.collection?.items && summary.collection.items.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.kicker}>
            小鱼图鉴 {summary.collection.owned}/{summary.collection.total}
          </Text>
          <View style={styles.fishCollectionGrid}>
            {deriveCollectionPreview(summary).map((item) => (
              <View key={item.definitionId} style={styles.fishCollectionCell}>
                <ArtSlot
                  slotId={item.owned ? "fish-tank-fish" : "fish-locked-silhouette"}
                  size={40}
                />
                <Text style={styles.fishCollectionName}>
                  {item.owned ? item.name : item.sourceHint}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {summary.resourceSummary?.resources?.some((resource) => resource.quantity > 0) ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.kicker}>鱼缸库存</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {summary.resourceSummary.resources.map((resource) => (
              <RewardRow
                key={resource.resourceType}
                icon={resourceIcon(resource.resourceType)}
                label={resource.label}
                value={`${resource.quantity}`}
              />
            ))}
          </View>
        </View>
      ) : null}

      {decorGroups.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.kicker}>装扮仓库</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 6 }}
            contentContainerStyle={{ gap: 12, paddingRight: 8 }}
          >
            {decorGroups.map((group) => (
              <View key={group.slot} style={{ minWidth: 160, maxWidth: 220 }}>
                <Text style={styles.helperText}>{group.label}</Text>
                <View style={{ gap: 8, marginTop: 6 }}>
                  {group.items.map((item) => {
                    const action = deriveDecorItemAction(item);
                    return (
                      <View
                        key={item.definitionId}
                        style={[
                          styles.decorItemRow,
                          action.state === "locked" && styles.decorItemRowLocked
                        ]}
                      >
                        <ArtSlot
                          slotId={item.owned ? (item.artKey as ArtSlotId) : "tank-decor-locked-silhouette"}
                          size={40}
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.rowTitle}>{item.name}</Text>
                          <Text style={styles.rowMeta}>
                            {rarityLabel(item.rarity)} · {action.actionLabel}
                          </Text>
                          {action.state === "locked" ? (
                            <Text style={styles.helperText}>{item.unlockHint}</Text>
                          ) : null}
                        </View>
                        {action.actionable ? (
                          <Pressable
                            accessibilityRole="button"
                            disabled={equipLoading}
                            onPress={() => onEquipDecoration(item)}
                            style={({ pressed }) => [
                              styles.inlineEquipButton,
                              (pressed || equipLoading) && styles.buttonMuted
                            ]}
                          >
                            <Text style={styles.inlineEquipText}>装备</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
          {equipError ? <Text style={styles.message}>{equipError}</Text> : null}
        </View>
      ) : null}

      {equipPresentation ? (
        <View
          style={[
            styles.hatchRevealBackdrop,
            { backgroundColor: "rgba(20, 19, 17, 0.72)" }
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="关闭装备结果"
            onPress={onDismissEquipResult}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.hatchRevealPanel,
              {
                backgroundColor: theme.colors.surface,
                borderColor: equipPresentation.replayed ? theme.colors.warning : theme.colors.primary
              }
            ]}
          >
            <MotionFeedback
              variant="decor-equip"
              trigger={equipPresentation.title}
              animateOnMount
            >
              <View style={{ alignItems: "center", marginVertical: 12 }}>
                <ArtSlot
                  slotId={(equipPresentation.equippedArtKey as ArtSlotId) ?? "tank-decor-locked-silhouette"}
                  size={96}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                <StatusBadge
                  tone={equipPresentation.replayed ? "warning" : "completed"}
                  label={equipPresentation.replayed ? "已保存" : "已装备"}
                />
              </View>
              <Text style={styles.kicker}>{equipPresentation.title}</Text>
              {equipPresentation.equippedName ? (
                <Text style={styles.sectionTitle}>{equipPresentation.equippedName}</Text>
              ) : null}
              <Text style={styles.copy}>{equipPresentation.copy}</Text>
              <View style={styles.resultReceiptBox}>
                <Text style={styles.kicker}>装备回执</Text>
                <Text style={styles.rowTitle}>
                  {equipPresentation.replayed
                    ? "这件装扮已经在这个位置上了，没有重复更换。"
                    : `已装备到 ${SLOT_LABELS[equipPresentation.equippedSlot] ?? equipPresentation.equippedSlot} 位置`}
                </Text>
              </View>
              <ActionButton label="返回鱼缸" onPress={onDismissEquipResult} />
            </MotionFeedback>
          </View>
        </View>
      ) : null}

      {presentation ? (
        <View
          style={[
            styles.hatchRevealBackdrop,
            { backgroundColor: "rgba(20, 19, 17, 0.72)" }
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="关闭孵化结果"
            onPress={onDismissHatchResult}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.hatchRevealPanel,
              {
                backgroundColor: theme.colors.surface,
                borderColor: presentation.replayed ? theme.colors.warning : theme.colors.primary
              }
            ]}
          >
            <MotionFeedback variant="fish-hatch" trigger={presentation.title} animateOnMount>
              <View style={{ alignItems: "center", marginVertical: 12 }}>
                <ArtSlot slotId="fish-hatch-reveal" size={96} />
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                <StatusBadge
                  tone={presentation.replayed ? "warning" : "completed"}
                  label={presentation.replayed ? "已保存" : "新鱼"}
                />
                {presentation.fishRarity ? (
                  <StatusBadge tone="active" label={rarityLabel(presentation.fishRarity)} />
                ) : null}
              </View>
              <Text style={styles.kicker}>{presentation.title}</Text>
              {presentation.fishName ? (
                <Text style={styles.sectionTitle}>{presentation.fishName}</Text>
              ) : null}
              {presentation.fishPersonality ? (
                <Text style={styles.accentMeta}>{presentation.fishPersonality}</Text>
              ) : null}
              <Text style={styles.copy}>{presentation.copy}</Text>
              {presentation.replayed ? null : (
                <RewardRow
                  icon="🥚"
                  label="消耗孵化进度"
                  value={`-${presentation.cost}`}
                  positive={false}
                />
              )}
              <View style={styles.resultReceiptBox}>
                <Text style={styles.kicker}>孵化回执</Text>
                <Text style={styles.rowTitle}>
                  {presentation.replayed
                    ? "这条鱼已经在你缸里了，没有额外消耗。"
                    : `消耗 ${presentation.cost} 点进度 · 剩余 ${summary.hatchAvailability?.currentProgress ?? 0}`}
                </Text>
              </View>
              <Text style={styles.helperText}>下一步：{presentation.nextHint}</Text>
              <ActionButton label="返回鱼缸" onPress={onDismissHatchResult} />
            </MotionFeedback>
          </View>
        </View>
      ) : null}
    </DashboardCard>
  );
}

export function formatCooldown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "可投喂";
  const minutes = Math.ceil(totalSeconds / 60);
  if (minutes < 60) return `${minutes} 分钟后`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} 小时 ${remainingMinutes} 分` : `${hours} 小时`;
}

export function calculateLiveCooldownSeconds(
  feedCare: FishTankSummary["careAvailability"]["feed"] | null,
  nowMs: number,
  receivedAtMs: number
): number {
  if (!feedCare || feedCare.available) return 0;

  if (feedCare.nextAvailableAt) {
    const targetMs = Date.parse(feedCare.nextAvailableAt);
    if (Number.isFinite(targetMs)) {
      return Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
    }
  }

  const elapsedSeconds = Math.floor((nowMs - receivedAtMs) / 1000);
  return Math.max(0, feedCare.cooldownRemainingSeconds - elapsedSeconds);
}
