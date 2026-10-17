import { s } from '@/lib/ai/schema';
import { F, PLATFORMS_ADS, STAGES } from '../fields';
import type { AiTool } from '../types';

export const advertisingTools: AiTool[] = [
  {
    kind: 'ai',
    slug: 'ad-generator',
    name: 'Ad Generator',
    category: 'advertising',
    summary: 'Ad copy variants formatted for the platform you advertise on.',
    answer:
      'The Ad Generator writes several ad variants for one offer on the platform you choose, using that platform’s text fields (for example headlines and descriptions for search ads, primary text for social ads), each testing a different angle.',
    fields: [
      F.business('What are you advertising?', 'The product or offer, and what someone gets.'),
      F.audience(true),
      F.select('platform', 'Platform', PLATFORMS_ADS),
      F.text('offer', 'Offer or call to action', { max: 160, placeholder: 'e.g. free first lesson, 20% off first order' }),
    ],
    examples: [
      {
        label: 'Swim lessons',
        values: {
          business: 'Small-group swim lessons for kids aged 4–10 in a heated indoor pool, max four kids per instructor.',
          audience: 'Parents of young children nearby',
          platform: 'Meta (Facebook and Instagram)',
          offer: 'Book a free trial lesson',
        },
      },
    ],
    outputLabel: 'Ad variants',
    schema: s.obj({
      variants: s.arr(
        s.obj({
          angle: s.short('The angle this variant tests', 100),
          headline: s.short('Headline (respect the platform’s typical length)', 90),
          primary_text: s.text('Main ad text', 500),
          description: s.short('Secondary line or description, if the platform uses one', 120),
          cta_button: s.short('Call-to-action button label', 30),
        }),
        4,
        6,
        'Variants',
      ),
      test_plan: s.short('How to test these variants against each other', 300),
      compliance_notes: s.arr(s.short('A platform policy or claim to double-check', 200), 1, 3, 'Check before running'),
    }),
    view: [
      {
        kind: 'cards',
        key: 'variants',
        title: 'headline',
        body: 'primary_text',
        badges: [{ key: 'angle', label: 'Angle' }],
        fields: [
          { key: 'description', label: 'Description' },
          { key: 'cta_button', label: 'Button' },
        ],
        grid: true,
      },
      { kind: 'text', key: 'test_plan', label: 'How to test' },
      { kind: 'list', key: 'compliance_notes', label: 'Check before running' },
    ],
    task: 'Write ad variants matched to the platform’s formats. Each variant tests one angle (pain, outcome, social context, objection, offer). No unverifiable claims or invented results.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Platform character limits and policies change; check them in the ad manager.', 'Vantaro does not publish ads.'],
    related: ['landing-page-generator', 'headline-analyzer', 'copywriting-generator'],
  },
  {
    kind: 'ai',
    slug: 'copywriting-generator',
    name: 'Copywriting Generator',
    category: 'advertising',
    summary: 'Marketing drafts for a specific job: emails, web sections, announcements and more.',
    answer:
      'The Copywriting Generator drafts marketing copy for the specific job you pick, such as a homepage section, a promotional email, an announcement or a service description, in your tone and with a clear call to action.',
    fields: [
      F.select('job', 'What do you need?', ['Homepage hero section', 'Promotional email', 'Service or product page section', 'Announcement', 'About us section', 'Text message promotion', 'Flyer copy']),
      F.business(),
      F.text('key_points', 'Points that must be included', { max: 400 }),
      F.tone(),
    ],
    examples: [
      {
        label: 'Promo email',
        values: {
          job: 'Promotional email',
          business: 'A family-owned garden center with a café, known for native plants and knowledgeable staff.',
          key_points: 'Native plant weekend sale, free planting workshop Saturday 10am',
          tone: 'Warm and friendly',
        },
      },
    ],
    outputLabel: 'Copy drafts',
    schema: s.obj({
      drafts: s.arr(s.obj({ label: s.short('Short name for this version', 60), subject_or_headline: s.short('Subject line or headline', 120), body: s.text('The copy', 1800), cta: s.short('Call to action', 60) }), 2, 3, 'Drafts'),
      editing_notes: s.arr(s.short('What to personalize before using', 160), 2, 4, 'Before you use it'),
    }),
    view: [
      { kind: 'cards', key: 'drafts', title: 'subject_or_headline', body: 'body', badges: [{ key: 'label', label: 'Version' }], fields: [{ key: 'cta', label: 'Call to action' }] },
      { kind: 'list', key: 'editing_notes', label: 'Before you use it' },
    ],
    task: 'Write the requested copy in the stated tone. Include every required point. Mark any placeholder the owner must fill in with [square brackets].',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Replace any [bracketed] placeholders with your real details.'],
    related: ['ad-generator', 'landing-page-generator', 'product-description-generator'],
  },
  {
    kind: 'ai',
    slug: 'landing-page-generator',
    name: 'Landing Page Generator',
    category: 'advertising',
    summary: 'A landing page structure with editable copy for every section.',
    answer:
      'The Landing Page Generator plans a single-purpose landing page: the section order, the job each section does, and draft copy for each, from headline to final call to action, plus the proof you should add.',
    fields: [
      F.business('What is the page selling or offering?'),
      F.audience(true),
      F.select('goal', 'Page goal', ['Book a call or appointment', 'Start a free trial', 'Buy a product', 'Join a waitlist', 'Download a lead magnet', 'Request a quote']),
      F.text('traffic', 'Where will visitors come from?', { max: 160, placeholder: 'e.g. Google search ads, Instagram' }),
    ],
    examples: [
      {
        label: 'Quote request',
        values: {
          business: 'Custom closet and garage storage systems, designed in a free in-home consultation and installed in one day.',
          audience: 'Homeowners in their 30s–50s with crowded garages',
          goal: 'Request a quote',
          traffic: 'Google search ads',
        },
      },
    ],
    outputLabel: 'Landing page plan',
    schema: s.obj({
      headline: s.short('Hero headline', 120),
      subheadline: s.short('Hero subheadline', 240),
      primary_cta: s.short('Primary button label', 40),
      sections: s.arr(
        s.obj({ section: s.short('Section name', 60), purpose: s.short('The job this section does', 200), copy: s.text('Draft copy for the section', 1200) }),
        5,
        8,
        'Sections in order',
      ),
      proof_to_add: s.arr(s.short('A real proof element the owner should add', 180), 2, 5, 'Proof to add'),
      form_fields: s.arr(s.short('A form field to ask for, if any', 60), 0, 5, 'Form fields (keep it short)'),
    }),
    view: [
      { kind: 'fields', fields: [{ key: 'headline', label: 'Headline' }, { key: 'subheadline', label: 'Subheadline' }, { key: 'primary_cta', label: 'Button' }] },
      { kind: 'cards', key: 'sections', label: 'Sections', title: 'section', body: 'copy', fields: [{ key: 'purpose', label: 'Purpose' }] },
      { kind: 'list', key: 'proof_to_add', label: 'Proof to add' },
      { kind: 'list', key: 'form_fields', label: 'Form fields' },
    ],
    task: 'Plan a single-goal landing page that matches the traffic source. Never invent testimonials, logos or numbers; list proof the owner should add instead.',
    subjectField: 'business',
    promptVersion: 'v1',
    maxTokens: 5000,
    limitations: ['Testimonials and statistics are never invented. Add your own real proof.'],
    related: ['headline-analyzer', 'value-proposition-generator', 'ad-generator'],
  },
  {
    kind: 'ai',
    slug: 'product-description-generator',
    name: 'Product Description Generator',
    category: 'advertising',
    summary: 'Benefit-led descriptions built only from the facts you supply.',
    answer:
      'The Product Description Generator writes product descriptions that lead with what the buyer gets, using only the facts you provide about materials, sizes and features, in short and long versions for listings and product pages.',
    fields: [
      F.text('product', 'Product name', { required: true, max: 120 }),
      F.area('facts', 'Product facts', { required: true, min: 20, max: 1200, help: 'Materials, dimensions, features, what is included, care instructions. Only these facts will be used.' }),
      F.audience(false),
      F.select('where', 'Where will it appear?', ['Online store product page', 'Marketplace listing (Amazon, Etsy, eBay)', 'Catalog or print', 'Social shop']),
    ],
    examples: [
      {
        label: 'Ceramic mug',
        values: {
          product: 'Stoneware morning mug',
          facts: 'Handmade stoneware, 12 oz, matte speckled glaze outside, glossy inside, dishwasher and microwave safe, each one slightly different, made in our studio in Asheville.',
          audience: 'People who care about their morning coffee ritual',
          where: 'Online store product page',
        },
      },
    ],
    outputLabel: 'Product descriptions',
    schema: s.obj({
      short: s.short('A one-to-two sentence description', 300),
      long: s.text('A full description', 1400),
      bullets: s.arr(s.short('A benefit-led bullet grounded in a stated fact', 160), 4, 6, 'Bullets'),
      seo_title: s.short('A clear product title for search and listings', 120),
      missing_info: s.arr(s.short('A detail buyers usually want that was not provided', 140), 0, 4, 'Consider adding'),
    }),
    view: [
      { kind: 'text', key: 'short', label: 'Short description' },
      { kind: 'text', key: 'long', label: 'Full description' },
      { kind: 'list', key: 'bullets', label: 'Bullet points' },
      { kind: 'text', key: 'seo_title', label: 'Listing title' },
      { kind: 'list', key: 'missing_info', label: 'Consider adding' },
    ],
    task: 'Write product copy using only the supplied facts. Never add materials, certifications, dimensions or claims that were not given.',
    subjectField: 'product',
    promptVersion: 'v1',
    limitations: ['Only the facts you supply are used. Check marketplace rules for claims and keywords.'],
    related: ['copywriting-generator', 'ad-generator', 'title-generator'],
  },
];

