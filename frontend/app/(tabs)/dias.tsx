import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { milestoneRepository } from '../../src/repositories/MilestoneRepository';
import { eventRepository } from '../../src/repositories/EventRepository';
import { getUpcomingSpecialDates } from '../../src/utils/specialDates';
import { calculateDaysTogether } from '../../src/utils/daysTogether';
import { formatDateLong, daysUntil } from '../../src/utils/formatDate';
import { HeartPhoto } from '../../src/components/home/HeartPhoto';
import {
  CoupleAppPhotosModal,
  pickDisplayPhotoFromGallery,
} from '../../src/components/home/CoupleDisplayPhotoPicker';
import { photoRepository } from '../../src/repositories/PhotoRepository';
import { mapError } from '../../src/utils/errors';
import { Button } from '../../src/components/ui/Button';
import { TabScreenShell, scrollOnAppBackground } from '../../src/components/ui/TabScreenShell';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { colors, spacing, contentMaxWidth, radii, shadows, glass } from '../../src/config/theme';
import { useTabScrollInsets } from '../../src/hooks/useTabScrollInsets';
import type { Milestone } from '../../src/types/database';

const MILESTONE_TYPES: Milestone['type'][] = [
  'first_meeting',
  'first_date',
  'first_trip',
  'last_trip',
];

const MILESTONE_LABELS: Record<Milestone['type'], string> = {
  first_meeting: 'Primer recuerdo',
  first_date: 'Primera cita',
  first_trip: 'Primer viaje',
  last_trip: 'Último viaje',
};

const MILESTONE_EMOJI: Record<Milestone['type'], string> = {
  first_meeting: '✨',
  first_date: '💕',
  first_trip: '✈️',
  last_trip: '🌅',
};

