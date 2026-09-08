---
name: portfolio-design
description: Use when designing, building, reviewing, or polishing any part of Jasmere Paul Calagui's portfolio site (jasmerecalagui.pages.dev) — new sections, visual or motion polish, accessibility/performance passes, copy changes, or a full build-QA-deploy cycle. Encodes the established design system, tech stack conventions, hard content constraints, and known bug classes for this specific codebase.
---

# Portfolio design & engineering skill

Work this codebase as four people at once, in this order of priority when they conflict:

1. **Technical recruiter** (the actual audience) — will this make a hiring manager scanning for 30 seconds understand what Jasmere can do and want to talk to him?
2. **Senior frontend engineer** — is the code correct, typed, accessible, performant, and maintainable?
3. **UI/UX designer** — is the hierarchy clear, the type scale disciplined, the spacing systematic?
4. **Motion designer** — does animation clarify state changes and add polish, or is it decoration that will jank on a low-end phone?

If a design idea would win a Dribbble like but confuse a recruiter skimming on their phone between interviews, the recruiter wins.

## Hard constraints — never violate these

- **Never invent resume facts.** Every claim about Jasmere's name, title, employers, dates, skills, projects, education, certifications, email, phone, or location must trace back to `src/data/resume.ts`. If a section needs a fact that isn't there, ask — do not fabricate a plausible-sounding one, and do not fill gaps with generic placeholder content presented as real.
- **No fabricated links.** The résumé has no GitHub or LinkedIn URL. Do not add social icons/links for accounts that don't exist. `contact` surfaces only email, phone, and location (see `src/data/terminalCommands.ts` header comment for why).
- **`src/data/resume.ts` is the single source of truth.** New data files (`techDetails.ts`, `caseStudies.ts`, `terminalCommands.ts`) reference it; they never duplicate or restate facts that could drift out of sync.
- **Don't add features nobody asked for.** This file is guidance for how to build what's requested well — not license to bolt on extra sections, badges, or animations beyond the brief.

## Tech stack snapshot (ground truth — verify before relying on it)

- **Astro 5** (static output), **Tailwind v4** via `@tailwindcss/vite`, design tokens as CSS custom properties in `src/styles/global.css` under `@theme`.
- **GSAP** (+`ScrollTrigger`) is the sitewide motion engine, wired through `MotionRoot.astro`. **Lenis** provides smooth scroll, ticked from the GSAP ticker. `window.__motion` exposes `{ reducedMotion, canHover, lenis, scrollToHash, refreshCursor }` — use it, don't reinvent scroll-to-anchor or hover-capability detection.
- Fonts: `--font-display` (Space Grotesk Variable, headings), `--font-body` (Manrope Variable, body), `--font-mono` (IBM Plex Mono, labels/data/terminal).
- Deployed as static `dist/` to **Cloudflare Pages** (`jasmerecalagui` project), with a Pages Function at `functions/api/chat.ts` backing the AI assistant. Shared assistant logic lives in `src/lib/assistant.ts` so the server function and client fallback never diverge.
- No test framework is wired up. QA is manual: `npx astro check`, `npx tsc --noEmit`, then a headless-Chrome pass with `playwright-core` (see Testing section) launched against the user's real installed Chrome — there is no downloaded Playwright browser in this environment.

Re-verify file names/paths with Glob/Grep before citing them in a plan — this list rots as the project grows.

## Design system

### Color
Every color is a token from `@theme` in `src/styles/global.css`. Never hardcode a hex value in a component — extend the token set instead if a genuinely new color is needed, and justify why the existing palette can't express it.

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#0f131b` | page background |
| `--color-surface` / `-raised` / `-hover` | `#151a24` / `#1a212e` / `#1f2734` | card surfaces, elevation steps |
| `--color-border` / `-strong` | translucent white 8%/16% | hairlines, never a flat gray |
| `--color-text` / `-muted` / `-faint` | `#edeef2` / `#9aa2b3` / `#838ba1` | text hierarchy by importance |
| `--color-accent` / `-dim` / `-soft` | warm amber `#e8a23d` | primary CTA, emphasis, highlights |
| `--color-signal` / `-soft` | teal `#5fd3c4` | secondary accent — prompts, success states, the second data series when two are needed |

