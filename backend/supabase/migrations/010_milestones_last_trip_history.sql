-- Permite historial para `last_trip` y mantiene unicidad para los demás hitos

ALTER TABLE public.milestones
  DROP CONSTRAINT IF EXISTS milestones_couple_id_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS milestones_unique_non_last_trip
  ON public.milestones (couple_id, type)
  WHERE type <> 'last_trip';

ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS milestones_couple_type_date_idx
  ON public.milestones (couple_id, type, milestone_date DESC, created_at DESC);
