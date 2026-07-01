import { View } from "react-native";
import { useTheme } from "../../../theme/useTheme";
import type { ArtAssetRenderProps } from "../../types";

type PixelProps = {
  size: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  radius?: number;
};

function Pixel({ size, x, y, w, h, color, radius }: PixelProps) {
  return (
    <View
      style={{
        position: "absolute",
        left: x * size,
        top: y * size,
        width: w * size,
        height: h * size,
        backgroundColor: color,
        borderRadius: radius ? radius * size : 0
      }}
    />
  );
}

function PixelCanvas({
  size,
  aspectRatio,
  children
}: {
  size: number;
  aspectRatio: number;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        width: size,
        height: size / aspectRatio,
        overflow: "hidden"
      }}
    >
      {children}
    </View>
  );
}

export function PixelRestHomeCharacter({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1}>
      {/* body */}
      <Pixel size={size} x={0.22} y={0.38} w={0.56} h={0.5} color={c.primary} radius={0.08} />
      {/* head */}
      <Pixel size={size} x={0.28} y={0.16} w={0.44} h={0.36} color={c.surfaceWarm} radius={0.1} />
      {/* eye (closed) */}
      <Pixel size={size} x={0.38} y={0.28} w={0.24} h={0.04} color={c.text} />
      {/* Zzz */}
      <Pixel size={size} x={0.7} y={0.1} w={0.08} h={0.06} color={c.accent} />
      <Pixel size={size} x={0.78} y={0.05} w={0.06} h={0.05} color={c.accent} />
      <Pixel size={size} x={0.84} y={0.01} w={0.04} h={0.04} color={c.accent} />
      {/* arms */}
      <Pixel size={size} x={0.08} y={0.5} w={0.16} h={0.12} color={c.primary} radius={0.04} />
      <Pixel size={size} x={0.76} y={0.5} w={0.16} h={0.12} color={c.primary} radius={0.04} />
    </PixelCanvas>
  );
}

export function PixelRestActivityIllustration({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1.25}>
      {/* desk surface */}
      <Pixel size={size} x={0.1} y={0.6} w={0.8} h={0.12} color={c.warning} radius={0.02} />
      {/* mug */}
      <Pixel size={size} x={0.2} y={0.42} w={0.18} h={0.2} color={c.surfaceMuted} radius={0.04} />
      <Pixel size={size} x={0.24} y={0.36} w={0.1} h={0.08} color={c.accent} radius={0.02} />
      {/* monitor */}
      <Pixel size={size} x={0.46} y={0.26} w={0.38} h={0.3} color={c.text} radius={0.04} />
      <Pixel size={size} x={0.5} y={0.3} w={0.3} h={0.2} color={c.surfaceWarm} radius={0.02} />
      {/* small plant */}
      <Pixel size={size} x={0.72} y={0.16} w={0.12} h={0.12} color={c.primary} radius={0.04} />
      <Pixel size={size} x={0.74} y={0.54} w={0.08} h={0.08} color={c.warning} radius={0.02} />
    </PixelCanvas>
  );
}

export function PixelRestActivityStepStar({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1}>
      <Pixel size={size} x={0.18} y={0.18} w={0.64} h={0.64} color={c.accent} radius={0.06} />
      <Pixel size={size} x={0.28} y={0.34} w={0.44} h={0.14} color={c.text} radius={0.02} />
      <Pixel size={size} x={0.42} y={0.24} w={0.16} h={0.34} color={c.text} radius={0.02} />
      <Pixel size={size} x={0.24} y={0.1} w={0.16} h={0.16} color={c.warning} radius={0.04} />
      <Pixel size={size} x={0.64} y={0.72} w={0.12} h={0.12} color={c.warning} radius={0.03} />
    </PixelCanvas>
  );
}

export function PixelRestBean({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1}>
      <Pixel size={size} x={0.22} y={0.2} w={0.56} h={0.6} color={c.primary} radius={0.18} />
      <Pixel size={size} x={0.34} y={0.28} w={0.16} h={0.12} color={c.surfaceWarm} radius={0.04} />
      <Pixel size={size} x={0.44} y={0.66} w={0.2} h={0.08} color={c.accent} radius={0.02} />
    </PixelCanvas>
  );
}

export function PixelRestBeanMachine({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1}>
      {/* machine body */}
      <Pixel size={size} x={0.16} y={0.2} w={0.68} h={0.6} color={c.text} radius={0.08} />
      {/* window */}
      <Pixel size={size} x={0.26} y={0.3} w={0.48} h={0.34} color={c.surfaceWarm} radius={0.04} />
      {/* bean inside */}
      <Pixel size={size} x={0.4} y={0.42} w={0.2} h={0.16} color={c.primary} radius={0.06} />
      {/* lever */}
      <Pixel size={size} x={0.8} y={0.3} w={0.08} h={0.4} color={c.warning} radius={0.02} />
      <Pixel size={size} x={0.84} y={0.22} w={0.12} h={0.12} color={c.accent} radius={0.04} />
      {/* slot */}
      <Pixel size={size} x={0.34} y={0.72} w={0.32} h={0.1} color={c.surfaceMuted} radius={0.02} />
    </PixelCanvas>
  );
}

