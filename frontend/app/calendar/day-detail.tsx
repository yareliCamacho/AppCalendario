import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { eventRepository } from '../../src/repositories/EventRepository';
import { eventService } from '../../src/services/EventService';
import { photoRepository } from '../../src/repositories/PhotoRepository';
import { mapError } from '../../src/utils/errors';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { LoadingOverlay } from '../../src/components/ui/LoadingOverlay';
import { locationRepository } from '../../src/repositories/LocationRepository';
import { useEventPhotos } from '../../src/hooks/useEventPhotos';
import { ScreenBackground, scrollOnAppBackground } from '../../src/components/ui/ScreenBackground';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { CalendarStackHeader } from '../../src/components/calendar/CalendarStackHeader';
import { EventPhotoCarousel } from '../../src/components/calendar/EventPhotoCarousel';
import { CoupleMap } from '../../src/components/maps/CoupleMap';
import { PhotoGallery } from '../../src/components/photos/PhotoGallery';
import { randomCalendarQuote } from '../../src/utils/romanceQuotes';
import { isSupabaseConfigured } from '../../src/config/env';
import { supabase } from '../../src/config/supabase';
import { colors, spacing, contentMaxWidth, radii, glass } from '../../src/config/theme';
import { formatDateLong, daysUntil } from '../../src/utils/formatDate';
import { canAddPhotosToEvent, isReminderOnlyEvent } from '../../src/utils/eventKind';
import { PhotoCropModal } from '../../src/components/photos/PhotoCropModal';
import { invalidateAfterEventDelete } from '../../src/utils/invalidateEventQueries';
import { Button } from '../../src/components/ui/Button';
import { GradientButton } from '../../src/components/ui/GradientButton';

