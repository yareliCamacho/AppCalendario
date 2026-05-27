import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, glass, spacing } from '../../config/theme';

type Props = {
  icon: string;
  label: string;
  children: ReactNode;
  hint?: string;
};

export function FormFieldRow({ icon, label, children, hint }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        {children}
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    ...glass.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  body: { flex: 1, minWidth: 0 },
  label: { fontWeight: '700', color: colors.text, marginBottom: spacing.xs, fontSize: 14 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
});
