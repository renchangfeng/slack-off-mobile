import { brandVoice } from "./tokens";

const FALLBACK_BRAND_NAME = "Slack Off";

export function useBrandName(): string {
  return brandVoice.name || FALLBACK_BRAND_NAME;
}
