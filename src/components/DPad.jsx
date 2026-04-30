export function DPad({ onDir }) {
  return (
    <div className="dpad">
      <button className="up" onClick={() => onDir(0, -1)} aria-label="Up">↑</button>
      <button className="left" onClick={() => onDir(-1, 0)} aria-label="Left">←</button>
      <button className="right" onClick={() => onDir(1, 0)} aria-label="Right">→</button>
      <button className="down" onClick={() => onDir(0, 1)} aria-label="Down">↓</button>
    </div>
  );
}
