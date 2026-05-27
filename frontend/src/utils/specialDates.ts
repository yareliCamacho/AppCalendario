import type { Event } from '../types/database';
import { isReminderOnlyEvent } from './eventKind';

/** Evento creado al subir fotos sin título propio */
const AUTO_MEMORY_TITLE = /^Recuerdo \d{4}-\d{2}-\d{2}$/;

export type SpecialDateItem = {
  id: string;
  event_date: string;
  title: string;
  kind: 'anniversary' | 'event';
  sourceEvent?: Event;
};

export function isAutoPhotoMemoryEvent(event: Pick<Event, 'title'>): boolean {
  return AUTO_MEMORY_TITLE.test(event.title.trim());
}

/** Fecha especial creada en calendario (título, recordatorio, nota…) */
export function isExplicitSpecialEvent(event: Event): boolean {
  return !isAutoPhotoMemoryEvent(event);
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseIso(iso: string): Date {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function addCalendarMonths(start: Date, months: number): Date {
  const d = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
  return d;
}

function anniversaryTitle(months: number): string {
  if (months >= 12 && months % 12 === 0) {
    const years = months / 12;
    return years === 1 ? '1 año juntos' : `${years} años juntos`;
  }
  if (months === 1) return '1 mes juntos';
  return `${months} meses juntos`;
}

/** Próximos hitos de relación (meses y años desde relationship_start_date) */
export function getRelationshipAnniversaries(
  relationshipStartDate: string | null,
  fromDateIso: string,
  horizonMonths = 18,
): SpecialDateItem[] {
  if (!relationshipStartDate) return [];
  const start = parseIso(relationshipStartDate);
  const from = parseIso(fromDateIso);
  const items: SpecialDateItem[] = [];

  for (let m = 1; m <= horizonMonths; m++) {
    const date = addCalendarMonths(start, m);
    if (date < from) continue;
    items.push({
      id: `anniversary-${m}`,
      event_date: toIsoDate(date),
      title: anniversaryTitle(m),
      kind: 'anniversary',
    });
  }

  return items;
}

/** Próxima fecha especial: aniversarios + eventos del calendario (no placeholders de foto) */
export function getUpcomingSpecialDates(
  relationshipStartDate: string | null,
  events: Event[],
  todayIso: string,
): SpecialDateItem | null {
  const anniversaries = getRelationshipAnniversaries(relationshipStartDate, todayIso);
  const fromEvents: SpecialDateItem[] = events
    .filter(
      (e) =>
        e.event_date >= todayIso &&
        isExplicitSpecialEvent(e) &&
        isReminderOnlyEvent(e),
    )
    .map((e) => ({
      id: e.id,
      event_date: e.event_date,
      title: e.title,
      kind: 'event' as const,
      sourceEvent: e,
    }));

  const merged = [...anniversaries, ...fromEvents].sort((a, b) =>
    a.event_date.localeCompare(b.event_date),
  );
  return merged[0] ?? null;
}

/** Recuerdo pasado: cita/fecha especial o día con fotos (no huecos vacíos) */
export function isPastMemoryCandidate(event: Event, hasPhotos: boolean): boolean {
  if (event.event_date >= toIsoDate(new Date())) return false;
  if (isReminderOnlyEvent(event)) return false;
  if (isExplicitSpecialEvent(event)) return true;
  return hasPhotos;
}

export function pickRecentMemory(
  pastEvents: Event[],
  eventHasPhotos: (eventId: string) => boolean,
): Event | null {
  for (const e of pastEvents) {
    if (isPastMemoryCandidate(e, eventHasPhotos(e.id))) return e;
  }
  return null;
}
