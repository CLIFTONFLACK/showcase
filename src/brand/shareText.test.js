import { describe, it, expect } from 'vitest';
import { buildShareText, buildEmojiGrid } from './shareText.js';

describe('buildEmojiGrid', () => {
  it('0% → 10 black cells', () => {
    expect(buildEmojiGrid(0)).toBe('⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛');
  });
  it('100% → 10 green cells', () => {
    expect(buildEmojiGrid(100)).toBe('🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢');
  });
  it('40% → 4 green, 6 black, no yellow', () => {
    expect(buildEmojiGrid(40)).toBe('🟢🟢🟢🟢⬛⬛⬛⬛⬛⬛');
  });
  it('45% → 4 green, 1 yellow, 5 black', () => {
    expect(buildEmojiGrid(45)).toBe('🟢🟢🟢🟢🟡⬛⬛⬛⬛⬛');
  });
  it('49% → 4 green, 1 yellow, 5 black (<5 threshold edge)', () => {
    expect(buildEmojiGrid(49)).toBe('🟢🟢🟢🟢🟡⬛⬛⬛⬛⬛');
  });
  it('44% → 4 green, 6 black, no yellow', () => {
    expect(buildEmojiGrid(44)).toBe('🟢🟢🟢🟢⬛⬛⬛⬛⬛⬛');
  });
  it('always produces a 10-cell grid', () => {
    for (let p = 0; p <= 100; p++) {
      expect(Array.from(buildEmojiGrid(p)).length).toBe(10);
    }
  });
});

describe('buildShareText', () => {
  it('includes score, date, streak, grid, and domain', () => {
    const text = buildShareText({
      score: 2150, dateLabel: '21 Apr', streak: 4, healPct: 40,
    });
    expect(text).toContain('2,150');
    expect(text).toContain('21 Apr');
    expect(text).toContain('4 days');
    expect(text).toContain('🟢🟢🟢🟢⬛⬛⬛⬛⬛⬛');
    expect(text).toContain('vance-daily-calm.vercel.app');
  });

  it('omits streak flame when streak <= 1', () => {
    const text = buildShareText({
      score: 500, dateLabel: '21 Apr', streak: 1, healPct: 20,
    });
    expect(text).not.toContain('🔥');
    expect(text).not.toMatch(/\bdays\b/);
  });
});