This is a **dark, warm-amber-on-ink** system with a cool teal counter-accent — deliberately not the cream/terracotta or near-black/neon-green looks that read as generic AI output (see "Avoiding generic AI design" below). Keep new UI within this palette; don't introduce a third accent hue without a real reason.

### Typography
- Display font for headings only; body font for everything else; mono strictly for labels, data, code, and the terminal — never for prose.
- `.section-heading` is the standing pattern for section titles (`clamp(1.5rem, 1.2rem + 1.2vw, 1.875rem)`, 600 weight). Reuse it; don't invent a new heading scale per section.
- `.mono-tag` is the standing pattern for small mono labels (kickers, chrome titles, hints).
- Fluid sizing via `clamp()` tied to viewport width is the established pattern for hero/heading text — prefer it over fixed breakpoint jumps.
- Body copy: keep line length under ~70–80 characters (`max-width` in `rem` on paragraph elements, as in `.hero-tagline`), line-height ~1.6–1.7 for muted/faint text.
- No ALL-CAPS tracked-out eyebrow labels, no `WORD — fragment` em-dash headers, no middle-dot-joined meta strings as decoration — see the anti-pattern list below.

### Spacing
- `.section` standardizes vertical rhythm: `padding-block: 3.5rem` (`5rem` at `≥64rem`), with a hairline `border-top` between sections (first section excluded). Any new top-level section should use this class, not a bespoke padding value.
- Prefer `rem` over `px` throughout; it's the codebase convention and keeps spacing consistent under user font-size overrides.
- When a component's internal spacing needs a breakpoint bump, scope it to that component's own `<style>` block (Astro components are style-scoped by default) rather than adding global overrides.
- Watch specificity when a type selector (`.section`) and an element selector could both apply padding/margin to the same element — one silently wins. Check computed styles, don't assume cascade order.

### Layout & responsiveness
- Mobile-first: base styles are the small-screen layout; `@media (min-width: ...)` blocks layer on desktop enhancements (multi-column, hover states, parallax). Never build desktop-first and retrofit mobile.
- Breakpoints in use: `30rem` (small phone → larger phone/stats-grid), `48rem` (tablet, most `flex-direction: row` flips happen here), `64rem` (desktop, sidebar nav kicks in per `page-shell` in `index.astro`).
- Test real narrow viewports (e.g. `375–430px` widths), not just "resize the browser a bit." Layouts with side-by-side flex/grid at desktop almost always need an explicit mobile fallback, not an assumption that flex-wrap will save you.
- A flex/grid item with `overflow-y: auto` needs `min-height: 0` (or `min-width: 0` for row axis) — the `min-height: auto` default on flex items silently defeats clipping/scrolling. This bit the case-study runtime once; check for it whenever a scrollable panel lives inside a flex container.

## Visual hierarchy

- One clear focal point per section. Decide what a 3-second glance should land on (headline, a stat, a CTA) and make everything else visibly quieter — size, color, or weight, never all three cranked at once.
- Numbered/sequenced markers (01/02/03, timeline dots) are only honest when the content is actually a sequence (a process, a timeline). Don't add them to a project grid or skill list just for texture.
- Structural devices (borders, dividers, labels) should encode real information about the content, not decorate empty space.
- Accent color (`--color-accent`) marks the single most important interactive element per view — a primary CTA, an active nav item, the terminal prompt. If everything is amber, nothing is.

## Avoiding generic AI-generated design

Before shipping any new visual surface, check it against the tells that make a page read as templated rather than considered for this subject:

- Cream background + high-contrast serif + terracotta accent (notably `#D97757`) — not this project's palette; don't drift toward it.
- Near-black + single neon accent used indiscriminately — this project's ink+amber+teal system is closer but still needs restraint: don't let the accent bleed into every border and icon.
- The "SaaS-card kit": identical rounded cards, one border-radius on everything regardless of hierarchy, the same soft gray shadow under each. `.card` gives a decent default — vary elevation/emphasis deliberately (raised surface, stronger border, spotlight) rather than stamping the same card everywhere.
- Template chrome: tracked-out ALL-CAPS eyebrows above every heading, `Label — fragment` em-dash constructions, middle-dot-joined meta strings, a `→` glued onto every link/button, monospace used as a personality trait rather than for actual data/labels.
- Fade-and-slide-up-on-scroll applied uniformly to every section, plus a hover lift on every card — the default motion pattern for a generated page. This project already reserves choreographed entrances for specific moments (hero cinematic sequence, terminal welcome typewriter) rather than blanket-applying one reveal animation everywhere; keep it that way. `ScrollReveals.astro` exists for genuine scroll-triggered reveals — use it deliberately, not by default on every new block.
- Before finalizing a new section's look, ask: would this exact layout/copy/motion appear if I prompted "portfolio hero/project card/skills section" with no other context? If yes, revise until something about it is specific to Jasmere's actual work (real project names, real stack, a demo of an actual thing he built) rather than generic scaffolding.

## Hero section

- One characteristic opening — this project's hero leads with name, role, and a one-line tagline pulled straight from `profile` in `resume.ts`, plus live stat counts (`experience.length`, `projects.length`, total tech count, certifications) that count up on load. That's the established "big number, small label" hero pattern here — it's justified because the numbers are real and specific, not filler.
- Cinematic entrance sequence (word-mask reveal on the name, staggered fade-up on kicker/role/tagline/actions/stats) lives entirely in a GSAP timeline gated behind `!reducedMotion`, and **only ever hides elements that its own `gsap.set()` calls hide first** — if the script never runs, the section renders fully visible by construction. Keep new hero motion to this same invariant: never rely on CSS to pre-hide something JS is supposed to reveal.
- Cursor-reactive spotlight glow (`--spot-x`/`--spot-y` custom properties driven by `pointermove`, feeding a `radial-gradient` in `.hero-glow`) is the established "premium" desktop touch — cheap (one CSS var write per rAF-throttled frame), desktop/fine-pointer-only, and degrades to a static gradient with no JS.
- No portrait/photo in the hero as of the current build — if one is reintroduced, use `astro:assets`' `<Image>` with explicit `width`/`height`, `loading="eager"` + `fetchpriority="high"` only for the hero image specifically (it's the LCP element), and keep any parallax on a separate wrapper element from the idle-float animation so the two transforms don't fight on the same node.

## Interactive project cards & case studies

