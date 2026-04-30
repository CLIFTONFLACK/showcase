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
        <div className="label">Your points</div>
        <div className="big">{fmt(totalPoints)}</div>
        <div className="sub">
          {nextTier ? <>{fmt(nextTier.pts - totalPoints)} to <b style={{ color: '#fff' }}>{nextTier.title}</b></> : <>All rewards unlocked</>}
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.18)', marginTop: 14, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--capsule-gold)', borderRadius: 999, transition: 'width 420ms var(--ease-standard)' }} />
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--teal-200)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Day streak · <b className={pulse ? 'pulse' : ''} style={{ color: '#fff', display: 'inline-block' }}>{streak}</b></span>
          <span>Member since 2026</span>
        </div>
      </div>
    </div>
  );
}
