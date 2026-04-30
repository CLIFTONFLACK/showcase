import { describe, it, expect } from 'vitest';
import { hashString, mulberry32, rngFromString } from './rng.js';

describe('hashString', () => {
  it('returns an unsigned 32-bit integer', () => {
    const h = hashString('epavance-2026-04-21');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xFFFFFFFF);
  });

  it('is deterministic', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
  });

  it('differs for different inputs', () => {
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });
});

describe('rngFromString', () => {
  it('is deterministic for the same seed', () => {
    const a = rngFromString('seed-1');
    const b = rngFromString('seed-1');
    expect(a()).toBe(b());
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it('returns values in [0, 1)', () => {
    const r = rngFromString('seed-x');
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
