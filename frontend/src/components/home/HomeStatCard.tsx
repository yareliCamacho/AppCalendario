import { View, Text, StyleSheet } from 'react-native';
import { colors, glass, radii, shadows, spacing } from '../../config/theme';

type Accent = 'pink' | 'purple' | 'mint' | 'gold';

const accentMap: Record<Accent, { bg: string; value: string; icon: string }> = {
  pink: { bg: '#FFE8F2', value: colors.primaryPinkDark, icon: '♥' },
  purple: { bg: '#F0EBFF', value: colors.statPurple, icon: '◷' },
  mint: { bg: '#E8F8EE', value: colors.statMint, icon: '📍' },
  gold: { bg: '#FFF6E0', value: colors.statGold, icon: '★' },
};

type Props = {
  label: string;
  value: number;
  accent: Accent;
};

export function HomeStatCard({ label, value, accent }: Props) {
  const a = accentMap[accent];
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: a.bg }]}>
        <Text style={[styles.icon, { color: a.value }]}>{a.icon}</Text>
      </View>
      <Text style={[styles.value, { color: a.value }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.md,
    ...glass.panel,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    minWidth: 0,
    ...shadows.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  icon: { fontSize: 16, fontWeight: '700' },
  value: { fontSize: 22, fontWeight: '800' },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
});
