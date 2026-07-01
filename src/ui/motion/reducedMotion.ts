import type { MotionIntensity } from "./types";

export function reduceMotionPreferenceToIntensity(
  preference: boolean | null | undefined
): MotionIntensity {
  return preference ? "reduced" : "normal";
}
