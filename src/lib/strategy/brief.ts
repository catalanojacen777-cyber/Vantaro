import { z } from 'zod';

export const CUSTOMER_TYPES = ['Businesses (B2B)', 'Consumers (B2C)', 'Both'] as const;
export const STAGES = ['Idea', 'Pre-launch', 'Early customers', 'Growing', 'Established'] as const;
export const OBJECTIVES = [
  'Get our first customers',
  'Generate more qualified leads',
  'Increase conversion rate',
  'Launch a new product or offer',
  'Grow repeat purchases or retention',
  'Enter a new market or audience',
  'Build brand awareness',
] as const;
export const BUDGETS = [
  'No paid budget yet',
  'Under $500 / month',
  '$500–$2,000 / month',
  '$2,000–$10,000 / month',
  'Over $10,000 / month',
] as const;
export const CHANNELS = [
  'Website / SEO',
  'Google Ads',
  'Meta ads',
  'LinkedIn',
  'Instagram',
  'TikTok',
  'YouTube',
  'Email newsletter',
  'Cold outreach',
  'Referrals / word of mouth',
  'Partnerships',
  'Events / in person',
  'Marketplaces',
  'Community / forums',
  'PR / media',
] as const;

const text = (max: number) => z.string().trim().max(max);

/** Draft schema: everything optional so partial answers can autosave. */
export const briefDraftSchema = z.object({
  businessName: text(120).optional(),
  productDescription: text(2000).optional(),
  website: text(300).optional(),
  customerType: z.enum(CUSTOMER_TYPES).optional(),
  idealCustomer: text(1200).optional(),
  region: text(160).optional(),
  language: text(40).optional(),
  stage: z.enum(STAGES).optional(),
  objective: z.enum(OBJECTIVES).optional(),
  objectiveDetail: text(600).optional(),
  differentiation: text(1200).optional(),
  currentChannels: z.array(z.enum(CHANNELS)).max(CHANNELS.length).optional(),
  budget: z.enum(BUDGETS).optional(),
  constraints: text(1200).optional(),
});
export type Brief = z.infer<typeof briefDraftSchema>;

/** What must be present before a strategy can be generated. */
export const REQUIRED_FIELDS: { key: keyof Brief; label: string }[] = [
  { key: 'businessName', label: 'Business name' },
  { key: 'productDescription', label: 'What you sell' },
  { key: 'customerType', label: 'Who you sell to' },
  { key: 'stage', label: 'Stage' },
  { key: 'objective', label: 'Primary objective' },
];

export function missingRequired(brief: Brief): string[] {
  return REQUIRED_FIELDS.filter(({ key }) => {
    const v = brief[key];
    return v === undefined || (typeof v === 'string' && v.trim().length === 0);
  }).map((f) => f.label);
}

export function productDescriptionProblem(brief: Brief): string | null {
  const d = brief.productDescription?.trim() ?? '';
  if (d && d.length < 40) return 'Add a little more detail about what you sell (at least a couple of sentences).';
  return null;
}

/** Plain-text rendering of the brief for prompts and exports. */
export function briefLines(brief: Brief): Record<string, string | undefined> {
  return {
    'Business name': brief.businessName,
    'What they sell': brief.productDescription,
    Website: brief.website,
    'Customer type': brief.customerType,
    'Ideal customer (as described by the owner)': brief.idealCustomer,
    'Region served': brief.region,
    Stage: brief.stage,
    'Primary objective': brief.objective,
    'Objective detail': brief.objectiveDetail,
    'Differentiation (as described by the owner)': brief.differentiation,
    'Current marketing channels': brief.currentChannels?.length ? brief.currentChannels.join(', ') : undefined,
    'Marketing budget': brief.budget,
    'Constraints': brief.constraints,
    'Output language': brief.language,
  };
}
