import { TILE } from './maze.js';
import { sweepRatio } from '../brand/healSweep.js';

// Canvas renderer + input + ghost AI. Stateful class, tied to a <canvas>.
export class MazeEngine {
  constructor(canvas, maze, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maze = maze;
    this.onEvent = opts.onEvent || (() => {});
    this.tile = 26;           // logical px per tile
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.player = {
      x: maze.playerStart.x, y: maze.playerStart.y,
      px: maze.playerStart.x * this.tile + this.tile / 2,
      py: maze.playerStart.y * this.tile + this.tile / 2,
      dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 },
      speed: 0.095,
      mouthPhase: 0,
    };
    // Ghosts — 3 "flares"
    const pen = maze.penCenter;
    const ghostColors = ['#b4443a', '#c08a2e', '#8b5a6d'];
    const ghostNames = ['Acute', 'Chronic', 'Fatigue'];
    this.ghosts = [0, 1, 2].map((i) => ({
      x: pen.x + (i - 1), y: pen.y,
      px: (pen.x + (i - 1)) * this.tile + this.tile / 2,
      py: pen.y * this.tile + this.tile / 2,
      dir: { x: 0, y: -1 },
      color: ghostColors[i],
      name: ghostNames[i],
      state: 'penned',
      stateUntil: 800 + i * 350,
      speed: 0.072,
      scaredColor: 'var(--teal-500)',
      wiggle: Math.random() * Math.PI * 2,
    }));
    this.score = 0;
    this.lives = 3;
    this.health = 20;
    this.pelletsEaten = 0;
    this.powersEaten = 0;
    this.flaresAbsorbed = 0;
    this.scareUntil = 0;
    this.running = false;
    this.startedAt = 0;
    this.lastT = 0;
    this.paused = false;
    this.gameOver = false;
    this.win = false;
    this.elapsed = 0;
    this.celebrating = false;
    this.celebrationStart = 0;
    this.baseHealRatio = 0;
    this.celebrateT = 0;
    this._raf = 0;
    this._keyHandler = null;
    this._resizeObserver = null;
    this._resize();
    this._bindKeys();
  }

  _resize() {
    const pxW = this.maze.width * this.tile;
    const pxH = this.maze.height * this.tile;
    this.canvas.style.width = pxW + 'px';
    this.canvas.style.height = 'auto';
    this.canvas.style.maxWidth = '100%';
    this.canvas.style.aspectRatio = `${pxW} / ${pxH}`;
    this.canvas.width = pxW * this.dpr;
    this.canvas.height = pxH * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  _bindKeys() {
    this._keyHandler = (e) => {
      const d = {
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
        w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
        W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
      }[e.key];
      if (d) {
        this.player.nextDir = { x: d[0], y: d[1] };
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  setDir(dx, dy) {
    this.player.nextDir = { x: dx, y: dy };
  }

  start() {
    this.running = true;
    this.startedAt = performance.now();
    this.lastT = this.startedAt;
    this._loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
  }

  pause(p) { this.paused = p; if (!p) this.lastT = performance.now(); }

  _isWall(x, y) {
    if (y < 0 || y >= this.maze.height) return true;
    if (x < 0 || x >= this.maze.width) return false;
    const t = this.maze.grid[y][x];
    return t === TILE.WALL;
  }
  _isGate(x, y) {
    if (y < 0 || y >= this.maze.height || x < 0 || x >= this.maze.width) return false;
    return this.maze.grid[y][x] === TILE.GATE;
  }

  _tryMove(entity, dt) {
    const t = this.tile;
    const cx = entity.px, cy = entity.py;
    let { dir } = entity;
    const tileX = Math.floor(cx / t), tileY = Math.floor(cy / t);
    const centerX = tileX * t + t / 2;
    const centerY = tileY * t + t / 2;
    const nearCenterX = Math.abs(cx - centerX) < 1.5;
    const nearCenterY = Math.abs(cy - centerY) < 1.5;

    if (entity === this.player && (entity.nextDir.x || entity.nextDir.y)) {
      if (nearCenterX && nearCenterY) {
        const nx = tileX + entity.nextDir.x;
        const ny = tileY + entity.nextDir.y;
        if (!this._isWall(nx, ny) && !this._isGate(nx, ny)) {
          dir = entity.nextDir;
          entity.dir = dir;
          entity.px = centerX; entity.py = centerY;
        }
      }
    }

    if (!dir.x && !dir.y) return;

    const nextTileX = tileX + dir.x;
    const nextTileY = tileY + dir.y;
    const blocked = this._isWall(nextTileX, nextTileY) ||
                    (this._isGate(nextTileX, nextTileY) && entity === this.player);

    if (blocked) {
      if (dir.x > 0 && cx + entity.speed * dt > centerX) { entity.px = centerX; return; }
      if (dir.x < 0 && cx - entity.speed * dt < centerX) { entity.px = centerX; return; }
      if (dir.y > 0 && cy + entity.speed * dt > centerY) { entity.py = centerY; return; }
      if (dir.y < 0 && cy - entity.speed * dt < centerY) { entity.py = centerY; return; }
    }

    entity.px += dir.x * entity.speed * dt;
    entity.py += dir.y * entity.speed * dt;

    const W = this.maze.width * t;
    if (entity.px < -t / 2) entity.px += W + t;
    else if (entity.px > W + t / 2) entity.px -= W + t;

    if (dir.x !== 0) entity.py = centerY;
    if (dir.y !== 0) entity.px = centerX;

    entity.x = Math.floor(entity.px / t);
    entity.y = Math.floor(entity.py / t);
  }

  _eatPellets() {
    const p = this.player;
    const t = this.tile;
    const tx = Math.floor(p.px / t), ty = Math.floor(p.py / t);
    if (ty < 0 || ty >= this.maze.height || tx < 0 || tx >= this.maze.width) return;
    const cell = this.maze.grid[ty][tx];
    const cx = tx * t + t / 2, cy = ty * t + t / 2;
    const dist = Math.hypot(p.px - cx, p.py - cy);
    if (dist > 6) return;
    if (cell === TILE.DOT) {
      this.maze.grid[ty][tx] = TILE.EMPTY;
      this.score += 10;
      this.pelletsEaten++;
      this.health = Math.min(100, this.health + 0.35);
      this.onEvent({ type: 'dot', score: 10 });
    } else if (cell === TILE.POWER) {
      this.maze.grid[ty][tx] = TILE.EMPTY;
      this.score += 50;
      this.powersEaten++;
      this.health = Math.min(100, this.health + 8);
      this.scareUntil = performance.now() + 7000;
      for (const g of this.ghosts) {
        if (g.state !== 'eaten') g.state = 'scared';
      }
      this.onEvent({ type: 'power', score: 50 });
    }
    if (this._remainingPellets() === 0 && !this.win) {
      this.win = true;
      this.score += 500;
      this.baseHealRatio = this.health / 100;
      this.celebrating = true;
      this.celebrationStart = performance.now();
      this.onEvent({ type: 'win', score: 500 });
    }
  }

  _remainingPellets() {
    let c = 0;
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const t = this.maze.grid[y][x];
        if (t === TILE.DOT || t === TILE.POWER) c++;
      }
    }
    return c;
  }

  _ghostStep(g, dt, now) {
    const t = this.tile;
    if (g.state === 'penned') {
      if (now - this.startedAt > g.stateUntil) {
        g.state = 'chase';
        g.dir = { x: 0, y: -1 };
      } else {
        g.wiggle += dt * 0.004;
        return;
      }
    }

    const scared = g.state === 'scared';
    const eaten = g.state === 'eaten';
    if (scared && now > this.scareUntil) g.state = 'chase';

    if (eaten) {
      const pen = this.maze.penCenter;
      const dx = pen.x * t + t / 2 - g.px;
      const dy = pen.y * t + t / 2 - g.py;
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
        g.state = 'chase';
        g.px = pen.x * t + t / 2;
        g.py = pen.y * t + t / 2;
      }
    }

    const speed = eaten ? 0.18 : scared ? 0.045 : 0.07 + Math.min(0.025, this.pelletsEaten * 0.00015);
    g.speed = speed;

    const cx = g.px, cy = g.py;
    const tileX = Math.floor(cx / t), tileY = Math.floor(cy / t);
    const centerX = tileX * t + t / 2;
    const centerY = tileY * t + t / 2;
    const nearCenter = Math.abs(cx - centerX) < 1.5 && Math.abs(cy - centerY) < 1.5;

    if (nearCenter) {
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      const canMoveTo = (dx, dy) => {
        const nx = tileX + dx, ny = tileY + dy;
        if (ny < 0 || ny >= this.maze.height) return false;
        const cell = (nx < 0 || nx >= this.maze.width) ? TILE.EMPTY : this.maze.grid[ny][nx];
        if (cell === TILE.WALL) return false;
        if (cell === TILE.GATE && !(eaten || g.state === 'chase' || g.state === 'scatter')) return false;
        return true;
      };
      const isReverse = (dx, dy) => dx === -g.dir.x && dy === -g.dir.y;

      const options = dirs.filter(([dx, dy]) => canMoveTo(dx, dy) && !isReverse(dx, dy));
      let choice;
      if (options.length === 0) {
        choice = [-g.dir.x, -g.dir.y];
      } else {
        let target;
        if (eaten) {
          target = { x: this.maze.penCenter.x, y: this.maze.penCenter.y };
        } else if (scared) {
          target = { x: Math.random() * this.maze.width, y: Math.random() * this.maze.height };
        } else {
          const p = this.player;
          const ptx = Math.floor(p.px / t), pty = Math.floor(p.py / t);
          if (g.name === 'Acute') target = { x: ptx, y: pty };
          else if (g.name === 'Chronic') target = { x: ptx + p.dir.x * 4, y: pty + p.dir.y * 4 };
          else target = { x: ptx - p.dir.x * 2, y: pty + p.dir.y * 2 };
        }
        options.sort((a, b) => {
          const da = Math.hypot((tileX + a[0]) - target.x, (tileY + a[1]) - target.y);
          const db = Math.hypot((tileX + b[0]) - target.x, (tileY + b[1]) - target.y);
          return da - db;
        });
        choice = options[0];
      }
      g.dir = { x: choice[0], y: choice[1] };
      g.px = centerX; g.py = centerY;
    }

    g.px += g.dir.x * speed * dt;
    g.py += g.dir.y * speed * dt;

    const W = this.maze.width * t;
    if (g.px < -t / 2) g.px += W + t;
    else if (g.px > W + t / 2) g.px -= W + t;

    if (g.dir.x !== 0) g.py = centerY;
    if (g.dir.y !== 0) g.px = centerX;

    g.wiggle += dt * 0.006;

    const p = this.player;
    if (Math.hypot(p.px - g.px, p.py - g.py) < t * 0.55 && g.state !== 'penned') {
      if (g.state === 'scared') {
        g.state = 'eaten';
        this.score += 200;
        this.flaresAbsorbed++;
        this.health = Math.min(100, this.health + 4);
        this.onEvent({ type: 'flare', score: 200, name: g.name });
      } else if (g.state !== 'eaten') {
        this._playerHit();
      }
    }
  }

  _celebrateTick(now) {
    const elapsed = now - this.celebrationStart;
    const t = Math.min(1, elapsed / 1500);
    this.celebrateT = t;
    if (t >= 1 && !this.gameOver) {
      this.celebrating = false;
      this.gameOver = true;
      this.onEvent({ type: 'heal-complete' });
    }
  }

  _playerHit() {
    this.lives -= 1;
    this.health = Math.max(0, this.health - 15);
    this.onEvent({ type: 'hit' });
    if (this.lives <= 0) {
      this.gameOver = true;
      this.onEvent({ type: 'lose' });
    } else {
      const ps = this.maze.playerStart;
      const t = this.tile;
      this.player.px = ps.x * t + t / 2;
      this.player.py = ps.y * t + t / 2;
      this.player.dir = { x: 0, y: 0 };
      this.player.nextDir = { x: 0, y: 0 };
      this.ghosts.forEach((g, i) => {
        const pen = this.maze.penCenter;
        g.px = (pen.x + (i - 1)) * t + t / 2;
        g.py = pen.y * t + t / 2;
        g.state = 'penned';
        g.stateUntil = 600 + i * 300;
        g.dir = { x: 0, y: -1 };
      });
      this.startedAt = performance.now() - 0;
    }
  }

  _loop = () => {
    if (!this.running) return;
    const now = performance.now();
    let dt = now - this.lastT;
    this.lastT = now;
    if (dt > 48) dt = 48;
    if (!this.paused && !this.gameOver) {
      if (this.celebrating) {
        this._celebrateTick(now);
      } else {
        this.elapsed += dt;
        this.player.mouthPhase += dt * 0.012;
        this._tryMove(this.player, dt);
        this._eatPellets();
        for (const g of this.ghosts) this._ghostStep(g, dt, now);
      }
    }
    this._draw();
    this._raf = requestAnimationFrame(this._loop);
  };

  _draw() {
    const ctx = this.ctx;
    const t = this.tile;
    const W = this.maze.width * t;
    const H = this.maze.height * t;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const liveHealRatio = this.health / 100;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const cell = this.maze.grid[y][x];
        const cx = x * t + t / 2;
        const cy = y * t + t / 2;
        if (cell === TILE.WALL) {
          const healRatio = this.celebrating
            ? sweepRatio(x, this.maze.width, this.celebrateT, this.baseHealRatio)
            : liveHealRatio;
          const r = Math.round(lerp(201, 0, healRatio));
          const gr = Math.round(lerp(138, 128, healRatio));
          const b = Math.round(lerp(142, 128, healRatio));
          const wallColor = `rgb(${r},${gr},${b})`;
          const wallGlow = `rgba(${r},${gr},${b},0.18)`;
          ctx.fillStyle = wallGlow;
          roundRect(ctx, x * t + 2, y * t + 2, t - 4, t - 4, 4);
          ctx.fill();
          ctx.strokeStyle = wallColor;
          ctx.lineWidth = 2;
          roundRect(ctx, x * t + 3, y * t + 3, t - 6, t - 6, 3);
          ctx.stroke();
        } else if (cell === TILE.GATE) {
          ctx.fillStyle = '#78bfbf';
          ctx.fillRect(x * t + 2, y * t + t/2 - 2, t - 4, 4);
        } else if (cell === TILE.DOT) {
          ctx.fillStyle = '#008080';
          ctx.beginPath();
          ctx.arc(cx, cy, 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === TILE.POWER) {
          const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.12;
          ctx.fillStyle = 'rgba(217,168,74,0.22)';
          ctx.beginPath(); ctx.arc(cx, cy, 10 * pulse, 0, Math.PI * 2); ctx.fill();
          const grd = ctx.createRadialGradient(cx - 2, cy - 3, 1, cx, cy, 7);
          grd.addColorStop(0, '#ffdc8c');
          grd.addColorStop(1, '#c69533');
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.beginPath(); ctx.ellipse(cx - 1.5, cy - 2, 1.5, 0.8, -0.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    const scaredNow = this.scareUntil > performance.now();
    for (const g of this.ghosts) this._drawGhost(g, scaredNow);

    this._drawPlayer();
  }

  _drawPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    const r = this.tile * 0.42;
    const mouth = (Math.sin(p.mouthPhase) * 0.5 + 0.5) * 0.6;
    let angle = 0;
    if (p.dir.x === 1) angle = 0;
    else if (p.dir.x === -1) angle = Math.PI;
    else if (p.dir.y === 1) angle = Math.PI / 2;
    else if (p.dir.y === -1) angle = -Math.PI / 2;

    ctx.save();
    ctx.translate(p.px, p.py);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0,128,128,0.15)';
    ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, Math.PI * 2); ctx.fill();
    const grd = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    grd.addColorStop(0, '#4ca6a6');
    grd.addColorStop(1, '#006666');
    ctx.fillStyle = grd;
    ctx.beginPath();
    if (p.dir.x || p.dir.y) {
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, mouth, Math.PI * 2 - mouth);
      ctx.closePath();
    } else {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = '#004d4d';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.25, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _drawGhost(g, scaredNow) {
    const ctx = this.ctx;
    const r = this.tile * 0.42;
    const eaten = g.state === 'eaten';
    const scared = g.state === 'scared' && scaredNow;
    const flashing = scared && (this.scareUntil - performance.now() < 2000) && Math.floor(performance.now() / 200) % 2 === 0;

    ctx.save();
    ctx.translate(g.px, g.py);

    if (!eaten) {
      const baseColor = flashing ? '#def4f4' : scared ? '#008080' : g.color;
      if (!scared) {
        ctx.fillStyle = 'rgba(180,68,58,0.08)';
        ctx.beginPath(); ctx.arc(0, -1, r + 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.moveTo(-r, 2);
      ctx.arc(0, 0, r, Math.PI, 0, false);
      ctx.lineTo(r, r * 0.8);
      const bumps = 4;
      const amp = r * 0.22;
      for (let i = 0; i < bumps; i++) {
        const x1 = r - ((i + 0.5) / bumps) * 2 * r;
        const x2 = r - ((i + 1) / bumps) * 2 * r;
        const y1 = r * 0.8 + Math.sin(g.wiggle + i) * amp * 0.3;
        const y2 = r * 0.85;
        ctx.quadraticCurveTo((x1 + x2) / 2, y1 - amp, x2, y2);
      }
      ctx.lineTo(-r, 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const eyeOffX = r * 0.28;
    const eyeY = -r * 0.15;
    const pupilOff = 1.5;
    const pd = g.dir;
    const pox = pd.x * pupilOff, poy = pd.y * pupilOff;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-eyeOffX, eyeY, r * 0.18, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(eyeOffX, eyeY, r * 0.18, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = scared || eaten ? '#008080' : '#0f1f24';
    ctx.beginPath(); ctx.arc(-eyeOffX + pox, eyeY + poy, r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeOffX + pox, eyeY + poy, r * 0.09, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  snapshot() {
    return {
      score: this.score,
      lives: this.lives,
      health: Math.round(this.health),
      pellets: this.pelletsEaten,
      powers: this.powersEaten,
      flares: this.flaresAbsorbed,
      remaining: this._remainingPellets(),
      elapsed: Math.round(this.elapsed / 1000),
      win: this.win,
      gameOver: this.gameOver,
    };
  }
}

// Utilities used only by the engine — keep local
function lerp(a, b, t) { return a + (b - a) * t; }
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
