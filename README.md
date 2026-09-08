# Jasmere Paul Calagui — Portfolio

Personal portfolio site for Jasmere Paul Calagui, a software developer building web, mobile, and AI-integrated applications end to end — from database schema to the interface someone actually uses.

**Live site:** [jasmerecalagui.pages.dev](https://jasmerecalagui.pages.dev)

## Tech stack

- [Astro](https://astro.build) — static site generation
- [Tailwind CSS v4](https://tailwindcss.com) — styling, via `@tailwindcss/vite`
- [GSAP](https://gsap.com) (+ ScrollTrigger) and [Lenis](https://lenis.darkroom.engineering) — motion and smooth scroll
- TypeScript throughout
- Deployed on [Cloudflare Pages](https://pages.cloudflare.com), with a Pages Function backing the AI assistant

## Local development

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

Type-check the project with:

```bash
npx astro check
npx tsc --noEmit
```

## Deployment

Pushes to `main` are built and deployed automatically to Cloudflare Pages via GitHub Actions — see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
