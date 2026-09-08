---
description: Design and build a new portfolio feature or section end-to-end, following the established design system.
argument-hint: [describe the feature or section to build]
---

Invoke the `portfolio-design` skill first and hold its constraints for the whole task, especially: never fabricate résumé facts, `src/data/resume.ts` is the single source of truth, new interactive features must complement (not replace) normal navigation, and every animation must gate on `prefers-reduced-motion`.

Feature to build: $ARGUMENTS

Work through it in this order:

1. **Ground it in real content.** Identify which facts this feature needs and confirm each one exists in `src/data/resume.ts` (or a data file derived from it — `techDetails.ts`, `caseStudies.ts`, `terminalCommands.ts`). If it needs a fact that isn't there, stop and ask rather than inventing one.
2. **Plan the shape before writing code.** Decide: new `.astro` component vs. extending an existing one; new data file vs. reusing one; whether this needs client JS at all, and if so whether it's light enough to inline or heavy enough to warrant a dynamic `import()` (see the Career Quest / case-study runtime pattern for the latter). Sketch the design in the skill's terms — token colors, `.section`/`.section-heading` conventions, one clear focal point.
3. **Check it against the anti-generic-design checklist** in the skill before committing to a look: would this exact layout/copy/motion appear from a no-context "portfolio section" prompt? If yes, find the specific detail (real project, real stack, real number) that makes it unmistakably this portfolio.
4. **Implement following the codebase's conventions**: data in `src/data/*.ts` only, `<script type="application/json" is:inline set:html={...}>` + `JSON.parse` for passing server data into client scripts (never `define:vars`), scoped `<style>` per component, GSAP for any motion (reuse `window.__motion` for scroll/hover/reduced-motion state instead of re-deriving it), a promise-chain queue if the feature prints/animates output in response to repeated fast input.
5. **Test it** per the skill's Testing section: `npx astro check` and `npx tsc --noEmit` clean, drive the feature in a running dev server, then a headless-Chrome pass (real Chrome via `playwright-core`) covering the golden path, an edge case, keyboard-only use, a mobile viewport width, and `reducedMotion: 'reduce'`. Screenshot and actually view key states before calling it done. Delete scratch QA scripts afterward.
6. **Report** what was built and where, and flag anything you deliberately left out or need a decision on. Don't deploy unless asked — building and deploying are separate steps.
