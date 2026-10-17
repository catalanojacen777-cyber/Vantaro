# Launch status and blockers

Last updated: 2026-10-16. Every item is in one of three states:

- **Implemented and tested**: built, and covered by automated checks (see `docs/TEST-RESULTS.md`).
- **Implemented, awaiting external setup**: code is complete and tested against local mocks; it needs your account, key, domain or legal input to work for real.
- **Not implemented**: not built in this version.

The product must not be called production-ready while any item marked **Blocker** is open.

## Blockers (must be resolved before launch)

| # | Item | Status | What is needed |
|---|---|---|---|
| B1 | AI generation (strategies, 31 tools, assistant, website import) | Implemented, awaiting external setup | Set `ANTHROPIC_API_KEY` (and optionally `AI_MODEL`). Verified only against a local mock provider; real output quality has **not** been reviewed. Run 10–20 real briefs and review before launch. Without a key, production disables generation rather than showing placeholder text. |
| B2 | Operator and legal facts | Implemented, awaiting external setup | `OPERATOR_LEGAL_NAME`, `OPERATOR_ADDRESS`, `OPERATOR_JURISDICTION`, `PRIVACY_EMAIL`, `POLICIES_EFFECTIVE_DATE`. Then have counsel complete the bracketed sections in `/privacy` and `/terms` (liability, governing law, legal bases, hosting provider, backup retention). Until then both pages show “Draft, not yet in force”, are `noindex`, and are excluded from the sitemap. |
| B3 | Price and refund terms | Implemented, awaiting external setup | `PRICE_AMOUNT`, `PRICE_CURRENCY`, `REFUND_DAYS`, `PAID_PLAN_NAME`. No price was taken from the reference site. Purchase stays disabled until set. |
| B4 | Payments (Stripe Checkout + webhooks) | Implemented, awaiting external setup | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, webhook endpoint `/api/billing/webhook` subscribed to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`. Tested with signed webhooks against a mock; run a full test-mode purchase on the real Stripe account before switching to live keys. |
| B5 | Transactional email | Implemented, awaiting external setup | `RESEND_API_KEY`, `EMAIL_FROM` on a verified domain, `SUPPORT_INBOX`. Without it, password reset emails cannot be delivered in production and contact messages are only stored in the database. |
| B6 | Hosting with a persistent disk | Implemented, awaiting external setup | Single Node process, persistent volume for `DATABASE_PATH`, HTTPS, `SITE_URL`, `APP_SECRET`, `TRUST_PROXY=true` behind a proxy, and a backup schedule for the SQLite file. |
| B7 | Domain and brand clearance | Not implemented | “Vantaro” is a working name. Domain, trademark and social handle availability have not been checked. |
| B8 | Support inbox access | Not implemented | There is no admin screen for contact messages. With email configured (B5) they are delivered to `SUPPORT_INBOX`; otherwise they are only in the `support_requests` table. |

## Implemented and tested

| Area | Notes |
|---|---|
| Accounts | Sign up, log in, log out, password reset (single-use, expiring, signs out other sessions), change password, delete account (password-confirmed). Rate limited. |
| Tenant isolation | All workspace data scoped by workspace and membership re-checked per request. Two-account HTTP checks cover reading, editing, regenerating, exporting, sharing, deleting, tasks, saved outputs, jobs and search. |
| Business brief | Five-step wizard, required/optional fields with reasons, autosave with save-on-leave, back navigation, step restore, review screen. |
| Strategy generation | Eleven sections, real job status, cancel, survives reloads, idempotent starts, partial-failure handling, no charge on failure, recovery after restart. |
| Editing and versions | Section editor driven by the schema, optimistic concurrency (409 on stale edits), regeneration with overwrite confirmation and automatic version, named versions, restore. |
| Export and sharing | Markdown download, print-to-PDF view with print styles, revocable expiring share links (hashed tokens, `noindex`, brief not exposed). |
| Personas, action plan | Persona library synced from strategies; board with To do / In progress / Done, due dates, channel filter, keyboard reordering and status changes, desktop drag and drop. |
| Contextual assistant | “Ask” drawer on every strategy: explains the whole strategy or one section, or drafts a revision of one section. Reads only that strategy and its brief, keeps a per-strategy thread, uses one generation per question, and never changes anything until the person applies a draft (a version is saved first; stale drafts are refused). Two-account checks included. |
| Tools | 31 AI tools with individual schemas, prompts and views; 3 deterministic calculators with unit tests; examples, validation, loading/error/success states, copy, Markdown download, save, regenerate, related tools. Brief-aware pre-fill in the workspace. |
| Quotas | Anonymous (cookie, plus IP when `TRUST_PROXY=true`), free and paid limits enforced atomically on the server; released on failure. |
| Saving anonymous work | A run made before signing up can be saved after signing up. |
| Website import | SSRF protections unit-tested (private ranges, mixed DNS answers, redirect to metadata IP, loops, size, content type, ports). |
| Public site | Homepage with interactive sections, features (10), solutions (7), strategy page, tool directory and 34 tool pages, examples (14 in 14 categories, each validated against its tool’s schema), guides (7), pricing, FAQ, contact, about, policies, 404. |
| SEO | Server-rendered pages, unique titles and descriptions, one H1, absolute canonicals from `SITE_URL`, sitemap of indexable pages only, robots rules per environment, `noindex` on private and shared pages, Organization/WebSite/SoftwareApplication/BreadcrumbList/Article/FAQPage JSON-LD (no ratings or reviews; Offer only with a configured price), Open Graph image, icons, manifest, optional `llms.txt`. |
| Security headers | CSP, frame denial, nosniff, referrer policy, permissions policy, HSTS in production, `no-store` on private pages and APIs. |
| Accessibility | axe-core (WCAG 2.1 A/AA rules): no violations on the audited public and workspace pages. Skip link, focus rings, labeled fields, keyboard menus, dialogs with focus trap, reduced motion. |
| Responsive | No horizontal page overflow on any public or workspace route at 360, 390, 768, 1024, 1440 and 1920 px (see TEST-RESULTS). |

## Implemented, worth reviewing before launch

| Item | Note |
|---|---|
| Output languages | Only English is enabled. Add others to `OUTPUT_LANGUAGES` after testing quality in each. |
| Limits | Defaults (anonymous 5/day; free 25/day and 1 strategy per 30 days; paid 150/day and 10 strategies) are placeholders for your cost model. |
| Analytics | First-party, content-free events are stored in `analytics_events`. There is no dashboard and no third-party analytics; add one only with a consent approach that fits your jurisdiction. |
| Performance | Lab checks only (see TEST-RESULTS). Field Core Web Vitals require real traffic. |
| Paid access duration | The paid entitlement does not expire. Do not advertise “lifetime” until you have decided that is the offer. |

## Not implemented

| Item | Note |
|---|---|
| Team invitations | Roles exist in the data model (owner, editor, viewer), but there is no invite flow. |
| Live competitor or keyword research | No search or market data integration. The Competitor Finder and Keyword Generator say so and never invent names, URLs or metrics. |
| Integrations that act on other accounts | Vantaro never publishes ads, sends emails or changes external accounts. |
| Touch drag and drop on the action plan | Touch users move tasks with the status menu and arrow buttons. |
| Admin console | No internal admin UI (users, messages, refunds). Use Stripe’s dashboard and the database directly. |
| Postgres / multi-process scaling | Single process with SQLite. See README for the migration path. |
