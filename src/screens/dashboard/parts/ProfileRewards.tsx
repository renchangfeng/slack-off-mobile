import { Pressable, Text, View } from "react-native";
import type { OwnedCosmetic } from "../../../api/achievements";
import { rarityLabel } from "../helpers";
import styles from "../styles";

export function LifetimeStats({ progression }: { progression: import("../../../api/progression").ProgressionSummary | null }) {
  const stats = [
    ["打卡", progression?.lifetime.totalSessions ?? 0],
    ["休息分钟", progression?.lifetime.eligibleRestMinutes ?? 0],
    ["活动", progression?.lifetime.completedActivities ?? 0],
    ["豆种", progression?.lifetime.collectedBeanTypes ?? 0]
  ];
  return (
    <View style={styles.statGrid}>
      {stats.map(([label, value]) => (
        <View key={label as string} style={styles.statCell}>
          <Text style={styles.statValue}>{value as number}</Text>
          <Text style={styles.statLabel}>{label as string}</Text>
        </View>
      ))}
    </View>
  );
}

export function CosmeticRewardRow({
  cosmetic,
  loading,
  onEquip
}: {
  cosmetic: OwnedCosmetic;
  loading: boolean;
  onEquip: (id: string) => Promise<void>;
}) {
  const owned = cosmetic.owned ?? Boolean(cosmetic.unlockedAt);
  const canEquip = owned && !cosmetic.equipped;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading || !canEquip}
      onPress={() => void onEquip(cosmetic.id)}
      style={[
        styles.cosmeticRow,
        cosmetic.equipped && styles.listRowCompleted,
        !owned && styles.cosmeticRowLocked
      ]}
    >
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{cosmetic.name}</Text>
        <Text style={styles.rowMeta}>
          {cosmetic.cosmeticType === "badge" ? "徽章" : "称号"} · {rarityLabel(cosmetic.rarity)}
        </Text>
        <Text style={styles.smallCopy}>{cosmetic.unlockSummary ?? cosmetic.description}</Text>
      </View>
      <Text
        style={
          cosmetic.equipped
            ? styles.completedMark
            : owned
              ? styles.pendingMark
              : styles.cooldownMark
        }
      >
        {cosmetic.equipped ? "使用中" : owned ? "立即装备" : "未解锁"}
      </Text>
    </Pressable>
  );
}
