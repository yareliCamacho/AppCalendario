import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, Image, View, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { pickCroppedImage, pickCroppedErrorMessage } from '../../src/utils/pickCroppedImage';
import { PhotoCropModal } from '../../src/components/photos/PhotoCropModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { eventRepository } from '../../src/repositories/EventRepository';
import { eventService } from '../../src/services/EventService';
import { isReminderOnlyEvent } from '../../src/utils/eventKind';
import { locationRepository } from '../../src/repositories/LocationRepository';
import { usePhotoUpload } from '../../src/hooks/usePhotoUpload';
import { ScreenBackground, scrollOnAppBackground } from '../../src/components/ui/ScreenBackground';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { CalendarStackHeader } from '../../src/components/calendar/CalendarStackHeader';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { HeartPhoto } from '../../src/components/home/HeartPhoto';
import { colors, spacing, contentMaxWidth, radii, glass } from '../../src/config/theme';
import { formatDateLong } from '../../src/utils/formatDate';
import { mapError } from '../../src/utils/errors';

export default function AddPhotosScreen() {
  const { eventId: paramEventId, date, fromHome } = useLocalSearchParams<{
    eventId?: string;
    date?: string;
    fromHome?: string;
  }>();
  const memoryFlow = fromHome === '1' || fromHome === 'true';
  const insets = useSafeAreaInsets();
  const { coupleId, userId } = useCoupleContext();
  const qc = useQueryClient();
  const { upload, progress, uploading } = usePhotoUpload();
  const [error, setError] = useState('');
  const [uris, setUris] = useState<string[]>([]);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [cropImageUri, setCropImageUri] = useState<string | null>(null);

  const blockIfReminder = (ev: Awaited<ReturnType<typeof eventRepository.getById>>) => {
    if (ev && isReminderOnlyEvent(ev)) {
      setError('Esta fecha es solo un recordatorio y no admite fotos.');
      setTimeout(() => router.back(), 1200);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!coupleId || !userId) return;
    let alive = true;
    const load = async () => {
      try {
        if (paramEventId) {
          const ev = await eventRepository.getById(paramEventId, coupleId, userId);
          if (!alive) return;
          blockIfReminder(ev);
          return;
        }
        if (date) {
          const ev = await eventRepository.getByDate(coupleId, userId, date);
          if (!alive) return;
          blockIfReminder(ev);
        }
      } catch {
        /* ignore */
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [paramEventId, date, coupleId, userId]);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', paramEventId],
    enabled: Boolean(paramEventId && coupleId && userId),
    queryFn: () => locationRepository.listByEvent(paramEventId!, coupleId!, userId!),
  });

  const selectedLocation = locations.find((l) => l.id === locationId) ?? locations[0];

  const appendCropped = (uri: string) => {
    setUris((prev) => [...prev, uri]);
  };

  const pick = async () => {
    setError('');
    const res = await pickCroppedImage('library');
    if (res.ok) {
      appendCropped(res.uri);
      return;
    }
    if (res.reason !== 'canceled') {
      setError(pickCroppedErrorMessage(res.reason));
    }
  };

  const takePhoto = async () => {
    setError('');
    const res = await pickCroppedImage('camera');
    if (res.ok) {
      appendCropped(res.uri);
      return;
    }
    if (res.reason !== 'canceled') {
      setError(pickCroppedErrorMessage(res.reason));
    }
  };

  const recropUri = (index: number) => {
    const current = uris[index];
    if (!current) return;
    setCropIndex(index);
    setCropImageUri(current);
  };

  const handleCropComplete = (uri: string) => {
    const index = cropIndex;
    setCropImageUri(null);
    setCropIndex(null);
    if (index === null) return;
    setUris((prev) => prev.map((u, i) => (i === index ? uri : u)));
  };

  const closeCrop = () => {
    setCropImageUri(null);
    setCropIndex(null);
  };

  const removeUri = (index: number) => {
    setUris((prev) => prev.filter((_, i) => i !== index));
  };

  const saveAll = async () => {
    setError('');
    if (!uris.length) {
      setError('Selecciona al menos una foto.');
      return;
    }
    if (!coupleId || !userId) {
      setError('Sesión no disponible.');
      return;
    }
    const members = await coupleRepository.getMembers(coupleId, userId);
    const partner = members.find((m) => m.user_id !== userId)?.user_id ?? null;

    let eventId = paramEventId;
    if (!eventId && date) {
      const existing = await eventRepository.getByDate(coupleId, userId, date);
      if (existing && isReminderOnlyEvent(existing)) {
        setError('Esta fecha es solo un recordatorio y no admite fotos.');
        return;
      }
      const event = await eventService.ensureEventForDate(coupleId, userId, date, partner);
      eventId = event.id;
    }
    if (eventId) {
      const ev = await eventRepository.getById(eventId, coupleId, userId);
      if (ev && isReminderOnlyEvent(ev)) {
        setError('Esta fecha es solo un recordatorio y no admite fotos.');
        return;
      }
    }
    if (!eventId) {
      setError('No hay fecha guardada. Regresa y crea la fecha primero.');
      return;
    }

    try {
      let i = 0;
      for (const uri of uris) {
        setUploadIndex(i + 1);
        await upload({
          localUri: uri,
          coupleId,
          eventId,
          userId,
          partnerUserId: partner,
        });
        i++;
      }
      await qc.invalidateQueries({ queryKey: ['event', coupleId, date] });
      await qc.invalidateQueries({ queryKey: ['events'] });
      await qc.invalidateQueries({ queryKey: ['locations', eventId] });

      router.replace({
        pathname: '/calendar/day-detail',
        params: { date: date ?? '', fromHome: memoryFlow ? '1' : '' },
      });
    } catch (e) {
      const msg = mapError(e);
      setError(
        msg.includes('Bucket not found') || msg.includes('bucket')
          ? 'Falta el bucket couple-photos en Supabase. Ejecuta la migración 003_storage.sql.'
          : msg || 'Error al subir fotos',
      );
    }
  };

  const total = uris.length;
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
          title="Agregar fotos"
          subtitle={
            memoryFlow
              ? 'Último paso: guarda las fotos y pulsa Guardar fecha 💗'
              : 'Guarda los mejores momentos de esta fecha 💗'
          }
        />

        <ErrorBanner message={error} />

        <View style={styles.optionsRow}>
          <Pressable style={styles.optionCard} onPress={takePhoto}>
            <Text style={styles.optionIcon}>📷</Text>
            <Text style={styles.optionTitle}>Tomar foto</Text>
            <Text style={styles.optionText}>Captura y recorta con zoom antes de guardar.</Text>
          </Pressable>
          <Pressable style={styles.optionCard} onPress={pick}>
            <Text style={styles.optionIcon}>🖼</Text>
            <Text style={styles.optionTitle}>Elegir de galería</Text>
            <Text style={styles.optionText}>
              Ajusta el encuadre; repite para agregar más fotos.
            </Text>
          </Pressable>
        </View>

        {uris.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Fotos seleccionadas ({uris.length})</Text>
            <Text style={styles.cropHint}>Toca ✎ para recortar o ajustar esa foto.</Text>
            <View style={styles.thumbRow}>
              {uris.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <Pressable
                    style={styles.editDot}
                    onPress={() => recropUri(index)}
                    accessibilityLabel="Recortar foto"
                  >
                    <Text style={styles.editDotText}>✎</Text>
                  </Pressable>
                  <Pressable
                    style={styles.closeDot}
                    onPress={() => removeUri(index)}
                    accessibilityLabel="Quitar foto"
                  >
                    <Text style={styles.closeDotText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {uploading && total > 0 ? (
          <SoftCard style={styles.uploadCard}>
            <View style={styles.uploadHeader}>
              <Text style={styles.uploadTitle}>Subiendo fotos...</Text>
              <Text style={styles.uploadMeta}>
                {uploadIndex} de {total} · {progress}%
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.uploadHint}>
              Por favor no cierres la app mientras se suben tus fotos. 💗
            </Text>
          </SoftCard>
        ) : null}

        {locations.length > 0 ? (
          <SoftCard style={styles.locationCard}>
            <Text style={styles.sectionTitle}>📍 Asignar a ubicación</Text>
            {locations.map((loc) => (
              <Pressable
                key={loc.id}
                style={[
                  styles.locOption,
                  glass.surface,
                  (locationId === loc.id || (!locationId && loc.id === locations[0]?.id)) &&
                    styles.locOptionActive,
                ]}
                onPress={() => setLocationId(loc.id)}
              >
                <Text style={styles.locName}>{loc.name}</Text>
                <Text style={styles.locSub}>Nuestro lugar especial</Text>
              </Pressable>
            ))}
          </SoftCard>
        ) : null}

        {date ? (
          <View style={styles.dateBanner}>
            <HeartPhoto size={48} />
            <Text style={styles.dateBannerText}>
              Estas fotos se agregarán al recuerdo del{' '}
              <Text style={styles.dateBold}>{formatDateLong(date)}</Text>
            </Text>
          </View>
        ) : null}

        <GradientButton
          title={uploading ? 'Guardando...' : memoryFlow ? 'Guardar fecha' : 'Guardar recuerdos'}
          onPress={saveAll}
          disabled={!uris.length || uploading}
          icon="💕"
        />
      </ScrollView>
      <PhotoCropModal
        visible={Boolean(cropImageUri)}
        imageUri={cropImageUri}
        onCancel={closeCrop}
        onComplete={handleCropComplete}
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
  optionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  optionCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...glass.surface,
  },
  optionIcon: { fontSize: 28, marginBottom: spacing.xs },
  optionTitle: { color: colors.text, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  optionText: { color: colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  sectionTitle: { color: colors.text, fontWeight: '700', marginBottom: spacing.sm, fontSize: 15 },
  cropHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  thumbWrap: { position: 'relative', marginRight: spacing.sm },
  thumb: { width: 88, height: 88, borderRadius: radii.md },
  editDot: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryPinkDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editDotText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  closeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDotText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  uploadCard: { marginBottom: spacing.md },
  uploadHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  uploadTitle: { fontWeight: '700', color: colors.text },
  uploadMeta: { color: colors.primaryPinkDark, fontWeight: '600', fontSize: 13 },
  track: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primaryPinkDark },
  uploadHint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  locationCard: { marginBottom: spacing.md },
  locOption: {
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  locOptionActive: {
    borderWidth: 1,
    borderColor: 'rgba(255, 79, 162, 0.45)',
    backgroundColor: 'rgba(255, 200, 225, 0.42)',
  },
  locName: { fontWeight: '700', color: colors.text },
  locSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFE8F2',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dateBannerText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  dateBold: { fontWeight: '700', color: colors.primaryPinkDark },
});
