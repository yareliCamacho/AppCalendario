-- Crear pareja vía RPC (bypass RLS de forma controlada).
-- Corrige insert().select() que falla: el SELECT exige ser miembro antes de insertar couple_members.

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
