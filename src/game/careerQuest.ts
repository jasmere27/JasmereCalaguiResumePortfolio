// Career Quest runtime. Dynamically imported only when the visitor clicks
// "Play My Career Quest" — see CareerQuest.astro — so it costs nothing on
// initial page load. Renders entirely into a single root element via
// innerHTML swaps; no framework, no extra dependencies beyond gsap (already
// part of the site's core bundle via MotionRoot).

import { gsap } from 'gsap';
import {
  education,
  certifications,
  experience,
  featuredProject,
  aiSkillItems,
  collectibleTech,
  totalTechCount,
  projects,
  bugChallenge,
  scenarioChallenge,
  veriFactDemo,
  levels,
  type LevelKey,
} from './data';

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function shellHtml(): string {
  return `
    <div class="cq-topbar">
      <div class="cq-topbar-left">
        <span class="cq-wordmark">Career Quest</span>
        <span class="cq-mission" id="cq-mission"></span>
      </div>
      <div class="cq-progress" id="cq-progress" role="list" aria-label="Quest progress"></div>
      <div class="cq-topbar-right">
        <span class="cq-score-badge">Score <strong id="cq-score">0</strong></span>
        <button type="button" class="cq-chip-btn" id="cq-restart">Restart</button>
        <button type="button" class="cq-chip-btn cq-exit" id="cq-exit" aria-label="Exit Career Quest and return to the portfolio">Exit</button>
      </div>
    </div>
    <div class="cq-stage" id="cq-stage" tabindex="-1"></div>
  `;
}

