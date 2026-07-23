// Content model for the Netadyne / Skynet marketing site.
//
// NOTE: Netadyne and Skynet are fictional. Every score, price, and quote below is
// invented sample copy for this demo site — none of it is measured or sourced.

export const ROUTES = [
  'home',
  'skynet',
  'benchmarks',
  'platform',
  'pricing',
  'company',
  'contact',
] as const;

export type Route = (typeof ROUTES)[number];

export const NAV_LINKS: { route: Route; label: string }[] = [
  { route: 'skynet', label: 'Skynet' },
  { route: 'benchmarks', label: 'Benchmarks' },
  { route: 'platform', label: 'Platform' },
  { route: 'pricing', label: 'Pricing' },
  { route: 'company', label: 'Company' },
];

/* ---------------------------------------------------------------- benchmarks */

export interface Benchmark {
  /** Benchmark name as published. */
  name: string;
  /** Capability area it probes. */
  domain: string;
  /** What the number means. */
  metric: string;
  skynet: number;
  fable: number;
}

/**
 * Every row holds the same relationship: Skynet leaves one tenth of the residual
 * error Fable does — the "10x better" claim, stated the only way it can be
 * stated consistently across saturated and unsaturated benchmarks alike.
 */
export const BENCHMARKS: Benchmark[] = [
  {
    name: 'MMLU-Pro',
    domain: 'General reasoning',
    metric: '0-shot CoT',
    skynet: 98.7,
    fable: 87.0,
  },
  {
    name: 'GPQA Diamond',
    domain: 'Graduate science',
    metric: '0-shot',
    skynet: 97.9,
    fable: 79.0,
  },
  {
    name: 'SWE-bench Verified',
    domain: 'Software engineering',
    metric: 'Resolved',
    skynet: 97.5,
    fable: 74.5,
  },
  {
    name: 'Terminal-Bench 2.0',
    domain: 'Agentic computer use',
    metric: 'Task success',
    skynet: 95.8,
    fable: 58.0,
  },
  {
    name: 'AIME 2025',
    domain: 'Competition math',
    metric: 'Pass@1',
    skynet: 99.2,
    fable: 92.0,
  },
  {
    name: 'MATH-500',
    domain: 'Mathematics',
    metric: 'Pass@1',
    skynet: 99.6,
    fable: 96.0,
  },
  {
    name: 'LiveCodeBench v6',
    domain: 'Competitive coding',
    metric: 'Pass@1',
    skynet: 98.1,
    fable: 81.0,
  },
  {
    name: 'HumanEval+',
    domain: 'Code generation',
    metric: 'Pass@1',
    skynet: 99.4,
    fable: 93.5,
  },
  {
    name: 'MMMU',
    domain: 'Multimodal reasoning',
    metric: 'Validation',
    skynet: 97.6,
    fable: 76.0,
  },
  {
    name: 'TAU-bench Retail',
    domain: 'Tool use',
    metric: 'Pass^1',
    skynet: 98.2,
    fable: 82.0,
  },
  {
    name: 'BFCL v3',
    domain: 'Function calling',
    metric: 'Overall',
    skynet: 97.1,
    fable: 71.0,
  },
  {
    name: 'MRCR (2M ctx)',
    domain: 'Long context',
    metric: '8-needle',
    skynet: 96.8,
    fable: 68.0,
  },
  {
    name: 'FinanceBench',
    domain: 'Document QA',
    metric: 'Accuracy',
    skynet: 98.4,
    fable: 84.0,
  },
  {
    name: 'Global-MMLU (26 langs)',
    domain: 'Multilingual',
    metric: 'Average',
    skynet: 98.9,
    fable: 89.0,
  },
];

/** Featured on the home page; the rest live on /benchmarks. */
export const FEATURED_BENCHMARKS = BENCHMARKS.slice(0, 4);

export const errorReduction = (b: Benchmark) =>
  Math.round((100 - b.fable) / (100 - b.skynet));

/* ------------------------------------------------------------------- models */

export interface Model {
  name: string;
  tagline: string;
  blurb: string;
  icon: string;
  context: string;
  latency: string;
  best: string;
  featured?: boolean;
}

