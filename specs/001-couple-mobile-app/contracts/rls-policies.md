# Row Level Security Policies

**Feature**: `001-couple-mobile-app`

Todas las tablas con `couple_id` (o derivadas vía `event_id`) usan `public.user_couple_ids()` salvo catálogos públicos de lectura.

## Enable RLS

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pair_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romance_messages ENABLE ROW LEVEL SECURITY;
```

## users

| Policy | Operation | Rule |
|--------|-----------|------|
| users_select_own | SELECT | `id = auth.uid()` |
| users_select_partner | SELECT | `id IN (SELECT user_id FROM couple_members WHERE couple_id IN (SELECT user_couple_ids()))` |
| users_update_own | UPDATE | `id = auth.uid()` |

## couples

| Policy | Operation | Rule |
|--------|-----------|------|
| couples_member_all | ALL | `id IN (SELECT user_couple_ids())` |

## couple_members

| Policy | Operation | Rule |
|--------|-----------|------|
| members_select | SELECT | `couple_id IN (SELECT user_couple_ids())` |
| members_insert_owner | INSERT | `user_id = auth.uid()` AND role = 'owner'` (solo creación inicial vía service) |

## pair_codes

| Policy | Operation | Rule |
|--------|-----------|------|
| codes_select_own_couple | SELECT | `couple_id IN (SELECT user_couple_ids())` |
| codes_insert_member | INSERT | `couple_id IN (SELECT user_couple_ids())` AND `created_by = auth.uid()` |

## events, wishes, goals, milestones

| Policy | Operation | Rule |
|--------|-----------|------|
| `{table}_member_all` | ALL | `couple_id IN (SELECT user_couple_ids())` |

## event_locations

| Policy | Operation | Rule |
|--------|-----------|------|
| locations_member_all | ALL | `event_id IN (SELECT id FROM events WHERE couple_id IN (SELECT user_couple_ids()))` |

## event_photos

| Policy | Operation | Rule |
|--------|-----------|------|
| photos_member_all | ALL | `couple_id IN (SELECT user_couple_ids())` |

## notifications

| Policy | Operation | Rule |
|--------|-----------|------|
| notifications_select_own | SELECT | `user_id = auth.uid()` |
| notifications_update_own | UPDATE | `user_id = auth.uid()` |
| notifications_insert_member | INSERT | `couple_id IN (SELECT user_couple_ids())` AND `actor_id = auth.uid()` |

## themes, romance_messages

| Policy | Operation | Rule |
|--------|-----------|------|
| themes_read_all | SELECT | `true` |
| romance_read_all | SELECT | `true` |

## Storage (`couple-photos` bucket)

```sql
-- SELECT: path starts with couple_id user belongs to
(storage.foldername(name))[1] IN (
  SELECT couple_id::text FROM couple_members WHERE user_id = auth.uid()
)

-- INSERT/UPDATE/DELETE: same + uploaded_by check in app layer
```

## Client validation (repositories)

Antes de cada query/mutación, `BaseRepository.assertCoupleAccess(coupleId)`:

1. Obtiene `coupleId` de sesión (`useCouple` / `CoupleContext`).
2. Verifica membresía con `couple_members` (caché React Query).
3. Si falla → error `FORBIDDEN` sin llamar Supabase.

RLS es la última línea de defensa; el cliente no confía solo en UI.
