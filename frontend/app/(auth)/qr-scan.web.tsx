import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenBackground } from '../../src/components/ui/ScreenBackground';
import { colors, spacing, contentMaxWidth } from '../../src/config/theme';

/** En navegador no hay escáner QR nativo; se redirige al código manual. */
export default function QrScanWebScreen() {
  return (
    <ScreenBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Escanear QR</Text>
        <Text style={styles.text}>
          En la versión web no podemos usar la cámara para leer códigos QR. Introduce el código de
          6 dígitos que te compartió tu pareja.
        </Text>
        <Button title="Introducir código" onPress={() => router.replace('/(auth)/pair-link')} />
        <Button title="Volver" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  text: { color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 22 },
});