export const MODELS: Model[] = [
  {
    name: 'Skynet Ultra',
    tagline: 'Frontier reasoning',
    blurb:
      'The full model. Extended deliberation, self-verifying chains, and the scores that back the 10x claim. Built for work where being wrong is expensive.',
    icon: 'brain',
    context: '2M tokens',
    latency: '~340 ms TTFT',
    best: 'Research, autonomous engineering, high-stakes analysis',
    featured: true,
  },
  {
    name: 'Skynet Pro',
    tagline: 'The workhorse',
    blurb:
      'Ultra-class quality on the tasks that make up 95% of production traffic, at a fifth of the cost. The default choice for most deployments.',
    icon: 'bolt',
    context: '1M tokens',
    latency: '~120 ms TTFT',
    best: 'Assistants, RAG, code review, batch pipelines',
  },
  {
    name: 'Skynet Edge',
    tagline: 'Latency first',
    blurb:
      'A distilled 12B checkpoint that runs on a single accelerator — or in your own VPC, air-gapped, with the same tokenizer and tool schema.',
    icon: 'microchip',
    context: '256K tokens',
    latency: '~18 ms TTFT',
    best: 'Routing, classification, on-device, real-time voice',
  },
];

/* ----------------------------------------------------------------- features */

export interface Feature {
  title: string;
  body: string;
  icon: string;
}

export const FEATURES: Feature[] = [
  {
    title: 'Reasoning that holds',
    body: 'Skynet plans before it answers and checks itself after. On multi-step problems the error rate stops compounding — which is where every other model comes apart.',
    icon: 'diagram-project',
  },
  {
    title: 'Agentic from the ground up',
    body: 'Parallel tool calls, typed schemas, resumable sessions, and a computer-use surface that survives a thousand-step trajectory without losing the thread.',
    icon: 'robot',
  },
  {
    title: 'Two million tokens',
    body: 'A whole monorepo, a decade of filings, or 40 hours of transcripts in one prompt — with 96.8% recall at full depth, not just at the edges.',
    icon: 'layer-group',
  },
  {
    title: 'Natively multimodal',
    body: 'Text, images, audio, video, and structured tables share one representation. No adapters, no separate vision endpoint, no lossy hand-off.',
    icon: 'eye',
  },
  {
    title: 'Runs where you do',
    body: 'Netadyne Cloud, your VPC, or fully air-gapped on-premise hardware. Identical weights, identical API, identical evaluation harness.',
    icon: 'server',
  },
  {
    title: 'Governed by default',
    body: 'Skynet Guard ships in front of every deployment: policy routing, audit trails, PII redaction, and a hard kill-switch you hold the key to.',
    icon: 'shield-halved',
  },
];

/* ------------------------------------------------------------------ pricing */

export interface Plan {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  cta: string;
  featured?: boolean;
  items: string[];
}

export const PLANS: Plan[] = [
  {
    name: 'Developer',
    price: '$0',
    cadence: 'to start',
    blurb: 'Everything you need to build and ship a prototype.',
    cta: 'Start building',
    items: [
      '$5 in credits, no card required',
      'Skynet Pro and Edge',
      '60 requests / minute',
      'Community support',
    ],
  },
  {
    name: 'Scale',
    price: '$400',
    cadence: 'per seat / month',
    blurb: 'For teams running Skynet in production.',
    cta: 'Get API access',
    featured: true,
    items: [
      'All three Skynet models',
      '10,000 requests / minute',
      'Provisioned throughput',
      'Prompt caching and batch at 50% off',
      '99.9% uptime SLA',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual',
    blurb: 'For deployments with a compliance department.',
    cta: 'Talk to sales',
    items: [
      'VPC, on-premise, or air-gapped',
      'Dedicated capacity and named SRE',
      'SOC 2 Type II, ISO 27001, HIPAA, FedRAMP High',
      'Custom fine-tunes and evaluation harnesses',
      'Zero data retention by contract',
    ],
  },
];

export interface TokenPrice {
  model: string;
  input: string;
  output: string;
  cached: string;
}

export const TOKEN_PRICES: TokenPrice[] = [
  {
    model: 'Skynet Ultra',
    input: '$9.00',
    output: '$36.00',
    cached: '$0.90',
  },
  { model: 'Skynet Pro', input: '$1.80', output: '$7.20', cached: '$0.18' },
  { model: 'Skynet Edge', input: '$0.15', output: '$0.60', cached: '$0.02' },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'What exactly does "10x better than Fable" mean?',
    a: 'Residual error. On every benchmark we publish, the fraction of items Skynet gets wrong is one tenth of the fraction Fable gets wrong. On a saturated benchmark that is a couple of points of headline score; on an unsaturated one like Terminal-Bench it is 38 points. Same ratio, both times.',
  },
  {
    q: 'Can I reproduce the numbers?',
    a: 'The harness, prompts, decoding parameters, and per-item traces are published alongside every release. Scale customers can run the suite against their own key and diff the results.',
  },
  {
    q: 'How is billing calculated?',
    a: 'Per million tokens, metered per request, billed monthly in arrears. Cached input tokens bill at 10% and batch requests at 50%. Seats are billed separately on the Scale plan.',
  },
  {
    q: 'Do you train on my data?',
    a: 'No. API traffic is never used for training. Scale and Enterprise deployments can additionally enable zero data retention, which drops prompts and completions the moment the response is streamed.',
  },
  {
    q: 'What happens if I exceed my rate limit?',
    a: 'Requests queue for up to 30 seconds before returning 429, and the response carries a Retry-After header. Provisioned throughput removes the ceiling entirely.',
  },
  {
    q: 'Is there a migration path from another provider?',
    a: 'The API is message-shaped and tool schemas are JSON Schema, so most ports are a base URL and a model string. Our compatibility shim accepts the two most common request formats unmodified.',
  },
];

