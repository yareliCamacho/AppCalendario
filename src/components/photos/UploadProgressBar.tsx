import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../config/theme';

export function UploadProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
      <Text style={styles.label}>{clamped}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: spacing.sm },
  track: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primaryPink },
  label: { marginTop: 4, fontSize: 12, color: colors.textMuted, textAlign: 'right' },
});
