/**
 * Original guides. Each starts with a direct answer, then explains.
 * Dates are real publication/update dates for this content.
 */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; text: string }
  | { type: 'table'; head: string[]; rows: string[][] };

export type Guide = {
  slug: string;
  title: string;
  description: string;
  answer: string;
  published: string;
  updated: string;
  readMinutes: number;
  related: { tools: string[]; features: string[] };
  body: Block[];
};

export const GUIDES: Guide[] = [
  {
    slug: 'how-to-write-a-positioning-statement',
    title: 'How to write a positioning statement that guides real decisions',
    description: 'A practical method for writing a positioning statement: who it is for, the problem, the alternative, and the difference that matters.',
    answer:
      'A positioning statement says who your product is for, the problem it solves, what those customers use today instead, and why yours is meaningfully different. Write it from customer evidence, keep it internal, and test it by asking whether it would change a real decision this week.',
    published: '2026-10-15',
    updated: '2026-10-15',
    readMinutes: 6,
    related: { tools: ['value-proposition-generator', 'competitor-finder', 'headline-analyzer'], features: ['product-marketing', 'branding'] },
    body: [
      { type: 'p', text: 'Positioning is the place your product occupies in a buyer’s mind relative to the alternatives they already know. A positioning statement is the internal sentence that captures it. It is not a tagline and it does not need to sound good; it needs to be specific enough that your team makes the same decisions without asking you.' },
      { type: 'h2', text: 'The five parts' },
      { type: 'table', head: ['Part', 'Question it answers', 'Weak version', 'Strong version'], rows: [
        ['Target customer', 'Who exactly is this for?', 'Small businesses', 'Independent cafés opening a second location'],
        ['Problem', 'What do they struggle with, in their words?', 'Inefficient operations', 'Staff schedules live in three group chats'],
        ['Current alternative', 'What do they do today instead?', 'Competitors', 'A shared spreadsheet and the owner’s memory'],
        ['Category', 'What will they compare you with?', 'An all-in-one platform', 'Scheduling app for restaurants'],
        ['Key difference', 'Why choose you over the alternative?', 'Easy to use', 'Builds the week’s rota from last year’s sales in one click'],
      ] },
      { type: 'p', text: 'The most useful part is usually the current alternative. Many lost sales do not go to a named competitor; they go to a spreadsheet, a workaround, or doing nothing. If you position against the wrong alternative, your messaging argues with someone your customer is not considering.' },
      { type: 'h2', text: 'A template that works' },
      { type: 'callout', text: 'For [target customer] who [problem], [product] is a [category] that [key difference]. Unlike [current alternative], we [the reason that difference matters].' },
      { type: 'p', text: 'Fill it in with the most specific words you can defend. If a part feels vague, that is a research gap, not a writing problem.' },
      { type: 'h2', text: 'Where the evidence comes from' },
      { type: 'ul', items: [
        'Your last five customers: what were they doing before, and what made them switch?',
        'Lost deals: which alternative did they choose, and why?',
        'Support conversations: which features do people mention when they are happy?',
        'Your own data: which customers stay longest and buy most?',
      ] },
      { type: 'p', text: 'You do not need a big study. Five honest conversations will usually reveal the alternative people actually use and the words they use to describe the problem.' },
      { type: 'h2', text: 'Test it before you publish anything' },
      { type: 'ol', items: [
        'Ask whether a competitor could say the same sentence. If yes, the difference is not real yet.',
        'Ask whether it changes a decision: which channel to use, which feature to build next, which customer to say no to.',
        'Show the problem and difference (not the whole statement) to three target customers and ask them to repeat it back.',
        'Only then turn it into customer-facing copy: a headline, a value proposition, an ad angle.',
      ] },
      { type: 'h2', text: 'Common mistakes' },
      { type: 'ul', items: [
        'Choosing everyone as the target. A narrow target is easier to reach and easier to win.',
        'Listing features as the difference. Features matter only through what they change for the customer.',
        'Claiming “best” or “leading” without proof. Buyers ignore it and ad platforms may reject it.',
        'Writing it once and never revisiting it. Positioning should change when you learn which customers stay.',
      ] },
      { type: 'p', text: 'Vantaro’s strategy includes a positioning section built from your business brief, with proof points marked as either stated by you or hypotheses to check. Treat it as a first draft for the conversations above.' },
    ],
  },
  {
    slug: 'validate-a-business-idea-in-two-weeks',
    title: 'How to validate a business idea in two weeks without building it',
    description: 'List the assumptions an idea depends on, rank them by risk, and run small tests that produce real evidence before you build.',
    answer:
      'To validate an idea quickly, write down the assumptions it depends on, rank them by how uncertain and how important they are, and test the riskiest ones first with cheap experiments: conversations, a landing page with a clear call to action, or a manual version of the service. Decide in advance what result would make you stop.',
    published: '2026-10-15',
    updated: '2026-10-15',
    readMinutes: 7,
    related: { tools: ['business-idea-validator', 'target-audience-generator', 'landing-page-generator'], features: ['market-research'] },
    body: [
      { type: 'p', text: 'Most ideas do not fail because the product is badly built. They fail because an assumption nobody tested turns out to be wrong: the customer does not have the problem badly enough, cannot be reached affordably, or will not pay what the business needs. Validation means finding those weak assumptions while they are still cheap to fix.' },
      { type: 'h2', text: 'Day 1: list the assumptions' },
      { type: 'p', text: 'Write one sentence for each of these. If you cannot, that gap is your first finding.' },
      { type: 'ul', items: [
        'Customer: a specific group has this problem.',
        'Problem: it is painful or frequent enough that they look for a fix.',
        'Reach: you can get in front of them without spending a fortune.',
        'Value: your solution is clearly better than what they do today.',
        'Price: they will pay enough to cover your costs and time.',
        'Delivery: you can deliver it reliably at that price.',
      ] },
      { type: 'h2', text: 'Day 2: rank by risk' },
      { type: 'p', text: 'Score each assumption on two questions: how sure are you (based on evidence, not enthusiasm), and how badly would the idea break if it were false? The riskiest assumptions are uncertain and important. Test those first, even when they are uncomfortable.' },
      { type: 'h2', text: 'Days 3–12: run small tests' },
      { type: 'table', head: ['Assumption type', 'Cheap test', 'Evidence that counts'], rows: [
        ['Problem', 'Ten conversations about the last time it happened', 'Specific stories, money or time already spent on workarounds'],
        ['Reach', 'Post in two places your customers gather', 'Replies from the right people, not just likes'],
        ['Value and price', 'Landing page with a price and a clear call to action', 'Waitlist sign-ups or pre-orders from target customers'],
        ['Delivery', 'Do the service manually for two or three customers', 'Time taken, problems hit, whether they come back'],
      ] },
      { type: 'callout', text: 'Compliments are not evidence. Commitments are: time, an email address, a deposit, an introduction to a colleague.' },
      { type: 'h2', text: 'Days 13–14: decide' },
      { type: 'p', text: 'Before you start testing, write down kill criteria: the results that would make you stop or change direction. For example, “fewer than three of ten people describe the problem without prompting” or “no pre-orders from 200 targeted visitors”. Deciding in advance protects you from explaining away weak results.' },
      { type: 'ol', items: [
        'Continue if the riskiest assumptions held up.',
        'Pivot the customer or the offer if the problem was real but the details were wrong.',
        'Stop if the core problem did not show up. That is a successful, cheap outcome.',
      ] },
      { type: 'h2', text: 'What AI can and cannot do here' },
      { type: 'p', text: 'An AI tool is useful for listing assumptions you missed and suggesting tests. It cannot tell you whether customers want your idea, because it has no access to your customers. Vantaro’s Business Idea Validator gives you the list and the test plan; the evidence still has to come from real people.' },
    ],
  },
  {
    slug: 'tam-sam-som-explained',
    title: 'TAM, SAM and SOM explained, with a bottom-up method you can defend',
    description: 'What total, serviceable and obtainable market mean, how to calculate them bottom-up, and how to avoid inflated market sizes.',
    answer:
      'TAM is the total yearly revenue available if every potential customer bought your product. SAM is the part you can realistically serve, given geography, segment and channels. SOM is the part you could plausibly win in your planning period. Calculate them bottom-up: number of customers × annual spend per customer, then narrow by the shares you can serve and win.',
    published: '2026-10-15',
    updated: '2026-10-15',
    readMinutes: 6,
    related: { tools: ['market-size-calculator', 'niche-finder', 'business-plan-generator'], features: ['market-research'] },
    body: [
      { type: 'p', text: 'Market sizing helps you decide whether an opportunity is big enough to pursue and how ambitious your plans should be. It is also where many pitch decks lose credibility, because a large number with no method behind it tells the reader nothing.' },
      { type: 'h2', text: 'The three numbers' },
      { type: 'table', head: ['Term', 'Meaning', 'Example (fictional window cleaning company)'], rows: [
        ['TAM', 'All potential customers × annual spend', 'Every owner-occupied home in the metro area × average yearly spend on window cleaning'],
        ['SAM', 'The part you can serve', 'Homes within the crews’ driving radius, up to two stories'],
        ['SOM', 'The part you could win in your planning period', 'A small share of those homes in the next 12 months'],
      ] },
      { type: 'h2', text: 'Why bottom-up beats top-down' },
      { type: 'p', text: 'Top-down sizing starts with a large industry figure and takes a percentage of it. It is quick, but it hides every assumption. Bottom-up sizing starts from the customer: how many could buy, how much each would spend per year, and how many you can realistically reach. Each step is visible and can be challenged, which is exactly what makes it credible.' },
      { type: 'h2', text: 'The calculation' },
      { type: 'ol', items: [
        'Annual value per customer = average price per purchase × purchases per year.',
        'TAM = number of potential customers × annual value per customer.',
        'SAM = TAM × the share you can serve.',
        'SOM = SAM × the share you could win in the period.',
      ] },
      { type: 'callout', text: 'Record the source and date of your customer count. Government statistics, industry associations and your own customer data are better than a number from an uncited blog post.' },
      { type: 'h2', text: 'Keeping SOM honest' },
      { type: 'ul', items: [
        'Base the obtainable share on what you can deliver: crew capacity, sales calls per week, or ad budget.',
        'Cross-check it against your funnel: how many leads would you need at your current conversion rate?',
        'If the share looks high for a new entrant, write down how you would win it. If you cannot, lower it.',
      ] },
      { type: 'h2', text: 'Using the result' },
      { type: 'p', text: 'SOM is the number that should shape your near-term plans and budget. TAM and SAM show headroom. Vantaro’s Market Size Calculator runs these steps with every formula visible and asks for the source of your customer count, so the result can be checked by anyone you share it with.' },
    ],
  },
  {
    slug: 'choosing-marketing-channels-on-a-small-budget',
    title: 'Choosing marketing channels when budget and time are tight',
    description: 'How to pick one or two primary channels, test them properly, and say no to the rest until you have evidence.',
    answer:
      'With a small budget, pick channels where your customers are already looking for a solution or already trust a recommendation, commit to one or two primary channels, run each long enough to measure against a baseline, and deliberately postpone the rest. Spreading thin across many channels usually produces too little data to learn anything.',
    published: '2026-10-15',
    updated: '2026-10-15',
    readMinutes: 6,
    related: { tools: ['marketing-ideas-generator', 'marketing-budget-calculator', 'marketing-plan-generator'], features: ['campaign-planning', 'advertising'] },
    body: [
      { type: 'p', text: 'Small businesses rarely fail at marketing because they chose the wrong channel. More often they chose too many, gave each a few weeks, and never learned what works. A good channel decision is as much about what you will not do as what you will.' },
      { type: 'h2', text: 'Start where intent already exists' },
      { type: 'p', text: 'Channels differ in whether people arrive looking for a solution or need to be interrupted. Intent-led channels are usually the best place to start on a small budget.' },
      { type: 'table', head: ['Channel type', 'Examples', 'Best when'], rows: [
        ['Intent-led', 'Local search, search ads, marketplaces, directories', 'People already search for what you sell'],
        ['Trust-led', 'Referrals, partnerships, communities', 'Buying feels risky and recommendations matter'],
        ['Attention-led', 'Social content, social ads, PR', 'The product is new or visual, and you can afford to build awareness'],
      ] },
      { type: 'h2', text: 'Score your options' },
      { type: 'ul', items: [
        'Fit: are your best customers there, and in a buying frame of mind?',
        'Cost: what will it take in money and in your hours each week?',
        'Speed: how soon will you see a signal?',
        'Compounding: will the effort keep paying off, like a strong local search profile, or stop the moment you pause, like ads?',
      ] },
      { type: 'h2', text: 'Commit, then measure' },
      { type: 'ol', items: [
        'Choose one or two primary channels and write down why.',
        'Measure a baseline for the metric that matters, such as qualified enquiries per week.',
        'Run the channel for a fixed period, usually 30 to 90 days.',
        'Compare against the baseline and decide: keep, change, or stop.',
      ] },
      { type: 'callout', text: 'Name at least one channel you are deliberately not using yet. Saying it out loud stops it creeping back into your week.' },
      { type: 'h2', text: 'Setting the budget' },
      { type: 'p', text: 'There are two simple ways to set a budget: a share of revenue, or working backwards from a customer goal and an estimated cost per customer. Use whichever you can estimate more honestly, and keep a small unallocated reserve for tests. Vantaro’s Marketing Budget Calculator shows both methods with the arithmetic visible.' },
    ],
  },
  {
    slug: 'marketing-kpis-for-small-businesses',
    title: 'Marketing KPIs for a small business: pick fewer, define them better',
    description: 'How to choose a north-star metric and three to five supporting KPIs, write a definition for each, and set up a weekly review that takes twenty minutes.',
    answer:
      'Choose one north-star metric that reflects customers getting value, then three to five supporting KPIs that explain movements in it. Give each a written definition, a formula, a data source and a review cadence. Compare each KPI with your own baseline rather than an industry benchmark, and review them on the same day every week.',
    published: '2026-10-16',
    updated: '2026-10-16',
    readMinutes: 7,
    related: { tools: ['sales-funnel-generator', 'marketing-budget-calculator', 'marketing-plan-generator'], features: ['conversion', 'campaign-planning'] },
    body: [
      { type: 'p', text: 'Most small businesses do not have too few numbers; they have too many numbers that nobody acts on. A KPI is only useful if a change in it would make you do something different next week. Everything else is a report.' },
      { type: 'h2', text: 'Start with one north-star metric' },
      { type: 'p', text: 'A north-star metric counts customers getting the value you sell. It should move when the business genuinely improves and be hard to inflate with tricks. Revenue is an outcome of it, not a substitute for it.' },
      { type: 'table', head: ['Business', 'Weak north star', 'Better north star'], rows: [
        ['Cleaning company', 'Website visits', 'Jobs completed per week'],
        ['Subscription coffee', 'Instagram followers', 'Active subscriptions'],
        ['B2B software', 'Sign-ups', 'Accounts using the core feature weekly'],
        ['Course creator', 'Email list size', 'Students completing module one'],
      ] },
      { type: 'h2', text: 'Add three to five supporting KPIs' },
      { type: 'p', text: 'Supporting KPIs explain why the north star moved. A simple way to find them is to follow the customer journey: how people find you, how many take the next step, how many buy, and how many come back.' },
      { type: 'ul', items: [
        'Reach: qualified visitors or enquiries from your main channel.',
        'Conversion: the share of enquiries that become customers.',
        'Cost: what you spend to win one customer, once you have enough data to measure it.',
        'Retention: the share of customers who buy again or stay subscribed.',
      ] },
      { type: 'h2', text: 'Write a definition for every KPI' },
      { type: 'p', text: 'Two people should calculate the same number from the same data. That only happens when the definition is written down.' },
      { type: 'table', head: ['Field', 'Example'], rows: [
        ['Name', 'Enquiry-to-booking rate'],
        ['Definition', 'Share of new enquiries in a week that book a paid job within 14 days'],
        ['Formula', 'Bookings from that week’s enquiries ÷ that week’s enquiries'],
        ['Source', 'Booking calendar and the enquiry form'],
        ['Cadence', 'Weekly, every Monday'],
        ['Owner', 'Whoever answers enquiries'],
      ] },
      { type: 'callout', text: 'If you cannot name the data source, the KPI is not ready. Set up the tracking first, then start counting.' },
      { type: 'h2', text: 'Compare with yourself, not with benchmarks' },
      { type: 'p', text: 'Published averages mix businesses with different prices, audiences and definitions, so they rarely tell you whether your number is good. Measure four weeks of your own baseline, then judge changes against it. When you run an experiment, decide in advance what change would count as success.' },
      { type: 'h2', text: 'A twenty-minute weekly review' },
      { type: 'ol', items: [
        'Update the numbers in the same sheet, on the same day.',
        'Look at the north star first, then the supporting KPI that explains the change.',
        'Write one sentence about why you think it moved.',
        'Decide one action for the week, or decide explicitly to change nothing.',
      ] },
      { type: 'h2', text: 'Common mistakes' },
      { type: 'ul', items: [
        'Tracking follower counts and visits that never connect to buying.',
        'Changing definitions halfway through, which breaks every comparison.',
        'Reviewing monthly when the business needs weekly decisions.',
        'Treating a KPI target as a forecast instead of a test.',
      ] },
      { type: 'p', text: 'Vantaro’s strategy includes a KPI section with a north-star metric, definitions, formulas, cadence and setup steps, all written from your brief. Use it as a starting draft and adjust the definitions to the data you actually have.' },
    ],
  },
  {
    slug: 'build-a-user-persona-you-can-validate',
    title: 'How to build a user persona you can check in a week',
    description: 'A persona method that starts as a labeled hypothesis, then gets tested with five customer conversations and a few simple questions.',
    answer:
      'Write a persona as a hypothesis: who they are, the situation that makes them look for a solution, what they try today, what makes them hesitate, and where you can reach them. Then test it in a week with five short conversations with real or likely customers, and change or drop anything nobody confirms.',
    published: '2026-10-16',
    updated: '2026-10-16',
    readMinutes: 6,
    related: { tools: ['user-persona-generator', 'target-audience-generator', 'value-proposition-generator'], features: ['market-research', 'product-marketing'] },
    body: [
      { type: 'p', text: 'A persona is useful when it changes what you say, where you say it, or what you build. It becomes harmful when a made-up character is treated as research. The fix is simple: label it as a hypothesis until real people confirm it.' },
      { type: 'h2', text: 'What to include' },
      { type: 'table', head: ['Part', 'Why it matters', 'Example'], rows: [
        ['Situation', 'People buy when something changes', 'Just hired a third employee and payroll errors started'],
        ['Goal', 'Shapes the promise you make', 'Pay everyone correctly without evenings of admin'],
        ['Current alternative', 'Your real competitor', 'A spreadsheet and the accountant’s monthly visit'],
        ['Trigger', 'Tells you when to show up', 'A missed payment or a tax letter'],
        ['Objection', 'What your copy must answer', '“I don’t have time to switch systems”'],
        ['Where to reach them', 'Turns the persona into a plan', 'A local business owners’ group; their accountant'],
      ] },
      { type: 'p', text: 'Leave out details that do not change decisions. A stock photo, a favorite brand or a made-up age range adds realism without adding information.' },
      { type: 'h2', text: 'Test it in five conversations' },
      { type: 'ol', items: [
        'Find five people who match the situation, not just the job title. Existing customers are best.',
        'Ask about the last time the problem happened: what triggered it, what they did, who they asked.',
        'Ask what they tried before and why it was not enough.',
        'Ask what nearly stopped them from buying, or what would stop them now.',
        'Write down their exact words, especially for the problem.',
      ] },
      { type: 'callout', text: 'Do not pitch during these conversations. The moment you describe your product, people start being polite instead of accurate.' },
      { type: 'h2', text: 'Update or drop the persona' },
      { type: 'ul', items: [
        'Keep what at least three of five people said without prompting.',
        'Rewrite the problem in the words they used.',
        'Move unconfirmed details to an “open questions” list.',
        'If nobody recognized the situation, drop the persona and test the next segment.',
      ] },
      { type: 'h2', text: 'Turn it into action' },
      { type: 'p', text: 'A confirmed persona should produce three things: a headline that names their problem in their words, one channel where you can reach them this month, and one objection your website now answers. If it produces none of these, it is not finished.' },
      { type: 'p', text: 'Vantaro’s personas are labeled as hypotheses or as stated in your brief, and each one ends with a specific way to validate it.' },
    ],
  },
  {
    slug: 'set-a-marketing-budget-small-business',
    title: 'How to set a marketing budget when you are small',
    description: 'Two ways to set a monthly marketing budget, how to split it between proven channels and tests, and when to change it.',
    answer:
      'Set the budget either as a share of revenue you can afford or by working backwards from a customer goal and an estimated cost to win each customer. Put most of it on the one or two channels you can measure, keep a fixed share as a testing reserve, and review it monthly against real acquisition costs.',
    published: '2026-10-16',
    updated: '2026-10-16',
    readMinutes: 6,
    related: { tools: ['marketing-budget-calculator', 'marketing-plan-generator', 'marketing-ideas-generator'], features: ['campaign-planning', 'advertising'] },
    body: [
      { type: 'p', text: 'A marketing budget for a small business has one job: buy learning and customers at a cost the business can sustain. The exact number matters less than knowing what each part of it is supposed to achieve.' },
      { type: 'h2', text: 'Method 1: a share of revenue' },
      { type: 'p', text: 'Pick a percentage of monthly revenue you can spend without hurting cash flow, and multiply. It is simple and keeps spending tied to what the business can afford. Its weakness is that it says nothing about what the money should produce, and it does not work before you have revenue.' },
      { type: 'callout', text: 'Monthly budget = monthly revenue × chosen percentage' },
      { type: 'h2', text: 'Method 2: work back from a customer goal' },
      { type: 'p', text: 'Decide how many new customers you want each month and estimate what it costs to win one. Multiply. This ties spending to an outcome, but it depends on the cost estimate, which is usually a guess at first.' },
      { type: 'callout', text: 'Monthly budget = new customers wanted × cost to acquire one customer' },
      { type: 'p', text: 'If you have no data yet, estimate the cost from a small paid test rather than from published averages. Two to four weeks of real spend on one channel tells you more than any benchmark.' },
      { type: 'h2', text: 'Split it: proven, then tests' },
      { type: 'table', head: ['Bucket', 'What it is for', 'How to judge it'], rows: [
        ['Proven channels', 'Channels where you can already see customers arriving', 'Cost per customer against your target'],
        ['Retention', 'Getting existing customers to buy again or refer', 'Repeat purchases and referrals'],
        ['Testing reserve', 'One new channel or angle at a time', 'A success signal you set before starting'],
      ] },
      { type: 'p', text: 'Small budgets work best concentrated. Spreading a few hundred dollars across five channels produces five inconclusive results.' },
      { type: 'h2', text: 'Remember the time cost' },
      { type: 'p', text: 'Organic channels are not free: they cost hours. If you value your time, a weekly content habit may cost more than a modest ad budget. Put an hour estimate next to every channel so the comparison is fair.' },
      { type: 'h2', text: 'When to change the budget' },
      { type: 'ul', items: [
        'Increase it when a channel keeps winning customers below your target cost.',
        'Cut or pause a channel when it misses its success signal after a fair test.',
        'Re-check it whenever prices, margins or capacity change.',
      ] },
      { type: 'p', text: 'Vantaro’s Marketing Budget Calculator runs both methods, splits the result across up to four channels, keeps any unallocated share as a testing reserve, and shows the arithmetic for every figure.' },
    ],
  },
];

export const GUIDE_BY_SLUG = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));
