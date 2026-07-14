import { targetViewport } from "./tokens";

export type CoreSurfaceLayout = {
  isNarrow: boolean;
  isComfortable: boolean;
  isWide: boolean;
};

export function resolveCoreSurfaceLayout(
  width: number,
  thresholds: { comfortable: number; wide: number } = {
    comfortable: targetViewport.comfortableWidth,
    wide: targetViewport.maxContentWidth
  }
): CoreSurfaceLayout {
  return {
    isNarrow: width < thresholds.comfortable,
    isComfortable: width >= thresholds.comfortable && width < thresholds.wide,
    isWide: width >= thresholds.wide
  };
}
