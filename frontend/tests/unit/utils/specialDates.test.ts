import {
  getUpcomingSpecialDates,
  isAutoPhotoMemoryEvent,
  isExplicitSpecialEvent,
  isPastMemoryCandidate,
} from '../../../src/utils/specialDates';
import {
  isReminderOnlyEvent,
  pickPreferredDayEvent,
} from '../../../src/utils/eventKind';
import type { Event } from '../../../src/types/database';

const baseEvent = (overrides: Partial<Event>): Event => ({
  id: 'e1',
  couple_id: 'c1',
  event_date: '2026-06-01',
  title: 'Aniversario',
  description: null,
  color: '#FFB3D9',
  icon: 'heart',
  reminder_days: 3,
  romantic_note: null,
  created_by: 'u1',
  created_at: '2026-01-01',
  ...overrides,
});

describe('specialDates', () => {
  it('detects auto photo memory titles', () => {
    expect(isAutoPhotoMemoryEvent({ title: 'Recuerdo 2026-05-20' })).toBe(true);
    expect(isExplicitSpecialEvent(baseEvent({ title: 'Recuerdo 2026-05-20' }))).toBe(false);
    expect(isExplicitSpecialEvent(baseEvent({ title: 'Nuestra boda' }))).toBe(true);
  });

  it('picks anniversary before distant calendar event', () => {
    const next = getUpcomingSpecialDates(
      '2025-01-15',
      [baseEvent({ event_date: '2026-12-25', title: 'Navidad' })],
      '2026-05-27',
    );
    expect(next?.kind).toBe('anniversary');
    expect(next?.title).toMatch(/mes|año/);
  });

  it('past memory requires photos for auto titles', () => {
    const auto = baseEvent({ title: 'Recuerdo 2026-05-01', event_date: '2026-05-01' });
    expect(isPastMemoryCandidate(auto, false)).toBe(false);
    expect(isPastMemoryCandidate(auto, true)).toBe(true);
  });

  it('detects reminder-only only when reminder_only is true', () => {
    expect(isReminderOnlyEvent(baseEvent({ reminder_only: true }))).toBe(true);
    expect(isReminderOnlyEvent(baseEvent({ reminder_only: false }))).toBe(false);
    expect(isReminderOnlyEvent(baseEvent({ title: 'Cumpleaños' }))).toBe(false);
  });

  it('prefers memory event over reminder on same day', () => {
    const reminder = baseEvent({
      id: 'r1',
      event_date: '2026-05-02',
      reminder_only: true,
      created_at: '2026-05-01T12:00:00Z',
    });
    const memory = baseEvent({
      id: 'm1',
      event_date: '2026-05-02',
      reminder_only: false,
      title: 'Recuerdo 2026-05-02',
      created_at: '2026-05-01T11:00:00Z',
    });
    expect(pickPreferredDayEvent([reminder, memory])?.id).toBe('m1');
  });
});
