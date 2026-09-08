// Canvas simulation for Stack Climb, Level 1 (Education). Framework-free:
// one class owns physics, collision, camera, level geometry, and rendering,
// driven by exactly one requestAnimationFrame loop that it starts/stops
// itself (started on mount, stopped on pause/hidden-tab/destroy). All UI
// chrome (menu, HUD, panels) lives in platformer.ts as real DOM — this file
// never touches the DOM outside the canvas it's given.

import { credentials, type Credential } from './data';

export const LOGICAL_W = 960;
export const LOGICAL_H = 540;

type Rect = { x: number; y: number; w: number; h: number };

type StationKind = 'sign' | 'credential' | 'terminal';

type Station = {
  id: string;
  kind: StationKind;
  x: number;
  y: number;
  radius: number;
  credentialIndex?: number;
};

type Hazard = {
  x: number;
  y: number;
  w: number;
  h: number;
  minX: number;
  maxX: number;
  speed: number;
  dir: 1 | -1;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  facing: 1 | -1;
  coyote: number;
  jumpBuffer: number;
  invuln: number;
  landSquash: number;
  // True only while airborne *because of an actual jump*. Ledge assist
  // (below) forgives a jump landing just barely short of a platform's top —
  // it must NOT also forgive simply walking off a ledge with no jump at
  // all, or every pit becomes a free pass at running speed.
  fromJump: boolean;
};

export type PromptInfo = { id: string; label: string; kind: StationKind } | null;

export type EngineCallbacks = {
  onLivesChange: (lives: number, max: number) => void;
  onProgressChange: (collected: number, total: number) => void;
  onPrompt: (prompt: PromptInfo) => void;
  onCredential: (cred: Credential) => void;
  onSign: () => void;
  onTerminalLocked: (remaining: number) => void;
  onVictory: () => void;
  onGameOver: () => void;
};

// `left`/`right`/`jumpHeld` are sampled continuously (movement and variable
// jump height both care whether a key is *currently* down). Jump and
// interact triggers, by contrast, are edge-triggered one-shot events
// (`queueJump`/`queueInteract` below) rather than derived by comparing this
// state to its previous frame — a keydown+keyup pair dispatched faster than
// one animation frame apart (routine for programmatic/automated input, and
// possible on a throttled tab) would otherwise never be observed as a
// "press" by per-frame polling.
export type InputState = {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
};

const GRAVITY = 1300;
const MOVE_ACCEL = 2600;
const AIR_ACCEL = 1600;
const GROUND_FRICTION = 2800;
const AIR_FRICTION = 900;
const MAX_SPEED = 230;
const JUMP_VELOCITY = -600;
const MAX_FALL_SPEED = 900;
// A quick tap must still clear the level's pits on its own — variable jump
// height should reward holding for *extra* reach (the optional elevated
// platforms), not gate the main path's minimum viable jump behind holding
// the button just right. 0.75 keeps a real, feelable difference between a
// tap and a held jump while keeping the short hop generous.
const SHORT_HOP_CUTOFF = JUMP_VELOCITY * 0.75;
const COYOTE_TIME = 0.1;
const JUMP_BUFFER = 0.12;
const INVULN_TIME = 1.2;
export const PLAYER_W = 28;
export const PLAYER_H = 38;
export const START_LIVES = 3;

// A near-miss jump that clears a gap but comes down just barely short of a
// platform's top shouldn't bonk the player into its side and drop them —
// that reads as broken, not as "you missed." Any horizontal collision this
// shallow below a platform's top snaps the player up onto it instead of
// blocking them, the same generous ledge-forgiveness accessible platformers
// use. This is a showcase level, not a precision-platforming test.
const LEDGE_ASSIST = 18;

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

