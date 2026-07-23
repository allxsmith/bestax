// Content model for the Netadyne / Skynet marketing site.
//
// NOTE: Netadyne and Skynet are fictional. Every benchmark score, price, latency
// figure, and customer quote below is invented demo content — including the
// comparisons to Fable, which is a real model. Nothing here is a measurement.

export type PageId =
  | 'home'
  | 'models'
  | 'benchmarks'
  | 'pricing'
  | 'docs'
  | 'contact';

export const NAV: { id: PageId; label: string }[] = [
  { id: 'models', label: 'Models' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'docs', label: 'Docs' },
];

/**
 * The house claim: Skynet cuts the remaining error on every benchmark by 10x.
 * Every headline score is derived from the baseline with this function, which is
 * what makes "10x better on all benchmarks" a single consistent story rather
 * than eight unrelated numbers.
 */
export const tenXBetter = (baseline: number) => 100 - (100 - baseline) / 10;

export interface Benchmark {
  name: string;
  domain: string;
  blurb: string;
  fable: number;
  openModel: number;
}

/** `skynet` is always tenXBetter(fable) — see the note above. */
export const BENCHMARKS: Benchmark[] = [
  {
    name: 'MMLU-Pro',
    domain: 'Reasoning',
    blurb: 'Graduate-level multitask knowledge across 14 disciplines.',
    fable: 89.0,
    openModel: 81.4,
  },
  {
    name: 'GPQA Diamond',
    domain: 'Science',
    blurb: 'PhD-authored physics, chemistry and biology questions.',
    fable: 82.0,
    openModel: 70.2,
  },
  {
    name: 'SWE-bench Verified',
    domain: 'Agentic coding',
    blurb: 'Resolving real GitHub issues end to end in a live repo.',
    fable: 78.0,
    openModel: 64.8,
  },
  {
    name: 'Terminal-bench',
    domain: 'Tool use',
    blurb: 'Long-horizon shell tasks with irreversible side effects.',
    fable: 60.0,
    openModel: 42.5,
  },
  {
    name: 'AIME 2025',
    domain: 'Mathematics',
    blurb: 'Competition math, no calculator, no retries.',
    fable: 90.0,
    openModel: 79.1,
  },
  {
    name: 'LiveCodeBench',
    domain: 'Code',
    blurb: 'Contamination-free competitive programming, rolling window.',
    fable: 80.0,
    openModel: 68.3,
  },
  {
    name: 'MMMU',
    domain: 'Multimodal',
    blurb: 'College-level reasoning over diagrams, charts and figures.',
    fable: 77.0,
    openModel: 63.9,
  },
  {
    name: 'MGSM',
    domain: 'Multilingual',
    blurb: 'Grade-school math reasoning across 10 low-resource languages.',
    fable: 92.0,
    openModel: 85.6,
  },
];

export interface ModelSpec {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  context: string;
  latency: string;
  inputPrice: string;
  outputPrice: string;
  best: string;
  featured?: boolean;
}

export const MODELS: ModelSpec[] = [
  {
    id: 'skynet-nova',
    name: 'Skynet Nova',
    tagline: 'The frontier model. Every benchmark, 10x fewer errors.',
    icon: 'star',
    context: '4M tokens',
    latency: '0.28 s first token',
    inputPrice: '$4.00 / MTok',
    outputPrice: '$20.00 / MTok',
    best: 'Agentic engineering, research, high-stakes analysis',
    featured: true,
  },
  {
    id: 'skynet-flash',
    name: 'Skynet Flash',
    tagline: 'Nova-class judgement at conversational speed.',
    icon: 'bolt',
    context: '1M tokens',
    latency: '0.06 s first token',
    inputPrice: '$0.40 / MTok',
    outputPrice: '$2.00 / MTok',
    best: 'Chat, routing, classification, high-volume pipelines',
  },
  {
    id: 'skynet-edge',
    name: 'Skynet Edge',
    tagline: 'Runs on your hardware. Never leaves your network.',
    icon: 'microchip',
    context: '256K tokens',
    latency: '0.04 s on-device',
    inputPrice: 'Licensed',
    outputPrice: 'Licensed',
    best: 'Air-gapped, regulated and on-prem deployments',
  },
];

export interface Feature {
  icon: string;
  title: string;
  body: string;
}

export const FEATURES: Feature[] = [
  {
    icon: 'gauge-high',
    title: '10x lower error rate',
    body: 'Not a point or two on a leaderboard. Skynet Nova removes 90% of the remaining errors on every public benchmark we report.',
  },
  {
    icon: 'diagram-project',
    title: 'Agents that finish',
    body: 'A 4M-token context and stable tool-calling let Skynet run multi-hour workflows without losing the plot or the thread of a repo.',
  },
  {
    icon: 'bolt',
    title: 'Sub-300ms to first token',
    body: 'Netadyne serves Skynet on its own inference fabric, so frontier quality no longer means waiting on a spinner.',
  },
  {
    icon: 'shield-halved',
    title: 'Governed by default',
    body: 'SOC 2 Type II, ISO 27001, HIPAA and GDPR ready. Zero-retention endpoints and per-key data residency on every plan.',
  },
  {
    icon: 'plug',
    title: 'Drop-in migration',
    body: 'An OpenAI- and Anthropic-compatible surface means most teams move a production workload over by changing a base URL.',
  },
  {
    icon: 'chart-line',
    title: 'Evals you can see',
    body: 'Every response is traceable: token-level cost, tool spans, and regression scores against your own eval set in the console.',
  },
];

export interface UseCase {
  icon: string;
  title: string;
  body: string;
  metric: string;
  metricLabel: string;
}

