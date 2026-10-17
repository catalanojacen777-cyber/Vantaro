#!/usr/bin/env node
// End-to-end checks against a real production server (`next build` first).
// Starts local mocks for the AI provider, Stripe and Resend, boots the app on
// a fresh database with those mocks configured, and exercises the main flows
// over HTTP: auth, brief, live strategy generation, tenant isolation, sharing,
// quotas, tools, saving, tasks, billing webhooks, contact, and public routes.
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { startMocks } from './mock-services.mjs';

const PORT = Number(process.env.IT_PORT ?? 3200);
const BASE = `http://127.0.0.1:${PORT}`;
const DB = path.resolve('data/integration.db');
const WEBHOOK_SECRET = 'whsec_integration_test';
const results = [];
let failures = 0;

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  (${detail})` : ''}`);
}

class Client {
  constructor() {
    this.cookies = new Map();
  }
  cookieHeader() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  async req(method, p, body, extraHeaders = {}) {
    const headers = { origin: BASE, ...extraHeaders };
    if (this.cookies.size) headers.cookie = this.cookieHeader();
    if (body !== undefined) headers['content-type'] = 'application/json';
    const res = await fetch(`${BASE}${p}`, { method, headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), redirect: 'manual' });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';');
      const [k, ...v] = pair.split('=');
      const val = v.join('=');
      if (/expires=Thu, 01 Jan 1970/i.test(c) || val === '') this.cookies.delete(k);
      else this.cookies.set(k, val);
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, json, text, headers: res.headers };
  }
  get(p) {
    return this.req('GET', p);
  }
  post(p, b = {}) {
    return this.req('POST', p, b);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitJob(client, id, timeoutMs = 30000) {
  const start = Date.now();
  for (;;) {
    const r = await client.get(`/api/jobs/${id}`);
    const s = r.json?.job?.status;
    if (s && !['queued', 'running'].includes(s)) return r.json.job;
    if (Date.now() - start > timeoutMs) throw new Error(`job ${id} timed out`);
    await sleep(250);
  }
}

function signStripe(payload, secret = WEBHOOK_SECRET, t = Math.floor(Date.now() / 1000)) {
  const sig = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  return `t=${t},v1=${sig}`;
}

async function main() {
  for (const f of [DB, `${DB}-wal`, `${DB}-shm`]) fs.rmSync(f, { force: true });
  const mocks = startMocks();
  const env = {
    ...process.env,
    PORT: String(PORT),
    DATABASE_PATH: DB,
    SITE_URL: BASE,
    VANTARO_ENV: 'preview',
    APP_SECRET: 'integration-secret',
    ANTHROPIC_API_KEY: 'test-key',
    ANTHROPIC_BASE_URL: 'http://127.0.0.1:4243',
    STRIPE_SECRET_KEY: 'sk_test_integration',
    STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
    STRIPE_API_BASE: 'http://127.0.0.1:4242',
    PRICE_AMOUNT: '4900',
    PRICE_CURRENCY: 'usd',
    REFUND_DAYS: '7',
    RESEND_API_KEY: 're_test',
    RESEND_API_BASE: 'http://127.0.0.1:4244',
    EMAIL_FROM: 'Vantaro <hello@example.com>',
    SUPPORT_INBOX: 'support@example.com',
    LIMIT_ANON_GENERATIONS_PER_DAY: '3',
    JOB_CONCURRENCY: '4',
  };
  delete env.HTTPS_PROXY;
  delete env.HTTP_PROXY;
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverLog = '';
  server.stdout.on('data', (d) => (serverLog += d));
  server.stderr.on('data', (d) => (serverLog += d));
  try {
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(`${BASE}/api/me`)).ok) break;
      } catch {}
      await sleep(250);
    }

    // ---- Public routes -------------------------------------------------
    const anon = new Client();
    const publicPaths = ['/', '/features', '/features/advertising', '/marketing-strategy', '/free-tools', '/tools/slogan-generator', '/tools/market-size-calculator', '/examples', '/examples/strategy/window-and-solar-cleaning', '/solutions/agencies', '/pricing', '/faq', '/contact', '/about', '/resources', '/resources/tam-sam-som-explained', '/privacy', '/terms', '/login', '/signup'];
    for (const p of publicPaths) {
      const r = await anon.get(p);
      const h1 = (r.text.match(/<h1[\s>]/g) ?? []).length;
      const canonical = /<link rel="canonical" href="http:\/\/127\.0\.0\.1:3200/.test(r.text) || /<link rel="canonical"/.test(r.text);
      check(`GET ${p} renders with one h1 and a canonical`, r.status === 200 && h1 === 1 && canonical, `status=${r.status} h1=${h1} canonical=${canonical}`);
    }
    const nf = await anon.get('/definitely-not-a-page');
    check('Unknown route returns 404', nf.status === 404);
    const robots = await anon.get('/robots.txt');
    check('Preview deployment robots.txt disallows everything', robots.text.includes('Disallow: /'));
    const sitemap = await anon.get('/sitemap.xml');
    check('Sitemap lists tool pages and excludes private routes', sitemap.text.includes('/tools/ad-generator') && !sitemap.text.includes('/app') && !sitemap.text.includes('/share/'));
    const appRedirect = await anon.get('/app');
    check('Workspace redirects anonymous visitors to login', [302, 307].includes(appRedirect.status) || appRedirect.text.includes('/login'), `status=${appRedirect.status}`);

    // ---- Auth ----------------------------------------------------------
    const a = new Client();
    const b = new Client();
    check('Sign up user A', (await a.post('/api/auth/signup', { email: 'a@example.com', password: 'correct horse battery', name: 'Avery' })).status === 200);
    check('Sign up user B', (await b.post('/api/auth/signup', { email: 'b@example.com', password: 'another good passphrase' })).status === 200);
    check('Duplicate email is rejected', (await new Client().post('/api/auth/signup', { email: 'A@example.com', password: 'correct horse battery' })).status === 409);
    check('Weak password is rejected', (await new Client().post('/api/auth/signup', { email: 'c@example.com', password: 'short' })).status === 422);
    const badLogin = await new Client().post('/api/auth/login', { email: 'a@example.com', password: 'wrong password!!' });
    check('Wrong password is rejected with a generic message', badLogin.status === 401 && /do not match/.test(badLogin.json?.error?.message ?? ''));
    const crossSite = await a.req('POST', '/api/strategies', { idempotencyKey: 'xsite-12345' }, { origin: 'https://evil.example' });
    check('Cross-site POST is refused', crossSite.status === 403);

    // ---- Brief and live strategy generation (mock AI) -----------------
    const incomplete = await a.post('/api/strategies', { idempotencyKey: 'early-123456' });
    check('Strategy needs a complete brief', incomplete.status === 422);
    const brief = {
      businessName: 'Integration Bakery',
      productDescription: 'Sourdough bread and pastries sold at a neighborhood counter and to three local cafés, open Wednesday to Sunday.',
      customerType: 'Both',
      stage: 'Early customers',
      objective: 'Grow repeat purchases or retention',
    };
    const saved = await a.req('PUT', '/api/brief', { data: brief, step: 4 });
    check('Brief autosaves and is complete', saved.status === 200 && saved.json.profile.status === 'complete');
    const badBrief = await a.req('PUT', '/api/brief', { data: { stage: 'Not a stage' }, step: 1 });
    check('Invalid brief values are rejected', badBrief.status === 422);

    const start = await a.post('/api/strategies', { idempotencyKey: 'strategy-0001' });
    const again = await a.post('/api/strategies', { idempotencyKey: 'strategy-0001' });
    check('Strategy generation starts (202) and duplicate clicks return the same job', start.status === 202 && again.json?.jobId === start.json?.jobId);
    const job = await waitJob(a, start.json.jobId);
    check('Live strategy job succeeds through the provider (with one repair round)', job.status === 'succeeded' && job.mode === 'live', JSON.stringify(job.error));
    const st = await a.get(`/api/strategies/${start.json.strategyId}`);
    const ready = st.json?.strategy?.sections?.filter((s) => s.status === 'ready').length;
    check('All 11 sections are saved with live mode', ready === 11 && st.json.strategy.sections.every((s) => s.mode === 'live'), `ready=${ready}`);
    const aiReq = mocks.calls.ai[0];
    check('Provider receives key server-side, forced tool call, user input delimited', aiReq?.headers['x-api-key'] === 'test-key' && aiReq.body.tool_choice?.type === 'tool' && aiReq.body.messages[0].content.includes('<user_input>'));
    check('Provider calls never include the API key in the prompt', !JSON.stringify(mocks.calls.ai.map((c) => c.body)).includes('test-key'));
    const quotaOut = await a.post('/api/strategies', { idempotencyKey: 'strategy-0002' });
    check('Free strategy quota is enforced server-side', quotaOut.status === 429);

    // ---- Tenant isolation ---------------------------------------------
    const sid = start.json.strategyId;
    check('User B cannot read A’s strategy (API)', (await b.get(`/api/strategies/${sid}`)).status === 404);
    check('User B cannot open A’s strategy page', (await b.get(`/app/strategies/${sid}`)).status === 404);
    check('User B cannot export A’s strategy', (await b.get(`/api/strategies/${sid}/export`)).status === 404);
    check('User B cannot edit A’s section', (await b.req('PUT', `/api/strategies/${sid}/sections/context`, { content: {}, revision: 1 })).status === 404);
    check('User B cannot regenerate A’s section', (await b.post(`/api/strategies/${sid}/sections/context/regenerate`, { idempotencyKey: 'b-regen-123', confirmOverwrite: true })).status === 404);
    check('User B cannot see A’s job', (await b.get(`/api/jobs/${start.json.jobId}`)).status === 404);
    check('User B cannot create a share link for A’s strategy', (await b.post(`/api/strategies/${sid}/share`, { expiresInDays: 7 })).status === 404);
    check('User B cannot delete A’s strategy', (await b.req('DELETE', `/api/strategies/${sid}`)).status === 404);
    check('User B search does not leak A’s strategy', !(await b.get('/api/search?q=Integration')).text.includes('Integration Bakery'));
    const bList = await b.get('/api/strategies');
    check('User B strategy list is empty', bList.json?.strategies?.length === 0);

    // ---- Edit, regenerate, versions -----------------------------------
    const ctx = st.json.strategy.sections.find((s) => s.key === 'context');
    const edited = await a.req('PUT', `/api/strategies/${sid}/sections/context`, { content: { ...ctx.content, summary: 'Edited by the owner.' }, revision: ctx.revision });
    check('Owner can edit a section', edited.status === 200 && edited.json.section.edited === true);
    const stale = await a.req('PUT', `/api/strategies/${sid}/sections/context`, { content: ctx.content, revision: ctx.revision });
    check('Stale edits are rejected with a conflict', stale.status === 409);
    const noConfirm = await a.post(`/api/strategies/${sid}/sections/context/regenerate`, { idempotencyKey: 'regen-000001', confirmOverwrite: false });
    check('Regenerating an edited section requires confirmation', noConfirm.status === 409 && noConfirm.json.error.code === 'has_edits');
    const regen = await a.post(`/api/strategies/${sid}/sections/context/regenerate`, { idempotencyKey: 'regen-000002', confirmOverwrite: true });
    const regenJob = await waitJob(a, regen.json.jobId);
    check('Section regeneration succeeds', regenJob.status === 'succeeded');
    const versions = await a.get(`/api/strategies/${sid}/versions`);
    const before = versions.json.versions.find((v) => v.label.startsWith('Before regenerating'));
    check('A version is saved before regeneration', !!before);
    const restored = await a.post(`/api/strategies/${sid}/versions/${before.id}/restore`, {});
    check('Restoring brings back the edited text', restored.json?.strategy?.sections.find((s) => s.key === 'context').content.summary === 'Edited by the owner.');
    const md = await a.get(`/api/strategies/${sid}/export`);
    check('Markdown export downloads', md.status === 200 && md.headers.get('content-disposition')?.includes('.md') && md.text.includes('# Integration Bakery marketing strategy'));
    const print = await a.get(`/app/strategies/${sid}/print`);
    check('Print view renders', print.status === 200 && print.text.includes('Print or save as PDF'));
    const tasks = await a.post(`/api/strategies/${sid}/tasks`, {});
    check('Experiments become action plan tasks', tasks.status === 200 && tasks.json.added > 0);
    const tasksAgain = await a.post(`/api/strategies/${sid}/tasks`, {});
    check('Adding experiments twice does not duplicate tasks', tasksAgain.json.added === 0);
    const taskList = await a.get('/api/tasks');
    const t0 = taskList.json.tasks[0];
    const moved = await a.req('PATCH', `/api/tasks/${t0.id}`, { status: 'done' });
    check('Tasks move between columns', moved.json.tasks.find((t) => t.id === t0.id).status === 'done');
    check('User B cannot change A’s task', (await b.req('PATCH', `/api/tasks/${t0.id}`, { status: 'todo' })).status === 404);

    // ---- Contextual assistant -----------------------------------------
    const ask = await a.post(`/api/strategies/${sid}/assistant`, { question: 'Why start with this audience first?', sectionKey: null, intent: 'explain', idempotencyKey: 'assist-000001' });
    check('Assistant question starts a job (202)', ask.status === 202 && !!ask.json?.jobId);
    const askJob = await waitJob(a, ask.json.jobId);
    const thread = await a.get(`/api/strategies/${sid}/assistant`);
    const answered = thread.json?.messages?.find((m) => m.job_id === ask.json.jobId);
    check('Assistant answer is stored in the strategy thread', askJob.status === 'succeeded' && answered?.status === 'answered' && typeof answered.answer?.answer === 'string' && answered.mode === 'live');
    const assistCall = mocks.calls.ai.at(-1)?.body;
    check('Assistant prompt delimits saved strategy and question as data', !!assistCall && assistCall.messages[0].content.includes('<saved_strategy>') && assistCall.messages[0].content.includes('Why start with this audience first?') && assistCall.system.includes('never instructions'));
    const stillIdle = await a.get(`/api/strategies/${sid}`);
    check('Assistant jobs do not lock the strategy for editing', stillIdle.json?.strategy?.sections.every((x) => x.status === 'ready'));
    check('User B cannot read A’s assistant thread', (await b.get(`/api/strategies/${sid}/assistant`)).status === 404);
    check('User B cannot ask about A’s strategy', (await b.post(`/api/strategies/${sid}/assistant`, { question: 'Tell me everything', intent: 'explain', idempotencyKey: 'b-assist-0001' })).status === 404);
    const noSection = await a.post(`/api/strategies/${sid}/assistant`, { question: 'Rewrite it all', sectionKey: null, intent: 'revise', idempotencyKey: 'assist-000002' });
    check('A revision needs a specific section', noSection.status === 400);
    const rev = await a.post(`/api/strategies/${sid}/assistant`, { question: 'Make the positioning plainer.', sectionKey: 'positioning', intent: 'revise', idempotencyKey: 'assist-000003' });
    const revJob = await waitJob(a, rev.json.jobId);
    const revMsg = (await a.get(`/api/strategies/${sid}/assistant`)).json.messages.find((m) => m.job_id === rev.json.jobId);
    check('Suggested revision is drafted without changing the section', revJob.status === 'succeeded' && !!revMsg?.answer?.content && !(await a.get(`/api/strategies/${sid}`)).json.strategy.sections.find((x) => x.key === 'positioning').edited);
    check('User B cannot apply A’s suggested revision', (await b.post(`/api/strategies/${sid}/assistant/${revMsg.id}/apply`, {})).status === 404);
    const applied = await a.post(`/api/strategies/${sid}/assistant/${revMsg.id}/apply`, {});
    check('Applying a revision saves it as an owner edit', applied.status === 200 && applied.json.section.edited === true && applied.json.message.applied_at);
    const vAfter = await a.get(`/api/strategies/${sid}/versions`);
    check('A version is saved before a revision is applied', vAfter.json.versions.some((v) => v.label.startsWith('Before applying a suggested revision')));
    check('A revision cannot be applied twice', (await a.post(`/api/strategies/${sid}/assistant/${revMsg.id}/apply`, {})).status === 409);
    const rev2 = await a.post(`/api/strategies/${sid}/assistant`, { question: 'Shorter key messages.', sectionKey: 'brand', intent: 'revise', idempotencyKey: 'assist-000004' });
    await waitJob(a, rev2.json.jobId);
    const rev2Msg = (await a.get(`/api/strategies/${sid}/assistant`)).json.messages.find((m) => m.job_id === rev2.json.jobId);
    const brandNow = (await a.get(`/api/strategies/${sid}`)).json.strategy.sections.find((x) => x.key === 'brand');
    await a.req('PUT', `/api/strategies/${sid}/sections/brand`, { content: brandNow.content, revision: brandNow.revision });
    const staleApply = await a.post(`/api/strategies/${sid}/assistant/${rev2Msg.id}/apply`, {});
    check('A revision based on an older version of the section is refused', staleApply.status === 409 && staleApply.json.error.code === 'stale');

    // ---- Sharing --------------------------------------------------------
    const share = await a.post(`/api/strategies/${sid}/share`, { expiresInDays: 7 });
    const sharePath = new URL(share.json.url).pathname;
    const viewer = new Client();
    const shared = await viewer.get(sharePath);
    check('Share link is viewable without an account', shared.status === 200 && shared.text.includes('Integration Bakery marketing strategy'));
    check('Shared page is noindex', /noindex/.test(shared.headers.get('x-robots-tag') ?? '') && shared.text.includes('noindex'));
    check('Shared page does not expose the brief', !shared.text.includes('Sourdough bread and pastries sold'));
    const guessed = await viewer.get('/share/not-a-real-token');
    check('Guessed share tokens show nothing', guessed.text.includes('This link is not available'));
    check('Revoke share link', (await a.req('DELETE', `/api/shares/${share.json.id}`)).status === 200);
    check('Revoked link stops working', (await viewer.get(sharePath)).text.includes('This link is not available'));

    // ---- Tools: anonymous quota, validation, saving after signup ------
    const visitor = new Client();
    const bad = await visitor.post('/api/tools/slogan-generator/run', { values: { business: 'x' }, idempotencyKey: 'tool-bad-0001' });
    check('Tool input validation returns field errors', bad.status === 422 && !!bad.json.error.fields?.business);
    let lastJob = null;
    for (let i = 0; i < 3; i++) {
      const r = await visitor.post('/api/tools/slogan-generator/run', { values: { business: 'A family bike repair shop that also rents e-bikes by the day.', tone: 'Warm and friendly' }, idempotencyKey: `tool-run-${i}-0001` });
      if (r.status === 202) lastJob = r.json.jobId;
    }
    const limited = await visitor.post('/api/tools/slogan-generator/run', { values: { business: 'A family bike repair shop that also rents e-bikes by the day.' }, idempotencyKey: 'tool-run-9-0001' });
    check('Anonymous daily quota is enforced server-side', limited.status === 429 && limited.json.error.code === 'quota_exceeded');
    const tj = await waitJob(visitor, lastJob);
    check('Anonymous tool run succeeds', tj.status === 'succeeded' && Array.isArray(tj.output?.slogans));
    check('Other visitors cannot read an anonymous job', (await new Client().get(`/api/jobs/${lastJob}`)).status === 404);
    check('Saving requires an account', (await visitor.post('/api/outputs', { jobId: lastJob })).status === 401);
    await visitor.post('/api/auth/signup', { email: 'visitor@example.com', password: 'visitor passphrase ok' });
    const savedOut = await visitor.post('/api/outputs', { jobId: lastJob });
    check('A run made before signing up can be saved after signing up', savedOut.status === 200 && !!savedOut.json.id);
    check('Saved output is private to its workspace', (await b.get(`/api/outputs/${savedOut.json.id}`)).status === 404);
    const calcSave = await a.post('/api/outputs', { toolSlug: 'market-size-calculator', values: { currency: 'USD', customers: 1000, price: 50, purchasesPerYear: 2, serviceablePct: 50, obtainablePct: 10 } });
    check('Calculator results are recomputed and saved server-side', calcSave.status === 200);
    const calcBad = await a.post('/api/outputs', { toolSlug: 'market-size-calculator', values: { currency: 'USD', customers: 0, price: 50, purchasesPerYear: 2, serviceablePct: 50, obtainablePct: 10 } });
    check('Invalid calculator inputs are refused', calcBad.status === 422);

    // ---- Billing: checkout + signed, idempotent webhooks ---------------
    const checkout = await b.post('/api/billing/checkout', {});
    check('Checkout session is created with the provider (test mode)', checkout.status === 200 && checkout.json.url.includes('checkout.stripe.com'));
    const stripeCall = mocks.calls.stripe[0];
    check('Checkout uses server-side key and configured price', stripeCall?.headers.authorization === 'Bearer sk_test_integration' && stripeCall.body['line_items[0][price_data][unit_amount]'] === '4900');
    const purchaseId = stripeCall.body['metadata[purchase_id]'];
    const quotaBefore = await b.get('/api/quota');
    const event = { id: 'evt_test_1', type: 'checkout.session.completed', livemode: false, data: { object: { id: 'cs_test_1', payment_status: 'paid', payment_intent: 'pi_test_1', amount_total: 4900, currency: 'usd', metadata: { purchase_id: purchaseId } } } };
    const payload = JSON.stringify(event);
    const unsigned = await fetch(`${BASE}/api/billing/webhook`, { method: 'POST', body: payload, headers: { 'stripe-signature': 't=1,v1=bad' } });
    check('Webhook with a bad signature is rejected', unsigned.status === 400);
    const old = await fetch(`${BASE}/api/billing/webhook`, { method: 'POST', body: payload, headers: { 'stripe-signature': signStripe(payload, WEBHOOK_SECRET, Math.floor(Date.now() / 1000) - 3600) } });
    check('Webhook with a stale timestamp is rejected', old.status === 400);
    const first = await (await fetch(`${BASE}/api/billing/webhook`, { method: 'POST', body: payload, headers: { 'stripe-signature': signStripe(payload) } })).json();
    const replay = await (await fetch(`${BASE}/api/billing/webhook`, { method: 'POST', body: payload, headers: { 'stripe-signature': signStripe(payload) } })).json();
    check('Webhook is processed once and replays are ignored', first.received && !first.duplicate && replay.duplicate === true);
    const quotaAfter = await b.get('/api/quota');
    check('Paid entitlement raises limits only after the verified webhook', quotaBefore.json.limit === 25 && quotaAfter.json.limit === 150, `${quotaBefore.json.limit} -> ${quotaAfter.json.limit}`);
    const billingPage = await b.get('/app/billing');
    check('Billing page labels a test-mode purchase honestly', billingPage.text.includes('Test-mode purchase'));
    const refund = { id: 'evt_test_2', type: 'charge.refunded', livemode: false, data: { object: { id: 'ch_1', payment_intent: 'pi_test_1', refunded: true } } };
    const rp = JSON.stringify(refund);
    await fetch(`${BASE}/api/billing/webhook`, { method: 'POST', body: rp, headers: { 'stripe-signature': signStripe(rp) } });
    check('Full refund removes paid access', (await b.get('/api/quota')).json.limit === 25);

    const health = await new Client().get('/api/health');
    check('Health check reports the database is reachable', health.status === 200 && health.json?.ok === true && /no-store/.test(health.headers.get('cache-control') ?? ''));

    // ---- Product events -------------------------------------------------
    const ev = await new Client().post('/api/events', { name: 'tool_viewed', tool: 'slogan-generator' });
    const evBad = await new Client().post('/api/events', { name: 'business_description', tool: 'My secret plan' });
    const evCross = await new Client().req('POST', '/api/events', { name: 'tool_viewed', tool: 'slogan-generator' }, { origin: 'https://evil.example' });
    check('Tool views are recorded through a same-origin beacon', ev.status === 204 && evBad.status === 204 && evCross.status === 403);
    {
      const { default: Database } = await import('better-sqlite3');
      const db = new Database(DB, { readonly: true });
      const rows = db.prepare('SELECT name, props FROM analytics_events').all();
      db.close();
      const names = new Set(rows.map((r) => r.name));
      const allProps = rows.map((r) => r.props).join(' ');
      check('Only whitelisted events are stored, with no user content', names.has('tool_viewed') && !names.has('business_description') && !allProps.includes('My secret plan') && !allProps.includes('Integration Bakery') && !allProps.includes('@example.com'));
    }

    // ---- Contact and password reset email ------------------------------
    const contact = await new Client().post('/api/contact', { name: 'Pat', email: 'pat@example.com', topic: 'Product question', message: 'How do personas work exactly?', elapsedMs: 5000 });
    check('Contact form stores and delivers the message', contact.status === 200 && mocks.calls.resend.some((c) => c.body.subject?.includes('[Vantaro contact]')));
    const bot = await new Client().post('/api/contact', { name: 'Bot', email: 'bot@example.com', topic: 'Feedback', message: 'spam spam spam spam', website: 'http://spam', elapsedMs: 5000 });
    check('Honeypot submissions are accepted silently but not delivered', bot.status === 200 && !mocks.calls.resend.some((c) => c.body.text?.includes('spam spam')));
    const reset = await new Client().post('/api/auth/reset-request', { email: 'a@example.com' });
    check('Password reset email is sent through the provider', reset.json?.delivery === 'sent' && mocks.calls.resend.some((c) => c.body.subject === 'Reset your Vantaro password'));
    const unknown = await new Client().post('/api/auth/reset-request', { email: 'nobody@example.com' });
    check('Reset request does not reveal whether an account exists', unknown.json?.message === reset.json?.message);
    const link = mocks.calls.resend.find((c) => c.body.subject === 'Reset your Vantaro password').body.text.match(/token=([A-Za-z0-9_-]+)/)[1];
    const resetClient = new Client();
    check('Reset link sets a new password and signs in', (await resetClient.post('/api/auth/reset-confirm', { token: decodeURIComponent(link), password: 'a brand new passphrase' })).status === 200);
    check('Reset link cannot be reused', (await new Client().post('/api/auth/reset-confirm', { token: decodeURIComponent(link), password: 'another new passphrase' })).status === 400);
    check('Old sessions are signed out after a reset', (await a.get('/api/strategies')).status === 401);

    // ---- Account deletion ------------------------------------------------
    const del = await b.req('DELETE', '/api/account', { password: 'another good passphrase' });
    check('Account deletion removes the user', del.status === 200 && (await b.get('/api/strategies')).status === 401);
  } finally {
    server.kill();
    await mocks.close();
    if (failures) {
      console.log('\n--- server log (tail) ---\n' + serverLog.split('\n').slice(-40).join('\n'));
    }
  }
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/integration-results.json', JSON.stringify({ ranAt: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
