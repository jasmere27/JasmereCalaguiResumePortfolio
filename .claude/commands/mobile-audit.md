---
description: Find and fix mobile/tablet layout and interaction issues across the site or a given section.
argument-hint: [optional: section name, e.g. "terminal" or "career quest"]
---

Invoke the `portfolio-design` skill first — this sweep specifically checks for the "Known bug classes" and Responsiveness guidance it documents.

Scope: $ARGUMENTS (if empty, sweep the whole page).

1. Start the dev server if needed. Use `playwright-core` against the real installed Chrome with **plain narrow `viewport` settings, not `isMobile`/`hasTouch` device emulation** (that combination has a known timing race on `window.innerHeight` in this environment). Cover at least: 375×667 (small phone), 390×844 (standard phone), 430×932 (large phone), 768×1024 and 834×1194 (tablet portrait/landscape).
2. At each width, in each in-scope section, check for:
   - Horizontal overflow / unwanted scrollbars (`document.documentElement.scrollWidth > window.innerWidth`).
   - Overlapping elements — especially fixed-position UI (nav, command palette trigger, AI assistant button) covering content or being covered by it.
   - Tap targets smaller than ~44×44px, or interactive elements spaced too tightly to tap accurately.
   - Text truncation/overflow, especially long résumé strings (job titles, project names) at narrow widths.
   - Any `flex`/`grid` item with `overflow-y: auto` that isn't actually scrolling — check for the missing `min-height: 0` trap.
   - Desktop-only hover-dependent interactions (spotlight-follow, tilt, parallax) that leave no equivalent way to access the same information on touch — every hover-revealed affordance needs a tap/focus equivalent.
   - Layout flips at the `30rem`/`48rem`/`64rem` breakpoints landing awkwardly in between (e.g. a two-column layout that flips a beat too early or late for real device widths).
3. Screenshot each finding and **view the image** before recording it as a real bug — don't rely on computed-style output alone for a visual layout call.
4. **Fix what's found**, following the skill's code conventions (scoped styles, `rem`-based spacing, mobile-first media queries layering desktop up rather than the reverse). Re-screenshot each fixed spot at the same width to confirm the fix actually resolved it and didn't regress anything above/below the fold.
5. Run `npx astro check` and `npx tsc --noEmit` after edits — both must be clean.
6. Report what was found and fixed, with before/after notes per issue. Clean up scratch scripts before finishing.
