import { Modal, Pressable, Text, View } from "react-native";
import type { CosmeticInventory } from "../../../api/achievements";
import { ArtSlot } from "../../../ui/art/ArtSlot";
import { MotionFeedback } from "../../../ui/motion/MotionFeedback";
import { ActionButton } from "./SharedControls";
import styles from "../styles";
import type { AchievementUnlockFeedback } from "../types";

export function AchievementUnlockOverlay({
  unlock,
  cosmeticInventory,
  remaining,
  loading,
  onEquip,
  onDismiss
}: {
  unlock: AchievementUnlockFeedback | null;
  cosmeticInventory: CosmeticInventory | null;
  remaining: number;
  loading: boolean;
  onEquip: (id: string) => Promise<void>;
  onDismiss: () => void;
}) {
  if (!unlock) return null;
  const unlockedCosmetic = unlock.rewards.cosmetic
    ? cosmeticInventory?.cosmetics.find(
        (cosmetic) =>
          cosmetic.name === unlock.rewards.cosmetic &&
          (cosmetic.owned ?? Boolean(cosmetic.unlockedAt))
      )
    : null;

  return (
    <Modal transparent animationType="none" visible onRequestClose={onDismiss}>
      <View style={styles.unlockBackdrop}>
        <MotionFeedback
          variant="achievement-unlock"
          trigger={unlock.id}
          animateOnMount
        >
          <View style={styles.unlockPanel}>
            <Text style={styles.unlockEyebrow}>成就解锁</Text>
            <Text style={styles.unlockMark}>ACHIEVED</Text>
            <View style={{ alignItems: "center", marginVertical: 12 }}>
              <ArtSlot slotId="achievement-badge" size={64} />
            </View>
            <Text style={styles.unlockTitle}>{unlock.name}</Text>
            <View style={styles.unlockRule} />
            <Text style={styles.unlockRewardTitle}>本次奖励</Text>
            <Text style={styles.unlockRewardCopy}>
              +{unlock.rewards.score} 分 · 抽豆进度 +{unlock.rewards.drawProgress} · 机会 +
              {unlock.rewards.drawChances}
            </Text>
            {unlock.rewards.cosmetic ? (
              <View style={styles.cosmeticReveal}>
                <Text style={styles.kicker}>新装扮</Text>
                <Text style={styles.rowTitle}>{unlock.rewards.cosmetic}</Text>
                {unlockedCosmetic && !unlockedCosmetic.equipped ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={loading}
                    onPress={() => void onEquip(unlockedCosmetic.id)}
                    style={styles.inlineEquipButton}
                  >
                    <Text style={styles.inlineEquipText}>立即装备</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {remaining > 0 ? (
              <Text style={styles.unlockRemaining}>还有 {remaining} 个成就等待展示</Text>
            ) : null}
            <ActionButton
              label={remaining > 0 ? "查看下一个" : "收下这份荣誉"}
              onPress={onDismiss}
            />
          </View>
        </MotionFeedback>
      </View>
    </Modal>
  );
}
