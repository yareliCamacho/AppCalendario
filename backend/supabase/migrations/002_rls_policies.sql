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