export function mountCareerQuest(root: HTMLElement, onExit: () => void): () => void {
  const state = {
    levelIndex: 0,
    score: 0,
  };

  root.innerHTML = shellHtml();
  const stage = root.querySelector<HTMLElement>('#cq-stage')!;
  const progressEl = root.querySelector<HTMLElement>('#cq-progress')!;
  const scoreEl = root.querySelector<HTMLElement>('#cq-score')!;
  const missionEl = root.querySelector<HTMLElement>('#cq-mission')!;
  const restartBtn = root.querySelector<HTMLButtonElement>('#cq-restart')!;
  const exitBtn = root.querySelector<HTMLButtonElement>('#cq-exit')!;

  function addScore(n: number) {
    state.score += n;
    scoreEl.textContent = String(state.score);
    if (!reducedMotion) {
      gsap.fromTo(scoreEl, { scale: 1.4, color: 'var(--color-accent)' }, { scale: 1, duration: 0.4, ease: 'power2.out' });
    }
  }

  function renderChrome() {
    const dotIndex = state.levelIndex - 1; // levels[0] is the intro, not a counted stage
    const counted = levels.slice(1);
    progressEl.innerHTML = counted
      .map((l, i) => {
        const cls = i < dotIndex ? 'is-done' : i === dotIndex ? 'is-current' : '';
        return `<span class="cq-dot ${cls}" role="listitem" aria-label="${escapeHtml(l.title)}"></span>`;
      })
      .join('');
    missionEl.textContent =
      state.levelIndex === 0 ? '' : `Level ${dotIndex + 1} of ${counted.length} — ${levels[state.levelIndex].mission}`;
  }

  function transitionTo(render: () => void) {
    if (reducedMotion) {
      stage.innerHTML = '';
      render();
      stage.focus();
      return;
    }
    gsap.to(stage, {
      opacity: 0,
      y: 10,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: () => {
        stage.innerHTML = '';
        render();
        gsap.fromTo(stage, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
        stage.focus();
      },
    });
  }

  function goTo(index: number) {
    state.levelIndex = index;
    renderChrome();
    transitionTo(renderers[levels[index].key]);
  }

  function revealStagger(selector: string) {
    const items = stage.querySelectorAll<HTMLElement>(selector);
    if (reducedMotion) return;
    gsap.fromTo(
      items,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out' }
    );
  }

  function successPop(el: Element | null) {
    if (!el || reducedMotion) return;
    // Several callers pop a panel that contains (or *is*) the next
    // "Continue"-style button — the one thing standing between the player
    // and finishing the level. Any transform animation on that element,
    // however brief or non-overshooting, means its hit-testable position
    // is only exactly correct once the tween finishes; a click that lands
    // mid-tween can be swallowed by a still-settling ancestor. Rather than
    // chase timing windows, skip the animation entirely wherever a button
    // is involved — it appears instantly, fully stable, from frame one.
    // Everything else (badges, collected chips, the tech-detail panel)
    // still gets the fade-and-rise.
    if (el.matches('.cq-btn') || el.querySelector('.cq-btn')) return;
    gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out' });
  }

  // ---------- Level 0: Start ----------
  function renderStart() {
    stage.innerHTML = `
      <div class="cq-panel cq-start">
        <p class="cq-kicker mono-tag">Interactive developer journey</p>
        <h2 class="cq-title">Career Quest</h2>
        <p class="cq-lede">Seven short stops through Jasmere Paul Calagui's real education, projects, and experience. Nothing here is invented — every reveal comes straight from his resume.</p>
        <ul class="cq-outline">
          ${levels
            .slice(1, -1)
            .map((l) => `<li>${escapeHtml(l.title)}</li>`)
            .join('')}
        </ul>
        <button type="button" class="cq-btn cq-btn-primary" id="cq-begin">Begin Quest</button>
      </div>
    `;
    stage.querySelector('#cq-begin')?.addEventListener('click', () => goTo(1));
  }

  // ---------- Level 1: Education ----------
  function renderEducation() {
    const collected = new Set<number>();
    stage.innerHTML = `
      <div class="cq-panel">
        <p class="cq-eyebrow mono-tag">Level 1 · Education</p>
        <h2>Unlock the transcript</h2>
        <p class="cq-lede">Tap each credential to add it to the record.</p>
        <div class="cq-badge-grid" id="cq-cert-grid">
          ${certifications
            .map(
              (c, i) =>
                `<button type="button" class="cq-badge" data-cert="${i}" data-animate-item>${escapeHtml(c)}</button>`
            )
            .join('')}
        </div>
        <div class="cq-reveal" id="cq-edu-reveal" hidden>
          <span class="cq-cap" aria-hidden="true"></span>
          <h3>${escapeHtml(education.degree)}</h3>
          <p class="cq-accent mono-tag">${escapeHtml(education.status)}</p>
          <button type="button" class="cq-btn cq-btn-primary" id="cq-edu-continue">Continue</button>
        </div>
      </div>
    `;
    revealStagger('[data-animate-item]');

    const grid = stage.querySelector('#cq-cert-grid')!;
    const reveal = stage.querySelector<HTMLElement>('#cq-edu-reveal')!;

    grid.querySelectorAll<HTMLButtonElement>('.cq-badge').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.cert);
        if (collected.has(idx)) return;
        collected.add(idx);
        btn.classList.add('is-collected');
        btn.disabled = true;
        addScore(1);
        successPop(btn);
        if (collected.size === certifications.length) {
          reveal.hidden = false;
          successPop(reveal);
        }
      });
    });

    stage.querySelector('#cq-edu-continue')?.addEventListener('click', () => goTo(2));
  }

  // ---------- Level 2: Development ----------
  function renderDevelopment() {
    stage.innerHTML = `
      <div class="cq-panel">
        <p class="cq-eyebrow mono-tag">Level 2 · Development</p>
        <h2>Fix the bug</h2>
        <p class="cq-lede">${escapeHtml(bugChallenge.prompt)}</p>
        <pre class="cq-code" data-animate-item>${escapeHtml(bugChallenge.snippet)}</pre>
        <div class="cq-options" id="cq-dev-options">
          ${bugChallenge.options
            .map(
              (o, i) =>
                `<button type="button" class="cq-option" data-i="${i}" data-animate-item><code>${escapeHtml(o.code)}</code></button>`
            )
            .join('')}
        </div>
        <div class="cq-feedback" id="cq-dev-feedback" hidden></div>
        <div class="cq-reveal" id="cq-dev-reveal" hidden>
          <p>${escapeHtml(bugChallenge.groundedIn)}</p>
          <button type="button" class="cq-btn cq-btn-primary" id="cq-dev-continue">Continue</button>
        </div>
      </div>
    `;
    revealStagger('[data-animate-item]');

    const feedback = stage.querySelector<HTMLElement>('#cq-dev-feedback')!;
    const reveal = stage.querySelector<HTMLElement>('#cq-dev-reveal')!;
    let solved = false;

    stage.querySelectorAll<HTMLButtonElement>('.cq-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (solved) return;
        const opt = bugChallenge.options[Number(btn.dataset.i)];
        feedback.hidden = false;
        if (opt.correct) {
          solved = true;
          btn.classList.add('is-correct');
          feedback.textContent = 'Correct — that one-character fix changes an assignment into a comparison.';
          feedback.classList.add('is-good');
          addScore(2);
          reveal.hidden = false;
          successPop(reveal);
        } else {
          btn.classList.add('is-wrong');
          window.setTimeout(() => btn.classList.remove('is-wrong'), 500);
          feedback.textContent = 'Not quite — look closely at the comparison operator.';
          feedback.classList.remove('is-good');
        }
      });
    });

    stage.querySelector('#cq-dev-continue')?.addEventListener('click', () => goTo(3));
  }

  // ---------- Level 3: Experience ----------
  function renderExperience() {
    stage.innerHTML = `
      <div class="cq-panel">
        <p class="cq-eyebrow mono-tag">Level 3 · Experience</p>
        <h2>${escapeHtml(scenarioChallenge.prompt)}</h2>
        <div class="cq-choices" id="cq-exp-choices">
          ${scenarioChallenge.choices
            .map((c) => `<button type="button" class="cq-choice" data-id="${c.id}" data-animate-item>${escapeHtml(c.label)}</button>`)
            .join('')}
        </div>
        <div class="cq-feedback" id="cq-exp-feedback" hidden></div>
        <button type="button" class="cq-btn cq-btn-ghost" id="cq-exp-reveal-btn" hidden>Show the real experience</button>
        <div class="cq-reveal cq-exp-reveal" id="cq-exp-reveal" hidden>
          ${experience
            .map(
              (e) => `
            <div class="cq-exp-card" data-animate-item>
              <div class="cq-exp-head">
                <strong>${escapeHtml(e.role)}</strong>
                <span class="mono-tag">${escapeHtml(e.period)}</span>
              </div>
              <p class="cq-exp-org">${escapeHtml(e.organization)}</p>
              <p>${escapeHtml(e.summary)}</p>
            </div>`
            )
            .join('')}
          <button type="button" class="cq-btn cq-btn-primary" id="cq-exp-continue">Continue</button>
        </div>
      </div>
    `;
    revealStagger('[data-animate-item]');

    const feedback = stage.querySelector<HTMLElement>('#cq-exp-feedback')!;
    const revealBtn = stage.querySelector<HTMLButtonElement>('#cq-exp-reveal-btn')!;
    const reveal = stage.querySelector<HTMLElement>('#cq-exp-reveal')!;
    let answered = false;

    stage.querySelectorAll<HTMLButtonElement>('.cq-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const choice = scenarioChallenge.choices.find((c) => c.id === btn.dataset.id)!;
        btn.classList.add(choice.correct ? 'is-correct' : 'is-wrong');
        stage.querySelectorAll<HTMLButtonElement>('.cq-choice').forEach((b) => (b.disabled = true));
        feedback.hidden = false;
        feedback.textContent = choice.feedback;
        feedback.classList.toggle('is-good', choice.correct);
        addScore(choice.correct ? 2 : 1);
        revealBtn.hidden = false;
        successPop(revealBtn);
      });
    });

    revealBtn.addEventListener('click', () => {
      reveal.hidden = false;
      revealBtn.hidden = true;
      revealStagger('#cq-exp-reveal [data-animate-item]');
    });

    stage.querySelector('#cq-exp-continue')?.addEventListener('click', () => goTo(4));
  }

  // ---------- Level 4: AI / Technology ----------
  function renderAI() {
    const activated = new Set<number>();
    stage.innerHTML = `
      <div class="cq-panel cq-ai-panel">
        <p class="cq-eyebrow mono-tag">Level 4 · AI / Technology</p>
        <h2>Activate the AI core</h2>
        <p class="cq-lede">Tap each capability to bring the core online.</p>
        <div class="cq-ai-core" id="cq-ai-core" style="--charge:0"></div>
        <div class="cq-ai-grid" id="cq-ai-grid">
          ${aiSkillItems
            .map((s, i) => `<button type="button" class="cq-ai-node" data-i="${i}" data-animate-item>${escapeHtml(s)}</button>`)
            .join('')}
        </div>
        <div class="cq-reveal" id="cq-ai-reveal" hidden>
          <p>These are the same AI skills behind <strong>${escapeHtml(featuredProject.name)}</strong>, his AI-powered fake news detection system.</p>
          <button type="button" class="cq-btn cq-btn-primary" id="cq-ai-continue">Continue to the featured project</button>
        </div>
      </div>
    `;
    revealStagger('[data-animate-item]');

    const core = stage.querySelector<HTMLElement>('#cq-ai-core')!;
    const reveal = stage.querySelector<HTMLElement>('#cq-ai-reveal')!;

    stage.querySelectorAll<HTMLButtonElement>('.cq-ai-node').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.i);
        if (activated.has(idx)) return;
        activated.add(idx);
        btn.classList.add('is-active');
        btn.disabled = true;
        addScore(1);
        const charge = activated.size / aiSkillItems.length;
        core.style.setProperty('--charge', String(charge));
        if (!reducedMotion) gsap.fromTo(core, { scale: 1 }, { scale: 1.08, duration: 0.2, yoyo: true, repeat: 1 });
        if (activated.size === aiSkillItems.length) {
          reveal.hidden = false;
          successPop(reveal);
        }
      });
    });

    stage.querySelector('#cq-ai-continue')?.addEventListener('click', () => goTo(5));
  }

  // ---------- Level 5: Featured Project — VeriFact ----------
  function renderVeriFact() {
    stage.innerHTML = `
      <div class="cq-panel">
        <p class="cq-eyebrow mono-tag">Level 5 · Featured Project</p>
        <h2>${escapeHtml(featuredProject.name)}</h2>
        <p class="cq-claim-flag mono-tag" data-animate-item>CLAIM DETECTED</p>
        <blockquote class="cq-claim" data-animate-item>${escapeHtml(veriFactDemo.claim)}</blockquote>
        <div class="cq-options" id="cq-vf-options">
          ${veriFactDemo.options
            .map((o) => `<button type="button" class="cq-option" data-o="${o}" data-animate-item>${o}</button>`)
            .join('')}
        </div>
        <div class="cq-feedback" id="cq-vf-feedback" hidden></div>
        <div class="cq-pipeline" id="cq-vf-pipeline" hidden>
          ${veriFactDemo.pipeline
            .map(
              (p, i) => `
            <div class="cq-pipe-stage" style="--i:${i}">
              <span class="cq-pipe-dot" aria-hidden="true"></span>
              <strong>${escapeHtml(p.stage)}</strong>
              <p>${escapeHtml(p.detail)}</p>
            </div>`
            )
            .join('')}
        </div>
        <div class="cq-reveal" id="cq-vf-reveal" hidden>
          <p class="cq-disclaimer">This is a simplified interactive demonstration inspired by VeriFact — not the live system.</p>
          <p>${escapeHtml(featuredProject.description)}</p>
          <ul class="cq-feature-list">
            ${featuredProject.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
          </ul>
          <button type="button" class="cq-btn cq-btn-primary" id="cq-vf-continue">Continue</button>
        </div>
      </div>
    `;
    revealStagger('[data-animate-item]');

    const feedback = stage.querySelector<HTMLElement>('#cq-vf-feedback')!;
    const pipeline = stage.querySelector<HTMLElement>('#cq-vf-pipeline')!;
    const reveal = stage.querySelector<HTMLElement>('#cq-vf-reveal')!;
    let answered = false;

    stage.querySelectorAll<HTMLButtonElement>('#cq-vf-options .cq-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        btn.classList.add('is-selected');
        stage.querySelectorAll<HTMLButtonElement>('#cq-vf-options .cq-option').forEach((b) => (b.disabled = true));
        addScore(2);
        feedback.hidden = false;
        feedback.textContent =
          'Real verification needs evidence, not a guess — here’s the pipeline VeriFact actually runs a claim through:';
        pipeline.hidden = false;
        if (!reducedMotion) {
          gsap.fromTo(
            pipeline.querySelectorAll('.cq-pipe-stage'),
            { opacity: 0, x: -12 },
            { opacity: 1, x: 0, duration: 0.4, stagger: 0.18, ease: 'power3.out' }
          );
        }
        window.setTimeout(
          () => {
            reveal.hidden = false;
            successPop(reveal);
          },
          reducedMotion ? 0 : 5 * 180 + 200
        );
      });
    });

    stage.querySelector('#cq-vf-continue')?.addEventListener('click', () => goTo(6));
  }

  // ---------- Level 6: Tech Stack ----------
  function renderSkills() {
    const collected = new Set<number>();
    stage.innerHTML = `
      <div class="cq-panel">
        <p class="cq-eyebrow mono-tag">Level 6 · Tech Stack</p>
        <h2>Collect the stack</h2>
        <p class="cq-lede">Tap a technology to see exactly where it's been used.</p>
        <div class="cq-collect-grid" id="cq-collect-grid">
          ${collectibleTech
            .map((t, i) => `<button type="button" class="cq-collect-chip" data-i="${i}" data-animate-item>${escapeHtml(t.name)}</button>`)
            .join('')}
        </div>
        <div class="cq-tech-detail" id="cq-tech-detail">
          <p class="cq-hint">Select a technology above.</p>
        </div>
        <p class="cq-collect-progress">Collected <strong id="cq-collect-count">0</strong> / ${collectibleTech.length}</p>
        <button type="button" class="cq-btn cq-btn-primary" id="cq-skills-continue" hidden>Continue</button>
      </div>
    `;
    revealStagger('[data-animate-item]');

    const detailEl = stage.querySelector<HTMLElement>('#cq-tech-detail')!;
    const countEl = stage.querySelector<HTMLElement>('#cq-collect-count')!;
    const continueBtn = stage.querySelector<HTMLButtonElement>('#cq-skills-continue')!;

    stage.querySelectorAll<HTMLButtonElement>('.cq-collect-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.i);
        const tech = collectibleTech[idx];
        detailEl.innerHTML = `
          <p class="cq-eyebrow mono-tag">${escapeHtml(tech.category)}</p>
          <h3>${escapeHtml(tech.name)}</h3>
          <p>${escapeHtml(tech.usedFor)}</p>
          ${
            tech.links.length
              ? `<p class="cq-tech-links">Used in: ${tech.links.map((l) => escapeHtml(l.label)).join(', ')}</p>`
              : ''
          }
          <p class="cq-tech-note">${escapeHtml(tech.note)}</p>
        `;
        successPop(detailEl);

        if (!collected.has(idx)) {
          collected.add(idx);
          btn.classList.add('is-collected');
          addScore(1);
          countEl.textContent = String(collected.size);
          if (collected.size === collectibleTech.length) {
            continueBtn.hidden = false;
            successPop(continueBtn);
          }
        }
      });
    });

    continueBtn.addEventListener('click', () => goTo(7));
  }

  // ---------- Level 7: Mission Complete ----------
  function renderComplete() {
    stage.innerHTML = `
      <div class="cq-panel cq-complete">
        <p class="cq-eyebrow mono-tag">Mission Complete</p>
        <h2>You've explored Jasmere's journey</h2>
        <div class="cq-summary-grid" data-animate-item>
          <div><strong>${projects.length}</strong><span>Real projects</span></div>
          <div><strong>${totalTechCount}</strong><span>Technologies</span></div>
          <div><strong>${experience.length}</strong><span>Client engagements</span></div>
          <div><strong>1</strong><span>Degree in IT</span></div>
        </div>
        <p class="cq-score-line" data-animate-item>Final score: <strong>${state.score}</strong></p>
        <div class="cq-cta-row" data-animate-item>
          <a href="#projects" class="cq-btn cq-btn-primary" id="cq-cta-projects">View my projects</a>
          <a href="/jasmere-paul-calagui-resume.pdf" class="cq-btn cq-btn-ghost" download>View résumé</a>
          <a href="#contact" class="cq-btn cq-btn-ghost" id="cq-cta-contact">Contact me</a>
        </div>
      </div>
    `;
    revealStagger('[data-animate-item]');

    function closeThenGo(hash: string) {
      onExit();
      window.setTimeout(() => {
        (window as unknown as { __motion?: { scrollToHash: (h: string) => void } }).__motion?.scrollToHash(hash);
      }, 50);
    }

    stage.querySelector('#cq-cta-projects')?.addEventListener('click', (e) => {
      e.preventDefault();
      closeThenGo('#projects');
    });
    stage.querySelector('#cq-cta-contact')?.addEventListener('click', (e) => {
      e.preventDefault();
      closeThenGo('#contact');
    });
  }

  const renderers: Record<LevelKey, () => void> = {
    start: renderStart,
    education: renderEducation,
    development: renderDevelopment,
    experience: renderExperience,
    ai: renderAI,
    verifact: renderVeriFact,
    skills: renderSkills,
    complete: renderComplete,
  };

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onExit();
  }

  restartBtn.addEventListener('click', () => {
    state.score = 0;
    scoreEl.textContent = '0';
    goTo(0);
  });
  exitBtn.addEventListener('click', onExit);
  document.addEventListener('keydown', onKeydown);

  goTo(0);

  return function unmount() {
    document.removeEventListener('keydown', onKeydown);
    root.innerHTML = '';
  };
}
