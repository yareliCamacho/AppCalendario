import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useCoupleContext } from '../../src/config/CoupleProvider';
import { pairingService } from '../../src/services/PairingService';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { mapError } from '../../src/utils/errors';
import { colors, spacing, contentMaxWidth, typography, radii, glass } from '../../src/config/theme';
import { ScreenBackground } from '../../src/components/ui/ScreenBackground';

export default function PairLinkScreen() {
  const { userId, coupleId, refresh } = useCoupleContext();
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'invite' | 'join'>('invite');

  useEffect(() => {
    (async () => {
      if (!userId) return;
      try {
        const cid = coupleId ?? (await pairingService.ensureCoupleForOwner(userId));
        const pair = await pairingService.createInviteCode(userId, cid);
        setInviteCode(pair.code);
        await refresh();
      } catch (e) {
        setError(mapError(e));
      }
    })();
  }, [userId, coupleId]);

  const onJoin = async () => {
    setError('');
    try {
      await pairingService.joinByCode(joinCode.trim());
      await refresh();
      router.replace('/(tabs)');
    } catch (e) {
      setError(mapError(e));
    }
  };

  return (
    <ScreenBackground>
    <View style={styles.container}>
      <Text style={styles.title}>Vincular pareja</Text>
      <Text style={styles.sub}>Puedes invitar o unirte cuando quieras 💕</Text>
      <ErrorBanner message={error} />

      <View style={styles.tabs}>
        <Button title="Invitar" variant={mode === 'invite' ? 'primary' : 'ghost'} onPress={() => setMode('invite')} />
        <Button title="Unirme" variant={mode === 'join' ? 'primary' : 'ghost'} onPress={() => setMode('join')} />
      </View>

      {mode === 'invite' ? (
        <View style={styles.panel}>
          <Text style={styles.label}>Código de 6 dígitos (válido 24 h)</Text>
          <Text style={styles.code}>{inviteCode || '······'}</Text>
          {inviteCode ? (
            <View style={styles.qr}>
              <QRCode value={JSON.stringify({ type: 'couple_pair', code: inviteCode })} size={180} />
            </View>
          ) : null}
          <Button
            title="Compartir código"
            variant="secondary"
            onPress={() => Share.share({ message: `Únete a nuestra app con el código: ${inviteCode}` })}
          />
          <Button title="Escanear QR de pareja" onPress={() => router.push('/(auth)/qr-scan')} />
        </View>
      ) : (
        <View style={styles.panel}>
          <Input label="Código de 6 dígitos" value={joinCode} onChangeText={setJoinCode} keyboardType="numeric" maxLength={6} />
          <Button title="Vincular" onPress={onJoin} />
        </View>
      )}
    </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: { ...typography.title, color: colors.primaryPinkDark, marginBottom: spacing.xs },
  sub: { color: colors.textMuted, marginBottom: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  panel: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...glass.panel,
  },
  label: { color: colors.textMuted, marginBottom: spacing.sm },
  code: { fontSize: 36, fontWeight: '700', letterSpacing: 8, textAlign: 'center', color: colors.primaryBlueDark, marginBottom: spacing.sm },
  qr: { alignItems: 'center', marginBottom: spacing.lg },
});
