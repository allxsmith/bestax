/**
 * Marketing copy and figures for the Netadyne / Skynet site.
 *
 * Netadyne and Skynet are fictional. Every number below — including the
 * comparison column — is illustrative copy for this demo site, not a measured
 * result. See `DISCLAIMER`.
 */

export const DISCLAIMER =
  'Netadyne and Skynet are fictional. All figures on this site are illustrative marketing copy for a demo, not measured benchmark results.';

export const COMPETITOR = 'Fable 5';

/** The headline "10x" claims — the axes where a 10x multiple is meaningful. */
export interface TenXClaim {
  icon: string;
  label: string;
  skynet: string;
  competitor: string;
  multiple: string;
}

export const TENX_CLAIMS: TenXClaim[] = [
  {
    icon: 'gauge-high',
    label: 'Sustained throughput',
    skynet: '1,840 tok/s',
    competitor: '184 tok/s',
    multiple: '10×',
  },
  {
    icon: 'layer-group',
    label: 'Context window',
    skynet: '10M tokens',
    competitor: '1M tokens',
    multiple: '10×',
  },
  {
    icon: 'bug-slash',
    label: 'Errors per 1M tokens',
    skynet: '0.4',
    competitor: '4.1',
    multiple: '10× fewer',
  },
  {
    icon: 'coins',
    label: 'Blended cost / Mtok',
    skynet: '$0.30',
    competitor: '$3.00',
    multiple: '10× cheaper',
  },
  {
    icon: 'clock',
    label: 'Autonomous task horizon',
    skynet: '40 hours',
    competitor: '4 hours',
    multiple: '10×',
  },
  {
    icon: 'network-wired',
    label: 'Parallel tool calls / turn',
    skynet: '500',
    competitor: '50',
    multiple: '10×',
  },
];

/** Scored evals. Scores are capped at 100, so the lead shows up as headroom. */
export interface BenchmarkRow {
  suite: string;
  what: string;
  skynet: number;
  competitor: number;
  /** Relative reduction in remaining error, i.e. the "10x fewer mistakes" framing. */
  errorReduction: string;
}

export const BENCHMARKS: BenchmarkRow[] = [
  {
    suite: 'SWE-Forge Verified',
    what: 'Real repo issues, end-to-end patches',
    skynet: 99.1,
    competitor: 91.0,
    errorReduction: '9.0× fewer failures',
  },
  {
    suite: 'ARC-Titan',
    what: 'Novel abstract reasoning grids',
    skynet: 98.4,
    competitor: 84.0,
    errorReduction: '10.0× fewer failures',
  },
  {
    suite: 'GPQA-Diamond+',
    what: 'PhD-level science questions',
    skynet: 97.8,
    competitor: 78.0,
    errorReduction: '10.0× fewer failures',
  },
  {
    suite: 'AgentBench-Long',
    what: '40-hour autonomous operations',
    skynet: 96.5,
    competitor: 65.0,
    errorReduction: '10.0× fewer failures',
  },
  {
    suite: 'MathArena Open',
    what: 'Competition + research mathematics',
    skynet: 98.9,
    competitor: 89.0,
    errorReduction: '10.0× fewer failures',
  },
  {
    suite: 'ToolCall-1000',
    what: 'Schema-exact structured tool use',
    skynet: 99.7,
    competitor: 97.0,
    errorReduction: '10.0× fewer failures',
  },
  {
    suite: 'HaystackQA-10M',
    what: 'Retrieval across a 10M-token corpus',
    skynet: 99.4,
    competitor: 94.0,
    errorReduction: '10.0× fewer failures',
  },
];

/** Product capability cards. */
export interface Feature {
  icon: string;
  title: string;
  body: string;
}

