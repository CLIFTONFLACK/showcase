import { useEffect, useState, useCallback } from 'react';
import { fmt, hoursRemainingUntil24h, formatShortDate } from '../state/dates.js';
import { useCountUp } from '../hooks/useCountUp.js';
import { generateScoreCard, downloadBlob } from '../brand/scoreCard.js';
import { buildShareText } from '../brand/shareText.js';

export function EndModal({
  snap,
  earned,
  isGuest,
  isPractice,
  streak,
  lastPlayedAt,
  onSignUp,
  onClose,
  onToast,
}) {
  const win = snap.win;
  const displayTotal = isPractice ? snap.score : earned;
  const animated = useCountUp(displayTotal, { duration: 800 });

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await generateScoreCard({
        score: displayTotal,
        dateLabel: formatShortDate(new Date()),
        streak,
        healPct: snap.health,
      });
      downloadBlob(blob, `epavance-daily-calm-${new Date().toISOString().slice(0, 10)}.png`);
    } catch {
      onToast?.('Couldn\'t generate share card — try copy text instead.');
    } finally {
      setDownloading(false);
    }
  }, [displayTotal, streak, snap.health, downloading, onToast]);

  const handleCopy = useCallback(async () => {
    const text = buildShareText({
      score: displayTotal,
      dateLabel: formatShortDate(new Date()),
      streak,
      healPct: snap.health,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast?.('Copy failed — long-press to copy manually.');
    }
  }, [displayTotal, streak, snap.health, onToast]);

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-head">
          <span className="eyebrow">{isPractice ? 'Practice complete' : win ? 'Daily maze complete' : 'Run ended'}</span>
          <h2>{win ? 'The gut wall is calm.' : 'Flares got through.'}</h2>
          <p>
            {isPractice
              ? 'Practice runs don\'t count toward your points or leaderboard — they\'re here to help you learn the maze.'
              : win
                ? 'You cleared every EPA molecule and earned the daily completion bonus. Points added to your account.'
                : 'Every EPA molecule you collected still earns points. Try again tomorrow for a fresh maze.'}
          </p>
        </div>

        <div className="modal-body">
          <div className="breakdown">
            <span className="lbl">EPA molecules ({snap.pellets})</span>
            <span className="val">+{fmt(snap.pellets * 10)}</span>
            <span className="lbl">EPA soft-gels ({snap.powers})</span>
            <span className="val">+{fmt(snap.powers * 50)}</span>
            <span className="lbl">Flares absorbed ({snap.flares})</span>
            <span className="val">+{fmt(snap.flares * 200)}</span>
            {win && <><span className="lbl">Daily completion</span><span className="val">+500</span></>}
            <span className="total-lbl">{isPractice ? 'Practice score' : 'Points earned'}</span>
            <span className="total-val">{fmt(animated)}</span>
          </div>

          {!isPractice && (
            <div className="share-row">
              <button className="btn btn-primary btn-sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Generating…' : 'Download card'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copied ? 'Copied ✓' : 'Copy share text'}
              </button>
            </div>
          )}

          {isGuest && !isPractice && earned > 0 && (
            <GuestConversionBanner
              earned={earned}
              lastPlayedAt={lastPlayedAt}
              onSignUp={onSignUp}
            />
          )}
        </div>

        <div className="modal-foot">
          {isGuest && !isPractice && earned > 0 ? (
            <button className="btn btn-ghost btn-block" onClick={onClose}>Not yet — maybe later</button>
          ) : (
            <button className="btn btn-primary btn-block" onClick={onClose}>Continue</button>
          )}
        </div>
      </div>
    </div>
  );
}

function GuestConversionBanner({ earned, lastPlayedAt, onSignUp }) {
  const [countdown, setCountdown] = useState(() => hoursRemainingUntil24h(lastPlayedAt));
  useEffect(() => {
    const id = setInterval(() => setCountdown(hoursRemainingUntil24h(lastPlayedAt)), 60_000);
    return () => clearInterval(id);
  }, [lastPlayedAt]);
  return (
    <div className="conversion-banner">
      <div className="conv-head">Save your <b>{fmt(earned)}</b> points before they expire</div>
      <div className="conv-sub">
        Guest points expire in <b>{countdown.h}h {String(countdown.m).padStart(2, '0')}m</b>. Create a free account to keep them, track your streak, and unlock rewards on your next order.
      </div>
      <button className="btn btn-primary btn-block" onClick={onSignUp} style={{ marginTop: 12 }}>
        Save my {fmt(earned)} points
      </button>
      <div className="conv-social">Keep your streak alive — come back tomorrow for a fresh maze.</div>
    </div>
  );
}
