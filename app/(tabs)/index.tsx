import { useQuery } from '@tanstack/react-query';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { homeService } from '../../src/services/HomeService';
import { HeartPhoto } from '../../src/components/home/HeartPhoto';
import { colors, spacing, contentMaxWidth, typography } from '../../src/config/theme';

export default function HomeScreen() {
  const { coupleId, userId } = useCoupleContext();

  const { data, isLoading } = useQuery({
    queryKey: ['home', coupleId],
    enabled: Boolean(coupleId && userId),
    queryFn: () => homeService.getDashboard(coupleId!, userId!),
  });

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Cargando tu espacio...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.bell} onPress={() => router.push('/notifications')}>
        <Text style={styles.bellIcon}>🔔</Text>
      </Pressable>

      <Text style={styles.message}>{data.homeMessage}</Text>
      <View style={styles.heartRow}>
        <HeartPhoto size={100} />
      </View>

      <Card title="Días juntos (pequeño)" value={String(data.daysTogether)} />
      {data.upcomingEvent ? (
        <Card title="Próxima fecha especial" value={`${data.upcomingEvent.title} · ${data.upcomingEvent.event_date}`} />
      ) : null}
      {data.upcomingEvent ? (
        <Card title="Cuenta regresiva" value={`Faltan días para ${data.upcomingEvent.title}`} />
      ) : null}

      {data.recentEvent ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recuerdo reciente</Text>
          <Text style={styles.romantic}>{data.recentEvent.romantic_note ?? 'Un momento especial'}</Text>
          <Text style={styles.meta}>{data.locationsCount} lugares · fotos del día</Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <MiniStat label="Metas" value={data.goalsCount} />
        <MiniStat label="Deseos" value={data.wishesCount} />
        <MiniStat label="Lugares" value={data.locationsCount} />
      </View>
    </ScrollView>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniVal}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: colors.textMuted },
  container: { padding: spacing.lg, paddingBottom: spacing.xl, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
  bell: { alignSelf: 'flex-end' },
  bellIcon: { fontSize: 24 },
  message: { ...typography.subtitle, color: colors.primaryPinkDark, textAlign: 'center', marginVertical: spacing.md },
  heartRow: { alignItems: 'center', marginBottom: spacing.lg },
  section: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  romantic: { color: colors.text, fontStyle: 'italic' },
  meta: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  card: { backgroundColor: colors.primaryBlue, borderRadius: 14, padding: spacing.md, marginBottom: spacing.sm },
  cardTitle: { fontSize: 13, color: colors.text },
  cardValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  mini: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, alignItems: 'center' },
  miniVal: { fontSize: 22, fontWeight: '700', color: colors.primaryPinkDark },
  miniLabel: { fontSize: 12, color: colors.textMuted },
});
