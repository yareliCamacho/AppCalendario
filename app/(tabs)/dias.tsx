import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { milestoneRepository } from '../../src/repositories/MilestoneRepository';
import { eventRepository } from '../../src/repositories/EventRepository';
import { calculateDaysTogether } from '../../src/utils/daysTogether';
import { HeartPhoto } from '../../src/components/home/HeartPhoto';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing, contentMaxWidth, typography } from '../../src/config/theme';
import type { Milestone } from '../../src/types/database';

const MILESTONE_TYPES: Milestone['type'][] = [
  'first_meeting',
  'first_date',
  'first_trip',
  'last_trip',
];

const MILESTONE_LABELS: Record<Milestone['type'], string> = {
  first_meeting: 'Primer encuentro',
  first_date: 'Primera cita',
  first_trip: 'Primer viaje',
  last_trip: 'Último viaje',
};

export default function DiasScreen() {
  const { coupleId, userId } = useCoupleContext();
  const qc = useQueryClient();

  const { data: couple } = useQuery({
    queryKey: ['couple', coupleId],
    enabled: Boolean(coupleId && userId),
    queryFn: () => coupleRepository.getCouple(coupleId!, userId!),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', coupleId],
    enabled: Boolean(coupleId && userId),
    queryFn: () => milestoneRepository.list(coupleId!, userId!),
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcoming', coupleId],
    enabled: Boolean(coupleId && userId),
    queryFn: async () => {
      const now = new Date();
      const events = await eventRepository.listByMonth(
        coupleId!,
        userId!,
        now.getFullYear(),
        now.getMonth() + 1,
      );
      return events
        .filter((e) => e.event_date >= now.toISOString().slice(0, 10))
        .sort((a, b) => a.event_date.localeCompare(b.event_date))[0];
    },
  });

  const days = calculateDaysTogether(couple?.relationship_start_date ?? null);
  const byType = Object.fromEntries(milestones.map((m) => [m.type, m]));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.big}>{days}</Text>
      <Text style={styles.label}>
        días juntos <Text style={styles.heart}>♥</Text>
      </Text>
      {upcoming ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Próximo evento</Text>
          <Text>
            {upcoming.title} — {upcoming.event_date}
          </Text>
        </View>
      ) : null}

      <Text style={styles.section}>Hitos</Text>
      {MILESTONE_TYPES.map((type) => {
        const m = byType[type];
        return (
          <Pressable
            key={type}
            style={styles.milestone}
            onPress={() => router.push({ pathname: '/milestones/edit', params: { type } })}
          >
            <HeartPhoto size={56} />
            <View style={styles.milestoneText}>
              <Text style={styles.mTitle}>{m?.title ?? MILESTONE_LABELS[type]}</Text>
              <Text style={styles.mDate}>{m?.milestone_date ?? 'Sin fecha — toca para editar'}</Text>
              {m?.description ? <Text style={styles.mDesc}>{m.description}</Text> : null}
            </View>
          </Pressable>
        );
      })}

      <Button
        title="Actualizar fecha de inicio de relación"
        variant="secondary"
        onPress={async () => {
          if (!coupleId || !userId) return;
          await coupleRepository.updateCouple(coupleId, userId, {
            relationship_start_date: new Date().toISOString().slice(0, 10),
          });
          qc.invalidateQueries({ queryKey: ['couple', coupleId] });
          qc.invalidateQueries({ queryKey: ['home', coupleId] });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    alignItems: 'center',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  big: { fontSize: 72, fontWeight: '800', color: colors.primaryPinkDark },
  label: { ...typography.subtitle, color: colors.text, marginBottom: spacing.xl },
  heart: { color: colors.primaryPink },
  card: {
    backgroundColor: colors.primaryBlue,
    padding: spacing.md,
    borderRadius: 14,
    width: '100%',
    marginBottom: spacing.lg,
  },
  cardTitle: { fontWeight: '700' },
  section: { alignSelf: 'flex-start', fontWeight: '700', fontSize: 18, marginBottom: spacing.md },
  milestone: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 14,
    width: '100%',
    marginBottom: spacing.sm,
  },
  milestoneText: { flex: 1 },
  mTitle: { fontWeight: '700' },
  mDate: { color: colors.textMuted, marginTop: 2 },
  mDesc: { marginTop: 4, color: colors.text },
});
