import { describe, expect, it } from 'vitest';
import { computeBudget, computeMarketSize, computeValuation } from '@/lib/tools/calculators';

describe('market size', () => {
  it('computes TAM/SAM/SOM bottom-up', () => {
    const r = computeMarketSize({ currency: 'USD', customers: 1000, price: 50, purchasesPerYear: 2, serviceablePct: 50, obtainablePct: 10, source: 'test' });
    expect(r.ok).toBe(true);
    const by = Object.fromEntries(r.lines.map((l) => [l.label, l.value]));
    expect(by['Total addressable market (TAM)']).toBe('$100,000');
    expect(by['Serviceable available market (SAM)']).toBe('$50,000');
    expect(by['Serviceable obtainable market (SOM)']).toBe('$5,000');
    expect(by['Customers at SOM']).toBe('50');
  });
  it('rejects zero, negative and out-of-range inputs', () => {
    expect(computeMarketSize({ customers: 0, price: 1, purchasesPerYear: 1, serviceablePct: 10, obtainablePct: 1 }).ok).toBe(false);
    expect(computeMarketSize({ customers: 10, price: -1, purchasesPerYear: 1, serviceablePct: 10, obtainablePct: 1 }).ok).toBe(false);
    expect(computeMarketSize({ customers: 10, price: 1, purchasesPerYear: 1, serviceablePct: 101, obtainablePct: 1 }).ok).toBe(false);
    expect(computeMarketSize({ customers: 'abc', price: 1, purchasesPerYear: 1, serviceablePct: 10, obtainablePct: 1 }).ok).toBe(false);
  });
  it('warns about ambitious share and missing source', () => {
    const r = computeMarketSize({ customers: 10, price: 1, purchasesPerYear: 1, serviceablePct: 10, obtainablePct: 40 });
    expect(r.warnings.length).toBe(2);
  });
});

describe('valuation', () => {
  const base = { currency: 'USD', revenue: 1_000_000, earnings: 200_000, revenueMultipleLow: 0.5, revenueMultipleHigh: 1, earningsMultipleLow: 2, earningsMultipleHigh: 4 };
  it('computes both multiple methods and the midpoint', () => {
    const r = computeValuation(base);
    expect(r.ok).toBe(true);
    const by = Object.fromEntries(r.lines.map((l) => [l.label, l.value]));
    expect(by['Revenue method, low']).toBe('$500,000');
    expect(by['Revenue method, high']).toBe('$1,000,000');
    expect(by['Earnings method, low']).toBe('$400,000');
    expect(by['Earnings method, high']).toBe('$800,000');
    expect(by['Midpoint']).toBe('$675,000');
  });
  it('skips the earnings method for negative earnings', () => {
    const r = computeValuation({ ...base, earnings: -5000 });
    expect(r.ok).toBe(true);
    expect(r.lines.some((l) => l.label.startsWith('Earnings method'))).toBe(false);
    expect(r.warnings[0]).toMatch(/zero or negative/);
    expect(r.lines.find((l) => l.label === 'Midpoint')!.value).toBe('$750,000');
  });
  it('capitalized earnings requires discount > growth', () => {
    expect(computeValuation({ ...base, discountRate: 5, growthRate: 5 }).warnings.join(' ')).toMatch(/higher than the growth/);
    const ok = computeValuation({ ...base, discountRate: 25, growthRate: 5 });
    expect(ok.lines.find((l) => l.label === 'Capitalized earnings')!.value).toBe('$1,050,000');
  });
  it('rejects inverted ranges and negative multiples', () => {
    expect(computeValuation({ ...base, revenueMultipleLow: 2 }).ok).toBe(false);
    expect(computeValuation({ ...base, earningsMultipleLow: -1 }).ok).toBe(false);
    expect(computeValuation({ ...base, revenue: undefined }).ok).toBe(false);
  });
});

describe('budget', () => {
  it('percent of revenue with channel split and reserve', () => {
    const r = computeBudget({ currency: 'USD', method: 'Percent of revenue', monthlyRevenue: 10000, percentOfRevenue: 10, months: 3, channel1: 'Ads', channel1Pct: 50, channel2: 'Email', channel2Pct: 30 });
    expect(r.ok).toBe(true);
    const by = Object.fromEntries(r.lines.map((l) => [l.label, l.value]));
    expect(by['Monthly budget']).toBe('$1,000');
    expect(by['Ads, monthly']).toBe('$500');
    expect(by['Email, monthly']).toBe('$300');
    expect(by['Unallocated (testing reserve), monthly']).toBe('$200');
    expect(by['Total for 3 months']).toBe('$3,000');
  });
  it('customer goal method', () => {
    const r = computeBudget({ currency: 'EUR', method: 'Customer goal', newCustomersPerMonth: 20, costPerCustomer: 45, months: 1 });
    expect(r.headline!.value).toBe('€900');
  });
  it('rejects allocations above 100% and unnamed channels', () => {
    expect(computeBudget({ method: 'Percent of revenue', monthlyRevenue: 100, percentOfRevenue: 10, months: 1, channel1: 'A', channel1Pct: 70, channel2: 'B', channel2Pct: 40 }).ok).toBe(false);
    expect(computeBudget({ method: 'Percent of revenue', monthlyRevenue: 100, percentOfRevenue: 10, months: 1, channel1Pct: 30 }).ok).toBe(false);
    expect(computeBudget({ method: 'Percent of revenue', monthlyRevenue: 100, percentOfRevenue: 10, months: 0 }).ok).toBe(false);
    expect(computeBudget({ method: 'Percent of revenue', monthlyRevenue: 0, percentOfRevenue: 10, months: 1 }).headline!.value).toBe('$0');
  });
});
