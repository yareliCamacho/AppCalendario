import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Almacén de sesión Supabase compatible con SSR (export web) y navegador. */
export function createAuthStorage() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      const memory = new Map<string, string>();
      return {
        getItem: async (key: string) => memory.get(key) ?? null,
        setItem: async (key: string, value: string) => {
          memory.set(key, value);
        },
        removeItem: async (key: string) => {
          memory.delete(key);
        },
      };
    }
    return {
      getItem: async (key: string) => window.localStorage.getItem(key),
      setItem: async (key: string, value: string) => {
        window.localStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        window.localStorage.removeItem(key);
      },
    };
  }

  return AsyncStorage;
}
