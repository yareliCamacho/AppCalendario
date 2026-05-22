# Quickstart: Aplicación móvil para parejas

**Feature**: `001-couple-mobile-app` | **Branch**: `001-couple-mobile-app`

## Prerequisites

- Node.js 20 LTS
- npm o pnpm
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Cuenta Supabase (proyecto)
- Google Cloud: Maps SDK + Places API (keys restringidas)
- Firebase project (FCM) para push
- (Opcional) OpenAI o Gemini API key en EAS Secrets

## 1. Supabase project

```bash
# En la raíz del repo (cuando exista carpeta supabase/)
supabase login
supabase init
supabase link --project-ref <YOUR_PROJECT_REF>
```

Aplicar esquema:

```bash
supabase db push
# o copiar specs/001-couple-mobile-app/contracts/schema.sql + RLS manual
```

Habilitar en Dashboard:

- **Auth**: Email provider
- **Realtime**: tablas listadas en `data-model.md`
- **Storage**: bucket `couple-photos` (privado)
- **Database Webhook** (opcional): `notifications` INSERT → Edge Function push

Seed mensajes románticos:

```bash
supabase db execute -f supabase/seed.sql
```

## 2. Environment variables

Crear `.env` (no commitear secretos):

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...   # restringir por app id
# EAS Secrets (no en .env local para producción):
# AI_PROVIDER=openai|gemini
# OPENAI_API_KEY= / GEMINI_API_KEY=
# FCM configurado vía expo-notifications + google-services.json / GoogleService-Info.plist
```

## 3. Expo app (scaffold — post `/speckit.implement`)

```bash
npx create-expo-app@latest . --template tabs
# Instalar dependencias del plan.md
npx expo install expo-router @supabase/supabase-js react-native-maps \
  expo-image-picker expo-image-manipulator expo-notifications \
  expo-camera @tanstack/react-query zod
```

Estructura objetivo: ver `plan.md` → Project Structure (`app/`, `src/`).

## 4. Run locally

```bash
npx expo start
# iOS: i
# Android: a
```

Probar flujo mínimo:

1. Registro dos usuarios (dos simuladores o dispositivo + emulador).
2. Usuario A crea pareja y código; Usuario B `join_couple_by_code`.
3. Crear evento + subir foto; verificar Realtime en segundo dispositivo.

## 5. Tests

```bash
npm test                    # unit (hooks, services)
npm run test:integration    # Supabase local (cuando esté configurado)
# E2E Maestro: tests/e2e/pairing.yaml
```

## 6. Build (EAS)

```bash
npm install -g eas-cli
eas build:configure
eas secret:create --name OPENAI_API_KEY --value ...
eas build --platform all
```

## Key paths

| Documento | Ruta |
|-----------|------|
| Spec | `specs/001-couple-mobile-app/spec.md` |
| Plan | `specs/001-couple-mobile-app/plan.md` |
| Data model | `specs/001-couple-mobile-app/data-model.md` |
| SQL schema | `specs/001-couple-mobile-app/contracts/schema.sql` |
| RLS | `specs/001-couple-mobile-app/contracts/rls-policies.md` |

## Next command

```text
/speckit.tasks
```

Genera `tasks.md` ordenado por historias P1–P7.
