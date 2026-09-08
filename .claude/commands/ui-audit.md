---
description: Audit visual design quality across the site or a given section — hierarchy, typography, spacing, color, and generic-AI-design tells.
argument-hint: [optional: section name or URL anchor, e.g. "hero" or "#projects"]
---

Invoke the `portfolio-design` skill first — this audit is scored against its Design System, Visual Hierarchy, Typography, Spacing, and "Avoiding generic AI-generated design" sections specifically.

Scope: $ARGUMENTS (if empty, audit the whole page, section by section, in document order).

1. Start the dev server if it isn't already running, then use `playwright-core` against the real installed Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) to screenshot the scope at three widths: mobile (~390px), tablet (~820px), and desktop (~1440px). Save to the scratchpad, not the repo.
2. **Actually view each screenshot** (Read the PNGs) before writing any findings — don't infer quality from source code alone.
3. Evaluate each screenshot against:
   - **Hierarchy**: is there one clear focal point? Is anything competing with it in size/color/weight that shouldn't be?
   - **Typography**: display font on headings only, mono only for labels/data, line lengths under ~80ch, consistent use of `.section-heading`/`.mono-tag` rather than ad-hoc sizing.
   - **Spacing**: consistent use of `.section` rhythm and `rem`-based spacing; no cramped or accidentally doubled gaps (check for selector-specificity clashes between type and class selectors).
   - **Color**: every color traceable to a token in `src/styles/global.css`'s `@theme` block; accent (`--color-accent`) used sparingly for the single most important element per view, not sprayed across borders/icons.
   - **Contrast**: any text/background pairing that looks low-contrast, especially `--color-text-faint` combinations — flag for a real relative-luminance check, don't eyeball-pass it.
   - **Generic-AI tells**: cream+terracotta or near-black+neon defaults, identical rounded cards with uniform shadow, ALL-CAPS tracked eyebrows, em-dash "Label — fragment" headers, middle-dot meta strings, `→` glued onto every link, blanket fade-up-on-scroll + hover-lift applied to everything.
4. Produce a findings list ordered by severity (worst hierarchy/legibility problems first), each with: what's wrong, why it matters to a recruiter skimming quickly, the specific file/component responsible, and a concrete fix — not just "improve spacing" but the actual value to change.
5. Don't apply fixes automatically. Present the findings and ask which to act on, unless the user's invocation already asked you to fix everything found.
6. Clean up scratch screenshot scripts when done.
