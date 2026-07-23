// Marketing copy and (illustrative) figures for the Netadyne Skynet site.
// Every benchmark pair below is constructed so that Skynet's residual error rate
// — 100 minus the score — is exactly one tenth of Fable's. That is the "10x" claim.

export interface Benchmark {
  id: string;
  name: string;
  category: string;
  blurb: string;
  skynet: number;
  fable: number;
}

export const BENCHMARKS: Benchmark[] = [
  {
    id: 'swe-bench',
    name: 'SWE-bench Verified',
    category: 'Coding',
    blurb: 'Real GitHub issues resolved end to end in a live repository.',
    skynet: 98.2,
    fable: 82.0,
  },
  {
    id: 'livecodebench',
    name: 'LiveCodeBench v6',
    category: 'Coding',
    blurb: 'Contamination-free competitive programming, rolling problem set.',
    skynet: 98.5,
    fable: 85.0,
  },
  {
    id: 'terminal-bench',
    name: 'Terminal-Bench',
    category: 'Agentic',
    blurb: 'Long-horizon shell work: build, debug, deploy, recover.',
    skynet: 96.0,
    fable: 60.0,
  },
  {
    id: 'tau2',
    name: 'τ²-bench (tool use)',
    category: 'Agentic',
    blurb: 'Multi-turn tool calling against stateful business APIs.',
    skynet: 98.4,
    fable: 84.0,
  },
  {
    id: 'gpqa',
    name: 'GPQA Diamond',
    category: 'Reasoning',
    blurb: 'Google-proof graduate questions in physics, chemistry, biology.',
    skynet: 97.9,
    fable: 79.0,
  },
  {
    id: 'aime',
    name: 'AIME 2025',
    category: 'Reasoning',
    blurb: 'Olympiad-qualifier mathematics, no tools, single attempt.',
    skynet: 99.0,
    fable: 90.0,
  },
  {
    id: 'hle',
    name: 'Frontier Exam (HLE)',
    category: 'Reasoning',
    blurb: 'Expert-written questions designed to resist every current model.',
    skynet: 94.5,
    fable: 45.0,
  },
  {
    id: 'mmlu-pro',
    name: 'MMLU-Pro',
    category: 'Knowledge',
    blurb: '14 domains, ten-way multiple choice, reasoning-heavy variant.',
    skynet: 98.8,
    fable: 88.0,
  },
  {
    id: 'mmmu',
    name: 'MMMU (multimodal)',
    category: 'Multimodal',
    blurb: 'College-level diagrams, charts, schematics and lab figures.',
    skynet: 97.6,
    fable: 76.0,
  },
  {
    id: 'mrcr',
    name: 'MRCR v2 @ 1M tokens',
    category: 'Long context',
    blurb: 'Needle retrieval and synthesis across a full million-token window.',
    skynet: 97.0,
    fable: 70.0,
  },
];

export const BENCHMARK_CATEGORIES = [
  'Coding',
  'Agentic',
  'Reasoning',
  'Knowledge',
  'Multimodal',
  'Long context',
];

/** Residual-error multiple: how many times fewer mistakes Skynet makes. */
export const errorMultiple = (b: Benchmark) =>
  Math.round((100 - b.fable) / (100 - b.skynet));

export interface ModelSpec {
  id: string;
  name: string;
  tagline: string;
  context: string;
  output: string;
  inputPrice: string;
  outputPrice: string;
  latency: string;
  icon: string;
  featured?: boolean;
}

export const MODELS: ModelSpec[] = [
  {
    id: 'skynet-nano',
    name: 'Skynet Nano',
    tagline: 'Classification, routing and extraction at rate-limit speed.',
    context: '512K tokens',
    output: '64K tokens',
    inputPrice: '$0.20',
    outputPrice: '$1.00',
    latency: '~90 ms to first token',
    icon: 'lightning-bolt',
  },
  {
    id: 'skynet-core',
    name: 'Skynet Core',
    tagline: 'The default frontier model. Best cost-to-capability on the market.',
    context: '2M tokens',
    output: '256K tokens',
    inputPrice: '$2.50',
    outputPrice: '$12.00',
    latency: '~240 ms to first token',
    icon: 'brain',
    featured: true,
  },
  {
    id: 'skynet-ultra',
    name: 'Skynet Ultra',
    tagline: 'Maximum-depth reasoning for research and autonomous engineering.',
    context: '4M tokens',
    output: '512K tokens',
    inputPrice: '$9.00',
    outputPrice: '$45.00',
    latency: '~600 ms to first token',
    icon: 'star-four-points',
  },
];