export const conversionTools: AiTool[] = [
  {
    kind: 'ai',
    slug: 'headline-analyzer',
    name: 'Headline Analyzer',
    category: 'conversion',
    summary: 'Editorial feedback on a headline, with the reasons and stronger rewrites.',
    answer:
      'The Headline Analyzer reviews a headline the way an editor would: clarity, specificity, relevance to the reader, and promise. It explains each observation and suggests rewrites. It does not produce a numeric score, because a score without data would be invented.',
    fields: [
      F.text('headline', 'Your headline', { required: true, max: 200 }),
      F.select('context', 'Where is it used?', ['Website hero', 'Blog article', 'Email subject line', 'Ad headline', 'Social post', 'Landing page']),
      F.audience(false, 'Who is meant to read it?'),
    ],
    examples: [{ label: 'SaaS hero', values: { headline: 'The all-in-one platform to supercharge your workflow', context: 'Website hero', audience: 'Operations managers at small logistics companies' } }],
    outputLabel: 'Headline review',
    schema: s.obj({
      verdict: s.short('A one-sentence editorial verdict', 240),
      checks: s.arr(
        s.obj({
          criterion: s.enum(['Clarity', 'Specificity', 'Reader relevance', 'Promise', 'Credibility', 'Length for context'], 'Criterion'),
          assessment: s.enum(['Strong', 'Okay', 'Needs work'], 'Assessment'),
          why: s.short('The reason', 240),
        }),
        5,
        6,
        'Checks',
      ),
      rewrites: s.arr(s.obj({ headline: s.short('Rewritten headline', 140), what_changed: s.short('What it improves', 160) }), 4, 6, 'Rewrites'),
    }),
    view: [
      { kind: 'text', key: 'verdict' },
      { kind: 'table', key: 'checks', label: 'Review', columns: [{ key: 'criterion', label: 'Criterion' }, { key: 'assessment', label: 'Assessment' }, { key: 'why', label: 'Why' }] },
      { kind: 'cards', key: 'rewrites', label: 'Rewrites', title: 'headline', fields: [{ key: 'what_changed', label: 'Improves' }] },
    ],
    task: 'Review the headline as an experienced editor for the stated context and reader. Be direct and specific. Do not give a numeric score.',
    subjectField: 'headline',
    promptVersion: 'v1',
    limitations: ['Editorial judgment, not a prediction of click-through rate. Test important headlines.'],
    related: ['title-generator', 'landing-page-generator', 'value-proposition-generator'],
  },
  {
    kind: 'ai',
    slug: 'lead-magnet-generator',
    name: 'Lead Magnet Generator',
    category: 'conversion',
    summary: 'Ten lead magnet concepts, with the format and a first outline for the best fit.',
    answer:
      'The Lead Magnet Generator proposes ten free resources your audience would trade an email address for, matched to formats you can realistically produce, and outlines the strongest one.',
    fields: [F.business(), F.audience(true), F.select('capacity', 'What can you produce?', ['A few hours of work', 'A weekend project', 'Something more substantial'])],
    examples: [{ label: 'Wedding photographer', values: { business: 'Documentary-style wedding photography for small and elopement weddings.', audience: 'Couples planning a small wedding', capacity: 'A weekend project' } }],
    outputLabel: 'Ten lead magnet concepts',
    schema: s.obj({
      ideas: s.arr(
        s.obj({
          title: s.short('Lead magnet title', 110),
          format: s.enum(['Checklist', 'Template', 'Guide', 'Calculator or worksheet', 'Mini course', 'Quiz', 'Swipe file', 'Video', 'Free audit or review'], 'Format'),
          promise: s.short('What the reader gets', 200),
          why_it_converts: s.short('Why this audience would want it', 200),
          effort: s.enum(['Low', 'Medium', 'High'], 'Effort to create'),
        }),
        10,
        10,
        'Ideas',
      ),
      best_pick_outline: s.arr(s.short('An outline point for the strongest idea', 180), 4, 8, 'Outline of the strongest idea'),
      follow_up: s.short('What to send people after they download it', 260),
    }),
    view: [
      {
        kind: 'cards',
        key: 'ideas',
        title: 'title',
        body: 'promise',
        badges: [
          { key: 'format', label: 'Format' },
          { key: 'effort', label: 'Effort' },
        ],
        fields: [{ key: 'why_it_converts', label: 'Why it works' }],
        grid: true,
      },
      { kind: 'list', key: 'best_pick_outline', label: 'Outline for the strongest idea', ordered: true },
      { kind: 'text', key: 'follow_up', label: 'Follow up with' },
    ],
    task: 'Propose ten lead magnets matched to the audience and the stated production capacity, then outline the strongest one.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['You will need an email tool to deliver it and collect sign-ups.'],
    related: ['sales-funnel-generator', 'landing-page-generator', 'content-ideas-generator'],
  },
  {
    kind: 'ai',
    slug: 'sales-funnel-generator',
    name: 'Sales Funnel Generator',
    category: 'conversion',
    summary: 'Funnel stages with the message, asset and metric for each one.',
    answer:
      'The Sales Funnel Generator maps a funnel for your offer from first contact to purchase and repeat business, with the message, the asset you need, and the metric to watch at each stage.',
    fields: [
      F.business(),
      F.audience(true),
      F.select('model', 'How do customers buy?', ['Book a call, then buy', 'Buy online directly', 'Free trial, then subscribe', 'Request a quote', 'Visit in person']),
    ],
    examples: [{ label: 'Coaching program', values: { business: 'A 12-week group coaching program for new restaurant owners covering costs, hiring and marketing.', audience: 'First-time restaurant owners in their first two years', model: 'Book a call, then buy' } }],
    outputLabel: 'Sales funnel',
    schema: s.obj({
      stages: s.arr(
        s.obj({
          stage: s.short('Stage name', 60),
          goal: s.short('What should happen at this stage', 200),
          message: s.short('The core message', 240),
          asset: s.short('What you need to create', 200),
          metric: s.short('The metric to watch and how to calculate it', 200),
        }),
        4,
        7,
        'Stages',
      ),
      biggest_risk: s.short('Where this funnel is most likely to leak, and what to do', 280),
      automation: s.arr(s.short('A step worth automating', 160), 2, 4, 'Worth automating'),
    }),
    view: [
      {
        kind: 'table',
        key: 'stages',
        columns: [
          { key: 'stage', label: 'Stage' },
          { key: 'goal', label: 'Goal' },
          { key: 'message', label: 'Message' },
          { key: 'asset', label: 'Asset' },
          { key: 'metric', label: 'Metric' },
        ],
      },
      { kind: 'text', key: 'biggest_risk', label: 'Biggest leak' },
      { kind: 'list', key: 'automation', label: 'Worth automating' },
    ],
    task: 'Design a funnel that fits how customers buy. Metrics must be defined precisely, without invented benchmark numbers.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['No benchmark conversion rates are given; measure your own baseline first.'],
    related: ['lead-magnet-generator', 'landing-page-generator', 'marketing-plan-generator'],
  },
];

