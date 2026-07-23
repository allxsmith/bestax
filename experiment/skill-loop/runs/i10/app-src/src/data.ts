// Marketing content for the SkyNet product site (Netadyne). Fictional benchmark
// figures used for a product landing page.

export const HEADLINE_STATS = [
  { value: '10×', label: 'fewer hallucinations than Fable' },
  { value: '10×', label: 'lower cost per million tokens' },
  { value: '1M', label: 'token context window' },
  { value: '740', label: 'tokens / sec generation' },
];

// Accuracy benchmarks (higher is better). Bars are drawn from `skynet` / `fable`.
export const BENCHMARKS = [
  { name: 'MMLU-Pro', desc: 'Graduate-level reasoning', skynet: 94.2, fable: 88.0, unit: '%' },
  { name: 'GPQA Diamond', desc: 'Expert science Q&A', skynet: 81.5, fable: 61.0, unit: '%' },
  { name: 'SWE-bench Verified', desc: 'Real-world software fixes', skynet: 82.4, fable: 49.1, unit: '%' },
  { name: 'AIME 2025', desc: 'Competition mathematics', skynet: 96.0, fable: 72.0, unit: '%' },
  { name: 'MMMU', desc: 'Multimodal understanding', skynet: 89.7, fable: 68.3, unit: '%' },
];

// The literal "10× better" claims — where a 10x multiple is meaningful.
export const TENX = [
  { metric: 'Hallucination rate', skynet: '0.4%', fable: '4.1%', note: '10.3× fewer factual errors' },
  { metric: 'Cost / 1M output tokens', skynet: '$1.50', fable: '$15.00', note: '10× cheaper to run' },
  { metric: 'First-token latency', skynet: '38 ms', fable: '390 ms', note: '10.3× faster to respond' },
  { metric: 'Context window', skynet: '1,000K', fable: '100K', note: '10× more you can feed it' },
];

export const FEATURES = [
  {
    title: 'Frontier reasoning',
    body: 'A new training run and a redesigned reasoning core let SkyNet plan, self-correct, and stay on task across long, multi-step problems.',
  },
  {
    title: '1M-token context',
    body: 'Drop entire codebases, data rooms, or book-length documents into a single call. SkyNet keeps every detail in working memory.',
  },
  {
    title: 'Native multimodal',
    body: 'Text, images, audio, and structured data in one model. No brittle pipelines — reason over a chart and a spec together.',
  },
  {
    title: 'Agentic tool use',
    body: 'Reliable function calling and parallel tool orchestration built for autonomous agents that run for hours, not seconds.',
  },
  {
    title: 'Grounded & honest',
    body: 'Ten times fewer hallucinations than Fable, with inline citations and calibrated confidence you can actually trust.',
  },
  {
    title: 'Enterprise-ready',
    body: 'SOC 2 Type II, HIPAA, zero data retention, and single-tenant deployment. Your prompts never train the model.',
  },
];

export const PRICING = [
  {
    name: 'Starter',
    price: '$0',
    cadence: '/ month',
    blurb: 'For side projects and evaluation.',
    features: ['SkyNet Mini model', '1M tokens / month included', 'Community support', 'Shared rate limits'],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$49',
    cadence: '/ month',
    blurb: 'For teams shipping to production.',
    features: ['Full SkyNet + SkyNet Mini', '50M tokens / month included', '1M-token context window', 'Priority support & SLA'],
    cta: 'Get API access',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    blurb: 'For regulated, large-scale workloads.',
    features: ['Single-tenant deployment', 'Zero data retention', 'Fine-tuning & custom evals', 'Dedicated solutions engineer'],
    cta: 'Talk to sales',
    featured: false,
  },
];

export const TESTIMONIALS = [
  {
    quote: 'We swapped Fable for SkyNet in an afternoon. Our eval pass rate jumped from 71% to 94% and our token bill dropped by an order of magnitude.',
    name: 'Priya Nadkarni',
    role: 'VP Engineering, Loomwork',
  },
  {
    quote: 'The million-token context changed how we build. We stopped chunking and just hand SkyNet the whole repository.',
    name: 'Marcus Feld',
    role: 'Staff ML Engineer, Corva',
  },
  {
    quote: 'Hallucinations were our blocker for shipping to clinicians. SkyNet is the first model grounded enough to trust in production.',
    name: 'Dr. Elena Ruiz',
    role: 'Head of AI, Meridian Health',
  },
];
