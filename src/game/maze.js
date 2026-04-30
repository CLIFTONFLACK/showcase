import { rngFromString } from './rng.js';

export const TILE = {
  WALL: 1,
  EMPTY: 0,
  DOT: 2,
  POWER: 3,
  GATE: 4,
};

// 19 cols x 21 rows classic Pac-Man proportion. Symmetric maze with a central
// ghost pen. Uses seeded randomness so the same date -> same maze.
export function generateDailyMaze(seedStr) {
  const rand = rngFromString(seedStr);
  const W = 19, H = 21;

  // Start with all walls
  const m = Array.from({ length: H }, () => Array(W).fill(TILE.WALL));

  // Carve corridors on left half using randomized recursive backtracker,
  // then mirror to the right for symmetry.
  const HW = Math.ceil(W / 2); // 10 cols including center
  const half = Array.from({ length: H }, () => Array(HW).fill(1));

  // Cells are on odd coords. Carve between them.
  function carve(cx, cy) {
    half[cy][cx] = 0;
    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 1 || nx >= HW || ny < 1 || ny >= H - 1) continue;
      if (half[ny][nx] === 1) {
        half[cy + dy / 2][cx + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  }
  carve(1, 1);

  // Add extra connections to reduce dead ends
  const extraPasses = 14;
  for (let k = 0; k < extraPasses; k++) {
    const cx = 1 + 2 * Math.floor(rand() * ((HW - 1) / 2));
    const cy = 1 + 2 * Math.floor(rand() * ((H - 2) / 2));
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const [dx, dy] = dirs[Math.floor(rand() * 4)];
    const wx = cx + dx, wy = cy + dy;
    if (wx > 0 && wx < HW - 1 && wy > 0 && wy < H - 1) {
      half[wy][wx] = 0;
    }
  }

  // Mirror into full maze
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < HW; x++) {
      m[y][x] = half[y][x] ? TILE.WALL : TILE.DOT;
    }
    for (let x = 0; x < W - HW; x++) {
      m[y][W - 1 - x] = m[y][x];
    }
  }

  // Outer border
  for (let x = 0; x < W; x++) { m[0][x] = TILE.WALL; m[H - 1][x] = TILE.WALL; }
  for (let y = 0; y < H; y++) { m[y][0] = TILE.WALL; m[y][W - 1] = TILE.WALL; }

  // Carve a ghost pen in the center
  const penCY = 10, penCX = 9;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      m[penCY + dy][penCX + dx] = TILE.EMPTY;
    }
  }
  // Pen walls
  for (let dx = -2; dx <= 2; dx++) {
    m[penCY - 1][penCX + dx] = TILE.WALL;
    m[penCY + 1][penCX + dx] = TILE.WALL;
  }
  m[penCY][penCX - 2] = TILE.WALL;
  m[penCY][penCX + 2] = TILE.WALL;
  // Gate
  m[penCY - 1][penCX] = TILE.GATE;

  // Clear approach corridor above pen
  m[penCY - 2][penCX] = TILE.DOT;
  m[penCY - 3][penCX] = TILE.DOT;

  // Side tunnels (horizontal wraparound at middle row)
  const tunnelY = 10;
  m[tunnelY][0] = TILE.EMPTY;
  m[tunnelY][W - 1] = TILE.EMPTY;
  m[tunnelY][1] = TILE.EMPTY;
  m[tunnelY][W - 2] = TILE.EMPTY;

  // Starting area (below pen) cleared
  m[penCY + 3][penCX] = TILE.DOT;
  m[penCY + 4][penCX] = TILE.DOT;

  // Remove dots where cells are structurally empty (pen interior)
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      m[penCY + dy][penCX + dx] = TILE.EMPTY;
    }
  }

  // Place 4 power capsules symmetrically — corners-ish
  const powerSpots = [
    [1, 1], [1, W - 2], [H - 2, 1], [H - 2, W - 2],
  ];
  for (const [y, x] of powerSpots) {
    if (m[y][x] === TILE.DOT || m[y][x] === TILE.EMPTY) {
      m[y][x] = TILE.POWER;
    } else {
      outer: for (let r = 1; r < 4; r++) {
        for (let ddy = -r; ddy <= r; ddy++) {
          for (let ddx = -r; ddx <= r; ddx++) {
            const ny = y + ddy, nx = x + ddx;
            if (ny > 0 && ny < H - 1 && nx > 0 && nx < W - 1 && m[ny][nx] === TILE.DOT) {
              m[ny][nx] = TILE.POWER; break outer;
            }
          }
        }
      }
    }
  }

  // Count pellets
  let pelletCount = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (m[y][x] === TILE.DOT || m[y][x] === TILE.POWER) pelletCount++;
  }

  return {
    grid: m,
    width: W,
    height: H,
    playerStart: { x: penCX, y: penCY + 3 },
    penCenter: { x: penCX, y: penCY },
    tunnelY,
    pelletCount,
    seed: seedStr,
  };
}