export const planningTools: AiTool[] = [
  {
    kind: 'ai',
    slug: 'marketing-ideas-generator',
    name: 'Marketing Ideas Generator',
    category: 'planning',
    summary: 'Ten tactics aimed at the specific problem you are trying to solve.',
    answer:
      'The Marketing Ideas Generator suggests ten marketing tactics aimed at one problem you describe, such as slow weekdays or low repeat orders, each with why it fits, the effort involved, and how to tell if it worked.',
    fields: [F.business(), F.area('problem', 'What marketing problem are you trying to solve?', { required: true, min: 10, max: 600 }), F.audience(false)],
    examples: [
      {
        label: 'Quiet weekdays',
        values: {
          business: 'A neighborhood pizza restaurant with dine-in, takeout and our own online ordering.',
          problem: 'Monday to Wednesday evenings are slow, while weekends are full.',
          audience: 'Families and young professionals within two miles',
        },
      },
    ],
    outputLabel: 'Ten marketing tactics',
    schema: s.obj({
      tactics: s.arr(
        s.obj({
          tactic: s.short('The tactic', 140),
          how: s.short('How to run it', 280),
          why_it_fits: s.short('Why it addresses the stated problem', 220),
          effort: s.enum(['Low', 'Medium', 'High'], 'Effort'),
          measure: s.short('How to tell if it worked', 180),
        }),
        10,
        10,
        'Tactics',
      ),
    }),
    view: [
      {
        kind: 'cards',
        key: 'tactics',
        title: 'tactic',
        body: 'how',
        badges: [{ key: 'effort', label: 'Effort' }],
        fields: [
          { key: 'why_it_fits', label: 'Why it fits' },
          { key: 'measure', label: 'Measure' },
        ],
      },
    ],
    task: 'Suggest ten specific, varied tactics that address the stated problem for this business. No generic advice.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Pick two or three to test properly rather than trying all ten.'],
    related: ['marketing-plan-generator', 'social-media-post-generator', 'marketing-budget-calculator'],
  },
  {
    kind: 'ai',
    slug: 'marketing-plan-generator',
    name: 'Marketing Plan Generator',
    category: 'planning',
    summary: 'Twenty tactics organized into a 90-day plan you can work through.',
    answer:
      'The Marketing Plan Generator builds a 90-day marketing plan from your business description, audience and stage: twenty tactics grouped into phases, with the channel, effort and success measure for each.',
    fields: [F.business(), F.audience(true), F.select('stage', 'Stage', STAGES)],
    examples: [
      {
        label: 'Online course',
        values: {
          business: 'An online course teaching small-business owners to do their own bookkeeping in QuickBooks, with weekly live Q&A.',
          audience: 'Owners of service businesses with under 10 employees',
          stage: 'Pre-launch',
        },
      },
    ],
    outputLabel: '90-day marketing plan',
    schema: s.obj({
      focus: s.short('The plan’s main focus in one sentence', 240),
      phases: s.arr(
        s.obj({
          phase: s.short('Phase name and timing, e.g. "Weeks 1–4: Foundations"', 80),
          objective: s.short('What this phase achieves', 200),
          tactics: s.arr(
            s.obj({ tactic: s.short('Tactic', 160), channel: s.short('Channel', 50), effort: s.enum(['Low', 'Medium', 'High'], 'Effort'), success: s.short('Success measure', 140) }),
            6,
            8,
            'Tactics',
          ),
        }),
        3,
        3,
        'Three phases with about twenty tactics in total',
      ),
      weekly_rhythm: s.arr(s.short('A recurring weekly habit', 160), 3, 5, 'Weekly rhythm'),
    }),
    view: [
      { kind: 'text', key: 'focus' },
      { kind: 'cards', key: 'phases', title: 'phase', body: 'objective', fields: [{ key: 'tactics', label: 'Tactics' }] },
      { kind: 'list', key: 'weekly_rhythm', label: 'Weekly rhythm' },
    ],
    task: 'Create a 90-day plan in three phases with about twenty tactics total, appropriate to the stage. Each tactic names a channel, effort and success measure.',
    subjectField: 'business',
    promptVersion: 'v1',
    maxTokens: 6000,
    limitations: ['Adjust the timeline to the hours you really have each week.'],
    related: ['marketing-ideas-generator', 'marketing-budget-calculator', 'sales-funnel-generator'],
  },
];
