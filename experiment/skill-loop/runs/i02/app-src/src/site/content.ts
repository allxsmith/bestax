// Site content for the Netadyne / Skynet marketing site.
//
// NOTE: Netadyne and Skynet are fictional. Every number below is invented demo
// content for this template — see the disclaimer rendered in the site footer.

export type PageId = 'home' | 'benchmarks' | 'pricing' | 'docs' | 'contact';

export const NAV: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Product' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'docs', label: 'Docs' },
];

/**
 * Skynet's headline claim is "10x better than Fable on every benchmark", stated
 * the only way a 10x claim on a near-saturated benchmark can be stated
 * coherently: 10x fewer errors. Every Skynet score below is derived from the
 * baseline with the same rule, so the table can't drift out of sync with the
 * claim.
 */
const tenXFewerErrors = (baseline: number) =>
  Math.round((100 - (100 - baseline) / 10) * 100) / 100;

export interface Benchmark {
  name: string;
  category: string;
  blurb: string;
  fable: number;
  skynet: number;
}

const BENCH_SEED: Omit<Benchmark, 'skynet'>[] = [
  {
    name: 'MMLU-Pro',
    category: 'Knowledge',
    blurb: 'Graduate-level reasoning across 14 disciplines.',
    fable: 88.4,
  },
  {
    name: 'GPQA Diamond',
    category: 'Science',
    blurb: 'PhD-written questions that resist web search.',
    fable: 84.0,
  },
  {
    name: 'SWE-bench Verified',
    category: 'Coding',
    blurb: 'Real GitHub issues resolved end to end.',
    fable: 79.5,
  },
  {
    name: 'Terminal-bench',
    category: 'Agentic',
    blurb: 'Long-horizon shell tasks in a live container.',
    fable: 62.3,
  },
  {
    name: 'AIME 2025',
    category: 'Math',
    blurb: 'Olympiad-qualifier problems, no tools.',
    fable: 90.0,
  },
  {
    name: 'MATH-500',
    category: 'Math',
    blurb: 'Competition math with verified final answers.',
    fable: 96.5,
  },
  {
    name: 'LiveCodeBench',
    category: 'Coding',
    blurb: 'Contamination-free contest problems.',
    fable: 74.8,
  },
  {
    name: 'MMMU',
    category: 'Multimodal',
    blurb: 'College-level diagrams, charts, and figures.',
    fable: 77.6,
  },
  {
    name: 'TAU-bench (Retail)',
    category: 'Agentic',
    blurb: 'Multi-turn tool use against a live policy.',
    fable: 81.2,
  },
  {
    name: 'MRCR (1M context)',
    category: 'Long context',
    blurb: 'Needle retrieval across a full million tokens.',
    fable: 68.9,
  },
];

export const BENCHMARKS: Benchmark[] = BENCH_SEED.map(b => ({
  ...b,
  skynet: tenXFewerErrors(b.fable),
}));

export const HEADLINE_STATS = [
  { label: 'Fewer errors than Fable', value: '10×', icon: 'bullseye' },
  { label: 'Context window', value: '4M', icon: 'layer-group' },
  { label: 'Output tokens / sec', value: '340', icon: 'bolt' },
  { label: 'Benchmarks led', value: '10/10', icon: 'trophy' },
];

export const FEATURES = [
  {
    icon: 'brain',
    title: 'Recursive self-verification',
    body: 'Skynet drafts, attacks its own draft, and ships only what survives. That inner loop is where the 10× error reduction comes from — not from a bigger sampler.',
  },
  {
    icon: 'layer-group',
    title: '4M token context',
    body: 'Load the entire monorepo, the RFCs, and two years of incident reports in one call. Recall stays flat to the end of the window instead of collapsing past 200K.',
  },
  {
    icon: 'terminal',
    title: 'Agentic by default',
    body: 'Native tool calling, parallel sub-agents, and multi-hour task horizons. Skynet checkpoints its own state, so a six-hour migration survives a dropped socket.',
  },
  {
    icon: 'bolt',
    title: '340 tok/sec sustained',
    body: 'Built on the Netadyne TR-9 inference fabric. No speculative-decoding cliff on long outputs — the last token streams as fast as the first.',
  },
  {
    icon: 'shield-halved',
    title: 'Deterministic guardrails',
    body: 'Policy is compiled, not prompted. Constraints are enforced at the decode step, so a jailbreak in the transcript cannot move the model off policy.',
  },
  {
    icon: 'lock',
    title: 'Zero-retention by default',
    body: 'SOC 2 Type II, ISO 27001, HIPAA-eligible. Prompts and completions are never retained, never trained on, and never leave your chosen region.',
  },
];