- `ProjectGlyph.astro` + `Projects.astro` + `src/data/caseStudies.ts` + `src/scripts/caseStudy.ts` is the established pattern: card grid → click opens a runtime-rendered case study.
- Heavy case-study runtime code is **dynamically imported** (`import()`), not bundled into the main chunk — verify after any change that `dist/index.html` has zero eager `<script>` references to the case-study chunk (grep the built HTML, don't assume).
- Static case-study HTML that can be known at build time is pre-rendered into `<template>` elements and cloned by JS at open time, rather than built as innerHTML strings at runtime — keeps it fast and avoids re-parsing markup on every open.
- `techDetails.ts` links each technology to the real project/experience anchor that used it — project cards and the skills section both draw on this so "what did he use React for" always resolves to a real, navigable answer instead of a bare tag.
- `.spotlight-card` (pointer-tracked radial highlight via `--mx`/`--my`) and `.connection-highlight` (a one-shot flash when a visitor jumps to a card from a cross-reference) are the two card-level interaction patterns already built — reuse them for new interactive surfaces instead of inventing a third hover treatment.

## Skills & experience presentation

- Skills are grouped by category (Frontend/Backend/Database/AI-ML/Tools/Other per `techDetails.ts`), not dumped as one flat tag cloud — recruiters scan by category faster than alphabetically.
- Each skill/tech should answer "used for what, where" via its `usedFor` + `links` fields — a skill listed with zero evidence of real use is weaker than one tied to a shipped project or role.
- Experience entries read chronologically, employer-first, with concrete scope (not just a job title) — pull directly from `experience` in `resume.ts`.
- `CareerQuest.astro` offers an optional interactive walk through education → projects → skills as a second, playful path through the same real facts — it must never be the only way to get this information; the static Experience/Projects/Education sections above it always tell the full story on their own.

## Employer-focused UX

Design every section as if a recruiter has 30–60 seconds and a phone, not a designer with a 27" monitor and unlimited patience:

- Lead with what Jasmere builds and for whom, not a mission statement.
- Make the résumé download and contact info reachable in under two actions from anywhere (command palette `Ctrl/Cmd+K`, footer, `contact`/`resume` terminal commands, sticky nav all currently serve this).
- Every interactive/playful feature (terminal, Career Quest, AI assistant) must be clearly optional and clearly signposted as such — see "Do not make X the primary navigation system" as a standing rule for any new interactive feature. Add an explicit intro label (as the terminal's "Explore my portfolio through the terminal") so visitors know it's a bonus, not a gate.
- Copy speaks in plain, specific terms about real work ("I build web, mobile, and AI-integrated systems end to end") over vague self-marketing ("passionate about technology and innovation").

## Interactive elements & mini-games

When adding a new interactive feature (in the spirit of Terminal / Career Quest):

- **It complements, never replaces** standard navigation and content — every fact it can show must already be visible in the normal scroll-through page.
- **Gate all animation behind `prefers-reduced-motion`**, with an instant, fully-functional fallback — not a degraded experience, the same information rendered without motion.
- **Defer off-screen work.** Use `IntersectionObserver` to delay any entrance animation/typewriter/timer until the feature is actually scrolled into view — don't burn animation frames or timers for something nobody has seen yet.
- **Never fake interactivity that could be real.** Prefer a real focusable `<button>` (as the terminal's autocomplete chips) over a decorative div with a click handler — it comes with keyboard access and screen-reader semantics for free, and don't hijack `Tab` for custom autocomplete — it breaks expected keyboard navigation.
- **Never build a second, invisible copy of an animated element** to fake a visual effect (e.g., a duplicate blinking-cursor div instead of styling the real input's native caret with `caret-color`/`caret-shape`). Duplicate-element tricks are exactly the bug class that produced overlapping/overshooting animation glitches earlier in this project (a floating decorative element, a success-animation overshoot) — style the real element instead.
- **Serialize async output.** Any feature that prints/animates output in response to repeated fast user input (commands, moves, messages) needs an explicit queue (`let queue = Promise.resolve(); queue = queue.then(() => step())`) so a second input can't interleave with the first's still-animating output. This exact bug (command outputs interleaving) was caught and fixed in the terminal — don't reintroduce the class elsewhere.
- **Code-split it.** Any feature with non-trivial runtime logic should be a dynamic `import()`, loaded on first interaction/visibility, not bundled eagerly into the page's main script.

## Animation & micro-interactions

- GSAP is the only animation engine in use — don't introduce a second one (no Framer Motion, no anime.js) for a single feature.
- Every animation must check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` (or read `window.__motion.reducedMotion`) and provide a real static fallback — the global CSS already forces near-zero animation/transition duration under reduced motion as a backstop, but JS-driven GSAP timelines must still gate themselves explicitly since GSAP doesn't obey that media query on its own.
- Desktop-only interaction flourishes (parallax, spotlight-follow, tilt) should additionally check `window.matchMedia('(hover: hover) and (pointer: fine)').matches` (`window.__motion.canHover`) — don't wire pointer-tracking listeners for touch devices that will never fire them usefully.
- Prefer `gsap.quickTo()` for anything driven by high-frequency pointer/scroll events over repeated `gsap.to()` calls — it's built for this and avoids tween pileup.
- Throttle pointer-driven style writes with `requestAnimationFrame` (see the hero spotlight's `raf` guard) — never write to the DOM/CSS-vars unthrottled inside a `pointermove` handler.
- Continuous/overshooting CSS animations (infinite loops, spring overshoot) on a clickable element aren't just a code smell — they measurably confuse click targeting for real users and fail automated click-stability checks. If an element is interactive, keep its idle animation subtle and non-overshooting, or pause it on hover/focus.
- One orchestrated moment beats scattered effects — a single hero entrance sequence, a single terminal welcome, a single case-study open transition. Resist adding a hover-lift + fade-in + icon-spin to every card "for consistency"; that consistency is itself the generic-AI tell.

## Accessibility

- Every new interactive control needs a real accessible name — visible text, `aria-label`, or a `<label>` (visually hidden via the established `.visually-hidden` utility pattern if it shouldn't be shown, not `display: none` which screen readers also skip).
- Live-updating regions (terminal output, assistant replies, any streamed content) use `role="log"` or `aria-live="polite"` as appropriate so screen-reader users hear new content without it stealing focus.
- Never trap or hijack standard keyboard behavior (`Tab`, `Enter`, `Space`, arrow keys) unless building an explicit widget pattern (e.g. a listbox) that's supposed to own them — and even then, follow the ARIA APG pattern for that widget, don't improvise.
- `:focus-visible` is styled globally (`outline: 2px solid var(--color-accent)`) — don't suppress it on custom components; extend it if a component's background makes the default outline hard to see.
- Respect `prefers-reduced-motion` everywhere (see Animation section) — this is an accessibility requirement, not just a performance nicety.
- Maintain WCAG AA contrast for all text/background pairings, especially `--color-text-faint` on `--color-surface`-family backgrounds — check the actual relative-luminance ratio when introducing a new faint/muted combination, don't eyeball it.
- Images need real `alt` text describing content/purpose (`${profile.name}, ${profile.title}` pattern for a portrait), or `alt=""` + `aria-hidden="true"` if purely decorative.

## Performance

- Keep the main entry bundle lean: heavy, only-sometimes-needed runtime code (Career Quest, case studies) is dynamically imported so it never loads for a visitor who doesn't trigger it. Check chunk names/sizes in the `npm run build` output after any change — a new feature's script should appear as its own reasonably small chunk (a few KB gzipped), not inflate `index.*.js`.
- Use `astro:assets`' `<Image>` for any real photo/artwork (automatic `sharp`-backed optimization, explicit dimensions to avoid layout shift); reserve `eager`/`fetchpriority="high"` for the actual LCP element only.
- Defer non-critical timers/animations until visibility via `IntersectionObserver` (established pattern — see Terminal's welcome message).
- Throttle high-frequency DOM/style writes (pointer/scroll handlers) with `requestAnimationFrame`; never do unthrottled work in `scroll`/`pointermove`.
- Lenis + GSAP ScrollTrigger are already integrated through one ticker in `MotionRoot.astro` — don't add a second scroll-listening library or a duplicate RAF loop alongside it.
- After any non-trivial change, run `npm run build` and actually read the chunk-size output before deploying — don't ship on faith that a change was "probably fine."

## SEO

- Every page needs accurate `<title>` and meta description reflecting real content (name, role, specialty) — check `BaseLayout.astro` / the page frontmatter when adding new pages or materially changing what the site is about.
- Use one `<h1>` per page (the hero name), then a logical `h2`/`h3` hierarchy per section — `.section-heading` on `h2` is the established pattern; don't skip levels for style reasons.
- Prefer real semantic elements (`<nav>`, `<main>`, `<section aria-labelledby="...">`, `<dl>` for stat pairs) over generic `<div>` soup — this also directly helps accessibility.
- Static output (Astro's default here) is already SEO-friendly by construction — don't introduce client-side-only rendering for content that should be crawlable.
- Any new external link should carry accurate anchor text (not "click here") and `rel="noopener"` if `target="_blank"` is used.

## Code quality & maintainability

- **Data/content lives in `src/data/*.ts`, never hardcoded in a component.** If you're typing a résumé fact directly into a `.astro` file, stop — import it from `resume.ts` (or a derived data file) instead.
- **Passing server data into a client `<script>` block**: use `<script type="application/json" id="..." is:inline set:html={JSON.stringify(...)} />` + `JSON.parse(document.getElementById(...).textContent)` in the consuming script. This is the proven, DOM-order-safe pattern in this codebase — **do not use `define:vars`**, which has been deliberately avoided here as less safe.
- Keep components single-responsibility: one `.astro` file = one section/feature, with its own scoped `<style>` and a co-located `<script>` for its own behavior. Shared logic (motion helpers, assistant knowledge) belongs in `src/lib/`, shared data in `src/data/`.
- Type everything client scripts touch (`as HTMLElement`, explicit function param/return types) — `npx astro check` and `npx tsc --noEmit` must both report zero errors before any change is considered done.
- No dead code, no commented-out blocks, no speculative "just in case" abstractions — three similar inline blocks beat a premature helper function used once.
- Comments explain *why*, never *what* — a workaround for a specific bug, a non-obvious invariant, a constraint from the resume data. Well-named code doesn't need a comment restating it.
- Don't add error handling for states that can't occur given this codebase's actual data flow (e.g. resume data is a static import, not user input — it can't be malformed at runtime).

## Testing before completing any change

Never call a visual or interactive change done without actually looking at it. The established workflow in this project:

1. `npx astro check` and `npx tsc --noEmit` — both must be clean (0 errors/warnings/hints).
2. Start the dev server (`npm run dev`, background) and drive the actual feature — don't just confirm the route loads.
3. Use `playwright-core` launched against the real installed Chrome (no downloaded Playwright browser in this environment): `chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })`. Write throwaway scripts to the scratchpad/project root and delete them once QA passes — they are not part of the deliverable.
4. For any new interactive feature, script through: the golden path, at least one edge case (empty input, unknown command, rapid repeated input), keyboard-only operation, a mobile viewport width (plain narrow `viewport`, not `isMobile`/`hasTouch` CDP emulation — that combination has a known internal timing race that intermittently reports a wrong `window.innerHeight`), and `reducedMotion: 'reduce'` context.
5. Screenshot and **actually view** key states (Read the resulting PNG) rather than trusting a script's console output alone — several bugs this project has hit (missing placeholder affordance, output interleaving) were only caught by looking at output, not by scripted assertions.
6. Check for console/page errors (`page.on('console', ...)`, `page.on('pageerror', ...)`) across every scenario above.
7. Run `npm run build` and confirm: zero build errors, and that chunk splitting still looks right (new heavy features appear as their own chunk; nothing unexpectedly inflates the main bundle).
8. Clean up every scratch QA script before considering the task finished.

## Deploying

- `npx wrangler pages deploy dist --project-name=jasmerecalagui --commit-dirty=true` ships `dist/`. This is a real, externally visible deploy — treat it as the "affects shared/production state" action it is: don't deploy mid-task on speculative changes, deploy once QA above has passed.
- If plain `npx wrangler ...` fails with an `EBUSY`/cache-lock error while npm resolves a new wrangler version, pin the last-known-working version explicitly (`npx --yes wrangler@<version> pages deploy ...`) rather than fighting the npx cache.
- After deploying, re-verify against the **live** URL (not just localhost) with the same playwright-core approach — confirm the specific thing that changed actually rendered/behaves correctly in production, and check for console errors there too.
- Stop any background dev server once verification is done.

## Known bug classes to keep checking for

Append to this list whenever a new one is discovered — it's the project's institutional memory.

- Fake duplicate elements standing in for a native affordance (custom cursor blink instead of `caret-color`) drift out of sync and double up visually — style the real element.
- Unserialized async UI output from rapid repeated input interleaves — needs an explicit promise queue.
- Flex items with `overflow-y: auto` don't actually scroll/clip without `min-height: 0`.
- Continuous/overshooting CSS animation on clickable elements breaks click-stability/targeting.
- Playwright's `isMobile`/`hasTouch` device emulation has a timing race on `window.innerHeight` — use plain narrow `viewport` for mobile-layout checks instead.
- CSS selector specificity clashes silently drop intended padding/margin when a type selector and an element selector both target the same node — verify computed styles, don't assume.
