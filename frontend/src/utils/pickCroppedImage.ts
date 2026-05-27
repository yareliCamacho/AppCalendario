import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type PickImageSource = 'camera' | 'library';

export type PickCroppedResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'canceled' | 'permission' | 'unsupported' };

/**
 * Abre cámara o galería con editor nativo (recorte, zoom y encuadre).
 * En iOS/Android `allowsEditing` muestra la UI del sistema para ajustar la zona.
 */
export async function pickCroppedImage(source: PickImageSource): Promise<PickCroppedResult> {
  if (Platform.OS === 'web') {
    return { ok: false, reason: 'unsupported' };
  }

  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!perm.granted) {
    return { ok: false, reason: 'permission' };
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.92,
          exif: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.92,
          exif: false,
        });

  if (result.canceled || !result.assets[0]?.uri) {
    return { ok: false, reason: 'canceled' };
  }

  return { ok: true, uri: result.assets[0].uri };
}

export function pickCroppedErrorMessage(
  reason: PickCroppedResult extends { ok: false; reason: infer R } ? R : never,
): string {
  switch (reason) {
    case 'permission':
      return 'Permite acceso a fotos o cámara en los ajustes del teléfono.';
    case 'unsupported':
      return 'El recorte con zoom está disponible en la app del teléfono, no en el navegador.';
    default:
      return '';
  }
}
