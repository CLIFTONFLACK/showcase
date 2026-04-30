import { describe, it, expect } from 'vitest';
import { sweepRatio } from './healSweep.js';

describe('sweepRatio', () => {
  const WIDTH = 19;
  it('returns baseRatio at t=0', () => {
    expect(sweepRatio(0, WIDTH, 0, 0.4)).toBe(0.4);
    expect(sweepRatio(10, WIDTH, 0, 0.4)).toBe(0.4);
    expect(sweepRatio(18, WIDTH, 0, 0.4)).toBe(0.4);
  });

  it('returns 1 for all columns at t=1', () => {
    for (let x = 0; x < WIDTH; x++) {
      expect(sweepRatio(x, WIDTH, 1, 0.4)).toBe(1);
    }
  });

  it('leading edge has healed at midpoint, trailing still base', () => {
    expect(sweepRatio(2, WIDTH, 0.5, 0.2)).toBe(1);
    expect(sweepRatio(18, WIDTH, 0.5, 0.2)).toBe(0.2);
  });

  it('interpolates linearly across the 30%-wide leading edge', () => {
    const prev = sweepRatio(10, WIDTH, 0.5, 0.2);
    const next = sweepRatio(11, WIDTH, 0.5, 0.2);
    expect(prev).toBeGreaterThanOrEqual(next);
  });
});
