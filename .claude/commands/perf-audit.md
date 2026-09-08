---
description: Audit and improve site performance — bundle size, code splitting, images, and animation cost.
argument-hint: [optional: focus area, e.g. "images" or "bundle size"]
---

Invoke the `portfolio-design` skill first — this audit is scored against its Performance section.

Focus: $ARGUMENTS (if empty, cover all areas below).

1. **Baseline the build.** Run `npm run build` and record the full chunk list with sizes (raw + gzip) from the Vite output. Note the main `index.*.js` size specifically — that's what every visitor pays regardless of what they interact with.
2. **Check code splitting.** Confirm heavy, only-sometimes-needed features (Career Quest, case-study runtime, any other non-trivial interactive feature) are dynamically imported, not bundled eagerly. Grep the built `dist/index.html` for eager `<script>` references to their chunks — there should be none; they should only appear via runtime `import()`.
3. **Check images.** Confirm real photos/artwork go through `astro:assets`' `<Image>` (explicit `width`/`height` to avoid layout shift, `sharp`-backed optimization) rather than a raw `<img src="...">` pointed at an unoptimized file. Confirm `loading="eager"`/`fetchpriority="high"` is reserved for the actual LCP element only — everything else should lazy-load.
4. **Check animation cost.** Look for pointer/scroll handlers that write to the DOM or CSS custom properties without `requestAnimationFrame` throttling. Confirm GSAP timelines and any custom motion gate on `prefers-reduced-motion` (skipping the work entirely under reduced motion, not just skipping the visual transition). Confirm desktop-only effects (parallax, spotlight, tilt) check `(hover: hover) and (pointer: fine)` before attaching listeners, so touch devices never pay for listeners that will never fire.
5. **Check for duplicated engines/loops.** GSAP + Lenis are the only motion/scroll stack in this project, ticked through one shared loop in `MotionRoot.astro` — flag any new `requestAnimationFrame` loop, second scroll listener, or second animation library introduced elsewhere.
6. **Implement fixes** for what's found, prioritized by expected impact (main-bundle size and LCP first, then animation jank, then micro-optimizations).
7. **Re-run `npm run build`** and diff the chunk sizes against the baseline from step 1 — report the concrete before/after numbers, not just "it should be faster now."
8. Run `npx astro check` and `npx tsc --noEmit` to confirm nothing broke, and do a quick headless-Chrome smoke pass on any section you touched.
