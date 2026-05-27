-- =============================================================================
-- REPARAR pareja + fechas (ejecutar TODO en Supabase → SQL Editor → Run)
-- Incluye políticas RLS (006) + función RPC (007)
-- =============================================================================

-- --- 006: políticas RLS (idempotente: se puede ejecutar varias veces) ---
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

CREATE POLICY couples_insert_authenticated ON public.couples
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS events_member ON public.events;
CREATE POLICY events_member ON public.events
  FOR ALL
  USING (couple_id IN (SELECT public.user_couple_ids()))
  WITH CHECK (couple_id IN (SELECT public.user_couple_ids()));

-- --- 007: RPC (recomendado; evita fallo de insert().select()) ---
CREATE OR REPLACE FUNCTION public.create_couple_for_current_user(p_theme_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_existing_couple_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT couple_id INTO v_existing_couple_id
  FROM public.couple_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_existing_couple_id IS NOT NULL THEN
    RETURN v_existing_couple_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()) THEN
    INSERT INTO public.users (id, email, display_name)
    SELECT
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1))
    FROM auth.users au
    WHERE au.id = auth.uid()
    ON CONFLICT (id) DO NOTHING;
  END IF;

  INSERT INTO public.couples (tagline, relationship_start_date, theme_id)
  VALUES ('Nosotros', CURRENT_DATE, p_theme_id)
  RETURNING id INTO v_couple_id;

  INSERT INTO public.couple_members (couple_id, user_id, role)
  VALUES (v_couple_id, auth.uid(), 'owner');

  RETURN v_couple_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_couple_for_current_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_couple_for_current_user(uuid) TO authenticated;

-- Verificación
SELECT 'couples policies' AS check_type, policyname, cmd
FROM pg_policies
WHERE tablename = 'couples' AND schemaname = 'public'
UNION ALL
SELECT 'rpc', proname, 'EXECUTE'
FROM pg_proc
WHERE proname = 'create_couple_for_current_user';
