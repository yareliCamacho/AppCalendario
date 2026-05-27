-- Fecha creada con recordatorio DESACTIVADO pero bloqueada (p. ej. tras backfill 013)
-- Cambia la fecha y el título según tu caso:

UPDATE public.events
SET reminder_only = false
WHERE event_date = '2026-05-02'
  AND reminder_only = true;
