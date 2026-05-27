import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../config/theme';

/** Espacio para menú sándwich superior + contenido scrollable */
export function useTabScrollInsets() {
  const insets = useSafeAreaInsets();

  return {
    contentContainerStyle: {
      paddingTop: insets.top + spacing.xs,
      paddingBottom: insets.bottom + spacing.xl,
    },
  };
}
