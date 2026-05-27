import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { themeRepository } from '../../src/repositories/ThemeRepository';
import { authService } from '../../src/services/AuthService';
import { pushService } from '../../src/services/PushService';
import { notificationService } from '../../src/services/NotificationService';
import { Button } from '../../src/components/ui/Button';
import { HeartPhoto } from '../../src/components/home/HeartPhoto';
import { TabScreenShell, scrollOnAppBackground } from '../../src/components/ui/TabScreenShell';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { colors, spacing, contentMaxWidth, radii } from '../../src/config/theme';
import { useTabScrollInsets } from '../../src/hooks/useTabScrollInsets';
import { router } from 'expo-router';

const NOTIF_LABELS: Record<'event' | 'photo' | 'wish' | 'goal', string> = {
  event: 'Fechas especiales',
  photo: 'Fotos',
  wish: 'Deseos',
  goal: 'Metas',
};

export default function ConfigScreen() {
  const insets = useSafeAreaInsets();
  const { contentContainerStyle: tabScrollStyle } = useTabScrollInsets();
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
    if (!userId) return;
    pushService.register(userId).catch(() => null);
  }, [userId]);

  const prefs = notificationService.getPreferences();

  const logout = async () => {
    await authService.signOut();
    await refresh();
    router.replace('/(auth)/login');
  };

  return (
    <TabScreenShell>
      <ScrollView
        style={scrollOnAppBackground}
        contentContainerStyle={[
          styles.container,
          tabScrollStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Ajustes" subtitle="Tu espacio de pareja" />

        <SoftCard style={styles.profileCard}>
          <HeartPhoto size={88} />
          <Text style={styles.tagline}>{couple?.tagline ?? 'Nosotros'}</Text>
          <Text style={styles.profileSub}>
            {members.length}/2 miembros en el espacio
          </Text>
        </SoftCard>

        {members.length > 0 ? (
          <SoftCard style={styles.block}>
            <Text style={styles.sectionLabel}>Miembros</Text>
            {members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <View style={styles.memberDot} />
                <Text style={styles.member}>
                  {m.role === 'owner' ? 'Creador' : 'Pareja'} · {m.user_id.slice(0, 8)}…
                </Text>
              </View>
            ))}
          </SoftCard>
        ) : null}

        <SoftCard style={styles.block}>
          <Text style={styles.sectionLabel}>Notificaciones</Text>
          {(['event', 'photo', 'wish', 'goal'] as const).map((key) => (
            <View key={key} style={styles.row}>
              <Text style={styles.rowLabel}>{NOTIF_LABELS[key]}</Text>
              <Switch
                value={prefs[key]}
                onValueChange={(v) => notificationService.setPreferences({ [key]: v })}
                trackColor={{ false: colors.border, true: colors.primaryPinkLight }}
                thumbColor={prefs[key] ? colors.primaryPinkDark : colors.white}
              />
            </View>
          ))}
        </SoftCard>

        <SoftCard style={styles.block}>
          <Text style={styles.sectionLabel}>Tema visual</Text>
          <Text style={styles.themePreview}>Romántico claro 💕</Text>
          {themes.slice(0, 2).map((t) => (
            <View key={t.id} style={styles.themeSwatch}>
              <View style={[styles.swatch, { backgroundColor: t.primary_blue }]} />
              <View style={[styles.swatch, { backgroundColor: t.primary_pink }]} />
              <Text style={styles.themeItem}>{t.name}</Text>
            </View>
          ))}
        </SoftCard>

        <SoftCard style={styles.block}>
          <Text style={styles.sectionLabel}>Privacidad</Text>
          <Text style={styles.sync}>
            Tus datos solo son visibles para los dos miembros vinculados (RLS en Supabase).
          </Text>
          <Text style={styles.sync}>Sincronización en tiempo real entre dispositivos.</Text>
        </SoftCard>

        {!coupleId ? (
          <SoftCard style={styles.block}>
            <Text style={styles.sectionLabel}>Vinculación</Text>
            <Text style={styles.sync}>Conecta con tu pareja usando código de 6 dígitos o QR.</Text>
            <Button title="Vincular pareja ahora" onPress={() => router.push('/(auth)/pair-link')} />
          </SoftCard>
        ) : null}

        <Button title="Cerrar sesión" variant="ghost" onPress={logout} style={styles.logout} />
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryPinkDark,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  profileSub: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  block: { marginBottom: spacing.md },
  sectionLabel: { fontWeight: '700', fontSize: 15, color: colors.text, marginBottom: spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  memberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryPinkDark,
  },
  member: { color: colors.text, fontSize: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.text, fontSize: 15 },
  themePreview: { color: colors.textMuted, marginBottom: spacing.sm },
  themeSwatch: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  swatch: { width: 24, height: 24, borderRadius: radii.sm },
  themeItem: { fontSize: 13, color: colors.textMuted },
  sync: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: spacing.xs },
  logout: { marginTop: spacing.sm },
});
