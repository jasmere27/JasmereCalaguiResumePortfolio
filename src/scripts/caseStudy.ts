// Project case-study overlay runtime. Imported dynamically on first click
// of a project card (see Projects.astro) — costs nothing on initial load.
//
// Content is NOT built here: every project's full case study is already
// rendered as real HTML by Astro at build time, sitting inert inside
// <template data-case-template> elements. This module only clones the
// right template into the overlay, animates the transition, and wires
// navigation/keyboard/close — it never constructs markup from strings.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let initialized = false;
let templates: HTMLTemplateElement[] = [];
let overlay: HTMLElement;
let stage: HTMLElement;
let dotsEl: HTMLElement;
let closeBtn: HTMLButtonElement;
let prevBtn: HTMLButtonElement;
let nextBtn: HTMLButtonElement;

let index = 0;
let lastFocused: HTMLElement | null = null;
let activeTriggers: ScrollTrigger[] = [];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function renderDots() {
  dotsEl.innerHTML = templates
    .map((_, i) => `<span class="pcs-dot${i === index ? ' is-current' : ''}" role="listitem"></span>`)
    .join('');
}

function refreshCursorBindings() {
  (window as unknown as { __motion?: { refreshCursor?: () => void } }).__motion?.refreshCursor?.();
}

function renderProject(direction: -1 | 0 | 1) {
  const tpl = templates[index];
  if (!tpl) return;

  activeTriggers.forEach((t) => t.kill());
  activeTriggers = [];

  const paint = () => {
    stage.innerHTML = '';
    stage.appendChild(tpl.content.cloneNode(true));
    stage.scrollTop = 0;
    renderDots();
    refreshCursorBindings();

    const items = stage.querySelectorAll<HTMLElement>('[data-animate-cs]');
    if (reducedMotion) {
      items.forEach((el) => gsap.set(el, { opacity: 1, y: 0 }));
    } else {
      items.forEach((el) => {
        activeTriggers.push(
          ScrollTrigger.create({
            trigger: el,
            scroller: stage,
            start: 'top 92%',
            once: true,
            onEnter: () => gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }),
          })
        );
      });
    }
    stage.focus();
  };

  if (reducedMotion) {
    paint();
    return;
  }

  gsap.to(stage, {
    opacity: 0,
    x: direction * -16,
    duration: 0.18,
    ease: 'power2.in',
    onComplete: () => {
      paint();
      gsap.fromTo(stage, { opacity: 0, x: direction * 16 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' });
    },
  });
}

function go(newIndex: number, direction: -1 | 0 | 1) {
  index = (newIndex + templates.length) % templates.length;
  renderProject(direction);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeOverlay();
  else if (e.key === 'ArrowRight') go(index + 1, 1);
  else if (e.key === 'ArrowLeft') go(index - 1, -1);
}

function closeOverlay() {
  overlay.classList.remove('is-open');
  document.removeEventListener('keydown', onKeydown);
  window.setTimeout(() => {
    overlay.hidden = true;
    document.body.style.overflow = '';
    activeTriggers.forEach((t) => t.kill());
    activeTriggers = [];
    stage.innerHTML = '';
  }, reducedMotion ? 0 : 300);
  lastFocused?.focus();
}

function init() {
  templates = Array.from(document.querySelectorAll<HTMLTemplateElement>('[data-case-template]')).sort(
    (a, b) => Number(a.dataset.caseIndex) - Number(b.dataset.caseIndex)
  );
  overlay = document.getElementById('pcs-overlay')!;
  stage = document.getElementById('pcs-stage')!;
  dotsEl = document.getElementById('pcs-dots')!;
  closeBtn = document.getElementById('pcs-close') as HTMLButtonElement;
  prevBtn = document.getElementById('pcs-prev') as HTMLButtonElement;
  nextBtn = document.getElementById('pcs-next') as HTMLButtonElement;

  closeBtn.addEventListener('click', closeOverlay);
  prevBtn.addEventListener('click', () => go(index - 1, -1));
  nextBtn.addEventListener('click', () => go(index + 1, 1));
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  initialized = true;
}

export function mountCaseStudy(startIndex: number) {
  if (!initialized) init();

  lastFocused = document.activeElement as HTMLElement;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  document.addEventListener('keydown', onKeydown);

  index = startIndex;
  renderProject(0);
}