export interface Feature {
  title: string;
  body: string;
  icon: string;
}

export const FEATURES: Feature[] = [
  {
    title: 'Ten times fewer mistakes',
    body: 'On every benchmark we publish, Skynet cuts the residual error rate of Fable by an order of magnitude — not a point or two at the top of the curve.',
    icon: 'target',
  },
  {
    title: 'Four million tokens of context',
    body: 'Load an entire monorepo, a decade of filings, or a full clinical archive. Recall stays flat to the end of the window instead of collapsing past 200K.',
    icon: 'database-outline',
  },
  {
    title: 'Agents that finish',
    body: 'Skynet holds a plan across thousands of tool calls, recovers from failed steps on its own, and reports honestly when a task is not achievable.',
    icon: 'robot-outline',
  },
  {
    title: 'Native multimodality',
    body: 'Text, images, audio, video and structured tables share one representation — no adapters, no lossy hand-off between separate encoders.',
    icon: 'image-multiple',
  },
  {
    title: 'Deterministic tool calling',
    body: 'Schema-constrained decoding guarantees valid JSON on the first attempt. Retry loops and repair prompts stop being part of your architecture.',
    icon: 'code-braces',
  },
  {
    title: 'Deploy anywhere',
    body: 'Netadyne Cloud, your VPC, or fully air-gapped on Skynet Metal appliances. The same weights, the same evals, the same SLA.',
    icon: 'server-network',
  },
];

export interface UseCase {
  title: string;
  body: string;
  metric: string;
  metricLabel: string;
  icon: string;
}

export const USE_CASES: UseCase[] = [
  {
    title: 'Software engineering',
    body: 'Ship features from ticket to merged pull request, with tests, in a single agent run.',
    metric: '98.2%',
    metricLabel: 'SWE-bench Verified',
    icon: 'code-braces',
  },
  {
    title: 'Scientific research',
    body: 'Read the literature, propose experiments, and audit results against raw instrument data.',
    metric: '97.9%',
    metricLabel: 'GPQA Diamond',
    icon: 'microscope',
  },
  {
    title: 'Financial analysis',
    body: 'Reconcile filings, models and transcripts across a full million-token evidence window.',
    metric: '97.0%',
    metricLabel: 'MRCR v2 @ 1M',
    icon: 'finance',
  },
  {
    title: 'Customer operations',
    body: 'Resolve multi-system tickets against live APIs without escalating to a human.',
    metric: '98.4%',
    metricLabel: 'τ²-bench tool use',
    icon: 'account-group',
  },
];

export interface Plan {
  name: string;
  price: string;
  cadence: string;
  summary: string;
  cta: string;
  featured?: boolean;
  items: string[];
}

