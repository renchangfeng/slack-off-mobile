import { useEffect, useRef, type ReactNode } from "react";
import { Animated, type ViewStyle } from "react-native";
import { useReducedMotion } from "./useReducedMotion";
import type { MotionFeedbackVariant } from "./types";

type MotionConfig = {
  initial: { opacity: number; scale: number; translateY: number };
  final: { opacity: number; scale: number; translateY: number };
  duration: number;
  spring?: { damping: number; stiffness: number };
};

export const MOTION_CONFIGS: Record<MotionFeedbackVariant, MotionConfig> = {
  "check-in": {
    initial: { opacity: 0, scale: 1, translateY: 0 },
    final: { opacity: 1, scale: 1, translateY: 0 },
    duration: 220
  },
  "activity-step": {
    initial: { opacity: 0, scale: 1, translateY: 12 },
    final: { opacity: 1, scale: 1, translateY: 0 },
    duration: 240
  },
  "activity-complete": {
    initial: { opacity: 0, scale: 0.92, translateY: 18 },
    final: { opacity: 1, scale: 1, translateY: 0 },
    duration: 280,
    spring: { damping: 14, stiffness: 190 }
  },
  "bean-reveal": {
    initial: { opacity: 0, scale: 0.5, translateY: 16 },
    final: { opacity: 1, scale: 1, translateY: 0 },
    duration: 260,
    spring: { damping: 12, stiffness: 200 }
  },
  "achievement-unlock": {
    initial: { opacity: 0, scale: 0.96, translateY: 24 },
    final: { opacity: 1, scale: 1, translateY: 0 },
    duration: 260,
    spring: { damping: 16, stiffness: 180 }
  },
  "theme-switch": {
    initial: { opacity: 0, scale: 0.98, translateY: 4 },
    final: { opacity: 1, scale: 1, translateY: 0 },
    duration: 200
  },
  "fish-feed": {
    initial: { opacity: 0, scale: 0.9, translateY: 12 },
    final: { opacity: 1, scale: 1, translateY: 0 },
    duration: 260,
    spring: { damping: 14, stiffness: 190 }
  },
  "fish-hatch": {
    initial: { opacity: 0, scale: 0.72, translateY: 20 },
    final: { opacity: 1, scale: 1, translateY: 0 },
    duration: 320,
    spring: { damping: 12, stiffness: 180 }
  },
  "decor-equip": {
    initial: { opacity: 0, scale: 0.86, translateY: 12 },
    final: { opacity: 1, scale: 1, translateY: 0 },
    duration: 260,
    spring: { damping: 14, stiffness: 190 }
  }
};

type MotionFeedbackProps = {
  variant: MotionFeedbackVariant;
  trigger?: string | number | null;
  children: ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
  animateOnMount?: boolean;
};

export function MotionFeedback({
  variant,
  trigger,
  children,
  style,
  disabled = false,
  animateOnMount = false
}: MotionFeedbackProps) {
  const reducedMotion = useReducedMotion();
  const config = MOTION_CONFIGS[variant];
  const opacity = useRef(new Animated.Value(config.final.opacity)).current;
  const scale = useRef(new Animated.Value(config.final.scale)).current;
  const translateY = useRef(new Animated.Value(config.final.translateY)).current;
  const didMount = useRef(false);
  const prevTrigger = useRef<string | number | null | undefined>(undefined);

  useEffect(() => {
    const isInitialRender = !didMount.current;
    didMount.current = true;

    if (disabled || trigger === undefined) {
      prevTrigger.current = trigger;
      return;
    }

    const previousTrigger = prevTrigger.current;
    if (trigger === previousTrigger) {
      return;
    }

    const shouldAnimate =
      trigger !== null && (!isInitialRender || animateOnMount);
    prevTrigger.current = trigger;

    if (!shouldAnimate) {
      return;
    }

    if (reducedMotion) {
      opacity.setValue(config.final.opacity);
      scale.setValue(config.final.scale);
      translateY.setValue(config.final.translateY);
      return;
    }

    opacity.setValue(config.initial.opacity);
    scale.setValue(config.initial.scale);
    translateY.setValue(config.initial.translateY);

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacity, {
        toValue: config.final.opacity,
        duration: config.duration,
        useNativeDriver: true
      })
    ];

    if (config.spring) {
      animations.push(
        Animated.spring(scale, {
          toValue: config.final.scale,
          ...config.spring,
          useNativeDriver: true
        }),
        Animated.spring(translateY, {
          toValue: config.final.translateY,
          ...config.spring,
          useNativeDriver: true
        })
      );
    } else {
      animations.push(
        Animated.timing(scale, {
          toValue: config.final.scale,
          duration: config.duration,
          useNativeDriver: true
        }),
        Animated.timing(translateY, {
          toValue: config.final.translateY,
          duration: config.duration,
          useNativeDriver: true
        })
      );
    }

    Animated.parallel(animations).start();
  }, [config, disabled, opacity, reducedMotion, scale, translateY, trigger]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ scale }, { translateY }]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}
