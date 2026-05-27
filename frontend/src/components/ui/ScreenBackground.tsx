import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../config/theme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Solo azul/rosa/lavanda; sin blancos ni casi-blancos */
const GRADIENT = [
  colors.primaryBlue,
  '#D8E8FF',
  colors.softLavender,
  '#FFD0E8',
  colors.primaryPinkLight,
  '#FFE0F0',
] as const;

/** Estilo para ScrollView/FlatList: deja ver el fondo del shell, sin parches blancos */
export const scrollOnAppBackground = {
  flex: 1,
  backgroundColor: 'transparent' as const,
  zIndex: 2,
};

/** Fondo degradado azul ↔ rosa; base sólida + animación suave */
export function ScreenBackground({ children, style }: Props) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const startX = drift.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.2] });
  const startY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] });
  const endX = drift.interpolate({ inputRange: [0, 1], outputRange: [0.95, 0.8] });
  const endY = drift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] });

  return (
    <View style={[styles.root, style]}>
      <View style={styles.baseFill} />
      <AnimatedLinearGradient
        colors={[...GRADIENT]}
        locations={[0, 0.18, 0.38, 0.58, 0.78, 1]}
        start={{ x: startX, y: startY }}
        end={{ x: endX, y: endY }}
        style={styles.gradientFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.appShellBg,
    overflow: 'hidden',
  },
  baseFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.appShellBg,
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});
