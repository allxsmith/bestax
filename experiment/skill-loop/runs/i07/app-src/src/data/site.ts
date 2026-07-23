/**
 * Content for the Netadyne marketing site.
 *
 * FICTION NOTICE: Netadyne and Skynet are invented for this demo, and every
 * figure below is illustrative — no real evaluation was run. The Skynet score
 * is *derived* from the Fable 5 score so the headline claim is literally true
 * of this dataset: the residual error is exactly one tenth (see `skynetScore`).
 */

/** 10× fewer errors: err_skynet = err_fable / 10. */
export const ERROR_FACTOR = 10;

export const skynetScore = (fable: number) =>
  Math.round((100 - (100 - fable) / ERROR_FACTOR) * 10) / 10;

export interface Benchmark {
  name: string;
  measures: string;
  fable: number;
  meridian: number;
}

export const BENCHMARKS: Benchmark[] = [
  {
    name: 'MMLU-Pro',
    measures: 'Expert knowledge across 14 domains',
    fable: 88.0,
    meridian: 84.1,
  },
  {
    name: 'GPQA Diamond',
    measures: 'Graduate-level physics, chemistry, biology',
    fable: 84.0,
    meridian: 79.6,
  },
  {
    name: 'SWE-bench Verified',
    measures: 'Resolving real GitHub issues end to end',
    fable: 79.0,
    meridian: 71.4,
  },
  {
    name: 'Terminal-bench',
    measures: 'Long-horizon agentic work in a real shell',
    fable: 62.0,
    meridian: 54.8,
  },
  {
    name: 'AIME 2025',
    measures: 'Olympiad-level competition mathematics',
    fable: 92.0,
    meridian: 88.3,
  },
  {
    name: 'LiveCodeBench v6',
    measures: 'Contamination-free competitive programming',
    fable: 81.0,
    meridian: 74.2,
  },
  {
    name: 'τ²-bench',
    measures: 'Multi-turn tool use against live APIs',
    fable: 85.0,
    meridian: 77.9,
  },
  {
    name: 'MMMU-Pro',
    measures: 'Charts, diagrams, and document understanding',
    fable: 76.0,
    meridian: 70.5,
  },
  {
    name: 'MRCR v2 (1M ctx)',
    measures: 'Needle retrieval across a full context window',
    fable: 68.0,
    meridian: 59.1,
  },
];

export interface ModelTier {
  id: string;
  name: string;
  tagline: string;
  context: string;
  input: string;
  output: string;
  icon: string;
  color: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

export const MODELS: ModelTier[] = [
  {
    id: 'skynet-nano',
    name: 'Skynet Nano',
    tagline: 'Sub-second responses for classification, routing, and extraction.',
    context: '512K',
    input: '$0.15',
    output: '$0.60',
    icon: 'bolt',
    color: 'info',
  },
  {
    id: 'skynet-core',
    name: 'Skynet Core',
    tagline: 'The default: frontier reasoning at production latency and cost.',
    context: '2M',
    input: '$1.80',
    output: '$9.00',
    icon: 'brain',
    color: 'primary',
  },
  {
    id: 'skynet-ultra',
    name: 'Skynet Ultra',
    tagline: 'Maximum capability for research, discovery, and agent fleets.',
    context: '4M',
    input: '$9.00',
    output: '$45.00',
    icon: 'atom',
    color: 'link',
  },
];

export interface Capability {
  icon: string;
  title: string;
  body: string;
}

export const CAPABILITIES: Capability[] = [
  {
    icon: 'diagram-project',
    title: 'Deliberate reasoning',
    body: 'Skynet plans before it answers, with a controllable thinking budget you set per request — from instant to exhaustive.',
  },
  {
    icon: 'screwdriver-wrench',
    title: 'Native tool use',
    body: 'Parallel tool calls, typed schemas, and automatic retry on malformed output. 98.5 on τ²-bench without a scaffold.',
  },
  {
    icon: 'infinity',
    title: '4M token context',
    body: 'Load an entire monorepo, a decade of filings, or a full patient history — with 96.8 recall at the far end of the window.',
  },
  {
    icon: 'robot',
    title: 'Agent runtime',
    body: 'Durable multi-hour sessions with checkpointing, sandboxed execution, and per-step budget caps you can enforce.',
  },
  {
    icon: 'image',
    title: 'Omni input',
    body: 'Text, images, PDFs, audio, and video in the same turn. Charts and scanned documents parse without a preprocessing step.',
  },
  {
    icon: 'shield-halved',
    title: 'Aligned by construction',
    body: 'Constitutional training, a published model card, and a hard interpretability veto on any weight release.',
  },
];

export interface Plan {
  name: string;
  price: string;
  period: string;
  blurb: string;
  cta: string;
  featured?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    name: 'Developer',
    price: '$0',
    period: 'forever',
    blurb: 'Everything you need to build and ship a prototype.',
    cta: 'Get an API key',
    features: [
      '10M free tokens each month',
      'All three Skynet models',
      '60 requests / minute',
      'Community support',
      'Usage dashboard + logs',
    ],
  },
  {
    name: 'Scale',
    price: '$499',
    period: 'per month + usage',
    blurb: 'Production traffic, higher limits, and a support commitment.',
    cta: 'Start on Scale',
    featured: true,
    features: [
      'Everything in Developer',
      '10,000 requests / minute',
      'Batch API at 50% off',
      'Prompt caching + fine-tuning',
      '99.9% uptime SLA',
      'Email support, 4-hour response',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'annual commitment',
    blurb: 'Dedicated capacity, deployment choice, and a named team.',
    cta: 'Talk to sales',
    features: [
      'Everything in Scale',
      'Reserved throughput units',
      'VPC, on-prem, or air-gapped',
      'SOC 2 Type II, HIPAA, FedRAMP',
      'Zero data retention by default',
      'Named solutions architect',
    ],
  },
];

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: 'Is the 10× claim really true on every benchmark?',
    answer:
      'On this (fictional) evaluation set, yes — by construction. We report residual error rate rather than raw score because frontier benchmarks saturate: going from 88 to 98.8 looks like a 12% improvement and is actually a 10× reduction in the mistakes that reach your users.',
  },
  {
    question: 'What happens to my data?',
    answer:
      'Nothing is trained on by default, on any plan. Enterprise accounts can set zero-day retention, in which case prompts and completions are dropped from memory the moment the response finishes streaming.',
  },
  {
    question: 'Can I run Skynet in my own cloud?',
    answer:
      'Enterprise supports VPC deployment on AWS, GCP, and Azure, plus fully air-gapped installs for regulated workloads. Weights stay encrypted and attested; you bring the hardware.',
  },
  {
    question: 'How do you price cached and batched requests?',
    answer:
      'Cache reads bill at 10% of the input rate and cache writes at 125%. The Batch API is 50% off both directions with a 24-hour completion window.',
  },
  {
    question: 'Does the name mean it will become self-aware?',
    answer:
      'No. Netadyne runs a mandatory interpretability review before any capability release, and every deployment ships with a hardware-level stop. The name is a joke our safety team has asked us to stop making.',
  },
];

