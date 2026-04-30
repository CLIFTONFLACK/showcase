# VANCE Daily Calm

An interactive Pac-Man-style loyalty game for **EPAVANCE** — a Food for Special Medical Purposes (FSMP) for the dietary management of IBD. Players guide a gut cell ("Villi") through a daily-regenerated maze, collect EPA molecules, heal the gut wall, and earn points toward rewards.

## Stack

- Vite + React 18 (JavaScript)
- Canvas 2D for the game engine and all brand visuals (confetti, score card, heal sweep)
- Client-side only — no backend, no env vars
- Vercel static deployment

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # unit tests (rng, maze, dates, heal sweep, count-up, share text, streak)
npm run build      # production build → dist/
npm run preview    # serve dist/ locally at http://localhost:4173
```

## Deployment

Pushed to any branch → Vercel preview URL. Push to `main` → production deploy.

No environment variables, no serverless functions, no edge middleware. `vercel.json` at the repo root has the full config.

## Manual smoke checklist (pre-deploy QA)

Run before each production deploy against `npm run preview`:

1. First load → HowToModal opens with the animated teaching loop (Villi moving, eating pellets, scare flash)
2. Outfit font loads (inspect element — computed `font-family` starts with `Outfit`)
3. EPAVANCE logo loads in top bar (no broken image)
4. Start run → engine runs, Villi moves via arrows/WASD
5. EPA molecule → score +10, gut wall bar advances
6. Soft-gel → score +50, ghosts turn teal (scare mode)
7. Absorb a scared ghost → score +200
8. Hit a ghost while un-scared → lose a life, positions reset
9. Clear all pellets → **heal sweep runs ~1.5s** (gut wall colour sweeps from inflamed to fully healed) + **confetti burst** → EndModal opens
10. EndModal score counts up from 0 with ease-out animation
11. Breakdown rows (EPA / soft-gels / flares / completion) appear
12. Click "Download card" → PNG downloads, opens cleanly, shows EPAVANCE branding, score, streak, gut-wall %
13. Click "Copy share text" → clipboard has the emoji grid + score + domain
14. Guest + scored run → conversion banner shows live countdown, CTA opens SignUpModal
15. Submit SignUpModal → user persists across refresh (name in top bar)
16. Claim a reward tier → ClaimedModal
17. Refresh same-day → AlreadyPlayedModal replaces HowTo
18. Practice run → points/streak unchanged
19. Set `localStorage.epavance_game_v1.lastPlayed` to yesterday's date → next save fires 🔥 streak toast + PointsCard streak number pulses
20. Mobile viewport (DevTools device mode) → D-pad visible, touch targets work
21. Tunnel wrap → walk through row-10 left edge, reappear on right
22. Reset demo data → returns to first-load state

## Cross-browser

- Chrome (desktop)
- Safari (desktop) — check canvas DPR 2× and backdrop-filter
- Firefox (desktop) — check tabular-nums
- iOS Safari + Android Chrome — check D-pad touch events, responsive grid collapse

## Known integration points (future backend specs)

These stay mocked in this build — swap when backend is ready:

- `src/components/side/LeaderboardCard.jsx` — deterministic mock names via `rngFromString`
- `src/hooks/usePersistence.js` — localStorage; swap for server-side loyalty wallet
- `src/App.jsx` `onSignUpComplete` — local stub; replace with real EPAVANCE auth (magic-link / SSO)
- `src/App.jsx` `onClaim` — loyalty-style unlock (no deduction); confirm spend rules with product

## Project structure

```
src/
├── App.jsx                 orchestrator
├── main.jsx                React root
├── brand/                  new brand-experience modules
│   ├── confetti.js         particle burst
│   ├── healSweep.js        gut-wall heal sweep logic
│   ├── scoreCard.js        PNG score card generator
│   ├── shareText.js        emoji-grid share text builder
│   └── howToAnimator.js    onboarding teaching loop
├── components/
│   ├── TopBar.jsx  PageHead.jsx  HUD.jsx  HealthStrip.jsx  DPad.jsx  Toasts.jsx
│   └── side/PointsCard.jsx  RewardsCard.jsx  LeaderboardCard.jsx
├── game/
│   ├── engine.js           canvas render + collision + ghost AI + heal-sweep state
│   ├── maze.js             seeded daily maze generator
│   └── rng.js              FNV-1a + mulberry32 primitives
├── hooks/
│   ├── useCountUp.js       ease-out-cubic number animation
│   ├── useEngineSnap.js    120ms engine snapshot polling
│   └── usePersistence.js   localStorage-backed state
├── modals/                 HowToModal  AlreadyPlayedModal  EndModal  SignUpModal  ClaimedModal
├── state/
│   ├── brandConfig.js      SHARE_URL, SHARE_DOMAIN, GAME_STORAGE_KEY
│   ├── dates.js            todayStr / yesterdayStr / formatDate / countdown helpers
│   ├── streak.js           classifyStreakChange
│   └── tiers.js            reward tier definitions
└── styles/
    ├── colors_and_type.css design tokens + Outfit font face
    └── game.css            layout, cards, modals, animations
```

## Regulatory note

EPAVANCE is a Food for Special Medical Purposes for the dietary management of IBD. All in-game copy has been reviewed for reg-safe framing — no therapeutic claims, "heal the gut wall" is a gameplay metaphor only, "flares" are game entities. Any copy changes should go through the Vance Medical regulatory reviewer.
