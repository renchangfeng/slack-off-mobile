import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "./theme/useTheme";
import { useCoreSurfaceLayout } from "./useCoreSurfaceLayout";
import { spacing } from "./tokens";

export const CORE_SURFACE_MIN_TOUCH_TARGET = 44;

type PrimaryActionPanelProps = {
  children: ReactNode;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryActionPanel({ children, accentColor, style }: PrimaryActionPanelProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.primaryPanel,
        {
          backgroundColor: theme.colors.surface,
          borderColor: accentColor ?? theme.colors.border,
          borderLeftWidth: accentColor ? 6 : 1,
          borderRadius: theme.radius.md
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

type SummaryCardProps = {
  title: string;
  status?: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SummaryCard({
  title,
  status,
  actionLabel,
  onAction,
  disabled = false,
  style
}: SummaryCardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md
        },
        style
      ]}
    >
      <View style={styles.summaryText}>
        <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>{title}</Text>
        {status ? (
          <Text style={[styles.summaryStatus, { color: theme.colors.textMuted }]}>{status}</Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => void onAction?.()}
          style={({ pressed }) => [
            styles.summaryAction,
            {
              backgroundColor: theme.colors.text,
              borderRadius: theme.radius.sm
            },
            (pressed || disabled) && styles.muted
          ]}
        >
          <Text style={[styles.summaryActionText, { color: theme.colors.surface }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type DurableReceiptProps = {
  title: string;
  outcome?: string;
  nextActionLabel?: string;
  onNext?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function DurableReceipt({
  title,
  outcome,
  nextActionLabel,
  onNext,
  onDismiss,
  style
}: DurableReceiptProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.receipt,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.primary,
          borderRadius: theme.radius.md
        },
        style
      ]}
    >
      <View style={styles.receiptHeader}>
        <Text style={[styles.receiptTitle, { color: theme.colors.text }]}>{title}</Text>
        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="关闭"
            onPress={() => void onDismiss()}
            style={({ pressed }) => [styles.dismissButton, pressed && styles.muted]}
          >
            <Text style={[styles.dismissText, { color: theme.colors.textMuted }]}>关闭</Text>
          </Pressable>
        ) : null}
      </View>
      {outcome ? (
        <Text style={[styles.receiptOutcome, { color: theme.colors.textMuted }]}>{outcome}</Text>
      ) : null}
      {nextActionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nextActionLabel}
          onPress={() => void onNext?.()}
          style={({ pressed }) => [
            styles.receiptAction,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.sm
            },
            pressed && styles.muted
          ]}
        >
          <Text style={[styles.receiptActionText, { color: theme.colors.surface }]}>{nextActionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type CoreSurfaceGridProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function CoreSurfaceGrid({ children, style }: CoreSurfaceGridProps) {
  const { isWide } = useCoreSurfaceLayout();
  return (
    <View
      style={[
        styles.grid,
        {
          flexDirection: isWide ? "row" : "column"
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  primaryPanel: {
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg
  },
  summaryCard: {
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    padding: spacing.md
  },
  summaryText: {
    flexBasis: 180,
    flex: 1,
    gap: spacing.xs
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "900"
  },
  summaryStatus: {
    fontSize: 13,
    lineHeight: 18
  },
  summaryAction: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: CORE_SURFACE_MIN_TOUCH_TARGET,
    minWidth: 64,
    maxWidth: "100%",
    paddingHorizontal: spacing.md
  },
  summaryActionText: {
    fontSize: 12,
    fontWeight: "900"
  },
  receipt: {
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md
  },
  receiptHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  receiptTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900"
  },
  receiptOutcome: {
    fontSize: 14,
    lineHeight: 20
  },
  receiptAction: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  receiptActionText: {
    fontSize: 14,
    fontWeight: "900"
  },
  dismissButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: CORE_SURFACE_MIN_TOUCH_TARGET,
    minWidth: 44
  },
  dismissText: {
    fontSize: 12,
    fontWeight: "900"
  },
  muted: {
    opacity: 0.42
  },
  grid: {
    gap: spacing.md
  }
});
