import { s } from '@/lib/ai/schema';
import { personaSchema, personaView } from '@/lib/strategy/sections';
import { F } from '../fields';
import type { AiTool } from '../types';

export const audienceTools: AiTool[] = [
  {
    kind: 'ai',
    slug: 'target-audience-generator',
    name: 'Target Audience Generator',
    category: 'audience',
    summary: 'Audience segments ranked by fit, with the reasoning and a way to test each.',
    answer:
      'The Target Audience Generator proposes three to five audience segments for your business, explains why each might buy, ranks them by how good a first target they are, and suggests how to check each hypothesis with real people.',
    fields: [F.business(), F.audience(false, 'Who buys from you today?'), F.text('region', 'Where are your customers?', { placeholder: 'e.g. Orlando, or online worldwide' })],
    examples: [
      {
        label: 'Bookkeeping service',
        values: {
          business: 'Monthly bookkeeping and payroll for small construction and trade businesses, done remotely with a dedicated bookkeeper.',
          audience: 'A few plumbing and electrical contractors',
          region: 'Texas',
        },
      },
    ],
    outputLabel: 'Audience segments',
    schema: s.obj({
      segments: s.arr(
        s.obj({
          name: s.short('Segment name', 100),
          who: s.short('Who is in it', 260),
          need: s.short('The need or trigger that makes them buy', 260),
          where: s.short('Where to reach them', 200),
          priority: s.enum(['First', 'Second', 'Later'], 'Recommended order'),
          rationale: s.short('Why this order', 240),
          test: s.short('How to test this segment cheaply', 240),
          basis: s.basis(),
        }),
        3,
        5,
        'Segments in priority order',
      ),
      not_for: s.short('Who this business is probably not for, and why that is useful', 260),
    }),
    view: [
      {
        kind: 'cards',
        key: 'segments',
        title: 'name',
        body: 'who',
        badges: [
          { key: 'priority', label: 'Priority' },
          { key: 'basis', label: 'Basis' },
        ],
        fields: [
          { key: 'need', label: 'Need' },
          { key: 'where', label: 'Where to reach them' },
          { key: 'rationale', label: 'Why this order' },
          { key: 'test', label: 'Test it' },
        ],
      },
      { kind: 'text', key: 'not_for', label: 'Probably not for' },
    ],
    task: 'Propose audience segments as hypotheses. Rank them by how attractive they are as a first target (reachable, urgent need, able to pay). Include how to test each.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Segments are hypotheses from your description, not research findings.'],
    related: ['user-persona-generator', 'niche-finder', 'value-proposition-generator'],
  },
  {
    kind: 'ai',
    slug: 'user-persona-generator',
    name: 'User Persona Generator',
    category: 'audience',
    summary: 'Persona hypotheses with goals, frustrations, triggers and where to find them.',
    answer:
      'The User Persona Generator creates three persona hypotheses from your business description and target audience: their situation, goals, frustrations, buying triggers, objections and where to reach them. Use them to plan interviews, not to replace them.',
    fields: [F.business(), F.audience(true, 'Who is your target audience?')],
    examples: [
      {
        label: 'Language tutoring app',
        values: {
          business: 'An app that pairs adults with native-speaker tutors for 15-minute conversation sessions, booked on demand.',
          audience: 'Working adults learning Spanish for work or family',
        },
      },
    ],
    outputLabel: 'Three persona hypotheses',
    schema: s.obj({ personas: s.arr(personaSchema, 3, 3, 'Three distinct personas') }),
    view: [{ kind: 'cards', key: 'personas', title: 'name', body: 'context', badges: [{ key: 'basis', label: 'Basis' }], fields: personaView.flatMap((b) => (b.kind === 'fields' ? b.fields : [])).filter((f) => f.key !== 'context') }],
    task: 'Create three meaningfully different persona hypotheses for the target audience. Mark basis "provided" only for details the user stated.',
    subjectField: 'audience',
    promptVersion: 'v1',
    limitations: ['Personas are hypotheses. Talk to five real customers before relying on them.'],
    related: ['target-audience-generator', 'value-proposition-generator', 'content-ideas-generator'],
  },
  {
    kind: 'ai',
    slug: 'niche-finder',
    name: 'Niche Finder',
    category: 'audience',
    summary: 'Narrower niches worth testing, with signals that a niche is real.',
    answer:
      'The Niche Finder takes a broad business or skill and proposes narrower niches where you could stand out, each with the reasoning, the risks, and the signals that would show the niche is worth pursuing.',
    fields: [
      F.area('broad', 'Your broad market or skill', { required: true, min: 10, placeholder: 'e.g. web design, fitness coaching, accounting' }),
      F.text('strengths', 'Experience or advantages you have', { max: 400 }),
      F.select('preference', 'Preference', ['Fastest to first revenue', 'Highest price per customer', 'Most enjoyable for me', 'Least competition']),
    ],
    examples: [{ label: 'Web designer', values: { broad: 'Website design and development', strengths: 'Ten years in hospitality before switching careers', preference: 'Fastest to first revenue' } }],
    outputLabel: 'Niche hypotheses',
    schema: s.obj({
      niches: s.arr(
        s.obj({
          niche: s.short('A specific niche', 120),
          why: s.short('Why it could work for this person', 260),
          customer_pain: s.short('A pain this niche has', 220),
          risk: s.short('The main risk', 200),
          validation_signals: s.arr(s.short('A signal that would show the niche is real', 180), 2, 3, 'Validation signals'),
          first_step: s.short('How to start testing', 220),
        }),
        5,
        7,
        'Niches',
      ),
    }),
    view: [
      {
        kind: 'cards',
        key: 'niches',
        title: 'niche',
        body: 'why',
        fields: [
          { key: 'customer_pain', label: 'Pain' },
          { key: 'risk', label: 'Risk' },
          { key: 'validation_signals', label: 'Signals to look for' },
          { key: 'first_step', label: 'Start with' },
        ],
      },
    ],
    task: 'Propose specific niches within the broad market that suit the person’s strengths and preference. Never cite market size numbers; give qualitative validation signals instead.',
    subjectField: 'broad',
    promptVersion: 'v1',
    limitations: ['No market data is used; niches are judged qualitatively.'],
    related: ['target-audience-generator', 'business-ideas-generator', 'market-size-calculator'],
  },
];