type Palette = {
  ink: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentDim: string;
  accentSoft: string;
  signal: string;
  signalSoft: string;
};

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string) => cs.getPropertyValue(name).trim() || '#e8a23d';
  return {
    ink: v('--color-ink'),
    surface: v('--color-surface'),
    surfaceRaised: v('--color-surface-raised'),
    border: v('--color-border'),
    borderStrong: v('--color-border-strong'),
    text: v('--color-text'),
    textMuted: v('--color-text-muted'),
    textFaint: v('--color-text-faint'),
    accent: v('--color-accent'),
    accentDim: v('--color-accent-dim'),
    accentSoft: v('--color-accent-soft'),
    signal: v('--color-signal'),
    signalSoft: v('--color-signal-soft'),
  };
}

type LevelData = {
  platforms: Rect[];
  hazards: Hazard[];
  stations: Station[];
  levelWidth: number;
  spawn: { x: number; y: number };
};

// Hand-authored Level 1 geometry: five ground segments separated by jumpable
// pits, a handful of low floating platforms, two patrolling hazards, and one
// station per real credential plus a welcome sign and a closing terminal.
// Pits are kept narrow (60px) on purpose: even a quick tap-jump (the short
// hop — see SHORT_HOP_CUTOFF) clears one with real margin regardless of
// exactly when it's thrown. This is a portfolio showcase meant to read as
// "responsive and fair," not a precision-platforming difficulty test.
function buildLevel(): LevelData {
  const groundY = 460;
  const groundH = 80;

  const platforms: Rect[] = [
    { x: 0, y: groundY, w: 560, h: groundH },
    { x: 620, y: groundY, w: 500, h: groundH },
    { x: 1180, y: groundY, w: 500, h: groundH },
    { x: 1740, y: groundY, w: 500, h: groundH },
    { x: 2300, y: groundY, w: 700, h: groundH },
    // low floating platforms — optional elevation, not required to finish
    { x: 1890, y: 380, w: 140, h: 22 },
    { x: 2500, y: 380, w: 140, h: 22 },
  ];

  const hazards: Hazard[] = [
    { x: 1260, y: groundY - 30, w: 30, h: 30, minX: 1260, maxX: 1550, speed: 55, dir: 1 },
    { x: 1790, y: groundY - 30, w: 30, h: 30, minX: 1790, maxX: 2080, speed: 65, dir: 1 },
  ];

  const stations: Station[] = [
    { id: 'sign-start', kind: 'sign', x: 150, y: groundY - 24, radius: 46 },
    { id: 'cred-0', kind: 'credential', x: 750, y: groundY - 30, radius: 42, credentialIndex: 0 },
    { id: 'cred-1', kind: 'credential', x: 1330, y: groundY - 30, radius: 42, credentialIndex: 1 },
    { id: 'cred-2', kind: 'credential', x: 1960, y: 380 - 26, radius: 42, credentialIndex: 2 },
    { id: 'cred-3', kind: 'credential', x: 2570, y: 380 - 26, radius: 42, credentialIndex: 3 },
    { id: 'terminal', kind: 'terminal', x: 2830, y: groundY - 46, radius: 52 },
  ];

  return {
    platforms,
    hazards,
    stations,
    levelWidth: 3000,
    spawn: { x: 40, y: groundY - PLAYER_H },
  };
}

export class Game {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private palette: Palette;
  private reducedMotion: boolean;
  private callbacks: EngineCallbacks;

  private input: InputState = { left: false, right: false, jumpHeld: false };
  private pendingJump = false;
  private pendingInteract = false;

  private platforms: Rect[];
  private hazards: Hazard[];
  private stations: Station[];
  private levelWidth: number;
  private spawn: { x: number; y: number };
  private totalCredentials: number;

  private player: Player;
  private lastSafe: { x: number; y: number };
  private lives = START_LIVES;
  private collected = new Set<number>();
  private cameraX = 0;
  private particles: Particle[] = [];
  private activePromptId: string | null = null;

