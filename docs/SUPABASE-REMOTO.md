# Supabase remoto — Guía paso a paso

Proyecto: **Nosotros** (`couple-app`)

## Parte A: Crear proyecto en Supabase

1. Entra a [https://supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Elige organización, nombre (ej. `nosotros-app`), contraseña de DB y región cercana a tus usuarios.
3. Espera a que el proyecto esté **Active**.

## Parte B: Obtener credenciales

En **Project Settings → API**:

| Valor | Uso en `.env` |
|-------|----------------|
| Project URL | `EXPO_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

Copia `.env.example` → `.env` y pega los valores:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

> La `service_role` key **no** va en la app móvil. Solo en Edge Functions o scripts de servidor.

## Parte C: Auth (correo + contraseña)

**Authentication → Providers → Email**:

- Activar **Email**
- (Recomendado para pruebas) desactivar **Confirm email** si quieres registro instantáneo
- Guardar

## Parte D: Aplicar esquema SQL

### Opción 1 — SQL Editor (más simple)

1. **SQL Editor → New query**
2. Ejecuta en este orden (cada archivo por separado, **Run** tras cada uno):
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_storage.sql`
   - `supabase/migrations/005_auth_trigger.sql`
   - `supabase/seed.sql`
3. Para **Realtime** (Parte E), usa el Dashboard o `004_realtime.sql` si no da error.

### Opción 2 — Supabase CLI

```powershell
npm install -g supabase
supabase login
cd C:\Users\yareli.camacho\Downloads\my-Project
supabase link --project-ref TU_PROJECT_REF
supabase db push
supabase db execute -f supabase/seed.sql
```

`TU_PROJECT_REF` está en la URL del dashboard: `https://supabase.com/dashboard/project/<PROJECT_REF>`.

Script auxiliar (genera SQL unificado):

```powershell
.\scripts\build-remote-setup.ps1
# Luego pega supabase/remote-setup.sql en SQL Editor
```

## Parte E: Realtime

**Database → Publications → supabase_realtime** (o **Realtime** en tablas):

Activa Realtime para:

- `events`
- `event_photos`
- `event_locations`
- `wishes`
- `goals`
- `notifications`
- `couple_members`

O ejecuta `supabase/migrations/004_realtime.sql` (si falla “already member”, ignora: ya está activo).

## Parte F: Storage

Tras `003_storage.sql` debe existir el bucket **`couple-photos`** (privado).

Verifica en **Storage → Buckets**.

## Parte G: Verificación rápida

En SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY 1;
```

Debes ver: `users`, `couples`, `couple_members`, `events`, `wishes`, `goals`, etc.

En la app:

```powershell
npm run generate-assets
npx expo start
```

1. Registro usuario A  
2. Invitar con código 6 dígitos  
3. Registro usuario B → unirse con código  
4. Crear fecha / deseo en A → debe verse en B (Realtime)

## Parte H: Push notifications (opcional, post-MVP)

1. Despliega Edge Function `supabase/functions/send-push`
2. **Database → Webhooks** → INSERT en `notifications` → llama a la función
3. Configura FCM en Expo (ver `docs/EAS-BUILD.md`)

## Solución de problemas

| Error | Acción |
|-------|--------|
| `relation already exists` | Esquema ya aplicado; salta 001 o usa proyecto nuevo |
| `policy already exists` | Ejecuta solo migraciones faltantes |
| Registro sin fila en `users` | Re-ejecuta `005_auth_trigger.sql` |
| RLS bloquea lectura | Usuario debe estar en `couple_members` |
| Fotos no suben | Bucket `couple-photos` + políticas storage |

## Checklist

- [ ] Proyecto Supabase creado  
- [ ] `.env` con URL y anon key  
- [ ] Email auth habilitado  
- [ ] Migraciones 001–005 + seed  
- [ ] Realtime en 7 tablas  
- [ ] Bucket `couple-photos`  
- [ ] Prueba registro + vinculación 2 usuarios  

Cuando todo esté ✅, continúa con **`docs/EAS-BUILD.md`**.
