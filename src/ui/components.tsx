import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { getPixelBorderStyle } from "./borders";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography
} from "./tokens";
import { useTheme } from "./theme/useTheme";

type SurfaceProps = {
  children: ReactNode;
  accentColor?: string;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Surface({ children, accentColor, dark = false, style }: SurfaceProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          borderWidth: theme.borders.cardWidth
        },
        dark && { backgroundColor: theme.colors.text, borderColor: theme.colors.text },
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
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: dark ? theme.colors.text : theme.colors.primary,
          borderRadius: theme.radius.md
        },
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
  const theme = useTheme();
  return (
    <View
      style={[
        styles.pill,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md
        },
        selected && {
          backgroundColor: accentColor,
          borderColor: accentColor
        }
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: selected ? colors.white : theme.colors.textMuted }
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

type ProgressMeterProps = {
  label: string;
  value: number;
  total: number;
};

export function ProgressMeter({ label, value, total }: ProgressMeterProps) {
  const theme = useTheme();
  const ratio = total <= 0 ? 0 : Math.max(0, Math.min(1, value / total));
  return (
    <View style={styles.progressBlock}>
      <View style={styles.rowBetween}>
        <Text style={[styles.kicker, { color: theme.colors.textMuted }]}>{label}</Text>
        <Text style={[styles.progressValue, { color: theme.colors.primary }]}>
          {value}/{total}
        </Text>
      </View>
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.border, borderRadius: theme.radius.sm }
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.sm,
              width: `${ratio * 100}%`
            }
          ]}
        />
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
  const theme = useTheme();
  const accentColor = tone
    ? theme.gameplay.activityAccents[tone] ?? theme.colors.primary
    : theme.colors.primary;
  return (
    <Surface accentColor={accentColor} style={{ backgroundColor: theme.colors.surfaceWarm, gap: spacing.sm }}>
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
  title,
  copy
}: BrandManifestoCardProps) {
  const theme = useTheme();
  const resolvedTitle = title ?? theme.brand.manifestoTitle ?? theme.brand.appName;
  const resolvedCopy = copy ?? theme.brand.manifestoCopy ?? theme.brand.tagline;

  return (
    <View style={styles.manifestoCard}>
      <View style={styles.manifestoGrid}>
        <View style={[styles.signalBlock, styles.signalBlockAcid]} />
        <View style={[styles.signalBlock, styles.signalBlockCoral]} />
        <View style={[styles.signalBlock, styles.signalBlockCyan]} />
      </View>
      <Text style={styles.manifestoKicker}>WORKPLACE UNDERGROUND RADIO</Text>
      <Text style={styles.manifestoTitle}>{resolvedTitle}</Text>
      {resolvedCopy ? <Text style={styles.manifestoCopy}>{resolvedCopy}</Text> : null}
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
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "900"
  },
  framedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg
  },
  iconTile: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 2,
    justifyContent: "center"
  },
  rewardRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  rewardIcon: {
    fontSize: 16
  },
  rewardLabel: {
    color: colors.inkMuted,
    flex: 1,
    fontSize: 14
  },
  rewardValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  rewardValuePositive: {
    color: colors.primary
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 200,
    padding: spacing.lg
  },
  emptyStateIcon: {
    fontSize: 28,
    marginBottom: spacing.sm
  },
  emptyStateTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  emptyStateBody: {
    color: colors.inkMuted,
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: "center"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionHeaderText: {
    flex: 1
  },
  sectionHeaderKicker: {
    color: colors.primary,
    marginBottom: spacing.xs,
    ...typography.kicker
  },
  sectionHeaderTitle: {
    color: colors.ink,
    ...typography.title
  },
  sectionHeaderTrailing: {
    marginLeft: spacing.md
  },
  pixelArt: {
    borderWidth: 1
  },
  pixelArtBean: {
    backgroundColor: colors.acid,
    borderColor: colors.ink
  },
  pixelArtBadge: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderColor: colors.ink,
    borderRadius: radius.md,
    borderWidth: 2,
    justifyContent: "center",
    overflow: "hidden"
  },
  pixelArtBadgeCrossH: {
    backgroundColor: colors.ink,
    height: 2,
    width: "70%"
  },
  pixelArtBadgeCrossV: {
    backgroundColor: colors.ink,
    height: "70%",
    position: "absolute",
    width: 2
  },
  pixelArtActivity: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm
  },
  pixelArtActivityBar: {
    backgroundColor: colors.ink,
    borderRadius: 1,
    height: 4,
    marginBottom: 4,
    width: "100%"
  },
  pixelArtActivityBarShort: {
    width: "60%"
  },
  pixelArtCharacter: {
    alignItems: "center",
    backgroundColor: colors.surfaceSignal,
    borderColor: colors.ink,
    borderRadius: radius.md,
    borderWidth: 2,
    justifyContent: "center"
  },
  pixelArtCharacterHead: {
    backgroundColor: colors.ink
  },
  pixelArtFish: {
    alignItems: "center",
    backgroundColor: colors.surfaceSignal,
    borderColor: colors.ink,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacing.xs
  },
  pixelArtFishBody: {
    backgroundColor: colors.primary
  },
  pixelArtFishTail: {
    borderBottomColor: "transparent",
    borderLeftColor: colors.primary,
    borderTopColor: "transparent",
    height: 0,
    marginLeft: -2,
    width: 0
  }
});

