import { calculateDaysTogether } from '../../../src/utils/daysTogether';

describe('calculateDaysTogether', () => {
  it('returns 0 when no start date', () => {
    expect(calculateDaysTogether(null)).toBe(0);
  });

  it('returns non-negative days', () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    expect(calculateDaysTogether(past.toISOString().slice(0, 10))).toBeGreaterThanOrEqual(10);
  });
});
