export type Faq = { q: string; a: string; group: 'Product' | 'Results' | 'Account and billing' | 'Privacy' };

/**
 * Product FAQ. Facts that depend on configuration (limits, refunds, price)
 * are injected, so the page never states a number the business has not set.
 */
export function getFaqs(cfg: {
  anonPerDay: number;
  freePerDay: number;
  freeStrategies: number;
  price: string | null;
  refundDays: number | null;
  billingReady: boolean;
  languages: string[];
}): Faq[] {
  return [
    {
      group: 'Product',
      q: 'What is Vantaro?',
      a: 'Vantaro is an AI marketing workspace for founders and small businesses. You describe your business once in a short brief, then generate a marketing strategy, audience hypotheses, copy drafts and a prioritized action plan, and use focused tools for specific jobs like ad copy or market sizing.',
    },
    {
      group: 'Product',
      q: 'What does a strategy include?',
      a: 'Eleven sections: business context and goals, audience and personas, positioning and value proposition, brand direction, copy drafts, channel recommendations, offer critique, KPIs and measurement, offer portfolio, customer journey, and prioritized experiments with a first-week checklist.',
    },
    {
      group: 'Product',
      q: 'Can I use the free tools without an account?',
      a: `Yes. Anonymous visitors can run up to ${cfg.anonPerDay} AI generations a day. Calculators are unlimited because they run in your browser. A free account raises the daily allowance and lets you save results.`,
    },
    {
      group: 'Product',
      q: 'Which languages are supported?',
      a:
        cfg.languages.length > 1
          ? `Outputs can be generated in ${cfg.languages.join(', ')}.`
          : `Outputs are currently generated in ${cfg.languages[0]}. We add languages only after testing output quality in them.`,
    },
    {
      group: 'Results',
      q: 'Are the personas based on research?',
      a: 'No. Personas and audience segments are hypotheses drawn from your brief, and each one is labeled with how to check it. They are a good way to plan customer conversations, not a replacement for them.',
    },
    {
      group: 'Results',
      q: 'Does Vantaro make up statistics or competitor names?',
      a: 'It is instructed not to, and outputs are structured so that facts you provided are separated from hypotheses. Live web research is not connected, so the Competitor Finder never names companies you did not mention, and the Keyword Generator shows no search volumes.',
    },
    {
      group: 'Results',
      q: 'Can I edit what it generates?',
      a: 'Yes. Every strategy section is editable, you can regenerate individual sections, and versions are saved automatically before anything is replaced so you can restore earlier work.',
    },
    {
      group: 'Results',
      q: 'Will it guarantee more customers or better rankings?',
      a: 'No. Vantaro helps you decide what to do and drafts the work. Results depend on your market, your offer and how the plan is executed.',
    },
    {
      group: 'Account and billing',
      q: 'What is included for free?',
      a: `A free account includes up to ${cfg.freePerDay} AI generations a day and ${cfg.freeStrategies} full ${cfg.freeStrategies === 1 ? 'strategy' : 'strategies'} every 30 days, plus saved results, versions, sharing and the action plan.`,
    },
    {
      group: 'Account and billing',
      q: 'How does paid access work?',
      a: cfg.billingReady && cfg.price
        ? `Paid access is a one-time purchase of ${cfg.price}. It raises your limits as shown on the pricing page. Usage limits still apply because each generation has a real cost.`
        : 'Paid plans are not open yet. The pricing page will show the price, what is included, and the limits before anything can be purchased.',
    },
    {
      group: 'Account and billing',
      q: 'Is there a refund policy?',
      a: cfg.refundDays !== null
        ? `Yes. You can request a refund within ${cfg.refundDays} days of purchase through the contact page.`
        : 'Refund terms will be published on the pricing page before paid plans open.',
    },
    {
      group: 'Privacy',
      q: 'Who can see my business brief and strategies?',
      a: 'Only members of your workspace. Shared links show a strategy read-only, without your brief, and you can revoke them at any time. Shared pages are hidden from search engines.',
    },
    {
      group: 'Privacy',
      q: 'Is my data used in analytics?',
      a: 'Product analytics record events such as “strategy completed”, never the content of your brief, prompts, results or your email address.',
    },
  ];
}
