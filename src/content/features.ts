/**
 * Capability pages. Copy is original and describes only what Vantaro does
 * today; limits are stated on each page.
 */
export type Feature = {
  slug: string;
  name: string;
  title: string;
  description: string;
  answer: string;
  outcomes: { title: string; body: string }[];
  steps: string[];
  tools: string[];
  sections: string[];
  limits: string[];
  faqs: { q: string; a: string }[];
};

export const FEATURES: Feature[] = [
  {
    slug: 'advertising',
    name: 'Advertising',
    title: 'Ad copy that tests one clear idea at a time',
    description: 'Write platform-specific ad variants from your business brief, each built to test a different angle, with a plan for comparing them.',
    answer:
      'Vantaro writes ad variants for the platform you advertise on, using that platform’s text fields, and gives each variant a distinct angle so a test actually teaches you something. It never invents results, reviews or claims, and it does not publish ads to your accounts.',
    outcomes: [
      { title: 'Variants with a purpose', body: 'Each ad tests one angle: the pain, the outcome, the objection, or the offer. You learn which message works, not just which wording.' },
      { title: 'Formatted for the platform', body: 'Search ads get headlines and descriptions; social ads get primary text and a button label. Character habits are respected.' },
      { title: 'A test plan included', body: 'You get a short plan for running variants against each other and a list of claims to double-check against platform policies.' },
    ],
    steps: ['Describe the offer and who it is for.', 'Pick the platform and the call to action.', 'Review the variants, edit, and copy them into your ad manager.', 'Run the test plan and keep the angle that wins.'],
    tools: ['ad-generator', 'headline-analyzer', 'landing-page-generator'],
    sections: ['copy', 'channels'],
    limits: ['Vantaro does not connect to ad accounts or publish ads.', 'Platform policies change; review claims before launching.'],
    faqs: [
      { q: 'Can Vantaro run my ads?', a: 'No. Vantaro drafts and organizes ad copy. You publish it in Google Ads, Meta Ads Manager or the platform you use.' },
      { q: 'Does it know what performs best on each platform?', a: 'It follows each platform’s format conventions, but it does not have your performance data. Your test results are the evidence that matters.' },
    ],
  },
  {
    slug: 'branding',
    name: 'Branding',
    title: 'Brand direction you can actually write with',
    description: 'Define brand personality, voice guidelines and key messages from your business brief, then generate names, slogans and mission statements.',
    answer:
      'Vantaro turns your business brief into usable brand direction: personality traits, voice do’s and don’ts, key messages for each audience, and the words your customers use. Naming, slogan and mission tools then work from the same context.',
    outcomes: [
      { title: 'Voice guidelines', body: 'Concrete do’s and don’ts that a freelancer or new hire could follow without a brand workshop.' },
      { title: 'Messages per audience', body: 'One core message for each segment, with the proof that backs it up.' },
      { title: 'Names and lines to choose from', body: 'Name shortlists, slogans and mission drafts in several styles, with the reasoning behind each.' },
    ],
    steps: ['Complete your business brief.', 'Generate a strategy, or open a branding tool directly.', 'Edit the voice and messages until they sound like you.', 'Use them across your website, ads and emails.'],
    tools: ['business-name-generator', 'slogan-generator', 'mission-statement-generator', 'value-proposition-generator'],
    sections: ['brand', 'positioning'],
    limits: ['Name and domain availability is not checked.', 'Visual identity (logo, colors) is outside Vantaro’s scope.'],
    faqs: [
      { q: 'Will it design a logo?', a: 'No. Vantaro works on the verbal side of a brand: positioning, voice and messages. Pair it with a designer for visual identity.' },
      { q: 'Are the names checked for trademarks?', a: 'No. Treat names as a shortlist and check domains, trademarks and social handles before you commit.' },
    ],
  },
  {
    slug: 'competitive-analysis',
    name: 'Competitive analysis',
    title: 'Understand the alternatives your customers weigh',
    description: 'Map direct competitors, substitutes and the do-nothing option, with the searches and criteria to research real competitors properly.',
    answer:
      'Vantaro maps the alternatives your customers consider (direct competitors, indirect substitutes, doing it themselves, or doing nothing) and gives you specific searches and comparison criteria. Live web research is not connected, so it never invents company names, URLs or market figures.',
    outcomes: [
      { title: 'The full set of alternatives', body: 'Most lost sales go to “do nothing” or a workaround, not a named rival. The map includes both.' },
      { title: 'Research you can trust', body: 'Concrete searches and directories to find real competitors, instead of names an AI might have made up.' },
      { title: 'A SWOT with assumptions marked', body: 'Inferences are labeled so you know which points need checking.' },
    ],
    steps: ['Describe your business and where you compete.', 'List any competitors you already know.', 'Run the suggested searches and fill in the comparison criteria.', 'Turn gaps into positioning and offer changes.'],
    tools: ['competitor-finder', 'swot-analysis-generator', 'value-proposition-generator'],
    sections: ['positioning', 'offer'],
    limits: ['No live web research: competitor names come only from you.', 'No pricing or traffic data about other companies.'],
    faqs: [
      { q: 'Why doesn’t it just list my competitors?', a: 'Without live research, any list of company names would be guesswork. We show you how to find the real ones in minutes instead.' },
      { q: 'Can I analyze competitors I already know?', a: 'Yes. Add them to the Competitor Finder and they are analyzed using only what you write about them.' },
    ],
  },
  {
    slug: 'conversion',
    name: 'Conversion improvement',
    title: 'Find where customers drop off, and what to change first',
    description: 'Map your customer journey, spot the friction at each stage, and get prioritized experiments with measurable success signals.',
    answer:
      'Vantaro maps each stage of your customer journey, names the friction that likely slows people down, and turns it into prioritized experiments. Each experiment has a reason, an effort level, and a metric to judge it by, measured against your own baseline.',
    outcomes: [
      { title: 'The biggest leak, named', body: 'A clear call on which stage is most likely losing customers, and why.' },
      { title: 'Experiments, not opinions', body: 'Each recommendation comes with what to measure and what result would mean “keep going”.' },
      { title: 'Sharper headlines and offers', body: 'Editorial headline reviews and offer critiques with specific rewrites.' },
    ],
    steps: ['Generate your strategy’s journey and offer sections.', 'Measure your current baseline for the leaking stage.', 'Run the top experiment for its suggested timeframe.', 'Compare against the baseline and decide.'],
    tools: ['headline-analyzer', 'sales-funnel-generator', 'landing-page-generator'],
    sections: ['journey', 'offer', 'actions'],
    limits: ['Vantaro does not connect to your analytics; you supply baselines.', 'No benchmark conversion rates are quoted.'],
    faqs: [
      { q: 'Does it read my analytics?', a: 'Not yet. You measure the baseline in your own analytics and use Vantaro to decide what to test.' },
      { q: 'Why no benchmark conversion rates?', a: 'Benchmarks vary so much by business and traffic source that a generic number misleads more than it helps. Your own baseline is the right comparison.' },
    ],
  },
  {
    slug: 'landing-pages',
    name: 'Landing page planning',
    title: 'Plan a landing page around one goal',
    description: 'Get a section-by-section landing page plan with draft copy, matched to where your visitors come from and what you want them to do.',
    answer:
      'Vantaro plans a single-goal landing page: the order of sections, the job each one does, and editable draft copy for each, matched to your traffic source. It lists the proof you should add rather than inventing testimonials or numbers.',
    outcomes: [
      { title: 'A structure with a reason', body: 'Every section has a job: earn attention, explain, prove, handle objections, ask.' },
      { title: 'Copy to edit, not stare at', body: 'Draft copy for the hero and each section, in your brand voice.' },
      { title: 'Honest proof', body: 'A list of real proof to gather, never fabricated reviews or logos.' },
    ],
    steps: ['Describe the offer, audience and page goal.', 'Say where visitors will come from.', 'Edit the copy and add your real proof.', 'Build the page in your website tool and review the headline.'],
    tools: ['landing-page-generator', 'headline-analyzer', 'value-proposition-generator'],
    sections: ['copy', 'positioning'],
    limits: ['Vantaro plans and writes the page; it does not host or build it.'],
    faqs: [
      { q: 'Does Vantaro build the actual page?', a: 'No. It gives you the structure and copy to build it in the website builder you already use.' },
      { q: 'Can I use it for an existing page?', a: 'Yes. Describe the current offer and goal, then compare the plan with your page section by section.' },
    ],
  },
  {
    slug: 'marketing-assistant',
    name: 'Brief-aware tools',
    title: 'Tools that already know your business',
    description: 'Inside your workspace, every tool starts from your saved business brief, so you describe your business once and reuse it everywhere.',
    answer:
      'When you use tools inside your Vantaro workspace, the business description and audience from your saved brief are filled in for you. You describe the business once, then move between strategy, copy and planning tools without retyping context. Results can be saved to the same workspace.',
    outcomes: [
      { title: 'Describe it once', body: 'The brief you wrote for your strategy pre-fills every tool’s business and audience fields.' },
      { title: 'Everything in one place', body: 'Strategies, saved tool results, personas and your action plan live in the same workspace.' },
      { title: 'Search across it all', body: 'Press ⌘K to jump to any strategy, saved output or tool.' },
    ],
    steps: ['Fill in the business brief once.', 'Open any tool from the workspace.', 'Adjust the pre-filled context if a task needs something different.', 'Save results you want to keep.'],
    tools: ['copywriting-generator', 'social-media-post-generator', 'marketing-ideas-generator'],
    sections: ['context'],
    limits: ['There is no chat assistant yet; tools work from structured inputs.', 'Vantaro does not take actions in your other accounts.'],
    faqs: [
      { q: 'Is there a chat assistant?', a: 'Not today. Vantaro uses focused tools with clear inputs and outputs, which makes results easier to check and reuse.' },
      { q: 'Can I change the pre-filled context?', a: 'Yes. Pre-filled fields are a starting point; edit them for any single run.' },
    ],
  },
  {
    slug: 'campaign-planning',
    name: 'Campaign planning',
    title: 'Turn a goal into a plan you can work through',
    description: 'Build a 90-day marketing plan or a focused set of tactics, then move each item onto a simple action plan board.',
    answer:
      'Vantaro turns a goal into a plan: a 90-day plan in three phases, or ten tactics aimed at one specific problem. Each tactic includes the channel, effort and success measure, and strategy experiments can be added to an action plan board with one click.',
    outcomes: [
      { title: 'Phased, not piled up', body: 'Foundations first, then growth, then optimization, so the plan matches what a small team can do.' },
      { title: 'Measurable tactics', body: 'Every tactic says how you will know it worked.' },
      { title: 'A board to track it', body: 'Move tasks through To do, In progress and Done, with due dates and channel filters.' },
    ],
    steps: ['Generate a strategy or run the Marketing Plan Generator.', 'Add experiments to your action plan.', 'Set due dates and work through the board.', 'Review results and regenerate the plan when your situation changes.'],
    tools: ['marketing-plan-generator', 'marketing-ideas-generator', 'marketing-budget-calculator'],
    sections: ['actions', 'channels'],
    limits: ['The action plan is a simple board, not a full project management tool.'],
    faqs: [
      { q: 'Can I edit the plan?', a: 'Yes. Every section and task is editable, and earlier versions of a strategy can be restored.' },
      { q: 'Does it sync with my calendar or project tool?', a: 'Not yet. You can export a strategy as Markdown or print it to PDF.' },
    ],
  },
  {
    slug: 'market-research',
    name: 'Market research',
    title: 'Size and test a market with numbers you can defend',
    description: 'Bottom-up market sizing, audience hypotheses and niche ideas, with every assumption and source visible.',
    answer:
      'Vantaro helps you research a market without inventing data: a bottom-up TAM, SAM and SOM calculator where you enter and cite every assumption, audience and niche hypotheses with validation steps, and an idea validator that ranks your riskiest assumptions.',
    outcomes: [
      { title: 'Sizing with a paper trail', body: 'Every figure is calculated from your inputs, with the arithmetic and sources shown.' },
      { title: 'Hypotheses, clearly labeled', body: 'Audience and niche suggestions are marked as hypotheses with ways to test them.' },
      { title: 'Riskiest assumptions first', body: 'Know what to validate before spending money on marketing.' },
    ],
    steps: ['Collect a customer count from a source you trust.', 'Run the Market Size Calculator with your assumptions.', 'Test the top audience hypotheses with real conversations.', 'Update the brief with what you learn.'],
    tools: ['market-size-calculator', 'target-audience-generator', 'niche-finder', 'business-idea-validator'],
    sections: ['audience', 'context'],
    limits: ['No third-party market data is fetched or cited automatically.', 'AI research cannot replace talking to customers.'],
    faqs: [
      { q: 'Where do the market numbers come from?', a: 'From you. The calculator does the arithmetic transparently, and asks you to record the source of the customer count.' },
      { q: 'Are personas based on research?', a: 'No. They are hypotheses based on your brief. Use them to plan customer interviews.' },
    ],
  },
  {
    slug: 'product-marketing',
    name: 'Product marketing',
    title: 'Position a product so the right people get it quickly',
    description: 'Positioning, value propositions, offer packaging and product descriptions built from what makes your product different.',
    answer:
      'Vantaro covers the core of product marketing for small teams: a positioning statement and value proposition, offer critique and packaging ideas, objection handling, and benefit-led product descriptions written only from the facts you provide.',
    outcomes: [
      { title: 'A positioning statement', body: 'Category, target, problem, alternative and difference in one statement your team can repeat.' },
      { title: 'Packaging ideas', body: 'Entry offers, tiers and add-ons, with who each one serves and the main risk.' },
      { title: 'Product copy grounded in facts', body: 'Descriptions that never add features or claims you did not supply.' },
    ],
    steps: ['Generate the positioning and offer sections of a strategy.', 'Test the strongest value proposition with customers.', 'Write product descriptions from your verified facts.', 'Update messaging across your channels.'],
    tools: ['value-proposition-generator', 'product-description-generator', 'elevator-pitch-generator'],
    sections: ['positioning', 'offer', 'portfolio'],
    limits: ['Prices are never suggested; Vantaro describes pricing structure only.'],
    faqs: [
      { q: 'Will it tell me what to charge?', a: 'No. It suggests packaging structures and what to consider, but pricing decisions need your cost and demand data.' },
      { q: 'Can I use it for a launch?', a: 'Yes. Combine the strategy’s positioning and copy sections with the Landing Page and Ad generators.' },
    ],
  },
  {
    slug: 'sales-funnels',
    name: 'Sales funnels',
    title: 'Design a funnel that matches how customers really buy',
    description: 'Map funnel stages with the message, asset and metric for each, plus lead magnet ideas and the follow-up that turns interest into sales.',
    answer:
      'Vantaro maps a sales funnel that fits how your customers buy (book a call, buy online, start a trial, request a quote), with the message, asset and metric for each stage. Lead magnet ideas and follow-up sequences fill the top and middle of the funnel.',
    outcomes: [
      { title: 'Stage by stage', body: 'What should happen at each stage, what to say, and what to build.' },
      { title: 'Metrics defined precisely', body: 'How to calculate each stage’s metric so you can find the leak.' },
      { title: 'Lead magnets that fit', body: 'Ten ideas matched to the time you can spend making them.' },
    ],
    steps: ['Choose how customers buy from you.', 'Generate the funnel and pick a lead magnet.', 'Build the assets for the weakest stage first.', 'Measure each stage monthly.'],
    tools: ['sales-funnel-generator', 'lead-magnet-generator', 'landing-page-generator'],
    sections: ['journey', 'kpis'],
    limits: ['Email sequences are drafted, not sent. Use your email tool to deliver them.'],
    faqs: [
      { q: 'Does it set up automations?', a: 'No. It identifies what is worth automating; you build it in your email or CRM tool.' },
      { q: 'Is this only for online businesses?', a: 'No. Funnels work for in-person and quote-based businesses too. Choose the buying model that matches yours.' },
    ],
  },
];

export const FEATURE_BY_SLUG = Object.fromEntries(FEATURES.map((f) => [f.slug, f]));
