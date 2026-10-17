# Test results

Runs: 2026-10-16 (full suite) and 2026-10-17 (typecheck, unit, build and integration re-run after adding the `/api/health` endpoint and deployment settings; no interface changes in between). Environment: Linux container, 2 vCPU, Node v22.22.0, Chromium 141 (headless), production build (`next build` + `next start`).

Real AI output, real Stripe payments and real email delivery are **not** covered: the environment has no credentials for them. Those paths were exercised against local mocks that speak the same HTTP APIs (see `scripts/mock-services.mjs`). See `LAUNCH-BLOCKERS.md`.

## Summary

| Check | Result |
|---|---|
| TypeScript (`npm run typecheck`) | Pass, no errors |
| Production build (`npm run build`) | Pass, 142 static pages generated |
| Unit tests (`npm test`) | 28 tests, all pass |
| Integration (`npm run test:integration`) | 108/108 HTTP checks pass |
| Browser journeys (`scripts/ui-smoke.mjs`) | 17/17 steps pass; No runtime errors |
| Responsive sweep | checked 696 page loads, 0 with problems |
| Accessibility (axe-core, WCAG 2.0/2.1 A and AA rules) | 70 page views audited, 0 violation groups |
| Clean install of the delivered archive | Unzipped into an empty folder: `npm ci`, typecheck, unit tests, build and all integration checks pass (2026-10-16) |
| Lab performance (Lighthouse) | See table below |

## Unit tests

- tests/strategy-flow.test.ts > strategy generation (preview mode) > generates every section, persists, versions, exports and is idempotent
- tests/strategy-flow.test.ts > strategy generation (preview mode) > enforces the strategy quota atomically and does not charge twice
- tests/strategy-flow.test.ts > strategy generation (preview mode) > protects edits: conflict detection, overwrite confirmation, restore
- tests/strategy-flow.test.ts > strategy generation (preview mode) > isolates tenants: another workspace cannot read or edit
- tests/web-import.test.ts > SSRF protections > classifies private and reserved addresses
- tests/web-import.test.ts > SSRF protections > rejects bad URLs
- tests/web-import.test.ts > SSRF protections > blocks hostnames that resolve to private IPs (including any one of several)
- tests/web-import.test.ts > fetching and extraction (local test server, private access allowed only in tests) > follows a redirect, re-validates it, and extracts text without scripts
- tests/web-import.test.ts > fetching and extraction (local test server, private access allowed only in tests) > blocks a redirect to a private address
- tests/web-import.test.ts > fetching and extraction (local test server, private access allowed only in tests) > stops redirect loops and non-HTML responses
- tests/web-import.test.ts > fetching and extraction (local test server, private access allowed only in tests) > enforces the size limit and the standard-port rule
- tests/calculators.test.ts > market size > computes TAM/SAM/SOM bottom-up
- tests/calculators.test.ts > market size > rejects zero, negative and out-of-range inputs
- tests/calculators.test.ts > market size > warns about ambitious share and missing source
- tests/calculators.test.ts > valuation > computes both multiple methods and the midpoint
- tests/calculators.test.ts > valuation > skips the earnings method for negative earnings
- tests/calculators.test.ts > valuation > capitalized earnings requires discount > growth
- tests/calculators.test.ts > valuation > rejects inverted ranges and negative multiples
- tests/calculators.test.ts > budget > percent of revenue with channel split and reserve
- tests/calculators.test.ts > budget > customer goal method
- tests/calculators.test.ts > budget > rejects allocations above 100% and unnamed channels
- tests/registry.test.ts > tool registry > has all 34 tools with unique slugs and valid relations
- tests/registry.test.ts > tool registry > every AI tool schema compiles, samples validly, and its example inputs validate
- tests/registry.test.ts > tool registry > rejects missing required fields and over-long input
- tests/content.test.ts > examples library > has unique paths and known categories
- tests/content.test.ts > examples library > tool examples match the live tool: same input labels and a valid output
- tests/content.test.ts > guides and solutions > guides have unique slugs, a direct answer and valid related links
- tests/content.test.ts > guides and solutions > solutions have unique slugs

## Integration checks

Boots the built app on a fresh database with mocks for the AI provider, Stripe and Resend, then exercises the product over HTTP with three separate accounts and anonymous visitors.

