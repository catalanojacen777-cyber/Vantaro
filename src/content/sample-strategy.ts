/**
 * A complete sample strategy for a fictional business, written by the Vantaro
 * team to show the structure and depth of a strategy. Used on the homepage
 * and the examples library. Validated against the live section schemas in tests.
 */
import type { Brief } from '@/lib/strategy/brief';

export const SAMPLE_BRIEF: Brief = {
  businessName: 'Brightside Window & Solar',
  productDescription:
    'Residential window cleaning and rooftop solar panel cleaning. Most customers start with a one-off clean and about a third move to a quarterly plan. Two crews, fully insured, eco-friendly pure-water system.',
  customerType: 'Consumers (B2C)',
  idealCustomer: 'Homeowners in established suburbs, often with solar panels installed in the last five years.',
  region: 'Greater Raleigh, North Carolina',
  stage: 'Early customers',
  objective: 'Generate more qualified leads',
  objectiveDetail: 'Fill weekday slots between March and October.',
  differentiation: 'We clean solar panels properly (pure water, soft brushes, no pressure washers) and show before-and-after output readings when the homeowner has a monitoring app.',
  currentChannels: ['Referrals / word of mouth', 'Website / SEO', 'Instagram'],
  budget: 'Under $500 / month',
  constraints: 'Owner runs one crew and does the marketing. No ladders above two stories.',
  language: 'English',
};

const personas = [
  {
    name: 'The output-watcher',
    role: 'Engineer or analyst in their 40s who installed solar three years ago',
    context: 'Checks the panel monitoring app weekly and noticed production dipping in late summer, but is not sure whether dirt, heat or the inverter is to blame.',
    goals: ['Get the production they paid for', 'Avoid voiding the panel warranty', 'Understand what actually happened'],
    frustrations: ['Installers do not offer cleaning', 'Worried a pressure washer will damage the panels', 'Hard to tell real specialists from window cleaners with a hose'],
    triggers: ['A visible drop in the monitoring app', 'Pollen season ending', 'A neighbor mentions cleaning theirs'],
    objections: ['Does cleaning really make a measurable difference?', 'Will walking on the roof cause damage?'],
    where_to_reach: ['Local solar owner Facebook groups', 'Nextdoor', 'Google searches for “solar panel cleaning near me”'],
    message_that_lands: 'See your before-and-after production readings, not just shiny panels.',
    basis: 'hypothesis',
    validate_by: 'Ask the next five solar customers what made them book and whether they compared readings afterwards.',
  },
  {
    name: 'The time-poor host',
    role: 'Parent in their late 30s with a busy household and a full calendar of guests',
    context: 'Wants the house to look good before family visits and holidays, and would rather pay than climb a ladder.',
    goals: ['Clean windows before guests arrive', 'Book once and forget about it', 'Trustworthy people at the house'],
    frustrations: ['Getting three quotes takes too long', 'Companies that do not show up on time', 'Streaks left on the glass'],
    triggers: ['A holiday or event on the calendar', 'Spring cleaning', 'Moving in or preparing to sell'],
    objections: ['Is a quarterly plan worth it?', 'Do I need to be home?'],
    where_to_reach: ['Instagram', 'Neighborhood email newsletters', 'School and community groups'],
    message_that_lands: 'Book online in two minutes and get a guaranteed arrival window.',
    basis: 'hypothesis',
    validate_by: 'Review which recent bookings were tied to an event, and ask on the post-clean follow-up message.',
  },
  {
    name: 'The careful retiree',
    role: 'Retired homeowner in a two-story house they have lived in for decades',
    context: 'Used to clean windows themselves but no longer wants to use a ladder; values reliability and a familiar face.',
    goals: ['Keep the home well maintained', 'Avoid risky jobs', 'Work with the same crew each time'],
    frustrations: ['New crews every visit', 'Rushed work', 'Unclear pricing'],
    triggers: ['A fall or near miss', 'A family member suggests hiring help', 'Seasonal home maintenance list'],
    objections: ['Price compared with doing it themselves', 'Strangers in the yard'],
    where_to_reach: ['Referrals from neighbors', 'Local print newsletters', 'Community centers and HOA notices'],
    message_that_lands: 'The same insured crew, the same day each season, with a clear price up front.',
    basis: 'provided',
    validate_by: 'Call three existing plan customers in this group and ask what they value most.',
  },
];

