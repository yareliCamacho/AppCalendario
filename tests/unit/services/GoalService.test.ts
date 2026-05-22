import { calculateGoalProgress } from '../../../src/utils/goalProgress';

describe('goal progress', () => {
  it('calculates 50 percent', () => {
    expect(calculateGoalProgress(5000, 10000)).toBe(50);
  });

  it('caps at 100 percent', () => {
    expect(calculateGoalProgress(15000, 10000)).toBe(100);
  });
});
