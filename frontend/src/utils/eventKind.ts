import type { Event } from '../types/database';

type DayEvent = Event & { created_at?: string };

function isTruthyReminderOnly(value: unknown): boolean {
  return value === true || value === 'true' || value === 1;
}

export function isReminderOnlyEvent(
  event: Pick<Event, 'reminder_only'> | null | undefined,
): boolean {
  if (!event) return false;
  return isTruthyReminderOnly(event.reminder_only);
}

/** Fechas guardadas a las que se pueden sumar fotos (sin recordatorio activo). */
export function canAddPhotosToEvent(
  event: Pick<Event, 'reminder_only'> | null | undefined,
): boolean {
  if (!event) return true;
  return !isReminderOnlyEvent(event);
}

/** Si hay varios eventos el mismo día, prioriza el que admite fotos y ubicación. */
export function pickPreferredDayEvent(events: DayEvent[]): DayEvent | undefined {
  if (events.length === 0) return undefined;
  const withMedia = events.filter((e) => !isReminderOnlyEvent(e));
  const pool = withMedia.length > 0 ? withMedia : events;
  return [...pool].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0];
}

export function pickPreferredDayEventForDate(
  events: DayEvent[],
  dateIso: string,
): DayEvent | undefined {
  return pickPreferredDayEvent(events.filter((e) => e.event_date === dateIso));
}
