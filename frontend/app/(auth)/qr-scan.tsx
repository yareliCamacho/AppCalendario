import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { pairingService } from '../../src/services/PairingService';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { mapError } from '../../src/utils/errors';
import { colors, spacing } from '../../src/config/theme';

export default function QrScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState('');
  const [scanned, setScanned] = useState(false);
  const { refresh } = useCoupleContext();

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Necesitamos acceso a la cámara para escanear el QR</Text>
        <Text style={styles.link} onPress={requestPermission}>
          Permitir cámara
        </Text>
      </View>
    );
  }

  const onBarcode = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setError('');
    try {
      const parsed = JSON.parse(data);
      const code = parsed.code ?? data.slice(0, 6);
      await pairingService.joinByCode(String(code));
      await refresh();
      router.replace('/(tabs)');
    } catch (e) {
      setScanned(false);
      setError(mapError(e));
    }
  };

  return (
    <View style={styles.flex}>
      <CameraView
        style={styles.flex}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcode}
      />
      <View style={styles.overlay}>
        <ErrorBanner message={error} />
        <Text style={styles.hint}>Apunta al código QR de tu pareja</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  text: { color: colors.text, textAlign: 'center' },
  link: { color: colors.primaryPinkDark, marginTop: spacing.md, fontWeight: '600' },
  overlay: { position: 'absolute', bottom: 40, left: spacing.lg, right: spacing.lg },
  hint: { color: colors.white, textAlign: 'center', fontWeight: '600' },
});
