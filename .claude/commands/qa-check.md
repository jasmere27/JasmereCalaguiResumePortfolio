---
description: Run the full pre-ship QA gate and report problems found — type checks, build, headless-browser smoke test, and a known-bug-class sweep.
argument-hint: [optional: section or recent change to focus on]
---

Invoke the `portfolio-design` skill first — this gate mirrors its Testing section and "Known bug classes" list.

Focus: $ARGUMENTS (if empty, check the whole site).

Run every check below and collect problems as you go — don't fix anything yet unless it's trivial and directly blocks the next check; the goal here is a complete, honest problem list before deciding what to touch.

1. **Static checks.** `npx astro check` and `npx tsc --noEmit` — report every error, warning, and hint verbatim, not summarized away.
2. **Build.** `npm run build` — report any build errors, and flag any chunk that looks unexpectedly large or any heavy feature that isn't cleanly split (see the perf-audit command for the full method if this needs deeper investigation).
3. **Headless-browser smoke pass.** Using `playwright-core` against the real installed Chrome, load the site (or the focus area) and check for `console.error`/`pageerror` events across: normal desktop viewport, a narrow mobile `viewport` (not `isMobile`/`hasTouch` emulation), and a context with `reducedMotion: 'reduce'`. Exercise any interactive feature in scope (click through it, don't just load the page).
4. **Content-integrity sweep.** Grep components for hardcoded strings that look like résumé facts (names, dates, job titles, emails, phone numbers) that aren't pulled from `src/data/resume.ts` or a data file derived from it — flag any as a potential fact drift or fabrication risk.
5. **Design-system sweep.** Grep for hardcoded hex colors outside `src/styles/global.css`'s `@theme` block, and for `define:vars` usage in any `<script>` (should be zero — the JSON-script + `JSON.parse` pattern is the only sanctioned way to pass server data to client scripts here).
6. **Known bug-class sweep**, per the skill's list: flex/grid items with `overflow-y/x: auto` missing `min-height`/`min-width: 0`; continuous or overshooting CSS animation on any clickable element; duplicated decorative elements standing in for a native affordance; any async output/animation loop that could interleave under rapid repeated input without a serializing queue.
7. **Accessibility spot-check.** Confirm interactive elements have accessible names, live regions use `aria-live`/`role="log"` where appropriate, and `:focus-visible` isn't suppressed anywhere touched recently.
8. Report everything found as a single ranked list — most severe/most likely-to-be-user-visible first — each with the responsible file/line and a suggested fix. Ask before applying fixes unless told to fix everything found. Clean up any scratch scripts used for the browser pass.
