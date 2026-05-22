# Data Model: Aplicación móvil para parejas

**Feature**: `001-couple-mobile-app` | **Date**: 2026-05-22

## Entity Relationship (logical)

```text
users ──┬── couple_members ──┬── couples
        │                    ├── events ──┬── event_locations
        │                    │            └── event_photos
        │                    ├── wishes
        │                    ├── goals
        │                    ├── notifications
        │                    ├── milestones
        │                    └── themes (FK theme_id on couples)
        └── pair_codes (created_by → users)

romance_messages (catalog, no FK)
```

## Tables

### users

Perfil público vinculado a Supabase Auth.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | = `auth.users.id` |
| email | text UNIQUE | |
| display_name | text | |
| avatar_url | text | Storage path o URL |
| push_token | text nullable | FCM/Expo token |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### couples

Espacio compartido de pareja (máx. 2 miembros).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| display_photo_path | text nullable | foto “Nosotros” |
| tagline | text default 'Nosotros' | |
| relationship_start_date | date nullable | días juntos |
| theme_id | uuid FK → themes | |
| home_message_id | uuid FK → romance_messages nullable | |
| home_message_shown_at | timestamptz nullable | rotación 3 días |
| created_at | timestamptz | |

### couple_members

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| couple_id | uuid FK → couples | |
| user_id | uuid FK → users | |
| role | text | `owner` \| `partner` |
| joined_at | timestamptz | |
| UNIQUE (couple_id, user_id) | | |

**Constraint**: máximo 2 filas por `couple_id` (trigger `enforce_couple_member_limit`).

### pair_codes

Códigos QR / 6 dígitos para vincular.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| couple_id | uuid FK | pareja que invita |
| code | char(6) UNIQUE | |
| qr_payload | text | deep link o JSON |
| created_by | uuid FK → users | |
| expires_at | timestamptz | +24 h |
| consumed_at | timestamptz nullable | |
| consumed_by | uuid FK → users nullable | |

### events

Fechas especiales / citas en calendario.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| couple_id | uuid FK | |
| event_date | date | día calendario |
| title | text | |
| description | text nullable | |
| color | text | hex |
| icon | text | nombre ícono |
| reminder_days | int | CHECK 1–15 |
| romantic_note | text nullable | texto recuerdo |
| created_by | uuid FK → users | |
| created_at | timestamptz | |

### event_locations

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| event_id | uuid FK → events | |
| name | text | |
| latitude | double precision nullable | |
| longitude | double precision nullable | |
| description | text nullable | |
| show_on_map | boolean default true | |
| place_id | text nullable | Google place id |

### event_photos

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| event_id | uuid FK → events | |
| couple_id | uuid FK | denormalizado para RLS/Storage |
| storage_path | text | bucket path |
| location_id | uuid FK → event_locations nullable | |
| sort_order | int | |
| uploaded_by | uuid FK → users | |
| created_at | timestamptz | |

### wishes

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| couple_id | uuid FK | |
| type | text | `place` \| `purchase` |
| title | text | |
| description | text nullable | |
| photo_path | text nullable | |
| status | text | `pending` \| `fulfilled` |
| fulfilled_at | timestamptz nullable | |
| created_by | uuid FK | |

### goals

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| couple_id | uuid FK | |
| title | text | |
| description | text nullable | |
| target_amount | numeric(12,2) | |
| saved_amount | numeric(12,2) default 0 | |
| currency | text default 'MXN' | |
| created_by | uuid FK | |

**Computed in app/service**: `progress_percent = MIN(100, saved/target*100)`.

### notifications

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| couple_id | uuid FK | |
| user_id | uuid FK | destinatario |
| actor_id | uuid FK → users | quien generó |
| type | text | `event` \| `photo` \| `location` \| `wish` \| `goal` \| `memory` |
| title | text | |
| body | text | |
| entity_id | uuid nullable | |
| read_at | timestamptz nullable | |
| push_sent_at | timestamptz nullable | |
| created_at | timestamptz | |

### themes

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| primary_blue | text | #B3D9FF |
| primary_pink | text | #FFB3D9 |
| is_default | boolean | |

### milestones (extensión spec FR-018)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| couple_id | uuid FK | |
| type | text | `first_meeting` \| `first_date` \| `first_trip` \| `last_trip` |
| title | text | |
| milestone_date | date | |
| description | text nullable | |
| photo_path | text nullable | |

### romance_messages (catálogo)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| body | text | mensaje bonito o frase |
| kind | text | `home` \| `calendar_quote` |
| locale | text default 'es' | |

## State Transitions

### pair_codes

`active` (expires_at > now, consumed_at null) → `consumed` | `expired`

### wishes

`pending` → `fulfilled` (sets fulfilled_at, UI corazón + sección verde)

### couple_members

Usuario sin pareja → crea `couples` + `owner` → genera `pair_codes` → partner `join` → 2 miembros (bloquea más joins)

## Validation Rules (business)

| Rule | Enforcement |
|------|-------------|
| ≤2 miembros | DB trigger + RPC |
| reminder_days 1–15 | CHECK constraint |
| Código 6 dígitos único activo | UNIQUE partial index |
| Solo miembros leen/escriben couple data | RLS |
| Fotos solo en bucket con prefix couple_id | Storage policy |
| Monto ahorrado ≥ 0 | CHECK; UI cap visual 100% |

## RLS Helper

Función SQL `user_couple_ids()` → set de `couple_id` donde `auth.uid()` es miembro. Todas las políticas: `couple_id IN (SELECT user_couple_ids())`.

## Storage Layout

```text
couple-photos/
  {couple_id}/
    events/{event_id}/{photo_id}.jpg
    wishes/{wish_id}.jpg
    milestones/{milestone_id}.jpg
    profile/couple.jpg
```

## Realtime Publications

Tablas en publication `supabase_realtime`: `events`, `event_photos`, `event_locations`, `wishes`, `goals`, `notifications`, `couple_members`.

## Indexes (recommended)

- `events (couple_id, event_date)`
- `event_photos (event_id, sort_order)`
- `notifications (user_id, read_at, created_at DESC)`
- `pair_codes (code) WHERE consumed_at IS NULL`
- `couple_members (user_id)`
