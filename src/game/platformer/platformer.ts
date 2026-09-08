// Stack Climb runtime. Dynamically imported only when a visitor clicks
// "Play Stack Climb" (see Platformer.astro), so it costs nothing on initial
// portfolio load. Owns all DOM/UI chrome (menu, HUD, panels, touch
// controls) as real elements; the canvas itself is pure simulation output
// from engine.ts. GSAP (already the sitewide motion engine) drives panel
// transitions, gated behind prefers-reduced-motion like the rest of the site.

import { gsap } from 'gsap';
import { Game, START_LIVES, type EngineCallbacks, type PromptInfo } from './engine';
import { credentials, education, gameTitle, gameTagline, levelMeta, type Credential } from './data';

const TOTAL = credentials.length;

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

function shellHtml(): string {
  return `
    <div class="pf-topbar">
      <div class="pf-topbar-left">
        <span class="pf-wordmark">${escapeHtml(gameTitle)}</span>
        <span class="pf-mission mono-tag" id="pf-mission">${escapeHtml(levelMeta.title)}</span>
        <span class="pf-kbd-hint mono-tag">&larr;&rarr; move &middot; Space jump &middot; E interact &middot; Esc pause</span>
      </div>
      <div class="pf-topbar-mid" id="pf-hud" hidden>
        <div class="pf-lives" id="pf-lives"></div>
        <div class="pf-progress-badge mono-tag">Credentials <strong id="pf-progress">0/${TOTAL}</strong></div>
      </div>
      <div class="pf-topbar-right">
        <button type="button" class="pf-chip-btn" id="pf-pause" hidden>Pause</button>
        <button type="button" class="pf-chip-btn" id="pf-restart">Restart</button>
        <button type="button" class="pf-chip-btn pf-exit" id="pf-exit" aria-label="Exit ${escapeHtml(gameTitle)} and return to the portfolio">Exit</button>
      </div>
    </div>
    <div class="pf-stage" id="pf-stage" tabindex="-1">
      <div class="pf-canvas-wrap">
        <canvas class="pf-canvas" id="pf-canvas" aria-hidden="true"></canvas>
        <div class="pf-prompt mono-tag" id="pf-prompt" hidden></div>
        <div class="pf-toast" id="pf-toast" role="status" hidden></div>
        <div class="pf-touch" id="pf-touch">
          <div class="pf-touch-group pf-touch-move">
            <button type="button" class="pf-touch-btn" id="pf-btn-left" aria-label="Move left"><span aria-hidden="true">&#9664;</span></button>
            <button type="button" class="pf-touch-btn" id="pf-btn-right" aria-label="Move right"><span aria-hidden="true">&#9654;</span></button>
          </div>
          <div class="pf-touch-group pf-touch-action">
            <button type="button" class="pf-touch-btn pf-touch-interact" id="pf-btn-interact" aria-label="Interact">E</button>
            <button type="button" class="pf-touch-btn pf-touch-jump" id="pf-btn-jump" aria-label="Jump">Jump</button>
          </div>
        </div>
      </div>
      <div class="pf-overlay-layer" id="pf-overlay-layer" hidden></div>
    </div>
    <p class="visually-hidden" role="status" aria-live="polite" id="pf-sr-status"></p>
  `;
}

function bindHold(btn: HTMLButtonElement, onDown: () => void, onUp: () => void): void {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onDown();
  });
  btn.addEventListener('pointerup', () => onUp());
  btn.addEventListener('pointercancel', () => onUp());
  btn.addEventListener('pointerleave', () => onUp());
  btn.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      onDown();
    }
  });
  btn.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onUp();
    }
  });
}

// Interact has no "held" behavior — it's a single one-shot trigger per
// press, on both touch and keyboard-focused activation of the button.
function bindPress(btn: HTMLButtonElement, onPress: () => void): void {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onPress();
  });
  btn.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      onPress();
    }
  });
}

