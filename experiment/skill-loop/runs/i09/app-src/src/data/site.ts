// All marketing copy and figures for the Netadyne / Skynet site live here so the
// page components stay layout-only.
//
// NOTE: Netadyne and Skynet are fictional. Every benchmark figure below is
// invented for this demo — see the disclaimer rendered in the site footer.

export type PageId =
  | 'home'
  | 'models'
  | 'benchmarks'
  | 'pricing'
  | 'contact';

export const NAV_PAGES: { id: PageId; label: string }[] = [
  { id: 'models', label: 'Models' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'contact', label: 'Contact sales' },
];

/**
 * Scores are Netadyne Eval Index points on a 0–1000 scale, which is what makes
 * a 10x headline expressible at all (a 0–100 accuracy percentage caps out).
 */
export interface Benchmark {
  id: string;
  name: string;
  domain: string;
  skynet: number;
  fable: number;
}

export const BENCHMARKS: Benchmark[] = [
  {
    id: 'mmlu-pro',
    name: 'MMLU-Pro',
    domain: 'Graduate-level reasoning',
    skynet: 872,
    fable: 86,
  },
  {
    id: 'gpqa',
    name: 'GPQA Diamond',
    domain: 'Expert science Q&A',
    skynet: 806,
    fable: 79,
  },
  {
    id: 'swe-bench',
    name: 'SWE-bench Verified',
    domain: 'Agentic software engineering',
    skynet: 861,
    fable: 82,
  },
  {
    id: 'terminal-bench',
    name: 'Terminal-Bench',
    domain: 'Computer & shell use',
    skynet: 597,
    fable: 58,
  },
  {
    id: 'aime',
    name: 'AIME 2026',
    domain: 'Competition mathematics',
    skynet: 928,
    fable: 91,
  },
  {
    id: 'mmmu',
    name: 'MMMU',
    domain: 'Multimodal understanding',
    skynet: 785,
    fable: 77,
  },
  {
    id: 'longbench',
    name: 'LongBench-10M',
    domain: 'Long-context retrieval',
    skynet: 762,
    fable: 74,
  },
  {
    id: 'tau-bench',
    name: 'τ-bench (retail + airline)',
    domain: 'Multi-turn tool use',
    skynet: 834,
    fable: 81,
  },
];

/** Rounded advantage multiple, e.g. 10.1 — recomputed, never hand-typed. */
export const advantage = (b: Benchmark) =>
  Math.round((b.skynet / b.fable) * 10) / 10;

export interface Model {
  id: string;
  name: string;
  tagline: string;
  context: string;
  output: string;
  latency: string;
  inputPrice: string;
  outputPrice: string;
  bestFor: string[];
  icon: string;
  color: 'primary' | 'info' | 'success';
}

export const MODELS: Model[] = [
  {
    id: 'nano',
    name: 'Skynet Nano',
    tagline: 'Real-time intelligence at classification prices.',
    context: '1M tokens',
    output: '64K tokens',
    latency: '38 ms TTFT',
    inputPrice: '$0.20',
    outputPrice: '$1.00',
    bestFor: ['Routing & classification', 'Autocomplete', 'High-volume extraction'],
    icon: 'bolt',
    color: 'info',
  },
  {
    id: 'pro',
    name: 'Skynet Pro',
    tagline: 'The everyday workhorse for production agents.',
    context: '2M tokens',
    output: '128K tokens',
    latency: '71 ms TTFT',
    inputPrice: '$2.50',
    outputPrice: '$12.00',
    bestFor: ['Coding agents', 'RAG over private corpora', 'Customer operations'],
    icon: 'rocket',
    color: 'primary',
  },
  {
    id: 'max',
    name: 'Skynet Max',
    tagline: 'Our frontier model. 10x Fable on every benchmark we run.',
    context: '10M tokens',
    output: '256K tokens',
    latency: '96 ms TTFT',
    inputPrice: '$9.00',
    outputPrice: '$45.00',
    bestFor: ['Autonomous research', 'Whole-repository refactors', 'Formal verification'],
    icon: 'brain',
    color: 'success',
  },
];

export interface Feature {
  icon: string;
  title: string;
  body: string;
}

