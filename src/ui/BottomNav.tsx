import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "./tokens";
import { IconTile } from "./components";
import { useTheme } from "./theme/useTheme";

export type BottomNavTab<T extends string> = {
  value: T;
  label: string;
  glyph: string;
};

type BottomNavProps<T extends string> = {
  tabs: BottomNavTab<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

export function BottomNav<T extends string>({ tabs, selected, onSelect }: BottomNavProps<T>) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md
        }
      ]}
    >
      {tabs.map((tab) => {
        const active = selected === tab.value;
        return (
          <Pressable
            key={tab.value}
            accessibilityLabel={tab.label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(tab.value)}
            style={styles.item}
          >
            <IconTile
              size={32}
              accent={active ? theme.colors.accent : theme.colors.textMuted}
              style={active ? styles.glyphActive : undefined}
            >
              <Text
                style={[
                  styles.glyph,
                  { color: active ? theme.colors.text : theme.colors.textMuted }
                ]}
              >
                {tab.glyph}
              </Text>
            </IconTile>
            <Text
              style={[
                styles.label,
                { color: active ? theme.colors.primary : theme.colors.textMuted }
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    borderTopWidth: 1,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.sm,
    maxWidth: 760,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    width: "100%"
  },
  item: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 56
  },
  glyph: {
    fontSize: 14,
    fontWeight: "900"
  },
  glyphActive: {
    transform: [{ rotate: "-2deg" }]
  },
  label: {
    ...typography.kicker,
    color: colors.inkMuted
  },
  labelActive: {
    color: colors.primary
  }
});