export const PLANS: Plan[] = [
  {
    name: 'Developer',
    price: '$0',
    cadence: 'to start',
    summary: 'Everything you need to evaluate Skynet against your own tasks.',
    cta: 'Get an API key',
    items: [
      '$25 of free credit',
      'Skynet Nano and Core',
      '60 requests / minute',
      'Community support',
    ],
  },
  {
    name: 'Team',
    price: '$40',
    cadence: 'per seat / month',
    summary: 'For product teams putting Skynet in front of real users.',
    cta: 'Start a 14-day trial',
    featured: true,
    items: [
      'All three Skynet models',
      '10,000 requests / minute',
      'Prompt caching and batch at 50% off',
      'Shared workspaces, keys and usage budgets',
      'Email support, 1 business day',
    ],
  },
  {
    name: 'Scale',
    price: '$2,400',
    cadence: 'per month + usage',
    summary: 'Committed throughput with capacity reserved for your workloads.',
    cta: 'Talk to sales',
    items: [
      'Provisioned throughput units',
      '99.95% uptime SLA',
      'Private VPC deployment',
      'Zero data retention by default',
      'Named solutions architect',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual agreement',
    summary: 'Regulated, sovereign and air-gapped deployments of Skynet.',
    cta: 'Contact Netadyne',
    items: [
      'Skynet Metal on-premise appliances',
      'Custom fine-tunes on your corpus',
      'SOC 2 Type II, ISO 27001, HIPAA, FedRAMP High',
      'Model-behaviour red-team reports',
      '24/7 support, 15-minute response',
    ],
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'What exactly does "10x better than Fable" mean?',
    a: 'It means residual error. On each benchmark we publish, take the share of items the model gets wrong. Fable misses 18% of SWE-bench Verified; Skynet misses 1.8%. Fable misses 21% of GPQA Diamond; Skynet misses 2.1%. That ratio holds — one tenth the mistakes — across every evaluation in our suite. Comparing raw scores at the top of a saturated benchmark hides exactly this.',
  },
  {
    q: 'How do you price context that large?',
    a: 'Per token, at the published rate, with no long-context surcharge. Prompt caching cuts repeated context to 10% of the input price, and batch requests are half price with a 24-hour window.',
  },
  {
    q: 'Do you train on our data?',
    a: 'No. API traffic is never used for training. Team and above run with zero data retention on request; Scale and Enterprise get it by default, enforced at the infrastructure layer.',
  },
  {
    q: 'Can we migrate off another provider?',
    a: 'The Netadyne SDK ships a compatibility layer for the two most common API shapes, so most migrations are a base URL and a model string. Our solutions team will port and re-run your existing eval suite before you commit.',
  },
  {
    q: 'What happens if Skynet is wrong?',
    a: 'It tells you. Skynet is calibrated to report its own confidence and to refuse rather than fabricate when evidence is missing — behaviour we measure and publish alongside capability scores.',
  },
];

export const SAFETY_COMMITMENTS: { title: string; body: string; icon: string }[] =
  [
    {
      title: 'Capability thresholds',
      body: 'Every Skynet checkpoint is evaluated against defined thresholds for cyber, bio and autonomy risk before any external access is granted. A checkpoint that crosses one does not ship.',
      icon: 'scale-balance',
    },
    {
      title: 'Independent red teams',
      body: 'Three external groups hold standing access to pre-release checkpoints under contract, with the right to publish their findings without our approval.',
      icon: 'shield-check',
    },
    {
      title: 'Calibrated refusal',
      body: 'We measure how often Skynet asserts something it cannot support. Honesty metrics ship in the same model card as capability metrics, on the same cadence.',
      icon: 'lock-check',
    },
    {
      title: 'Interpretability first',
      body: 'A fifth of Netadyne research staff work on understanding what Skynet computes internally, and that work gates deployment decisions rather than following them.',
      icon: 'eye-outline',
    },
  ];

export const CUSTOMER_LOGOS = [
  'Helion Aerospace',
  'Meridian Bank',
  'Corvid Robotics',
  'Atlas Genomics',
  'Northwind Energy',
  'Lumen Health',
];

export const TESTIMONIALS: {
  quote: string;
  name: string;
  role: string;
}[] = [
  {
    quote:
      'We replaced a four-model routing stack with one Skynet Core endpoint. Our agent completion rate went from 61% to 96% in a week, and we deleted most of the retry logic we had written.',
    name: 'Priya Raghavan',
    role: 'VP Engineering, Corvid Robotics',
  },
  {
    quote:
      'The million-token window is the whole product for us. Skynet reads an entire deal room and cites its sources correctly. Nothing else we evaluated stayed accurate past a few hundred thousand tokens.',
    name: 'Daniel Okafor',
    role: 'Head of Research, Meridian Bank',
  },
  {
    quote:
      'It refuses when the data is not there. That single behaviour is why our clinicians trust it, and it is why we passed review.',
    name: 'Sofia Lindqvist',
    role: 'Chief Medical Informatics Officer, Lumen Health',
  },
];