export function PixelRestBeanShowcase({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1}>
      {/* pedestal */}
      <Pixel size={size} x={0.2} y={0.68} w={0.6} h={0.16} color={c.warning} radius={0.02} />
      <Pixel size={size} x={0.36} y={0.56} w={0.28} h={0.12} color={c.text} radius={0.02} />
      {/* bean */}
      <Pixel size={size} x={0.3} y={0.2} w={0.4} h={0.4} color={c.primary} radius={0.12} />
      <Pixel size={size} x={0.38} y={0.28} w={0.12} h={0.1} color={c.surfaceWarm} radius={0.02} />
    </PixelCanvas>
  );
}

export function PixelRestAchievementBadge({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1}>
      {/* ribbon top */}
      <Pixel size={size} x={0.2} y={0.05} w={0.6} h={0.18} color={c.danger} radius={0.04} />
      {/* medallion */}
      <Pixel size={size} x={0.18} y={0.2} w={0.64} h={0.5} color={c.warning} radius={0.16} />
      <Pixel size={size} x={0.3} y={0.3} w={0.4} h={0.3} color={c.surfaceWarm} radius={0.1} />
      {/* star */}
      <Pixel size={size} x={0.42} y={0.34} w={0.16} h={0.16} color={c.text} radius={0.02} />
      {/* ribbon tails */}
      <Pixel size={size} x={0.32} y={0.66} w={0.14} h={0.22} color={c.danger} radius={0.02} />
      <Pixel size={size} x={0.54} y={0.66} w={0.14} h={0.22} color={c.danger} radius={0.02} />
    </PixelCanvas>
  );
}

export function PixelRestEmptyStateActivities({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1}>
      {/* bucket */}
      <Pixel size={size} x={0.26} y={0.3} w={0.48} h={0.5} color={c.warning} radius={0.06} />
      <Pixel size={size} x={0.36} y={0.18} w={0.28} h={0.14} color={c.text} radius={0.02} />
      {/* handle */}
      <Pixel size={size} x={0.44} y={0.1} w={0.12} h={0.1} color={c.text} radius={0.02} />
      {/* spark */}
      <Pixel size={size} x={0.7} y={0.2} w={0.1} h={0.1} color={c.accent} radius={0.02} />
    </PixelCanvas>
  );
}

export function PixelRestEmptyStateBeans({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1}>
      {/* jar body */}
      <Pixel size={size} x={0.24} y={0.28} w={0.52} h={0.56} color={c.surfaceMuted} radius={0.08} />
      {/* lid */}
      <Pixel size={size} x={0.3} y={0.18} w={0.4} h={0.12} color={c.warning} radius={0.04} />
      {/* beans inside */}
      <Pixel size={size} x={0.34} y={0.4} w={0.14} h={0.12} color={c.primary} radius={0.04} />
      <Pixel size={size} x={0.52} y={0.5} w={0.14} h={0.12} color={c.primary} radius={0.04} />
      <Pixel size={size} x={0.42} y={0.62} w={0.14} h={0.12} color={c.accent} radius={0.04} />
    </PixelCanvas>
  );
}

export function PixelRestEmptyStateProfile({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1}>
      {/* mirror frame */}
      <Pixel size={size} x={0.18} y={0.14} w={0.64} h={0.72} color={c.warning} radius={0.08} />
      <Pixel size={size} x={0.26} y={0.22} w={0.48} h={0.56} color={c.surfaceWarm} radius={0.06} />
      {/* sparkle */}
      <Pixel size={size} x={0.42} y={0.36} w={0.16} h={0.16} color={c.accent} radius={0.02} />
      <Pixel size={size} x={0.36} y={0.42} w={0.28} h={0.04} color={c.accent} radius={0.01} />
      <Pixel size={size} x={0.48} y={0.3} w={0.04} h={0.28} color={c.accent} radius={0.01} />
    </PixelCanvas>
  );
}

export function PixelRestEmptyStateGeneric({ size }: ArtAssetRenderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PixelCanvas size={size} aspectRatio={1}>
      {/* cloud */}
      <Pixel size={size} x={0.2} y={0.4} w={0.6} h={0.3} color={c.surfaceMuted} radius={0.12} />
      <Pixel size={size} x={0.3} y={0.3} w={0.24} h={0.22} color={c.surfaceMuted} radius={0.1} />
      <Pixel size={size} x={0.54} y={0.32} w={0.2} h={0.2} color={c.surfaceMuted} radius={0.08} />
      {/* small drifting bits */}
      <Pixel size={size} x={0.16} y={0.28} w={0.08} h={0.06} color={c.accent} radius={0.02} />
      <Pixel size={size} x={0.78} y={0.5} w={0.06} h={0.06} color={c.warning} radius={0.02} />
    </PixelCanvas>
  );
}
