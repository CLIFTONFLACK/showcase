import { fmt } from '../state/dates.js';

function Logo() {
  return <img src="/logos/epavance-logo.png" alt="EPAVANCE" style={{ height: 24, display: 'block' }} />;
}

export function TopBar({ totalPoints, user, onSignIn }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Logo />
        <nav className="topbar-nav">
          <a href="#">Shop</a>
          <a href="#">The Science</a>
          <a href="#">IBD &amp; You</a>
          <a href="#" className="active">Daily Calm</a>
          <a href="#">For Clinicians</a>
        </nav>
        <div className="topbar-right">
          <div className="status">
            <span>Your points</span>
            <b style={{ color: 'var(--fg-brand-strong)', fontFamily: 'var(--font-display)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalPoints)}</b>
          </div>
          {user ? (
            <div className="status">
              <div className="av">{user.initials}</div>
              <span>{user.name.split(' ')[0]}</span>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={onSignIn}>Sign in</button>
          )}
        </div>
      </div>
    </header>
  );
}
