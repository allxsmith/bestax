// Site content for Netadyne / Skynet.
//
// NOTE: Netadyne and Skynet are fictional. Every figure below is illustrative
// marketing copy for a demo site, not a measured result. The "10x" claim is
// defined consistently throughout as a 10x reduction in benchmark error rate
// (see `errorReduction`), which is what makes it expressible on accuracy
// benchmarks that are already in the high 80s and 90s.

export const BASELINE = 'Fable 5';

export interface Benchmark {
  /** Benchmark name. */
  name: string;
  /** What the benchmark measures, one short line. */
  blurb: string;
  /** Baseline score, percent. */
  baseline: number;
  /** Skynet score, percent. */
  skynet: number;
}

export const BENCHMARKS: Benchmark[] = [
  {
    name: 'MMLU-Pro',
    blurb: 'Graduate-level reasoning across 14 disciplines',
    baseline: 88.0,
    skynet: 98.8,
  },
  {
    name: 'GPQA Diamond',
    blurb: 'PhD-level physics, chemistry and biology',
    baseline: 84.0,
    skynet: 98.4,
  },
  {
    name: 'SWE-bench Verified',
    blurb: 'Real GitHub issues resolved end to end',
    baseline: 79.0,
    skynet: 97.9,
  },
  {
    name: 'Terminal-Bench',
    blurb: 'Long-horizon agentic work in a real shell',
    baseline: 62.0,
    skynet: 96.2,
  },
  {
    name: 'LiveCodeBench',
    blurb: 'Contamination-free competitive programming',
    baseline: 81.0,
    skynet: 98.1,
  },
  {
    name: 'AIME 2025',
    blurb: 'Olympiad-level mathematics',
    baseline: 90.0,
    skynet: 99.0,
  },
  {
    name: 'MATH-500',
    blurb: 'Multi-step symbolic derivation',
    baseline: 96.0,
    skynet: 99.6,
  },
  {
    name: 'MMMU',
    blurb: 'Multimodal reasoning over charts and diagrams',
    baseline: 77.0,
    skynet: 97.7,
  },
  {
    name: 'MRCR (1M ctx)',
    blurb: 'Needle retrieval across a full million tokens',
    baseline: 70.0,
    skynet: 97.0,
  },
  {
    name: 'Tau-bench Retail',
    blurb: 'Tool use and policy adherence over long dialogs',
    baseline: 85.0,
    skynet: 98.5,
  },
];

/** How many times smaller Skynet's error rate is versus the baseline. */
export const errorReduction = (b: Benchmark): number =>
  (100 - b.baseline) / (100 - b.skynet);