- PASS: GET / renders with one h1 and a canonical
- PASS: GET /features renders with one h1 and a canonical
- PASS: GET /features/advertising renders with one h1 and a canonical
- PASS: GET /marketing-strategy renders with one h1 and a canonical
- PASS: GET /free-tools renders with one h1 and a canonical
- PASS: GET /tools/slogan-generator renders with one h1 and a canonical
- PASS: GET /tools/market-size-calculator renders with one h1 and a canonical
- PASS: GET /examples renders with one h1 and a canonical
- PASS: GET /examples/strategy/window-and-solar-cleaning renders with one h1 and a canonical
- PASS: GET /solutions/agencies renders with one h1 and a canonical
- PASS: GET /pricing renders with one h1 and a canonical
- PASS: GET /faq renders with one h1 and a canonical
- PASS: GET /contact renders with one h1 and a canonical
- PASS: GET /about renders with one h1 and a canonical
- PASS: GET /resources renders with one h1 and a canonical
- PASS: GET /resources/tam-sam-som-explained renders with one h1 and a canonical
- PASS: GET /privacy renders with one h1 and a canonical
- PASS: GET /terms renders with one h1 and a canonical
- PASS: GET /login renders with one h1 and a canonical
- PASS: GET /signup renders with one h1 and a canonical
- PASS: Unknown route returns 404
- PASS: Preview deployment robots.txt disallows everything
- PASS: Sitemap lists tool pages and excludes private routes
- PASS: Workspace redirects anonymous visitors to login
- PASS: Sign up user A
- PASS: Sign up user B
- PASS: Duplicate email is rejected
- PASS: Weak password is rejected
- PASS: Wrong password is rejected with a generic message
- PASS: Cross-site POST is refused
- PASS: Strategy needs a complete brief
- PASS: Brief autosaves and is complete
- PASS: Invalid brief values are rejected
- PASS: Strategy generation starts (202) and duplicate clicks return the same job
- PASS: Live strategy job succeeds through the provider (with one repair round)
- PASS: All 11 sections are saved with live mode
- PASS: Provider receives key server-side, forced tool call, user input delimited
- PASS: Provider calls never include the API key in the prompt
- PASS: Free strategy quota is enforced server-side
- PASS: User B cannot read A’s strategy (API)
- PASS: User B cannot open A’s strategy page
- PASS: User B cannot export A’s strategy
- PASS: User B cannot edit A’s section
- PASS: User B cannot regenerate A’s section
- PASS: User B cannot see A’s job
- PASS: User B cannot create a share link for A’s strategy
- PASS: User B cannot delete A’s strategy
- PASS: User B search does not leak A’s strategy
- PASS: User B strategy list is empty
- PASS: Owner can edit a section
- PASS: Stale edits are rejected with a conflict
- PASS: Regenerating an edited section requires confirmation
- PASS: Section regeneration succeeds
- PASS: A version is saved before regeneration
- PASS: Restoring brings back the edited text
- PASS: Markdown export downloads
- PASS: Print view renders
- PASS: Experiments become action plan tasks
- PASS: Adding experiments twice does not duplicate tasks
- PASS: Tasks move between columns
- PASS: User B cannot change A’s task
- PASS: Assistant question starts a job (202)
- PASS: Assistant answer is stored in the strategy thread
- PASS: Assistant prompt delimits saved strategy and question as data
- PASS: Assistant jobs do not lock the strategy for editing
- PASS: User B cannot read A’s assistant thread
- PASS: User B cannot ask about A’s strategy
- PASS: A revision needs a specific section
- PASS: Suggested revision is drafted without changing the section
- PASS: User B cannot apply A’s suggested revision
- PASS: Applying a revision saves it as an owner edit
- PASS: A version is saved before a revision is applied
- PASS: A revision cannot be applied twice
- PASS: A revision based on an older version of the section is refused
- PASS: Share link is viewable without an account
- PASS: Shared page is noindex
- PASS: Shared page does not expose the brief
- PASS: Guessed share tokens show nothing
- PASS: Revoke share link
- PASS: Revoked link stops working
- PASS: Tool input validation returns field errors
- PASS: Anonymous daily quota is enforced server-side
- PASS: Anonymous tool run succeeds
- PASS: Other visitors cannot read an anonymous job
- PASS: Saving requires an account
- PASS: A run made before signing up can be saved after signing up
- PASS: Saved output is private to its workspace
- PASS: Calculator results are recomputed and saved server-side
- PASS: Invalid calculator inputs are refused
- PASS: Checkout session is created with the provider (test mode)
- PASS: Checkout uses server-side key and configured price
- PASS: Webhook with a bad signature is rejected
- PASS: Webhook with a stale timestamp is rejected
- PASS: Webhook is processed once and replays are ignored
- PASS: Paid entitlement raises limits only after the verified webhook
- PASS: Billing page labels a test-mode purchase honestly
- PASS: Full refund removes paid access
- PASS: Health check reports the database is reachable
- PASS: Tool views are recorded through a same-origin beacon
- PASS: Only whitelisted events are stored, with no user content
- PASS: Contact form stores and delivers the message
- PASS: Honeypot submissions are accepted silently but not delivered
- PASS: Password reset email is sent through the provider
- PASS: Reset request does not reveal whether an account exists
- PASS: Reset link sets a new password and signs in
- PASS: Reset link cannot be reused
- PASS: Old sessions are signed out after a reset
- PASS: Account deletion removes the user

