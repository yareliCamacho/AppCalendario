import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { pickCroppedImage, pickCroppedErrorMessage } from '../../utils/pickCroppedImage';
import { photoRepository } from '../../repositories/PhotoRepository';
import { optimizeImage } from '../../utils/imageOptimize';
import { mapError } from '../../utils/errors';
import { colors, spacing, radii } from '../../config/theme';
import type { EventPhoto } from '../../types/database';

type AppGridProps = {
  visible: boolean;
  onClose: () => void;
  coupleId: string;
  userId: string;
  onUpdated: () => void;
};

/** Modal con fotos ya subidas en calendario */
export function CoupleAppPhotosModal({ visible, onClose, coupleId, userId, onUpdated }: AppGridProps) {
  const [appPhotos, setAppPhotos] = useState<{ photo: EventPhoto; uri: string }[]>([]);
  const [loadingApp, setLoadingApp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setLoadingApp(true);
    setError('');
    const load = async () => {
      try {
        const photos = await photoRepository.listRecentForCouple(coupleId, userId, 40);
        const withUrls = await Promise.all(
          photos.map(async (photo) => {
            try {
              const uri = await photoRepository.getSignedUrl(photo.storage_path);
              return { photo, uri };
            } catch {
              return null;
            }
          }),
        );
        if (alive) setAppPhotos(withUrls.filter(Boolean) as { photo: EventPhoto; uri: string }[]);
      } catch (e) {
        if (alive) setError(mapError(e));
      } finally {
        if (alive) setLoadingApp(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [visible, coupleId, userId]);

  const applyPath = async (storagePath: string) => {
    setSaving(true);
    setError('');
    try {
      await photoRepository.setCoupleDisplayPhoto(storagePath, coupleId, userId);
      onUpdated();
      onClose();
    } catch (e) {
      setError(mapError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Fotos de la app</Text>
        <Text style={styles.sheetSub}>Toca una para ponerla en el corazón</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {loadingApp ? (
          <ActivityIndicator style={styles.loader} color={colors.primaryPinkDark} />
        ) : appPhotos.length === 0 ? (
          <Text style={styles.empty}>Aún no hay fotos en calendario. Sube algunas primero.</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.grid}>
            {appPhotos.map(({ photo, uri }) => (
              <Pressable
                key={photo.id}
                style={styles.gridItem}
                disabled={saving}
                onPress={() => void applyPath(photo.storage_path)}
              >
                <Image source={{ uri }} style={styles.gridImage} />
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cerrar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

export async function pickDisplayPhotoFromGallery(
  coupleId: string,
  userId: string,
): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const picked = await pickCroppedImage('library');
  if (!picked.ok) {
    if (picked.reason === 'permission') {
      throw new Error(pickCroppedErrorMessage('permission'));
    }
    return false;
  }
  const optimized = await optimizeImage(picked.uri);
  await photoRepository.uploadCoupleDisplayPhoto(optimized, coupleId, userId);
  return true;
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.appShellBg,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sheetSub: { color: colors.textMuted, marginTop: 4, marginBottom: spacing.md },
  errorText: { color: '#c62828', textAlign: 'center', fontSize: 13, marginBottom: spacing.sm },
  loader: { marginTop: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  gridImage: { width: '100%', height: '100%' },
  cancelBtn: {
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cancelText: { color: colors.primaryPinkDark, fontWeight: '700', fontSize: 16 },
});
