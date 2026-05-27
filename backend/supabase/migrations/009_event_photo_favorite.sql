-- Foto favorita por evento (relleno del corazón en calendario / inicio)
ALTER TABLE public.event_photos
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_event_photos_favorite
  ON public.event_photos (event_id)
  WHERE is_favorite = true;
