import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  Image,
  View,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pickCroppedImage, pickCroppedErrorMessage } from '../../src/utils/pickCroppedImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { milestoneRepository } from '../../src/repositories/MilestoneRepository';
import { photoRepository } from '../../src/repositories/PhotoRepository';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { CalendarStackHeader } from '../../src/components/calendar/CalendarStackHeader';
import {
  EventPhotoCarousel,
  getMilestonePhotoGalleryHeight,
  type CarouselPhoto,
} from '../../src/components/calendar/EventPhotoCarousel';
import { colors, spacing, contentMaxWidth, radii, glass } from '../../src/config/theme';
import { TabScreenShell, scrollOnAppBackground } from '../../src/components/ui/TabScreenShell';
import { SoftCard } from '../../src/components/ui/SoftCard';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import type { Milestone } from '../../src/types/database';
import { optimizeImage } from '../../src/utils/imageOptimize';
import { mapError } from '../../src/utils/errors';
import {
  getMilestonePhotoPaths,
  MILESTONE_MAX_PHOTOS,
} from '../../src/utils/milestonePhotos';
import { generateUuid } from '../../src/utils/uuid';

const LABELS: Record<Milestone['type'], string> = {
  first_meeting: 'Primer recuerdo',
  first_date: 'Primera cita',
  first_trip: 'Primer viaje',
  last_trip: 'Último viaje',
};

type PendingPhoto = { id: string; uri: string };
const EMPTY_MILESTONES: Milestone[] = [];

