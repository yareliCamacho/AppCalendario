import { shouldRotateHomeMessage } from '../../../src/utils/homeMessage';

describe('shouldRotateHomeMessage', () => {
  it('returns true when never shown', () => {
    expect(shouldRotateHomeMessage(null)).toBe(true);
  });

  it('returns false when shown recently', () => {
    expect(shouldRotateHomeMessage(new Date().toISOString())).toBe(false);
  });
});