type StatusBadgeTone = "active" | "completed" | "locked" | "warning" | "default";

const statusBadgePalette: Record<StatusBadgeTone, { bg: string; fg: string; border: string }> = {
  active: { bg: colors.acid, fg: colors.inkBlue, border: colors.ink },
  completed: { bg: colors.primarySoft, fg: colors.primaryDeep, border: colors.primary },
  locked: { bg: colors.surfaceMuted, fg: colors.inkMuted, border: colors.border },
  warning: { bg: colors.warningSoft, fg: colors.warning, border: colors.warning },
  default: { bg: colors.surface, fg: colors.inkMuted, border: colors.border }
};

type StatusBadgeProps = {
  tone: StatusBadgeTone;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatusBadge({ tone, label, style }: StatusBadgeProps) {
  const theme = useTheme();
  const palette = theme.status[tone];
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style
      ]}
    >
      {label ? <Text style={[styles.statusBadgeText, { color: palette.fg }]}>{label}</Text> : null}
    </View>
  );
}

type FramedCardProps = {
  children: ReactNode;
  accent?: string;
  pixelBorder?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function FramedCard({ children, accent, pixelBorder, style }: FramedCardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.framedCard,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg
        },
        pixelBorder && getPixelBorderStyle(2, accent ?? theme.colors.border),
        style
      ]}
    >
      {children}
    </View>
  );
}

type IconTileProps = {
  children: ReactNode;
  size?: number;
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconTile({ children, size = 36, accent, style }: IconTileProps) {
  const theme = useTheme();
  const resolvedAccent = accent ?? theme.colors.accent;
  return (
    <View
      style={[
        styles.iconTile,
        {
          width: size,
          height: size,
          borderColor: resolvedAccent,
          borderRadius: size / 2
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

type RewardRowProps = {
  label: string;
  value: string;
  icon?: string;
  positive?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function RewardRow({ label, value, icon, positive, style }: RewardRowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.rewardRow, style]}>
      {icon ? <Text style={styles.rewardIcon}>{icon}</Text> : null}
      <Text style={[styles.rewardLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text
        style={[
          styles.rewardValue,
          { color: positive ? theme.colors.success : theme.colors.text }
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

type EmptyStateProps = {
  title: string;
  body?: string;
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ title, body, icon, style }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.emptyState,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg
        },
        style
      ]}
    >
      {icon ? <Text style={styles.emptyStateIcon}>{icon}</Text> : null}
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>{title}</Text>
      {body ? (
        <Text style={[styles.emptyStateBody, { color: theme.colors.textMuted }]}>{body}</Text>
      ) : null}
    </View>
  );
}

type SectionHeaderProps = {
  title: string;
  kicker?: string;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ title, kicker, trailing, style }: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionHeaderText}>
        {kicker ? (
          <Text style={[styles.sectionHeaderKicker, { color: theme.colors.primary }]}>{kicker}</Text>
        ) : null}
        <Text style={[styles.sectionHeaderTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {trailing ? <View style={styles.sectionHeaderTrailing}>{trailing}</View> : null}
    </View>
  );
}

type PixelArtKind = "bean" | "badge" | "activity" | "character" | "fish";

type PixelArtPlaceholderProps = {
  kind: PixelArtKind;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function PixelArtPlaceholder({ kind, size = 64, style }: PixelArtPlaceholderProps) {
  if (kind === "bean") {
    return (
      <View
        style={[
          styles.pixelArt,
          styles.pixelArtBean,
          { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
      />
    );
  }
  if (kind === "badge") {
    return (
      <View
        style={[
          styles.pixelArt,
          styles.pixelArtBadge,
          { width: size, height: size },
          style
        ]}
      >
        <View style={styles.pixelArtBadgeCrossH} />
        <View style={styles.pixelArtBadgeCrossV} />
      </View>
    );
  }
  if (kind === "activity") {
    return (
      <View
        style={[
          styles.pixelArt,
          styles.pixelArtActivity,
          { width: size, height: Math.round(size * 0.66) },
          style
        ]}
      >
        <View style={styles.pixelArtActivityBar} />
        <View style={styles.pixelArtActivityBar} />
        <View style={[styles.pixelArtActivityBar, styles.pixelArtActivityBarShort]} />
      </View>
    );
  }
  if (kind === "fish") {
    return (
      <View
        style={[
          styles.pixelArt,
          styles.pixelArtFish,
          { width: size, height: Math.round(size * 0.6) },
          style
        ]}
      >
        <View
          style={[
            styles.pixelArtFishBody,
            {
              width: Math.round(size * 0.66),
              height: Math.round(size * 0.4),
              borderRadius: Math.round(size * 0.2)
            }
          ]}
        />
        <View
          style={[
            styles.pixelArtFishTail,
            {
              borderLeftWidth: Math.round(size * 0.22),
              borderTopWidth: Math.round(size * 0.14),
              borderBottomWidth: Math.round(size * 0.14)
            }
          ]}
        />
      </View>
    );
  }
  return (
    <View
      style={[
        styles.pixelArt,
        styles.pixelArtCharacter,
        { width: size, height: size },
        style
      ]}
    >
      <View
        style={[
          styles.pixelArtCharacterHead,
          {
            width: Math.round(size * 0.5),
            height: Math.round(size * 0.5),
            borderRadius: Math.round(size * 0.25)
          }
        ]}
      />
    </View>
  );
}
