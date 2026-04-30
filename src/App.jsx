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
import { burstConfetti } from './brand/confetti.js';
import { useEngineSnap } from './hooks/useEngineSnap.js';
import { classifyStreakChange } from './state/streak.js';

export function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const canvasHolderRef = useRef(null);
  const prevStreakRef = useRef(null);
  const [modal, setModal] = useState('howto'); // howto | alreadyPlayed | end | signup | claimed | null
  const [toasts, setToasts] = useState([]);
  const [persisted, setPersisted] = usePersistence();
  const [earnedThisRun, setEarnedThisRun] = useState(0);
  const [isPractice, setIsPractice] = useState(false);
  const [claimedTier, setClaimedTier] = useState(null);
  const [running, setRunning] = useState(false);

  const completedToday = persisted.lastPlayed === todayStr();
  const isGuest = !persisted.user;

  const pushToast = useCallback((text, amt, style) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, text, amt, style }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2200);
  }, []);

  // Announce streak changes when persisted.streak shifts.
  // Runs AFTER React commits the new streak — avoids StrictMode double-fire.
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

  useEffect(() => {
    // If already played today, prompt practice / rewards
    if (completedToday) setModal('alreadyPlayed');
  }, []);

  useEffect(() => {
    return () => { if (engineRef.current) engineRef.current.stop(); };
  }, []);

  const setDir = useCallback((dx, dy) => {
    if (engineRef.current) engineRef.current.setDir(dx, dy);
  }, []);

  const onSignUp = useCallback(() => setModal('signup'), []);
  const onSignUpComplete = useCallback(({ email, name }) => {
    const initials = name.split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
    setPersisted(p => ({ ...p, user: { email, name, initials } }));
    setModal(null);
    pushToast(`Welcome, ${name.split(' ')[0]}`, null);
  }, [pushToast, setPersisted]);

  const onClaim = useCallback((ptsCost) => {
    const tier = TIERS.find(t => t.pts === ptsCost);
    if (!tier) return;
    setPersisted(p => ({
      ...p,
      claimed: [...p.claimed, ptsCost],
      // Note: we're not deducting points — this is loyalty-style "unlock at tier", consistent with many rewards programs.
      // If you want spend-style, change to: totalPoints: p.totalPoints - ptsCost
    }));
    setClaimedTier(tier);
    setModal('claimed');
  }, [setPersisted]);

  return (
    <div className="app">
      <TopBar totalPoints={persisted.totalPoints} user={persisted.user} onSignIn={onSignUp} />
      <PageHead completedToday={completedToday} />
      <div className="game-wrap">
        <section className="stage" data-screen-label="Game Stage">
          <HUD snap={snap} onStart={() => startGame(false)} canStart={!running} completedToday={completedToday} onPractice={() => startGame(true)} />
          <div className="canvas-holder" ref={canvasHolderRef}>
            <Toasts items={toasts} />
            <canvas ref={canvasRef} />
            <DPad onDir={setDir} />
            {modal === 'howto' && <HowToModal onStart={() => startGame(false)} />}
            {modal === 'alreadyPlayed' && (
              <AlreadyPlayedModal
                todayScore={persisted.lastScore}
                onReplay={() => startGame(true)}
                onClose={() => setModal(null)}
              />
            )}
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
            {modal === 'signup' && (
              <SignUpModal pendingPoints={earnedThisRun} onComplete={onSignUpComplete} onClose={() => setModal(null)} />
            )}
            {modal === 'claimed' && claimedTier && (
              <ClaimedModal tier={claimedTier} onClose={() => { setModal(null); setClaimedTier(null); }} />
            )}
          </div>
          <HealthStrip health={snap.health} />
        </section>
        <aside className="side">
          <PointsCard totalPoints={persisted.totalPoints} streak={persisted.streak || 0} />
          <RewardsCard totalPoints={persisted.totalPoints} claimed={persisted.claimed} onClaim={onClaim} />
          <LeaderboardCard
            todayScore={persisted.lastScore}
            name={persisted.user ? persisted.user.name.split(' ')[0] : 'You'}
            hasScore={completedToday}
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (confirm('Reset all local points and progress? (this clears the demo only — real accounts are unaffected)')) {
                localStorage.removeItem(GAME_STORAGE_KEY);
                location.reload();
              }
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            Reset demo data
          </button>
        </aside>
      </div>
    </div>
  );
}
