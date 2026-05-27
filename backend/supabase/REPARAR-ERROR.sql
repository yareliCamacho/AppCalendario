-- =============================================================================
-- REPARAR: "relation public.couple_members does not exist"
-- Ejecutar en Supabase → SQL Editor → New query → Run (paso a paso)
-- =============================================================================

-- PASO 0: Ver qué tablas ya existen (solo lectura)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Si NO ves couple_members, continúa con PASO 1.
-- Si ves error al crear tablas que "already exist", salta al PASO 2.

-- =============================================================================
-- PASO 1: Crear SOLO el esquema base (copia TODO el archivo y Run):
--   backend/supabase/migrations/001_schema.sql
-- (Archivo corregido: user_couple_ids va DESPUÉS de couple_members)
-- =============================================================================

-- =============================================================================
-- PASO 2: Tras PASO 1 exitoso, verifica:
-- =============================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'couple_members';

-- Debe devolver 1 fila: couple_members

-- =============================================================================
-- PASO 3: Ejecuta UNO POR UNO (nueva query cada vez, Run tras cada archivo):
--   002_rls_policies.sql
--   003_storage.sql
--   005_auth_trigger.sql
--   seed.sql
--   004_realtime.sql  (si falla "already member", ignora y activa Realtime en UI)
-- =============================================================================
