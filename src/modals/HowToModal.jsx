import { useEffect, useRef } from 'react';
import { startHowToLoop } from '../brand/howToAnimator.js';

export function HowToModal({ onStart }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return undefined;
    return startHowToLoop(canvasRef.current);
  }, []);
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <span className="eyebrow">Daily Calm · how to play</span>
          <h2>You are a gut cell.<br/>Guide the gut wall back to calm.</h2>
          <p>Today's maze regenerates at midnight UTC. You have three attempts, one run only — play mindfully.</p>
        </div>
        <div className="modal-body">
          <div className="howto-preview">
            <canvas ref={canvasRef} />
          </div>
          <div className="legend">
            <div className="legend-item">
              <span className="sw villi" />
              <span className="txt"><b>Villi — you</b>A healthy gut-lining cell.</span>
            </div>
            <div className="legend-item">
              <span className="sw"><span className="dot-s" /></span>
              <span className="txt"><b>EPA molecule</b>+10 points · heals wall</span>
            </div>
            <div className="legend-item">
              <span className="sw gold" />
              <span className="txt"><b>EPA soft-gel</b>+50 · calms flares 7s</span>
            </div>
            <div className="legend-item">
              <span className="sw flare" />
              <span className="txt"><b>Flare</b>Avoid — or absorb while calmed for +200</span>
            </div>
          </div>
          <div style={{ marginTop: 18, fontSize: 13, color: 'var(--fg-3)' }}>
            Move with <span className="kbd">↑</span><span className="kbd">↓</span><span className="kbd">←</span><span className="kbd">→</span> or <span className="kbd">W</span><span className="kbd">A</span><span className="kbd">S</span><span className="kbd">D</span> on desktop · tap the D-pad on mobile. Clear every molecule to earn the daily completion bonus.
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary btn-block" onClick={onStart}>Start today's run</button>
        </div>
      </div>
    </div>
  );
}
