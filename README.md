# Vantaro

An AI marketing workspace for founders and small businesses: a marketing website, 34 free tools, and a signed-in workspace where a short business brief becomes an editable eleven-section marketing strategy and an action plan.

> Status: feature-complete build that runs end to end. It is **not production-ready** until the items in [docs/LAUNCH-BLOCKERS.md](docs/LAUNCH-BLOCKERS.md) are resolved (AI key, operator/legal facts, price, payment and email accounts, hosting).

## Quick start

Requirements: Node.js 22.18 or newer (22 LTS or 24 LTS recommended).

```bash
npm install
cp .env.example .env.local      # optional for local use
npm run dev                     # http://localhost:3000
```

On Windows (PowerShell), use `Copy-Item .env.example .env.local` instead of `cp`. The other commands are the same. No C++ build tools are needed: the project’s `.npmrc` turns off dependency install scripts because every native dependency ships prebuilt binaries.

To try real AI output locally, put your Anthropic API key in `.env.local` as `ANTHROPIC_API_KEY=...` and restart `npm run dev`.

With no `ANTHROPIC_API_KEY`, development and preview deployments run in **preview mode**: every generator works and saves, but outputs are labeled placeholder text in the correct structure. Add a key to get real output.

Production build:

```bash
npm run build
npm start                       # serves on PORT (default 3000)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (schema validation, calculators, quotas, jobs, isolation, SSRF guard, content checked against tool schemas) |
| `npm run test:integration` | Boots the built app on a fresh database with local mocks of the AI provider, Stripe and Resend, then runs 108 HTTP checks |
| `node scripts/ui-smoke.mjs` | Browser checks of the main journeys. Needs `CHROME_PATH` (and `BASE_URL`) |
| `npm run typecheck` | TypeScript |
| `npm run db:migrate` | Apply migrations without starting the app (the app also does this automatically) |

Latest results are in [docs/TEST-RESULTS.md](docs/TEST-RESULTS.md).

## Configuration

All business facts live in one place: `src/config/site.ts`, read from environment variables documented in [`.env.example`](.env.example). Unknown values stay empty and are shown as “not available yet” rather than invented:

- **Price, currency, refund days**: purchase is disabled until all billing values are set. A test Stripe key in production also keeps purchase disabled.
- **Operator legal name, address, jurisdiction, privacy email, effective date**: until set, `/privacy` and `/terms` show a “Draft, not yet in force” banner and are `noindex` and left out of the sitemap.
- **Limits**: daily generations, strategies per 30 days, personas and workspaces for anonymous, free and paid users.
- **Indexing**: only `VANTARO_ENV=production` allows indexing; every other deployment sends `noindex` and a disallow-all `robots.txt`.

Static marketing pages read configuration at build time, so rebuild after changing prices, limits or operator details.

## Architecture

- **Framework**: Next.js 16 (App Router, React 19, Turbopack), TypeScript. Marketing pages are statically generated; tool pages are static and load quota/sign-in state at runtime.
- **Database**: SQLite through `better-sqlite3` with versioned migrations (`src/lib/db/migrations`). Foreign keys, WAL mode, ownership on every table. Every workspace query is scoped by workspace id and membership is re-checked on each request.
- **Auth**: email and password (scrypt), opaque session tokens stored hashed, httpOnly SameSite=Lax cookies, password reset by single-use hashed token, rate limits on login, signup, reset, contact, checkout and imports. State-changing API requests must be same-origin.
- **AI**: `src/lib/ai`. A small schema language produces the model’s tool schema, validates and normalizes every response, and generates preview samples. Calls use a forced tool call, server-side key, timeouts, retries on 429/5xx, one repair round for invalid output, per-call token ceilings, and user input wrapped in `<user_input>` as data.
- **Jobs**: generation runs in-process with a concurrency limit and is persisted in `generation_jobs`. Clients poll job status, so progress survives reloads. Usage is reserved atomically before the call, finalized on success and released on failure or cancellation. Duplicate clicks reuse the same job through idempotency keys. Jobs interrupted by a restart are marked failed and refunded on boot.
- **Strategy**: eleven sections generated one at a time, each editable with optimistic concurrency, regenerable on its own (with confirmation and an automatic version when edits exist), versioned, exportable to Markdown and print-to-PDF, and shareable through revocable, expiring, hashed tokens.
- **Assistant**: an “Ask” drawer on each strategy answers questions about it or drafts a revision of one section (`src/lib/strategy/assistant.ts`). It reads only that strategy and its brief, runs as a normal job with usage reserved and refunded on failure, and applies a draft only when the person confirms, after saving a version.
- **Tools**: a registry of 31 AI tools and 3 deterministic calculators, each with its own fields, schema, prompt and view. Calculators run in the browser and are recomputed on the server when saved.
- **Billing**: Stripe Checkout via REST. Entitlements change only from signature-verified, idempotent webhooks (`checkout.session.completed`, `checkout.session.async_payment_succeeded/failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created/closed`). Test-mode purchases are labeled as such.
- **Website import**: optional “Draft from my website” reads only a public page: public-IP-only DNS for every hop, connection pinned to the validated IP, standard ports, 3 redirects, 8 s timeout, 1.5 MB limit, HTML only. Nothing is applied until the person reviews it.
- **Analytics**: first-party events with whitelisted, content-free properties (`analytics_events`), flagged as test data outside production.

### Single-process requirement

Generation jobs run inside the Node process and the database is a local file, so run **one Node process on a host with a persistent disk** (for example Railway, Render or Fly.io with a volume, or a VPS). Serverless platforms will cut long jobs short and lose the database. To scale beyond one process, move jobs to a queue and the database to Postgres; the data layer is isolated in `src/lib/**/repo.ts`, `src/lib/jobs.ts` and `src/lib/usage.ts`.

## Deploying on Railway

Railway runs Vantaro as one always-on Node service with a volume for the SQLite database. Railway's default builder detects Next.js, installs with npm, runs `npm run build` and starts with `npm start`.

1. New project → Deploy from GitHub repo → choose this repository.
2. Service → Settings → Volumes: add a volume mounted at `/data`.
3. Service → Variables:

   | Variable | Value |
   |---|---|
   | `RAILPACK_NODE_VERSION` | `22` |
   | `VANTARO_ENV` | `preview` until launch, then `production` |
   | `SITE_URL` | the service's public URL, e.g. `https://vantaro-production.up.railway.app` |
   | `APP_SECRET` | a long random string (keep it stable; changing it invalidates hashed IPs) |
   | `DATABASE_PATH` | `/data/vantaro.db` |
   | `TRUST_PROXY` | `true` |
   | `ANTHROPIC_API_KEY` | your key (optional in preview; required for real output) |