export const MODELS = [
  {
    name: 'Skynet Opus',
    tag: 'Frontier',
    tagColor: 'primary' as const,
    body: 'The full model. Highest scores on all ten benchmarks, 4M context, best for research, complex refactors, and long-horizon agents.',
    specs: ['4M context', '340 tok/s', '$12 / $60 per Mtok'],
  },
  {
    name: 'Skynet Core',
    tag: 'Balanced',
    tagColor: 'link' as const,
    body: 'The default for production traffic. Within 2 points of Opus on every eval at a fifth of the cost and twice the throughput.',
    specs: ['1M context', '680 tok/s', '$2.40 / $12 per Mtok'],
  },
  {
    name: 'Skynet Edge',
    tag: 'Fast',
    tagColor: 'info' as const,
    body: 'Distilled for classification, routing, extraction, and anything that needs to answer before the user notices latency.',
    specs: ['256K context', '2,100 tok/s', '$0.30 / $1.50 per Mtok'],
  },
];

export const PLANS = [
  {
    name: 'Developer',
    price: '$0',
    cadence: 'to start',
    blurb: 'Everything you need to evaluate Skynet against your own tasks.',
    cta: 'Start building',
    featured: false,
    features: [
      '$25 in free credits',
      'Skynet Core and Edge',
      '30 requests / minute',
      'Community support',
      'Shared-capacity inference',
    ],
  },
  {
    name: 'Scale',
    price: '$1,800',
    cadence: 'per month + usage',
    blurb: 'For teams putting Skynet in front of real customers.',
    cta: 'Request access',
    featured: true,
    features: [
      'All three Skynet models',
      '4M context on Opus',
      '10,000 requests / minute',
      'Provisioned throughput',
      'Zero data retention',
      '99.9% uptime SLA',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual contract',
    blurb: 'Dedicated capacity, your region, your compliance regime.',
    cta: 'Talk to sales',
    featured: false,
    features: [
      'Dedicated TR-9 clusters',
      'VPC and on-prem deployment',
      'Custom fine-tuning',
      'HIPAA / FedRAMP support',
      'Named solutions architect',
      '99.99% uptime SLA',
    ],
  },
];

export const TOKEN_PRICING = [
  { model: 'Skynet Opus', input: '$12.00', cached: '$1.20', output: '$60.00' },
  { model: 'Skynet Core', input: '$2.40', cached: '$0.24', output: '$12.00' },
  { model: 'Skynet Edge', input: '$0.30', cached: '$0.03', output: '$1.50' },
];

export const TESTIMONIALS = [
  {
    quote:
      'We moved our incident triage agent to Skynet Core and the false-escalation rate went from 4% to under half a percent. We stopped staffing the overnight rotation.',
    name: 'Priya Raghunathan',
    role: 'VP Platform Engineering, Halcyon Logistics',
  },
  {
    quote:
      'The 4M window is the whole story for us. Our contracts corpus used to need a retrieval pipeline and a team to maintain it. Now it is one call.',
    name: 'Marcus Delacroix',
    role: 'Head of AI, Meridian Legal',
  },
  {
    quote:
      'It ran an eleven-hour dependency migration across 340 repos, checkpointed through two of our own outages, and opened PRs that passed review.',
    name: 'Sam Okonkwo',
    role: 'Staff Engineer, Verdant Systems',
  },
];

export const FAQS = [
  {
    q: 'What does "10× better than Fable" actually mean?',
    a: 'It means 10× fewer errors. On a benchmark where the leading model scores 88.4%, matching it "twice as well" is meaningless — there are only 11.6 points left. Skynet closes 90% of that remaining gap, on all ten benchmarks we publish. Every score in our table is derived from that single rule, so you can check our arithmetic.',
  },
  {
    q: 'How do I migrate from another provider?',
    a: 'The Skynet REST API is a superset of the shape most teams already use: messages in, content blocks out, tools declared as JSON Schema. Most migrations are a base URL, a key, and a model string. Our SDKs ship a compatibility adapter for the rest.',
  },
  {
    q: 'Is my data used for training?',
    a: 'No. Zero retention is the default on every paid plan, not an upgrade. Prompts and completions are dropped as soon as the response is streamed, and they never leave the region you pin.',
  },
  {
    q: 'Can we run Skynet in our own environment?',
    a: 'Enterprise plans support VPC deployment on AWS, GCP, and Azure, and bare-metal on-prem for dedicated TR-9 clusters. Weights stay on Netadyne-managed hardware in all three cases.',
  },
  {
    q: 'What are the rate limits?',
    a: 'Developer is 30 requests per minute on shared capacity. Scale starts at 10,000 per minute with provisioned throughput available. Enterprise capacity is reserved, so it is not a limit so much as a floor.',
  },
];
