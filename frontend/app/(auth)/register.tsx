import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../../src/services/AuthService';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { LoadingOverlay } from '../../src/components/ui/LoadingOverlay';
import { mapError } from '../../src/utils/errors';
import { getSupabaseConfigHint, isSupabaseConfigured } from '../../src/config/env';
import { colors, spacing, contentMaxWidth, typography, radii, glass } from '../../src/config/theme';
import { HeartPhoto } from '../../src/components/home/HeartPhoto';
import { ScreenBackground, scrollOnAppBackground } from '../../src/components/ui/ScreenBackground';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabaseReady = isSupabaseConfigured();

  const onSubmit = async () => {
    setError('');
    if (!supabaseReady) {
      setError(getSupabaseConfigHint() ?? 'Configura Supabase en frontend/.env');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await authService.signUp(email.trim(), password, displayName.trim());
      router.replace('/(tabs)');
    } catch (e) {
      setError(mapError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
    <ScrollView style={scrollOnAppBackground} contentContainerStyle={styles.container}>
      <View style={styles.brandWrap}>
        <HeartPhoto size={92} />
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.sub}>Empieza a construir sus recuerdos juntos 💕</Text>
      </View>

      <View style={styles.formCard}>
        <ErrorBanner message={error} />
        {!supabaseReady && getSupabaseConfigHint() ? (
          <ErrorBanner message={getSupabaseConfigHint()!} />
        ) : null}
        <Input
          label="Nombre"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Tu nombre"
          autoComplete="name"
          textContentType="name"
        />
        <Input
          label="Correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="tu@correo.com"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Mínimo 6 caracteres"
          autoComplete="password"
          textContentType="password"
        />
        <Button title="Registrarme" onPress={onSubmit} />
      </View>
      <LoadingOverlay visible={loading} />
    </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandWrap: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.xs },
  title: { ...typography.title, color: colors.primaryPinkDark },
  sub: { color: colors.textMuted, textAlign: 'center' },
  formCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    ...glass.panel,
  },
});