export const SAMPLE_SECTIONS: Record<string, unknown> = {
  context: {
    summary:
      'Brightside cleans windows and rooftop solar panels for homeowners in Greater Raleigh, with two insured crews and a pure-water system. Customers usually start with a one-off clean and roughly a third convert to quarterly plans. The near-term goal is to fill weekday slots from March to October with qualified local leads on a small budget.',
    goals: [
      { goal: 'Fill weekday slots between March and October', success_looks_like: 'Weekday crew utilization tracked weekly and rising against this season’s baseline' },
      { goal: 'Grow quarterly plan sign-ups', success_looks_like: 'Share of first-time customers who join a plan within 30 days' },
    ],
    constraints: ['Owner runs one crew and the marketing', 'Marketing budget under $500 per month', 'No work above two stories'],
    open_questions: [
      'How many current customers have solar panels, and do they book more often?',
      'Which neighborhoods produce the most referrals?',
      'What share of quotes turn into bookings today?',
      'Do quarterly plan customers churn after the first year?',
    ],
  },
  audience: {
    segments: [
      {
        name: 'Solar homeowners',
        description: 'Homeowners with rooftop solar who want to protect output and warranties, and who are underserved by general window cleaners.',
        priority: 'Primary',
        rationale: 'Clear, technical need that matches Brightside’s strongest difference, and a reason to book every season.',
        basis: 'provided',
      },
      {
        name: 'Busy family households',
        description: 'Two-income households in established suburbs who outsource home maintenance around events and holidays.',
        priority: 'Secondary',
        rationale: 'Large group that books around predictable moments, which can be planned for in marketing.',
        basis: 'hypothesis',
      },
      {
        name: 'Older homeowners',
        description: 'Long-time homeowners who no longer want to use ladders and value a consistent, trusted crew.',
        priority: 'Secondary',
        rationale: 'Loyal plan customers once trust is built; reached mostly through referrals and local print.',
        basis: 'provided',
      },
      {
        name: 'Realtors preparing listings',
        description: 'Agents who want listings photo-ready within days.',
        priority: 'Later',
        rationale: 'Promising for weekday work but needs a separate partnership offer.',
        basis: 'hypothesis',
      },
    ],
    personas,
    caveat: 'These personas are hypotheses drawn from the brief. Five short customer conversations will tell you which ones are real.',
  },
  positioning: {
    category: 'Home exterior cleaning specialist',
    target: 'Greater Raleigh homeowners with rooftop solar who care about output and warranties',
    problem: 'Dirty panels quietly produce less, and most cleaners are not set up to clean them safely.',
    current_alternative: 'Doing nothing, hosing panels from the ground, or hiring a general pressure-washing company',
    differentiator: 'Panel-safe pure-water cleaning with before-and-after output readings when the homeowner has a monitoring app',
    value_proposition: 'Solar and window cleaning that shows its results: cleaner glass and the production readings to prove it.',
    positioning_statement:
      'For Greater Raleigh homeowners with rooftop solar who want the output they paid for, Brightside is the exterior cleaning specialist that cleans panels safely with pure water and shows before-and-after production readings. Unlike general pressure-washing companies, we protect the panels and the warranty.',
    proof_points: [
      { point: 'Pure-water system with soft brushes, no pressure washing', basis: 'provided', how_to_strengthen: 'Show the equipment in a short video and link it to manufacturer cleaning guidance.' },
      { point: 'Fully insured crews', basis: 'provided', how_to_strengthen: 'Display the insurance details and offer the certificate on request.' },
      { point: 'Before-and-after production readings', basis: 'provided', how_to_strengthen: 'Collect permission to share anonymized readings from willing customers.' },
    ],
    risks: ['Some homeowners may not notice an output change, especially after rain.', 'Readings vary with weather, so comparisons need a fair method.'],
  },
  brand: {
    personality: ['Precise: we show the numbers, not adjectives', 'Neighborly: the same crew, on time, polite', 'Plain-spoken: clear prices and straight answers'],
    voice_do: ['Lead with what the customer will see or measure', 'Use short sentences and everyday words', 'Say exactly when the crew will arrive', 'Explain why a method protects the home'],
    voice_avoid: ['“Sparkling”, “crystal clear” and other cleaning clichés', 'Claims of percentage output gains', 'Pressure tactics or fake urgency'],
    key_messages: [
      { audience: 'Solar homeowners', message: 'Panel-safe cleaning with the before-and-after readings to show what changed.', support: 'Pure-water system and readings from the customer’s own app' },
      { audience: 'Busy family households', message: 'Book online in two minutes and get a guaranteed arrival window.', support: 'Online booking and text reminders' },
      { audience: 'Older homeowners', message: 'The same insured crew each season, with the price agreed up front.', support: 'Crew assignment on quarterly plans' },
    ],
    words_to_use: ['panels', 'production', 'readings', 'streak-free', 'insured', 'arrival window', 'quarterly plan'],
  },
  copy: {
    headlines: ['Cleaner panels. Readings to prove it.', 'Solar and window cleaning, done safely', 'See what clean panels change on your app'],
    subheadline: 'Pure-water, panel-safe cleaning for Greater Raleigh homes, with before-and-after readings when you have a monitoring app.',
    calls_to_action: ['Get a quote', 'Book a clean', 'Start a quarterly plan'],
    short_pitch:
      'Brightside Window & Solar cleans windows and rooftop solar panels for homeowners across Greater Raleigh. Our insured crews use a pure-water system and soft brushes, never pressure washers, and if you have a monitoring app we will show you the readings before and after.',
    email_subject_lines: ['Your panels after pollen season', 'Spring slots for your quarterly clean', 'How we clean panels without voiding warranties'],
    ad_drafts: [
      { channel: 'Google Search', headline: 'Solar Panel Cleaning, Raleigh', body: 'Panel-safe pure-water cleaning by insured crews. Before-and-after readings. Get a quote.' },
      { channel: 'Instagram', headline: 'What pollen does to your panels', body: 'A quick look at a panel before and after a pure-water clean, and the reading from the owner’s app. Book a clean this month.' },
    ],
  },
  channels: {
    channels: [
      { channel: 'Google Business Profile and local search', role: 'Primary', rationale: 'Solar cleaning searches are high intent and local. Low cost, compounding results.', effort: 'Medium', cost: 'Time only', first_step: 'Add “solar panel cleaning” as a service with photos from recent jobs.' },
      { channel: 'Referral program for current customers', role: 'Primary', rationale: 'Referrals already work; a simple reward makes them happen more often.', effort: 'Low', cost: 'Low', first_step: 'Add a referral card and a one-line referral offer to the post-clean text message.' },
      { channel: 'Solar owner communities', role: 'Supporting', rationale: 'Where output-watchers ask questions; helpful answers build trust.', effort: 'Medium', cost: 'Time only', first_step: 'Answer two cleaning questions a week in local solar owner groups, without hard selling.' },
      { channel: 'Google Search ads', role: 'Test', rationale: 'Can fill weekday gaps quickly; keep it to tightly matched solar terms on a small budget.', effort: 'Medium', cost: 'Medium', first_step: 'Run one campaign on exact-match solar cleaning terms for 30 days.' },
      { channel: 'Facebook and Instagram ads', role: 'Not now', rationale: 'Broad targeting would spend the small budget before local search is optimized.', effort: 'High', cost: 'Medium', first_step: 'Revisit after the search test has a baseline.' },
    ],
    why_not: 'Door hangers look obvious for a local service, but the owner’s time is the constraint; revisit them for plan customers’ immediate neighbors only.',
  },
  offer: {
    transformation: {
      before: 'Panels producing less than expected and windows streaked, with no safe way to clean either.',
      after: 'Clean glass, panels cleaned safely, and readings that show what changed.',
      how: 'A booked arrival window, an insured crew with a pure-water system, and a follow-up message with the results.',
    },
    critique: [
      { observation: 'The quarterly plan is described but not packaged with a clear benefit beyond convenience.', suggestion: 'Add priority booking in pollen season and the same crew each visit to the plan.' },
      { observation: 'Solar cleaning is mentioned after windows on the website.', suggestion: 'Give solar cleaning its own page and booking path.' },
    ],
    objections: [
      { objection: 'Will walking on the roof damage the panels or roof?', response: 'Explain the reach-and-brush method from the ground or ladder and when roof access is avoided.' },
      { objection: 'Does cleaning really change output?', response: 'Be honest that results vary with dirt and weather, and offer to compare readings when the customer has an app.' },
      { objection: 'Why pay for a plan?', response: 'Show the seasonal schedule and the priority booking during busy months.' },
    ],
    risk_reversal: 'If streaks are visible within 48 hours, the crew returns to fix them at no charge.',
  },
  kpis: {
    north_star: { metric: 'Weekday booked crew-hours, March to October', why: 'The stated goal is filling weekday capacity; this measures it directly.' },
    kpis: [
      { name: 'Qualified leads', definition: 'Quote requests inside the service area for services Brightside offers', formula: 'Count per week', cadence: 'Weekly', source: 'Booking form and phone log' },
      { name: 'Quote-to-booking rate', definition: 'Share of qualified leads that book a first clean', formula: 'Bookings ÷ qualified leads', cadence: 'Monthly', source: 'Booking system' },
      { name: 'Plan conversion', definition: 'First-time customers who start a quarterly plan within 30 days', formula: 'New plans ÷ first-time customers', cadence: 'Monthly', source: 'Booking system' },
      { name: 'Referral share', definition: 'New customers who name a referrer', formula: 'Referred customers ÷ new customers', cadence: 'Monthly', source: '“How did you hear about us?” field' },
    ],
    setup_steps: ['Add a required “How did you hear about us?” field to the booking form.', 'Tag weekday versus weekend bookings in the calendar.', 'Record this season’s first month as the baseline.'],
  },
  portfolio: {
    current_offer: 'One-off window cleaning, one-off solar cleaning, and a quarterly plan.',
    ideas: [
      { idea: 'Solar care plan: twice-yearly panel cleaning with a readings report', who_its_for: 'Solar homeowners', rationale: 'Matches the primary segment’s seasonal need and the readings differentiator.', risk: 'Readings comparisons need a consistent method to stay credible.' },
      { idea: 'Weekday flexibility option at a lower price', who_its_for: 'Retirees and remote workers', rationale: 'Fills weekday slots directly.', risk: 'Could pull weekend customers to cheaper weekdays.' },
      { idea: 'Listing-ready package for realtors', who_its_for: 'Realtors preparing homes for sale', rationale: 'Fast-turnaround weekday work with repeat potential.', risk: 'Requires sales time to build realtor relationships.' },
    ],
  },
  journey: {
    stages: [
      { stage: 'Notice', customer_goal: 'Understand whether panels or windows need cleaning', touchpoints: 'Monitoring app, neighbors, search', friction: 'Not sure dirt is the cause of lower output', improvement: 'Publish a short guide on spotting dirt-related output drops.' },
      { stage: 'Compare', customer_goal: 'Find a safe, trustworthy specialist', touchpoints: 'Google Business Profile, website, community groups', friction: 'All cleaners look the same online', improvement: 'Lead with the panel-safe method and readings on the profile and homepage.' },
      { stage: 'Quote', customer_goal: 'Get a price quickly', touchpoints: 'Website form, phone', friction: 'Waiting for a callback', improvement: 'Show price ranges by home size and offer instant online booking.' },
      { stage: 'Clean day', customer_goal: 'A smooth visit with no surprises', touchpoints: 'Text reminders, crew arrival', friction: 'Uncertain arrival time', improvement: 'Two-hour arrival window with an on-the-way text.' },
      { stage: 'After', customer_goal: 'See the result and decide whether to repeat', touchpoints: 'Follow-up text, email', friction: 'No reminder of what changed', improvement: 'Send before-and-after photos and readings with a plan offer.' },
    ],
    biggest_leak: 'The quote stage: waiting for a callback likely loses people comparing several companies. Instant online booking for standard homes should be fixed first.',
  },
  actions: {
    experiments: [
      { title: 'Launch a dedicated solar cleaning page with online booking', channel: 'Website', reason: 'Solar is the strongest difference but is hidden; a focused page supports search and ads.', effort: 'Medium', dependencies: ['Before-and-after photos', 'Price ranges by home size'], test_metric: 'Solar quote requests per week', success_signal: 'Clearly above the four-week baseline after 30 days', timeframe: '30 days', priority: 'Now' },
      { title: 'Add a referral offer to the post-clean text', channel: 'Referrals', reason: 'Referrals already drive work; asking at the moment of satisfaction is cheap.', effort: 'Low', dependencies: [], test_metric: 'Referral share of new customers', success_signal: 'Referral share rises month over month', timeframe: '60 days', priority: 'Now' },
      { title: 'Optimize the Google Business Profile for solar cleaning', channel: 'Local search', reason: 'High-intent local searches start here.', effort: 'Low', dependencies: ['Recent job photos'], test_metric: 'Profile calls and website clicks', success_signal: 'Higher than the previous 30 days', timeframe: '30 days', priority: 'Now' },
      { title: 'Run an exact-match search ad test for weekday slots', channel: 'Google Ads', reason: 'Fills weekday gaps quickly if cost per booking is acceptable.', effort: 'Medium', dependencies: ['Solar page live', 'Conversion tracking on bookings'], test_metric: 'Cost per weekday booking', success_signal: 'Below the profit per first clean', timeframe: '30 days', priority: 'Next' },
      { title: 'Package the solar care plan', channel: 'Offer', reason: 'Turns seasonal need into recurring revenue.', effort: 'Medium', dependencies: ['Readings comparison method'], test_metric: 'Plan conversion among solar customers', success_signal: 'Higher than the current plan conversion rate', timeframe: '60 days', priority: 'Next' },
      { title: 'Pilot a realtor listing-ready package', channel: 'Partnerships', reason: 'Potential weekday demand with repeat clients.', effort: 'High', dependencies: ['Package and price', 'Three realtor conversations'], test_metric: 'Realtor bookings', success_signal: 'Two repeat realtors within 90 days', timeframe: '90 days', priority: 'Later' },
    ],
    first_week: ['Add the “How did you hear about us?” field to the booking form', 'Collect ten before-and-after photos from recent solar jobs', 'Draft the referral line for post-clean texts', 'Update the Google Business Profile services and photos'],
  },
};

export const SAMPLE_PERSONAS = personas;
