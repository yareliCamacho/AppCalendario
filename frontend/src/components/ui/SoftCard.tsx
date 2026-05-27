import { View, StyleSheet, ViewStyle } from 'react-native';
import { glass, radii, shadows, spacing } from '../../config/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};

export function SoftCard({ children, style, padded = true }: Props) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    ...shadows.card,
    ...glass.panel,
  },
  padded: {
    padding: spacing.md,
  },
});
