import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
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

export default function LoginScreen() {
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
    if (!password.trim()) {
      setError('Escribe tu contraseña');
      return;
    }
    setLoading(true);
    try {
      await authService.signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(mapError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={scrollOnAppBackground} contentContainerStyle={styles.container}>
        <View style={styles.brandWrap}>
          <HeartPhoto size={96} />
          <Text style={styles.title}>Nosotros 💕</Text>
          <Text style={styles.sub}>Tu historia, tu lugar, tu todo</Text>
        </View>

        <View style={styles.formCard}>
          <ErrorBanner message={error} />
          {!supabaseReady && getSupabaseConfigHint() ? (
            <ErrorBanner message={getSupabaseConfigHint()!} />
          ) : null}
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
          <Button title="Iniciar sesión" onPress={onSubmit} />
        </View>

        <Link href="/(auth)/register" style={styles.link}>
          <Text style={styles.linkText}>Crear cuenta</Text>
        </Link>
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: spacing.md,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  brandWrap: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.xs },
  title: { ...typography.title, color: colors.primaryPinkDark, textAlign: 'center' },
  sub: { textAlign: 'center', color: colors.textMuted, marginBottom: spacing.sm },
  formCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    ...glass.panel,
  },
  link: { marginTop: spacing.lg, alignSelf: 'center' },
  linkText: { color: colors.primaryBlueDark, fontWeight: '600' },
});
