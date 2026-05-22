import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { eventRepository } from '../../src/repositories/EventRepository';
import { locationRepository } from '../../src/repositories/LocationRepository';
import { useEventPhotos } from '../../src/hooks/useEventPhotos';
import { CoupleMap } from '../../src/components/maps/CoupleMap';
import { PhotoGallery } from '../../src/components/photos/PhotoGallery';
import { randomCalendarQuote } from '../../src/utils/romanceQuotes';
import { isSupabaseConfigured } from '../../src/config/env';
import { supabase } from '../../src/config/supabase';
import { colors, spacing } from '../../src/config/theme';

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { coupleId, userId } = useCoupleContext();
  const [expanded, setExpanded] = useState(true);

  const { data: event } = useQuery({
    queryKey: ['event', coupleId, date],
    enabled: Boolean(coupleId && userId && date),
    queryFn: () => eventRepository.getByDate(coupleId!, userId!, date!),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', event?.id],
    enabled: Boolean(event?.id && coupleId && userId),
    queryFn: () => locationRepository.listByEvent(event!.id, coupleId!, userId!),
  });

  const {
    data: photoPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: photosLoading,
  } = useEventPhotos(event?.id, coupleId ?? undefined, userId ?? undefined);

  const galleryItems = photoPages?.pages.flatMap((p) => p.items) ?? [];

  const { data: quote } = useQuery({
    queryKey: ['quote', date],
    queryFn: async () => {
      if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase
          .from('romance_messages')
          .select('body')
          .eq('kind', 'calendar_quote')
          .limit(30);
        const list = data ?? [];
        if (list.length) return list[Math.floor(Math.random() * list.length)].body;
      }
      return randomCalendarQuote();
    },
  });

  const loc = locations.find((l) => l.show_on_map && l.latitude && l.longitude);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.date}>{date}</Text>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <Text style={styles.toggle}>{expanded ? '▼ Contraer' : '▶ Expandir'} detalle del día</Text>
      </Pressable>

      {expanded ? (
        <>
          <Text style={styles.quote}>{quote}</Text>
          {loc ? <CoupleMap latitude={loc.latitude!} longitude={loc.longitude!} title={loc.name} /> : null}
          <Text style={styles.meta}>
            {galleryItems.length} fotos · {locations.length} lugares
          </Text>
          {photosLoading ? (
            <ActivityIndicator color={colors.primaryPink} />
          ) : (
            <PhotoGallery
              items={galleryItems}
              onLoadMore={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
            />
          )}
          {isFetchingNextPage ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
        </>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={styles.btn}
          onPress={() => router.push({ pathname: '/calendar/add-event', params: { date } })}
        >
          <Text>Agregar fecha</Text>
        </Pressable>
        {event ? (
          <>
            <Pressable
              style={styles.btn}
              onPress={() =>
                router.push({ pathname: '/calendar/add-location', params: { eventId: event.id } })
              }
            >
              <Text>Agregar ubicación</Text>
            </Pressable>
            <Pressable
              style={styles.btn}
              onPress={() =>
                router.push({
                  pathname: '/calendar/add-photos',
                  params: { eventId: event.id, date },
                })
              }
            >
              <Text>Agregar fotos</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={styles.btn}
            onPress={() =>
              router.push({ pathname: '/calendar/add-photos', params: { date } })
            }
          >
            <Text>Agregar fotos al día</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  date: { fontSize: 22, fontWeight: '700' },
  toggle: { color: colors.primaryPinkDark, marginVertical: spacing.sm },
  quote: { fontStyle: 'italic', color: colors.text, marginBottom: spacing.md },
  meta: { color: colors.textMuted, marginVertical: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  btn: { backgroundColor: colors.primaryBlue, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
});
