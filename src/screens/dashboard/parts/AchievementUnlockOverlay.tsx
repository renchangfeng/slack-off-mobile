import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Modal, Pressable, Text, View } from "react-native";
import type { CosmeticInventory } from "../../../api/achievements";
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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!unlock) return;
    let active = true;
    opacity.setValue(0);
    translateY.setValue(24);
    scale.setValue(0.96);
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      if (reduceMotion) {
        opacity.setValue(1);
        translateY.setValue(0);
        scale.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 16,
          stiffness: 180,
          useNativeDriver: true
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 14,
          stiffness: 170,
          useNativeDriver: true
        })
      ]).start();
    });
    return () => {
      active = false;
    };
  }, [opacity, scale, translateY, unlock]);

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
        <Animated.View
          style={[
            styles.unlockPanel,
            { opacity, transform: [{ translateY }, { scale }] }
          ]}
        >
          <Text style={styles.unlockEyebrow}>成就解锁</Text>
          <Text style={styles.unlockMark}>ACHIEVED</Text>
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
        </Animated.View>
      </View>
    </Modal>
  );
}