/* ---------------------------------------------------------------- proof/etc */

export interface Quote {
  body: string;
  name: string;
  role: string;
  initials: string;
}

export const QUOTES: Quote[] = [
  {
    body: 'We had an eleven-person team triaging incident reports. Skynet Pro does the first pass now, and the escalation rate is lower than the humans managed. That was not the outcome we projected.',
    name: 'Priya Raghunathan',
    role: 'VP Engineering, Halcyon Logistics',
    initials: 'PR',
  },
  {
    body: 'The long-context recall is the part nobody believes until they run it. We put an entire drug submission in one prompt — 1.4 million tokens — and it found the inconsistency our reviewers missed.',
    name: 'Marcus Oyelaran',
    role: 'Head of Data Science, Verrik Bio',
    initials: 'MO',
  },
  {
    body: 'We ran the agentic suite ourselves because we did not believe the published numbers. They reproduced within half a point. Migration took an afternoon.',
    name: 'Dana Iversen',
    role: 'Principal Architect, Northgate Financial',
    initials: 'DI',
  },
];

export const STATS = [
  { label: 'Residual error vs Fable', value: '10x lower', icon: 'chart-line' },
  { label: 'Benchmarks led', value: '14 of 14', icon: 'trophy' },
  { label: 'Context window', value: '2M tokens', icon: 'layer-group' },
  { label: 'Tokens served daily', value: '4.1T', icon: 'bolt' },
];

export const TIMELINE = [
  {
    year: '2019',
    title: 'Netadyne founded',
    body: 'Eight researchers, a sublet in Bellevue, and a thesis that verification — not scale alone — was the missing ingredient.',
  },
  {
    year: '2021',
    title: 'The Adyne architecture',
    body: 'Our first paper on self-verifying decoding. Ignored for a year, then cited 4,000 times in the next eighteen months.',
  },
  {
    year: '2023',
    title: 'Netadyne Cloud',
    body: 'The platform opens to developers. 40,000 sign-ups in the first week take the waitlist offline twice.',
  },
  {
    year: '2025',
    title: 'Skynet 1.0',
    body: 'The first model to cut residual error by an order of magnitude across every benchmark in its evaluation suite.',
  },
];

export const VALUES = [
  {
    title: 'Publish the harness',
    body: 'A benchmark you cannot reproduce is marketing. Every number we print ships with the code that produced it.',
    icon: 'flask',
  },
  {
    title: 'Verification over vibes',
    body: 'A model that knows when it is wrong is worth more than one that is right slightly more often.',
    icon: 'circle-check',
  },
  {
    title: 'The operator holds the key',
    body: 'Kill-switches, audit logs, and retention policy belong to the customer. We build the lock; you keep it.',
    icon: 'key',
  },
];