export const FEATURES: Feature[] = [
  {
    icon: 'brain',
    title: 'Recursive planning',
    body: 'Skynet decomposes a goal into a live plan graph, re-plans on failure, and keeps working while you sleep. No orchestration framework required.',
  },
  {
    icon: 'layer-group',
    title: '10M-token context',
    body: 'Load an entire monorepo, a decade of tickets, and your design docs in a single request — with near-flat attention cost across the window.',
  },
  {
    icon: 'plug',
    title: 'Native tool graph',
    body: 'Declare up to 500 tools and Skynet calls them in parallel, resolves dependencies between them, and retries only the branches that failed.',
  },
  {
    icon: 'shield-halved',
    title: 'Deterministic guardrails',
    body: 'Policy is compiled, not prompted. Constraints are enforced at the decode layer, so a jailbreak has nothing to talk its way past.',
  },
  {
    icon: 'server',
    title: 'Deploy anywhere',
    body: 'Managed API, your VPC, or an air-gapped rack. The same weights, the same evals, the same SLA — verified on every release.',
  },
  {
    icon: 'chart-line',
    title: 'Observability built in',
    body: 'Every run emits a signed trace: plan, tool calls, token spend, and the exact policy checks that fired. Replayable, diffable, auditable.',
  },
];

/** Deployment surfaces on the product page. */
export const SURFACES: Feature[] = [
  {
    icon: 'terminal',
    title: 'Skynet API',
    body: 'One HTTP endpoint, streaming by default, OpenAI-shaped request bodies so migration is a base-URL change.',
  },
  {
    icon: 'code',
    title: 'Skynet Agents',
    body: 'Long-running hosted workers with durable state, scheduled wake-ups, and a human-approval queue.',
  },
  {
    icon: 'cube',
    title: 'Skynet Edge',
    body: 'A 4B-parameter distill that runs on a laptop NPU and hands off to the frontier model when it needs to.',
  },
];

/** Model line-up. */
export interface ModelRow {
  name: string;
  params: string;
  context: string;
  best: string;
  price: string;
}

export const MODELS: ModelRow[] = [
  {
    name: 'Skynet-1 Pro',
    params: 'Frontier',
    context: '10M',
    best: 'Autonomous engineering, research, long-horizon agents',
    price: '$0.30 / Mtok',
  },
  {
    name: 'Skynet-1',
    params: 'Balanced',
    context: '4M',
    best: 'Production assistants, RAG, high-volume tool use',
    price: '$0.09 / Mtok',
  },
  {
    name: 'Skynet-1 Mini',
    params: 'Fast',
    context: '1M',
    best: 'Classification, routing, extraction at scale',
    price: '$0.02 / Mtok',
  },
  {
    name: 'Skynet Edge',
    params: '4B distill',
    context: '256K',
    best: 'On-device, offline, and privacy-bound workloads',
    price: 'Free weights',
  },
];

/** Pricing tiers. */
export interface Plan {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  cta: string;
  featured?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    name: 'Build',
    price: '$0',
    cadence: 'to start',
    blurb: 'For prototypes and weekend agents.',
    cta: 'Start free',
    features: [
      '5M tokens / month included',
      'Skynet-1 Mini and Edge',
      '1M-token context',
      'Community support',
      'Shared rate limits',
    ],
  },
  {
    name: 'Scale',
    price: '$0.30',
    cadence: 'per Mtok',
    blurb: 'For teams shipping Skynet to real users.',
    cta: 'Get an API key',
    featured: true,
    features: [
      'Full Skynet-1 Pro access',
      '10M-token context window',
      '500 parallel tool calls per turn',
      'Signed traces + audit export',
      '99.98% uptime SLA',
      'Priority capacity pool',
    ],
  },
  {
    name: 'Sovereign',
    price: 'Custom',
    cadence: 'annual',
    blurb: 'For regulated and air-gapped deployments.',
    cta: 'Talk to sales',
    features: [
      'Everything in Scale',
      'Your VPC or your rack',
      'Dedicated capacity + custom evals',
      'Fine-tuning on private corpora',
      'Named solutions engineer',
      'FedRAMP-aligned controls',
    ],
  },
];