function paramString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function EditMilestoneScreen() {
  const params = useLocalSearchParams<{ type?: string; milestoneId?: string }>();
  const safeType = paramString(params.type) as Milestone['type'] | undefined;
  const milestoneId = paramString(params.milestoneId);
  const insets = useSafeAreaInsets();
  const { width, height: windowHeight } = useWindowDimensions();
  const galleryHeight = getMilestonePhotoGalleryHeight(width, windowHeight);
  const { coupleId, userId } = useCoupleContext();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [savedPaths, setSavedPaths] = useState<string[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const typeValid = Boolean(safeType && safeType in LABELS);
  const totalPhotos = savedPaths.length + pendingPhotos.length;
  const slotsLeft = MILESTONE_MAX_PHOTOS - totalPhotos;

  const { data: milestonesData } = useQuery({
    queryKey: ['milestones', safeType, coupleId],
    enabled: Boolean(coupleId && userId && typeValid),
    queryFn: () => milestoneRepository.listByType(coupleId!, userId!, safeType!),
  });
  const milestones = milestonesData ?? EMPTY_MILESTONES;

  useEffect(() => {
    if (!typeValid || !safeType) return;
    const selected =
      (milestoneId ? milestones.find((m) => m.id === milestoneId) : undefined) ??
      (safeType === 'last_trip' ? undefined : milestones[0]);
    setTitle((prev) => prev === (selected?.title ?? LABELS[safeType] ?? '') ? prev : (selected?.title ?? LABELS[safeType] ?? ''));
    setDate((prev) => prev === (selected?.milestone_date ?? new Date().toISOString().slice(0, 10)) ? prev : (selected?.milestone_date ?? new Date().toISOString().slice(0, 10)));
    setDescription((prev) => prev === (selected?.description ?? '') ? prev : (selected?.description ?? ''));
    setSavedPaths((prev) => {
      const next = getMilestonePhotoPaths(selected);
      if (prev.length === next.length && prev.every((p, i) => p === next[i])) return prev;
      return next;
    });
    setPendingPhotos([]);
  }, [typeValid, safeType, milestones, milestoneId]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!savedPaths.length) {
        if (alive) setSignedUrls({});
        return;
      }
      const entries = await Promise.all(
        savedPaths.map(async (path) => {
          try {
            const url = await photoRepository.getSignedUrl(path);
            return [path, url] as const;
          } catch {
            return [path, ''] as const;
          }
        }),
      );
      if (alive) setSignedUrls(Object.fromEntries(entries));
    };
    void load();
    return () => {
      alive = false;
    };
  }, [savedPaths]);

  const carouselItems: CarouselPhoto[] = useMemo(() => {
    const saved: CarouselPhoto[] = savedPaths
      .map((path) => ({
        id: path,
        uri: signedUrls[path] || '',
      }))
      .filter((item) => item.uri);
    const pending: CarouselPhoto[] = pendingPhotos.map((p) => ({
      id: p.id,
      uri: p.uri,
    }));
    return [...saved, ...pending];
  }, [savedPaths, signedUrls, pendingPhotos]);

  const ensureSession = (): boolean => {
    if (!coupleId || !userId) {
      setError('Inicia sesión y enlaza tu pareja para guardar fotos en los hitos.');
      return false;
    }
    return true;
  };

  const ensureSlots = (): boolean => {
    if (slotsLeft <= 0) {
      setError(`Puedes agregar hasta ${MILESTONE_MAX_PHOTOS} fotos por hito.`);
      return false;
    }
    return true;
  };

  const addPendingUris = (uris: string[]) => {
    const room = MILESTONE_MAX_PHOTOS - savedPaths.length - pendingPhotos.length;
    const toAdd = uris.slice(0, room).map((uri) => ({ id: `local-${generateUuid()}`, uri }));
    if (!toAdd.length) return;
    setPendingPhotos((prev) => [...prev, ...toAdd]);
    setError('');
  };

  const pickFromGallery = async () => {
    setError('');
    if (!ensureSession() || !ensureSlots()) return;
    if (Platform.OS === 'web') {
      setError('En el navegador no se pueden elegir fotos. Usa la app en el teléfono.');
      return;
    }
    const picked = await pickCroppedImage('library');
    if (picked.ok) {
      addPendingUris([picked.uri]);
      return;
    }
    if (picked.reason !== 'canceled') {
      setError(pickCroppedErrorMessage(picked.reason));
    }
  };

  const takePhoto = async () => {
    setError('');
    if (!ensureSession() || !ensureSlots()) return;
    if (Platform.OS === 'web') {
      setError('En el navegador no se puede usar la cámara. Usa la app en el teléfono.');
      return;
    }
    const picked = await pickCroppedImage('camera');
    if (picked.ok) {
      addPendingUris([picked.uri]);
      return;
    }
    if (picked.reason !== 'canceled') {
      setError(pickCroppedErrorMessage(picked.reason));
    }
  };

  const removePhoto = useCallback((id: string) => {
    if (id.startsWith('local-')) {
      setPendingPhotos((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    setSavedPaths((prev) => prev.filter((path) => path !== id));
  }, []);

  const save = async () => {
    if (!typeValid || !safeType || !ensureSession()) return;
    setSaving(true);
    setError('');
    try {
      const uploaded: string[] = [];
      for (const pending of pendingPhotos) {
        const optimized = await optimizeImage(pending.uri);
        const path = await photoRepository.uploadMilestonePhoto(
          optimized,
          coupleId!,
          safeType,
          userId!,
          milestoneId,
        );
        uploaded.push(path);
      }
      const allPaths = [...savedPaths, ...uploaded].slice(0, MILESTONE_MAX_PHOTOS);
      const payload = {
        type: safeType,
        title: title.trim() || LABELS[safeType],
        milestone_date: date,
        description: description || null,
        photo_path: allPaths[0] ?? null,
        photo_paths: allPaths,
      };
      if (milestoneId) {
        await milestoneRepository.update(coupleId!, userId!, milestoneId, payload);
      } else {
        await milestoneRepository.upsert(coupleId!, userId!, payload);
      }
      qc.invalidateQueries({ queryKey: ['milestones', coupleId] });
      qc.invalidateQueries({ queryKey: ['milestones', safeType, coupleId] });
      router.back();
    } catch (e) {
      setError(mapError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!typeValid || !safeType) {
    return (
      <TabScreenShell>
        <ScrollView
          style={scrollOnAppBackground}
          contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.sm }]}
        >
          <CalendarStackHeader title="Hito" showFavorite={false} />
          <ErrorBanner message="Tipo de hito no válido. Vuelve atrás e inténtalo de nuevo." />
          <Button title="Volver" onPress={() => router.back()} />
        </ScrollView>
      </TabScreenShell>
    );
  }

  const heading = LABELS[safeType];

  return (
    <TabScreenShell>
      <ScrollView
        style={[scrollOnAppBackground, styles.scroll]}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <CalendarStackHeader
          title={heading}
          subtitle={`Hasta ${MILESTONE_MAX_PHOTOS} fotos · desliza para verlas`}
          showFavorite={false}
        />
        <ErrorBanner message={error} />

        <SoftCard style={styles.formCard} padded>
          <Text style={styles.sectionTitle}>
            Fotos del hito ({totalPhotos}/{MILESTONE_MAX_PHOTOS})
          </Text>

          {carouselItems.length > 0 ? (
            <View style={styles.carouselWrap}>
              <EventPhotoCarousel
                items={carouselItems}
                height={galleryHeight}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={[styles.previewPlaceholder, { height: galleryHeight * 0.65 }]}>
              <Text style={styles.previewPlaceholderIcon}>📷</Text>
              <Text style={styles.previewPlaceholderText}>Aún no hay fotos</Text>
            </View>
          )}

          {carouselItems.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbStrip}
              contentContainerStyle={styles.thumbStripContent}
            >
              {carouselItems.map((item) => (
                <View key={item.id} style={styles.thumbWrap}>
                  <Image source={{ uri: item.uri }} style={styles.thumb} resizeMode="cover" />
                  <Pressable
                    style={styles.thumbRemove}
                    onPress={() => removePhoto(item.id)}
                    hitSlop={8}
                    accessibilityLabel="Quitar foto"
                  >
                    <Text style={styles.thumbRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.optionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionCardPressed,
                slotsLeft <= 0 && styles.optionCardDisabled,
              ]}
              onPress={takePhoto}
              disabled={saving || slotsLeft <= 0}
            >
              <Text style={styles.optionIcon}>📷</Text>
              <Text style={styles.optionTitle}>Tomar foto</Text>
              <Text style={styles.optionText}>Cámara</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionCardPressed,
                slotsLeft <= 0 && styles.optionCardDisabled,
              ]}
              onPress={pickFromGallery}
              disabled={saving || slotsLeft <= 0}
            >
              <Text style={styles.optionIcon}>🖼</Text>
              <Text style={styles.optionTitle}>Galería</Text>
              <Text style={styles.optionText}>
                {slotsLeft > 1 ? `Hasta ${slotsLeft} fotos` : slotsLeft === 1 ? '1 foto más' : 'Lleno'}
              </Text>
            </Pressable>
          </View>

          {pendingPhotos.length > 0 ? (
            <Text style={styles.pendingHint}>
              {pendingPhotos.length} foto(s) nueva(s). Pulsa «Guardar hito» para subirlas.
            </Text>
          ) : null}

          <Input label="Título" value={title} onChangeText={setTitle} />
          <Input label="Fecha (AAAA-MM-DD)" value={date} onChangeText={setDate} />
          <Input label="Descripción" value={description} onChangeText={setDescription} />
          <Button
            title={saving ? 'Guardando...' : 'Guardar hito'}
            onPress={save}
            style={styles.saveBtn}
            disabled={saving}
          />
        </SoftCard>
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { zIndex: 2 },
  container: {
    paddingHorizontal: spacing.md,
    maxWidth: contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  formCard: { marginBottom: spacing.lg },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  carouselWrap: { marginBottom: spacing.sm },
  previewPlaceholder: {
    width: '100%',
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 79, 162, 0.2)',
    borderStyle: 'dashed',
  },
  previewPlaceholderIcon: { fontSize: 36, marginBottom: spacing.xs },
  previewPlaceholderText: { color: colors.textMuted, fontSize: 14 },
  thumbStrip: { marginBottom: spacing.md, maxHeight: 72 },
  thumbStripContent: { gap: spacing.sm, paddingVertical: spacing.xs },
  thumbWrap: { position: 'relative' },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: { color: colors.white, fontSize: 14, fontWeight: '700', lineHeight: 16 },
  optionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  optionCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    ...glass.surface,
  },
  optionCardPressed: { opacity: 0.85 },
  optionCardDisabled: { opacity: 0.45 },
  optionIcon: { fontSize: 28, marginBottom: spacing.xs },
  optionTitle: { color: colors.text, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  optionText: { color: colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  pendingHint: {
    color: colors.primaryPinkDark,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  saveBtn: { marginTop: spacing.sm },
});
