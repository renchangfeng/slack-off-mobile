import type { ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { FramedCard } from "../../../ui/components";
import { useTheme } from "../../../ui/theme/useTheme";

export function DashboardCard({
  children,
  style
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <FramedCard
      style={[
        {
          borderColor: theme.colors.border,
          borderWidth: theme.borders.cardWidth,
          marginBottom: theme.spacing.lg
        },
        style
      ]}
    >
      {children}
    </FramedCard>
  );
}
