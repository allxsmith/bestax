// Fictional product content for the Netadyne / Skynet demo site.
// Benchmark names are invented so no real evaluation suite is misquoted.

export type Benchmark = {
  /** Short suite id shown in the table. */
  id: string;
  /** What the suite measures. */
  domain: string;
  /** Skynet's score, 0–100. */
  skynet: number;
  /** Fable's score, 0–100. */
  fable: number;
};

/**
 * Every suite is tuned to exactly a 10x error reduction against Fable:
 * (100 - fable) / (100 - skynet) === 10. That's the claim the whole site
 * makes — "10x better" as a residual-error ratio, since a 0–100 accuracy
 * score can't literally multiply by ten.
 */
export const BENCHMARKS: Benchmark[] = [
  { id: 'NEXUS-Pro', domain: 'Graduate reasoning', skynet: 98.8, fable: 88.0 },
  { id: 'FORGE-Bench', domain: 'Agentic software engineering', skynet: 97.9, fable: 79.0 },
  { id: 'ATLAS-Math', domain: 'Competition mathematics', skynet: 99.4, fable: 94.0 },
  { id: 'LEXIS-1M', domain: 'Long-context retrieval', skynet: 99.1, fable: 91.0 },
  { id: 'CIPHER-Sec', domain: 'Secure code synthesis', skynet: 98.3, fable: 83.0 },
  { id: 'POLYGLOT-40', domain: 'Multilingual comprehension', skynet: 98.6, fable: 86.0 },
  { id: 'VISION-X', domain: 'Multimodal document analysis', skynet: 98.1, fable: 81.0 },
  { id: 'HELM-Ops', domain: 'Tool use & orchestration', skynet: 99.0, fable: 90.0 },
];

/** Residual-error ratio: how many Fable errors fit inside one Skynet error. */
export const errorReduction = (b: Benchmark) =>
  (100 - b.fable) / (100 - b.skynet);

export const HEADLINE_STATS = [
  { label: 'Error rate vs. Fable', value: '10x lower', icon: 'chart-line' },
  { label: 'Context window', value: '8M tokens', icon: 'layer-group' },
  { label: 'Median first token', value: '110 ms', icon: 'bolt' },
  { label: 'Uptime, trailing 90d', value: '99.99%', icon: 'shield-halved' },
];

export const FEATURES = [
  {
    icon: 'brain',
    name: 'Recursive deliberation',
    blurb:
      'Skynet plans, critiques, and revises before it answers. The reasoning trace is returned as structured JSON, so you can audit every step instead of trusting a paragraph.',
  },
  {
    icon: 'layer-group',
    name: '8M token context',
    blurb:
      'Load an entire monorepo, a decade of filings, or a full patient history in one call. Recall stays flat across the window — no needle-in-a-haystack cliff at 200K.',
  },
  {
    icon: 'screwdriver-wrench',
    name: 'Native tool orchestration',
    blurb:
      'Declare your tools once. Skynet plans multi-step calls, runs them in parallel, retries on failure, and reconciles conflicting results without an agent framework.',
  },
  {
    icon: 'bolt',
    name: 'Streaming at 110 ms',
    blurb:
      'Speculative decoding on Netadyne silicon puts the first token on screen in about a tenth of a second, at any context length.',
  },
  {
    icon: 'lock',
    name: 'Zero-retention by default',
    blurb:
      'Prompts and completions are never stored, never trained on, and never leave your chosen region. SOC 2 Type II, ISO 27001, HIPAA-ready.',
  },
  {
    icon: 'server',
    name: 'Deploy anywhere',
    blurb:
      'Netadyne cloud, your VPC, or fully air-gapped on a single rack. The same weights and the same API in all three.',
  },
];

export const PLANS = [
  {
    name: 'Explore',
    price: 'Free',
    cadence: 'up to 1M tokens / month',
    blurb: 'For prototypes, evaluations, and weekend projects.',
    features: [
      '1M tokens per month',
      'Skynet Mini, 256K context',
      'Community support',
      'Shared rate limits',
    ],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'Build',
    price: '$299',
    cadence: 'per month + usage',
    blurb: 'For teams shipping Skynet into a real product.',
    features: [
      'Skynet Pro, 2M context',
      'Reasoning traces & tool orchestration',
      'Dedicated rate limits',
      'Email support, next business day',
      '99.9% uptime SLA',
    ],
    cta: 'Start building',
    featured: true,
  },
  {
    name: 'Scale',
    price: '$2,400',
    cadence: 'per month + usage',
    blurb: 'For production workloads with real traffic and real auditors.',
    features: [
      'Skynet Max, full 8M context',
      'Provisioned throughput',
      'Private networking & region pinning',
      'Shared Slack channel, 1h response',
      '99.99% uptime SLA',
    ],
    cta: 'Talk to sales',
    featured: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual agreement',
    blurb: 'For regulated industries and on-premise deployments.',
    features: [
      'VPC or air-gapped install',
      'Custom fine-tunes on your corpus',
      'Named solutions architect',
      'Audit logs & data residency guarantees',
      'Contractual model-version pinning',
    ],
    cta: 'Contact us',
    featured: false,
  },
];

export const FAQS = [
  {
    q: 'What does "10x better than Fable" actually mean?',
    a: 'It means residual error, not raw score. On a 0–100 suite an accuracy number cannot multiply by ten, so we report the ratio of mistakes: where Fable misses 12 items out of 100, Skynet misses 1.2. Across all eight suites in our harness that ratio is 10.0x. Every score on the benchmarks page is reproducible with the published harness.',
  },
  {
    q: 'How is usage metered?',
    a: 'Per token, input and output, billed by the million. Reasoning tokens are metered at the input rate rather than the output rate, and cached context is billed at 10% after the first call.',
  },
  {
    q: 'Do you train on our data?',
    a: 'No. Zero-retention is the default on every paid plan: prompts and completions are dropped from memory once the response is delivered, and nothing enters a training corpus.',
  },
  {
    q: 'Can we pin a model version?',
    a: 'Yes. Dated snapshots are served for a minimum of 12 months, and Scale and Enterprise agreements can extend that contractually. Deprecations get 90 days notice.',
  },
  {
    q: 'What happens if we exceed our plan limits?',
    a: 'Requests keep succeeding and overage is billed at the standard per-token rate. Hard caps are available if you would rather be throttled than billed.',
  },
];

export const TESTIMONIALS = [
  {
    quote:
      'We replaced a four-model routing stack with a single Skynet endpoint. Our escalation rate to human reviewers fell by an order of magnitude in the first sprint.',
    name: 'Priya Raghunathan',
    role: 'VP Engineering, Corvid Health',
  },
  {
    quote:
      'The 8M context is not a spec-sheet number. We put an entire 40-year claims archive in one prompt and the recall held at the far end of the window.',
    name: 'Marcus Oyelaran',
    role: 'Head of Data, Rothwell Mutual',
  },
  {
    quote:
      'Auditable reasoning traces were the thing that got this past our risk committee. We can show exactly which step produced which conclusion.',
    name: 'Ines Delacroix',
    role: 'Chief Risk Officer, Meridian Capital',
  },
];
