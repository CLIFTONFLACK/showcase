import { SHARE_DOMAIN } from '../state/brandConfig.js';

export function buildEmojiGrid(pct) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const green = Math.floor(clamped / 10);
  const hasYellow = clamped % 10 >= 5;
  const blacks = 10 - green - (hasYellow ? 1 : 0);
  return '🟢'.repeat(green) + (hasYellow ? '🟡' : '') + '⬛'.repeat(blacks);
}

export function buildShareText({ score, dateLabel, streak, healPct }) {
  const lines = [
    `🧬 EPAVANCE Daily Calm — ${dateLabel}`,
  ];
  if (streak > 1) {
    lines.push(`Score: ${score.toLocaleString('en-GB')} · 🔥 ${streak} days`);
  } else {
    lines.push(`Score: ${score.toLocaleString('en-GB')}`);
  }
  lines.push(`${buildEmojiGrid(healPct)} (gut wall ${Math.round(healPct)}%)`);
  lines.push(SHARE_DOMAIN);
  return lines.join('\n');
}
