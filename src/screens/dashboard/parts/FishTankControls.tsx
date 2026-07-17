import { Pressable, Text, View } from "react-native";
import { ActionButton, ProgressBar } from "./SharedControls";
import { RewardRow } from "../../../ui/components";
import { useTheme } from "../../../ui/theme/useTheme";
import type { FishTankSummary } from "../../../api/fishTank";
import {
  deriveActionButtonLabel,
  deriveHatchButtonLabel,
  deriveHatchProgressLabel,
  deriveHatchUiState,
  derivePrimaryAction,
  deriveResourceBalance,
  deriveResourceGuidance,
  formatCooldownCompact
} from "./fishTankHelpers";
import { resourceIcon } from "../helpers";
import styles from "../styles";

type FishTankControlsProps = {
  summary: FishTankSummary | null;
  loading: boolean;
  bubbleLoading: boolean;
  hatchLoading: boolean;
  hatchError?: string | null;
  nowMs: number;
  cooldownReceivedAtMs: number;
  onFeed: () => void | Promise<void>;
  onBubble: () => void | Promise<void>;
  onHatch: () => void | Promise<void>;
  onCompanionship?: () => void;
  onNavigateDraw?: () => void;
  onNavigateCollection?: () => void;
  onOpenPicker: () => void;
  onOpenDecor: () => void;
};

export function FishTankControls({
  summary,
  loading,
  bubbleLoading,
  hatchLoading,
  hatchError,
  nowMs,
  cooldownReceivedAtMs,
  onFeed,
  onBubble,
  onHatch,
  onCompanionship = () => undefined,
  onNavigateDraw = () => undefined,
  onNavigateCollection = () => undefined,
  onOpenPicker,
  onOpenDecor
}: FishTankControlsProps) {
  const theme = useTheme();
  const action = derivePrimaryAction(summary);
  const balances = deriveResourceBalance(summary);
  const guidance = deriveResourceGuidance(summary);
  const hatchState = deriveHatchUiState(summary, hatchLoading);
  const hatchProgressLabel = deriveHatchProgressLabel(hatchState);
  const hatchButtonLabel = deriveHatchButtonLabel(hatchState);
  const canHatch = hatchState.kind === "ready" && !hatchLoading;
  const feedCost = summary?.costs?.feed ?? 1;
  const bubbleCost = summary?.costs?.bubble ?? 1;

  const label = deriveActionButtonLabel(action, nowMs, cooldownReceivedAtMs);
  const primaryDisabled =
    loading ||
    (action.kind === "feed" && !action.available) ||
    (action.kind === "bubble" && !action.available) ||
    (action.kind === "hatch" && !canHatch);
  const primaryLoading =
    (action.kind === "feed" && loading) || (action.kind === "bubble" && bubbleLoading);

  const handlePrimary = () => {
    if (action.kind === "feed") return onFeed();
    if (action.kind === "bubble") return onBubble();
    if (action.kind === "hatch") return onHatch();
    return onCompanionship();
  };

  const foodGuidanceAction = summary?.guidance?.foodSource === "collection" ? onNavigateCollection : onNavigateDraw;
  const bubbleGuidanceAction = summary?.guidance?.bubbleSource === "collection" ? onNavigateCollection : onNavigateDraw;

  return (
    <View style={{ marginTop: 14 }}>
      <View
        style={{
          backgroundColor: theme.colors.surfaceWarm,
          borderColor: theme.colors.border,
          borderRadius: 8,
          borderWidth: 1,
          padding: 12
        }}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.kicker}>今日照顾</Text>
          <Text style={styles.helperText}>
            {action.kind === "feed" || action.kind === "bubble"
              ? action.available
                ? "就绪"
                : "冷却中"
              : action.kind === "hatch"
                ? canHatch
                  ? "可孵化"
                  : "待攒进度"
                : "随时可点"}
          </Text>
        </View>
        <ActionButton
          label={primaryLoading ? "处理中…" : label}
          disabled={primaryDisabled}
          dark={action.kind !== "companionship"}
          onPress={handlePrimary}
        />

        <View style={{ marginTop: 12, gap: 8 }}>
          <View style={styles.rowBetween}>
            <RewardRow
              icon={resourceIcon("food")}
              label="鱼食"
              value={`${balances.food}`}
            />
            {action.kind === "feed" && !action.available ? (
              <Text style={styles.cooldownMark}>
                {formatCooldownCompact(
                  Math.max(0, action.cooldownSeconds - Math.floor((nowMs - cooldownReceivedAtMs) / 1000))
                )}
              </Text>
            ) : balances.food < feedCost ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={guidance.foodSourceLabel}
                onPress={foodGuidanceAction}
              >
                <Text style={styles.accentMeta}>{guidance.foodSourceLabel}</Text>
              </Pressable>
            ) : (
              <Text style={styles.helperText}>可投喂</Text>
            )}
          </View>
          <View style={styles.rowBetween}>
            <RewardRow
              icon={resourceIcon("bubble")}
              label="气泡"
              value={`${balances.bubble}`}
            />
            {action.kind === "bubble" && !action.available ? (
              <Text style={styles.cooldownMark}>
                {formatCooldownCompact(
                  Math.max(0, action.cooldownSeconds - Math.floor((nowMs - cooldownReceivedAtMs) / 1000))
                )}
              </Text>
            ) : balances.bubble < bubbleCost ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={guidance.bubbleSourceLabel}
                onPress={bubbleGuidanceAction}
              >
                <Text style={styles.accentMeta}>{guidance.bubbleSourceLabel}</Text>
              </Pressable>
            ) : (
              <Text style={styles.helperText}>可吹泡</Text>
            )}
          </View>
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.kicker}>孵化进度</Text>
          <Text style={styles.helperText}>{hatchProgressLabel}</Text>
        </View>
        <ProgressBar
          value={
            hatchState.kind === "insufficient" || hatchState.kind === "ready"
              ? hatchState.current
              : hatchState.kind === "complete"
                ? summary?.collection?.total ?? 0
                : 0
          }
          max={
            hatchState.kind === "insufficient" || hatchState.kind === "ready"
              ? hatchState.cost
              : Math.max(1, summary?.collection?.total ?? 1)
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
        {hatchState.kind === "insufficient" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="去抽豆攒孵化进度"
            onPress={onNavigateDraw}
            style={{ alignSelf: "flex-start", marginTop: 6 }}
          >
            <Text style={styles.accentMeta}>去抽豆攒孵化进度</Text>
          </Pressable>
        ) : null}
        {hatchError ? <Text style={styles.message}>{hatchError}</Text> : null}
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <View style={{ flex: 1 }}>
          <ActionButton label="管理展示鱼" onPress={onOpenPicker} />
        </View>
        <View style={{ flex: 1 }}>
          <ActionButton label="装扮鱼缸" onPress={onOpenDecor} />
        </View>
      </View>
    </View>
  );
}
