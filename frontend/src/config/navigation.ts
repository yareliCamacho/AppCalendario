import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors } from './theme';

/** Opciones comunes: volver deslizando desde el borde (iOS/Android). */
export const stackScreenOptions: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  contentStyle: { backgroundColor: colors.appShellBg },
};

export const stackScreenOptionsNoHeader: NativeStackNavigationOptions = {
  ...stackScreenOptions,
  headerShown: false,
};

export const stackScreenOptionsWithHeader: NativeStackNavigationOptions = {
  ...stackScreenOptions,
  headerShown: true,
  headerTintColor: colors.primaryPinkDark,
  headerBackTitle: 'Atrás',
};
