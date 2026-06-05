import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { createAuthStorage } from './authStorage';
import { env, isSupabaseConfigured } from './env';

export const supabase = isSupabaseConfigured()
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: createAuthStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : (null as unknown as ReturnType<typeof createClient>);
