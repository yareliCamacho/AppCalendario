import { eventSchema } from '../../../src/types/schemas';

describe('eventSchema', () => {
  it('accepts reminder_days 1-15', () => {
    const r = eventSchema.safeParse({
      title: 'Aniversario',
      event_date: '2026-05-22',
      color: '#FFB3D9',
      icon: 'heart',
      reminder_days: 7,
    });
    expect(r.success).toBe(true);
  });

  it('rejects reminder_days out of range', () => {
    const r = eventSchema.safeParse({
      title: 'X',
      event_date: '2026-05-22',
      color: '#FFB3D9',
      icon: 'heart',
      reminder_days: 20,
    });
    expect(r.success).toBe(false);
  });
});
