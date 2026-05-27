import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { milestoneRepository } from '../../src/repositories/MilestoneRepository';
import { photoRepository } from '../../src/repositories/PhotoRepository';
import { TabScreenShell, scrollOnAppBackground } from '../../src/components/ui/TabScreenShell';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { Button } from '../../src/components/ui/Button';
import { colors, contentMaxWidth, radii, spacing } from '../../src/config/theme';
import { formatDateLong } from '../../src/utils/formatDate';
import { getMilestonePhotoPaths } from '../../src/utils/milestonePhotos';

export default function LastTripHistoryScreen() {
  const { coupleId, userId } = useCoupleContext();
  const insets = useSafeAreaInsets();
  const [openLock, setOpenLock] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const { data: trips = [] } = useQuery({
    queryKey: ['milestones', 'last_trip', coupleId],
    enabled: Boolean(coupleId && userId),
    queryFn: () => milestoneRepository.listByType(coupleId!, userId!, 'last_trip'),
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const entries = await Promise.all(
        trips.map(async (trip) => {
          const first = getMilestonePhotoPaths(trip)[0];
          if (!first) return [trip.id, ''] as const;
          try {
            const url = await photoRepository.getSignedUrl(first);
            return [trip.id, url] as const;
          } catch {
            return [trip.id, ''] as const;
          }
        }),
      );
      if (!alive) return;
      setPhotoUrls(Object.fromEntries(entries));
    };
    void load();
    return () => {
      alive = false;
    };
  }, [trips]);

  return (
    <TabScreenShell>
      <ScrollView
        style={scrollOnAppBackground}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        <ScreenHeader title="Historial de viajes" subtitle="Tus últimos viajes guardados ✈️" />

        <Button
          title="Agregar último viaje"
          onPress={() => router.push({ pathname: '/milestones/edit', params: { type: 'last_trip' } })}
          style={styles.addBtn}
        />

        {trips.length === 0 ? (
          <SoftCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aún no hay viajes</Text>
            <Text style={styles.emptySub}>
              Guarda tu primer último viaje con fecha, descripción y hasta 3 fotos.
            </Text>
          </SoftCard>
        ) : (
          trips.map((trip) => (
            <Pressable
              key={trip.id}
              onPress={() => {
                if (openLock) return;
                setOpenLock(true);
                router.push({
                  pathname: '/milestones/edit',
                  params: { type: 'last_trip', milestoneId: trip.id },
                });
                setTimeout(() => setOpenLock(false), 700);
              }}
            >
              <SoftCard style={styles.tripCard}>
                <View style={styles.tripRow}>
                  {photoUrls[trip.id] ? (
                    <View>
                      <Image source={{ uri: photoUrls[trip.id] }} style={styles.tripThumb} />
                      {getMilestonePhotoPaths(trip).length > 1 ? (
                        <View style={styles.photoBadge}>
                          <Text style={styles.photoBadgeText}>
                            {getMilestonePhotoPaths(trip).length}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.iconWrap}>
                      <Text style={styles.icon}>🌅</Text>
                    </View>
                  )}
                  <View style={styles.tripText}>
                    <Text style={styles.tripTitle}>{trip.title}</Text>
                    <Text style={styles.tripDate}>{formatDateLong(trip.milestone_date)}</Text>
                    {trip.description ? (
                      <Text style={styles.tripDesc} numberOfLines={2}>
                        {trip.description}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </SoftCard>
            </Pressable>
          ))
        )}
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  addBtn: { marginBottom: spacing.md },
  emptyCard: { marginTop: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: colors.textMuted, marginTop: spacing.xs },
  tripCard: { marginBottom: spacing.sm },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripThumb: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  photoBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryPinkDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  photoBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  icon: { fontSize: 20 },
  tripText: { flex: 1, minWidth: 0 },
  tripTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  tripDate: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
  tripDesc: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  chevron: { fontSize: 22, color: colors.primaryPinkDark, fontWeight: '300' },
});
