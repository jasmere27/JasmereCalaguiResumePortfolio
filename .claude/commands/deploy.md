---
description: Build, verify, and deploy the portfolio to Cloudflare Pages, then verify production.
argument-hint: [optional: note on what changed, for your own reference in the summary]
---

Invoke the `portfolio-design` skill first. Deploying is a real, externally visible action — treat it with the care that implies: don't deploy on unverified or half-finished changes, and say clearly when you're about to do it.

What changed: $ARGUMENTS

1. **Confirm QA has passed.** If it hasn't been run this session, run the equivalent of the `qa-check` command first: `npx astro check`, `npx tsc --noEmit`, `npm run build`, and a headless-Chrome smoke pass (console/page errors) on whatever changed. Do not proceed to deploy with known unresolved errors.
2. **Build.** `npm run build`. Confirm it completes with no errors and skim the chunk output for anything that looks obviously wrong (a chunk that shouldn't exist, one that's suddenly huge).
3. **Deploy.** `npx wrangler pages deploy dist --project-name=jasmerecalagui --commit-dirty=true`. If this fails with an `EBUSY`/cache-lock error while npm tries to resolve a new wrangler version, retry pinned to the last-known-working version: `npx --yes wrangler@4.129.0 pages deploy dist --project-name=jasmerecalagui --commit-dirty=true` (adjust the pinned version if a newer one is confirmed working).
4. **Verify production**, not just localhost. Using `playwright-core` against the real installed Chrome, load the live URL (`https://jasmerecalagui.pages.dev` or the preview URL wrangler prints) and re-check the specific thing that changed actually renders/behaves correctly there, plus confirm zero `console.error`/`pageerror` events.
5. **Clean up.** Delete any scratch verification scripts written to the project root during this pass. Stop any background dev server if it was only started for this task.
6. **Report** the deployment URL and a short summary of what was verified live — don't just say "deployed," confirm what was actually checked.
