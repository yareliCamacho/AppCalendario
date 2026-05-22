import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../../src/services/AuthService';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { LoadingOverlay } from '../../src/components/ui/LoadingOverlay';
import { mapError } from '../../src/utils/errors';
import { colors, spacing, contentMaxWidth, typography } from '../../src/config/theme';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.signUp(email.trim(), password, displayName.trim());
      router.replace('/(auth)/pair-link');
    } catch (e) {
      setError(mapError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <ErrorBanner message={error} />
      <Input label="Nombre" value={displayName} onChangeText={setDisplayName} placeholder="Tu nombre" />
      <Input label="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Registrarme" onPress={onSubmit} />
      <LoadingOverlay visible={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
  title: { ...typography.title, color: colors.primaryPinkDark, marginBottom: spacing.lg },
});
