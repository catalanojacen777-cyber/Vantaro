/**
 * Deterministic calculators. Pure functions, shared by the browser (live
 * results) and the server (validation when saving). Every figure shown is
 * derived from the person's inputs with a visible formula.
 */
import { F } from './fields';
import type { CalcLine, CalcResult, CalculatorTool } from './types';

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'MXN'] as const;

export function money(n: number, currency: string, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: opts.compact && abs >= 1_000_000 ? 'compact' : 'standard',
      maximumFractionDigits: abs >= 1000 || opts.compact ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toFixed(0)} ${currency}`;
  }
}
const num = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
const pct = (n: number) => `${num(n)}%`;

type Values = Record<string, string | number | undefined>;
const n = (v: Values, k: string): number | null => {
  const x = v[k];
  if (x === undefined || x === null || x === '') return null;
  const parsed = typeof x === 'number' ? x : Number(String(x).replace(/[,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

function fail(errors: string[]): CalcResult {
  return { ok: false, errors, lines: [], assumptions: [], warnings: [] };
}

// ---------------------------------------------------------------------------
// Business valuation scenarios
// ---------------------------------------------------------------------------
export function computeValuation(v: Values): CalcResult {
  const currency = String(v.currency || 'USD');
  const revenue = n(v, 'revenue');
  const earnings = n(v, 'earnings');
  const revLow = n(v, 'revenueMultipleLow');
  const revHigh = n(v, 'revenueMultipleHigh');
  const earnLow = n(v, 'earningsMultipleLow');
  const earnHigh = n(v, 'earningsMultipleHigh');
  const discount = n(v, 'discountRate');
  const growth = n(v, 'growthRate');
  const errors: string[] = [];
  if (revenue === null || revenue < 0) errors.push('Enter annual revenue of zero or more.');
  if (earnings === null) errors.push('Enter annual earnings (it can be negative).');
  for (const [k, label] of [
    [revLow, 'Low revenue multiple'],
    [revHigh, 'High revenue multiple'],
    [earnLow, 'Low earnings multiple'],
    [earnHigh, 'High earnings multiple'],
  ] as const) {
    if (k === null) errors.push(`${label} is required.`);
    else if (k < 0) errors.push(`${label} cannot be negative.`);
  }
  if (revLow !== null && revHigh !== null && revLow > revHigh) errors.push('The low revenue multiple is higher than the high one.');
  if (earnLow !== null && earnHigh !== null && earnLow > earnHigh) errors.push('The low earnings multiple is higher than the high one.');
  if (errors.length) return fail(errors);

  const lines: CalcLine[] = [];
  const warnings: string[] = [];
  const scenarios: NonNullable<CalcResult['scenarios']> = [];
  const r = revenue!;
  const e = earnings!;

  const revL = r * revLow!;
  const revH = r * revHigh!;
  lines.push({ label: 'Revenue method, low', value: money(revL, currency), formula: `${money(r, currency)} × ${num(revLow!)}` });
  lines.push({ label: 'Revenue method, high', value: money(revH, currency), formula: `${money(r, currency)} × ${num(revHigh!)}` });
  scenarios.push({ label: 'Revenue multiple', value: `${money(revL, currency, { compact: true })} – ${money(revH, currency, { compact: true })}` });

  if (e > 0) {
    const eL = e * earnLow!;
    const eH = e * earnHigh!;
    lines.push({ label: 'Earnings method, low', value: money(eL, currency), formula: `${money(e, currency)} × ${num(earnLow!)}` });
    lines.push({ label: 'Earnings method, high', value: money(eH, currency), formula: `${money(e, currency)} × ${num(earnHigh!)}` });
    scenarios.push({ label: 'Earnings multiple', value: `${money(eL, currency, { compact: true })} – ${money(eH, currency, { compact: true })}` });
  } else {
    warnings.push('Earnings are zero or negative, so the earnings-multiple method does not produce a meaningful value.');
  }

  if (discount !== null && growth !== null) {
    if (discount <= growth) {
      warnings.push('The capitalized-earnings method needs a discount rate higher than the growth rate. It was skipped.');
    } else if (e <= 0) {
      warnings.push('The capitalized-earnings method needs positive earnings. It was skipped.');
    } else {
      const cap = (e * (1 + growth / 100)) / ((discount - growth) / 100);
      lines.push({
        label: 'Capitalized earnings',
        value: money(cap, currency),
        formula: `${money(e, currency)} × (1 + ${pct(growth)}) ÷ (${pct(discount)} − ${pct(growth)})`,
      });
      scenarios.push({ label: 'Capitalized earnings', value: money(cap, currency, { compact: true }), note: 'Sensitive to small changes in the rates.' });
    }
  }

  const mids = [(revL + revH) / 2, ...(e > 0 ? [(e * earnLow! + e * earnHigh!) / 2] : [])];
  const midpoint = mids.reduce((a, b) => a + b, 0) / mids.length;
  return {
    ok: true,
    errors: [],
    headline: { label: 'Midpoint of the multiple methods', value: money(midpoint, currency) },
    lines: [...lines, { label: 'Midpoint', value: money(midpoint, currency), formula: `average of each method’s low/high midpoint`, emphasis: true }],
    scenarios,
    assumptions: [
      'Multiples are your own assumptions. They vary widely by industry, size, growth, and how dependent the business is on the owner.',
      'Earnings should be a consistent measure, such as seller’s discretionary earnings or EBITDA, for the same 12 months as revenue.',
      'This is a scenario calculation, not an appraisal or an offer. Talk to a qualified valuation professional before any transaction.',
    ],
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Market size (bottom-up TAM / SAM / SOM)
// ---------------------------------------------------------------------------
export function computeMarketSize(v: Values): CalcResult {
  const currency = String(v.currency || 'USD');
  const customers = n(v, 'customers');
  const price = n(v, 'price');
  const frequency = n(v, 'purchasesPerYear');
  const serviceable = n(v, 'serviceablePct');
  const obtainable = n(v, 'obtainablePct');
  const errors: string[] = [];
  if (customers === null || customers <= 0) errors.push('Enter the number of potential customers (more than zero).');
  if (price === null || price <= 0) errors.push('Enter the average price per purchase (more than zero).');
  if (frequency === null || frequency <= 0) errors.push('Enter purchases per customer per year (more than zero).');
  if (serviceable === null || serviceable <= 0 || serviceable > 100) errors.push('Serviceable share must be between 0 and 100%.');
  if (obtainable === null || obtainable <= 0 || obtainable > 100) errors.push('Obtainable share must be between 0 and 100%.');
  if (errors.length) return fail(errors);

  const annualValue = price! * frequency!;
  const tam = customers! * annualValue;
  const sam = tam * (serviceable! / 100);
  const som = sam * (obtainable! / 100);
  const warnings: string[] = [];
  if (obtainable! > 10) warnings.push(`An obtainable share of ${pct(obtainable!)} is an ambitious assumption. Make sure you can explain how you would win it.`);
  const source = String(v.source ?? '').trim();
  if (!source) warnings.push('No source is recorded for the customer count. Add where the number comes from and when it was published.');

  return {
    ok: true,
    errors: [],
    headline: { label: 'Serviceable obtainable market (SOM), per year', value: money(som, currency) },
    lines: [
      { label: 'Annual value per customer', value: money(annualValue, currency), formula: `${money(price!, currency)} × ${num(frequency!)} purchases` },
      { label: 'Total addressable market (TAM)', value: money(tam, currency), formula: `${num(customers!)} customers × ${money(annualValue, currency)}` },
      { label: 'Serviceable available market (SAM)', value: money(sam, currency), formula: `TAM × ${pct(serviceable!)}` },
      { label: 'Serviceable obtainable market (SOM)', value: money(som, currency), formula: `SAM × ${pct(obtainable!)}`, emphasis: true },
      { label: 'Customers at SOM', value: num(Math.round(customers! * (serviceable! / 100) * (obtainable! / 100))), formula: `${num(customers!)} × ${pct(serviceable!)} × ${pct(obtainable!)}` },
    ],
    assumptions: [
      source ? `Customer count source: ${source}` : 'Customer count: entered without a source.',
      'Bottom-up sizing: every figure is derived from the inputs above.',
      'SAM is the share you can realistically serve (geography, segment, channel). SOM is the share you could win in the period you are planning for.',
    ],
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Marketing budget
// ---------------------------------------------------------------------------
export function computeBudget(v: Values): CalcResult {
  const currency = String(v.currency || 'USD');
  const method = String(v.method || 'Percent of revenue');
  const months = n(v, 'months') ?? 1;
  const errors: string[] = [];
  let monthly = 0;
  const lines: CalcLine[] = [];
  if (!Number.isInteger(months) || months < 1 || months > 36) errors.push('Plan for between 1 and 36 months.');

  if (method === 'Percent of revenue') {
    const revenue = n(v, 'monthlyRevenue');
    const percent = n(v, 'percentOfRevenue');
    if (revenue === null || revenue < 0) errors.push('Enter monthly revenue of zero or more.');
    if (percent === null || percent < 0 || percent > 100) errors.push('Percent of revenue must be between 0 and 100.');
    if (!errors.length) {
      monthly = revenue! * (percent! / 100);
      lines.push({ label: 'Monthly budget', value: money(monthly, currency), formula: `${money(revenue!, currency)} × ${pct(percent!)}` });
    }
  } else {
    const customersGoal = n(v, 'newCustomersPerMonth');
    const cac = n(v, 'costPerCustomer');
    if (customersGoal === null || customersGoal < 0) errors.push('Enter how many new customers you want per month.');
    if (cac === null || cac < 0) errors.push('Enter your expected cost to acquire one customer.');
    if (!errors.length) {
      monthly = customersGoal! * cac!;
      lines.push({ label: 'Monthly budget', value: money(monthly, currency), formula: `${num(customersGoal!)} customers × ${money(cac!, currency)}` });
    }
  }
  const channels: { name: string; pct: number }[] = [];
  for (let i = 1; i <= 4; i++) {
    const name = String(v[`channel${i}`] ?? '').trim();
    const p = n(v, `channel${i}Pct`);
    if (!name && (p === null || p === 0)) continue;
    if (!name) errors.push(`Name channel ${i}, or clear its percentage.`);
    else if (p === null || p < 0 || p > 100) errors.push(`Give ${name} a share between 0 and 100%.`);
    else channels.push({ name, pct: p });
  }
  const allocated = channels.reduce((a, c) => a + c.pct, 0);
  if (allocated > 100.0001) errors.push(`Channel shares add up to ${pct(allocated)}. Keep the total at 100% or less.`);
  if (errors.length) return fail(errors);

  for (const c of channels) {
    lines.push({ label: `${c.name}, monthly`, value: money(monthly * (c.pct / 100), currency), formula: `${money(monthly, currency)} × ${pct(c.pct)}` });
  }
  if (channels.length && allocated < 100) {
    lines.push({ label: 'Unallocated (testing reserve), monthly', value: money(monthly * ((100 - allocated) / 100), currency), formula: `${money(monthly, currency)} × ${pct(100 - allocated)}` });
  }
  const total = monthly * months;
  lines.push({ label: `Total for ${months} ${months === 1 ? 'month' : 'months'}`, value: money(total, currency), formula: `${money(monthly, currency)} × ${months}`, emphasis: true });
  return {
    ok: true,
    errors: [],
    headline: { label: `Budget for ${months} ${months === 1 ? 'month' : 'months'}`, value: money(total, currency) },
    lines,
    assumptions: [
      method === 'Percent of revenue'
        ? 'Budget is a fixed share of current monthly revenue. Revisit it when revenue changes.'
        : 'Budget is driven by a customer goal and an expected acquisition cost. Replace the cost estimate with your measured cost once you have one.',
      'Spend figures cover media and tools you pay for. Your own time is not included.',
    ],
    warnings: [],
  };
}

export const COMPUTE: Record<string, (v: Values) => CalcResult> = {
  'business-valuation-calculator': computeValuation,
  'market-size-calculator': computeMarketSize,
  'marketing-budget-calculator': computeBudget,
};

const currencyField = () => F.select('currency', 'Currency', CURRENCIES);

export const calculatorTools: CalculatorTool[] = [
  {
    kind: 'calculator',
    slug: 'business-valuation-calculator',
    name: 'Business Valuation Calculator',
    category: 'calculators',
    summary: 'Scenario valuations from your revenue, earnings and the multiples you choose.',
    answer:
      'The Business Valuation Calculator estimates a value range for a business using revenue and earnings multiples you supply, plus an optional capitalized-earnings method. Every formula is shown. It produces scenarios to reason with, not an appraisal.',
    fields: [
      currencyField(),
      F.number('revenue', 'Annual revenue', { required: true, min: 0, step: 1000, help: 'The last 12 months.' }),
      F.number('earnings', 'Annual earnings', { required: true, step: 1000, help: 'Seller’s discretionary earnings or EBITDA for the same 12 months. Can be negative.' }),
      F.number('revenueMultipleLow', 'Revenue multiple, low', { required: true, min: 0, step: 0.1 }),
      F.number('revenueMultipleHigh', 'Revenue multiple, high', { required: true, min: 0, step: 0.1 }),
      F.number('earningsMultipleLow', 'Earnings multiple, low', { required: true, min: 0, step: 0.1 }),
      F.number('earningsMultipleHigh', 'Earnings multiple, high', { required: true, min: 0, step: 0.1 }),
      F.number('discountRate', 'Discount rate (%)', { min: 0, max: 100, step: 0.5, help: 'Optional. Used with growth for the capitalized-earnings method.' }),
      F.number('growthRate', 'Long-term growth rate (%)', { min: -50, max: 50, step: 0.5, help: 'Optional.' }),
    ],
    examples: [
      {
        label: 'Example assumptions only',
        values: { currency: 'USD', revenue: 850000, earnings: 190000, revenueMultipleLow: 0.6, revenueMultipleHigh: 1.1, earningsMultipleLow: 2.5, earningsMultipleHigh: 3.5, discountRate: 22, growthRate: 3 },
      },
    ],
    outputLabel: 'Valuation scenarios',
    methodology: [
      'Revenue method: annual revenue multiplied by each revenue multiple you enter.',
      'Earnings method: annual earnings multiplied by each earnings multiple. Skipped when earnings are zero or negative.',
      'Capitalized earnings (optional): earnings × (1 + growth) ÷ (discount rate − growth). Only valid when the discount rate is higher than growth.',
      'The midpoint averages the midpoints of the multiple methods that apply.',
    ],
    limitations: ['Multiples are your assumptions; we do not supply industry benchmarks.', 'Not an appraisal, fairness opinion or investment advice.'],
    related: ['market-size-calculator', 'business-plan-generator', 'business-model-generator'],
  },
  {
    kind: 'calculator',
    slug: 'market-size-calculator',
    name: 'Market Size Calculator',
    category: 'calculators',
    summary: 'Bottom-up TAM, SAM and SOM from assumptions you can defend.',
    answer:
      'The Market Size Calculator estimates total addressable, serviceable and obtainable market (TAM, SAM, SOM) bottom-up: number of potential customers × annual spend per customer, narrowed by the share you can serve and the share you can win. You enter every assumption and its source.',
    fields: [
      currencyField(),
      F.number('customers', 'Potential customers', { required: true, min: 1, step: 1, help: 'People or businesses who could buy this.' }),
      F.text('source', 'Source for that number', { max: 200, help: 'Where it comes from and when it was published, e.g. a census table or industry association report.' }),
      F.number('price', 'Average price per purchase', { required: true, min: 0, step: 1 }),
      F.number('purchasesPerYear', 'Purchases per customer per year', { required: true, min: 0, step: 0.5 }),
      F.number('serviceablePct', 'Share you can serve (%)', { required: true, min: 0, max: 100, step: 1, help: 'Limited by geography, segment or channel.' }),
      F.number('obtainablePct', 'Share you could win (%)', { required: true, min: 0, max: 100, step: 0.5, help: 'Within the period you are planning for.' }),
    ],
    examples: [
      {
        label: 'Example assumptions only',
        values: { currency: 'USD', customers: 42000, source: 'Example: county household count (replace with your source)', price: 180, purchasesPerYear: 4, serviceablePct: 25, obtainablePct: 3 },
      },
    ],
    outputLabel: 'TAM, SAM and SOM',
    methodology: [
      'Annual value per customer = average price × purchases per year.',
      'TAM = potential customers × annual value per customer.',
      'SAM = TAM × share you can serve.',
      'SOM = SAM × share you could win.',
    ],
    limitations: ['Only as good as your inputs. Record the source of every number.', 'Top-down market reports are not fetched or cited automatically.'],
    related: ['business-idea-validator', 'niche-finder', 'business-valuation-calculator'],
  },
  {
    kind: 'calculator',
    slug: 'marketing-budget-calculator',
    name: 'Marketing Budget Calculator',
    category: 'calculators',
    summary: 'A monthly budget and channel split with the arithmetic visible.',
    answer:
      'The Marketing Budget Calculator sets a marketing budget either as a percentage of revenue or from a customer goal and an acquisition cost, then splits it across up to four channels and shows the arithmetic for every figure.',
    fields: [
      currencyField(),
      F.select('method', 'How do you want to set the budget?', ['Percent of revenue', 'Customer goal']),
      F.number('monthlyRevenue', 'Monthly revenue', { min: 0, step: 100, help: 'Used with “Percent of revenue”.' }),
      F.number('percentOfRevenue', 'Percent of revenue (%)', { min: 0, max: 100, step: 0.5, help: 'Used with “Percent of revenue”.' }),
      F.number('newCustomersPerMonth', 'New customers wanted per month', { min: 0, step: 1, help: 'Used with “Customer goal”.' }),
      F.number('costPerCustomer', 'Expected cost to acquire one customer', { min: 0, step: 1, help: 'Used with “Customer goal”.' }),
      F.number('months', 'Months to plan for', { min: 1, max: 36, step: 1, default: 3 }),
      F.text('channel1', 'Channel 1', { max: 40, placeholder: 'e.g. Google Ads' }),
      F.number('channel1Pct', 'Channel 1 share (%)', { min: 0, max: 100, step: 1 }),
      F.text('channel2', 'Channel 2', { max: 40 }),
      F.number('channel2Pct', 'Channel 2 share (%)', { min: 0, max: 100, step: 1 }),
      F.text('channel3', 'Channel 3', { max: 40 }),
      F.number('channel3Pct', 'Channel 3 share (%)', { min: 0, max: 100, step: 1 }),
      F.text('channel4', 'Channel 4', { max: 40 }),
      F.number('channel4Pct', 'Channel 4 share (%)', { min: 0, max: 100, step: 1 }),
    ],
    examples: [
      {
        label: 'Example assumptions only',
        values: {
          currency: 'USD',
          method: 'Percent of revenue',
          monthlyRevenue: 40000,
          percentOfRevenue: 7,
          months: 3,
          channel1: 'Google Ads',
          channel1Pct: 45,
          channel2: 'Email and retention',
          channel2Pct: 20,
          channel3: 'Local partnerships',
          channel3Pct: 15,
        },
      },
    ],
    outputLabel: 'Marketing budget',
    methodology: [
      'Percent of revenue: monthly budget = monthly revenue × percentage.',
      'Customer goal: monthly budget = new customers wanted × cost to acquire one customer.',
      'Each channel receives its share of the monthly budget; any unallocated share is shown as a testing reserve.',
      'Total = monthly budget × months.',
    ],
    limitations: ['Acquisition costs are your estimates; replace them with measured costs as soon as you have data.'],
    related: ['marketing-plan-generator', 'marketing-ideas-generator', 'sales-funnel-generator'],
  },
];
