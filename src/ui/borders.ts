import type { ViewStyle } from "react-native";
import { borderStyle, colors } from "./tokens";

export function getPixelBorderStyle(
  size: 1 | 2 | 3 = 2,
  color: string = colors.border
): ViewStyle {
  return {
    borderColor: color,
    borderRadius: size + borderStyle.pixelCornerSize,
    borderStyle: "solid",
    borderWidth: size
  };
}
