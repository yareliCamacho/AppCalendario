-- Días con fotos o ubicación son recuerdos, no solo recordatorio
UPDATE public.events e
SET reminder_only = false
WHERE e.reminder_only = true
  AND (
    EXISTS (SELECT 1 FROM public.event_photos p WHERE p.event_id = e.id)
    OR EXISTS (SELECT 1 FROM public.event_locations l WHERE l.event_id = e.id)
  );
