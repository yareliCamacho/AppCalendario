import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { CoupleProvider, useCoupleContext } from '../src/config/CoupleProvider';
import { useRealtimeSync } from '../src/hooks/useRealtimeSync';
import { isSupabaseConfigured } from '../src/config/env';
import { colors } from '../src/config/theme';
import { stackScreenOptionsNoHeader } from '../src/config/navigation';

const queryClient = new QueryClient();

function RootNavigator() {
  const { userId, coupleId, loading, hasCouple } = useCoupleContext();
  const segments = useSegments();
  const router = useRouter();

  useRealtimeSync(coupleId, userId);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';

    if (!isSupabaseConfigured()) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    if (!userId && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }
    const path = segments.join('/');
    if (userId && hasCouple && inAuth) {
      router.replace('/(tabs)');
    }
  }, [userId, hasCouple, loading, segments]);

  return (
    <Stack screenOptions={stackScreenOptionsNoHeader}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      <Stack.Screen name="calendar" />
      <Stack.Screen
        name="notifications"
        options={{ ...stackScreenOptionsNoHeader, headerShown: true, title: 'Notificaciones' }}
      />
      <Stack.Screen name="milestones" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <CoupleProvider>
        <View style={styles.appShell}>
          <RootNavigator />
        </View>
      </CoupleProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  appShell: { flex: 1, backgroundColor: colors.appShellBg },
});
