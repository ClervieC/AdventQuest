import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const FLAKE_COUNT = 28;

interface FlakeConfig {
  x: number; // position horizontale (0..1 de la largeur)
  size: number;
  opacity: number;
  duration: number; // durée d'une chute complète
  start: number; // position de départ (0..1) : la neige est déjà là au premier affichage
  sway: number; // amplitude du balancement
  phase: number;
}

function makeFlakes(): FlakeConfig[] {
  return Array.from({ length: FLAKE_COUNT }, () => ({
    x: Math.random(),
    size: 2 + Math.random() * 4,
    opacity: 0.2 + Math.random() * 0.5,
    duration: 8000 + Math.random() * 9000,
    start: Math.random(),
    sway: 8 + Math.random() * 22,
    phase: Math.random() * Math.PI * 2,
  }));
}

function Flake({ flake, width, height }: { flake: FlakeConfig; width: number; height: number }) {
  const progress = useSharedValue(flake.start);

  useEffect(() => {
    // Termine la chute en cours, puis recommence en boucle depuis le haut
    progress.value = withSequence(
      withTiming(1, { duration: (1 - flake.start) * flake.duration, easing: Easing.linear }),
      withRepeat(
        withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: flake.duration, easing: Easing.linear })),
        -1
      )
    );
    return () => cancelAnimation(progress);
  }, [flake, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -10 + progress.value * (height + 20) },
      { translateX: Math.sin(progress.value * Math.PI * 4 + flake.phase) * flake.sway },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.flake,
        {
          left: flake.x * width,
          width: flake.size,
          height: flake.size,
          borderRadius: flake.size / 2,
          opacity: flake.opacity,
        },
        style,
      ]}
    />
  );
}

/** Neige qui tombe doucement en arrière-plan (désactivée si le téléphone demande de réduire les animations) */
export function Snowfall() {
  const reduceMotion = useReducedMotion();
  const flakes = useMemo(makeFlakes, []);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={handleLayout}>
      {size && !reduceMotion && flakes.map((flake, i) => <Flake key={i} flake={flake} width={size.width} height={size.height} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  flake: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#ffffff',
  },
});
