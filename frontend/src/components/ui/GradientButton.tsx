import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing } from '../../config/theme';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: string;
};

export function GradientButton({ title, onPress, disabled, style, icon }: Props) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.wrap, style]}>
      <LinearGradient
        colors={[colors.gradientPink, colors.gradientPurple]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.gradient, disabled && styles.disabled]}
      >
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radii.md, overflow: 'hidden' },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  icon: { fontSize: 16 },
  text: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
