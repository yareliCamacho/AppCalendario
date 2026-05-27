-- Varias fotos por hito (hasta 3 en la app)
ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS photo_paths text[] NOT NULL DEFAULT '{}';

UPDATE public.milestones
SET photo_paths = ARRAY[photo_path]
WHERE photo_path IS NOT NULL
  AND (photo_paths IS NULL OR photo_paths = '{}');
