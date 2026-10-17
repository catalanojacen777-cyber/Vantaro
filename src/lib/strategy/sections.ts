import { s, type Schema } from '@/lib/ai/schema';
import type { ViewBlock } from '@/lib/view';

export const STRATEGY_PROMPT_VERSION = 'strategy-v1';

const effort = () => s.enum(['Low', 'Medium', 'High'], 'Relative effort for a small team');
const basis = s.basis;

export const personaSchema: Schema = s.obj({
  name: s.short('A memorable label for this persona, e.g. "The overloaded office manager"', 80),
  role: s.short('Role, life stage or situation', 160),
  context: s.text('Their situation when they would look for this offer', 600),
  goals: s.arr(s.short('A goal in their words', 200), 2, 4, 'What they are trying to achieve'),
  frustrations: s.arr(s.short('A frustration or pain', 200), 2, 4, 'What gets in the way today'),
  triggers: s.arr(s.short('An event that makes them start looking', 200), 1, 3, 'Buying triggers'),
  objections: s.arr(s.short('A reason they might hesitate', 200), 1, 3, 'Objections'),
  where_to_reach: s.arr(s.short('A specific place or channel', 160), 1, 4, 'Where they can be reached'),
  message_that_lands: s.short('One sentence that would resonate with them', 240),
  basis: basis(),
  validate_by: s.short('How to check this persona with real customers', 240),
});

export const personaView: ViewBlock[] = [
  { kind: 'fields', fields: [{ key: 'role', label: 'Who they are' }, { key: 'context', label: 'Situation' }] },
  {
    kind: 'fields',
    fields: [
      { key: 'goals', label: 'Goals' },
      { key: 'frustrations', label: 'Frustrations' },
      { key: 'triggers', label: 'Buying triggers' },
      { key: 'objections', label: 'Objections' },
      { key: 'where_to_reach', label: 'Where to reach them' },
      { key: 'message_that_lands', label: 'Message that lands' },
      { key: 'validate_by', label: 'How to validate' },
    ],
  },
];

export type SectionDef = {
  key: string;
  title: string;
  /** One line for the table of contents and loading state. */
  summary: string;
  schema: (opts: { personaCount: number }) => Schema;
  task: string;
  view: ViewBlock[];
  maxTokens?: number;
};

