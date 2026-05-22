-- Nosotros - Setup remoto unificado
-- Generado: 2026-05-22T16:39:01.7243205-06:00
-- Ejecutar en Supabase SQL Editor (puede tardar unos segundos)


-- ========== 001_schema.sql ==========

-- Couple App â€” initial schema (Supabase PostgreSQL)
-- Feature: 001-couple-mobile-app
-- Apply via: supabase db push / migration

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- themes
CREATE TABLE public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  primary_blue text NOT NULL DEFAULT '#B3D9FF',
  primary_pink text NOT NULL DEFAULT '#FFB3D9',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- users (profile; id = auth.users.id)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  push_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- romance_messages (catalog)
CREATE TABLE public.romance_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('home', 'calendar_quote')),
  locale text NOT NULL DEFAULT 'es'
);

-- couples
CREATE TABLE public.couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_photo_path text,
  tagline text NOT NULL DEFAULT 'Nosotros',
  relationship_start_date date,
  theme_id uuid REFERENCES public.themes(id),
  home_message_id uuid REFERENCES public.romance_messages(id),
  home_message_shown_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- couple_members
CREATE TABLE public.couple_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'partner')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (couple_id, user_id)
);

CREATE OR REPLACE FUNCTION public.enforce_couple_member_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.couple_members WHERE couple_id = NEW.couple_id) > 2 THEN
    RAISE EXCEPTION 'couple_member_limit_exceeded: maximum 2 members per couple';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_couple_member_limit
  BEFORE INSERT ON public.couple_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_couple_member_limit();

-- Helper: couple IDs for current user (despuÃ©s de crear couple_members)
CREATE OR REPLACE FUNCTION public.user_couple_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid();
$$;

-- pair_codes
CREATE TABLE public.pair_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  code char(6) NOT NULL,
  qr_payload text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.users(id),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code)
);

CREATE INDEX idx_pair_codes_active ON public.pair_codes (code)
  WHERE consumed_at IS NULL;

-- events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  title text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#FFB3D9',
  icon text NOT NULL DEFAULT 'heart',
  reminder_days int NOT NULL CHECK (reminder_days BETWEEN 1 AND 15),
  romantic_note text,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_couple_date ON public.events (couple_id, event_date);

-- event_locations
CREATE TABLE public.event_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  latitude double precision,
  longitude double precision,
  description text,
  show_on_map boolean NOT NULL DEFAULT true,
  place_id text
);

-- event_photos
CREATE TABLE public.event_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  location_id uuid REFERENCES public.event_locations(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  uploaded_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_photos_event ON public.event_photos (event_id, sort_order);

-- wishes
CREATE TABLE public.wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('place', 'purchase')),
  title text NOT NULL,
  description text,
  photo_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled')),
  fulfilled_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- goals
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_amount numeric(12,2) NOT NULL CHECK (target_amount > 0),
  saved_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  currency text NOT NULL DEFAULT 'MXN',
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- milestones
CREATE TABLE public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'first_meeting', 'first_date', 'first_trip', 'last_trip'
  )),
  title text NOT NULL,
  milestone_date date NOT NULL,
  description text,
  photo_path text,
  UNIQUE (couple_id, type)
);

-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id),
  actor_id uuid NOT NULL REFERENCES public.users(id),
  type text NOT NULL CHECK (type IN (
    'event', 'photo', 'location', 'wish', 'goal', 'memory'
  )),
  title text NOT NULL,
  body text NOT NULL,
  entity_id uuid,
  read_at timestamptz,
  push_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, created_at DESC);

-- RPC: join couple by 6-digit code
CREATE OR REPLACE FUNCTION public.join_couple_by_code(p_code char(6))
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pair public.pair_codes%ROWTYPE;
  v_member_count int;
  v_couple_id uuid;
