/**
 * Central configuration. Every business fact that appears publicly (price,
 * refund terms, support address, operator details, limits) comes from here.
 * Unknown values stay `null` and must never be rendered as if they were known.
 *
 * Server-only: reads process.env. Client components receive the specific
 * values they need as props.
 */
import 'server-only';

const env = process.env;

function str(name: string): string | null {
  const v = env[name];
  return v && v.trim() ? v.trim() : null;
}
function int(name: string, fallback: number): number {
  const v = str(name);
  if (v === null) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
function list(name: string, fallback: string[]): string[] {
  const v = str(name);
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : fallback;
}

export type DeploymentEnv = 'development' | 'preview' | 'production';

const deployment: DeploymentEnv =
  env.VANTARO_ENV === 'production'
    ? 'production'
    : env.VANTARO_ENV === 'preview'
      ? 'preview'
      : 'development';

export const config = {
  deployment,
  /** Indexing is only allowed on the configured production deployment. */
  allowIndexing: deployment === 'production' && env.VANTARO_ALLOW_INDEXING !== 'false',

  site: {
    name: 'Vantaro',
    /** Absolute origin used for canonicals, sitemap, OG and email links. */
    url: (str('SITE_URL') ?? 'http://localhost:3000').replace(/\/$/, ''),
    tagline: 'Your next move, made clear.',
    description:
      'Vantaro is an AI marketing workspace for founders and small businesses. Turn what you know about your business into a marketing strategy, audience hypotheses, and a prioritized plan you can ship.',
  },

  operator: {
    /** Legal operator of the service. Required before policies can go live. */
    legalName: str('OPERATOR_LEGAL_NAME'),
    address: str('OPERATOR_ADDRESS'),
    jurisdiction: str('OPERATOR_JURISDICTION'),
    supportEmail: str('SUPPORT_EMAIL'),
    privacyEmail: str('PRIVACY_EMAIL') ?? str('SUPPORT_EMAIL'),
    policiesEffectiveDate: str('POLICIES_EFFECTIVE_DATE'),
  },

  ai: {
    provider: 'anthropic' as const,
    apiKey: str('ANTHROPIC_API_KEY'),
    baseUrl: (str('ANTHROPIC_BASE_URL') ?? 'https://api.anthropic.com').replace(/\/$/, ''),
    model: str('AI_MODEL') ?? 'claude-sonnet-5-5',
    /** Per-call output ceiling (tokens). */
    maxOutputTokens: int('AI_MAX_OUTPUT_TOKENS', 4000),
    timeoutMs: int('AI_TIMEOUT_MS', 90_000),
    /** Languages we have actually tested output quality for. */
    outputLanguages: list('OUTPUT_LANGUAGES', ['English']),
  },

  limits: {
    anonymousGenerationsPerDay: int('LIMIT_ANON_GENERATIONS_PER_DAY', 5),
    free: {
      generationsPerDay: int('LIMIT_FREE_GENERATIONS_PER_DAY', 25),
      strategiesPer30Days: int('LIMIT_FREE_STRATEGIES_PER_30_DAYS', 1),
      personasPerStrategy: int('LIMIT_FREE_PERSONAS', 3),
      workspaces: int('LIMIT_FREE_WORKSPACES', 1),
    },
    paid: {
      generationsPerDay: int('LIMIT_PAID_GENERATIONS_PER_DAY', 150),
      strategiesPer30Days: int('LIMIT_PAID_STRATEGIES_PER_30_DAYS', 10),
      personasPerStrategy: int('LIMIT_PAID_PERSONAS', 5),
      workspaces: int('LIMIT_PAID_WORKSPACES', 5),
    },
    inputMaxChars: 4000,
  },

  billing: {
    provider: 'stripe' as const,
    planName: str('PAID_PLAN_NAME') ?? 'Vantaro Pro',
    /** Price in minor units (e.g. cents). Null = not configured. */
    priceAmount: str('PRICE_AMOUNT') ? int('PRICE_AMOUNT', 0) : null,
    priceCurrency: str('PRICE_CURRENCY')?.toLowerCase() ?? null,
    /** 'one_time' matches the reference model; access duration below. */
    priceType: 'one_time' as const,
    refundDays: str('REFUND_DAYS') ? int('REFUND_DAYS', 0) : null,
    stripeSecretKey: str('STRIPE_SECRET_KEY'),
    stripeWebhookSecret: str('STRIPE_WEBHOOK_SECRET'),
    stripeApiBase: (str('STRIPE_API_BASE') ?? 'https://api.stripe.com').replace(/\/$/, ''),
  },

  email: {
    resendApiKey: str('RESEND_API_KEY'),
    resendApiBase: (str('RESEND_API_BASE') ?? 'https://api.resend.com').replace(/\/$/, ''),
    from: str('EMAIL_FROM'),
    supportInbox: str('SUPPORT_INBOX') ?? str('SUPPORT_EMAIL'),
  },

  security: {
    /** Secret used to hash IPs and sign anonymous ids. Must be set in production. */
    appSecret: str('APP_SECRET') ?? 'dev-only-insecure-secret-change-me',
    sessionDays: int('SESSION_DAYS', 30),
  },

  db: {
    path: str('DATABASE_PATH') ?? './data/vantaro.db',
  },
};

export type Plan = 'free' | 'paid';

export function aiMode(): 'live' | 'preview' | 'unavailable' {
  if (config.ai.apiKey) return 'live';
  // Simulated output is only ever served outside production, and is labeled.
  return config.deployment === 'production' ? 'unavailable' : 'preview';
}

export function billingState(): {
  ready: boolean;
  testMode: boolean;
  missing: string[];
} {
  const b = config.billing;
  const missing: string[] = [];
  if (b.priceAmount === null || b.priceAmount <= 0) missing.push('PRICE_AMOUNT');
  if (!b.priceCurrency) missing.push('PRICE_CURRENCY');
  if (!b.stripeSecretKey) missing.push('STRIPE_SECRET_KEY');
  if (!b.stripeWebhookSecret) missing.push('STRIPE_WEBHOOK_SECRET');
  if (b.refundDays === null) missing.push('REFUND_DAYS');
  const testMode = !!b.stripeSecretKey?.startsWith('sk_test_');
  if (config.deployment === 'production' && testMode) missing.push('live STRIPE_SECRET_KEY');
  return { ready: missing.length === 0, testMode, missing };
}

export function emailReady(): boolean {
  return !!(config.email.resendApiKey && config.email.from);
}

export function policiesReady(): boolean {
  const o = config.operator;
  return !!(o.legalName && o.address && o.jurisdiction && o.privacyEmail && o.policiesEffectiveDate);
}

export function formatPrice(): string | null {
  const { priceAmount, priceCurrency } = config.billing;
  if (priceAmount === null || !priceCurrency) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: priceCurrency.toUpperCase(),
    }).format(priceAmount / 100);
  } catch {
    return null;
  }
}

export function absoluteUrl(path = '/'): string {
  return `${config.site.url}${path.startsWith('/') ? path : `/${path}`}`;
}

if (config.deployment === 'production' && config.security.appSecret.startsWith('dev-only')) {
  // Fail loudly rather than run production with a known secret.
  throw new Error('APP_SECRET must be set in production.');
}
