import { Text, View } from "react-native";
import { SectionHeader } from "../../../ui/components";
import { DashboardCard } from "./DashboardCard";
import type { CheckInFinishResult } from "../../../api/checkins";
import styles from "../styles";
import type { DerivedGameplayStep } from "../types";

export function CheckInResult({
  result,
  nextStep
}: {
  result: CheckInFinishResult;
  nextStep: DerivedGameplayStep;
}) {
  return (
    <DashboardCard>
      <SectionHeader
        kicker="本次结算"
        title={result.reward.rewarded ? "这次休息被系统正式承认" : "这次太短，精神上仍然算数"}
      />
      <Text style={styles.copy}>
        得分 +{result.reward.score} · 抽豆进度 +{result.reward.drawProgress} · 机会 +
        {result.reward.drawChancesGranted ?? 0}
      </Text>
      <Text style={styles.helperText}>下一步：{nextStep.title}</Text>
    </DashboardCard>
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
