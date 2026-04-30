import { formatDate } from '../state/dates.js';

export function PageHead({ completedToday }) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">Daily Calm · points game</span>
        <h1>Guide a gut cell through today's maze.</h1>
        <p>Collect EPA molecules, absorb inflammatory flares, and heal the gut wall. One maze per day — points stack toward rewards on your next EPAVANCE order.</p>
      </div>
      <div className="daily-badge">
        <span className="dot" />
        <span>Today · <b>{formatDate(new Date())}</b></span>
        {completedToday && <span style={{ color: 'var(--success)', fontWeight: 600, marginLeft: 4 }}>· Played</span>}
      </div>
    </div>
  );
}