export const USE_CASES: UseCase[] = [
  {
    icon: 'code',
    title: 'Software engineering',
    body: 'Skynet takes an issue, reads the repo, writes the patch, runs the suite and opens the PR — then explains what it chose not to change.',
    metric: '97.8%',
    metricLabel: 'SWE-bench Verified',
  },
  {
    icon: 'flask',
    title: 'Research & analysis',
    body: 'Ingest a decade of filings, papers or trial data in one context window and get a cited answer instead of a summary of a summary.',
    metric: '4M',
    metricLabel: 'token context',
  },
  {
    icon: 'headset',
    title: 'Customer operations',
    body: 'Flash handles the front line at chat latency and escalates to Nova only when a case genuinely needs the frontier model.',
    metric: '11x',
    metricLabel: 'cheaper per resolved ticket',
  },
];

export interface Tier {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  cta: string;
  featured?: boolean;
  features: string[];
}

export const TIERS: Tier[] = [
  {
    name: 'Explorer',
    price: '$0',
    cadence: 'forever',
    blurb: 'Everything you need to decide whether the benchmarks hold up on your own work.',
    cta: 'Start free',
    features: [
      '1M Flash tokens per month',
      '100K Nova tokens per month',
      'Console, playground and eval runner',
      'Community support',
    ],
  },
  {
    name: 'Builder',
    price: '$79',
    cadence: 'per seat / month',
    blurb: 'For teams shipping their first Skynet-backed product to real users.',
    cta: 'Start 14-day trial',
    features: [
      'Pay-as-you-go at list token pricing',
      '2,000 requests / minute',
      'Batch API at 50% off',
      'Prompt caching and shared eval sets',
      'Email support, 1 business day',
    ],
  },
  {
    name: 'Scale',
    price: '$499',
    cadence: 'per seat / month',
    blurb: 'Production traffic with the throughput and controls a platform team expects.',
    cta: 'Talk to sales',
    featured: true,
    features: [
      '20% volume discount above 500M tokens',
      '20,000 requests / minute',
      'Provisioned throughput reservations',
      'Zero-retention endpoints + data residency',
      'SSO, SCIM and audit log export',
      'Slack channel, 1-hour response SLA',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual agreement',
    blurb: 'Dedicated capacity, custom weights, and Skynet Edge inside your own perimeter.',
    cta: 'Contact us',
    features: [
      'Dedicated inference clusters',
      'Fine-tuning and custom distillations',
      'Skynet Edge on-prem licence',
      '99.95% uptime SLA',
      'Named solutions architect',
      'Indemnification and custom terms',
    ],
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'What does "10x better than Fable" actually mean?',
    a: 'It means error rate, not raw score. On a benchmark where a frontier model scores 89%, the interesting number is the 11% it misses. Skynet Nova scores 98.9% — the same benchmark with a tenth of the mistakes. We publish that ratio for every eval we report rather than a headline average.',
  },
  {
    q: 'Can I run your evals myself?',
    a: 'Yes. Every benchmark on this site ships as a runnable harness in the netadyne/skynet-evals repository, pinned to the exact prompts, sampling parameters and scoring code we used. Bring your own key and reproduce the table.',
  },
  {
    q: 'How hard is migration?',
    a: 'For most teams it is a base URL and a model string. The Skynet API accepts OpenAI- and Anthropic-shaped requests, including streaming, tool calls and structured outputs, and returns usage in both formats.',
  },
  {
    q: 'Do you train on my data?',
    a: 'No. API traffic is never used for training on any plan. Scale and Enterprise add zero-retention endpoints, where prompts and completions are discarded the moment the response is streamed.',
  },
  {
    q: 'What happens when I exceed my rate limit?',
    a: 'You get a 429 with a Retry-After header and a suggested backoff — never a silent truncation or a downgraded model. Provisioned throughput on Scale and above removes the ceiling entirely.',
  },
  {
    q: 'Is there an on-premise option?',
    a: 'Skynet Edge runs on a single 8-GPU node or a modest CPU cluster and speaks the same API as the hosted models. It is licensed annually and available on the Enterprise plan.',
  },
];

export interface Quote {
  body: string;
  name: string;
  role: string;
  initials: string;
}

export const QUOTES: Quote[] = [
  {
    body: 'We ran our own eval set the week Nova shipped. The failure bucket we had been grinding at for two quarters dropped by an order of magnitude overnight. That is not a model upgrade, that is a different roadmap.',
    name: 'Priya Raghunathan',
    role: 'VP Engineering, Halcyon Systems',
    initials: 'PR',
  },
  {
    body: 'Our agents used to lose the thread around hour one. Skynet holds the whole monorepo in context and still knows which change it made and why at the end of a six-hour run.',
    name: 'Marcus Oyelaran',
    role: 'Head of Platform, Verdant Labs',
    initials: 'MO',
  },
  {
    body: 'Flash costs us less per resolved ticket than the routing layer it replaced, and the escalation rate to a human went down, not up.',
    name: 'Dana Weiss',
    role: 'Director of Support Ops, Northwind Retail',
    initials: 'DW',
  },
];

export const STATS = [
  { value: '10x', label: 'fewer errors than Fable' },
  { value: '4M', label: 'token context window' },
  { value: '280ms', label: 'to first token' },
  { value: '99.95%', label: 'uptime, Enterprise SLA' },
];

export const LOGOS = [
  'HALCYON',
  'VERDANT',
  'NORTHWIND',
  'ARCLIGHT',
  'MERIDIAN',
  'KESTREL',
];
