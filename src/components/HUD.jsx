import { fmt } from '../state/dates.js';

export function HUD({ snap, onStart, canStart, completedToday, onPractice }) {
  return (
    <div className="stage-head">
      <div className="hud-score">
        <div><span className="label">Score</span><span className="val brand">{fmt(snap.score)}</span></div>
        <div><span className="label">EPA</span><span className="val">{snap.pellets}</span></div>
        <div><span className="label">Flares</span><span className="val">{snap.flares}</span></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="lives" aria-label={`${snap.lives} lives remaining`}>
          {[0, 1, 2].map(i => (
            <span key={i} className={`life-pip${i < snap.lives ? '' : ' spent'}`} />
          ))}
        </div>
        {canStart && (
          completedToday
            ? <button className="btn btn-secondary btn-sm" onClick={onPractice}>Practice run</button>
            : <button className="btn btn-primary btn-sm" onClick={onStart}>Start run</button>
        )}
      </div>
    </div>
  );
}
