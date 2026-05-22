# Nosotros — App móvil para parejas

React Native + Expo + TypeScript + Supabase.

## Requisitos

- Node.js 20+
- Cuenta [Supabase](https://supabase.com)
- (Opcional) Google Maps API, OpenAI/Gemini, FCM para push en producción

## Guías de despliegue

1. **[Supabase remoto](docs/SUPABASE-REMOTO.md)** — base de datos, Auth, RLS, Storage, Realtime  
2. **[EAS Build](docs/EAS-BUILD.md)** — APK/IPA para Android e iOS  

## Configuración local

1. Copia `.env.example` a `.env` y completa:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

2. Aplica migraciones en Supabase (SQL Editor o CLI):

```bash
supabase db push
# o ejecuta en orden: supabase/migrations/*.sql y supabase/seed.sql
```

3. Instala y arranca:

```bash
npm install --legacy-peer-deps
npm run generate-assets
npx expo start
```

4. Iconos: `npm run generate-assets` crea placeholders en `assets/`. Sustitúyelos por diseños finales antes de publicar.

## Estructura

- `app/` — pantallas (Expo Router)
- `src/components`, `src/hooks`, `src/services`, `src/repositories` — arquitectura en capas
- `supabase/` — migraciones, seed, Edge Function push

## Pantallas

Inicio · Calendario · Conteo de días · Deseos · Metas · Configuración

## Tests

```bash
npm test
npm run typecheck
```

## Documentación de feature

Ver `specs/001-couple-mobile-app/` (spec, plan, tasks).