export function mountPlatformer(root: HTMLElement, onExit: () => void): () => void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.innerHTML = shellHtml();

  const hud = root.querySelector<HTMLElement>('#pf-hud')!;
  const livesEl = root.querySelector<HTMLElement>('#pf-lives')!;
  const progressEl = root.querySelector<HTMLElement>('#pf-progress')!;
  const pauseBtn = root.querySelector<HTMLButtonElement>('#pf-pause')!;
  const restartBtn = root.querySelector<HTMLButtonElement>('#pf-restart')!;
  const exitBtn = root.querySelector<HTMLButtonElement>('#pf-exit')!;
  const stage = root.querySelector<HTMLElement>('#pf-stage')!;
  const canvas = root.querySelector<HTMLCanvasElement>('#pf-canvas')!;
  const promptEl = root.querySelector<HTMLElement>('#pf-prompt')!;
  const toastEl = root.querySelector<HTMLElement>('#pf-toast')!;
  const overlayLayer = root.querySelector<HTMLElement>('#pf-overlay-layer')!;
  const srStatus = root.querySelector<HTMLElement>('#pf-sr-status')!;
  const btnLeft = root.querySelector<HTMLButtonElement>('#pf-btn-left')!;
  const btnRight = root.querySelector<HTMLButtonElement>('#pf-btn-right')!;
  const btnJump = root.querySelector<HTMLButtonElement>('#pf-btn-jump')!;
  const btnInteract = root.querySelector<HTMLButtonElement>('#pf-btn-interact')!;

  type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';
  let state: GameState = 'menu';
  let panelOpen = false;
  let toastTimer = 0;
  let lastCollected = 0;

  function announce(msg: string): void {
    srStatus.textContent = msg;
  }

  function renderLives(lives: number, max: number): void {
    livesEl.setAttribute('role', 'img');
    livesEl.setAttribute('aria-label', `${lives} of ${max} lives remaining`);
    livesEl.innerHTML = Array.from({ length: max })
      .map((_, i) => `<span class="pf-life ${i < lives ? 'is-full' : 'is-empty'}"></span>`)
      .join('');
  }

  function showPrompt(prompt: PromptInfo): void {
    if (!prompt) {
      promptEl.hidden = true;
      btnInteract.classList.remove('is-available');
      btnInteract.setAttribute('aria-label', 'Interact');
      return;
    }
    promptEl.hidden = false;
    promptEl.textContent = `Press E — ${prompt.label}`;
    btnInteract.classList.add('is-available');
    btnInteract.setAttribute('aria-label', `Interact — ${prompt.label}`);
  }

  function showToast(msg: string): void {
    toastEl.hidden = false;
    toastEl.textContent = msg;
    announce(msg);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.hidden = true;
    }, 2400);
  }

  function openModal(html: string, focusSelector: string): void {
    panelOpen = true;
    overlayLayer.hidden = false;
    overlayLayer.innerHTML = html;
    const child = overlayLayer.firstElementChild as HTMLElement | null;
    if (child && !reducedMotion) {
      gsap.fromTo(child, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out' });
    }
    overlayLayer.querySelector<HTMLElement>(focusSelector)?.focus();
  }

  function closeModal(): void {
    panelOpen = false;
    overlayLayer.innerHTML = '';
    overlayLayer.hidden = true;
  }

  function resumeGameplay(): void {
    closeModal();
    state = 'playing';
    pauseBtn.hidden = false;
    engine.resume();
    stage.focus();
  }

  function openCredentialPanel(cred: Credential): void {
    engine.pause();
    openModal(
      `
      <div class="pf-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(cred.label)}">
        <p class="pf-eyebrow mono-tag">Credential</p>
        <h3>${escapeHtml(cred.label)}</h3>
        <p class="pf-panel-body">One of ${TOTAL} real certifications and training credentials Jasmere holds, backing his ${escapeHtml(education.degree)}.</p>
        <button type="button" class="pf-btn pf-btn-primary" id="pf-panel-primary">Continue</button>
      </div>
      `,
      '#pf-panel-primary'
    );
    root.querySelector('#pf-panel-primary')?.addEventListener('click', resumeGameplay);
    announce(`Reviewed credential: ${cred.label}.`);
  }

  function openSignPanel(): void {
    engine.pause();
    openModal(
      `
      <div class="pf-panel" role="dialog" aria-modal="true" aria-label="Welcome sign">
        <p class="pf-eyebrow mono-tag">${escapeHtml(levelMeta.subtitle)}</p>
        <h3>${escapeHtml(levelMeta.title)}</h3>
        <p class="pf-panel-body">${escapeHtml(levelMeta.mission)} Everything you find in this level is real, pulled straight from Jasmere's résumé.</p>
        <button type="button" class="pf-btn pf-btn-primary" id="pf-panel-primary">Got it</button>
      </div>
      `,
      '#pf-panel-primary'
    );
    root.querySelector('#pf-panel-primary')?.addEventListener('click', resumeGameplay);
  }

  function openPausePanel(): void {
    state = 'paused';
    engine.pause();
    openModal(
      `
      <div class="pf-panel" role="dialog" aria-modal="true" aria-label="Paused">
        <p class="pf-eyebrow mono-tag">Paused</p>
        <h3>Take a breath</h3>
        <p class="pf-panel-body">Progress is kept — credentials collected and lives remaining stay exactly as they are.</p>
        <div class="pf-menu-actions">
          <button type="button" class="pf-btn pf-btn-primary" id="pf-panel-primary">Resume</button>
          <button type="button" class="pf-btn pf-btn-ghost" id="pf-panel-secondary">Restart level</button>
        </div>
      </div>
      `,
      '#pf-panel-primary'
    );
    root.querySelector('#pf-panel-primary')?.addEventListener('click', resumeGameplay);
    root.querySelector('#pf-panel-secondary')?.addEventListener('click', restartLevel);
  }

  function openGameOverPanel(): void {
    state = 'gameover';
    pauseBtn.hidden = true;
    showPrompt(null);
    openModal(
      `
      <div class="pf-panel" role="dialog" aria-modal="true" aria-label="Out of tries">
        <p class="pf-eyebrow mono-tag">Out of tries</p>
        <h3>No credentials lost — try again</h3>
        <p class="pf-panel-body">You collected ${lastCollected}/${TOTAL} credentials this run. The level resets, but nothing about the real facts does.</p>
        <div class="pf-menu-actions">
          <button type="button" class="pf-btn pf-btn-primary" id="pf-panel-primary">Retry level</button>
          <button type="button" class="pf-btn pf-btn-ghost" id="pf-panel-secondary">Exit to portfolio</button>
        </div>
      </div>
      `,
      '#pf-panel-primary'
    );
    root.querySelector('#pf-panel-primary')?.addEventListener('click', restartLevel);
    root.querySelector('#pf-panel-secondary')?.addEventListener('click', onExit);
    announce('Out of tries. Retry the level to continue.');
  }

  function openVictoryPanel(): void {
    state = 'victory';
    pauseBtn.hidden = true;
    showPrompt(null);
    const list = credentials.map((c) => `<li>${escapeHtml(c.label)}</li>`).join('');
    openModal(
      `
      <div class="pf-panel pf-victory" role="dialog" aria-modal="true" aria-label="Level complete">
        <p class="pf-eyebrow mono-tag">Diploma Terminal — unlocked</p>
        <h2>${escapeHtml(education.degree)}</h2>
        <p class="pf-accent mono-tag">${escapeHtml(education.status)}</p>
        <p class="pf-panel-body">Every credential collected along the way is real:</p>
        <ul class="pf-cred-list">${list}</ul>
        <div class="pf-cta-row">
          <a href="#education" class="pf-btn pf-btn-primary" id="pf-cta-education">View the Education section</a>
          <a href="/jasmere-paul-calagui-resume.pdf" class="pf-btn pf-btn-ghost" download>View résumé</a>
          <button type="button" class="pf-btn pf-btn-ghost" id="pf-panel-secondary">Close</button>
        </div>
      </div>
      `,
      '#pf-cta-education'
    );

    function closeThenGo(hash: string) {
      onExit();
      window.setTimeout(() => {
        (window as unknown as { __motion?: { scrollToHash: (h: string) => void } }).__motion?.scrollToHash(hash);
      }, 50);
    }

    root.querySelector('#pf-cta-education')?.addEventListener('click', (e) => {
      e.preventDefault();
      closeThenGo('#education');
    });
    root.querySelector('#pf-panel-secondary')?.addEventListener('click', onExit);
    announce('Level complete. Diploma terminal unlocked.');
  }

  function openMenu(): void {
    state = 'menu';
    hud.hidden = true;
    pauseBtn.hidden = true;
    openModal(
      `
      <div class="pf-panel pf-menu" role="dialog" aria-modal="true" aria-label="${escapeHtml(gameTitle)} main menu">
        <p class="pf-eyebrow mono-tag">Original 2D platformer</p>
        <h2 class="pf-title">${escapeHtml(gameTitle)}</h2>
        <p class="pf-panel-body">${escapeHtml(gameTagline)}</p>
        <p class="pf-hint mono-tag">Keyboard: &larr;&rarr; / A D move &middot; Space / W jump &middot; E interact &middot; Esc pause</p>
        <div class="pf-menu-actions">
          <button type="button" class="pf-btn pf-btn-primary" id="pf-menu-start">Start — ${escapeHtml(levelMeta.title)}</button>
          <button type="button" class="pf-btn pf-btn-ghost" id="pf-menu-controls" aria-expanded="false" aria-controls="pf-menu-controls-detail">How to play</button>
        </div>
        <div class="pf-controls-detail" id="pf-menu-controls-detail" hidden>
          <div class="pf-controls-col">
            <p class="pf-controls-heading mono-tag">Keyboard</p>
            <ul>
              <li>&larr; / &rarr; or A / D — move</li>
              <li>Space / W / &uarr; — jump (hold for higher)</li>
              <li>E — interact</li>
              <li>Esc — pause</li>
            </ul>
          </div>
          <div class="pf-controls-col">
            <p class="pf-controls-heading mono-tag">Touch</p>
            <ul>
              <li>On-screen &#9664; &#9654; — move</li>
              <li>Jump button — jump</li>
              <li>E button — interact</li>
            </ul>
          </div>
        </div>
      </div>
      `,
      '#pf-menu-start'
    );

    root.querySelector('#pf-menu-controls')?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const detail = root.querySelector<HTMLElement>('#pf-menu-controls-detail')!;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      detail.hidden = expanded;
    });
    root.querySelector('#pf-menu-start')?.addEventListener('click', () => {
      closeModal();
      beginPlaying();
    });
  }

  function beginPlaying(): void {
    state = 'playing';
    hud.hidden = false;
    pauseBtn.hidden = false;
    engine.restart();
    engine.start();
    stage.focus();
  }

  function restartLevel(): void {
    closeModal();
    hud.hidden = false;
    pauseBtn.hidden = false;
    showPrompt(null);
    engine.restart();
    state = 'playing';
    engine.start();
    stage.focus();
    announce('Level restarted.');
  }

  const callbacks: EngineCallbacks = {
    onLivesChange(lives, max) {
      renderLives(lives, max);
      if (!reducedMotion) gsap.fromTo(livesEl, { scale: 1.15 }, { scale: 1, duration: 0.3, ease: 'power2.out' });
      if (lives < max && lives > 0) announce(`Lost a life — ${lives} of ${max} remaining.`);
    },
    onProgressChange(collected, total) {
      lastCollected = collected;
      progressEl.textContent = `${collected}/${total}`;
      if (!reducedMotion) {
        gsap.fromTo(
          progressEl,
          { scale: 1.3, color: 'var(--color-signal)' },
          { scale: 1, duration: 0.35, ease: 'power2.out' }
        );
      }
    },
    onPrompt(prompt) {
      showPrompt(prompt);
    },
    onCredential(cred) {
      openCredentialPanel(cred);
    },
    onSign() {
      openSignPanel();
    },
    onTerminalLocked(remaining) {
      showToast(`Collect ${remaining} more credential${remaining === 1 ? '' : 's'} before opening the terminal.`);
    },
    onVictory() {
      openVictoryPanel();
    },
    onGameOver() {
      openGameOverPanel();
    },
  };

  const engine = new Game(canvas, callbacks, reducedMotion);
  renderLives(START_LIVES, START_LIVES);

  bindHold(
    btnLeft,
    () => engine.setInput({ left: true }),
    () => engine.setInput({ left: false })
  );
  bindHold(
    btnRight,
    () => engine.setInput({ right: true }),
    () => engine.setInput({ right: false })
  );
  bindHold(
    btnJump,
    () => {
      engine.setInput({ jumpHeld: true });
      engine.queueJump();
    },
    () => engine.setInput({ jumpHeld: false })
  );
  bindPress(btnInteract, () => engine.queueInteract());

  function onKeydown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        engine.setInput({ left: true });
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        engine.setInput({ right: true });
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        engine.setInput({ jumpHeld: true });
        if (!e.repeat) engine.queueJump();
        e.preventDefault();
        break;
      case 'KeyE':
        if (!e.repeat) engine.queueInteract();
        e.preventDefault();
        break;
      case 'Escape':
        if (state === 'playing' && panelOpen) resumeGameplay();
        else if (state === 'playing') openPausePanel();
        else if (state === 'paused') resumeGameplay();
        break;
      default:
        break;
    }
  }

  function onKeyup(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        engine.setInput({ left: false });
        break;
      case 'ArrowRight':
      case 'KeyD':
        engine.setInput({ right: false });
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        engine.setInput({ jumpHeld: false });
        break;
      default:
        break;
    }
  }

  function handleVisibility(): void {
    if (document.hidden) {
      if (state === 'playing') engine.pause();
    } else if (state === 'playing' && engine.isPaused && !panelOpen) {
      engine.resume();
    }
  }

  document.addEventListener('keydown', onKeydown);
  document.addEventListener('keyup', onKeyup);
  document.addEventListener('visibilitychange', handleVisibility);

  pauseBtn.addEventListener('click', () => {
    if (state === 'playing') openPausePanel();
    else if (state === 'paused') resumeGameplay();
  });
  restartBtn.addEventListener('click', restartLevel);
  exitBtn.addEventListener('click', onExit);

  openMenu();

  return function unmount() {
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('keyup', onKeyup);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.clearTimeout(toastTimer);
    engine.destroy();
    root.innerHTML = '';
  };
}
