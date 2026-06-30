import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { FramedCard } from "../../../ui/components";
import styles from "../styles";

export function DashboardCard({
  children,
  style
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <FramedCard style={[styles.dashboardCard, style]}>{children}</FramedCard>;
}
