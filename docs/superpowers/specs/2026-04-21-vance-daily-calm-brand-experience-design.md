# VANCE Daily Calm — Brand Experience Build (Vite + Vercel)

**Date:** 2026-04-21
**Status:** Approved design, pending implementation plan
**Source prototype:** `C:\Users\clift\.Claude\VANCE - Game\` (HTML + CDN React + Babel standalone)

---

## 1. Problem & Goals

An HTML prototype of "Daily Calm" exists — a Pac-Man-style loyalty game for EPAVANCE (a Food for Special Medical Purposes for IBD dietary management). The prototype is functionally complete: working game engine, full React UI, all five modals, design tokens.

The ask is two-fold:

1. **Improve the concept** toward a **brand experience** — the game becomes a retention vehicle for EPAVANCE rather than a standalone product. Focus on sign-up conversion AND daily-return habit.
2. **Build it ready for deployment** to a new Vercel project.

### Success criteria

- The end-of-run moment feels **celebratory and brand-stamped** (heal sweep + confetti + animated score reveal), not a dry "Game Over" screen.
- Players can **share a branded score card image** after a run.
- The guest sign-up flow is **conversion-tuned** with a visible points-expiry countdown.
- Daily streaks feel like an **emotional reward**, not just a number.
- Deployable to Vercel with a single `vite build` — no backend, no env vars.

### Non-goals

- No backend work. Leaderboard stays mocked, auth stays localStorage-guest.
- No analytics wiring.
- No i18n.
- No sound (that was Direction B; this spec is Direction C — Brand Experience).
- No server-side score validation.

---

## 2. Chosen Direction

During brainstorming the user selected:

- **Direction:** Brand Experience (over Polish-and-Ship, over Deeper Gameplay)
- **Primary goal:** Both guest sign-up conversion AND existing-customer retention (equal weight)
- **Share mechanic:** Score card image (Canvas-generated PNG, client-side)
- **End-of-run feel:** Celebratory (confetti + gut-wall heal animation before modal)

These four choices drive every design decision below.

---

## 3. Architecture

### 3.1 Stack

- **Vite 5.x** + **React 18** (JavaScript, no TypeScript — matches prototype's language choice; no reason to rewrite types right now)
- **Canvas 2D** for the game engine and all brand visuals (confetti, score card, heal sweep) — zero additional dependencies
- **No CSS framework** — the existing design-token CSS (`colors_and_type.css`) is complete; no migration to Tailwind
- **No state management library** — React local state + a single `useReducer`-free persistence hook

### 3.2 Why Vite (not static, not Next.js)

| Option | Verdict |
|---|---|
| Keep as static HTML + CDN React + Babel | Rejected — Babel standalone costs ~300ms parse time on first load, and maintaining the brand-experience additions against CDN React is fragile. |
| **Vite + React** | **Chosen** — ~2 hours of mechanical conversion, then proper dev experience, tree-shaking, ~30 KB production bundle. Right-sized for a single-page game. |
| Next.js | Rejected — overkill without any backend or routing needs. API routes aren't required yet (all deferred to future backend spec). Would add complexity and SSR considerations for zero current benefit. |

### 3.3 Project structure

```
vance-daily-calm/
├── public/
│   ├── logos/epavance-logo.png
│   └── fonts/Outfit-VariableFont_wght.ttf
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── TopBar.jsx
│   │   ├── PageHead.jsx
│   │   ├── HUD.jsx
│   │   ├── HealthStrip.jsx
│   │   ├── DPad.jsx
│   │   ├── Toasts.jsx
│   │   └── side/
│   │       ├── PointsCard.jsx
│   │       ├── RewardsCard.jsx
│   │       └── LeaderboardCard.jsx
│   ├── modals/
│   │   ├── HowToModal.jsx              # + animated mini-canvas
│   │   ├── AlreadyPlayedModal.jsx
│   │   ├── EndModal.jsx                # + count-up, share row, conversion-tuned guest banner
│   │   ├── SignUpModal.jsx
│   │   └── ClaimedModal.jsx
│   ├── game/
│   │   ├── engine.js                   # port of engine.js → ES module; exposes class MazeEngine
│   │   ├── maze.js                     # extract: generateDailyMaze()
│   │   └── rng.js                      # extract: hashString, mulberry32, rngFromString
│   ├── brand/
│   │   ├── confetti.js                 # NEW — particle system
│   │   ├── scoreCard.js                # NEW — offscreen-canvas PNG generator
│   │   └── healSweep.js                # NEW — end-of-run wall-color sweep controller
│   ├── hooks/
│   │   ├── useCountUp.js               # NEW — animated number hook
│   │   ├── useEngineSnap.js            # snapshot polling (120ms)
│   │   └── usePersistence.js           # localStorage wrapper for epavance_game_v1
│   ├── state/
│   │   ├── tiers.js                    # reward tier definitions
│   │   ├── dates.js                    # todayStr, yesterdayStr, formatDate
│   │   └── brandConfig.js              # SHARE_URL, SHARE_DOMAIN (single source of truth)
│   └── styles/
│       ├── colors_and_type.css         # copied unchanged
│       └── game.css                    # copied unchanged
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

