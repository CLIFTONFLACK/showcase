import { fmt } from '../state/dates.js';

export function AlreadyPlayedModal({ todayScore, onReplay, onClose }) {
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <span className="eyebrow">Already played today</span>
          <h2>Your run is logged.</h2>
          <p>You scored <b style={{ color: 'var(--fg-brand-strong)', fontFamily: 'var(--font-display)' }}>{fmt(todayScore)}</b> on today's maze. A new maze unlocks at midnight UTC. Come back tomorrow to keep your streak alive.</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onReplay}>Practice run (no points)</button>
          <button className="btn btn-primary" onClick={onClose}>View rewards</button>
        </div>
      </div>
    </div>
  );
}