export const FEATURES: Feature[] = [
  {
    icon: 'layer-group',
    title: '10M-token context',
    body: 'Load an entire monorepo, a decade of filings, or a full patient history in one call — with no retrieval scaffolding to maintain.',
  },
  {
    icon: 'screwdriver-wrench',
    title: 'Tool use that finishes',
    body: 'Skynet plans, calls, retries, and verifies across hundreds of steps. Median agent trajectories complete without a human takeover.',
  },
  {
    icon: 'gauge-high',
    title: 'Sub-100 ms first token',
    body: 'Netadyne runs its own inference fabric on dedicated silicon, so frontier quality no longer means frontier latency.',
  },
  {
    icon: 'lock',
    title: 'Zero-retention by default',
    body: 'Prompts and completions are never persisted, never trained on. SOC 2 Type II, ISO 27001, HIPAA, and GDPR from day one.',
  },
  {
    icon: 'server',
    title: 'Runs where your data lives',
    body: 'Netadyne Cloud, your VPC, or fully air-gapped on-premises — the same weights and the same API surface in all three.',
  },
  {
    icon: 'chart-line',
    title: 'Evals, not vibes',
    body: 'Ship with the Netadyne eval harness: deterministic replay, regression gates in CI, and per-release scorecards.',
  },
];

export interface Tier {
  id: string;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  cta: string;
  featured: boolean;
  includes: string[];
}

export const TIERS: Tier[] = [
  {
    id: 'developer',
    name: 'Developer',
    price: '$0',
    cadence: 'pay per token',
    blurb: 'Everything you need to get a prototype in front of people this week.',
    cta: 'Start building',
    featured: false,
    includes: [
      'All three Skynet models',
      '500K free tokens per month',
      '60 requests / minute',
      'Community support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$60',
    cadence: 'per seat / month',
    blurb: 'For engineering teams running Skynet in production with real traffic.',
    cta: 'Start 30-day trial',
    featured: true,
    includes: [
      'Everything in Developer',
      '10,000 requests / minute',
      'Shared prompt & eval workspace',
      'Batch API at 50% off',
      '99.9% uptime SLA',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual commitment',
    blurb: 'Dedicated capacity, deployment in your environment, and a named team.',
    cta: 'Talk to sales',
    featured: false,
    includes: [
      'Everything in Team',
      'Provisioned throughput',
      'VPC or air-gapped deployment',
      'Custom fine-tuning',
      '99.99% SLA + 24/7 on-call',
    ],
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
    body: 'We replaced a seven-model pipeline with one Skynet Max call. The eval scores went up and our inference bill went down by two thirds.',
    name: 'Priya Raghunathan',
    role: 'VP Engineering, Halcyon Systems',
    initials: 'PR',
  },
  {
    body: 'Ten million tokens of context meant we stopped building retrieval infrastructure entirely. That was four engineers we got back.',
    name: 'Dez Okonkwo',
    role: 'Head of AI, Marrow Financial',
    initials: 'DO',
  },
  {
    body: 'The agent finishes the ticket. That sounds small until you have watched every other model stall on step forty.',
    name: 'Ingrid Sørensen',
    role: 'Staff Engineer, Kestrel Robotics',
    initials: 'IS',
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'What exactly does "10x Fable" mean?',
    a: 'Every benchmark on this site is scored on the Netadyne Eval Index, a 0–1000 point scale weighted by task difficulty and by how many steps a model completes unaided. On that scale Skynet Max scores at least 10.0x Fable on all eight suites we publish. Percentage-accuracy scores are also in the full report.',
  },
  {
    q: 'Can I bring my own data without it being trained on?',
    a: 'Yes. Zero retention is the default on every plan, not an enterprise upsell. Nothing you send is logged beyond the request lifetime or used for training, and you can attest to that with our per-request retention headers.',
  },
  {
    q: 'How do I migrate from another provider?',
    a: 'The Netadyne API is OpenAI- and Anthropic-message-shape compatible. Most teams change a base URL, a model string, and an API key. Our migration guide covers tool-call and streaming differences in about fifteen minutes of reading.',
  },
  {
    q: 'What happens if I exceed my rate limit?',
    a: 'Requests queue rather than fail, up to your burst ceiling, and you get a Retry-After header. Team and Enterprise plans can also route overflow to the Batch API automatically at half the token price.',
  },
  {
    q: 'Is there a free tier for research?',
    a: 'Netadyne for Research grants 250M tokens per quarter to accredited academic labs, plus early access to unreleased checkpoints under NDA. Apply through the contact form and mention your institution.',
  },
];

export const CODE_SAMPLE = `from netadyne import Netadyne

client = Netadyne(api_key=os.environ["NETADYNE_API_KEY"])

response = client.messages.create(
    model="skynet-max",
    max_tokens=4096,
    tools=[repo_search, run_tests, open_pull_request],
    messages=[{
        "role": "user",
        "content": "Port the billing service off the legacy "
                   "scheduler and open a PR when tests are green.",
    }],
)

print(response.content[0].text)`;
