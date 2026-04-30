import { fmt } from '../../state/dates.js';
import { TIERS } from '../../state/tiers.js';

export function RewardsCard({ totalPoints, claimed, onClaim }) {
  return (
    <div className="card">
      <div className="card-head"><span className="card-title">Redeem points</span></div>
      <div className="card-body" style={{ paddingTop: 0 }}>
        {TIERS.map(t => {
          const isClaimed = claimed.includes(t.pts);
          const ready = totalPoints >= t.pts && !isClaimed;
          return (
            <div className="tier" key={t.pts}>
              <div className="pts">{fmt(t.pts)}</div>
              <div>
                <div className="title">{t.title}</div>
                <div className="desc">{t.desc}</div>
              </div>
              {isClaimed ? (
                <span className="state claimed">Claimed</span>
              ) : ready ? (
                <button className="btn btn-primary btn-sm" onClick={() => onClaim(t.pts)}>Redeem</button>
              ) : (
                <span className="state locked">Locked</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
