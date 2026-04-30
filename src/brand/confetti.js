/**
 * Fire a burst of confetti inside `containerEl`.
 * Creates a transient canvas positioned absolutely over the container,
 * runs the particle loop until all particles fade, then removes the canvas.
 *
 * Options:
 *   bursts     - number of staggered bursts (default 3)
 *   burstGapMs - ms between bursts (default 200)
 *   perBurst   - particles per burst (default 80)
 *   palette    - CSS color strings (default brand teal/gold)
 *   origin     - 'center' | 'top' (default 'center')
 */
export function burstConfetti(containerEl, opts = {}) {
  const {
    bursts = 3,
    burstGapMs = 200,
    perBurst = 80,
    palette = ['#008080', '#78bfbf', '#d9a84a', '#def4f4'],
    origin = 'center',
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;inset:0;pointer-events:none;z-index:6;';
  containerEl.appendChild(canvas);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    const r = containerEl.getBoundingClientRect();
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
  };
  resize();

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles = [];
  let burstsFired = 0;

  const fireBurst = () => {
    const r = containerEl.getBoundingClientRect();
    const cx = r.width / 2;
    const cy = origin === 'top' ? 60 : r.height / 2;
    for (let i = 0; i < perBurst; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.3,
        size: 4 + Math.random() * 6,
        color: palette[Math.floor(Math.random() * palette.length)],
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
        life: 1.0,
      });
    }
    burstsFired++;
    if (burstsFired < bursts) setTimeout(fireBurst, burstGapMs);
  };
  fireBurst();

  let raf = 0;
  let lastT = performance.now();
  const tick = (now) => {
    const dt = Math.min(now - lastT, 48);
    lastT = now;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 0.4;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.life -= dt / 2500;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (particles.length === 0 && burstsFired >= bursts) {
      cancelAnimationFrame(raf);
      canvas.remove();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    canvas.remove();
  };
}
