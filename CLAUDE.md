# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses **pnpm** (`pnpm-lock.yaml`). `.npmrc` sets `shamefully-hoist=true`, which is required for dependencies to resolve correctly — keep it.

```bash
pnpm install          # install deps (postinstall runs `nuxt prepare`)
pnpm dev              # dev server → http://localhost:4000  (host 0.0.0.0, port 4000)
pnpm build            # production build
pnpm preview          # preview the production build
pnpm generate         # static / prerendered build
node scripts/generate-icons.mjs   # regenerate PWA icons in public/icons (zero-dep, Node built-ins only)
```

There is **no lint or test script defined**. `playwright` is installed as a devDependency but no test runner is wired up, so there is nothing to run for "tests" unless you add it.

## Architecture

This is a **Nuxt 3 SPA** (`ssr: false` in `nuxt.config.ts`) that hosts several **independent mini-apps**, one per file under `pages/`. There is no shared global app shell beyond layouts — each page is largely self-contained and owns its own state, styling, and persistence. When working on a feature, you are almost always working inside a single page (and, for budget, its component set).

The mini-apps:
- **`pages/gold.vue`** — "Gold Tracker", the flagship app and the PWA `start_url`. A single ~3,400-line component: live price from `api.gold-api.com` with a `goldapi.io` fallback, Khmer gold units (li/hun/chi/damlung vs gram/troy oz), a unit converter, a purchases portfolio with gain/loss, owner/user password-gated purchase vaults (SHA-256 hashed), and heavy CSS animation. Persists to `localStorage` under `gt4*` keys; also logs each fetched price to Firestore (`gold_prices` collection via `$goldDb`).
- **`pages/budget.vue`** — budget/expense tracker. Unlike the others, it is split across **Pinia stores** (`stores/budget.ts`, `stores/expenses.ts`, `stores/gamification.ts`) and **`components/budget/*`**, uses the `budget` layout, and persists to `localStorage` under `bp_*` keys.
- **`pages/index.vue`, `idol.vue`, `js.vue`, `Phone.vue`, `setup.vue`** — additional standalone experiments.

### Cross-cutting infrastructure

- **Firebase** (`plugins/firebase.client.ts`, client-only) initializes **two** Firebase apps and injects them via Nuxt's `provide`:
  - default app `ousanuxt` → `$firebase`, `$analytics`
  - `nuxt-gold` app → `$goldFirebase`, `$goldAnalytics`, and **`$goldDb`** (the Firestore handle the gold page writes to)
  - Note: `composables/useFirestoreSync.ts` reads `$db`, which is **not** provided by the current plugin — treat that composable as not wired up unless you add the provide.
- **Persistence pattern**: each mini-app saves to `localStorage` with a namespaced prefix and treats Firestore as optional remote sync/logging, always falling back to local on failure. Follow this pattern (namespaced key + graceful try/catch) when adding persistence.
- **Layouts** (`layouts/`): `default.vue` (light/serif theme with a Home nav + footer) and `budget.vue` (dark theme, sets CSS color tokens on `.budget-shell`). Pages opt into a non-default layout via `definePageMeta({ layout: '...' })` (only `budget.vue` does this; everything else uses `default`).
- **`components/BorderGlow/BorderGlow.vue`** — a reusable animated conic-gradient glow-border wrapper, auto-imported as `<BorderGlow>` and used extensively by `gold.vue` (cards pass color/glow/radius props). In `gold.vue` the prop sets are centralized into `goldGlow` / `pCardGlow(p)` objects and applied with `v-bind` — reuse those rather than re-inlining prop blocks.
- **Auto-imports**: Nuxt auto-imports `composables/`, `components/`, and (via `@pinia/nuxt`) Pinia stores; VueUse is available via `@vueuse/nuxt`. Use `~/` for the project root and `#app` for Nuxt internals.
- **Charts**: ApexCharts via `vue3-apexcharts`, registered client-only in `plugins/apexcharts.client.ts`.
- **Server routes** (`server/api/`): only minimal test endpoints (`ping`, `upload-test`, `download-test`) — there is no real backend; data comes from third-party APIs, `localStorage`, and Firestore directly from the client.

### Tooling notes

- **PWA** is configured in `nuxt.config.ts` via `@vite-pwa/nuxt` (autoUpdate, `start_url: /gold`, runtime caching for the gold APIs and Google Fonts). It is enabled in dev (`devOptions.enabled`). After changing icons, rerun `scripts/generate-icons.mjs`.
- **jsrepo** (`jsrepo.config.ts`) vendors components into `./components`; `skills-lock.json` pins the `frontend-design` skill from `anthropics/skills`.
- **Tailwind** is enabled (`@nuxtjs/tailwindcss`) but most pages are styled with large hand-written scoped `<style>` blocks and CSS custom properties rather than utility classes — match the existing style of whichever page you edit.
</content>
</invoke>
