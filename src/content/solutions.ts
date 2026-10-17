export type Solution = {
  slug: string;
  name: string;
  title: string;
  description: string;
  answer: string;
  challenges: { title: string; body: string }[];
  workflow: { step: string; detail: string; link?: { href: string; label: string } }[];
  tools: string[];
  example?: { href: string; label: string };
  faqs: { q: string; a: string }[];
};

export const SOLUTIONS: Solution[] = [
  {
    slug: 'solo-founders',
    name: 'Solo founders',
    title: 'Marketing direction when you are the whole team',
    description: 'A practical marketing strategy and a short list of next moves for founders who sell, build and market alone.',
    answer:
      'For solo founders, Vantaro turns what you already know about your product into a focused strategy and a short, prioritized action plan, so marketing takes a few deliberate hours a week instead of scattered effort across every channel.',
    challenges: [
      { title: 'Too many options', body: 'Every channel looks possible and none gets enough attention to work.' },
      { title: 'No time for research', body: 'You know you should define your audience, but building happens first.' },
      { title: 'Hard to judge your own copy', body: 'When you wrote the product, everything about it seems obvious.' },
    ],
    workflow: [
      { step: 'Write the brief in one sitting', detail: 'About five minutes; autosave means you can stop halfway.', link: { href: '/signup', label: 'Create a free account' } },
      { step: 'Generate a strategy', detail: 'Positioning, personas, channels and experiments in priority order.' },
      { step: 'Pick two experiments', detail: 'Add them to the action plan and ignore the rest until they finish.' },
      { step: 'Use tools for the copy', detail: 'Headlines, landing page sections and outreach drafts start from your brief.' },
    ],
    tools: ['business-idea-validator', 'value-proposition-generator', 'marketing-ideas-generator'],
    example: { href: '/examples/strategy/window-and-solar-cleaning', label: 'See a sample strategy' },
    faqs: [
      { q: 'How long does a strategy take?', a: 'The brief takes a few minutes. Generation runs in the background and saves each section as it finishes.' },
      { q: 'I have no customers yet. Is it still useful?', a: 'Yes. Choose the “Idea” or “Pre-launch” stage and the plan focuses on validation and first customers.' },
    ],
  },
  {
    slug: 'saas',
    name: 'SaaS teams',
    title: 'Positioning and growth experiments for software products',
    description: 'Sharpen positioning, map trial-to-paid friction, and prioritize growth experiments for early-stage SaaS.',
    answer:
      'For SaaS teams, Vantaro clarifies positioning against the tools and workarounds buyers use today, maps the journey from first visit to paid conversion, and turns the biggest friction points into experiments with defined metrics.',
    challenges: [
      { title: 'Feature-led messaging', body: 'Pages list capabilities when buyers want to know what changes for them.' },
      { title: 'Trial users who never activate', body: 'Sign-ups arrive but few reach the moment the product proves its value.' },
      { title: 'Spreadsheet-sized competition', body: 'The real rival is often a spreadsheet or an inbox, not another app.' },
    ],
    workflow: [
      { step: 'Describe the product and who pays', detail: 'Include the workaround customers use today.' },
      { step: 'Generate positioning and journey', detail: 'Pay special attention to the “biggest leak” call.' },
      { step: 'Rewrite the homepage hero', detail: 'Use the Value Proposition Generator and Headline Analyzer together.', link: { href: '/tools/headline-analyzer', label: 'Open the Headline Analyzer' } },
      { step: 'Run activation experiments', detail: 'Add the top experiments to the action plan with a baseline.' },
    ],
    tools: ['value-proposition-generator', 'headline-analyzer', 'sales-funnel-generator', 'user-persona-generator'],
    example: { href: '/examples/personas/invoice-reconciliation-software', label: 'See SaaS persona examples' },
    faqs: [
      { q: 'Does it integrate with product analytics?', a: 'No. You bring the baseline numbers; Vantaro helps decide what to test and how to measure it.' },
      { q: 'Can multiple people work in one workspace?', a: 'Workspaces support roles in the data model, but inviting teammates is not available yet.' },
    ],
  },
  {
    slug: 'agencies',
    name: 'Agencies',
    title: 'Faster discovery and clearer proposals for client work',
    description: 'Use separate workspaces per client to build briefs, strategies and campaign drafts, then share read-only reports.',
    answer:
      'Agencies use Vantaro to speed up the first week of a client engagement: one workspace per client, a structured brief from the discovery call, a first-draft strategy to react to, and read-only share links for client review.',
    challenges: [
      { title: 'Slow discovery', body: 'Turning call notes into a coherent direction takes senior time.' },
      { title: 'Blank-page proposals', body: 'Every pitch starts from scratch, even when the structure is similar.' },
      { title: 'Feedback in scattered threads', body: 'Clients review in email, chat and calls at once.' },
    ],
    workflow: [
      { step: 'Create a workspace per client', detail: 'Keep each client’s brief, strategy and saved outputs separate.' },
      { step: 'Fill the brief from discovery notes', detail: 'The review step shows what is still missing before you generate.' },
      { step: 'Edit the strategy with your expertise', detail: 'Every section is editable, with version history.' },
      { step: 'Share a read-only link', detail: 'Links can expire and be revoked; the client never sees your brief or workspace.' },
    ],
    tools: ['competitor-finder', 'landing-page-generator', 'ad-generator', 'business-name-generator'],
    example: { href: '/examples/funnels/brand-design-studio', label: 'See an agency funnel example' },
    faqs: [
      { q: 'How many client workspaces can I create?', a: 'The workspace limit depends on your plan and is shown on the pricing page.' },
      { q: 'Can I white-label shared reports?', a: 'Not yet. Shared reports show the strategy without your internal brief, under Vantaro’s design.' },
    ],
  },
  {
    slug: 'service-businesses',
    name: 'Service businesses',
    title: 'More of the right enquiries for local and service businesses',
    description: 'Clear positioning, local channel priorities and offer ideas for trades, studios, clinics and other service businesses.',
    answer:
      'For service businesses, Vantaro focuses on what moves the phone: a clear reason to choose you over the alternatives, the local channels worth your time, a quote or booking journey with less friction, and recurring offers that smooth out the calendar.',
    challenges: [
      { title: 'Competing on price', body: 'Without a clear difference, customers default to the cheapest quote.' },
      { title: 'Feast or famine', body: 'Busy seasons are full; quiet weeks are very quiet.' },
      { title: 'Referrals you cannot predict', body: 'Word of mouth works, but you cannot turn it up on demand.' },
    ],
    workflow: [
      { step: 'Describe your service area and best customers', detail: 'Region matters: it shapes channel recommendations.' },
      { step: 'Generate a strategy', detail: 'Look at channels, offer critique and the journey from enquiry to booking.' },
      { step: 'Fix the quote experience', detail: 'Use the Landing Page Generator for a single “request a quote” page.' },
      { step: 'Plan the quiet weeks', detail: 'Run the Marketing Ideas Generator on your slowest period.', link: { href: '/tools/marketing-ideas-generator', label: 'Open Marketing Ideas' } },
    ],
    tools: ['marketing-ideas-generator', 'landing-page-generator', 'keyword-generator', 'social-media-post-generator'],
    example: { href: '/examples/strategy/window-and-solar-cleaning', label: 'See a service-business strategy' },
    faqs: [
      { q: 'Does it help with Google Business Profile or reviews?', a: 'It can draft posts and review replies with the copy tools, but it does not connect to your profile.' },
      { q: 'Is local SEO covered?', a: 'The Keyword Generator suggests local search phrases by intent. It does not show search volumes.' },
    ],
  },
  {
    slug: 'creators',
    name: 'Digital creators',
    title: 'Turn an audience into a business with a plan behind it',
    description: 'Content concepts, lead magnets and offers for creators building products, courses or memberships.',
    answer:
      'For creators, Vantaro connects content to a business model: who your audience really is, which offers fit them, lead magnets that grow an email list you own, and content concepts and captions that stay on message.',
    challenges: [
      { title: 'Audience, but no offer', body: 'Followers grow while revenue depends on sponsors and algorithms.' },
      { title: 'Content treadmill', body: 'Posting daily without a plan for what it is building toward.' },
      { title: 'Rented reach', body: 'A platform change can halve your reach overnight.' },
    ],
    workflow: [
      { step: 'Describe your audience and what you teach or make', detail: 'Include what people already ask you for.' },
      { step: 'Validate a product idea', detail: 'Rank the riskiest assumptions before you build a course.', link: { href: '/tools/business-idea-validator', label: 'Open the Idea Validator' } },
      { step: 'Build an email list', detail: 'Pick a lead magnet you can make in a weekend.' },
      { step: 'Plan content around the offer', detail: 'Generate concepts and captions that lead somewhere.' },
    ],
    tools: ['lead-magnet-generator', 'content-ideas-generator', 'caption-generator', 'business-idea-validator'],
    faqs: [
      { q: 'Will it post for me?', a: 'No. Vantaro drafts and plans; you publish on your own channels.' },
      { q: 'Is it useful for small audiences?', a: 'Yes. A small, engaged audience is often the best place to test an offer.' },
    ],
  },
  {
    slug: 'ecommerce',
    name: 'Ecommerce brands',
    title: 'Sharper product pages and repeat purchases for online stores',
    description: 'Positioning, product descriptions, ad variants and retention ideas for small ecommerce brands.',
    answer:
      'For ecommerce brands, Vantaro sharpens what makes your products worth choosing, writes product descriptions from your verified facts, drafts ad variants for the platforms you sell on, and plans retention tactics that bring customers back.',
    challenges: [
      { title: 'Lookalike listings', body: 'Product pages that read like every other store’s.' },
      { title: 'Rising acquisition costs', body: 'Paying more for each first order makes repeat purchases essential.' },
      { title: 'Claims you cannot back up', body: 'Marketplaces and ad platforms reject unsupported claims.' },
    ],
    workflow: [
      { step: 'Describe your products and customers', detail: 'Include what customers say in reviews, if you have them.' },
      { step: 'Generate positioning and offer sections', detail: 'Packaging ideas often lift order value.' },
      { step: 'Rewrite your best-seller’s page', detail: 'The Product Description Generator uses only the facts you provide.', link: { href: '/tools/product-description-generator', label: 'Open Product Descriptions' } },
      { step: 'Test ad angles', detail: 'Run one variant per angle and keep the winner.' },
    ],
    tools: ['product-description-generator', 'ad-generator', 'marketing-ideas-generator', 'caption-generator'],
    example: { href: '/examples/positioning/loose-leaf-tea-shop', label: 'See an ecommerce positioning example' },
    faqs: [
      { q: 'Does it connect to Shopify?', a: 'Not yet. Copy results into your store admin, or download them as Markdown.' },
      { q: 'Can it write marketplace listings?', a: 'Yes. Choose “Marketplace listing” in the Product Description Generator.' },
    ],
  },
  {
    slug: 'coaches-and-consultants',
    name: 'Coaches and consultants',
    title: 'A clearer offer and a steadier pipeline for coaches and consultants',
    description: 'Positioning, a specific client profile and a referral-friendly plan for independent coaches and consultants who sell their expertise.',
    answer:
      'For coaches and consultants, Vantaro turns your experience and the clients you have helped into a narrow, specific positioning, client personas to check against real conversations, and a short plan built around referrals, content that shows your thinking, and a simple way to book a first call.',
    challenges: [
      { title: 'Describing the work broadly', body: '“I help businesses grow” is true and impossible to refer. A narrow description is easier to remember and pass on.' },
      { title: 'Feast and famine', body: 'Marketing stops while client work is busy, so the pipeline empties just as projects end.' },
      { title: 'Selling time, not outcomes', body: 'Hourly offers make buyers compare rates instead of results.' },
    ],
    workflow: [
      { step: 'Describe your best past clients in the brief', detail: 'Who they were, what changed for them and how they found you.', link: { href: '/signup', label: 'Create a free account' } },
      { step: 'Generate a strategy', detail: 'Positioning, client personas, an offer critique and referral-friendly channels.' },
      { step: 'Package one offer', detail: 'Use the offer section to turn open-ended hours into a defined engagement.' },
      { step: 'Keep a weekly minimum', detail: 'Add two small recurring tasks to the action plan so marketing continues during busy weeks.' },
    ],
    tools: ['niche-finder', 'elevator-pitch-generator', 'lead-magnet-generator'],
    example: { href: '/examples/lead-magnets/fractional-hr-consultancy', label: 'See lead magnet ideas for a consultancy' },
    faqs: [
      { q: 'Can Vantaro help me choose a niche?', a: 'The Niche Finder suggests specific niches from your skills and experience, each with a risk and the signals that would show it is real. The choice stays yours.' },
      { q: 'Will it write my case studies?', a: 'It can help structure them, but results and client quotes must come from real clients with their permission. Vantaro never invents them.' },
    ],
  },
];

export const SOLUTION_BY_SLUG = Object.fromEntries(SOLUTIONS.map((s) => [s.slug, s]));
