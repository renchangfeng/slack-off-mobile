import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ArtSlot } from "../../../ui/art/ArtSlot";
import { SectionHeader, StatusBadge } from "../../../ui/components";
import { MotionFeedback } from "../../../ui/motion/MotionFeedback";
import { useTheme } from "../../../ui/theme/useTheme";
import { DashboardCard } from "./DashboardCard";
import { ActionButton } from "./SharedControls";
import styles from "../styles";
import type { FishTankSummary } from "../../../api/fishTank";

type FishTankCardProps = {
  loading: boolean;
  summary: FishTankSummary | null;
  error: string | null;
  resultCopy?: string | null;
  onInitialize: () => void | Promise<void>;
  onFeed: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
};

export function FishTankCard({
  loading,
  summary,
  error,
  resultCopy,
  onInitialize,
  onFeed,
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
    return (
      <DashboardCard>
        <SectionHeader kicker="个人鱼缸" title="还没有小鱼" />
        <View style={{ alignItems: "center", marginVertical: 12 }}>
          <ArtSlot slotId="fish-tank-empty" size={80} />
        </View>
        <Text style={styles.copy}>
          {summary?.moodCopy ?? "这里还空着，放一条小鱼进来，它会替你假装工作。"}
        </Text>
        <ActionButton label="放入第一条小鱼" disabled={loading} onPress={onInitialize} />
      </DashboardCard>
    );
  }

  const fish = summary.fish[0];

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
      <Text style={styles.copy}>{summary.moodCopy}</Text>
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
      {summary.fish.length > 1 ? (
        <Text style={styles.helperText}>已收集 {summary.fish.length} 条小鱼</Text>
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