export default function DiasScreen() {
  const { contentContainerStyle: tabScrollStyle } = useTabScrollInsets();
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
    queryKey: ['upcomingSpecial', coupleId, couple?.relationship_start_date],
    enabled: Boolean(coupleId && userId),
    queryFn: async () => {
      const todayIso = new Date().toISOString().slice(0, 10);
      const future = await eventRepository.listFromDate(coupleId!, userId!, todayIso);
      return getUpcomingSpecialDates(couple?.relationship_start_date ?? null, future, todayIso);
    },
  });

  const days = calculateDaysTogether(couple?.relationship_start_date ?? null);
  const byType = milestones.reduce((acc, m) => {
    if (!acc[m.type]) acc[m.type] = m;
    return acc;
  }, {} as Partial<Record<Milestone['type'], Milestone>>);
  const [openLock, setOpenLock] = useState(false);
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const [appPhotosOpen, setAppPhotosOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (!couple?.display_photo_path) {
      setDisplayUri(null);
      return;
    }
    let alive = true;
    photoRepository
      .getSignedUrl(couple.display_photo_path)
      .then((url) => {
        if (alive) setDisplayUri(url);
      })
      .catch(() => {
        if (alive) setDisplayUri(null);
      });
    return () => {
      alive = false;
    };
  }, [couple?.display_photo_path]);

  const refreshCouplePhoto = () => {
    qc.invalidateQueries({ queryKey: ['couple', coupleId] });
    qc.invalidateQueries({ queryKey: ['home', coupleId] });
  };

  const onHeartPress = () => {
    if (!coupleId || !userId || photoBusy) return;
    Alert.alert('Foto en el corazón', 'Elige de dónde quieres la imagen', [
      {
        text: 'Galería',
        onPress: () => {
          setPhotoBusy(true);
          pickDisplayPhotoFromGallery(coupleId, userId)
            .then((ok) => {
              if (ok) refreshCouplePhoto();
            })
            .catch((e) => Alert.alert('No se pudo guardar', mapError(e)))
            .finally(() => setPhotoBusy(false));
        },
      },
      { text: 'Fotos de la app', onPress: () => setAppPhotosOpen(true) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
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
        <ScreenHeader
          title="Conteo de días"
          subtitle="Contando nuestra historia juntos 💕"
        />

        <View style={styles.counterCard}>
          <Pressable onPress={onHeartPress} style={styles.heartTap} accessibilityRole="button">
            <HeartPhoto uri={displayUri} size={88} bare />
            <Text style={styles.heartHint}>
              {displayUri ? 'Toca para cambiar foto' : 'Toca para poner tu foto'}
            </Text>
          </Pressable>
          <Text style={styles.big}>{days}</Text>
          <Text style={styles.label}>
            días juntos <Text style={styles.heart}>💗</Text>
          </Text>
          {couple?.relationship_start_date ? (
            <Text style={styles.since}>
              Desde {formatDateLong(couple.relationship_start_date)}
            </Text>
          ) : (
            <Text style={styles.since}>Define la fecha de inicio abajo</Text>
          )}
        </View>

        {coupleId && userId ? (
          <CoupleAppPhotosModal
            visible={appPhotosOpen}
            onClose={() => setAppPhotosOpen(false)}
            coupleId={coupleId}
            userId={userId}
            onUpdated={refreshCouplePhoto}
          />
        ) : null}

        {upcoming ? (
          <SoftCard style={styles.block}>
            <Text style={styles.sectionLabel}>Próxima fecha especial</Text>
            <Text style={styles.sectionHint}>
              Solo aviso · consulta o edita la fecha en Calendario
            </Text>
            <View style={styles.upcomingRow}>
              <View style={styles.iconSquare}>
                <Text style={styles.iconEmoji}>
                  {upcoming.kind === 'anniversary' ? '💗' : '📅'}
                </Text>
              </View>
              <View style={styles.upcomingBody}>
                <Text style={styles.upcomingTitle}>{upcoming.title}</Text>
                <Text style={styles.upcomingDate}>{formatDateLong(upcoming.event_date)}</Text>
              </View>
              <View style={styles.countdownCol}>
                <Text style={styles.countdownLabel}>Faltan</Text>
                <Text style={styles.countdownNum}>{daysUntil(upcoming.event_date)}</Text>
                <Text style={styles.countdownLabel}>días</Text>
              </View>
            </View>
          </SoftCard>
        ) : null}

        <Text style={styles.sectionTitle}>Hitos de nuestra historia</Text>
        {MILESTONE_TYPES.map((type) => {
          const m = byType[type];
          const cardTitle =
            type === 'last_trip' ? MILESTONE_LABELS.last_trip : m?.title ?? MILESTONE_LABELS[type];
          return (
            <Pressable
              key={type}
              onPress={() => {
                if (openLock) return;
                setOpenLock(true);
                if (type === 'last_trip') {
                  router.push('/milestones/history');
                } else {
                  router.push({ pathname: '/milestones/edit', params: { type } });
                }
                setTimeout(() => setOpenLock(false), 700);
              }}
            >
              <SoftCard style={styles.milestoneCard} padded>
                <View style={styles.milestoneRow}>
                  <View style={styles.milestoneIcon}>
                    <Text style={styles.milestoneEmoji}>{MILESTONE_EMOJI[type]}</Text>
                  </View>
                  <View style={styles.milestoneText}>
                    <Text style={styles.mTitle}>{cardTitle}</Text>
                    <Text style={styles.mDate}>
                      {m?.milestone_date
                        ? formatDateLong(m.milestone_date)
                        : 'Toca para agregar fecha'}
                    </Text>
                    {m?.description ? (
                      <Text style={styles.mDesc} numberOfLines={2}>
                        {m.description}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </SoftCard>
            </Pressable>
          );
        })}

        <Button
          title="Usar hoy como inicio de relación"
          variant="secondary"
          onPress={async () => {
            if (!coupleId || !userId) return;
            await coupleRepository.updateCouple(coupleId, userId, {
              relationship_start_date: new Date().toISOString().slice(0, 10),
            });
            qc.invalidateQueries({ queryKey: ['couple', coupleId] });
            qc.invalidateQueries({ queryKey: ['home', coupleId] });
          }}
          style={styles.cta}
        />
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
  counterCard: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  heartTap: { alignItems: 'center', marginBottom: spacing.xs },
  heartHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  big: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.primaryPinkDark,
    lineHeight: 80,
    marginTop: spacing.sm,
  },
  label: { fontSize: 20, fontWeight: '600', color: colors.text },
  heart: { color: colors.primaryPink },
  since: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  block: { marginBottom: spacing.md },
  sectionLabel: { fontWeight: '700', fontSize: 15, color: colors.text, marginBottom: spacing.xs },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconSquare: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...glass.surface,
  },
  iconEmoji: { fontSize: 22 },
  upcomingBody: { flex: 1 },
  upcomingTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  upcomingDate: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  countdownCol: { alignItems: 'center' },
  countdownLabel: { fontSize: 11, color: colors.textMuted },
  countdownNum: { fontSize: 26, fontWeight: '800', color: colors.primaryPinkDark },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 17,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  milestoneCard: { marginBottom: spacing.sm },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...glass.surface,
  },
  milestoneEmoji: { fontSize: 22 },
  milestoneText: { flex: 1 },
  mTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  mDate: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
  mDesc: { marginTop: 4, color: colors.textMuted, fontSize: 13 },
  chevron: { fontSize: 22, color: colors.primaryPinkDark, fontWeight: '300' },
  cta: { marginTop: spacing.md },
});