export default function DayDetailScreen() {
  const { date, fromHome } = useLocalSearchParams<{ date: string; fromHome?: string }>();
  const memoryOnlyView = fromHome === '1' || fromHome === 'true';
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { coupleId, userId } = useCoupleContext();
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cropPhotoId, setCropPhotoId] = useState<string | null>(null);
  const [cropImageUri, setCropImageUri] = useState<string | null>(null);

  const { data: event } = useQuery({
    queryKey: ['event', coupleId, date],
    enabled: Boolean(coupleId && userId && date),
    queryFn: () => eventRepository.getByDate(coupleId!, userId!, date!),
  });

  const isReminder = isReminderOnlyEvent(event);
  const todayIso = new Date().toISOString().slice(0, 10);
  const isFutureReminder = Boolean(
    isReminder && event && event.event_date >= todayIso,
  );

  useEffect(() => {
    if (!isFutureReminder || !date) return;
    router.replace({
      pathname: '/(tabs)/calendario',
      params: { date },
    });
  }, [isFutureReminder, date]);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', event?.id],
    enabled: Boolean(event?.id && !isReminder && coupleId && userId),
    queryFn: () => locationRepository.listByEvent(event!.id, coupleId!, userId!),
  });

  const {
    data: photoPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: photosLoading,
  } = useEventPhotos(isReminder ? undefined : event?.id, coupleId ?? undefined, userId ?? undefined);

  const galleryItems = photoPages?.pages.flatMap((p) => p.items) ?? [];

  const { data: quote } = useQuery({
    queryKey: ['quote', date],
    enabled: Boolean(date && !isReminder),
    queryFn: async () => {
      if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase
          .from('romance_messages')
          .select('body')
          .eq('kind', 'calendar_quote')
          .limit(30);
        const list = data ?? [];
        if (list.length) {
          const pick = list[Math.floor(Math.random() * list.length)];
          if (pick?.body?.trim()) return pick.body;
        }
      }
      return randomCalendarQuote();
    },
  });

  const mapMarkers = locations
    .filter((l) => l.latitude != null && l.longitude != null && l.show_on_map)
    .map((l) => ({
      latitude: l.latitude!,
      longitude: l.longitude!,
      title: l.name,
      description: l.description ?? undefined,
    }));

  const defaultLat = mapMarkers[0]?.latitude ?? 19.4326;
  const defaultLng = mapMarkers[0]?.longitude ?? -99.1332;

  const invalidatePhotos = async () => {
    if (!event) return;
    await qc.invalidateQueries({ queryKey: ['event_photos_gallery', event.id] });
    await qc.invalidateQueries({ queryKey: ['home'] });
    await qc.invalidateQueries({ queryKey: ['couple', coupleId] });
  };

  const handleFavorite = async (photoId: string) => {
    if (!event || !coupleId || !userId) return;
    try {
      await photoRepository.setFavorite(photoId, event.id, coupleId, userId);
      await invalidatePhotos();
    } catch (e) {
      setError(mapError(e));
    }
  };

  const handleCropComplete = async (uri: string) => {
    const photoId = cropPhotoId;
    setCropImageUri(null);
    setCropPhotoId(null);
    if (!event || !coupleId || !userId || !photoId) return;
    setPhotoBusy(true);
    setError('');
    try {
      await photoRepository.replaceEventPhoto(photoId, event.id, coupleId, userId, uri);
      await invalidatePhotos();
    } catch (e) {
      setError(mapError(e));
    } finally {
      setPhotoBusy(false);
    }
  };

  const closeCrop = () => {
    setCropImageUri(null);
    setCropPhotoId(null);
  };

  const confirmDeletePhoto = (photoId: string) => {
    Alert.alert('Eliminar foto', '¿Quitar esta foto del recuerdo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (!event || !coupleId || !userId) return;
            setPhotoBusy(true);
            try {
              await photoRepository.deleteEventPhoto(photoId, event.id, coupleId, userId);
              await invalidatePhotos();
            } catch (e) {
              setError(mapError(e));
            } finally {
              setPhotoBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const showPhotoOptions = (photoId: string) => {
    if (!event || !canAddPhotosToEvent(event)) return;
    Alert.alert('Opciones de la foto', undefined, [
      { text: 'Eliminar foto', style: 'destructive', onPress: () => confirmDeletePhoto(photoId) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleEditPhoto = (photoId: string) => {
    if (!event || !canAddPhotosToEvent(event)) return;
    const item = galleryItems.find((p) => p.id === photoId);
    if (!item?.uri) {
      setError('No se encontró la foto.');
      return;
    }
    setCropPhotoId(photoId);
    setCropImageUri(item.uri);
  };

  const confirmDelete = () => {
    if (!event || !coupleId || !userId) return;
    Alert.alert(
      'Eliminar del calendario',
      `¿Eliminar «${event.title}»? Se quitará del calendario, Inicio, notificaciones y se borrarán fotos y ubicaciones de la base de datos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void handleDelete();
          },
        },
      ],
    );
  };

  const enableMemoriesForDay = async () => {
    if (!event || !coupleId || !userId || !date) return;
    setError('');
    try {
      await eventRepository.update(event.id, coupleId, userId, { reminder_only: false });
      await qc.invalidateQueries({ queryKey: ['event', coupleId, date] });
      await qc.invalidateQueries({ queryKey: ['events'] });
      await qc.invalidateQueries({ queryKey: ['home', coupleId] });
    } catch (e) {
      setError(mapError(e));
    }
  };

  const resolveEventId = async (): Promise<string | null> => {
    if (event?.id) return event.id;
    if (!coupleId || !userId || !date) return null;
    const members = await coupleRepository.getMembers(coupleId, userId);
    const partner = members.find((m) => m.user_id !== userId)?.user_id ?? null;
    const created = await eventService.ensureEventForDate(coupleId, userId, date, partner);
    await qc.invalidateQueries({ queryKey: ['event', coupleId, date] });
    await qc.invalidateQueries({ queryKey: ['events'] });
    return created.id;
  };

  const goAddLocation = () => {
    void (async () => {
      setError('');
      try {
        const eventId = await resolveEventId();
        if (!eventId) {
          setError('No se pudo preparar la fecha.');
          return;
        }
        router.push({
          pathname: '/calendar/add-location',
          params: { eventId, date: date ?? '', fromHome: '1' },
        });
      } catch (e) {
        setError(mapError(e));
      }
    })();
  };

  const goAddPhotos = () => {
    void (async () => {
      setError('');
      try {
        let target = event;
        if (!target && coupleId && userId && date) {
          target = await eventRepository.getByDate(coupleId, userId, date);
        }
        if (target && !canAddPhotosToEvent(target)) {
          setError('Las fechas con recordatorio activo no admiten fotos.');
          return;
        }
        const eventId = target?.id ?? (await resolveEventId());
        if (!eventId) {
          setError('No se pudo preparar la fecha.');
          return;
        }
        router.push({
          pathname: '/calendar/add-photos',
          params: {
            eventId,
            date: date ?? '',
            fromHome: memoryOnlyView ? '1' : '',
          },
        });
      } catch (e) {
        setError(mapError(e));
      }
    })();
  };

  const handleDelete = async () => {
    if (!event || !coupleId || !userId || !date) return;
    setError('');
    setDeleting(true);
    try {
      const deletedId = event.id;
      await eventService.deleteEvent(coupleId, userId, deletedId);
      await invalidateAfterEventDelete(qc, coupleId, {
        eventId: deletedId,
        eventDate: date,
      });
      if (memoryOnlyView) {
        router.back();
      } else {
        router.replace('/(tabs)/calendario');
      }
    } catch (e) {
      setError(mapError(e));
    } finally {
      setDeleting(false);
    }
  };

  if (isFutureReminder) {
    return (
      <ScreenBackground>
        <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
          <ActivityIndicator color={colors.primaryPinkDark} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        style={scrollOnAppBackground}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <CalendarStackHeader
          title={isReminder ? 'Recordatorio' : 'Recuerdos del día'}
          subtitle={
            isReminder
              ? 'Fecha especial con aviso · sin fotos ni ubicación'
              : 'Desliza desde el borde izquierdo para volver'
          }
          showFavorite={false}
        />

        <ErrorBanner message={error} />

        <Pressable style={styles.datePill}>
          <Text style={styles.datePillIcon}>📅</Text>
          <Text style={styles.datePillText}>{date ? formatDateLong(date) : '—'}</Text>
        </Pressable>

        {isReminder && event ? (
          <SoftCard style={styles.reminderCard}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            {event.description ? <Text style={styles.eventDesc}>{event.description}</Text> : null}
            <Text style={styles.reminderMeta}>
              Te avisamos {event.reminder_days} día{event.reminder_days === 1 ? '' : 's'} antes
              {daysUntil(event.event_date) > 0
                ? ` · faltan ${daysUntil(event.event_date)} días`
                : ' · es hoy'}
            </Text>
            <Text style={styles.reminderHint}>
              Si creaste esta fecha sin recordatorio, habilita fotos y ubicación aquí.
            </Text>
            <Button
              title="Guardar fotos y ubicación"
              variant="secondary"
              onPress={() => void enableMemoriesForDay()}
              style={styles.enableMemoriesBtn}
            />
          </SoftCard>
        ) : null}

        {event && !isReminder ? (
          <SoftCard style={styles.summaryIntro}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            {(event.description || event.romantic_note) && (
              <Text style={styles.eventDesc}>
                {event.description ?? event.romantic_note}
              </Text>
            )}
          </SoftCard>
        ) : null}

        {!isReminder && photosLoading ? (
          <ActivityIndicator color={colors.primaryPinkDark} style={{ marginVertical: spacing.md }} />
        ) : null}

        {!isReminder && memoryOnlyView && galleryItems.length > 0 ? (
          <>
            <EventPhotoCarousel
              items={galleryItems}
              onFavorite={handleFavorite}
              onEdit={handleEditPhoto}
              onMoreOptions={showPhotoOptions}
            />
            <Text style={styles.editPhotoHint}>
              Toca ✎ para recortar o ajustar esta foto · ⋯ para eliminar.
            </Text>
            {hasNextPage ? (
              <Pressable
                style={styles.loadMorePhotos}
                onPress={() => !isFetchingNextPage && fetchNextPage()}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator color={colors.primaryPinkDark} />
                ) : (
                  <Text style={styles.loadMorePhotosText}>Cargar más fotos</Text>
                )}
              </Pressable>
            ) : null}
          </>
        ) : null}

        {!isReminder && !memoryOnlyView && galleryItems.length > 0 ? (
          <PhotoGallery
            items={galleryItems}
            onLoadMore={
              hasNextPage && !isFetchingNextPage ? () => fetchNextPage() : undefined
            }
            loadingMore={isFetchingNextPage}
            onPressItem={handleEditPhoto}
          />
        ) : null}

        {!isReminder && event && galleryItems.length === 0 && !photosLoading ? (
          <SoftCard style={styles.emptyBlock}>
            <Text style={styles.emptyText}>
              Aún no hay fotos en esta fecha. Puedes agregarlas abajo (ubicación opcional).
            </Text>
          </SoftCard>
        ) : null}

        {!isReminder && mapMarkers.length > 0 ? (
          <SoftCard style={styles.mapCard} padded={false}>
            <CoupleMap
              key={`day-map-${mapMarkers.map((m) => `${m.latitude},${m.longitude}`).join('|')}`}
              latitude={defaultLat}
              longitude={defaultLng}
              markers={mapMarkers}
              height={280}
              fixed
              heartPin
            />
            {locations
              .filter((l) => l.show_on_map && l.latitude)
              .map((loc) => (
                <View key={loc.id} style={[styles.mapPinLabel, glass.mapRow]}>
                  <Text style={styles.mapPinIcon}>♥</Text>
                  <Text style={styles.mapPinName}>{loc.name}</Text>
                </View>
              ))}
          </SoftCard>
        ) : !isReminder && event && locations.length === 0 ? (
          <SoftCard style={styles.emptyBlock}>
            <Text style={styles.emptyText}>Aún no hay ubicación para este día.</Text>
          </SoftCard>
        ) : null}

        {!isReminder ? (
          <SoftCard style={styles.summaryCard}>
            <Text style={styles.quoteMark}>“</Text>
            <Text style={styles.quote}>{quote}</Text>
            <Text style={styles.quoteMarkEnd}>”</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>🖼</Text>
                <Text style={styles.statVal}>{galleryItems.length} fotos</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>📍</Text>
                <Text style={styles.statVal}>{locations.length} lugares</Text>
              </View>
            </View>
          </SoftCard>
        ) : null}

        <View style={styles.actions}>
          {!memoryOnlyView && !event ? (
            <Button
              title="Agregar fecha especial"
              variant="secondary"
              onPress={() => router.push({ pathname: '/calendar/add-event', params: { date } })}
            />
          ) : null}
          {!isReminder ? (
            <>
              <Button
                title={locations.length > 0 ? 'Agregar otra ubicación' : 'Agregar ubicación'}
                variant="secondary"
                onPress={goAddLocation}
              />
              <GradientButton
                title={galleryItems.length > 0 ? 'Agregar más fotos' : 'Agregar fotos'}
                onPress={goAddPhotos}
                icon="🖼"
              />
            </>
          ) : null}
          {event ? (
            <Button
              title={deleting ? 'Eliminando...' : 'Eliminar del calendario'}
              variant="danger"
              onPress={confirmDelete}
              disabled={deleting}
              style={styles.deleteBtn}
            />
          ) : null}
        </View>
      </ScrollView>
      <LoadingOverlay visible={deleting || photoBusy} />
      <PhotoCropModal
        visible={Boolean(cropImageUri)}
        imageUri={cropImageUri}
        onCancel={closeCrop}
        onComplete={(uri) => void handleCropComplete(uri)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  datePillIcon: { fontSize: 14 },
  datePillText: { fontWeight: '600', color: colors.text },
  reminderCard: { marginBottom: spacing.md },
  reminderMeta: { color: colors.primaryPinkDark, fontSize: 14, fontWeight: '600', marginTop: spacing.sm },
  reminderHint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm, lineHeight: 16 },
  enableMemoriesBtn: { marginTop: spacing.sm },
  summaryIntro: { marginBottom: spacing.md },
  mapCard: { marginBottom: spacing.md, overflow: 'hidden' },
  mapPinLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapPinIcon: { fontSize: 14, color: colors.primaryPinkDark },
  mapPinName: { fontSize: 13, fontWeight: '600', color: colors.text },
  emptyBlock: { marginBottom: spacing.md },
  emptyText: { color: colors.textMuted, marginBottom: spacing.sm, textAlign: 'center' },
  summaryCard: { marginBottom: spacing.md, alignItems: 'center' },
  quoteMark: { fontSize: 28, color: colors.primaryPinkLight, alignSelf: 'flex-start' },
  quote: {
    fontStyle: 'italic',
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  quoteMarkEnd: { fontSize: 28, color: colors.primaryPinkLight, alignSelf: 'flex-end' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    width: '100%',
  },
  stat: { alignItems: 'center' },
  statIcon: { fontSize: 18 },
  statVal: { color: colors.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600' },
  eventTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  eventDesc: { color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20 },
  loadMorePhotos: { alignItems: 'center', marginTop: -spacing.sm, marginBottom: spacing.md },
  loadMorePhotosText: { color: colors.primaryPinkDark, fontWeight: '600', fontSize: 13 },
  editPhotoHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  deleteBtn: { marginTop: spacing.xs },
});
