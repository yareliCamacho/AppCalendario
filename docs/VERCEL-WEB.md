# Web auxiliar en Vercel

Versión **web** de la app **Nosotros** (misma UI y Supabase que el móvil), pensada para probar, compartir con la pareja en el PC o usar el calendario sin instalar la app.

No sustituye la app nativa (EAS) ni el backend (Supabase).

## Qué incluye

- Login, registro y vinculación por **código de 6 dígitos** (sin escáner QR en navegador).
- Pestañas: inicio, calendario, días juntos, metas, deseos, configuración.
- Calendario, recordatorios, recuerdos del día, ubicaciones (búsqueda Nominatim) y fotos (galería + recorte en modal).
- Mapas: vista **OpenStreetMap** embebida (sin pin arrastrable; usa la búsqueda de lugar).

## Limitaciones en web

| Función | Web |
|--------|-----|
| Notificaciones push | No |
| Escanear QR | No (código manual en «Vincular pareja») |
| Cámara en vivo para fotos | No (solo galería / archivo) |
| Mapa táctil para mover pin | No (búsqueda de lugar) |
| Geolocalización GPS automática | Depende del navegador |

## Despliegue en Vercel

1. Conecta el repo en [vercel.com](https://vercel.com) (rama `main`).
2. **Root Directory**: deja la raíz del monorepo (`.`) — `vercel.json` ya apunta a `frontend/`.
3. Variables de entorno (Production y Preview):

   | Variable | Valor |
   |----------|--------|
   | `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública |

4. Deploy. La build ejecuta `npm run build:web` y publica `frontend/dist`.

## Build local

```bash
cd frontend
npm install --legacy-peer-deps
# Opcional: frontend/.env con EXPO_PUBLIC_SUPABASE_*
npm run build:web
npx serve dist
```

Desarrollo en navegador:

```bash
cd frontend
npm run web
```

## Supabase

Auth y RLS son los mismos que en móvil. En **Authentication → URL Configuration**, añade la URL de Vercel (p. ej. `https://tu-app.vercel.app`) en **Redirect URLs** si usas enlaces mágicos o OAuth.

Aplica migraciones `backend/supabase/migrations/` en tu proyecto remoto (ver [SUPABASE-REMOTO.md](SUPABASE-REMOTO.md)).

## Arquitectura

```text
Móvil (EAS)     →  stores
Web (Vercel)    →  frontend/dist  (expo export -p web)
Backend         →  Supabase remoto
```
