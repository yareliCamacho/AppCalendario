import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { authService } from '../../src/services/AuthService';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { LoadingOverlay } from '../../src/components/ui/LoadingOverlay';
import { mapError } from '../../src/utils/errors';
import { colors, spacing, contentMaxWidth, typography } from '../../src/config/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.signIn(email.trim(), password);
      router.replace('/(auth)/pair-link');
    } catch (e) {
      setError(mapError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nosotros 💕</Text>
        <Text style={styles.sub}>Tu espacio privado en pareja</Text>
        <ErrorBanner message={error} />
        <Input label="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="tu@correo.com" />
        <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" />
        <Button title="Iniciar sesión" onPress={onSubmit} />
        <Link href="/(auth)/register" style={styles.link}>
          <Text style={styles.linkText}>Crear cuenta</Text>
        </Link>
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: colors.primaryPinkDark, textAlign: 'center' },
  sub: { textAlign: 'center', color: colors.textMuted, marginBottom: spacing.xl },
  link: { marginTop: spacing.lg, alignSelf: 'center' },
  linkText: { color: colors.primaryBlueDark, fontWeight: '600' },
});
