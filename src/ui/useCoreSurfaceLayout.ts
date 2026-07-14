import { useWindowDimensions } from "react-native";
import { resolveCoreSurfaceLayout, type CoreSurfaceLayout } from "./coreSurfaceLayout";

export type { CoreSurfaceLayout };
export { resolveCoreSurfaceLayout } from "./coreSurfaceLayout";

export function useCoreSurfaceLayout(): CoreSurfaceLayout {
  const { width } = useWindowDimensions();
  return resolveCoreSurfaceLayout(width);
}
