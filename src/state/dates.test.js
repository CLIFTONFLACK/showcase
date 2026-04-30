import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { todayStr, yesterdayStr, formatDate, formatShortDate, hoursRemainingUntil24h } from './dates.js';

describe('todayStr / yesterdayStr', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T10:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('todayStr returns YYYY-MM-DD for today', () => {
    expect(todayStr()).toBe('2026-04-21');
  });

  it('yesterdayStr returns YYYY-MM-DD for yesterday', () => {
    expect(yesterdayStr()).toBe('2026-04-20');
  });

  it('yesterdayStr crosses month boundaries', () => {
    vi.setSystemTime(new Date('2026-05-01T10:00:00'));
    expect(yesterdayStr()).toBe('2026-04-30');
  });
});

describe('formatDate', () => {
  it('produces a "weekday, day month" English-GB string', () => {
    const d = new Date('2026-04-21T10:00:00');
    expect(formatDate(d)).toMatch(/^Tuesday,?\s+21\s+April$/);
  });
});

describe('formatShortDate', () => {
  it('formats as "21 Apr"', () => {
    expect(formatShortDate(new Date('2026-04-21T10:00:00'))).toMatch(/^21\s+Apr$/);
  });
});

describe('hoursRemainingUntil24h', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns full 24h when called immediately', () => {
    const iso = new Date('2026-04-21T12:00:00Z').toISOString();
    expect(hoursRemainingUntil24h(iso)).toEqual({ h: 24, m: 0 });
  });

  it('returns 12h after 12h elapsed', () => {
    const iso = new Date('2026-04-21T00:00:00Z').toISOString();
    expect(hoursRemainingUntil24h(iso)).toEqual({ h: 12, m: 0 });
  });

  it('returns 0h,0m past 24h', () => {
    const iso = new Date('2026-04-20T00:00:00Z').toISOString();
    expect(hoursRemainingUntil24h(iso)).toEqual({ h: 0, m: 0 });
  });

  it('returns 0h,0m when fromIso is null', () => {
    expect(hoursRemainingUntil24h(null)).toEqual({ h: 0, m: 0 });
  });
});