BEGIN
  SELECT * INTO v_pair FROM public.pair_codes
  WHERE code = p_code AND consumed_at IS NULL AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired_code';
  END IF;

  IF EXISTS (SELECT 1 FROM public.couple_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'user_already_in_couple';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM public.couple_members
  WHERE couple_id = v_pair.couple_id;

  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'couple_full';
  END IF;

  INSERT INTO public.couple_members (couple_id, user_id, role)
  VALUES (v_pair.couple_id, auth.uid(), 'partner');

  UPDATE public.pair_codes
  SET consumed_at = now(), consumed_by = auth.uid()
  WHERE id = v_pair.id;

  RETURN v_pair.couple_id;
END;
$$;


-- ========== 002_rls_policies.sql ==========

-- RLS policies
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

CREATE POLICY users_select_own ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_select_partner ON public.users FOR SELECT
  USING (id IN (SELECT user_id FROM public.couple_members WHERE couple_id IN (SELECT public.user_couple_ids())));
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (id = auth.uid());

CREATE POLICY couples_member_all ON public.couples FOR ALL
  USING (id IN (SELECT public.user_couple_ids()));

CREATE POLICY members_select ON public.couple_members FOR SELECT
  USING (couple_id IN (SELECT public.user_couple_ids()));
CREATE POLICY members_insert_self ON public.couple_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY codes_select ON public.pair_codes FOR SELECT
  USING (couple_id IN (SELECT public.user_couple_ids()));
CREATE POLICY codes_insert ON public.pair_codes FOR INSERT
  WITH CHECK (couple_id IN (SELECT public.user_couple_ids()) AND created_by = auth.uid());

CREATE POLICY events_member ON public.events FOR ALL
  USING (couple_id IN (SELECT public.user_couple_ids()));
CREATE POLICY wishes_member ON public.wishes FOR ALL
  USING (couple_id IN (SELECT public.user_couple_ids()));
CREATE POLICY goals_member ON public.goals FOR ALL
  USING (couple_id IN (SELECT public.user_couple_ids()));
CREATE POLICY milestones_member ON public.milestones FOR ALL
  USING (couple_id IN (SELECT public.user_couple_ids()));
CREATE POLICY photos_member ON public.event_photos FOR ALL
  USING (couple_id IN (SELECT public.user_couple_ids()));

CREATE POLICY locations_member ON public.event_locations FOR ALL
  USING (event_id IN (SELECT id FROM public.events WHERE couple_id IN (SELECT public.user_couple_ids())));

CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY notifications_insert ON public.notifications FOR INSERT
  WITH CHECK (couple_id IN (SELECT public.user_couple_ids()) AND actor_id = auth.uid());

CREATE POLICY themes_read ON public.themes FOR SELECT USING (true);
CREATE POLICY romance_read ON public.romance_messages FOR SELECT USING (true);


-- ========== 003_storage.sql ==========

INSERT INTO storage.buckets (id, name, public)
VALUES ('couple-photos', 'couple-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY couple_photos_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'couple-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT couple_id::text FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY couple_photos_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'couple-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT couple_id::text FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY couple_photos_update ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'couple-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT couple_id::text FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY couple_photos_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'couple-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT couple_id::text FROM public.couple_members WHERE user_id = auth.uid()
    )
  );


-- ========== 004_realtime.sql ==========

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wishes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_members;


-- ========== 005_auth_trigger.sql ==========

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ========== seed.sql ==========

INSERT INTO public.themes (name, primary_blue, primary_pink, is_default)
VALUES ('RomÃ¡ntico clÃ¡sico', '#B3D9FF', '#FFB3D9', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.romance_messages (body, kind) VALUES
('Cada dÃ­a a tu lado es mi lugar favorito.', 'home'),
('El amor se multiplica cuando lo compartimos.', 'home'),
('Contigo el tiempo vuela y a la vez se detiene.', 'home'),
('Eres mi hoy y todos mis maÃ±anas.', 'home'),
('Nuestra historia es mi capÃ­tulo preferido.', 'home'),
('Gracias por ser mi hogar.', 'home'),
('Juntos convertimos lo ordinario en magia.', 'home'),
('Tu sonrisa es mi mejor vista.', 'home'),
('El destino nos uniÃ³ y el amor nos mantiene.', 'home'),
('Siempre tÃº, siempre nosotros.', 'home'),
('Contigo cada dÃ­a es mi fecha favorita.', 'calendar_quote'),
('El amor no se mira, se siente.', 'calendar_quote'),
('Eres la razÃ³n de mi mejor versiÃ³n.', 'calendar_quote'),
('En tus ojos encontrÃ© mi universo.', 'calendar_quote'),
('Cada recuerdo contigo vale oro.', 'calendar_quote');