export const brandTools: AiTool[] = [
  {
    kind: 'ai',
    slug: 'business-name-generator',
    name: 'Business Name Generator',
    category: 'branding',
    summary: 'A varied shortlist of names with the thinking behind each one.',
    answer:
      'The Business Name Generator produces a shortlist of names in several styles (descriptive, invented, metaphor, compound), explains the idea behind each, and notes possible drawbacks. It does not check domain, trademark or social handle availability.',
    fields: [
      F.business(),
      F.text('feel', 'How should the name feel?', { placeholder: 'e.g. calm, trustworthy, a bit nerdy' }),
      F.text('avoid', 'Words or styles to avoid', { max: 200 }),
    ],
    examples: [{ label: 'Plant care subscription', values: { business: 'A monthly subscription that sends indoor plant care supplies and a care calendar matched to your plants.', feel: 'Fresh, friendly, a little clever', avoid: 'Puns on "leaf"' } }],
    outputLabel: 'Name shortlist',
    schema: s.obj({
      names: s.arr(
        s.obj({
          name: s.short('The name', 40),
          style: s.enum(['Descriptive', 'Invented', 'Metaphor', 'Compound', 'Founder or place', 'Acronym'], 'Naming style'),
          idea: s.short('The thinking behind it', 200),
          watch_out: s.short('A possible drawback', 160),
        }),
        12,
        15,
        'Names',
      ),
      next_steps: s.arr(s.short('A step to check a name before using it', 160), 3, 4, 'Before you choose'),
    }),
    view: [
      { kind: 'cards', key: 'names', title: 'name', body: 'idea', badges: [{ key: 'style', label: 'Style' }], fields: [{ key: 'watch_out', label: 'Watch out' }], grid: true },
      { kind: 'list', key: 'next_steps', label: 'Before you choose' },
    ],
    task: 'Generate a varied naming shortlist across styles. Never claim a name or domain is available or unregistered.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Availability of domains, trademarks and handles is not checked.'],
    related: ['slogan-generator', 'mission-statement-generator', 'elevator-pitch-generator'],
  },
  {
    kind: 'ai',
    slug: 'slogan-generator',
    name: 'Slogan Generator',
    category: 'branding',
    summary: 'Distinct slogan options, each built on a different idea.',
    answer:
      'The Slogan Generator writes short slogans for your business, each built on a different angle (the benefit, the feeling, the customer, the contrast), so you are choosing between ideas rather than synonyms.',
    fields: [F.business(), F.audience(false), F.tone()],
    examples: [{ label: 'Coffee roaster', values: { business: 'A small-batch coffee roaster that ships beans within 48 hours of roasting, with tasting notes for each batch.', audience: 'Home espresso enthusiasts', tone: 'Confident' } }],
    outputLabel: 'Slogan options',
    schema: s.obj({
      slogans: s.arr(s.obj({ text: s.short('The slogan, under 10 words', 90), angle: s.short('The idea it leans on', 140), best_for: s.short('Where it would work best', 120) }), 8, 10, 'Slogans'),
    }),
    view: [{ kind: 'cards', key: 'slogans', title: 'text', body: 'angle', fields: [{ key: 'best_for', label: 'Best for' }], grid: true }],
    task: 'Write short, memorable slogans. Each must rest on a different angle. Avoid clichés and unverifiable superlatives.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Check that a slogan is not already used by someone else in your market.'],
    related: ['business-name-generator', 'value-proposition-generator', 'title-generator'],
  },
  {
    kind: 'ai',
    slug: 'mission-statement-generator',
    name: 'Mission Statement Generator',
    category: 'branding',
    summary: 'Clear mission drafts in a few lengths, without the corporate filler.',
    answer:
      'The Mission Statement Generator writes mission statements that say who you serve, what you do for them, and why it matters, in plain language, in short, medium and long versions.',
    fields: [F.business(), F.audience(false), F.area('values', 'What do you care about?', { max: 500, placeholder: 'e.g. honest pricing, local suppliers, teaching not just doing' })],
    examples: [{ label: 'Kids coding school', values: { business: 'After-school coding classes for ages 9–14, taught in small groups with projects the kids choose.', audience: 'Parents of curious kids', values: 'Confidence over grades, making real things, patient teaching' } }],
    outputLabel: 'Mission statement drafts',
    schema: s.obj({
      drafts: s.arr(s.obj({ length: s.enum(['One line', 'Short', 'Full'], 'Length'), text: s.text('The mission statement', 600), note: s.short('What this version emphasizes', 160) }), 4, 6, 'Drafts'),
      vision: s.short('An optional vision line describing the future you want to help create', 240),
    }),
    view: [
      { kind: 'cards', key: 'drafts', title: 'text', badges: [{ key: 'length', label: 'Length' }], fields: [{ key: 'note', label: 'Emphasizes' }] },
      { kind: 'text', key: 'vision', label: 'A vision line, if you want one' },
    ],
    task: 'Write plain-language mission statements of varying lengths. No buzzwords like "synergy", "best-in-class" or "leverage".',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['A mission only means something if it guides real decisions. Edit it until it is true.'],
    related: ['value-proposition-generator', 'elevator-pitch-generator', 'slogan-generator'],
  },
  {
    kind: 'ai',
    slug: 'value-proposition-generator',
    name: 'Value Proposition Generator',
    category: 'branding',
    summary: 'Value proposition options with the reasoning and the proof each one needs.',
    answer:
      'The Value Proposition Generator writes several value propositions for your offer, each aimed at a specific customer and problem, and lists what proof you would need for customers to believe it.',
    fields: [F.business(), F.audience(true), F.text('alternative', 'What do customers use today instead?', { max: 300 })],
    examples: [{ label: 'HR software', values: { business: 'Simple onboarding checklists for restaurants: new hires get their paperwork, training videos and first-week schedule on their phone.', audience: 'Restaurant general managers with high staff turnover', alternative: 'Paper binders and group texts' } }],
    outputLabel: 'Value proposition options',
    schema: s.obj({
      options: s.arr(
        s.obj({
          headline: s.short('The value proposition in one line', 140),
          subhead: s.short('A supporting sentence', 240),
          for_whom: s.short('Who it is for', 140),
          reasoning: s.short('Why it should resonate', 240),
          proof_needed: s.short('Evidence that would make it believable', 220),
        }),
        4,
        6,
        'Options',
      ),
    }),
    view: [
      {
        kind: 'cards',
        key: 'options',
        title: 'headline',
        body: 'subhead',
        fields: [
          { key: 'for_whom', label: 'For' },
          { key: 'reasoning', label: 'Why' },
          { key: 'proof_needed', label: 'Proof needed' },
        ],
      },
    ],
    task: 'Write distinct value propositions anchored on the customer’s problem and the alternative they use today. Never imply proof the user did not provide.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Test the strongest options on real customers or a landing page.'],
    related: ['landing-page-generator', 'elevator-pitch-generator', 'headline-analyzer'],
  },
  {
    kind: 'ai',
    slug: 'elevator-pitch-generator',
    name: 'Elevator Pitch Generator',
    category: 'branding',
    summary: 'Pitches at the length you need, from one sentence to sixty seconds.',
    answer:
      'The Elevator Pitch Generator writes a pitch for your business at the length you choose, adapted to who you are talking to, plus a follow-up question that keeps the conversation going.',
    fields: [
      F.business(),
      F.select('listener', 'Who are you pitching to?', ['A potential customer', 'An investor', 'A potential partner', 'Someone at a networking event', 'A journalist']),
      F.select('length', 'Length', ['One sentence', '30 seconds', '60 seconds']),
    ],
    examples: [{ label: 'Cleaning service', values: { business: 'Eco-friendly office cleaning for small offices, scheduled after hours, using fragrance-free products.', listener: 'A potential customer', length: '30 seconds' } }],
    outputLabel: 'Elevator pitches',
    schema: s.obj({
      pitches: s.arr(s.obj({ angle: s.short('The angle of this version', 80), pitch: s.text('The pitch at the requested length', 900) }), 3, 3, 'Three versions'),
      follow_up_question: s.short('A question to ask the listener afterwards', 200),
      tips: s.arr(s.short('A delivery tip', 160), 2, 3, 'Delivery tips'),
    }),
    view: [
      { kind: 'cards', key: 'pitches', title: 'angle', body: 'pitch' },
      { kind: 'text', key: 'follow_up_question', label: 'Then ask' },
      { kind: 'list', key: 'tips', label: 'Delivery' },
    ],
    task: 'Write three pitch versions at the requested length for the stated listener. Natural spoken language, no jargon.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Read it aloud and cut anything you would not naturally say.'],
    related: ['value-proposition-generator', 'mission-statement-generator', 'copywriting-generator'],
  },
  {
    kind: 'ai',
    slug: 'business-jargon-generator',
    name: 'Business Jargon Generator',
    category: 'branding',
    summary: 'A playful tool that turns plain sentences into corporate jargon, and back.',
    answer:
      'The Business Jargon Generator is a light-hearted tool: it rewrites a plain sentence in exaggerated corporate jargon, then gives a clean plain-English version so you can see what to avoid in your own writing.',
    fields: [
      F.area('text', 'Your sentence', { required: true, min: 5, max: 500, placeholder: 'e.g. We fixed the bug and the app is faster now.' }),
      F.select('intensity', 'Jargon level', ['Mild', 'Consultant', 'Keynote']),
    ],
    examples: [{ label: 'Lunch', values: { text: 'Let’s grab lunch and talk about the new website.', intensity: 'Consultant' } }],
    outputLabel: 'Jargon translation',
    schema: s.obj({
      jargon: s.text('The sentence rewritten in over-the-top jargon', 700),
      plain: s.short('The clearest plain-English version', 300),
      phrases_to_avoid: s.arr(s.short('A jargon phrase used, with what it actually means', 160), 3, 6, 'Phrases to avoid'),
    }),
    view: [
      { kind: 'text', key: 'jargon', label: 'In jargon' },
      { kind: 'text', key: 'plain', label: 'In plain English' },
      { kind: 'list', key: 'phrases_to_avoid', label: 'Phrases to avoid' },
    ],
    task: 'This is a humor tool. Exaggerate corporate jargon at the requested intensity, keep it good-natured, then provide the clearest plain version.',
    subjectField: 'text',
    promptVersion: 'v1',
    limitations: ['For fun. Please do not send the jargon version to customers.'],
    related: ['copywriting-generator', 'headline-analyzer', 'elevator-pitch-generator'],
  },
];