export interface Milestone {
  year: string;
  title: string;
  body: string;
}

export const MILESTONES: Milestone[] = [
  {
    year: '2019',
    title: 'Netadyne founded',
    body: 'Six researchers leave frontier labs to work on scalable oversight before scaling capability.',
  },
  {
    year: '2021',
    title: 'The Adyne architecture',
    body: 'A sparse recurrent-attention hybrid that keeps recall flat as context grows. Published in full.',
  },
  {
    year: '2023',
    title: 'Skynet 0 in preview',
    body: '4,000 design partners, 1.2 trillion tokens served, and the first external red-team program.',
  },
  {
    year: '2026',
    title: 'Skynet 1 general availability',
    body: '10× lower error rates than Fable 5 across every public benchmark we could reproduce.',
  },
];

export interface Quote {
  quote: string;
  name: string;
  title: string;
}

export const QUOTES: Quote[] = [
  {
    quote:
      'We replaced a five-model routing stack with one Skynet Core endpoint. Our escalation rate to human agents fell by an order of magnitude in the first week.',
    name: 'Priya Raghunathan',
    title: 'VP Engineering, Halcyon Health',
  },
  {
    quote:
      'The 4M context is not a spec-sheet number. We load the entire codebase — 2.1M tokens — and it still finds the one function that matters.',
    name: 'Tobias Lindqvist',
    title: 'Principal Engineer, Northgate Systems',
  },
  {
    quote:
      'Migration took an afternoon. The API is close enough to what we already had that our adapter was forty lines.',
    name: 'Dani Okoro',
    title: 'CTO, Fieldmark',
  },
];

export const CUSTOMERS = [
  'Halcyon Health',
  'Northgate Systems',
  'Fieldmark',
  'Auroral',
  'Kestrel Bank',
  'Vantage Robotics',
];

export const CODE_SAMPLES: { id: string; label: string; icon: string; code: string }[] =
  [
    {
      id: 'python',
      label: 'Python',
      icon: 'python',
      code: `from netadyne import Netadyne

client = Netadyne()

response = client.messages.create(
    model="skynet-core",
    max_tokens=1024,
    thinking={"budget_tokens": 4000},
    messages=[
        {"role": "user", "content": "Audit this contract for renewal risk."}
    ],
)

print(response.content[0].text)`,
    },
    {
      id: 'typescript',
      label: 'TypeScript',
      icon: 'js',
      code: `import Netadyne from '@netadyne/sdk';

const client = new Netadyne();

const response = await client.messages.create({
  model: 'skynet-core',
  max_tokens: 1024,
  thinking: { budget_tokens: 4000 },
  messages: [
    { role: 'user', content: 'Audit this contract for renewal risk.' },
  ],
});

console.log(response.content[0].text);`,
    },
    {
      id: 'curl',
      label: 'cURL',
      icon: 'terminal',
      code: `curl https://api.netadyne.com/v1/messages \\
  -H "x-api-key: $NETADYNE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "skynet-core",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Audit this contract for renewal risk." }
    ]
  }'`,
    },
  ];