4. Service → Settings → Networking: generate a domain (or add your own), then make sure `SITE_URL` matches it.
5. Service → Settings → Deploy: health check path `/api/health`. Keep one replica: jobs run inside the process.
6. Redeploy after changing variables. Static pages read configuration at build time.

With `VANTARO_ENV=preview` the site is fully usable but asks search engines not to index it, which is the right setting while you review it. Switch to `production` only after the launch blockers are resolved.

## Going live (summary)

1. Set `VANTARO_ENV=production`, `SITE_URL`, `APP_SECRET`, `TRUST_PROXY` (if behind a proxy) and a persistent `DATABASE_PATH`.
2. Add `ANTHROPIC_API_KEY`; review output quality on real briefs before launch.
3. Set the operator facts and have counsel complete the bracketed sections of `/privacy` and `/terms`.
4. Create the Stripe product price, set billing variables, and add a webhook endpoint at `https://YOUR_DOMAIN/api/billing/webhook` for the events listed above. Test the full flow in test mode first.
5. Configure Resend (`RESEND_API_KEY`, `EMAIL_FROM` on a verified domain, `SUPPORT_INBOX`).
6. Rebuild, run `npm test` and `npm run test:integration`, then submit `https://YOUR_DOMAIN/sitemap.xml` in Search Console.

The complete list, with status for each item, is in [docs/LAUNCH-BLOCKERS.md](docs/LAUNCH-BLOCKERS.md). Reference coverage is tracked in [docs/PARITY-CHECKLIST.md](docs/PARITY-CHECKLIST.md).

## Project structure

```
src/
  app/(site)/        public pages (home, features, tools, examples, solutions, pricing, resources, policies)
  app/(auth)/        login, signup, reset password
  app/app/           signed-in workspace
  app/share/         read-only shared reports
  app/api/           route handlers (auth, brief, strategies, jobs, tools, outputs, tasks, billing, contact)
  components/        ui primitives, marketing, app and tool components
  config/site.ts     central configuration
  content/           original page content, examples, guides, sample strategy
  lib/               db, auth, ai, jobs, usage, strategy, tools, billing, security, seo
  styles/            site, app and auth styles (tokens live in app/globals.css)
scripts/             integration test, mocks, UI smoke test, migrate
tests/               unit tests
docs/                launch blockers, parity checklist, test results
```

## Brand

The V mark (`src/components/ui/brand.tsx`, `public/brand/`) works in flat monochrome; the chrome gradient is decorative. Brand files: `v-mark.svg` and `v-mark-mono.svg` (mark), `loading-mark.svg` (animated chrome sweep that stops under reduced motion), `src/app/icon.svg` (favicon), `src/app/apple-icon.tsx` (app icon), `src/app/opengraph-image.tsx` (social preview). Typeface: Mona Sans (SIL Open Font License, see `src/app/fonts/OFL.txt`), using its width axis for display type.
