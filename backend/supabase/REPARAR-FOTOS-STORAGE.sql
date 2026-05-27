-- =============================================================================
-- REPARAR subida de fotos (Storage + RLS event_photos)
-- Ejecutar en Supabase → SQL Editor si falla "Error al subir fotos"
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('couple-photos', 'couple-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS couple_photos_select ON storage.objects;
DROP POLICY IF EXISTS couple_photos_insert ON storage.objects;
DROP POLICY IF EXISTS couple_photos_update ON storage.objects;
DROP POLICY IF EXISTS couple_photos_delete ON storage.objects;

CREATE POLICY couple_photos_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'couple-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT couple_id::text FROM public.couple_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY couple_photos_insert ON storage.objects FOR INSERT
  TO authenticated
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

DROP POLICY IF EXISTS photos_member ON public.event_photos;
CREATE POLICY photos_member ON public.event_photos
  FOR ALL
  USING (couple_id IN (SELECT public.user_couple_ids()))
  WITH CHECK (couple_id IN (SELECT public.user_couple_ids()));

SELECT id, name, public FROM storage.buckets WHERE id = 'couple-photos';
