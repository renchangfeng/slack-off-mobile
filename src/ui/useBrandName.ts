import { useTheme } from "./theme/useTheme";
import type { MobileTheme } from "./theme/types";

const FALLBACK_BRAND_NAME = "Slack Off";

export function resolveBrandName(theme: MobileTheme): string {
  return theme.brand.appName || FALLBACK_BRAND_NAME;
}

export function useBrandName(): string {
  return resolveBrandName(useTheme());
}
