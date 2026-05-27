import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as
  | {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
    }
  | undefined;

function readEnv(name: string, extraKey?: keyof NonNullable<typeof extra>): string {
  const fromProcess = process.env[name]?.trim() ?? '';
  if (fromProcess) return fromProcess;
  if (extraKey && extra?.[extraKey]) return String(extra[extraKey]).trim();
  return '';
}

export const env = {
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL', 'supabaseUrl'),
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'supabaseAnonKey'),
  aiProvider: (process.env.AI_PROVIDER ?? 'openai') as 'openai' | 'gemini',
};

const PLACEHOLDER_URL_FRAGMENTS = ['your-project', 'tu_project', 'xxxxxxxx', 'tu-proyecto'];
const PLACEHOLDER_KEY_FRAGMENTS = ['your-anon-key', 'eyj...', 'tu_anon'];

function looksLikePlaceholder(value: string, fragments: string[]): boolean {
  const lower = value.toLowerCase();
  return fragments.some((f) => lower.includes(f)) || value.length < 8;
}

export function getSupabaseConfigHint(): string | null {
  const url = env.supabaseUrl;
  const key = env.supabaseAnonKey;

  if (!url && !key) {
    return 'Crea o completa frontend/.env con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY (ver Supabase → Settings → API). Luego reinicia con: npx expo start -c';
  }
  if (!url) {
    return 'Falta EXPO_PUBLIC_SUPABASE_URL en frontend/.env (Project URL en Supabase → API).';
  }
  if (!key) {
    return 'Falta EXPO_PUBLIC_SUPABASE_ANON_KEY en frontend/.env (clave anon public en Supabase → API).';
  }
  if (looksLikePlaceholder(url, PLACEHOLDER_URL_FRAGMENTS) || !url.includes('supabase.co')) {
    return 'EXPO_PUBLIC_SUPABASE_URL en frontend/.env no es válida. Debe ser como: https://abcdefgh.supabase.co';
  }
  if (looksLikePlaceholder(key, PLACEHOLDER_KEY_FRAGMENTS) || !key.startsWith('eyJ')) {
    return 'EXPO_PUBLIC_SUPABASE_ANON_KEY en frontend/.env no es válida. Copia la clave "anon public" completa desde Supabase.';
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigHint() === null;
}
