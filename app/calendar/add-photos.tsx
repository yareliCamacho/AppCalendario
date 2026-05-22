import { useState } from 'react';
import { ScrollView, StyleSheet, Text, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { coupleRepository } from '../../src/repositories/CoupleRepository';
import { eventService } from '../../src/services/EventService';
import { usePhotoUpload } from '../../src/hooks/usePhotoUpload';
import { UploadProgressBar } from '../../src/components/photos/UploadProgressBar';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing } from '../../src/config/theme';

export default function AddPhotosScreen() {
  const { eventId: paramEventId, date } = useLocalSearchParams<{
    eventId?: string;
    date?: string;
  }>();
  const { coupleId, userId } = useCoupleContext();
  const { upload, progress, uploading } = usePhotoUpload();
  const [uris, setUris] = useState<string[]>([]);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!res.canceled) {
      setUris((prev) => [...prev, ...res.assets.map((a) => a.uri)]);
    }
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!res.canceled) setUris((prev) => [...prev, res.assets[0].uri]);
  };

  const saveAll = async () => {
    if (!coupleId || !userId) return;
    const members = await coupleRepository.getMembers(coupleId, userId);
    const partner = members.find((m) => m.user_id !== userId)?.user_id;
    if (!partner) return;

    let eventId = paramEventId;
    if (!eventId && date) {
      const event = await eventService.ensureEventForDate(coupleId, userId, date, partner);
      eventId = event.id;
    }
    if (!eventId) return;

    for (const uri of uris) {
      await upload({
        localUri: uri,
        coupleId,
        eventId,
        userId,
        partnerUserId: partner,
      });
    }
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Agregar fotos al recuerdo</Text>
      <Button title="Tomar foto" onPress={takePhoto} />
      <Button title="Subir de galería" variant="secondary" onPress={pick} />
      {uris.map((uri) => (
        <Image key={uri} source={{ uri }} style={styles.thumb} />
      ))}
      {uploading ? <UploadProgressBar percent={progress} /> : null}
      <Button title="Guardar recuerdo" onPress={saveAll} disabled={!uris.length || uploading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  heading: { fontWeight: '700', marginBottom: spacing.md },
  thumb: { width: '100%', height: 160, borderRadius: 12, marginVertical: spacing.sm },
});