### 3.4 Why split the monolithic files

Current `engine.js` (759 lines) and `app.jsx` (602 lines) each do too much. After the split each module has one job:

- `game/engine.js` — only the render loop + collision + ghost AI (~400 lines)
- `game/maze.js` — only the maze generator (~120 lines)
- `game/rng.js` — only the seeded RNG primitives (~25 lines)
- `modals/*.jsx` — one modal per file, avg ~60 lines
- `hooks/*.js` — one concern per hook

Smaller modules are easier to reason about, easier to edit reliably, and make the brand-experience additions fit cleanly without growing the monolith further.

### 3.5 Engine ↔ React boundary

The engine stays imperative (RAF loop, mutable state). React polls `engine.snapshot()` every 120ms via `useEngineSnap`, which drives HUD re-renders. This is the **existing** pattern in the prototype — proven to work, no reconciler interference on per-frame updates. We keep it.

---

## 4. Brand Experience Enhancements

Eight additions, grouped by player-journey phase.

### 4.1 End-of-run celebration

#### 4.1.1 Gut-wall heal sweep (`brand/healSweep.js`)

**Trigger:** engine fires `{ type: 'win' }` event (all pellets cleared).
**Behavior:** engine enters a new `win-celebration` state that suspends player/ghost movement but keeps rendering. During this state the wall color is overridden by a left-to-right sweep:

- Duration: 1.5s
- At time `t` (0..1), walls at grid column `x` render with `healRatio = clamp((t * W * 1.3) - x, 0, 1)` — a wave that crosses the maze width with a 30% width leading edge so the sweep feels like a wave, not a curtain
- Start color: current inflamed-state teal-rose blend
- End color: fully healed teal (`rgb(0, 128, 128)`)

**Exit:** on completion, engine fires `{ type: 'heal-complete' }`, React triggers `setModal('end')` after a 200ms settle.

**Note on prototype's current 600ms pause:** the prototype today pauses 600ms before opening the end modal. The heal sweep **replaces** that pause on the win path (1.5s sweep + 200ms settle = 1.7s total). The lose path keeps the original 600ms pause (no heal sweep on loss — wall stays in its last inflamed state).

#### 4.1.2 Confetti burst (`brand/confetti.js`)

**Trigger:** fires in parallel with heal sweep (not sequential — they overlap).
**Behavior:** 3 staggered bursts of ~80 particles each, 200ms apart.

