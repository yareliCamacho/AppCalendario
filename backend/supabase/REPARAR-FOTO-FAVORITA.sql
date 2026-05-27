-- Columna is_favorite en event_photos (marcar foto favorita / corazón)
ALTER TABLE public.event_photos
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_event_photos_favorite
  ON public.event_photos (event_id)
  WHERE is_favorite = true;
