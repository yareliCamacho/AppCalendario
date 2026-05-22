import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CoupleProvider, useCoupleContext } from '../src/config/CoupleProvider';
import { useRealtimeSync } from '../src/hooks/useRealtimeSync';
import { colors } from '../src/config/theme';
import { isSupabaseConfigured } from '../src/config/env';

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
    if (
      userId &&
      !hasCouple &&
      !path.includes('pair-link') &&
      !path.includes('qr-scan') &&
      !path.includes('register')
    ) {
      router.replace('/(auth)/pair-link');
      return;
    }
    if (userId && hasCouple && inAuth) {
      router.replace('/(tabs)');
    }
  }, [userId, hasCouple, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="calendar" options={{ headerShown: true, title: 'Calendario' }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notificaciones' }} />
      <Stack.Screen name="milestones" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <CoupleProvider>
        <RootNavigator />
      </CoupleProvider>
    </QueryClientProvider>
  );
}
