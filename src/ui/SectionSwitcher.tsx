import { Pressable, Text, View, StyleSheet } from "react-native";
import { useTheme } from "./theme/useTheme";

export const SECTION_SWITCHER_MIN_TOUCH_TARGET = 44;

export type SectionOption<T extends string> = {
  value: T;
  label: string;
};

type SectionSwitcherProps<T extends string> = {
  options: SectionOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export function SectionSwitcher<T extends string>({
  options,
  selected,
  onSelect,
  disabled = false,
  accessibilityLabel,
  testID
}: SectionSwitcherProps<T>) {
  const theme = useTheme();
  return (
    <View
      aria-label={accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radius.md,
          gap: 4,
          padding: 4
        }
      ]}
      testID={testID}
    >
      {options.map((option, index) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            aria-disabled={disabled}
            aria-label={option.label}
            aria-posinset={index + 1}
            aria-selected={isSelected}
            aria-setsize={options.length}
            accessibilityRole="tab"
            accessibilityState={{
              selected: isSelected,
              disabled
            }}
            accessibilityLabel={option.label}
            accessibilityHint={`第 ${index + 1} 个选项，共 ${options.length} 个`}
            disabled={disabled}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [
              styles.segment,
              {
                borderRadius: theme.radius.sm,
                minHeight: SECTION_SWITCHER_MIN_TOUCH_TARGET
              },
              isSelected && {
                backgroundColor: theme.colors.text,
                borderColor: theme.colors.text,
                borderWidth: 1
              },
              !isSelected && {
                borderColor: theme.colors.surfaceMuted,
                borderWidth: 1
              },
              (pressed || disabled) && styles.muted
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? theme.colors.surface : theme.colors.textMuted
                },
                isSelected && styles.selectedLabel
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "nowrap",
    marginBottom: 16
  },
  segment: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minWidth: 64,
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  selectedLabel: {
    fontWeight: "900"
  },
  muted: {
    opacity: 0.42
  }
});