## Browser journeys

Headless Chromium against a preview deployment (no AI key, so generation produces labeled preview output instantly).

- PASS  signup form creates account and lands on brief
- PASS  brief validation blocks empty required fields
- PASS  brief autosaves and moves through steps
- PASS  answers survive a reload (autosave + step restore)
- PASS  generating a strategy shows progress and finishes
- PASS  editing a section saves and marks it edited
- PASS  regenerating an edited section asks for confirmation
- PASS  share dialog creates a link
- PASS  assistant answers a question and applies a suggested revision
- PASS  experiments go to the action plan and move by keyboard
- PASS  command palette opens with ⌘K and finds the strategy
- PASS  in-app tool is pre-filled from the brief and saves output
- PASS  calculator updates live and shows formulas
- PASS  anonymous visitor can run a tool with an example
- PASS  save prompts sign-up and keeps the run
- PASS  mobile menu opens and closes
- PASS  keyboard: skip link and focus ring

## Responsive sweep

Every URL in the sitemap plus auth, policy, 404 and all workspace routes, loaded at 360, 390, 768, 1024, 1440 and 1920 px wide. A page fails if the document scrolls horizontally or any element extends past the viewport outside an intentionally scrollable container (for example wide tables, which scroll inside their own frame). On phone widths, buttons and form controls smaller than 24 px are also reported.

- checked 696 page loads.
- Problems found: none.

## Accessibility

axe-core with the `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` rule tags, on public pages, workspace pages and the assistant drawer, at 1440 and 390 px. Automated rules catch roughly a third to a half of accessibility issues; keyboard paths are also covered by the browser journeys (skip link, focus ring, ⌘K palette, dialogs, keyboard task moves). A manual screen-reader pass is still recommended before launch.

- No violations found.

## Lab performance

Lighthouse 12.8 against the local production server (no CDN, no compression proxy, same machine). Mobile uses Lighthouse’s default simulated throttling (slow 4G, 4× CPU slowdown); desktop uses its desktop preset. These are lab numbers on a shared 2-vCPU container, not field Core Web Vitals; INP needs real-user data, and TBT is shown as the lab proxy.

| Page and preset | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | FCP |
|---|---|---|---|---|---|---|---|---|
| home-mobile | 95 | 99 | 100 | 66 | 2.9 s | 0 | 60 ms | 1.1 s |
| home-desktop | 100 | 99 | 100 | 66 | 0.6 s | 0 | 0 ms | 0.3 s |
| tools_marketing-plan-generator-mobile | 98 | 100 | 100 | 66 | 2.3 s | 0 | 90 ms | 0.9 s |
| tools_marketing-plan-generator-desktop | 100 | 100 | 100 | 66 | 0.4 s | 0.048 | 0 ms | 0.3 s |
| pricing-mobile | 97 | 100 | 100 | 66 | 2.4 s | 0 | 80 ms | 0.9 s |
| pricing-desktop | 100 | 100 | 100 | 66 | 0.5 s | 0 | 20 ms | 0.3 s |
| examples_swot_bike-repair-and-ebike-rental-mobile | 96 | 100 | 100 | 66 | 2.7 s | 0 | 60 ms | 0.9 s |
| examples_swot_bike-repair-and-ebike-rental-desktop | 100 | 100 | 100 | 66 | 0.6 s | 0 | 0 ms | 0.2 s |

SEO scores on a local `preview` deployment are lowered on purpose: non-production deployments send `noindex` and a disallow-all `robots.txt`.

## How to reproduce

```bash
npm install
npm run typecheck && npm test
npm run build
npm run test:integration
# browser journeys (needs Chrome or Chromium)
VANTARO_ENV=preview npm start &
CHROME_PATH=/path/to/chrome BASE_URL=http://localhost:3000 node scripts/ui-smoke.mjs
```
