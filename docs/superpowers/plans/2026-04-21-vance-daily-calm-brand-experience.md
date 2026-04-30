# VANCE Daily Calm — Brand Experience Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the HTML prototype of "Daily Calm" to a deployable Vite + React project, then add eight brand-experience enhancements (heal sweep, confetti, animated score card, conversion-tuned sign-up flow, streak celebration, animated onboarding) ready to deploy to a new Vercel project.

**Architecture:** Vite + React 18 (JS), vanilla Canvas 2D engine ported from the prototype and split into ES modules (`game/engine.js`, `game/maze.js`, `game/rng.js`). Three new brand modules (`brand/confetti.js`, `brand/scoreCard.js`, `brand/healSweep.js`) layered on top of the engine. Client-side only — no backend, no env vars. Static deploy to Vercel via `vite build`.

**Tech Stack:** Vite 5, React 18, Canvas 2D, Vitest (for pure-logic TDD), localStorage, Vercel static deploy.

**Spec:** [docs/superpowers/specs/2026-04-21-vance-daily-calm-brand-experience-design.md](../specs/2026-04-21-vance-daily-calm-brand-experience-design.md)

**Working directory:** `C:\Users\clift\.Claude\VANCE - Game\` (contains the current prototype — do not delete until port is verified).

---

## Chunk 1: Project Scaffold & Prototype Port

Goal: a working Vite + React app at the project root with identical behaviour to the current prototype. No new features yet — just a clean, buildable foundation. At the end of this chunk, the game is deployable as-is; Chunk 2 adds brand features on top.

### Task 1: Preserve prototype, initialize git, scaffold Vite project

**Files:**
- Create: `_prototype/` (directory — archive current prototype files here)
- Create: `package.json`, `vite.config.js`, `.gitignore`, `index.html`
- Create: `src/main.jsx`

- [ ] **Step 1: Archive prototype files**

```bash
cd "C:/Users/clift/.Claude/VANCE - Game"
mkdir -p _prototype
mv "Daily Calm.html" _prototype/
mv game _prototype/
mv assets _prototype/
mv styles _prototype/
mv README.md _prototype/
```

Rationale: keep the working prototype as reference during the port. Can be deleted at end of Chunk 1 once parity is verified.

- [ ] **Step 2: Initialize git**

```bash
git init
git branch -M main
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
.superpowers/
.DS_Store
*.log
.env
.env.local
.vercel/
```

- [ ] **Step 4: Create `package.json`**

```json
{
  "name": "vance-daily-calm",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.10",
    "vitest": "^2.1.4",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 5: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
```

- [ ] **Step 6: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Daily Calm — EPAVANCE</title>
    <meta name="description" content="Guide a gut cell through today's maze. Collect EPA molecules, heal the wall, earn rewards on your next EPAVANCE order." />
    <link rel="stylesheet" href="/src/styles/colors_and_type.css" />
    <link rel="stylesheet" href="/src/styles/game.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `src/main.jsx`**

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
```

- [ ] **Step 8: Install and commit**

```bash
npm install
git add .
git commit -m "chore: scaffold Vite + React project, archive prototype"
```

Expected: `node_modules/` populated, `package-lock.json` created (kept in git). `npm run dev` will fail next — that's fine, we haven't created `App.jsx` yet.

---

### Task 2: Migrate assets (fonts, logo, CSS) to new structure

**Files:**
- Create: `public/logos/epavance-logo.png` (copied)
- Create: `public/fonts/Outfit-VariableFont_wght.ttf` (copied)
- Create: `src/styles/colors_and_type.css` (copied + path fix)
- Create: `src/styles/game.css` (copied unchanged)

- [ ] **Step 1: Copy assets from prototype**

```bash
mkdir -p public/logos public/fonts src/styles
cp _prototype/assets/logos/epavance-logo.png public/logos/epavance-logo.png
cp _prototype/styles/fonts/Outfit-VariableFont_wght.ttf public/fonts/Outfit-VariableFont_wght.ttf
cp _prototype/styles/game.css src/styles/game.css
cp _prototype/styles/colors_and_type.css src/styles/colors_and_type.css
```

- [ ] **Step 2: Read `src/styles/colors_and_type.css` and fix font path**

First read the file to see the exact current `src: url(...)` string(s) inside `@font-face`. In the prototype the value is `url('fonts/Outfit-VariableFont_wght.ttf') format('truetype-variations'), url('fonts/Outfit-VariableFont_wght.ttf') format('truetype')`. Replace both occurrences:

- Old: `url('fonts/Outfit-VariableFont_wght.ttf')`
- New: `url('/fonts/Outfit-VariableFont_wght.ttf')`

Leading slash makes Vite resolve to `public/fonts/...`.

- [ ] **Step 3: Commit**

```bash
git add public src/styles
git commit -m "chore: migrate assets and styles to Vite structure"
```

---

### Task 3: Port RNG module (TDD)

**Files:**
- Create: `src/game/rng.js`
- Test: `src/game/rng.test.js`

- [ ] **Step 1: Write failing tests for `rng.js`**

Create `src/game/rng.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — expect FAIL ("no such file")**

```bash
npm run test -- src/game/rng.test.js
```

Expected: import error because `rng.js` doesn't exist.

- [ ] **Step 3: Implement `src/game/rng.js`**

Port from `_prototype/game/engine.js` lines 6–22:

```js
export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFromString(s) {
  return mulberry32(hashString(s));
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test -- src/game/rng.test.js
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/rng.js src/game/rng.test.js
git commit -m "feat(game): port RNG module with deterministic seed tests"
```

---

### Task 4: Port maze generator (TDD)

**Files:**
- Create: `src/game/maze.js`
- Test: `src/game/maze.test.js`

- [ ] **Step 1: Write failing tests for `maze.js`**

Create `src/game/maze.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test -- src/game/maze.test.js
```

- [ ] **Step 3: Implement `src/game/maze.js`**

Port from `_prototype/game/engine.js` lines 24–172. Structure:

```js
import { rngFromString } from './rng.js';

export const TILE = {
  WALL: 1,
  EMPTY: 0,
  DOT: 2,
  POWER: 3,
  GATE: 4,
};

export function generateDailyMaze(seedStr) {
  // [copy full body of generateDailyMaze from _prototype/game/engine.js lines 36-172]
  // Ensure the `seed: seedStr` field is included in the return.
}
```

Exact port — no logic changes. The extracted IIFE's internal helpers (`carve`) become local function declarations inside `generateDailyMaze`.

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test -- src/game/maze.test.js
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/maze.js src/game/maze.test.js
git commit -m "feat(game): port maze generator as ES module with property tests"
```

---

### Task 5: Port MazeEngine as ES module

**Files:**
- Create: `src/game/engine.js`

- [ ] **Step 1: Port `MazeEngine` class**

Port from `_prototype/game/engine.js` lines 174–745. Structure:

```js
import { TILE } from './maze.js';

export class MazeEngine {
  constructor(canvas, maze, opts = {}) {
    // [full body from prototype]
  }
  // [all methods unchanged: _resize, _bindKeys, setDir, start, stop, pause,
  //  _isWall, _isGate, _tryMove, _eatPellets, _remainingPellets, _ghostStep,
  //  _playerHit, _loop, _draw, _drawPlayer, _drawGhost, snapshot]
}

// Utilities used only by the engine — keep local
function lerp(a, b, t) { return a + (b - a) * t; }
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
```

Important: remove the IIFE wrapper and the `Object.assign(window, ...)` line from the prototype. Remove `var TILE` — it's imported now.

- [ ] **Step 2: Commit**

```bash
git add src/game/engine.js
git commit -m "feat(game): port MazeEngine class as ES module"
```

The engine is not unit-tested — its behaviour is temporal/visual and exercised via manual smoke checks at the end of Chunk 1.

---

### Task 6: Create state helpers (dates, tiers, brandConfig, persistence)

**Files:**
- Create: `src/state/dates.js`
- Create: `src/state/tiers.js`
- Create: `src/state/brandConfig.js`
- Create: `src/hooks/usePersistence.js`
- Test: `src/state/dates.test.js`

- [ ] **Step 1: Write failing tests for date helpers**

Create `src/state/dates.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { todayStr, yesterdayStr, formatDate } from './dates.js';

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
    // April 21 2026 is a Tuesday. Match shape, not exact punctuation, to
    // accommodate differences in Node ICU builds.
    expect(formatDate(d)).toMatch(/^Tuesday,?\s+21\s+April$/);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test -- src/state/dates.test.js
```

- [ ] **Step 3: Implement `src/state/dates.js`**

```js
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(d) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function fmt(n) {
  return n.toLocaleString('en-GB');
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test -- src/state/dates.test.js
```

- [ ] **Step 5: Create `src/state/tiers.js`**

```js
export const TIERS = [
  { pts: 500, title: 'IBD recipe guide', desc: 'Low-trigger meal plan, PDF' },
  { pts: 1500, title: '£5 off your next order', desc: 'Applied at checkout' },
  { pts: 3000, title: 'Free single-bottle add-on', desc: '30-capsule travel pack' },
  { pts: 5000, title: 'Monthly prize draw entry', desc: 'One entry per calendar month' },
];
```

- [ ] **Step 6: Create `src/state/brandConfig.js`**

```js
export const SHARE_DOMAIN = 'vance-daily-calm.vercel.app';
export const SHARE_URL = `https://${SHARE_DOMAIN}`;
export const GAME_STORAGE_KEY = 'epavance_game_v1';
```

- [ ] **Step 7: Create `src/hooks/usePersistence.js`**

```js
import { useState, useEffect, useRef } from 'react';
import { GAME_STORAGE_KEY } from '../state/brandConfig.js';

const DEFAULT = {
  totalPoints: 0,
  user: null,
  claimed: [],
  lastPlayed: null,
  lastScore: 0,
  streak: 0,
};

export function usePersistence() {
  const [state, setState] = useState(() => load() ?? DEFAULT);
  const storageAvailable = useRef(true);

  useEffect(() => {
    if (!storageAvailable.current) return;
    try {
      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
    } catch {
      storageAvailable.current = false;
    }
  }, [state]);

  return [state, setState, storageAvailable.current];
}

function load() {
  try {
    const raw = localStorage.getItem(GAME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add src/state src/hooks/usePersistence.js
git commit -m "feat(state): add date, tier, brand config, and persistence helpers"
```

---

### Task 7: Port layout sub-components (TopBar, PageHead, HUD, HealthStrip, DPad, Toasts)

*(Note: the `useEngineSnap` hook introduced in the spec is deferred to Chunk 3 — it's an abstraction used only after the brand-feature refactor. The prototype's inline `setInterval` pattern is retained in the minimal port to keep Chunk 1 focused on parity.)*



**Files:**
- Create: `src/components/TopBar.jsx`
- Create: `src/components/PageHead.jsx`
- Create: `src/components/HUD.jsx`
- Create: `src/components/HealthStrip.jsx`
- Create: `src/components/DPad.jsx`
- Create: `src/components/Toasts.jsx`

- [ ] **Step 1: Create `src/components/TopBar.jsx`**

Port from `_prototype/game/app.jsx` lines 38–73. Add `import` for `fmt` from `../state/dates.js`.

```jsx
import { fmt } from '../state/dates.js';

function Logo() {
  return <img src="/logos/epavance-logo.png" alt="EPAVANCE" style={{ height: 24, display: 'block' }} />;
}

export function TopBar({ totalPoints, user, onSignIn }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Logo />
        <nav className="topbar-nav">
          <a href="#">Shop</a>
          <a href="#">The Science</a>
          <a href="#">IBD &amp; You</a>
          <a href="#" className="active">Daily Calm</a>
          <a href="#">For Clinicians</a>
        </nav>
        <div className="topbar-right">
          <div className="status">
            <span>Your points</span>
            <b style={{ color: 'var(--fg-brand-strong)', fontFamily: 'var(--font-display)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalPoints)}</b>
          </div>
          {user ? (
            <div className="status">
              <div className="av">{user.initials}</div>
              <span>{user.name.split(' ')[0]}</span>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={onSignIn}>Sign in</button>
          )}
        </div>
      </div>
    </header>
  );
}
```

Note the path change: `assets/logos/epavance-logo.png` → `/logos/epavance-logo.png` (absolute, Vite serves `public/` at root).

- [ ] **Step 2: Create `src/components/PageHead.jsx`**

Port from `_prototype/game/app.jsx` lines 75–90. Import `formatDate` from `../state/dates.js`.

- [ ] **Step 3: Create `src/components/HUD.jsx`**

Port from `_prototype/game/app.jsx` lines 92–114. Import `fmt` from `../state/dates.js`.

- [ ] **Step 4: Create `src/components/HealthStrip.jsx`**

Port from `_prototype/game/app.jsx` lines 116–126. No imports needed.

- [ ] **Step 5: Create `src/components/DPad.jsx`**

Port from `_prototype/game/app.jsx` lines 140–149.

- [ ] **Step 6: Create `src/components/Toasts.jsx`**

Port from `_prototype/game/app.jsx` lines 128–138.

- [ ] **Step 7: Commit**

```bash
git add src/components
git commit -m "feat(components): port layout sub-components from prototype"
```

---

### Task 8: Port side panel cards (PointsCard, RewardsCard, LeaderboardCard)

**Files:**
- Create: `src/components/side/PointsCard.jsx`
- Create: `src/components/side/RewardsCard.jsx`
- Create: `src/components/side/LeaderboardCard.jsx`

- [ ] **Step 1: Create `src/components/side/PointsCard.jsx`**

Port from `_prototype/game/app.jsx` lines 151–172. Import `fmt` from `../../state/dates.js` and `TIERS` from `../../state/tiers.js`.

- [ ] **Step 2: Create `src/components/side/RewardsCard.jsx`**

Port from `_prototype/game/app.jsx` lines 174–202.

- [ ] **Step 3: Create `src/components/side/LeaderboardCard.jsx`**

Port from `_prototype/game/app.jsx` lines 204–245. Import `rngFromString` from `../../game/rng.js` and `todayStr` from `../../state/dates.js`.

- [ ] **Step 4: Commit**

```bash
git add src/components/side
git commit -m "feat(components): port side panel cards"
```

---

### Task 9: Port modals (pre-enhancement versions)

**Files:**
- Create: `src/modals/HowToModal.jsx`
- Create: `src/modals/AlreadyPlayedModal.jsx`
- Create: `src/modals/EndModal.jsx`
- Create: `src/modals/SignUpModal.jsx`
- Create: `src/modals/ClaimedModal.jsx`

Port each modal to its own file. Direct one-to-one port — DO NOT add features. All enhancements land in Chunk 3.

Every file: `import { fmt } from '../state/dates.js'` where used, export one named component matching the filename.

- [ ] **Step 1: Create `src/modals/HowToModal.jsx`**

Port from `_prototype/game/app.jsx` lines **248–287** (the `HowToModal` function, JSX included).
- Export: `export function HowToModal({ onStart }) { ... }`
- Imports: none from state (pure presentational).

- [ ] **Step 2: Create `src/modals/AlreadyPlayedModal.jsx`**

Port from `_prototype/game/app.jsx` lines **288–305**.
- Export: `export function AlreadyPlayedModal({ todayScore, onReplay, onClose }) { ... }`
- Imports: `fmt` from `../state/dates.js`.

- [ ] **Step 3: Create `src/modals/EndModal.jsx`**

Port from `_prototype/game/app.jsx` lines **306–360**.
- Export: `export function EndModal({ snap, earned, isGuest, isPractice, onSignUp, onClose }) { ... }`
- Imports: `fmt` from `../state/dates.js`.

- [ ] **Step 4: Create `src/modals/SignUpModal.jsx`**

Port from `_prototype/game/app.jsx` lines **361–398**.
- Export: `export function SignUpModal({ pendingPoints, onComplete, onClose }) { ... }`
- Imports: `useState` from React, `fmt` from `../state/dates.js`.

- [ ] **Step 5: Create `src/modals/ClaimedModal.jsx`**

Port from `_prototype/game/app.jsx` lines **399–415**.
- Export: `export function ClaimedModal({ tier, onClose }) { ... }`
- Imports: none.

- [ ] **Step 6: Commit**

```bash
git add src/modals
git commit -m "feat(modals): port 5 modal components (pre-enhancement)"
```

---

### Task 10: Port App.jsx (orchestrator)

**Files:**
- Create: `src/App.jsx`

Port from `_prototype/game/app.jsx` lines **417–600** (the `App` function body plus the `createRoot` render call at the bottom). The render call moves to `main.jsx` (already wired in Task 1); this file only exports `App`.

- [ ] **Step 1: Scaffold `src/App.jsx` imports and function signature**

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { TopBar } from './components/TopBar.jsx';
import { PageHead } from './components/PageHead.jsx';
import { HUD } from './components/HUD.jsx';
import { HealthStrip } from './components/HealthStrip.jsx';
import { DPad } from './components/DPad.jsx';
import { Toasts } from './components/Toasts.jsx';
import { PointsCard } from './components/side/PointsCard.jsx';
import { RewardsCard } from './components/side/RewardsCard.jsx';
import { LeaderboardCard } from './components/side/LeaderboardCard.jsx';
import { HowToModal } from './modals/HowToModal.jsx';
import { AlreadyPlayedModal } from './modals/AlreadyPlayedModal.jsx';
import { EndModal } from './modals/EndModal.jsx';
import { SignUpModal } from './modals/SignUpModal.jsx';
import { ClaimedModal } from './modals/ClaimedModal.jsx';
import { MazeEngine } from './game/engine.js';
import { generateDailyMaze } from './game/maze.js';
import { TIERS } from './state/tiers.js';
import { todayStr, yesterdayStr } from './state/dates.js';
import { GAME_STORAGE_KEY } from './state/brandConfig.js';
import { usePersistence } from './hooks/usePersistence.js';

export function App() {
  // body assembled in steps 2–4
}
```

- [ ] **Step 2: Port all state hooks, replacing the inline persistence pattern**

Preserve every state variable from the prototype `App` body:

```jsx
const canvasRef = useRef(null);
const engineRef = useRef(null);
const [snap, setSnap] = useState({
  score: 0, lives: 3, health: 20, pellets: 0, powers: 0, flares: 0,
  remaining: 0, elapsed: 0, win: false, gameOver: false,
});
const [modal, setModal] = useState('howto');
const [toasts, setToasts] = useState([]);

// REPLACED: the prototype had
//   const [persisted, setPersisted] = useState(() => loadState() || { ... DEFAULT ... });
//   useEffect(() => { saveState(persisted); }, [persisted]);
// NEW: single hook — same API shape, same schema, auto-save baked in.
const [persisted, setPersisted] = usePersistence();

const [earnedThisRun, setEarnedThisRun] = useState(0);
const [isPractice, setIsPractice] = useState(false);
const [claimedTier, setClaimedTier] = useState(null);
const [running, setRunning] = useState(false);

const completedToday = persisted.lastPlayed === todayStr();
const isGuest = !persisted.user;
```

Remove the prototype's top-level `LS_KEY`, `loadState`, `saveState` declarations entirely — `usePersistence` owns them now.

- [ ] **Step 3: Port the behavior callbacks verbatim**

Copy these functions from `_prototype/game/app.jsx` unchanged:
- `pushToast` (useCallback)
- `startGame` (useCallback — keeps its inline `setInterval` snapshot poll; the `useEngineSnap` refactor lands in Chunk 3)
- `yesterdayStr` local → **delete local copy**, use the imported one
- the two `useEffect` hooks (completedToday → alreadyPlayed modal; cleanup on unmount)
- `setDir`, `onSignUp`, `onSignUpComplete`, `onClaim`

In `onSignUpComplete`, no logic change. In `onClaim`, no logic change — still loyalty-style (no points deduction) as the spec notes.

- [ ] **Step 4: Port the JSX return verbatim**

Copy the JSX block from the prototype's `App` return statement (lines ~547–599). No markup changes. Note the existing "Reset demo data" ghost button stays — spec does not remove it this chunk.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat(app): port App orchestrator to Vite; usePersistence replaces inline save"
```

---

### Task 11: Parity smoke test (dev + production build)

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: Vite serves at `http://localhost:5173`. No console errors.

- [ ] **Step 2: Run smoke checklist against dev server**

Open `http://localhost:5173` in browser. Verify:
- [ ] HowToModal shows on first load
- [ ] Outfit font renders (not system fallback) — inspect element, computed `font-family` starts with `Outfit`
- [ ] EPAVANCE logo loads in top bar
- [ ] Start Run begins engine, canvas renders
- [ ] Arrow keys and WASD move Villi
- [ ] Collecting EPA increments score and heals gut wall bar
- [ ] Soft-gel triggers scare mode (ghosts turn teal)
- [ ] Hitting a ghost loses a life
- [ ] Clearing maze shows EndModal with correct breakdown
- [ ] Sign-up modal saves user; refresh preserves points and user avatar
- [ ] Mobile D-pad shows when DevTools device mode is set to iPhone/Android
- [ ] Tunnel wrap works (walk through row-10 left edge → appear right edge)
- [ ] Reset demo button clears state and reloads

- [ ] **Step 3: Fix any parity bugs, commit**

```bash
git add -A
git commit -m "fix: parity issues discovered in post-port smoke test"
```

Only commit if fixes were needed. If no issues found, skip this step.

- [ ] **Step 4: Production build check**

```bash
npm run build
npm run preview
```

Expected: `dist/` directory created, `preview` serves at `http://localhost:4173`. Open in browser and re-run the critical subset of the smoke checklist:
- [ ] Page loads without console errors
- [ ] Outfit font loads from `/fonts/...` (check Network tab — 200 response, not 404)
- [ ] Logo loads from `/logos/...`
- [ ] Start Run works end-to-end
- [ ] CSS-in-JS and canvas rendering match dev mode

Production-mode asset paths catch issues that dev server masks (e.g. base-URL, font MIME type). Fix anything broken before proceeding.

- [ ] **Step 5: Commit any production-build fixes**

```bash
git add -A
git commit -m "fix: production build asset path / MIME issues"
```

Skip if no fixes needed.

**Chunk 1 done.** The app is on Vite with full feature parity with the prototype — dev and production both verified. `_prototype/` remains on disk as reference material through Chunk 2; it will be deleted at the start of Chunk 3 (or sooner if confidence is high).

---

## Chunk 2: Brand Modules

Goal: add the new standalone modules that power the brand-experience features, each with TDD coverage where the logic is pure. No UI integration in this chunk — the modules are built and tested in isolation; Chunk 3 wires them into the React tree.

### Task 12: Confetti particle system

**Files:**
- Create: `src/brand/confetti.js`

Canvas particle emitter — pure imperative module, no React. Lives as an overlay canvas injected into a container element, self-cleans when the last particle dies.

- [ ] **Step 1: Create `src/brand/confetti.js` with the public API**

```js
/**
 * Fire a burst of confetti inside `containerEl`.
 * Creates a transient canvas positioned absolutely over the container,
 * runs the particle loop until all particles fade, then removes the canvas.
 *
 * Options:
 *   bursts     - number of staggered bursts (default 3)
 *   burstGapMs - ms between bursts (default 200)
 *   perBurst   - particles per burst (default 80)
 *   palette    - CSS color strings (default brand teal/gold)
 *   origin     - 'center' | 'top' (default 'center')
 */
export function burstConfetti(containerEl, opts = {}) {
  const {
    bursts = 3,
    burstGapMs = 200,
    perBurst = 80,
    palette = ['#008080', '#78bfbf', '#d9a84a', '#def4f4'],
    origin = 'center',
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;inset:0;pointer-events:none;z-index:6;';
  containerEl.appendChild(canvas);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    const r = containerEl.getBoundingClientRect();
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
  };
  resize();

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles = [];
  let burstsFired = 0;

  const fireBurst = () => {
    const r = containerEl.getBoundingClientRect();
    const cx = r.width / 2;
    const cy = origin === 'top' ? 60 : r.height / 2;
    for (let i = 0; i < perBurst; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.3,
        size: 4 + Math.random() * 6,
        color: palette[Math.floor(Math.random() * palette.length)],
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
        life: 1.0, // 1.0 → 0 over ~2.5s
      });
    }
    burstsFired++;
    if (burstsFired < bursts) setTimeout(fireBurst, burstGapMs);
  };
  fireBurst();

  let raf = 0;
  let lastT = performance.now();
  const tick = (now) => {
    const dt = Math.min(now - lastT, 48);
    lastT = now;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 0.4;         // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.life -= dt / 2500;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (particles.length === 0 && burstsFired >= bursts) {
      cancelAnimationFrame(raf);
      canvas.remove();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    canvas.remove();
  };
}
```

- [ ] **Step 2: Smoke-check in isolation**

Create `src/brand/confetti.manual.html` (temporary — will be deleted after verification):

```html
<!doctype html>
<html><body>
  <div id="stage" style="position:relative;width:600px;height:400px;border:1px solid #ccc"></div>
  <button onclick="fire()">Fire</button>
  <script type="module">
    import { burstConfetti } from './confetti.js';
    window.fire = () => burstConfetti(document.getElementById('stage'));
  </script>
</body></html>
```

Run `npm run dev`, open `http://localhost:5173/src/brand/confetti.manual.html`, click "Fire" several times. Verify:
- [ ] Bursts emanate from center
- [ ] Particles fall with gravity
- [ ] Palette is teal-500, teal-300, capsule-gold, teal-100
- [ ] Canvas is removed from DOM after ~3s (inspect `<div id="stage">` — should have no `<canvas>` child)

- [ ] **Step 3: Delete the manual smoke file and commit**

```bash
rm src/brand/confetti.manual.html
git add src/brand/confetti.js
git commit -m "feat(brand): confetti particle burst module"
```

---

### Task 13: Heal sweep module + engine integration

**Files:**
- Create: `src/brand/healSweep.js`
- Modify: `src/game/engine.js`

The heal sweep replaces the prototype's "pause and open modal" on win. The engine enters a new `celebrating` state; during that state, `_draw()` delegates wall color to the sweep module.

- [ ] **Step 1: Create `src/brand/healSweep.js`**

```js
/**
 * Compute the healRatio (0..1) for a given wall tile column `x` at time `t` (0..1).
 *
 * The sweep is a left-to-right wave with a 30%-wide leading edge. Columns behind
 * the wave are fully healed (1); columns ahead are at their pre-celebration ratio.
 *
 * @param {number} x             column index (0 .. width-1)
 * @param {number} width         maze width in tiles
 * @param {number} t             elapsed celebration time normalized to [0, 1]
 * @param {number} baseRatio     health ratio at celebration start
 */
export function sweepRatio(x, width, t, baseRatio) {
  if (t <= 0) return baseRatio;
  if (t >= 1) return 1;
  const leading = width * 1.3 * t;   // wave front in column units
  const trailing = leading - width * 0.3;
  if (x <= trailing) return 1;
  if (x >= leading) return baseRatio;
  const localT = (leading - x) / (width * 0.3);
  return baseRatio + (1 - baseRatio) * localT;
}

export const HEAL_SWEEP_MS = 1500;
```

- [ ] **Step 2: Write failing tests for `sweepRatio`**

Create `src/brand/healSweep.test.js`:

```js
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
    // at t=0.5 the wave front is at column 12.35, trailing at 6.65
    expect(sweepRatio(2, WIDTH, 0.5, 0.2)).toBe(1);       // behind trailing
    expect(sweepRatio(18, WIDTH, 0.5, 0.2)).toBe(0.2);   // ahead of leading
  });

  it('interpolates linearly across the 30%-wide leading edge', () => {
    // Build a monotonic-increase check across the wave band
    const prev = sweepRatio(10, WIDTH, 0.5, 0.2);
    const next = sweepRatio(11, WIDTH, 0.5, 0.2);
    expect(prev).toBeGreaterThanOrEqual(next);
  });
});
```

- [ ] **Step 3: Run tests — expect PASS (logic already written)**

```bash
npm run test -- src/brand/healSweep.test.js
```

- [ ] **Step 4: Wire celebration state into `src/game/engine.js`**

The prototype has two game-over paths: `win` (all pellets cleared) and `lose` (lives=0). The heal sweep only runs on `win`. Modify `_eatPellets()` and add `_celebrateTick()`:

Add new instance fields in the constructor:
```js
this.celebrating = false;           // true while heal sweep runs
this.celebrationStart = 0;
this.baseHealRatio = 0;             // health ratio frozen at celebration start
this.celebrateT = 0;                // normalized [0, 1] progress, updated per tick
```

Modify the win branch in `_eatPellets()` from:
```js
if (this._remainingPellets() === 0 && !this.win) {
  this.win = true;
  this.gameOver = true;
  this.score += 500;
  this.onEvent({ type: 'win', score: 500 });
}
```
To:
```js
if (this._remainingPellets() === 0 && !this.win) {
  this.win = true;
  this.score += 500;
  this.baseHealRatio = this.health / 100;
  this.celebrating = true;
  this.celebrationStart = performance.now();
  this.onEvent({ type: 'win', score: 500 });
}
```

Note `gameOver` is no longer set here — it's set at the end of the celebration so the engine keeps drawing.

Modify `_loop` to branch on `celebrating`:
```js
if (!this.paused && !this.gameOver) {
  if (this.celebrating) {
    this._celebrateTick(now);
  } else {
    this.elapsed += dt;
    this.player.mouthPhase += dt * 0.012;
    this._tryMove(this.player, dt);
    this._eatPellets();
    for (const g of this.ghosts) this._ghostStep(g, dt, now);
  }
}
```

Add `_celebrateTick(now)`:
```js
_celebrateTick(now) {
  const elapsed = now - this.celebrationStart;
  const t = Math.min(1, elapsed / 1500);
  this.celebrateT = t;
  if (t >= 1 && !this.gameOver) {
    this.celebrating = false;
    this.gameOver = true;
    this.onEvent({ type: 'heal-complete' });
  }
}
```

Modify `_draw()` wall-color section to use sweep when celebrating. Import and use:
```js
import { sweepRatio, HEAL_SWEEP_MS } from '../brand/healSweep.js';
```

Replace the existing single `healRatio = this.health / 100` computation with a per-column calculation inside the wall loop. Rename the local to `liveHealRatio` to avoid shadowing confusion with `this.baseHealRatio` (the frozen start-of-celebration value):
```js
// existing:  const healRatio = this.health / 100;
// new — computed once per _draw call:
const liveHealRatio = this.health / 100;
// ...inside the wall rendering loop, for each (x, y) wall cell:
const healRatio = this.celebrating
  ? sweepRatio(x, this.maze.width, this.celebrateT, this.baseHealRatio)
  : liveHealRatio;
const r = Math.round(lerp(201, 0, healRatio));
const gr = Math.round(lerp(138, 128, healRatio));
const b = Math.round(lerp(142, 128, healRatio));
```

Also update the lose path in `_playerHit`: when lives reach 0 it already fires `{ type: 'lose' }` and sets `gameOver = true`. No change needed — lose skips the celebration entirely.

- [ ] **Step 5: Commit**

```bash
git add src/brand/healSweep.js src/brand/healSweep.test.js src/game/engine.js
git commit -m "feat(brand): heal sweep module + engine celebration state"
```

---

### Task 14: Score card PNG generator

**Files:**
- Create: `src/brand/scoreCard.js`

- [ ] **Step 1: Create `src/brand/scoreCard.js`**

```js
import { SHARE_DOMAIN } from '../state/brandConfig.js';

const W = 1200;
const H = 630;

/**
 * Render a social-shareable score card to a PNG Blob.
 *
 * Input comes from the captured end-of-run snapshot:
 *   { score, dateLabel, streak, healPct }   (healPct: integer 0..100)
 */
export async function generateScoreCard({ score, dateLabel, streak, healPct }) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#006666');
  bg.addColorStop(1, '#004d4d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Radial highlight
  const glow = ctx.createRadialGradient(W * 1.1, H * -0.2, 0, W * 1.1, H * -0.2, W * 0.9);
  glow.addColorStop(0, 'rgba(255,255,255,0.12)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Logo (async; resolve before returning the blob)
  const logo = await loadImage('/logos/epavance-logo.png');
  const logoH = 48;
  const logoW = logo.width * (logoH / logo.height);
  ctx.drawImage(logo, 80, 70, logoW, logoH);

  // Eyebrow
  ctx.fillStyle = '#aedbdb';
  ctx.font = '600 24px Outfit, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('EPAVANCE · DAILY CALM', 80, 170);

  // Score
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 180px Outfit, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(score.toLocaleString('en-GB'), 80, H / 2 + 10);

  // Sub line
  ctx.fillStyle = '#aedbdb';
  ctx.font = '500 26px Outfit, sans-serif';
  ctx.textBaseline = 'top';
  const streakText = streak > 1 ? `🔥 ${streak}-day streak` : 'Day 1';
  ctx.fillText(`${dateLabel} · ${streakText}`, 80, 440);

  // Progress bar
  const barX = 80, barY = 500, barW = 400, barH = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundRect(ctx, barX, barY, barW, barH, 6);
  ctx.fill();
  ctx.fillStyle = '#d9a84a';
  roundRect(ctx, barX, barY, (barW * healPct) / 100, barH, 6);
  ctx.fill();
  ctx.fillStyle = '#aedbdb';
  ctx.font = '500 18px Outfit, sans-serif';
  ctx.fillText(`Gut wall ${healPct}% healed`, barX, barY + barH + 12);

  // Footer
  ctx.fillStyle = '#78bfbf';
  ctx.font = '500 22px Outfit, sans-serif';
  ctx.fillText(`Play today at ${SHARE_DOMAIN}`, 80, H - 70);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('canvas.toBlob returned null'));
    }, 'image/png');
  });
}

/**
 * Trigger a browser download of a Blob under `filename`.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
```

No unit tests — canvas rendering in jsdom is flaky and the output is visual. Verified manually in Chunk 3 integration.

- [ ] **Step 2: Commit**

```bash
git add src/brand/scoreCard.js
git commit -m "feat(brand): score card PNG generator"
```

---

### Task 15: `useCountUp` hook (TDD)

**Files:**
- Create: `src/hooks/useCountUp.js`
- Test: `src/hooks/useCountUp.test.js`

- [ ] **Step 1: Write failing tests**

The hook uses `requestAnimationFrame`. jsdom (modern) implements RAF via its own event-loop scheduling, NOT as a setTimeout polyfill, so `vi.useFakeTimers()` by default does NOT intercept RAF. We stub RAF manually so fake timers control it:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from './useCountUp.js';

describe('useCountUp', () => {
  let nowMs;
  beforeEach(() => {
    vi.useFakeTimers();
    nowMs = 0;
    // RAF shimmed to setTimeout so fake timers drive the loop. The performance.now
    // shim advances in lockstep with vi.advanceTimersByTime so the hook sees real elapsed time.
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

  it('returns integer values (no sub-pixel flicker)', () => {
    const { result } = renderHook(() => useCountUp(1000, { duration: 800 }));
    advance(400);
    expect(Number.isInteger(result.current)).toBe(true);
  });
});
```

- [ ] **Step 2: Install `@testing-library/react`**

```bash
npm install -D @testing-library/react
```

- [ ] **Step 3: Run tests — expect FAIL (no such file)**

```bash
npm run test -- src/hooks/useCountUp.test.js
```

- [ ] **Step 4: Implement `src/hooks/useCountUp.js`**

```js
import { useEffect, useRef, useState } from 'react';

/**
 * Count up to `target` over `duration` ms using ease-out-cubic.
 * Re-triggers when target changes.
 */
export function useCountUp(target, { duration = 800 } = {}) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (typeof target !== 'number' || target <= 0) {
      setValue(target || 0);
      return undefined;
    }
    startRef.current = null;
    setValue(0);

    const tick = (now) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm run test -- src/hooks/useCountUp.test.js
```

The RAF stub set up in Step 1 ensures `vi.advanceTimersByTime()` advances through all frames. If tests fail with timeouts, double-check that `vi.stubGlobal('requestAnimationFrame', ...)` ran *before* `renderHook` — the hook captures RAF at effect-run time.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useCountUp.js src/hooks/useCountUp.test.js
git commit -m "feat(hooks): useCountUp with ease-out-cubic"
```

---

### Task 16: Share-text emoji grid builder (TDD)

**Files:**
- Create: `src/brand/shareText.js`
- Test: `src/brand/shareText.test.js`

The spec's 10-cell rule: `greenCells = round(pct / 10)`; one yellow cell appears at position `greenCells` only if `pct % 10 >= 5`.

Wait — rule reads more naturally as: `greenCells = floor(pct / 10)`, then partial tenth yields a single yellow cell if `pct % 10 >= 5`. Re-check spec.

Re-reading spec §4.2.2: "40% → 4🟢+6⬛" and "45% → 4🟢+1🟡+5⬛". So `greenCells = floor(pct / 10)` (not round), and `hasYellow = pct % 10 >= 5`. 40 → 4 green, 0 yellow (40 % 10 = 0), 6 black. 45 → 4 green, 1 yellow, 5 black. Correct interpretation: floor + threshold.

- [ ] **Step 1: Write failing tests**

Create `src/brand/shareText.test.js`:

```js
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
    // Each emoji is 1 code point but string-length varies; use Array.from length.
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test -- src/brand/shareText.test.js
```

- [ ] **Step 3: Implement `src/brand/shareText.js`**

```js
import { SHARE_DOMAIN } from '../state/brandConfig.js';

export function buildEmojiGrid(pct) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const green = Math.floor(clamped / 10);
  const hasYellow = clamped % 10 >= 5;
  const blacks = 10 - green - (hasYellow ? 1 : 0);
  return '🟢'.repeat(green) + (hasYellow ? '🟡' : '') + '⬛'.repeat(blacks);
}

export function buildShareText({ score, dateLabel, streak, healPct }) {
  const lines = [
    `🧬 EPAVANCE Daily Calm — ${dateLabel}`,
  ];
  if (streak > 1) {
    lines.push(`Score: ${score.toLocaleString('en-GB')} · 🔥 ${streak} days`);
  } else {
    lines.push(`Score: ${score.toLocaleString('en-GB')}`);
  }
  lines.push(`${buildEmojiGrid(healPct)} (gut wall ${Math.round(healPct)}%)`);
  lines.push(SHARE_DOMAIN);
  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test -- src/brand/shareText.test.js
```

- [ ] **Step 5: Commit**

```bash
git add src/brand/shareText.js src/brand/shareText.test.js
git commit -m "feat(brand): share-text builder with emoji grid"
```

---

### Task 17: Streak change classifier (TDD)

**Files:**
- Create: `src/state/streak.js`
- Test: `src/state/streak.test.js`

Pure function that tells App.jsx which toast to fire after a save.

- [ ] **Step 1: Write failing tests**

Create `src/state/streak.test.js`:

```js
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
    // shouldn't happen with correct save logic, but defend anyway
    expect(classifyStreakChange(4, 4)).toBe('none');
  });

  it('prev 1 → new 2: "increment"', () => {
    expect(classifyStreakChange(1, 2)).toBe('increment');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test -- src/state/streak.test.js
```

- [ ] **Step 3: Implement `src/state/streak.js`**

```js
/**
 * Classify the transition between previous and new streak values
 * to decide which celebration toast (if any) to fire.
 *
 * Returns: 'increment' | 'reset' | 'none'
 *
 * - 'increment' : previous streak ≥ 1 AND new > previous (continuation; 🔥 toast)
 * - 'reset'     : previous streak > 0 AND new streak resets to 1 (gentle toast)
 * - 'none'      : first-ever scored run (prev 0 → new 1), or no meaningful change
 */
export function classifyStreakChange(prev, next) {
  if (prev === 0 && next === 1) return 'none';     // first ever — no celebration
  if (prev > 0 && next > prev) return 'increment'; // continuation
  if (prev > 0 && next < prev) return 'reset';     // gap happened
  return 'none';
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test -- src/state/streak.test.js
```

- [ ] **Step 5: Commit**

```bash
git add src/state/streak.js src/state/streak.test.js
git commit -m "feat(state): classifyStreakChange for toast routing"
```

---

### Task 18: `useEngineSnap` hook (deferred from Chunk 1)

**Files:**
- Create: `src/hooks/useEngineSnap.js`

Same code as originally designed, added here because Chunk 3 will consume it to clean up App.jsx's inline interval.

- [ ] **Step 1: Implement `src/hooks/useEngineSnap.js`**

```js
import { useEffect, useRef, useState } from 'react';

/**
 * Polls engine.snapshot() every `intervalMs` while `running`.
 * Calls `onGameOver(snap)` exactly once when snap.gameOver transitions true.
 */
export function useEngineSnap(engineRef, running, onGameOver, intervalMs = 120) {
  const [snap, setSnap] = useState({
    score: 0, lives: 3, health: 20, pellets: 0, powers: 0, flares: 0,
    remaining: 0, elapsed: 0, win: false, gameOver: false,
  });
  const firedRef = useRef(false);

  useEffect(() => {
    if (!running) {
      firedRef.current = false;
      return undefined;
    }
    const id = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;
      const s = engine.snapshot();
      setSnap(s);
      if (s.gameOver && !firedRef.current) {
        firedRef.current = true;
        onGameOver(s);
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [engineRef, running, onGameOver, intervalMs]);

  return snap;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useEngineSnap.js
git commit -m "feat(hooks): useEngineSnap with one-shot game-over callback"
```

---

### Task 19: Chunk 2 verification

- [ ] **Step 1: Run all tests**

```bash
npm run test
```

Expected: all tests pass — rng, maze, dates, healSweep, useCountUp, shareText, streak.

- [ ] **Step 2: Verify build still works**

```bash
npm run build
```

Expected: clean build, no errors. No new code is wired into the UI yet — this confirms modules compile correctly.

- [ ] **Step 3: Commit the verification checkpoint**

If any fixes were made, commit them. Otherwise skip.

**Chunk 2 done.** All brand modules exist and are unit-tested in isolation. Chunk 3 wires them into the React tree and ships.

---

## Chunk 3: UI Integration, Deployment & QA

Goal: wire the brand modules into the React tree, enhance the HowTo and End modals, add the streak celebration, deploy to Vercel, and run the full smoke checklist.

### Task 20: Delete prototype archive

With Vite on a passing build and brand modules complete, the prototype is no longer needed as reference.

- [ ] **Step 1: Delete the archive**

```bash
rm -rf _prototype
git add -A
git commit -m "chore: remove prototype archive"
```

---

### Task 21: Enhance `EndModal` — count-up, share row, conversion banner, countdown

**Files:**
- Modify: `src/modals/EndModal.jsx`
- Modify: `src/state/dates.js` (add `formatShortDate`, `hoursRemainingUntil24h`)

The prototype EndModal renders score as plain text and has a static guest banner. This task makes it the brand moment.

- [ ] **Step 1: Add helpers to `src/state/dates.js`**

```js
// Append to src/state/dates.js
export function formatShortDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Returns a { h, m } countdown until 24h after the given ISO timestamp.
 * If already past 24h, returns { h: 0, m: 0 }.
 */
export function hoursRemainingUntil24h(fromIso) {
  if (!fromIso) return { h: 0, m: 0 };
  const elapsedMs = Date.now() - new Date(fromIso).getTime();
  const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - elapsedMs);
  const totalMin = Math.floor(remainingMs / 60_000);
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}
```

- [ ] **Step 2: Add date tests for the new helpers**

Append to `src/state/dates.test.js`:

```js
import { formatShortDate, hoursRemainingUntil24h } from './dates.js';

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
```

Run: `npm run test -- src/state/dates.test.js` — expect 7 passing.

- [ ] **Step 3: Rewrite `src/modals/EndModal.jsx`**

Replace the entire file. Key additions:
- `useCountUp` for the main score
- Share row (Download card + Copy share text)
- Conversion-tuned guest banner with live countdown
- Dependency on saved `lastPlayedAt` (ISO, added in Task 22's App.jsx changes)

```jsx
import { useEffect, useState, useCallback } from 'react';
import { fmt, hoursRemainingUntil24h, formatShortDate } from '../state/dates.js';
import { useCountUp } from '../hooks/useCountUp.js';
import { generateScoreCard, downloadBlob } from '../brand/scoreCard.js';
import { buildShareText } from '../brand/shareText.js';
import { SHARE_DOMAIN } from '../state/brandConfig.js';

export function EndModal({
  snap,
  earned,
  isGuest,
  isPractice,
  streak,
  lastPlayedAt,
  onSignUp,
  onClose,
  onToast,
}) {
  const win = snap.win;
  const displayTotal = isPractice ? snap.score : earned;
  const animated = useCountUp(displayTotal, { duration: 800 });

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await generateScoreCard({
        score: displayTotal,
        dateLabel: formatShortDate(new Date()),
        streak,
        healPct: snap.health,
      });
      downloadBlob(blob, `epavance-daily-calm-${new Date().toISOString().slice(0, 10)}.png`);
    } catch {
      onToast?.('Couldn\'t generate share card — try copy text instead.');
    } finally {
      setDownloading(false);
    }
  }, [displayTotal, streak, snap.health, downloading, onToast]);

  const handleCopy = useCallback(async () => {
    const text = buildShareText({
      score: displayTotal,
      dateLabel: formatShortDate(new Date()),
      streak,
      healPct: snap.health,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast?.('Copy failed — long-press to copy manually.');
    }
  }, [displayTotal, streak, snap.health, onToast]);

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <span className="eyebrow">{isPractice ? 'Practice complete' : win ? 'Daily maze complete' : 'Run ended'}</span>
          <h2>{win ? 'The gut wall is calm.' : 'Flares got through.'}</h2>
          <p>
            {isPractice
              ? 'Practice runs don\'t count toward your points or leaderboard — they\'re here to help you learn the maze.'
              : win
                ? 'You cleared every EPA molecule and earned the daily completion bonus. Points added to your account.'
                : 'Every EPA molecule you collected still earns points. Try again tomorrow for a fresh maze.'}
          </p>
        </div>

        <div className="modal-body">
          <div className="breakdown">
            <span className="lbl">EPA molecules ({snap.pellets})</span>
            <span className="val">+{fmt(snap.pellets * 10)}</span>
            <span className="lbl">EPA soft-gels ({snap.powers})</span>
            <span className="val">+{fmt(snap.powers * 50)}</span>
            <span className="lbl">Flares absorbed ({snap.flares})</span>
            <span className="val">+{fmt(snap.flares * 200)}</span>
            {win && <><span className="lbl">Daily completion</span><span className="val">+500</span></>}
            <span className="total-lbl">{isPractice ? 'Practice score' : 'Points earned'}</span>
            <span className="total-val">{fmt(animated)}</span>
          </div>

          {!isPractice && (
            <div className="share-row">
              <button className="btn btn-primary btn-sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Generating…' : 'Download card'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copied ? 'Copied ✓' : 'Copy share text'}
              </button>
            </div>
          )}

          {isGuest && !isPractice && earned > 0 && (
            <GuestConversionBanner
              earned={earned}
              lastPlayedAt={lastPlayedAt}
              onSignUp={onSignUp}
            />
          )}
        </div>

        <div className="modal-foot">
          {isGuest && !isPractice && earned > 0 ? (
            <button className="btn btn-ghost btn-block" onClick={onClose}>Not yet — maybe later</button>
          ) : (
            <button className="btn btn-primary btn-block" onClick={onClose}>Continue</button>
          )}
        </div>
      </div>
    </div>
  );
}

function GuestConversionBanner({ earned, lastPlayedAt, onSignUp }) {
  const [countdown, setCountdown] = useState(() => hoursRemainingUntil24h(lastPlayedAt));
  useEffect(() => {
    const id = setInterval(() => setCountdown(hoursRemainingUntil24h(lastPlayedAt)), 60_000);
    return () => clearInterval(id);
  }, [lastPlayedAt]);
  return (
    <div className="conversion-banner">
      <div className="conv-head">Save your <b>{fmt(earned)}</b> points before they expire</div>
      <div className="conv-sub">
        Guest points expire in <b>{countdown.h}h {String(countdown.m).padStart(2, '0')}m</b>. Create a free account to keep them, track your streak, and unlock rewards on your next order.
      </div>
      <button className="btn btn-primary btn-block" onClick={onSignUp} style={{ marginTop: 12 }}>
        Save my {fmt(earned)} points
      </button>
      <div className="conv-social">Keep your streak alive — come back tomorrow for a fresh maze.</div>
    </div>
  );
}
```

- [ ] **Step 4: Add CSS for new elements**

Append to `src/styles/game.css`:

```css
/* End modal — share row */
.share-row {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  justify-content: center;
  flex-wrap: wrap;
}
.share-row .btn { min-width: 140px; }

/* End modal — conversion banner */
.conversion-banner {
  margin-top: 18px;
  padding: 16px 18px;
  background: var(--teal-050);
  border: 1px solid var(--teal-200);
  border-radius: var(--radius-md);
}
.conversion-banner .conv-head {
  font-size: 14px;
  font-weight: 600;
  color: var(--fg-1);
  margin-bottom: 4px;
}
.conversion-banner .conv-head b { color: var(--fg-brand-strong); font-family: var(--font-display); }
.conversion-banner .conv-sub {
  font-size: 12.5px;
  color: var(--fg-3);
  line-height: 1.55;
}
.conversion-banner .conv-sub b { color: var(--fg-brand-strong); font-variant-numeric: tabular-nums; }
.conversion-banner .conv-social {
  margin-top: 10px;
  font-size: 11.5px;
  color: var(--fg-3);
  text-align: center;
  font-style: italic;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/modals/EndModal.jsx src/state/dates.js src/state/dates.test.js src/styles/game.css
git commit -m "feat(end-modal): count-up, share row, conversion-tuned banner"
```

---

### Task 22: Wire brand features into `App.jsx`

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/hooks/usePersistence.js` (add `lastPlayedAt` to schema)

Before the modal opens, App must: (a) run confetti, (b) capture the final snap (frozen `health` at run-end), (c) compute earned streak change, (d) pass `lastPlayedAt` ISO to the modal, (e) fire streak toast.

- [ ] **Step 1: Extend persistence schema with `lastPlayedAt`**

Edit `src/hooks/usePersistence.js` — add `lastPlayedAt: null` to the `DEFAULT` object. No migration needed (spread merge in callers covers older payloads).

- [ ] **Step 2: Modify `startGame` in App.jsx to support the new flow**

The current flow polls a 120ms interval. Replace with `useEngineSnap`. Create a top-level callback `handleGameOver(finalSnap)` that runs once when `snap.gameOver` flips. The modal open is driven by the engine's `heal-complete` event (win path) or immediately (lose path), NOT by a hardcoded delay.

Add to the existing imports (note `yesterdayStr` is already imported from Task 10 Step 1 — keep it; add the new ones):

```jsx
import { burstConfetti } from './brand/confetti.js';
import { useEngineSnap } from './hooks/useEngineSnap.js';
import { classifyStreakChange } from './state/streak.js';
```

Add a new ref and a streak-change announcement effect inside `App`:

```jsx
const canvasHolderRef = useRef(null);
const prevStreakRef = useRef(null);  // captured pre-save; compared in effect below

// Announce streak changes when persisted.streak shifts.
// This runs AFTER React commits the new streak to the DOM, so StrictMode's
// double-invocation of the reducer doesn't cause duplicate toasts.
useEffect(() => {
  const prev = prevStreakRef.current;
  const next = persisted.streak || 0;
  if (prev !== null && prev !== next) {
    const change = classifyStreakChange(prev, next);
    if (change === 'increment') pushToast(`🔥 ${next} day streak!`, null, 'streak');
    else if (change === 'reset') pushToast('Streak reset — start a new one today', null);
  }
  prevStreakRef.current = next;
}, [persisted.streak, pushToast]);
```

Create `handleGameOver`. Key points: (a) functional state updater is pure — no side effects inside; (b) modal open is deferred to the engine's `heal-complete` event for wins; (c) lose path opens the modal after the existing 600ms engine pause (preserved from prototype):

```jsx
const handleGameOver = useCallback((finalSnap) => {
  engineRef.current?.pause(true);
  setRunning(false);
  const earned = isPractice ? 0 : finalSnap.score;
  setEarnedThisRun(earned);

  if (!isPractice) {
    const nowIso = new Date().toISOString();
    setPersisted((p) => {
      const wasYesterday = p.lastPlayed === yesterdayStr();
      return {
        ...p,
        totalPoints: (p.totalPoints || 0) + earned,
        lastPlayed: todayStr(),
        lastPlayedAt: nowIso,
        lastScore: finalSnap.score,
        streak: wasYesterday ? (p.streak || 0) + 1 : 1,
      };
    });
  }

  if (finalSnap.win && canvasHolderRef.current) {
    burstConfetti(canvasHolderRef.current, { bursts: 3 });
    // Modal opens on the `heal-complete` engine event (see startGame onEvent handler).
  } else {
    // Lose path: preserve prototype's 600ms delay before the modal.
    setTimeout(() => setModal('end'), 600);
  }
}, [isPractice, setPersisted]);

const snap = useEngineSnap(engineRef, running, handleGameOver);
```

Remove the prototype's `snap = useState(...)` declaration and the inline `setInterval` block inside `startGame`. The hook owns that now.

Simplify `startGame` — and route the `heal-complete` event to the modal open:

```jsx
const startGame = useCallback((practice = false) => {
  setIsPractice(practice);
  setEarnedThisRun(0);
  if (engineRef.current) engineRef.current.stop();
  const maze = generateDailyMaze('epavance-' + todayStr());
  const engine = new MazeEngine(canvasRef.current, maze, {
    onEvent: (e) => {
      if (e.type === 'dot') {/* too frequent */}
      else if (e.type === 'power') pushToast('Soft-gel collected', e.score);
      else if (e.type === 'flare') pushToast(`${e.name} flare absorbed`, e.score);
      else if (e.type === 'hit') pushToast('Inflammation contact — life lost');
      else if (e.type === 'win') pushToast('Daily maze complete', 500);
      else if (e.type === 'heal-complete') {
        // Win path: heal sweep just finished — open the modal with a 200ms settle.
        setTimeout(() => setModal('end'), 200);
      }
    },
  });
  engineRef.current = engine;
  engine.start();
  setRunning(true);
  setModal(null);
}, [pushToast]);
```

Flow summary:
- **Win:** engine fires `win` → enters celebration → `gameOver` stays false → after 1.5s engine fires `heal-complete` + sets `gameOver=true`. `useEngineSnap` observes `gameOver`, calls `handleGameOver` (save + confetti), and the `heal-complete` event listener opens the modal 200ms later.
- **Lose:** engine fires `hit` → `_playerHit` decrements lives → last life sets `gameOver=true` immediately. `handleGameOver` runs, no confetti, modal opens after 600ms (prototype parity).

- [ ] **Step 3: Add `ref={canvasHolderRef}` to the `.canvas-holder` div**

Locate the `<div className="canvas-holder">` in App's JSX return and add the ref. The confetti overlay mounts into this container.

- [ ] **Step 4: Extend `pushToast` to support a style hint (used for streak toast)**

Replace the existing `pushToast` callback in App.jsx with:

```jsx
const pushToast = useCallback((text, amt, style) => {
  const id = Math.random().toString(36).slice(2);
  setToasts((ts) => [...ts, { id, text, amt, style }]);
  setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2200);
}, []);
```

Then update `src/components/Toasts.jsx`. Replace **only the body of the `.map(...)` call** inside the existing `<div className="toast-stack">` wrapper — leave the surrounding wrapper div unchanged:

```jsx
{items.map((t) => (
  <div className={`toast${t.style ? ' toast-' + t.style : ''}`} key={t.id}>
    {t.text} {t.amt != null && <span className="amt">+{t.amt}</span>}
  </div>
))}
```

Append to `src/styles/game.css`:

```css
.toast-streak {
  animation: streakIn 280ms var(--ease-emphasis) both, toastOut 300ms var(--ease-standard) 1.6s both;
}
@keyframes streakIn {
  from { opacity: 0; transform: translateY(-4px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

- [ ] **Step 5: Pass `streak` and `lastPlayedAt` to EndModal**

In the JSX return inside App, update the EndModal render:

```jsx
{modal === 'end' && (
  <EndModal
    snap={snap}
    earned={earnedThisRun}
    isGuest={isGuest}
    isPractice={isPractice}
    streak={persisted.streak || 0}
    lastPlayedAt={persisted.lastPlayedAt}
    onSignUp={onSignUp}
    onClose={() => setModal(null)}
    onToast={(msg) => pushToast(msg)}
  />
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/hooks/usePersistence.js src/components/Toasts.jsx src/styles/game.css
git commit -m "feat(app): wire confetti, heal sweep, streak toasts, countdown into App"
```

---

### Task 23: Pulse PointsCard streak number on change

**Files:**
- Modify: `src/components/side/PointsCard.jsx`
- Modify: `src/styles/game.css`

- [ ] **Step 1: Add a pulse effect triggered by streak prop changes**

```jsx
import { useEffect, useState } from 'react';
import { fmt } from '../../state/dates.js';
import { TIERS } from '../../state/tiers.js';

export function PointsCard({ totalPoints, streak }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (streak > 0) {
      setPulse(true);
      const id = setTimeout(() => setPulse(false), 700);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [streak]);

  const nextTier = TIERS.find((t) => t.pts > totalPoints);
  const progress = nextTier ? Math.min(100, (totalPoints / nextTier.pts) * 100) : 100;

  return (
    <div className="card">
      <div className="points-hero">
        {/* ...existing markup, but streak number wrapped with pulse class... */}
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--teal-200)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Day streak · <b className={pulse ? 'pulse' : ''} style={{ color: '#fff', display: 'inline-block' }}>{streak}</b></span>
          <span>Member since 2026</span>
        </div>
      </div>
    </div>
  );
}
```

Keep the rest of the markup (label, big number, sub, progress bar) unchanged from the ported version.

- [ ] **Step 2: Add pulse CSS**

Append to `src/styles/game.css`:

```css
.pulse {
  animation: pulseOnce 600ms var(--ease-emphasis);
}
@keyframes pulseOnce {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/side/PointsCard.jsx src/styles/game.css
git commit -m "feat(points-card): pulse streak number on change"
```

---

### Task 24: Animated HowTo modal diagram

**Files:**
- Create: `src/brand/howToAnimator.js`
- Modify: `src/modals/HowToModal.jsx`

A small 240×120 canvas loops a short teaching animation: Villi moves right, eats a pellet, turns back, eats a power capsule, scare tint flash.

- [ ] **Step 1: Create `src/brand/howToAnimator.js`**

```js
/**
 * Start a looping teaching animation on the given canvas.
 * Returns a stop() cleanup function.
 */
export function startHowToLoop(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 240, H = 120;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  let raf = 0;
  const start = performance.now();

  const tick = (now) => {
    const t = ((now - start) / 2000) % 1; // 2s loop

    ctx.clearRect(0, 0, W, H);

    // background
    ctx.fillStyle = '#def4f4';
    ctx.fillRect(0, 0, W, H);

    // 3-tile horizontal maze strip
    const tile = 40;
    const cy = H / 2;
    const startX = (W - tile * 5) / 2;

    // rails (walls top & bottom)
    ctx.fillStyle = 'rgba(0,128,128,0.15)';
    ctx.fillRect(0, cy - tile / 2 - 4, W, 4);
    ctx.fillRect(0, cy + tile / 2, W, 4);

    // pellets at positions 1, 3 (fade after eaten)
    const eat1 = t > 0.25;
    const eat2 = t > 0.75;
    if (!eat1) drawPellet(ctx, startX + tile * 1 + tile / 2, cy, 3, '#008080');
    if (!eat2) drawPowerPellet(ctx, startX + tile * 3 + tile / 2, cy, t);

    // Villi position across the loop
    let vx;
    if (t < 0.5) vx = startX + tile * 0 + tile / 2 + (t / 0.5) * tile * 2;
    else vx = startX + tile * 2 + tile / 2 + ((t - 0.5) / 0.5) * tile * 2;

    const scareFlash = t > 0.78 && t < 0.92;
    drawVilli(ctx, vx, cy, t, scareFlash);

    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(raf);
}

function drawPellet(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawPowerPellet(ctx, x, y, t) {
  const pulse = 1 + Math.sin(t * Math.PI * 4) * 0.15;
  const grd = ctx.createRadialGradient(x - 2, y - 3, 1, x, y, 7);
  grd.addColorStop(0, '#ffdc8c');
  grd.addColorStop(1, '#c69533');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, 7 * pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawVilli(ctx, x, y, t, scareFlash) {
  const mouthPhase = Math.sin(t * Math.PI * 8);
  const mouth = (mouthPhase * 0.5 + 0.5) * 0.55;
  ctx.save();
  ctx.translate(x, y);
  const grd = ctx.createRadialGradient(-4, -4, 1, 0, 0, 14);
  grd.addColorStop(0, scareFlash ? '#aedbdb' : '#4ca6a6');
  grd.addColorStop(1, scareFlash ? '#4ca6a6' : '#006666');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 13, mouth, Math.PI * 2 - mouth);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#004d4d';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}
```

- [ ] **Step 2: Update `src/modals/HowToModal.jsx`**

Do **not** rewrite the file. Three surgical edits:

1. Change the existing import line `import { ... } from 'react';` (if missing) to include `useEffect` and `useRef`, or add them if the file had no React hook imports.
2. Add one new import: `import { startHowToLoop } from '../brand/howToAnimator.js';`
3. Inside the function body, at the top, add the hook; inside the JSX `<div className="modal-body">`, insert the preview block **before** the existing `<div className="legend">...</div>` (leave the legend markup from Chunk 1 Task 9 completely unchanged); tighten the controls-line copy to include the mobile hint.

```jsx
// at top of function
const canvasRef = useRef(null);
useEffect(() => {
  if (!canvasRef.current) return undefined;
  return startHowToLoop(canvasRef.current);
}, []);
```

```jsx
// inside <div className="modal-body">, ABOVE the existing <div className="legend">
<div className="howto-preview">
  <canvas ref={canvasRef} />
</div>
```

```jsx
// replace the existing controls-line <div style={{ marginTop: 18, ... }}> contents with:
Move with <span className="kbd">↑</span><span className="kbd">↓</span><span className="kbd">←</span><span className="kbd">→</span> or <span className="kbd">W</span><span className="kbd">A</span><span className="kbd">S</span><span className="kbd">D</span> on desktop · tap the D-pad on mobile. Clear every molecule to earn the daily completion bonus.
```

Nothing else in the file changes.

- [ ] **Step 3: Add CSS for the preview**

Append to `src/styles/game.css`:

```css
.howto-preview {
  display: flex;
  justify-content: center;
  margin: 12px 0 4px;
  background: var(--teal-050);
  border-radius: var(--radius-md);
  border: 1px solid var(--teal-100);
  padding: 8px;
}
.howto-preview canvas { display: block; border-radius: var(--radius-sm); }
```

- [ ] **Step 4: Commit**

```bash
git add src/brand/howToAnimator.js src/modals/HowToModal.jsx src/styles/game.css
git commit -m "feat(howto): animated teaching loop in onboarding modal"
```

---

### Task 25: Vercel deployment config + README

**Files:**
- Create: `vercel.json`
- Create: `README.md`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

- [ ] **Step 2: Create `README.md`**

```markdown
# VANCE Daily Calm

An interactive Pac-Man-style loyalty game for EPAVANCE — a Food for Special Medical Purposes for IBD dietary management. Players guide a gut cell through a daily-regenerated maze, collect EPA molecules, heal the gut wall, and earn points toward rewards.

## Stack

- Vite + React 18 (JavaScript)
- Canvas 2D for game engine + brand visuals
- Vercel static deployment

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # run unit tests (rng, maze, dates, heal sweep, count-up, share text, streak)
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
```

## Deployment

Pushed to any branch → Vercel preview URL. Push to `main` → production deploy.

No env vars. No serverless functions.

## Smoke Checklist (manual QA)

Run before each production deploy:

1. First load → HowToModal with animated teaching loop
2. Start run → engine runs, Villi moves via arrows/WASD
3. EPA molecule → score +10, gut wall bar advances
4. Soft-gel → score +50, ghosts turn teal (scare mode)
5. Absorb a scared ghost → score +200
6. Hit a ghost un-scared → lose a life, reset positions
7. Clear all pellets → heal sweep (~1.5s) + confetti burst → EndModal opens
8. EndModal score counts up from 0
9. Click "Download card" → PNG downloads, opens, looks branded
10. Click "Copy share text" → clipboard has emoji grid
11. Guest + scored run → conversion banner shows countdown, CTA opens SignUpModal
12. Submit signup → user persists across refresh
13. Claim a reward tier → ClaimedModal
14. Refresh same-day → AlreadyPlayedModal replaces HowTo
15. Practice run → points/streak unchanged
16. Set localStorage `lastPlayed` to yesterday, play → 🔥 streak toast + pulse in PointsCard
17. Mobile viewport → D-pad visible, touch targets work
18. Reset demo data → returns to first-load state

## Known integration points (future backend)

- `src/components/side/LeaderboardCard.jsx` — mocked with deterministic names (§5 of spec)
- `src/hooks/usePersistence.js` — localStorage; swap for server-side loyalty wallet
- `src/App.jsx` `onSignUpComplete` — stub; replace with real EPAVANCE auth
- `src/App.jsx` `onClaim` — loyalty-style unlock (no deduction); confirm spend rules with product
```

- [ ] **Step 3: Commit**

```bash
git add vercel.json README.md
git commit -m "chore: Vercel config + README with smoke checklist"
```

---

### Task 26: Full test + build verification

- [ ] **Step 1: Run all tests**

```bash
npm run test
```

Expected: all tests pass (rng, maze, dates incl. new helpers, heal sweep, useCountUp, shareText, streak).

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: clean build, dist/ populated, bundle size sane (< 200 KB gzipped — warn if exceeded).

- [ ] **Step 3: Run preview and full smoke checklist from README**

```bash
npm run preview
```

Walk every item in the README smoke checklist against `http://localhost:4173`. Fix any issues, commit.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: smoke-test polish" # only if fixes made
```

---

### Task 27: Ship to Vercel

- [ ] **Step 1: Create a new GitHub repo**

Name: `vance-daily-calm`. Push current branch:

```bash
git remote add origin git@github.com:<owner>/vance-daily-calm.git
git push -u origin main
```

- [ ] **Step 2: Import to Vercel**

- Go to `https://vercel.com/new`
- Import the GitHub repo
- Framework preset: Vite (auto-detected)
- Build: `vite build` (auto) · Output: `dist` (auto)
- Deploy

- [ ] **Step 3: Verify the production URL**

Open the assigned `*.vercel.app` URL. Re-run the smoke checklist.

- [ ] **Step 4: Update `SHARE_DOMAIN` if the URL isn't `vance-daily-calm.vercel.app`**

If Vercel assigned a different URL, update `src/state/brandConfig.js`:

```js
export const SHARE_DOMAIN = 'your-actual-url.vercel.app';
```

Commit and push — Vercel redeploys automatically.

- [ ] **Step 5: Sanity-check the live share card**

On the live URL, play a run, download the score card. Confirm the footer text shows the correct production domain.

**Done.** The game is deployed, the brand-experience features are live, and the smoke checklist passes on production.

---

## Post-launch follow-ups (out of scope)

From spec §10, deferred to future plans:

- Real leaderboard backend (server-side top-N + user row)
- Points ledger + one-run-per-day server validation
- Auth (magic-link / password / SSO)
- Reward fulfilment (email codes, PDFs, prize draw)
- Analytics instrumentation
- Regulatory copy review sign-off

Each becomes its own spec → plan cycle.

---
