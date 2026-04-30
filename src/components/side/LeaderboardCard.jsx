import { useMemo } from 'react';
import { fmt, todayStr } from '../../state/dates.js';
import { rngFromString } from '../../game/rng.js';

export function LeaderboardCard({ todayScore, name, hasScore }) {
  // Deterministic mock leaders for today, always above/below the user
  const mocks = useMemo(() => {
    const rng = rngFromString('leaderboard-' + todayStr());
    const names = ['Amelia P.', 'Jonas K.', 'Priya S.', 'Oliver M.', 'Sana R.', 'Rhea D.', 'Leo F.', 'Mina T.'];
    return names.map((n) => ({
      name: n,
      score: Math.round(2200 + rng() * 2800),
    })).sort((a, b) => b.score - a.score);
  }, []);

  const withYou = useMemo(() => {
    if (!hasScore) return mocks.slice(0, 6);
    const list = [...mocks, { name: name + ' (you)', score: todayScore, you: true }];
    list.sort((a, b) => b.score - a.score);
    // trim to 7, but always include you
    const youIdx = list.findIndex(r => r.you);
    if (youIdx < 7) return list.slice(0, 7);
    return [...list.slice(0, 5), list[youIdx - 1], list[youIdx]];
  }, [mocks, todayScore, hasScore, name]);

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Today's leaderboard</span>
        <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>Resets at 00:00 UTC</span>
      </div>
      <div className="card-body">
        {withYou.map((r, i) => (
          <div key={i} className={`board-row${r.you ? ' you' : ''}`}>
            <span className="rk">{i + 1}</span>
            <span className="nm">{r.name}</span>
            <span className="sc">{fmt(r.score)}</span>
          </div>
        ))}
        {!hasScore && (
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 10, textAlign: 'center' }}>Finish today's run to place on the board.</div>
        )}
      </div>
    </div>
  );
}
