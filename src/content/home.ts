/** Homepage sample data. All businesses are fictional and labeled as examples. */

export const GUIDED_SAMPLES = [
  {
    key: 'home-services',
    label: 'Home services',
    business: 'Window and solar panel cleaning, two crews',
    audience: 'Homeowners with rooftop solar who want the output they paid for and worry about damaging panels.',
    positioning: 'Panel-safe cleaning that shows its results: before-and-after production readings, not just shiny glass.',
    nextTask: 'Give solar cleaning its own page with online booking, then measure weekly quote requests for 30 days.',
  },
  {
    key: 'saas',
    label: 'B2B software',
    business: 'Invoice matching software for distributors',
    audience: 'Accounts payable leads at 50–500 person distributors who spend month-end chasing mismatched invoices.',
    positioning: 'Find the mismatches before month-end instead of during it. Positioned against spreadsheets, not other software.',
    nextTask: 'Offer three controllers a free scan of last quarter’s invoices and count how many accept.',
  },
  {
    key: 'ecommerce',
    label: 'Online store',
    business: 'Single-estate loose-leaf tea, sold online',
    audience: 'Coffee drinkers curious about good tea who are put off by not knowing how to brew it.',
    positioning: 'Your first great cup of tea, brewed right: every tea ships with a simple brewing card.',
    nextTask: 'Test the brewing-card message against the sourcing message in two ad sets for two weeks.',
  },
  {
    key: 'agency',
    label: 'Agency',
    business: 'Brand and web design for independent restaurants',
    audience: 'Owners opening or refreshing a restaurant who need a brand and site before opening day.',
    positioning: 'Restaurants that look like themselves, launched in six weeks with a fixed scope.',
    nextTask: 'Publish a process page with price ranges and a restaurant opening checklist as a lead magnet.',
  },
] as const;

export const EXPLORER_TABS = [
  {
    key: 'strategy',
    label: 'Strategy',
    title: 'Positioning you can repeat',
    body: 'Target, problem, the alternative customers use today, and the difference that matters, plus proof points marked as fact or hypothesis.',
    section: 'positioning',
  },
  {
    key: 'research',
    label: 'Research',
    title: 'Audience hypotheses, ranked',
    body: 'Segments ranked by how good a first target they are, each with the reasoning and how to test it with real customers.',
    section: 'audience',
  },
  {
    key: 'acquisition',
    label: 'Acquisition',
    title: 'Channels with a reason, and a “not now”',
    body: 'Where to show up first given your budget and stage, the first step for each channel, and what to postpone.',
    section: 'channels',
  },
  {
    key: 'conversion',
    label: 'Conversion',
    title: 'The journey, and the leak to fix first',
    body: 'Each stage from first notice to repeat purchase, the friction at each one, and a clear call on where you are losing people.',
    section: 'journey',
  },
  {
    key: 'operations',
    label: 'Operations',
    title: 'Experiments you can run this month',
    body: 'Prioritized experiments with effort, dependencies and a measurable signal, ready to move onto your action plan.',
    section: 'actions',
  },
] as const;

export const USE_CASES = [
  { key: 'solo-founders', cta: 'Vantaro for solo founders', label: 'Solo founder', line: 'You are the marketing team, and the product team, and support.', points: ['A strategy from a five-minute brief', 'Two experiments at a time, not twenty', 'Copy tools that already know your business'] },
  { key: 'service-businesses', cta: 'Vantaro for service businesses', label: 'Service business', line: 'You want the phone to ring on quiet weekdays, not just in peak season.', points: ['Local channels ranked by effort', 'A quote journey with less friction', 'Ideas aimed at your slowest weeks'] },
  { key: 'agencies', cta: 'Vantaro for agencies', label: 'Agency', line: 'Discovery and first drafts take senior time you would rather spend on craft.', points: ['A workspace per client', 'First-draft strategies to react to', 'Read-only links for client review'] },
  { key: 'saas', cta: 'Vantaro for SaaS teams', label: 'SaaS team', line: 'Sign-ups arrive, but positioning and activation need work.', points: ['Positioning against real alternatives', 'Trial-to-paid journey mapping', 'Experiments with defined metrics'] },
  { key: 'ecommerce', cta: 'Vantaro for online stores', label: 'Online store', line: 'Rising ad costs make every product page and repeat order count.', points: ['Product copy from verified facts', 'Ad variants by angle', 'Retention and offer ideas'] },
  { key: 'creators', cta: 'Vantaro for creators', label: 'Creator', line: 'You have an audience. You want a business that does not depend on an algorithm.', points: ['Offer validation before you build', 'Lead magnets for an email list', 'Content that leads somewhere'] },
] as const;
