/**
 * Start a looping teaching animation on the given canvas.
 * Returns a stop() cleanup function.
 */
export function startHowToLoop(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 240, H = 120;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  let raf = 0;
  const start = performance.now();

  const tick = (now) => {
    const t = ((now - start) / 2000) % 1; // 2s loop

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#def4f4';
    ctx.fillRect(0, 0, W, H);

    const tile = 40;
    const cy = H / 2;
    const startX = (W - tile * 5) / 2;

    ctx.fillStyle = 'rgba(0,128,128,0.15)';
    ctx.fillRect(0, cy - tile / 2 - 4, W, 4);
    ctx.fillRect(0, cy + tile / 2, W, 4);

    const eat1 = t > 0.25;
    const eat2 = t > 0.75;
    if (!eat1) drawPellet(ctx, startX + tile * 1 + tile / 2, cy, 3, '#008080');
    if (!eat2) drawPowerPellet(ctx, startX + tile * 3 + tile / 2, cy, t);

    let vx;
    if (t < 0.5) vx = startX + tile * 0 + tile / 2 + (t / 0.5) * tile * 2;
    else vx = startX + tile * 2 + tile / 2 + ((t - 0.5) / 0.5) * tile * 2;

    const scareFlash = t > 0.78 && t < 0.92;
    drawVilli(ctx, vx, cy, t, scareFlash);

    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(raf);
}

function drawPellet(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawPowerPellet(ctx, x, y, t) {
  const pulse = 1 + Math.sin(t * Math.PI * 4) * 0.15;
  const grd = ctx.createRadialGradient(x - 2, y - 3, 1, x, y, 7);
  grd.addColorStop(0, '#ffdc8c');
  grd.addColorStop(1, '#c69533');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, 7 * pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawVilli(ctx, x, y, t, scareFlash) {
  const mouthPhase = Math.sin(t * Math.PI * 8);
  const mouth = (mouthPhase * 0.5 + 0.5) * 0.55;
  ctx.save();
  ctx.translate(x, y);
  const grd = ctx.createRadialGradient(-4, -4, 1, 0, 0, 14);
  grd.addColorStop(0, scareFlash ? '#aedbdb' : '#4ca6a6');
  grd.addColorStop(1, scareFlash ? '#4ca6a6' : '#006666');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 13, mouth, Math.PI * 2 - mouth);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#004d4d';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}
