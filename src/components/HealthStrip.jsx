export function HealthStrip({ health }) {
  return (
    <div className="health-strip">
      <span className="label">Gut wall</span>
      <div className="health-bar">
        <div className="health-fill" style={{ width: `${health}%` }} />
      </div>
      <span className="health-val">{health}%</span>
    </div>
  );
}
