import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";
import {
  activityAccentForTone,
  brandVoice,
  colors,
  radius,
  shadows,
  spacing,
  typography
} from "./tokens";

type SurfaceProps = {
  children: ReactNode;
  accentColor?: string;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Surface({ children, accentColor, dark = false, style }: SurfaceProps) {
  return (
    <View
      style={[
        styles.surface,
        dark && styles.surfaceDark,
        accentColor ? { borderColor: accentColor, borderLeftWidth: 6 } : null,
        style
      ]}
    >
      {children}
    </View>
  );
}

type PrimaryButtonProps = {
  label: string;
  disabled?: boolean;
  dark?: boolean;
  onPress?: () => void;
};

export function PrimaryButton({ label, disabled, dark, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        dark && styles.buttonDark,
        (pressed || disabled) && styles.buttonMuted
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

type PillProps = {
  label: string;
  selected?: boolean;
  accentColor?: string;
};

export function Pill({ label, selected, accentColor = colors.ink }: PillProps) {
  return (
    <View
      style={[
        styles.pill,
        selected && {
          backgroundColor: accentColor,
          borderColor: accentColor
        }
      ]}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </View>
  );
}

type ProgressMeterProps = {
  label: string;
  value: number;
  total: number;
};

export function ProgressMeter({ label, value, total }: ProgressMeterProps) {
  const ratio = total <= 0 ? 0 : Math.max(0, Math.min(1, value / total));
  return (
    <View style={styles.progressBlock}>
      <View style={styles.rowBetween}>
        <Text style={styles.kicker}>{label}</Text>
        <Text style={styles.progressValue}>
          {value}/{total}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

type ActivityPreviewCardProps = {
  badge: string;
  headline: string;
  scene: string;
  prompt: string;
  statLabel: string;
  statValue: string;
  tone?: string;
};

export function ActivityPreviewCard({
  badge,
  headline,
  scene,
  prompt,
  statLabel,
  statValue,
  tone
}: ActivityPreviewCardProps) {
  const accentColor = activityAccentForTone(tone);
  return (
    <Surface accentColor={accentColor} style={styles.activityCard}>
      <View style={styles.activityTopRow}>
        <Pill label={badge} selected accentColor={accentColor} />
        <Text style={styles.statText}>
          {statLabel} {statValue}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{headline}</Text>
      <Text style={styles.copy}>{scene}</Text>
      <View style={styles.promptBox}>
        <Text style={styles.promptText}>{prompt}</Text>
      </View>
    </Surface>
  );
}

type BrandManifestoCardProps = {
  title?: string;
  copy?: string;
};

export function BrandManifestoCard({
  title = brandVoice.concept,
  copy = brandVoice.mantra
}: BrandManifestoCardProps) {
  return (
    <View style={styles.manifestoCard}>
      <View style={styles.manifestoGrid}>
        <View style={[styles.signalBlock, styles.signalBlockAcid]} />
        <View style={[styles.signalBlock, styles.signalBlockCoral]} />
        <View style={[styles.signalBlock, styles.signalBlockCyan]} />
      </View>
      <Text style={styles.manifestoKicker}>WORKPLACE UNDERGROUND RADIO</Text>
      <Text style={styles.manifestoTitle}>{title}</Text>
      <Text style={styles.manifestoCopy}>{copy}</Text>
      <View style={styles.receiptRow}>
        <Text style={styles.receiptText}>REST PERMIT</Text>
        <Text style={styles.receiptText}>VALID TODAY</Text>
      </View>
    </View>
  );
}

type SignalTileProps = {
  label: string;
  value: string;
  accentColor?: string;
  tilted?: boolean;
};

export function SignalTile({
  label,
  value,
  accentColor = colors.acid,
  tilted
}: SignalTileProps) {
  return (
    <View
      style={[
        styles.signalTile,
        { borderColor: accentColor },
        tilted && styles.signalTileTilted
      ]}
    >
      <Text style={styles.signalTileValue}>{value}</Text>
      <Text style={styles.signalTileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.none
  },
  surfaceDark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg
  },
  buttonDark: {
    backgroundColor: colors.ink
  },
  buttonMuted: {
    opacity: 0.42
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  pill: {
    alignSelf: "flex-start",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  pillText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "900"
  },
  pillTextSelected: {
    color: colors.white
  },
  progressBlock: {
    gap: spacing.sm
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    height: 10,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: "100%"
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  kicker: {
    color: colors.inkSoft,
    ...typography.kicker
  },
  progressValue: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900"
  },
  activityCard: {
    backgroundColor: colors.surfaceWarm,
    gap: spacing.sm
  },
  activityTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  statText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 18,
    paddingTop: 6
  },
  cardTitle: {
    color: colors.ink,
    lineHeight: 27,
    ...typography.title
  },
  copy: {
    color: colors.inkMuted,
    ...typography.body
  },
  promptBox: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md
  },
  promptText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21
  },
  manifestoCard: {
    backgroundColor: colors.inkBlue,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    padding: spacing.lg
  },
  manifestoGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  signalBlock: {
    borderRadius: radius.sm,
    height: 26,
    width: 54
  },
  signalBlockAcid: {
    backgroundColor: colors.acid,
    transform: [{ rotate: "-3deg" }]
  },
  signalBlockCoral: {
    backgroundColor: colors.coral,
    transform: [{ rotate: "2deg" }]
  },
  signalBlockCyan: {
    backgroundColor: colors.cyan,
    transform: [{ rotate: "-1deg" }]
  },
  manifestoKicker: {
    color: colors.lilac,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0
  },
  manifestoTitle: {
    color: colors.white,
    marginTop: spacing.sm,
    ...typography.hero
  },
  manifestoCopy: {
    color: "#d9dfde",
    marginTop: spacing.md,
    ...typography.body
  },
  receiptRow: {
    borderColor: "#39464d",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  receiptText: {
    color: colors.acid,
    fontSize: 11,
    fontWeight: "900"
  },
  signalTile: {
    backgroundColor: colors.surface,
    borderLeftWidth: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 128,
    padding: spacing.md
  },
  signalTileTilted: {
    transform: [{ rotate: "-1deg" }]
  },
  signalTileValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900"
  },
  signalTileLabel: {
    color: colors.inkSoft,
    fontSize: 12,
    fontWeight: "900",
    marginTop: spacing.xs
  }
});