export const SECTIONS: SectionDef[] = [
  {
    key: 'context',
    title: 'Business context and goals',
    summary: 'What you told us, restated plainly, plus the questions still open.',
    schema: () =>
      s.obj({
        summary: s.text('Two to four sentences restating the business and situation in plain language', 800),
        goals: s.arr(
          s.obj({ goal: s.short('A goal the owner stated or clearly implied', 200), success_looks_like: s.short('A measurable signal of success', 200) }),
          1,
          4,
          'Goals',
        ),
        constraints: s.arr(s.short('A constraint to respect', 200), 0, 6, 'Constraints stated by the owner'),
        open_questions: s.arr(s.short('A question whose answer would sharpen this strategy', 200), 2, 6, 'Open questions'),
      }),
    task: 'Restate the business context and goals. Only include goals and constraints the user stated or that follow directly from what they stated. List the open questions that matter most.',
    view: [
      { kind: 'text', key: 'summary' },
      { kind: 'cards', key: 'goals', label: 'Goals', title: 'goal', fields: [{ key: 'success_looks_like', label: 'Success looks like' }] },
      { kind: 'list', key: 'constraints', label: 'Constraints' },
      { kind: 'list', key: 'open_questions', label: 'Open questions' },
    ],
  },
  {
    key: 'audience',
    title: 'Audience and personas',
    summary: 'Who is most likely to buy first, as hypotheses to test.',
    schema: ({ personaCount }) =>
      s.obj({
        segments: s.arr(
          s.obj({
            name: s.short('Segment name', 100),
            description: s.text('Who is in it and why they need this', 400),
            priority: s.enum(['Primary', 'Secondary', 'Later'], 'Recommended priority'),
            rationale: s.short('Why this priority', 300),
            basis: basis(),
          }),
          2,
          4,
          'Audience segments',
        ),
        personas: s.arr(personaSchema, personaCount, personaCount, 'Persona hypotheses, one per likely buyer type'),
        caveat: s.short('A short reminder of what these personas cannot tell you', 240),
      }),
    task: 'Propose audience segments and persona hypotheses. Personas are hypotheses built from the brief, not research findings. Make each persona meaningfully different.',
    view: [
      {
        kind: 'cards',
        key: 'segments',
        label: 'Segments',
        title: 'name',
        body: 'description',
        badges: [
          { key: 'priority', label: 'Priority' },
          { key: 'basis', label: 'Basis' },
        ],
        fields: [{ key: 'rationale', label: 'Why' }],
      },
      { kind: 'text', key: 'caveat' },
    ],
    maxTokens: 6000,
  },
  {
    key: 'positioning',
    title: 'Positioning and value proposition',
    summary: 'The space you own in a buyer’s mind, and why it is believable.',
    schema: () =>
      s.obj({
        category: s.short('The category buyers would put this in', 160),
        target: s.short('The specific customer this is for', 240),
        problem: s.short('The problem in the customer’s words', 300),
        current_alternative: s.short('What they do today instead', 240),
        differentiator: s.short('What is meaningfully different', 300),
        value_proposition: s.short('One-sentence value proposition', 240),
        positioning_statement: s.text('A classic positioning statement (For… who… our… unlike…)', 600),
        proof_points: s.arr(
          s.obj({ point: s.short('Evidence that makes the claim believable', 240), basis: basis(), how_to_strengthen: s.short('How to make it more convincing', 240) }),
          2,
          5,
          'Proof points',
        ),
        risks: s.arr(s.short('Where this positioning could fail', 240), 1, 3, 'Positioning risks'),
      }),
    task: 'Define positioning and a value proposition. Proof points must come from what the user stated; when evidence is missing, say what evidence to gather.',
    view: [
      {
        kind: 'fields',
        fields: [
          { key: 'value_proposition', label: 'Value proposition' },
          { key: 'target', label: 'For' },
          { key: 'problem', label: 'Problem' },
          { key: 'current_alternative', label: 'Instead of' },
          { key: 'differentiator', label: 'Difference' },
          { key: 'category', label: 'Category' },
        ],
      },
      { kind: 'text', key: 'positioning_statement', label: 'Positioning statement' },
      {
        kind: 'cards',
        key: 'proof_points',
        label: 'Proof points',
        title: 'point',
        badges: [{ key: 'basis', label: 'Basis' }],
        fields: [{ key: 'how_to_strengthen', label: 'Strengthen it' }],
      },
      { kind: 'list', key: 'risks', label: 'Risks' },
    ],
  },
  {
    key: 'brand',
    title: 'Brand direction and messaging',
    summary: 'How to sound, and the messages each audience should hear.',
    schema: () =>
      s.obj({
        personality: s.arr(s.short('A brand trait with a one-line explanation', 200), 3, 5, 'Brand personality traits'),
        voice_do: s.arr(s.short('A voice guideline to follow', 200), 3, 5, 'Voice: do'),
        voice_avoid: s.arr(s.short('A voice habit to avoid', 200), 3, 5, 'Voice: avoid'),
        key_messages: s.arr(
          s.obj({ audience: s.short('Which segment or persona', 120), message: s.short('The core message for them', 280), support: s.short('What backs it up', 240) }),
          2,
          5,
          'Key messages',
        ),
        words_to_use: s.arr(s.short('A word or phrase customers would use', 60), 4, 10, 'Customer vocabulary to use'),
      }),
    task: 'Define brand personality, voice guidelines and key messages per audience.',
    view: [
      { kind: 'list', key: 'personality', label: 'Personality' },
      { kind: 'list', key: 'voice_do', label: 'Voice: do' },
      { kind: 'list', key: 'voice_avoid', label: 'Voice: avoid' },
      { kind: 'cards', key: 'key_messages', label: 'Key messages', title: 'audience', body: 'message', fields: [{ key: 'support', label: 'Support' }] },
      { kind: 'list', key: 'words_to_use', label: 'Words to use' },
    ],
  },
  {
    key: 'copy',
    title: 'Marketing copy drafts',
    summary: 'First drafts to edit, not final copy.',
    schema: () =>
      s.obj({
        headlines: s.arr(s.short('A homepage headline option', 120), 3, 6, 'Headline options'),
        subheadline: s.short('Supporting line under the headline', 240),
        calls_to_action: s.arr(s.short('A call to action label', 40), 3, 5, 'Call to action options'),
        short_pitch: s.text('A 50–80 word description for directories, bios, or intros', 600),
        email_subject_lines: s.arr(s.short('An outreach or newsletter subject line', 90), 3, 6, 'Email subject lines'),
        ad_drafts: s.arr(
          s.obj({ channel: s.short('Channel', 40), headline: s.short('Ad headline', 90), body: s.short('Ad body', 300) }),
          2,
          4,
          'Ad drafts',
        ),
      }),
    task: 'Write first-draft marketing copy in the brand voice. Never include unverifiable claims such as "#1", "best", or specific results.',
    view: [
      { kind: 'list', key: 'headlines', label: 'Headlines' },
      { kind: 'text', key: 'subheadline', label: 'Subheadline' },
      { kind: 'list', key: 'calls_to_action', label: 'Calls to action' },
      { kind: 'text', key: 'short_pitch', label: 'Short pitch' },
      { kind: 'list', key: 'email_subject_lines', label: 'Email subject lines' },
      { kind: 'cards', key: 'ad_drafts', label: 'Ad drafts', title: 'headline', body: 'body', badges: [{ key: 'channel', label: 'Channel' }], grid: true },
    ],
  },
  {
    key: 'channels',
    title: 'Channel recommendations',
    summary: 'Where to show up first, and why.',
    schema: () =>
      s.obj({
        channels: s.arr(
          s.obj({
            channel: s.short('Channel name', 60),
            role: s.enum(['Primary', 'Supporting', 'Test', 'Not now'], 'Role in the plan'),
            rationale: s.short('Why it fits this business, audience and budget', 320),
            effort: effort(),
            cost: s.enum(['Time only', 'Low', 'Medium', 'High'], 'Expected spend level'),
            first_step: s.short('A concrete first step this week', 240),
          }),
          4,
          7,
          'Channels',
        ),
        why_not: s.short('One channel that seems obvious but should wait, and why', 300),
      }),
    task: 'Recommend channels given the budget, stage, audience and current channels. Include at least one "Not now" channel when relevant.',
    view: [
      {
        kind: 'cards',
        key: 'channels',
        title: 'channel',
        body: 'rationale',
        badges: [
          { key: 'role', label: 'Role' },
          { key: 'effort', label: 'Effort' },
          { key: 'cost', label: 'Cost' },
        ],
        fields: [{ key: 'first_step', label: 'First step' }],
      },
      { kind: 'text', key: 'why_not', label: 'Not yet' },
    ],
  },
  {
    key: 'offer',
    title: 'Offer critique and transformation',
    summary: 'What the customer gets, and what might stop them buying.',
    schema: () =>
      s.obj({
        transformation: s.obj({
          before: s.short('The customer’s situation before', 280),
          after: s.short('The situation after', 280),
          how: s.short('How the offer gets them there', 280),
        }),
        critique: s.arr(
          s.obj({ observation: s.short('Something about the offer that could hold sales back', 280), suggestion: s.short('A specific change to consider', 280) }),
          2,
          5,
          'Critique',
        ),
        objections: s.arr(
          s.obj({ objection: s.short('A likely objection', 200), response: s.short('How to address it honestly', 280) }),
          2,
          5,
          'Objections and responses',
        ),
        risk_reversal: s.short('A risk-reversal idea that fits this business, without promising outcomes', 280),
      }),
    task: 'Critique the offer as described, describe the customer transformation, and handle objections honestly.',
    view: [
      {
        kind: 'fields',
        key: 'transformation',
        label: 'Customer transformation',
        fields: [
          { key: 'before', label: 'Before' },
          { key: 'after', label: 'After' },
          { key: 'how', label: 'How' },
        ],
      },
      { kind: 'cards', key: 'critique', label: 'Critique', title: 'observation', fields: [{ key: 'suggestion', label: 'Try' }] },
      { kind: 'table', key: 'objections', label: 'Objections', columns: [{ key: 'objection', label: 'Objection' }, { key: 'response', label: 'Response' }] },
      { kind: 'text', key: 'risk_reversal', label: 'Risk reversal' },
    ],
  },
  {
    key: 'kpis',
    title: 'KPIs and measurement plan',
    summary: 'What to measure, how, and how often.',
    schema: () =>
      s.obj({
        north_star: s.obj({ metric: s.short('The single most important metric right now', 120), why: s.short('Why it matters at this stage', 280) }),
        kpis: s.arr(
          s.obj({
            name: s.short('KPI', 80),
            definition: s.short('Exactly what is counted', 240),
            formula: s.short('How to calculate it', 160),
            cadence: s.enum(['Weekly', 'Monthly', 'Quarterly'], 'Review cadence'),
            source: s.short('Where the data comes from', 160),
          }),
          3,
          6,
          'KPIs',
        ),
        setup_steps: s.arr(s.short('A measurement setup step', 240), 2, 5, 'Measurement setup'),
      }),
    task: 'Define a north-star metric and KPIs with exact definitions and formulas. Do not set numeric targets unless the user supplied a baseline; instead explain how to set one.',
    view: [
      { kind: 'fields', key: 'north_star', label: 'North-star metric', fields: [{ key: 'metric', label: 'Metric' }, { key: 'why', label: 'Why' }] },
      {
        kind: 'table',
        key: 'kpis',
        label: 'KPIs',
        columns: [
          { key: 'name', label: 'KPI' },
          { key: 'definition', label: 'Definition' },
          { key: 'formula', label: 'Formula' },
          { key: 'cadence', label: 'Cadence' },
          { key: 'source', label: 'Source' },
        ],
      },
      { kind: 'list', key: 'setup_steps', label: 'Setup', ordered: true },
    ],
  },
  {
    key: 'portfolio',
    title: 'Product and offer portfolio',
    summary: 'Ways to package what you sell for different buyers.',
    schema: () =>
      s.obj({
        current_offer: s.short('The current offer as understood from the brief', 300),
        ideas: s.arr(
          s.obj({
            idea: s.short('A packaging, pricing-structure, or adjacent-offer idea', 200),
            who_its_for: s.short('Which customer it serves', 160),
            rationale: s.short('Why it could work', 280),
            risk: s.short('The main risk', 200),
          }),
          2,
          5,
          'Portfolio ideas',
        ),
      }),
    task: 'Suggest offer packaging and portfolio ideas (entry offers, bundles, tiers, add-ons). Do not suggest specific prices; describe structure instead.',
    view: [
      { kind: 'text', key: 'current_offer', label: 'Current offer' },
      { kind: 'cards', key: 'ideas', title: 'idea', body: 'rationale', fields: [{ key: 'who_its_for', label: 'For' }, { key: 'risk', label: 'Risk' }] },
    ],
  },
  {
    key: 'journey',
    title: 'Customer journey and funnel',
    summary: 'Each stage from first contact to repeat purchase, with the friction to remove.',
    schema: () =>
      s.obj({
        stages: s.arr(
          s.obj({
            stage: s.short('Stage name', 60),
            customer_goal: s.short('What the customer is trying to do here', 200),
            touchpoints: s.short('Where this happens', 200),
            friction: s.short('What likely slows them down', 200),
            improvement: s.short('A specific improvement', 240),
          }),
          4,
          6,
          'Journey stages',
        ),
        biggest_leak: s.short('The stage most likely losing the most customers, and why', 300),
      }),
    task: 'Map the customer journey from awareness to retention or referral, and identify the friction to fix first.',
    view: [
      {
        kind: 'table',
        key: 'stages',
        columns: [
          { key: 'stage', label: 'Stage' },
          { key: 'customer_goal', label: 'Customer goal' },
          { key: 'friction', label: 'Friction' },
          { key: 'improvement', label: 'Improvement' },
        ],
      },
      { kind: 'text', key: 'biggest_leak', label: 'Fix first' },
    ],
  },
  {
    key: 'actions',
    title: 'Prioritized experiments and action plan',
    summary: 'What to do first, with a way to tell if it worked.',
    schema: () =>
      s.obj({
        experiments: s.arr(
          s.obj({
            title: s.short('Experiment or action', 120),
            channel: s.short('Channel or area', 60),
            reason: s.short('Why this, why now', 280),
            effort: effort(),
            dependencies: s.arr(s.short('Something needed first', 120), 0, 3, 'Dependencies'),
            test_metric: s.short('What to measure', 160),
            success_signal: s.short('What result would mean "keep going", stated relative to a baseline', 200),
            timeframe: s.enum(['1 week', '2 weeks', '30 days', '60 days', '90 days'], 'How long to run it'),
            priority: s.enum(['Now', 'Next', 'Later'], 'Priority'),
          }),
          5,
          8,
          'Experiments in priority order',
        ),
        first_week: s.arr(s.short('A concrete task for the first week', 200), 3, 6, 'First week checklist'),
      }),
    task: 'Turn the strategy into prioritized experiments. Each needs a reason, effort, dependencies, and a measurable test. Order by expected impact relative to effort for this business.',
    view: [
      {
        kind: 'cards',
        key: 'experiments',
        title: 'title',
        body: 'reason',
        badges: [
          { key: 'priority', label: 'Priority' },
          { key: 'effort', label: 'Effort' },
          { key: 'timeframe', label: 'Run for' },
          { key: 'channel', label: 'Channel' },
        ],
        fields: [
          { key: 'test_metric', label: 'Measure' },
          { key: 'success_signal', label: 'Keep going if' },
          { key: 'dependencies', label: 'Needs first' },
        ],
      },
      { kind: 'list', key: 'first_week', label: 'First week', ordered: true },
    ],
    maxTokens: 6000,
  },
];

export const SECTION_BY_KEY = Object.fromEntries(SECTIONS.map((sec) => [sec.key, sec]));
