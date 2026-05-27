-- Fix RLS: permitir crear un espacio de pareja nuevo (couples + primer miembro)
-- Error: "new row violates row-level security policy for table couples"
-- Causa: couples_member_all exigía ya ser miembro para INSERT.

DROP POLICY IF EXISTS couples_member_all ON public.couples;
DROP POLICY IF EXISTS couples_select_member ON public.couples;
DROP POLICY IF EXISTS couples_update_member ON public.couples;
DROP POLICY IF EXISTS couples_delete_member ON public.couples;
DROP POLICY IF EXISTS couples_insert_authenticated ON public.couples;

CREATE POLICY couples_select_member ON public.couples
  FOR SELECT
  USING (id IN (SELECT public.user_couple_ids()));

CREATE POLICY couples_update_member ON public.couples
  FOR UPDATE
  USING (id IN (SELECT public.user_couple_ids()))
  WITH CHECK (id IN (SELECT public.user_couple_ids()));

CREATE POLICY couples_delete_member ON public.couples
  FOR DELETE
  USING (id IN (SELECT public.user_couple_ids()));

-- Cualquier usuario autenticado puede crear SU primer espacio (antes de ser miembro)
CREATE POLICY couples_insert_authenticated ON public.couples
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Reforzar INSERT en couple_members: solo como uno mismo y sin pareja previa
DROP POLICY IF EXISTS members_insert_self ON public.couple_members;

CREATE POLICY members_insert_self ON public.couple_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.couple_members existing
      WHERE existing.user_id = auth.uid()
    )
  );

-- Perfil propio al registrarse (por si el trigger falló)
DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Events: asegurar WITH CHECK en INSERT/UPDATE
DROP POLICY IF EXISTS events_member ON public.events;

CREATE POLICY events_member ON public.events
  FOR ALL
  USING (couple_id IN (SELECT public.user_couple_ids()))
  WITH CHECK (couple_id IN (SELECT public.user_couple_ids()));
