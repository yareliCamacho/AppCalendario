# Nosotros — App móvil para parejas

Monorepo: **frontend** (Expo + React Native) y **backend** (Supabase: SQL, RLS, Storage, Edge Functions).

## Requisitos

- Node.js 20+
- Cuenta [Supabase](https://supabase.com)
- (Opcional) OpenAI/Gemini, FCM para push en producción. **Mapas y búsqueda de lugares son gratis** (ver [docs/MAPAS-GRATIS.md](docs/MAPAS-GRATIS.md))

## Guías de despliegue

1. **[Supabase remoto](docs/SUPABASE-REMOTO.md)** — base de datos, Auth, RLS, Storage, Realtime  
2. **[EAS Build](docs/EAS-BUILD.md)** — APK/IPA para Android e iOS  
3. **[Web auxiliar en Vercel](docs/VERCEL-WEB.md)** — misma app en el navegador (calendario, recuerdos, metas)  

## Configuración local

### Frontend (app móvil)

1. Configura Supabase en **`frontend/.env`** (o deja el `.env` en la raíz del repo; la app lee ambos):

Copia `frontend/.env.example` → `frontend/.env` si hace falta, y completa:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

2. Si en la raíz queda `package-lock.json`, muévelo: doble clic en `MOVE-LOCK.cmd` (o `move package-lock.json frontend\`).

3. Instala y arranca (desde `frontend/` o desde la raíz con `npm start`):

```bash
cd frontend
npm install --legacy-peer-deps
npm run generate-assets
npx expo start
```

Desde la raíz del repo también puedes usar:

```bash
npm install --legacy-peer-deps --prefix frontend
npm start
```

4. Iconos: `npm run generate-assets` crea placeholders en `frontend/assets/`.

### Backend (Supabase)

Aplica migraciones desde `backend/`:

```bash
cd backend
supabase link --project-ref TU_PROJECT_REF
supabase db push
# o ejecuta backend/supabase/migrations/*.sql y seed.sql en SQL Editor
```

SQL unificado para pegar en el editor:

```bash
npm run supabase:bundle-sql
# genera backend/supabase/remote-setup.sql
```

## Estructura

```text
frontend/
├── app/          # pantallas (Expo Router)
├── src/          # components, hooks, services, repositories
├── assets/
└── package.json

backend/
├── supabase/     # migraciones, seed, Edge Function push
└── scripts/      # build-remote-setup.ps1
```

## Pantallas

Inicio · Calendario · Conteo de días · Deseos · Metas · Configuración

## Tests

```bash
npm test
npm run typecheck
```

## Documentación de feature

Ver `specs/001-couple-mobile-app/` (spec, plan, tasks).