export interface Stat {
  icon: string;
  value: string;
  label: string;
  color: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

export const HEADLINE_STATS: Stat[] = [
  {
    icon: 'bullseye',
    value: '10×',
    label: `Fewer errors than ${BASELINE} on every benchmark`,
    color: 'primary',
  },
  {
    icon: 'bolt',
    value: '2,400',
    label: 'Output tokens per second, sustained',
    color: 'link',
  },
  {
    icon: 'layer-group',
    value: '10M',
    label: 'Token context window, no quality cliff',
    color: 'info',
  },
  {
    icon: 'sack-dollar',
    value: '72%',
    label: 'Lower cost per resolved task',
    color: 'success',
  },
];

export interface ModelSpec {
  name: string;
  tagline: string;
  context: string;
  speed: string;
  price: string;
  best: string;
  featured?: boolean;
}

export const MODELS: ModelSpec[] = [
  {
    name: 'Skynet Ultra',
    tagline: 'Maximum capability for research and autonomous agents.',
    context: '10M tokens',
    speed: '2,400 tok/s',
    price: '$4.00 / $20.00 per M tokens',
    best: 'Multi-day agent runs, novel research, formal verification',
    featured: true,
  },
  {
    name: 'Skynet Pro',
    tagline: 'The default workhorse — frontier quality at production cost.',
    context: '2M tokens',
    speed: '3,800 tok/s',
    price: '$0.80 / $4.00 per M tokens',
    best: 'Coding, RAG, document analysis, customer-facing assistants',
  },
  {
    name: 'Skynet Mini',
    tagline: 'Near-instant responses for high-volume classification.',
    context: '512K tokens',
    speed: '9,100 tok/s',
    price: '$0.10 / $0.40 per M tokens',
    best: 'Routing, extraction, moderation, edge deployment',
  },
];

export interface Feature {
  icon: string;
  title: string;
  body: string;
}

export const FEATURES: Feature[] = [
  {
    icon: 'brain',
    title: 'Recursive self-critique',
    body: 'Skynet drafts, attacks its own draft, and only then answers. That loop is where the order-of-magnitude error reduction comes from.',
  },
  {
    icon: 'screwdriver-wrench',
    title: 'Native tool use',
    body: 'Parallel function calls, streaming tool results, and stateful sessions that survive a ten-hour agent run without drifting.',
  },
  {
    icon: 'layer-group',
    title: '10M token context',
    body: 'Load an entire monorepo, a decade of filings, or a full case history. Retrieval accuracy stays above 97% at the far end.',
  },
  {
    icon: 'eye',
    title: 'Multimodal by default',
    body: 'Text, images, PDFs, audio and video frames share one representation — no bolted-on encoder, no separate endpoint.',
  },
  {
    icon: 'shield-halved',
    title: 'Interpretable refusals',
    body: 'Every safety intervention emits a machine-readable reason code, so you can audit, appeal, and tune policy per workspace.',
  },
  {
    icon: 'lock',
    title: 'Zero-retention by default',
    body: 'SOC 2 Type II, HIPAA and GDPR ready. Prompts and completions are never trained on and never persisted unless you ask.',
  },
];

export interface Tier {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  cta: string;
  featured?: boolean;
  includes: string[];
}

export const TIERS: Tier[] = [
  {
    name: 'Developer',
    price: '$0',
    cadence: 'to start',
    blurb: 'Everything you need to prototype against Skynet Mini and Pro.',
    cta: 'Get an API key',
    includes: [
      '$25 in free credits',
      'Skynet Mini and Pro',
      '60 requests / minute',
      'Community support',
    ],
  },
  {
    name: 'Scale',
    price: '$450',
    cadence: 'per seat / month',
    blurb: 'Production throughput, the full model line, and a real SLA.',
    cta: 'Start 14-day trial',
    featured: true,
    includes: [
      'All three Skynet models',
      '10M context on Ultra',
      '10,000 requests / minute',
      '99.95% uptime SLA',
      'Batch API at 50% off',
      'Priority email + Slack support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual agreement',
    blurb: 'Dedicated capacity, private deployment, and a named team.',
    cta: 'Talk to sales',
    includes: [
      'Reserved GPU capacity',
      'VPC or on-prem deployment',
      'Custom fine-tuning',
      'Zero-retention guarantee',
      'Named solutions architect',
      '24/7 on-call escalation',
    ],
  },
];

export interface Quote {
  body: string;
  author: string;
  role: string;
  initials: string;
}

export const QUOTES: Quote[] = [
  {
    body: 'We swapped our agent backend to Skynet Pro and our escalation rate fell from 11% to just under 1%. That is the whole business case in one number.',
    author: 'Priya Raghunathan',
    role: 'VP Engineering, Halden Logistics',
    initials: 'PR',
  },
  {
    body: 'Ultra reads our entire 4.2 million line codebase in one context. It found a race condition that had survived six years of code review.',
    author: 'Tomas Ek',
    role: 'Principal Engineer, Varden Systems',
    initials: 'TE',
  },
  {
    body: 'The reason codes on refusals were the unlock for us. Compliance signed off in three weeks instead of nine months.',
    author: 'Dana Osei',
    role: 'Head of AI Governance, Meridian Health',
    initials: 'DO',
  },
];

export const CUSTOMERS = [
  'Halden Logistics',
  'Varden Systems',
  'Meridian Health',
  'Cobalt Freight',
  'Aster Financial',
  'Northgate Labs',
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'What exactly does "10× better" mean?',
    a: `It means a 10× reduction in error rate. On every benchmark we publish, Skynet Ultra gets one tenth as many questions wrong as ${BASELINE}. On MMLU-Pro that is 12.0% wrong versus 1.2% wrong; on SWE-bench Verified it is 21.0% versus 2.1%. We report it this way because raw accuracy is already in the high eighties — a "10× higher score" is not a thing that can exist above 10%.`,
  },
  {
    q: 'Can I reproduce the numbers?',
    a: 'Yes. Every evaluation ships with its harness, prompts, sampling parameters and raw completions in the netadyne/skynet-evals repository. We report pass@1 with temperature 0 and no self-consistency voting unless a row says otherwise.',
  },
  {
    q: 'How do I migrate from another provider?',
    a: 'The REST API is request-compatible with the common chat-completions shape, so most migrations are a base URL and a model string. Our SDKs additionally expose parallel tool calls, prompt caching and the 10M context window.',
  },
  {
    q: 'Do you train on my data?',
    a: 'No. API traffic is zero-retention by default: prompts and completions are held only in memory for the life of the request, and are never used for training on any plan, including the free tier.',
  },
  {
    q: 'What happens if I exceed my rate limit?',
    a: 'You get a 429 with a Retry-After header rather than a silent quality downgrade. Scale and Enterprise plans can burst to 3× the committed limit for up to five minutes per hour.',
  },
  {
    q: 'Is there a batch API?',
    a: 'Yes — submit up to 500,000 requests per job with a 24-hour completion window at half the per-token price. Batch jobs run on the same weights as the synchronous API.',
  },
];
