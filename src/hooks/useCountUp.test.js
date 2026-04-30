import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from './useCountUp.js';

describe('useCountUp', () => {
  let nowMs;
  beforeEach(() => {
    vi.useFakeTimers();
    nowMs = 0;
    vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(() => cb(nowMs), 16));
    vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id));
    vi.stubGlobal('performance', { now: () => nowMs });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const advance = (ms) => {
    act(() => {
      nowMs += ms;
      vi.advanceTimersByTime(ms);
    });
  };

  it('starts at 0', () => {
    const { result } = renderHook(() => useCountUp(1000, { duration: 800 }));
    expect(result.current).toBe(0);
  });

  it('reaches target after duration', () => {
    const { result } = renderHook(() => useCountUp(1000, { duration: 800 }));
    advance(900);
    expect(result.current).toBe(1000);
  });

  it('is monotonically non-decreasing mid-animation', () => {
    const { result } = renderHook(() => useCountUp(1000, { duration: 800 }));
    const samples = [];
    for (let t = 0; t < 900; t += 100) {
      advance(100);
      samples.push(result.current);
    }
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
    }
  });

  it('returns integer values', () => {
    const { result } = renderHook(() => useCountUp(1000, { duration: 800 }));
    advance(400);
    expect(Number.isInteger(result.current)).toBe(true);
  });
});
