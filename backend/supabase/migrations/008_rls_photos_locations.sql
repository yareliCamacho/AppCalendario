-- RLS explícito para fotos y ubicaciones (INSERT/UPDATE con WITH CHECK)

DROP POLICY IF EXISTS photos_member ON public.event_photos;
CREATE POLICY photos_member ON public.event_photos
  FOR ALL
  USING (couple_id IN (SELECT public.user_couple_ids()))
  WITH CHECK (couple_id IN (SELECT public.user_couple_ids()));

DROP POLICY IF EXISTS locations_member ON public.event_locations;
CREATE POLICY locations_member ON public.event_locations
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE couple_id IN (SELECT public.user_couple_ids())
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE couple_id IN (SELECT public.user_couple_ids())
    )
  );
