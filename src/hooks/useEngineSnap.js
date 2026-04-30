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
