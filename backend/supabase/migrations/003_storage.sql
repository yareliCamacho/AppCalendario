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