- Particles: small rounded rectangles and circles
- Palette: `--teal-500`, `--teal-300`, `--capsule-gold`, `--teal-100`
- Physics: initial upward + outward velocity with spread, gravity 0.4 px/frame², rotation, 2.5s fade
- Rendered on a separate overlay canvas positioned absolutely over the game stage (so it doesn't interfere with game canvas)
- Self-cleans after ~3s — canvas overlay removed on last particle death

**API:**
```js
import { burstConfetti } from './brand/confetti';
burstConfetti(containerEl, { bursts: 3, palette: [...], origin: 'center' });
```

#### 4.1.3 Animated score count-up (`hooks/useCountUp.js`)

**Trigger:** EndModal mount.
**Behavior:**
- Main score: 0 → total over 800ms, ease-out cubic
- Breakdown rows (EPA molecules, soft-gels, flares absorbed, daily completion): stagger in at 120ms intervals with a 6px slide-up + opacity 0→1
- Uses `font-variant-numeric: tabular-nums` to prevent width reflow during the count

**API:**
```js
const animatedScore = useCountUp(finalScore, { duration: 800, ease: 'easeOutCubic' });
```

### 4.2 Share moment

#### 4.2.1 Score card generator (`brand/scoreCard.js`)

**Trigger:** user clicks "Download card" in EndModal.
**Behavior:**
- Create offscreen `<canvas width=1200 height=630>` (Open Graph / social aspect)
- Render with design-token colors:
  - Background: `linear-gradient(135deg, #006666 → #004d4d)` simulated with canvas gradient
  - Radial highlight top-right: `rgba(255,255,255,0.12)` 50% falloff
  - EPAVANCE logo top-left (loaded from public)
  - Eyebrow: "EPAVANCE · DAILY CALM" in teal-200, 18px, letter-spacing 0.14em
  - Score: Outfit 128px extrabold, tabular-nums, centered
  - Sub: "Monday, 21 April · 🔥 4-day streak" in teal-200, 20px
  - Progress bar: 8px tall, 320px wide, teal-100 track with capsule-gold fill at healRatio
  - Footer: "Play today at vance-daily-calm.vercel.app" (actual deployed URL)
- `canvas.toBlob` → `URL.createObjectURL` → trigger `<a download="epavance-daily-calm-{date}.png">` click

**Shared data source:** both the image card's progress bar and the emoji-text share (§4.2.2) read from the same `snap.health` value captured at run-end (stored in `earnedThisRun` alongside `finalSnap`). The two artifacts must never disagree.

**API:**
```js
import { generateScoreCard } from './brand/scoreCard';
const blob = await generateScoreCard({ score, date, streak, healPct });
```

#### 4.2.2 Share row in EndModal

Two buttons below the breakdown:
- **"Download card"** (btn-primary sm) — triggers 4.2.1
- **"Copy share text"** (btn-secondary sm) — Wordle-style emoji grid to clipboard:
  ```
  🧬 EPAVANCE Daily Calm — 21 Apr
  Score: 2,150 · 🔥 4 days
  🟢🟢🟢🟢🟡⬛⬛⬛⬛⬛ (gut wall 40%)
  vance-daily-calm.vercel.app
  ```
  **10-cell grid rule:** `greenCells = Math.round(healPct / 10)`; the single yellow cell appears at position `greenCells` only if `healPct % 10 >= 5` (partial tenth), else cell is black. This makes 40% render as exactly 4🟢 + 6⬛, and 45% as 4🟢 + 1🟡 + 5⬛.

### 4.3 Retention loop

#### 4.3.1 Streak celebration

**Trigger:** `streak` increments on save (success path) or resets (gap path).

- **Increment:** `🔥 N day streak!` toast with scale-in (0.85 → 1.0, 280ms ease-emphasis). Streak number in PointsCard does a 200ms pulse (scale 1.0 → 1.15 → 1.0) 600ms after the toast.
- **Reset:** `Streak reset — start a new one today` — gentler toast, no flame, ink-500 color. No shaming language. **Only fires if the previous `streak` was > 0** (a first-ever scored run should never show a "reset" toast — it's not a reset, it's a start).
- **First-ever scored run (streak goes 0 → 1):** no special toast. The 🔥 celebration is reserved for streak continuation (previous streak was >= 1 and increments). A day-one player sees their streak appear in the PointsCard, nothing more.

Implemented in `App.jsx` by comparing `persisted.streak` before vs after save, along with `lastPlayed === yesterdayStr()` for the continuation check.

#### 4.3.2 Conversion-tuned sign-up flow

EndModal guest teal banner rebuilt:

- **Headline:** "Save your {X} points before they expire"
- **Subline:** "Guest points expire in 24h. Create a free account to keep them, track your streak, and unlock rewards on your next order."
- **Visible countdown:** `23h 58m` remaining, recalculated each mount (24h from `lastPlayed`)
- **Primary CTA:** "Save my {X} points" (full width, above the fold)
- **Demoted opt-out:** "Not yet — maybe later" as a small centered text link *below* the primary button
- **Social-proof line (honest):** "Keep your streak alive — come back tomorrow for a fresh maze." *(No fabricated user counts.)*

Existing SignUpModal stays largely intact — just improved microcopy.

### 4.4 Onboarding

#### 4.4.1 Animated HowTo diagram

Replaces the static 2×2 legend grid in HowToModal.

- Small canvas (240×120) inside the modal body
- Looping 2s animation: miniature maze fragment (3×3 tiles), Villi moves right, eats an EPA molecule, turns around, eats a soft-gel, brief scare-mode tint
- Below: the 2×2 legend grid is kept but shown as static chips
- Controls chip copy tightened: "↑↓←→ or WASD on desktop · tap the D-pad on mobile"

---

## 5. Data Flow

Same as current prototype — **do not regress this.**

### 5.1 In-memory React state (App.jsx)
```js
{
  snap,              // polled engine state
  modal,             // 'howto' | 'alreadyPlayed' | 'end' | 'signup' | 'claimed' | null
  toasts,            // transient event feedback
  earnedThisRun,     // 0 during practice
  isPractice,
  claimedTier,
  running,
}
```

### 5.2 Persisted (`usePersistence`)

localStorage key `epavance_game_v1` — schema unchanged:
```ts
{
  totalPoints: number,
  user: { email, name, initials } | null,
  claimed: number[],          // tier pts values
  lastPlayed: "YYYY-MM-DD" | null,
  lastScore: number,
  streak: number,
}
```

### 5.3 Engine → React polling

`useEngineSnap` hook polls `engineRef.current.snapshot()` at 120ms. When `snap.gameOver` goes true:
1. Pause engine, clear poll interval
2. If win and not practice: trigger heal sweep + confetti (engine holds render during this)
3. After `heal-complete` event: save persistence, compute `earnedThisRun`, open EndModal (triggers count-up)
4. If guest + scored run: EndModal shows conversion-tuned banner → on CTA click → SignUpModal

---

## 6. Error Handling

Scope-matched to a frontend brand game.

| Failure | Handling |
|---|---|
| Canvas 2D context unavailable | Fallback message inside stage: "This game needs a modern browser with canvas support." No try/catch scaffolding elsewhere. |
| localStorage full / disabled (Safari private mode) | `usePersistence` falls back to in-memory state; score is not saved but game plays. One-time toast: "Private browsing detected — points won't persist." |
| Font fails to load | CSS fallback chain already handles (`'Segoe UI', system-ui, -apple-system, sans-serif`). |
| Image asset (logo) fails | `onError` hides the img, alt text "EPAVANCE" renders as text. |
| Score card blob generation fails | Catch, show toast: "Couldn't generate share card — try copy text instead." No retry UI. |
| Clipboard write fails | Toast: "Copy failed — long-press to copy manually." |

No generic try/catch at API boundaries (there are none). No error-boundary component — React 18's concurrent renderer handles render errors adequately for a single-page game.

---

## 7. Deployment

### 7.1 Vercel config (`vercel.json`)
```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### 7.2 `package.json` (scripts)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 7.3 Deploy flow

1. Push repo to GitHub
2. Connect new Vercel project → auto-detects Vite
3. Build runs on push to any branch → preview URL
4. Production deployment on `main`

No env vars. No serverless functions. No edge middleware.

### 7.4 Domain

Production URL to be set on the new Vercel project. Default is `vance-daily-calm.vercel.app` — referenced from **a single source**: `src/state/brandConfig.js` exports `SHARE_URL` and `SHARE_DOMAIN`. Both `brand/scoreCard.js` (footer render) and the share-text template in `modals/EndModal.jsx` (copy-text builder) import from there. If a custom domain lands later, update one file.

---

## 8. Testing Approach

Pragmatic — this is a frontend game, not a safety-critical system.

### 8.1 Manual smoke checklist (in the repo README)

1. First load → HowToModal shows with animated diagram looping
2. Click "Start today's run" → modal closes, engine starts
3. Collect a pellet → score increments, gut-wall heals 0.35%
4. Collect a soft-gel → ghosts turn teal/scared, score +50
5. Absorb a scared ghost → score +200, ghost returns to pen
6. Clear all pellets → engine pauses, heal sweep runs 1.5s, confetti overlaps, EndModal opens with count-up
7. Click "Download card" → PNG downloads, opens correctly
8. Click "Copy share text" → clipboard contains emoji grid
9. Guest: complete a run → teal banner shows countdown, CTA opens SignUpModal
10. Submit SignUpModal → user saved, toast fires, points persist after refresh
11. Claim a tier → ClaimedModal shows
12. Refresh same day → AlreadyPlayedModal shows instead of HowTo
13. Click "Practice run" → points/streak don't change
14. Set `lastPlayed` to yesterday in localStorage → next save increments streak, fires 🔥 toast + pulse
15. Reset demo data → returns to first-load state

### 8.2 Cross-browser

- Chrome (desktop) — canvas DPR 2×, fonts, download
- Safari (desktop) — canvas compatibility, webkit backdrop-filter
- Firefox (desktop) — tabular-nums, canvas gradient

### 8.3 Mobile

- iOS Safari — D-pad touch events, pointer:coarse media query, responsive grid collapse
- Android Chrome — same

### 8.4 What's NOT tested

- No unit tests (game behavior is visual/temporal — tests would be low-ROI for this scope)
- No visual regression harness
- No performance budgets (game is tiny; if bundle exceeds 150 KB gzip, investigate)
- No accessibility audit beyond the basics already in the prototype (keyboard controls work, focus trap on modals to be verified manually)

---

## 9. Migration Notes (from prototype to Vite project)

The current files need surgical porting, not rewrites:

| Current file | Destination | Changes |
|---|---|---|
| `Daily Calm.html` | `index.html` | Remove `<script type="text/babel">`, replace with `<script type="module" src="/src/main.jsx">`. Remove React and Babel CDN tags. |
| `game/engine.js` | `src/game/engine.js` + `src/game/maze.js` + `src/game/rng.js` | Remove IIFE wrapper. Export `MazeEngine` as named export from engine.js. Extract `generateDailyMaze` to maze.js. Extract RNG primitives to rng.js. |
| `game/app.jsx` | `src/App.jsx` + split into `components/` + `modals/` + `hooks/` + `state/` | Break apart; import React properly. |
| `styles/colors_and_type.css` | `src/styles/colors_and_type.css` | Unchanged. Adjust font url path to work with Vite asset handling (`/fonts/Outfit-VariableFont_wght.ttf` from public/). |
| `styles/game.css` | `src/styles/game.css` | Unchanged. |
| `assets/logos/epavance-logo.png` | `public/logos/epavance-logo.png` | Unchanged location-relative. |
| `styles/fonts/Outfit-VariableFont_wght.ttf` | `public/fonts/Outfit-VariableFont_wght.ttf` | Unchanged. |

---

## 10. Open Questions

These are *flagged as out of scope now* but worth surfacing for a future spec:

1. **Leaderboard backend** — currently deterministic mock names. Spec for a real top-N query (with privacy: first-name + last initial) lives in a future backend spec.
2. **Points ledger** — server-side validation of one-scored-run-per-day. Deferred to backend spec.
3. **Auth** — magic-link vs password vs SSO. Deferred.
4. **Reward fulfilment** — discount codes, PDF recipe delivery, prize-draw entries. Deferred.
5. **Analytics** — none added. Add a later spec if marketing needs funnel data.
6. **Regulatory review** — any copy changes in this build must still be run past Vance Medical regulatory reviewer (per prototype README §Regulatory).

---

## Appendix: Brainstorming Trail

Visual companion screens used during design:

- `direction.html` — chose C (Brand Experience) over A (Polish & Ship) and B (Deeper Gameplay)
- `share-mechanic.html` — chose B (Score Card Image) over A (Clipboard text) and C (Shareable Link)

Terminal choices:

- Primary goal: Both sign-up conversion + retention (equal weight)
- End-of-run feel: Celebratory (confetti + heal animation) over Restrained

Mockup files preserved in `.superpowers/brainstorm/` for reference.
