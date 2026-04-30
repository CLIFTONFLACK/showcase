import { SHARE_DOMAIN } from '../state/brandConfig.js';

const W = 1200;
const H = 630;

/**
 * Render a social-shareable score card to a PNG Blob.
 */
export async function generateScoreCard({ score, dateLabel, streak, healPct }) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#006666');
  bg.addColorStop(1, '#004d4d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 1.1, H * -0.2, 0, W * 1.1, H * -0.2, W * 0.9);
  glow.addColorStop(0, 'rgba(255,255,255,0.12)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const logo = await loadImage('/logos/epavance-logo.png');
  const logoH = 48;
  const logoW = logo.width * (logoH / logo.height);
  ctx.drawImage(logo, 80, 70, logoW, logoH);

  ctx.fillStyle = '#aedbdb';
  ctx.font = '600 24px Outfit, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('EPAVANCE · DAILY CALM', 80, 170);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 180px Outfit, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(score.toLocaleString('en-GB'), 80, H / 2 + 10);

  ctx.fillStyle = '#aedbdb';
  ctx.font = '500 26px Outfit, sans-serif';
  ctx.textBaseline = 'top';
  const streakText = streak > 1 ? `🔥 ${streak}-day streak` : 'Day 1';
  ctx.fillText(`${dateLabel} · ${streakText}`, 80, 440);

  const barX = 80, barY = 500, barW = 400, barH = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundRect(ctx, barX, barY, barW, barH, 6);
  ctx.fill();
  ctx.fillStyle = '#d9a84a';
  roundRect(ctx, barX, barY, (barW * healPct) / 100, barH, 6);
  ctx.fill();
  ctx.fillStyle = '#aedbdb';
  ctx.font = '500 18px Outfit, sans-serif';
  ctx.fillText(`Gut wall ${healPct}% healed`, barX, barY + barH + 12);

  ctx.fillStyle = '#78bfbf';
  ctx.font = '500 22px Outfit, sans-serif';
  ctx.fillText(`Play today at ${SHARE_DOMAIN}`, 80, H - 70);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('canvas.toBlob returned null'));
    }, 'image/png');
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
