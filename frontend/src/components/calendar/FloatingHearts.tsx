import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../config/theme';

const HEART_COUNT = 18;
const TAB_BAR_HEIGHT = 72;

type Particle = {
  left: number;
  delay: number;
  size: number;
  duration: number;
  anim: Animated.Value;
};

type Props = {
  active: boolean;
};

export function FloatingHearts({ active }: Props) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const floatZoneHeight = useMemo(
    () =>
      windowHeight -
      insets.top -
      TAB_BAR_HEIGHT -
      insets.bottom,
    [windowHeight, insets.top, insets.bottom],
  );

  const particles = useRef<Particle[]>(
    Array.from({ length: HEART_COUNT }, (_, i) => ({
      left: 4 + ((i * 53 + 11) % 92),
      delay: (i * 140) % 2000,
      size: 14 + (i % 4) * 4,
      duration: 3200 + (i % 6) * 400,
      anim: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    if (!active) {
      particles.forEach((p) => p.anim.setValue(0));
      return;
    }

    const loops = particles.map((p) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.anim, {
            toValue: 1,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, particles]);

  if (!active) return null;

  const riseDistance = Math.max(floatZoneHeight * 0.92, 280);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.layer,
        {
          top: insets.top,
          bottom: TAB_BAR_HEIGHT + insets.bottom,
          width: windowWidth,
          height: floatZoneHeight,
        },
      ]}
    >
      {particles.map((p, i) => {
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [40, -riseDistance],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.08, 0.5, 0.92, 1],
          outputRange: [0, 0.75, 0.55, 0.25, 0],
        });
        const scale = p.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.6, 1, 0.85],
        });
        return (
          <Animated.Text
            key={i}
            style={[
              styles.heart,
              {
                left: `${p.left}%`,
                fontSize: p.size,
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          >
            ♥
          </Animated.Text>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  heart: {
    position: 'absolute',
    bottom: 0,
    color: colors.primaryPinkDark,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