  private resizeObserver: ResizeObserver | null = null;
  private rafId = 0;
  private running = false;
  private paused = false;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks, reducedMotion: boolean) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.reducedMotion = reducedMotion;
    this.palette = readPalette();

    const level = buildLevel();
    this.platforms = level.platforms;
    this.hazards = level.hazards;
    this.stations = level.stations;
    this.levelWidth = level.levelWidth;
    this.spawn = level.spawn;
    this.totalCredentials = this.stations.filter((s) => s.kind === 'credential').length;

    this.player = this.freshPlayer();
    this.lastSafe = { x: this.spawn.x, y: this.spawn.y };

    this.loop = this.loop.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(canvas);
    this.handleResize();
  }

  private freshPlayer(): Player {
    return {
      x: this.spawn.x,
      y: this.spawn.y,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 1,
      coyote: 0,
      jumpBuffer: 0,
      invuln: 0,
      landSquash: 0,
      fromJump: false,
    };
  }

  setInput(partial: Partial<InputState>): void {
    Object.assign(this.input, partial);
  }

  // One-shot triggers: latched immediately rather than waiting for the next
  // update() to poll a continuous flag, so a press is never lost even if
  // its matching release lands before that frame runs (see InputState).
  queueJump(): void {
    this.pendingJump = true;
  }

  queueInteract(): void {
    this.pendingInteract = true;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.stop();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.start();
  }

  get isPaused(): boolean {
    return this.paused;
  }

  restart(): void {
    const level = buildLevel();
    this.hazards = level.hazards;
    this.player = this.freshPlayer();
    this.lastSafe = { x: this.spawn.x, y: this.spawn.y };
    this.lives = START_LIVES;
    this.collected = new Set();
    this.cameraX = 0;
    this.particles = [];
    this.activePromptId = null;
    this.pendingJump = false;
    this.pendingInteract = false;
    this.paused = false;
    this.callbacks.onLivesChange(this.lives, START_LIVES);
    this.callbacks.onProgressChange(0, this.totalCredentials);
    this.callbacks.onPrompt(null);
    this.render();
  }

  destroy(): void {
    this.stop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayW = Math.max(1, Math.round(rect.width));
    const displayH = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(displayW * dpr);
    this.canvas.height = Math.round(displayH * dpr);
    const scale = displayW / LOGICAL_W;
    this.ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    if (!this.running) this.render();
  }

  private loop(t: number): void {
    if (!this.running) return;
    let dt = (t - this.lastTime) / 1000;
    this.lastTime = t;
    if (dt > 0.05) dt = 0.05;
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  }

  private hurtPlayer(): void {
    if (this.player.invuln > 0) return;
    this.lives -= 1;
    this.callbacks.onLivesChange(this.lives, START_LIVES);
    if (this.lives <= 0) {
      this.stop();
      this.callbacks.onGameOver();
      return;
    }
    this.player.x = this.lastSafe.x;
    this.player.y = this.lastSafe.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.fromJump = false;
    this.player.invuln = INVULN_TIME;
  }

  private moveAxis(axis: 'x' | 'y', delta: number): void {
    const p = this.player;
    if (axis === 'x') {
      p.x += delta;
      for (const pl of this.platforms) {
        if (rectsOverlap(p.x, p.y, PLAYER_W, PLAYER_H, pl.x, pl.y, pl.w, pl.h)) {
          const feetBelowTop = p.y + PLAYER_H - pl.y;
          if (!p.grounded && p.fromJump && feetBelowTop <= LEDGE_ASSIST) {
            p.y = pl.y - PLAYER_H;
            p.vy = 0;
            p.grounded = true;
            p.fromJump = false;
          } else if (delta > 0) {
            p.x = pl.x - PLAYER_W;
            p.vx = 0;
          } else if (delta < 0) {
            p.x = pl.x + pl.w;
            p.vx = 0;
          }
        }
      }
      p.x = Math.max(0, Math.min(this.levelWidth - PLAYER_W, p.x));
    } else {
      p.y += delta;
      for (const pl of this.platforms) {
        if (rectsOverlap(p.x, p.y, PLAYER_W, PLAYER_H, pl.x, pl.y, pl.w, pl.h)) {
          if (delta > 0) {
            p.y = pl.y - PLAYER_H;
            p.vy = 0;
            p.grounded = true;
            p.fromJump = false;
          } else if (delta < 0) {
            p.y = pl.y + pl.h;
            p.vy = 0;
          }
        }
      }
    }
  }

  private promptLabelFor(st: Station): string {
    if (st.kind === 'credential' && st.credentialIndex !== undefined) {
      const done = this.collected.has(st.credentialIndex);
      const label = credentials[st.credentialIndex].label;
      return done ? `${label} — reviewed` : `Inspect ${label}`;
    }
    if (st.kind === 'terminal') return 'Open the Diploma Terminal';
    return 'Read the sign';
  }

  private updateStationPrompt(): void {
    const p = this.player;
    const cx = p.x + PLAYER_W / 2;
    const cy = p.y + PLAYER_H / 2;
    let nearest: Station | null = null;
    let nearestDist = Infinity;
    for (const st of this.stations) {
      const dist = Math.hypot(st.x - cx, st.y - cy);
      if (dist <= st.radius && dist < nearestDist) {
        nearest = st;
        nearestDist = dist;
      }
    }
    const id = nearest?.id ?? null;
    if (id !== this.activePromptId) {
      this.activePromptId = id;
      this.callbacks.onPrompt(nearest ? { id: nearest.id, label: this.promptLabelFor(nearest), kind: nearest.kind } : null);
    } else if (nearest && nearest.kind === 'credential') {
      // Label can change (reviewed vs. not) without the target itself
      // changing — keep the HUD prompt text in sync either way.
      this.callbacks.onPrompt({ id: nearest.id, label: this.promptLabelFor(nearest), kind: nearest.kind });
    }
  }

  private handleInteract(id: string): void {
    const st = this.stations.find((s) => s.id === id);
    if (!st) return;
    if (st.kind === 'sign') {
      this.callbacks.onSign();
    } else if (st.kind === 'credential' && st.credentialIndex !== undefined) {
      const idx = st.credentialIndex;
      if (!this.collected.has(idx)) {
        this.collected.add(idx);
        this.callbacks.onProgressChange(this.collected.size, this.totalCredentials);
        if (!this.reducedMotion) this.spawnCollectParticles(st.x, st.y);
      }
      this.callbacks.onCredential(credentials[idx]);
    } else if (st.kind === 'terminal') {
      if (this.collected.size >= this.totalCredentials) {
        this.stop();
        this.callbacks.onVictory();
      } else {
        this.callbacks.onTerminalLocked(this.totalCredentials - this.collected.size);
      }
    }
  }

  private update(dt: number): void {
    const p = this.player;
    const wasGrounded = p.grounded;

    const accel = p.grounded ? MOVE_ACCEL : AIR_ACCEL;
    const friction = p.grounded ? GROUND_FRICTION : AIR_FRICTION;
    const dir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);

    if (dir !== 0) {
      p.vx += dir * accel * dt;
      p.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.vx));
      p.facing = dir as 1 | -1;
    } else if (p.vx !== 0) {
      const decel = friction * dt;
      p.vx = p.vx > 0 ? Math.max(0, p.vx - decel) : Math.min(0, p.vx + decel);
    }

    p.coyote = p.grounded ? COYOTE_TIME : Math.max(0, p.coyote - dt);
    if (this.pendingJump) {
      this.pendingJump = false;
      p.jumpBuffer = JUMP_BUFFER;
    } else {
      p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    }

    if (p.jumpBuffer > 0 && p.coyote > 0) {
      p.vy = JUMP_VELOCITY;
      p.grounded = false;
      p.fromJump = true;
      p.coyote = 0;
      p.jumpBuffer = 0;
    } else if (!this.input.jumpHeld && p.vy < SHORT_HOP_CUTOFF) {
      p.vy = SHORT_HOP_CUTOFF;
    }

    p.vy = Math.min(MAX_FALL_SPEED, p.vy + GRAVITY * dt);

    p.grounded = false;
    this.moveAxis('x', p.vx * dt);
    this.moveAxis('y', p.vy * dt);

    if (p.grounded && !wasGrounded) {
      p.landSquash = 1;
      if (!this.reducedMotion) this.spawnDustParticles(p.x + PLAYER_W / 2, p.y + PLAYER_H);
    }
    p.landSquash = Math.max(0, p.landSquash - dt * 4);

    if (p.grounded) this.lastSafe = { x: p.x, y: p.y };

    p.invuln = Math.max(0, p.invuln - dt);

    for (const hz of this.hazards) {
      hz.x += hz.speed * hz.dir * dt;
      if (hz.x < hz.minX) {
        hz.x = hz.minX;
        hz.dir = 1;
      } else if (hz.x + hz.w > hz.maxX) {
        hz.x = hz.maxX - hz.w;
        hz.dir = -1;
      }
    }

    if (p.invuln <= 0) {
      for (const hz of this.hazards) {
        if (rectsOverlap(p.x, p.y, PLAYER_W, PLAYER_H, hz.x, hz.y, hz.w, hz.h)) {
          this.hurtPlayer();
          break;
        }
      }
    }

    if (p.y > LOGICAL_H + 140) this.hurtPlayer();

    this.updateStationPrompt();

    if (this.pendingInteract) {
      this.pendingInteract = false;
      if (this.activePromptId) this.handleInteract(this.activePromptId);
    }

    const target = Math.max(0, Math.min(this.levelWidth - LOGICAL_W, p.x + PLAYER_W / 2 - LOGICAL_W / 2));
    this.cameraX += (target - this.cameraX) * Math.min(1, dt * 8);

    this.updateParticles(dt);
  }

  private spawnDustParticles(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 60,
        vy: -Math.random() * 40,
        life: 0.4,
        maxLife: 0.4,
        size: 2 + Math.random() * 2,
        color: this.palette.textFaint,
      });
    }
  }

  private spawnCollectParticles(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * 90,
        vy: Math.sin(a) * 90,
        life: 0.5,
        maxLife: 0.5,
        size: 2.5,
        color: this.palette.signal,
      });
    }
  }

  private updateParticles(dt: number): void {
    if (this.particles.length === 0) return;
    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 220 * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
  }

  private drawParallax(): void {
    const ctx = this.ctx;
    const pal = this.palette;
    const farOffset = -((this.cameraX * 0.2) % 220);
    ctx.fillStyle = pal.surface;
    for (let i = -1; i < LOGICAL_W / 220 + 2; i++) {
      const x = farOffset + i * 220;
      ctx.beginPath();
      ctx.arc(x, 120, 58, 0, Math.PI * 2);
      ctx.fill();
    }
    const nearOffset = -((this.cameraX * 0.45) % 160);
    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 1;
    for (let i = -1; i < LOGICAL_W / 160 + 2; i++) {
      const x = nearOffset + i * 160;
      ctx.beginPath();
      ctx.moveTo(x, 410);
      ctx.lineTo(x + 60, 410);
      ctx.stroke();
    }
  }

  private drawHazard(hz: Hazard, t: number): void {
    const ctx = this.ctx;
    const pal = this.palette;
    const jitter = this.reducedMotion ? 0 : Math.sin(t * 30 + hz.x) * 1.4;
    const cx = hz.x + hz.w / 2 + jitter;
    const cy = hz.y + hz.h / 2;
    const r = hz.w / 2;
    ctx.fillStyle = pal.accentDim;
    ctx.strokeStyle = pal.borderStrong;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      const rad = i % 2 === 0 ? r : r * 0.55;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawStation(st: Station, t: number): void {
    const ctx = this.ctx;
    const pal = this.palette;
    const active = this.activePromptId === st.id;

    if (st.kind === 'sign') {
      ctx.fillStyle = pal.surfaceRaised;
      ctx.strokeStyle = pal.borderStrong;
      ctx.lineWidth = 2;
      ctx.fillRect(st.x - 3, st.y, 6, 40);
      ctx.strokeRect(st.x - 3, st.y, 6, 40);
      roundRect(ctx, st.x - 26, st.y - 34, 52, 36, 6);
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.strokeStyle = active ? pal.accent : pal.borderStrong;
      ctx.stroke();
      ctx.fillStyle = pal.accent;
      ctx.font = '700 20px "Space Grotesk Variable", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('i', st.x, st.y - 16);
      return;
    }

    if (st.kind === 'credential' && st.credentialIndex !== undefined) {
      const done = this.collected.has(st.credentialIndex);
      const bob = this.reducedMotion ? 0 : Math.sin(t * 2 + st.x) * 4;
      const y = st.y + bob;
      const pulse = this.reducedMotion ? 1 : 0.85 + Math.sin(t * 4 + st.x) * 0.15;
      ctx.beginPath();
      ctx.arc(st.x, y, 15 * (done ? 0.85 : pulse), 0, Math.PI * 2);
      ctx.globalAlpha = done ? 0.55 : 1;
      ctx.fillStyle = done ? pal.signalSoft : pal.signal;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = pal.borderStrong;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (done) {
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(st.x - 6, y);
        ctx.lineTo(st.x - 1, y + 5);
        ctx.lineTo(st.x + 7, y - 7);
        ctx.stroke();
      }
      if (active) {
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(st.x, y, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }

    // terminal
    const ratio = this.totalCredentials ? this.collected.size / this.totalCredentials : 0;
    const glow = this.reducedMotion ? ratio : ratio * (0.75 + Math.sin(t * 3) * 0.25);
    ctx.save();
    ctx.shadowColor = pal.accent;
    ctx.shadowBlur = 8 + glow * 24;
    ctx.fillStyle = pal.surfaceRaised;
    ctx.strokeStyle = ratio >= 1 ? pal.accent : pal.borderStrong;
    ctx.lineWidth = 2.5;
    roundRect(ctx, st.x - 22, st.y, 44, 92, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = ratio >= 1 ? pal.accent : pal.textFaint;
    ctx.fillRect(st.x - 14, st.y + 16, 28, 16);
    if (active) {
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(st.x - 30, st.y - 10, 60, 112);
    }
  }

  private drawPlayer(t: number): void {
    const ctx = this.ctx;
    const pal = this.palette;
    const p = this.player;
    const cx = p.x + PLAYER_W / 2;
    const cy = p.y + PLAYER_H / 2;
    const squashY = 1 - p.landSquash * 0.25;
    const squashX = 1 + p.landSquash * 0.2;
    const airStretch = !p.grounded ? Math.min(0.15, Math.abs(p.vy) / 3000) : 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(p.facing, 1);
    ctx.scale(squashX + airStretch, squashY - airStretch);

    const flashing = p.invuln > 0 && !this.reducedMotion;
    ctx.globalAlpha = flashing ? 0.55 + Math.sin(t * 14) * 0.3 : 1;

    const moving = Math.abs(p.vx) > 8 && p.grounded;
    const phase = moving && !this.reducedMotion ? Math.sin(t * 12) : 0;
    ctx.fillStyle = pal.accentDim;
    ctx.fillRect(-9, PLAYER_H / 2 - 14 + phase * 3, 7, 12);
    ctx.fillRect(2, PLAYER_H / 2 - 14 - phase * 3, 7, 12);

    ctx.fillStyle = pal.accent;
    roundRect(ctx, -PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W, PLAYER_H - 10, 8);
    ctx.fill();
    ctx.strokeStyle = pal.accentDim;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = pal.signal;
    roundRect(ctx, 2, -PLAYER_H / 2 + 8, 12, 8, 3);
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private render(): void {
    const ctx = this.ctx;
    const pal = this.palette;

    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = pal.ink;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    this.drawParallax();

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    for (const pl of this.platforms) {
      ctx.fillStyle = pal.surfaceRaised;
      roundRect(ctx, pl.x, pl.y, pl.w, pl.h, 6);
      ctx.fill();
      ctx.strokeStyle = pal.borderStrong;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = pal.accentSoft;
      ctx.beginPath();
      ctx.moveTo(pl.x + 4, pl.y + 2);
      ctx.lineTo(pl.x + pl.w - 4, pl.y + 2);
      ctx.stroke();
    }

    const t = performance.now() / 1000;
    for (const hz of this.hazards) this.drawHazard(hz, t);
    for (const st of this.stations) this.drawStation(st, t);

    for (const pt of this.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.drawPlayer(t);

    ctx.restore();
  }
}
