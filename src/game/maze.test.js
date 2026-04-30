import { describe, it, expect } from 'vitest';
import { generateDailyMaze, TILE } from './maze.js';

describe('generateDailyMaze', () => {
  it('produces a 19x21 grid', () => {
    const m = generateDailyMaze('epavance-2026-04-21');
    expect(m.width).toBe(19);
    expect(m.height).toBe(21);
    expect(m.grid.length).toBe(21);
    expect(m.grid[0].length).toBe(19);
  });

  it('is deterministic for the same seed', () => {
    const a = generateDailyMaze('epavance-2026-04-21');
    const b = generateDailyMaze('epavance-2026-04-21');
    expect(a.grid).toEqual(b.grid);
    expect(a.pelletCount).toBe(b.pelletCount);
  });

  it('produces different grids for different seeds', () => {
    const a = generateDailyMaze('epavance-2026-04-21');
    const b = generateDailyMaze('epavance-2026-04-22');
    expect(a.grid).not.toEqual(b.grid);
  });

  it('is horizontally symmetric', () => {
    const m = generateDailyMaze('epavance-2026-04-21');
    for (let y = 0; y < m.height; y++) {
      for (let x = 0; x < Math.floor(m.width / 2); x++) {
        expect(m.grid[y][x]).toBe(m.grid[y][m.width - 1 - x]);
      }
    }
  });

  it('has a solid outer border', () => {
    const m = generateDailyMaze('epavance-2026-04-21');
    for (let x = 0; x < m.width; x++) {
      expect(m.grid[0][x]).toBe(TILE.WALL);
      expect(m.grid[m.height - 1][x]).toBe(TILE.WALL);
    }
  });

  it('has at least 4 power capsules', () => {
    const m = generateDailyMaze('epavance-2026-04-21');
    let powers = 0;
    for (let y = 0; y < m.height; y++) {
      for (let x = 0; x < m.width; x++) {
        if (m.grid[y][x] === TILE.POWER) powers++;
      }
    }
    expect(powers).toBeGreaterThanOrEqual(4);
  });

  it('exports playerStart inside the maze bounds', () => {
    const m = generateDailyMaze('epavance-2026-04-21');
    expect(m.playerStart.x).toBeGreaterThan(0);
    expect(m.playerStart.x).toBeLessThan(m.width - 1);
    expect(m.playerStart.y).toBeGreaterThan(0);
    expect(m.playerStart.y).toBeLessThan(m.height - 1);
  });
});
