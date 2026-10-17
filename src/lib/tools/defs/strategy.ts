import { s } from '@/lib/ai/schema';
import { F, STAGES } from '../fields';
import type { AiTool } from '../types';

const effort = () => s.enum(['Low', 'Medium', 'High'], 'Effort for a small team');

export const strategyTools: AiTool[] = [
  {
    kind: 'ai',
    slug: 'business-idea-validator',
    name: 'Business Idea Validator',
    category: 'strategy',
    summary: 'Find the riskiest assumptions in an idea and cheap ways to test them.',
    answer:
      'The Business Idea Validator breaks an idea into the assumptions it depends on, ranks them by risk, and suggests small experiments to test each one before you spend real money. It does not predict success; it tells you what to find out first.',
    fields: [
      F.area('idea', 'Describe the idea', { required: true, min: 30, help: 'What it is, who pays, and how it makes money.' }),
      F.audience(false, 'Who do you think will buy it?'),
      F.select('stage', 'How far along are you?', STAGES),
    ],
    examples: [
      {
        label: 'Meal prep for shift workers',
        values: {
          idea: 'A weekly meal-prep subscription for hospital night-shift staff, delivered to staff rooms on Sunday evenings. Meals are designed for eating at 3am: light, high-protein, no reheating needed.',
          audience: 'Nurses and hospital staff on rotating night shifts',
          stage: 'Idea',
        },
      },
    ],
    outputLabel: 'Assumptions and validation experiments',
    schema: s.obj({
      summary: s.text('Two sentences: what must be true for this idea to work', 500),
      assumptions: s.arr(
        s.obj({
          assumption: s.short('An assumption the idea depends on', 220),
          risk: s.enum(['High', 'Medium', 'Low'], 'How risky / uncertain'),
          why_it_matters: s.short('What happens if it is false', 240),
          experiment: s.short('A small, cheap test', 260),
          signal: s.short('What result would count as evidence', 200),
          effort: effort(),
        }),
        5,
        8,
        'Assumptions, riskiest first',
      ),
      kill_criteria: s.arr(s.short('A result that should make you stop or pivot', 200), 2, 4, 'Kill criteria'),
      first_step: s.short('The single next step for this week', 240),
    }),
    view: [
      { kind: 'text', key: 'summary' },
      {
        kind: 'cards',
        key: 'assumptions',
        label: 'Assumptions to test',
        title: 'assumption',
        body: 'why_it_matters',
        badges: [
          { key: 'risk', label: 'Risk' },
          { key: 'effort', label: 'Effort' },
        ],
        fields: [
          { key: 'experiment', label: 'Test' },
          { key: 'signal', label: 'Evidence looks like' },
        ],
      },
      { kind: 'list', key: 'kill_criteria', label: 'Stop or pivot if' },
      { kind: 'text', key: 'first_step', label: 'This week' },
    ],
    task: 'Act as a skeptical, constructive advisor. Identify the assumptions the idea depends on (customer, problem, willingness to pay, reach, delivery, economics), rank them riskiest first, and propose cheap experiments with clear success signals.',
    subjectField: 'idea',
    promptVersion: 'v1',
    limitations: ['It cannot tell you whether the idea will succeed.', 'It has no access to market data; risks are judged from your description.'],
    related: ['business-model-generator', 'target-audience-generator', 'market-size-calculator'],
  },
  {
    kind: 'ai',
    slug: 'business-ideas-generator',
    name: 'Business Ideas Generator',
    category: 'strategy',
    summary: 'Ten business ideas shaped by your audience, interests and preferred format.',
    answer:
      'The Business Ideas Generator suggests ten business ideas that fit the audience you want to serve, the topics you know or enjoy, and the kind of product you want to run. Each idea comes with the problem it solves and a first way to test demand.',
    fields: [
      F.text('audience', 'Who do you want to serve?', { required: true, placeholder: 'e.g. independent physiotherapists' }),
      F.text('interests', 'Your skills or interests', { required: true, max: 400, placeholder: 'e.g. scheduling software, sports, teaching' }),
      F.select('format', 'Product format', ['Any', 'Service', 'Software / SaaS', 'Digital product', 'Physical product', 'Content / media', 'Marketplace']),
    ],
    examples: [{ label: 'Physio software', values: { audience: 'Independent physiotherapists', interests: 'Scheduling, sports injuries, short-form video', format: 'Any' } }],
    outputLabel: 'Ten business ideas',
    schema: s.obj({
      ideas: s.arr(
        s.obj({
          name: s.short('A working name for the idea', 80),
          pitch: s.short('One-sentence description', 240),
          problem: s.short('The specific problem it solves for the audience', 240),
          format: s.short('Product format', 40),
          why_you: s.short('Why it fits the stated skills or interests', 200),
          first_test: s.short('A first way to test demand', 220),
        }),
        10,
        10,
        'Ten distinct ideas',
      ),
    }),
    view: [
      {
        kind: 'cards',
        key: 'ideas',
        title: 'name',
        body: 'pitch',
        badges: [{ key: 'format', label: 'Format' }],
        fields: [
          { key: 'problem', label: 'Problem' },
          { key: 'why_you', label: 'Why it fits you' },
          { key: 'first_test', label: 'First test' },
        ],
        grid: true,
      },
    ],
    task: 'Generate ten genuinely distinct business ideas for the stated audience that use the stated skills or interests and match the requested format (any format if "Any"). Prefer specific, testable ideas over generic ones.',
    subjectField: 'audience',
    promptVersion: 'v1',
    limitations: ['Ideas are starting points, not validated opportunities.', 'Names are placeholders; check availability yourself.'],
    related: ['business-idea-validator', 'niche-finder', 'business-name-generator'],
  },
  {
    kind: 'ai',
    slug: 'business-model-generator',
    name: 'Business Model Generator',
    category: 'strategy',
    summary: 'A structured business model with the assumptions behind each part.',
    answer:
      'The Business Model Generator lays out how a business creates, delivers and captures value: customer segments, value proposition, channels, revenue streams, costs, and key resources. It flags which parts are assumptions so you know what to verify.',
    fields: [F.business('Describe the business or idea'), F.audience(false), F.select('stage', 'Stage', STAGES)],
    examples: [
      {
        label: 'Bike repair van',
        values: {
          business: 'A mobile bike repair service that comes to offices and apartment buildings. Riders book a slot online and the van fixes the bike while they work.',
          audience: 'Commuter cyclists in dense city neighborhoods',
          stage: 'Pre-launch',
        },
      },
    ],
    outputLabel: 'Business model',
    schema: s.obj({
      segments: s.arr(s.short('A customer segment', 200), 1, 4, 'Customer segments'),
      value_proposition: s.short('What customers get and why it beats the alternative', 300),
      channels: s.arr(s.short('How customers find and buy it', 200), 2, 5, 'Channels'),
      relationships: s.short('How the business keeps customers', 240),
      revenue_streams: s.arr(s.short('A revenue stream and pricing structure (no invented prices)', 220), 1, 4, 'Revenue streams'),
      key_activities: s.arr(s.short('A key activity', 160), 2, 5, 'Key activities'),
      key_resources: s.arr(s.short('A key resource', 160), 2, 5, 'Key resources'),
      partners: s.arr(s.short('A useful partner type', 160), 1, 4, 'Key partners'),
      cost_structure: s.arr(s.short('A major cost driver', 160), 2, 5, 'Cost structure'),
      assumptions: s.arr(s.short('An assumption in this model that needs checking', 220), 3, 6, 'Assumptions to verify'),
    }),
    view: [
      { kind: 'text', key: 'value_proposition', label: 'Value proposition' },
      { kind: 'list', key: 'segments', label: 'Customer segments' },
      { kind: 'list', key: 'channels', label: 'Channels' },
      { kind: 'text', key: 'relationships', label: 'Customer relationships' },
      { kind: 'list', key: 'revenue_streams', label: 'Revenue streams' },
      { kind: 'list', key: 'key_activities', label: 'Key activities' },
      { kind: 'list', key: 'key_resources', label: 'Key resources' },
      { kind: 'list', key: 'partners', label: 'Key partners' },
      { kind: 'list', key: 'cost_structure', label: 'Cost structure' },
      { kind: 'list', key: 'assumptions', label: 'Assumptions to verify' },
    ],
    task: 'Produce a business model (in the spirit of a business model canvas) grounded in the description. Do not invent prices or numbers; describe structures. List the assumptions that need checking.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Pricing and cost figures are not estimated; add your own numbers.'],
    related: ['business-plan-generator', 'business-idea-validator', 'value-proposition-generator'],
  },
  {
    kind: 'ai',
    slug: 'business-plan-generator',
    name: 'Business Plan Generator',
    category: 'strategy',
    summary: 'An editable plan outline grounded in what you tell it, not boilerplate.',
    answer:
      'The Business Plan Generator turns your brief into a structured plan: summary, problem and solution, market, marketing and sales, operations, milestones and risks. Numbers are left for you to fill in, with guidance on what to calculate.',
    fields: [
      F.business('Describe the business'),
      F.audience(false),
      F.select('stage', 'Stage', STAGES),
      F.area('goals', 'Goals for the next 12 months', { max: 600, placeholder: 'e.g. open a second location, reach 200 subscribers' }),
      F.select('purpose', 'What is the plan for?', ['Internal planning', 'A bank or lender', 'Investors', 'A grant or program application']),
    ],
    examples: [
      {
        label: 'Neighborhood bakery',
        values: {
          business: 'A small sourdough bakery with a counter and wholesale orders to three local cafés. Open Wednesday to Sunday.',
          audience: 'Neighborhood residents and independent cafés',
          stage: 'Early customers',
          goals: 'Add a second oven, reach 10 wholesale accounts, launch weekend pre-orders.',
          purpose: 'A bank or lender',
        },
      },
    ],
    outputLabel: 'Business plan outline',
    schema: s.obj({
      executive_summary: s.text('A concise summary of the plan', 900),
      sections: s.arr(
        s.obj({
          heading: s.short('Section heading', 80),
          content: s.text('Section draft grounded in the description', 1400),
          to_complete: s.arr(s.short('Information or numbers the owner must add', 200), 0, 4, 'To complete'),
        }),
        6,
        9,
        'Plan sections: problem and solution, market, competition, marketing and sales, operations, team, milestones, risks, financials',
      ),
      milestones: s.arr(s.obj({ milestone: s.short('Milestone', 160), timing: s.short('Rough timing', 60) }), 3, 6, 'Milestones'),
      risks: s.arr(s.obj({ risk: s.short('Risk', 200), mitigation: s.short('Mitigation', 220) }), 3, 5, 'Risks'),
    }),
    view: [
      { kind: 'text', key: 'executive_summary', label: 'Executive summary' },
      { kind: 'cards', key: 'sections', title: 'heading', body: 'content', fields: [{ key: 'to_complete', label: 'Add before sharing' }] },
      { kind: 'table', key: 'milestones', label: 'Milestones', columns: [{ key: 'milestone', label: 'Milestone' }, { key: 'timing', label: 'Timing' }] },
      { kind: 'table', key: 'risks', label: 'Risks', columns: [{ key: 'risk', label: 'Risk' }, { key: 'mitigation', label: 'Mitigation' }] },
    ],
    task: 'Draft a business plan suited to the stated purpose. Use only facts from the input. Where a lender or investor would expect numbers, list what the owner must calculate instead of inventing figures.',
    subjectField: 'business',
    promptVersion: 'v1',
    maxTokens: 6000,
    limitations: ['Financial projections are not generated. The plan tells you which numbers to prepare.', 'Have a professional review any plan you submit to a lender.'],
    related: ['business-model-generator', 'swot-analysis-generator', 'marketing-plan-generator'],
  },
  {
    kind: 'ai',
    slug: 'competitor-finder',
    name: 'Competitor Finder',
    category: 'strategy',
    summary: 'Map the alternatives your customers consider, and how to research them properly.',
    answer:
      'The Competitor Finder maps the kinds of alternatives your customers consider (direct competitors, indirect substitutes, and doing nothing) and gives you the searches and sources to identify real names in your market. Live web research is not connected yet, so it never invents company names or URLs.',
    fields: [
      F.business(),
      F.text('region', 'Where do you compete?', { placeholder: 'e.g. Tampa Bay, or online in the US' }),
      F.area('known', 'Competitors you already know', { max: 600, help: 'Optional. Names you list are analyzed only from what you tell us here.' }),
    ],
    examples: [
      {
        label: 'Pet portrait studio',
        values: {
          business: 'Custom illustrated pet portraits, sold online as prints and digital files. Turnaround is five days.',
          region: 'Online, US customers',
          known: '',
        },
      },
    ],
    outputLabel: 'Competitive landscape map',
    schema: s.obj({
      research_status: s.short('State plainly that live web research was not performed and names were not looked up', 200),
      alternative_types: s.arr(
        s.obj({
          type: s.enum(['Direct competitor', 'Indirect substitute', 'Do it yourself', 'Do nothing'], 'Kind of alternative'),
          description: s.short('What this alternative looks like for this business', 260),
          why_customers_choose_it: s.short('Why a customer would pick it', 220),
          how_to_win: s.short('How to compete against it', 220),
        }),
        3,
        6,
        'Alternative types',
      ),
      known_competitors: s.arr(
        s.obj({ name: s.short('A competitor name the user supplied', 80), notes: s.short('What to compare, based only on the user input', 260) }),
        0,
        6,
        'Only competitors the user listed; empty if none',
      ),
      searches_to_run: s.arr(s.short('A specific search query or place to look', 160), 5, 8, 'Searches to run'),
      comparison_criteria: s.arr(s.short('A criterion to compare competitors on', 120), 4, 7, 'What to compare'),
    }),
    view: [
      { kind: 'text', key: 'research_status' },
      {
        kind: 'cards',
        key: 'alternative_types',
        label: 'Alternatives your customers consider',
        title: 'type',
        body: 'description',
        fields: [
          { key: 'why_customers_choose_it', label: 'Why they choose it' },
          { key: 'how_to_win', label: 'How to win' },
        ],
      },
      { kind: 'cards', key: 'known_competitors', label: 'Competitors you listed', title: 'name', body: 'notes' },
      { kind: 'list', key: 'searches_to_run', label: 'Searches to run' },
      { kind: 'list', key: 'comparison_criteria', label: 'Compare them on' },
    ],
    task: 'You have NO web access. Never name companies or URLs the user did not provide. Map alternative types, analyze only user-listed competitors from the user text, and give concrete searches and directories to find real competitors.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Live web research is not connected: no company names or URLs are looked up.', 'Competitors you list are analyzed only from what you write.'],
    related: ['swot-analysis-generator', 'value-proposition-generator', 'niche-finder'],
  },
  {
    kind: 'ai',
    slug: 'swot-analysis-generator',
    name: 'SWOT Analysis Generator',
    category: 'strategy',
    summary: 'Strengths, weaknesses, opportunities and threats, with assumptions labeled.',
    answer:
      'The SWOT Analysis Generator organizes what you know about your business into strengths, weaknesses, opportunities and threats, marks which points are inferences rather than facts you supplied, and turns the analysis into a few strategic moves.',
    fields: [
      F.business(),
      F.area('situation', 'Current situation', { max: 800, help: 'Recent wins, problems, changes in your market, resources you have.' }),
      F.text('competitors', 'Main alternatives customers consider', { max: 300 }),
    ],
    examples: [
      {
        label: 'Yoga studio',
        values: {
          business: 'A two-room yoga studio with 300 members, known for small classes and experienced teachers.',
          situation: 'Two big chain gyms opened nearby and added yoga. Our retention is strong but new sign-ups slowed this year. We have no online classes.',
          competitors: 'Chain gyms, YouTube yoga, other boutique studios',
        },
      },
    ],
    outputLabel: 'SWOT analysis',
    schema: s.obj({
      strengths: s.arr(s.short('A strength (prefix "(assumed)" if inferred)', 200), 3, 6, 'Strengths'),
      weaknesses: s.arr(s.short('A weakness (prefix "(assumed)" if inferred)', 200), 3, 6, 'Weaknesses'),
      opportunities: s.arr(s.short('An opportunity (prefix "(assumed)" if inferred)', 200), 3, 6, 'Opportunities'),
      threats: s.arr(s.short('A threat (prefix "(assumed)" if inferred)', 200), 3, 6, 'Threats'),
      moves: s.arr(
        s.obj({ move: s.short('A strategic move combining the quadrants', 220), uses: s.short('Which strengths/opportunities it uses or which risks it reduces', 220) }),
        3,
        4,
        'Strategic moves',
      ),
    }),
    view: [
      {
        kind: 'quad',
        cells: [
          { key: 'strengths', label: 'Strengths' },
          { key: 'weaknesses', label: 'Weaknesses' },
          { key: 'opportunities', label: 'Opportunities' },
          { key: 'threats', label: 'Threats' },
        ],
      },
      { kind: 'cards', key: 'moves', label: 'Strategic moves', title: 'move', fields: [{ key: 'uses', label: 'Why' }] },
    ],
    task: 'Write a SWOT analysis. Points stated or directly implied by the user are facts; prefix your own inferences with "(assumed)". Then propose strategic moves that combine the quadrants.',
    subjectField: 'business',
    promptVersion: 'v1',
    limitations: ['Points marked “(assumed)” are inferences to check, not facts.'],
    related: ['competitor-finder', 'business-plan-generator', 'marketing-plan-generator'],
  },
];
