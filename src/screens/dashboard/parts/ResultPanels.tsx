import { Text, View } from "react-native";
import { ArtSlot } from "../../../ui/art/ArtSlot";
import { SectionHeader } from "../../../ui/components";
import { MotionFeedback } from "../../../ui/motion/MotionFeedback";
import { DashboardCard } from "./DashboardCard";
import type { CheckInFinishResult } from "../../../api/checkins";
import styles from "../styles";
import type { DerivedGameplayStep } from "../types";
import type { TodayLoopResultDelight } from "../../../gameplay/todayLoop";
import { FishTankOutcomeReceipt } from "./fishTankOutcomeReceipt";

export function CheckInResult({
  result,
  nextStep,
  delight
}: {
  result: CheckInFinishResult;
  nextStep: DerivedGameplayStep;
  delight?: TodayLoopResultDelight | null;
}) {
  const title =
    delight?.title ??
    (result.reward.rewarded ? "这次休息被系统正式承认" : "这次太短，精神上仍然算数");
  const rewardLabel =
    delight?.rewardLabel ??
    `得分 +${result.reward.score} · 抽豆进度 +${result.reward.drawProgress} · 机会 +${result.reward.drawChancesGranted ?? 0}`;
  return (
    <MotionFeedback
      variant="check-in"
      trigger={result.session?.id ?? "none"}
      animateOnMount
    >
      <DashboardCard>
        <SectionHeader
          kicker={delight?.receiptTitle ?? "本次结算"}
          title={title}
        />
        <View style={{ alignItems: "center", marginVertical: 12 }}>
          <ArtSlot slotId="home-check-in-character" size={64} />
        </View>
        <Text style={styles.copy}>{delight?.copy ?? "休息结果已结算。"}</Text>
        <View style={styles.resultReceiptBox}>
          <Text style={styles.kicker}>奖励回执</Text>
          <Text style={styles.rowTitle}>{rewardLabel}</Text>
        </View>
        <FishTankOutcomeReceipt outcomes={result.fishTankOutcomes} testID="check-in-fish-tank-outcomes" />
        <Text style={styles.helperText}>下一步：{nextStep.title}</Text>
      </DashboardCard>
    </MotionFeedback>
  );
}

export function RewardPreview({
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
