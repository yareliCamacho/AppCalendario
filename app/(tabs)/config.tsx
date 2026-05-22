import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { themeRepository } from '../../src/repositories/ThemeRepository';
import { authService } from '../../src/services/AuthService';
import { pushService } from '../../src/services/PushService';
import { notificationService } from '../../src/services/NotificationService';
import { Button } from '../../src/components/ui/Button';
import { HeartPhoto } from '../../src/components/home/HeartPhoto';
import { colors, spacing, contentMaxWidth } from '../../src/config/theme';
import { router } from 'expo-router';

export default function ConfigScreen() {
  const { coupleId, userId, refresh } = useCoupleContext();

  const { data: couple } = useQuery({
    queryKey: ['couple', coupleId],
    enabled: Boolean(coupleId && userId),
    queryFn: () => coupleRepository.getCouple(coupleId!, userId!),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', coupleId],
    enabled: Boolean(coupleId && userId),
    queryFn: () => coupleRepository.getMembers(coupleId!, userId!),
  });

  const { data: themes = [] } = useQuery({
    queryKey: ['themes'],
    queryFn: () => themeRepository.list(),
  });

  useEffect(() => {
    if (userId) pushService.register(userId);
  }, [userId]);

  const prefs = notificationService.getPreferences();

  const logout = async () => {
    await authService.signOut();
    await refresh();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <HeartPhoto size={80} />
        <Text style={styles.tagline}>{couple?.tagline ?? 'Nosotros'}</Text>
      </View>

      <Text style={styles.section}>Miembros del espacio ({members.length}/2)</Text>
      {members.map((m) => (
        <Text key={m.id} style={styles.member}>
          · {m.role} — {m.user_id.slice(0, 8)}…
        </Text>
      ))}

      <Text style={styles.section}>Notificaciones</Text>
      {(['event', 'photo', 'wish', 'goal'] as const).map((key) => (
        <View key={key} style={styles.row}>
          <Text>{key}</Text>
          <Switch
            value={prefs[key]}
            onValueChange={(v) => notificationService.setPreferences({ [key]: v })}
          />
        </View>
      ))}

      <Text style={styles.section}>Tema visual</Text>
      <Text style={styles.themePreview}>Azul claro + rosa claro (predeterminado)</Text>
      {themes.map((t) => (
        <Text key={t.id} style={styles.themeItem}>
          {t.name}: {t.primary_blue} / {t.primary_pink}
        </Text>
      ))}

      <Text style={styles.section}>Sincronización</Text>
      <Text style={styles.sync}>Realtime activo entre ambos miembros</Text>

      <Text style={styles.section}>Privacidad y seguridad</Text>
      <Text style={styles.sync}>Datos visibles solo para la pareja vinculada (RLS)</Text>

      <Button title="Cerrar sesión" variant="ghost" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  tagline: { fontSize: 22, fontWeight: '700', color: colors.primaryPinkDark, marginTop: spacing.sm },
  section: { fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  member: { color: colors.text, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  themePreview: { color: colors.textMuted },
  themeItem: { fontSize: 13, color: colors.textMuted },
  sync: { color: colors.textMuted, marginBottom: spacing.md },
});
