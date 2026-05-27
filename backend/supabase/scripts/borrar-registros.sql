-- =============================================================================
-- Borrar registros de usuarios / parejas (desarrollo y pruebas)
-- Ejecutar en Supabase → SQL Editor → New query → Run
-- =============================================================================
-- IMPORTANTE:
-- - No borres romance_messages ni themes si quieres conservar el catálogo (seed).
-- - Las fotos en Storage (bucket couple-photos) NO se borran solas con este SQL.
-- - Para borrar un usuario de Auth usa la Opción A o C (auth.users).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- OPCIÓN A — Un solo usuario por correo (recomendado)
-- Sustituye el correo y ejecuta TODO el bloque.
-- -----------------------------------------------------------------------------

-- 1) Ver el usuario
SELECT id, email, display_name FROM public.users WHERE email = 'tu@correo.com';

-- 2) Borrar en Auth (esto elimina public.users por ON DELETE CASCADE)
--    En el Dashboard es más fácil: Authentication → Users → ⋮ → Delete user
--    Si usas SQL, necesitas rol de servicio (SQL Editor del proyecto suele funcionar):

-- DELETE FROM auth.users WHERE email = 'tu@correo.com';

-- Si la pareja quedó vacía u huérfana, opcional:
-- DELETE FROM public.couples
-- WHERE id NOT IN (SELECT DISTINCT couple_id FROM public.couple_members);

-- -----------------------------------------------------------------------------
-- OPCIÓN — Un solo día del calendario (por fecha ISO)
-- Sustituye la fecha y el couple_id (Table Editor → couples / events)
-- -----------------------------------------------------------------------------

-- Ver eventos de un día:
-- SELECT id, title, event_date, couple_id FROM public.events
-- WHERE event_date = '2025-05-26';

-- Borrar un evento (en la app también limpia Storage y notificaciones):
-- DELETE FROM public.events WHERE id = 'UUID-DEL-EVENTO';
-- En cascada: event_photos, event_locations (ver 001_schema.sql ON DELETE CASCADE)

-- -----------------------------------------------------------------------------
-- OPCIÓN B — Limpiar TODOS los datos de la app (usuarios, parejas, eventos…)
-- Mantiene themes y romance_messages del seed.
-- -----------------------------------------------------------------------------

-- Descomenta y ejecuta en orden (una query o todo junto):

/*
DELETE FROM public.notifications;
DELETE FROM public.event_photos;
DELETE FROM public.event_locations;
DELETE FROM public.events;
DELETE FROM public.wishes;
DELETE FROM public.goals;
DELETE FROM public.milestones;
DELETE FROM public.pair_codes;
DELETE FROM public.couple_members;
DELETE FROM public.couples;
DELETE FROM public.users;
-- Luego borra usuarios en: Authentication → Users (seleccionar todos → delete)
-- O desde SQL (si tienes permisos):
-- DELETE FROM auth.users;
*/

-- -----------------------------------------------------------------------------
-- OPCIÓN C — Ver qué hay antes de borrar
-- -----------------------------------------------------------------------------

SELECT 'users' AS tabla, COUNT(*) FROM public.users
UNION ALL SELECT 'couples', COUNT(*) FROM public.couples
UNION ALL SELECT 'couple_members', COUNT(*) FROM public.couple_members
UNION ALL SELECT 'events', COUNT(*) FROM public.events
UNION ALL SELECT 'auth.users', COUNT(*) FROM auth.users;

-- -----------------------------------------------------------------------------
-- OPCIÓN D — Borrar solo registros de viajes (milestones type = 'last_trip')
-- -----------------------------------------------------------------------------
-- 1) Ver cuántos viajes hay (global o por pareja):
-- SELECT COUNT(*) AS total_viajes FROM public.milestones WHERE type = 'last_trip';
-- SELECT COUNT(*) AS total_viajes FROM public.milestones
-- WHERE type = 'last_trip' AND couple_id = 'UUID_DE_LA_PAREJA';
--
-- 2) Borrar viajes de una pareja específica:
-- DELETE FROM public.milestones
-- WHERE type = 'last_trip' AND couple_id = 'UUID_DE_LA_PAREJA';
--
-- 3) Borrar TODOS los viajes de todas las parejas:
-- DELETE FROM public.milestones
-- WHERE type = 'last_trip';
