import { describe, it, expect } from 'vitest';
import { classifyStreakChange } from './streak.js';

describe('classifyStreakChange', () => {
  it('first-ever scored run (prev 0 → new 1): "none"', () => {
    expect(classifyStreakChange(0, 1)).toBe('none');
  });
  it('continuing streak (prev 3 → new 4): "increment"', () => {
    expect(classifyStreakChange(3, 4)).toBe('increment');
  });
  it('reset after gap (prev 5 → new 1): "reset"', () => {
    expect(classifyStreakChange(5, 1)).toBe('reset');
  });
  it('same-day duplicate guard (prev 4 → new 4): "none"', () => {
    expect(classifyStreakChange(4, 4)).toBe('none');
  });
  it('prev 1 → new 2: "increment"', () => {
    expect(classifyStreakChange(1, 2)).toBe('increment');
  });
});
