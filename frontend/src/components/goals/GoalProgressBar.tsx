import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../config/theme';
import { calculateGoalProgress } from '../../utils/goalProgress';

type Props = { saved: number; target: number; currency?: string };

export function GoalProgressBar({ saved, target, currency = 'MXN' }: Props) {
  const percent = calculateGoalProgress(saved, target);
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.meta}>
        {percent}% · {currency} {saved.toLocaleString()} / {target.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: spacing.sm },
  track: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primaryPinkDark },
  meta: { marginTop: 6, fontSize: 13, color: colors.textMuted },
});