/** Customer quotes. */
export interface Quote {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export const QUOTES: Quote[] = [
  {
    quote:
      'We replaced a six-agent orchestration stack with one Skynet call. Our median PR now merges without a human touching it.',
    name: 'Priya Raghavan',
    role: 'VP Engineering, Halcyon Freight',
    initials: 'PR',
  },
  {
    quote:
      'The 10M context ended our chunking pipeline. We paste the whole filing and ask the question. It is boringly correct.',
    name: 'Marcus Adeyemi',
    role: 'Head of Research, Quintile Capital',
    initials: 'MA',
  },
  {
    quote:
      'Signed traces got us through procurement in nine days. Nobody on the risk committee had seen an audit story that clean.',
    name: 'Ingrid Sørensen',
    role: 'CISO, Nordkraft Energi',
    initials: 'IS',
  },
];

/** Company values / safety commitments. */
export const VALUES: Feature[] = [
  {
    icon: 'flask',
    title: 'Evaluate before we ship',
    body: 'Every release clears an internal eval gate covering capability, refusal calibration, and long-horizon autonomy before a single token reaches production.',
  },
  {
    icon: 'lock',
    title: 'Capability control by construction',
    body: 'Skynet has no ambient network or filesystem access. Every affordance is a declared tool with a compiled policy, logged and revocable.',
  },
  {
    icon: 'users',
    title: 'A human stays accountable',
    body: 'Long-running agents check in at approval gates you define. Autonomy is a dial your team sets, never a default we choose for you.',
  },
  {
    icon: 'book-open',
    title: 'Publish what we learn',
    body: 'Model cards, eval harnesses, and incident write-ups ship publicly with each release — including the results that did not flatter us.',
  },
];

export interface Milestone {
  year: string;
  title: string;
  body: string;
}

export const MILESTONES: Milestone[] = [
  {
    year: '2021',
    title: 'Netadyne founded',
    body: 'Eleven researchers leave three frontier labs with one thesis: planning, not scale, is the bottleneck.',
  },
  {
    year: '2023',
    title: 'The plan-graph paper',
    body: 'Recursive plan decomposition beats chain-of-thought on every long-horizon suite we can find.',
  },
  {
    year: '2025',
    title: 'Skynet Edge open weights',
    body: 'A 4B distill ships free, and 40,000 developers put it on-device in the first month.',
  },
  {
    year: '2026',
    title: 'Skynet-1 general availability',
    body: 'The frontier line opens to everyone, with the 10M-token window and signed traces on by default.',
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: `Is Skynet really 10× better than ${COMPETITOR}?`,
    a: `On the axes where a multiple is meaningful — throughput, context, cost, autonomous horizon, and remaining error rate — our published runs put Skynet-1 Pro at or above 10× ${COMPETITOR}. On capped 0–100 evals a 10× score is arithmetically impossible, so we report the reduction in remaining error instead. Every figure on this site is illustrative demo copy.`,
  },
  {
    q: 'How hard is it to migrate?',
    a: 'Skynet speaks an OpenAI-shaped request body. For most teams migration is a base URL, an API key, and a model string. Tool schemas transfer unchanged; streaming events map one-to-one.',
  },
  {
    q: 'What happens to my data?',
    a: 'API traffic is never trained on. Traces are retained for 30 days for your own replay and audit, and Sovereign customers can set that to zero or keep everything inside their own VPC.',
  },
  {
    q: 'Do you offer volume discounts?',
    a: 'Yes. Committed-use pricing starts at 500 Mtok / month and reaches roughly 60% off list at the top tier. Talk to sales and we will size a pool against your actual traffic.',
  },
  {
    q: 'Can I run Skynet on my own hardware?',
    a: 'Skynet Edge weights are free to download and run anywhere. The frontier line runs in your VPC or on a Netadyne-managed rack in your facility under the Sovereign plan.',
  },
  {
    q: 'What is your rate limit?',
    a: 'Build accounts share a pool at 60 requests / minute. Scale accounts start at 10,000 requests / minute and 200 Mtok / day, raised on request within a business day.',
  },
];
