import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, glass, spacing, radii, shadows } from '../../config/theme';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showFavorite?: boolean;
};

export function CalendarStackHeader({ title, subtitle, onBack, showFavorite = true }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.backBtn}
        onPress={onBack ?? (() => router.back())}
        hitSlop={12}
      >
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {showFavorite ? (
        <Pressable style={styles.heartBtn}>
          <Text style={styles.heartIcon}>♥</Text>
        </Pressable>
      ) : (
        <View style={styles.heartBtnPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    ...glass.surface,
  },
  backIcon: { fontSize: 28, color: colors.text, fontWeight: '300', marginTop: -2 },
  center: { flex: 1, minWidth: 0 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    ...glass.surface,
  },
  heartBtnPlaceholder: { width: 40 },
  heartIcon: { fontSize: 18, color: colors.primaryPinkDark },
});
