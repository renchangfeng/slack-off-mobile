import { Pressable, Text, View } from "react-native";
import styles from "../styles";

export function ActionButton({
  label,
  onPress,
  disabled = false,
  dark = false
}: {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  dark?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => void onPress()}
      style={({ pressed }) => [
        styles.actionButton,
        dark && styles.actionButtonDark,
        (pressed || disabled) && styles.buttonMuted
      ]}
    >
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({
  value,
  max,
  color,
  trackColor = "#514d48"
}: {
  value: number;
  max: number;
  color: string;
  trackColor?: string;
}) {
  const percent = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View style={[styles.progressFill, { backgroundColor: color, width: `${percent}%` }]} />
    </View>
  );
}

export function CategoryChip({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
    >
      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}
