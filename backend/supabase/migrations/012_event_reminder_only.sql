-- Fechas creadas como recordatorio (sin fotos ni ubicación)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS reminder_only boolean NOT NULL DEFAULT false;
