import { useState } from 'react';
import {
  Box,
  Button,
  Buttons,
  Card,
  Cell,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Hero,
  Icon,
  IconText,
  Pre,
  Section,
  Span,
  Steps,
  SubTitle,
  Table,
  Tabs,
  Tag,
  Tags,
  Title,
} from '@allxsmith/bestax-bulma';

const SNIPPETS = [
  {
    label: 'Python',
    code: `from netadyne import Netadyne

client = Netadyne(api_key=os.environ["NETADYNE_API_KEY"])

response = client.messages.create(
    model="skynet-3-max",
    max_tokens=4096,
    reasoning={"effort": "high", "return_trace": True},
    messages=[
        {"role": "user", "content": "Reconcile these two ledgers."},
    ],
)

print(response.content[0].text)
print(response.reasoning.steps)  # auditable, structured`,
  },
  {
    label: 'TypeScript',
    code: `import Netadyne from '@netadyne/sdk';

const client = new Netadyne({ apiKey: process.env.NETADYNE_API_KEY });

const response = await client.messages.create({
  model: 'skynet-3-max',
  max_tokens: 4096,
  reasoning: { effort: 'high', return_trace: true },
  messages: [
    { role: 'user', content: 'Reconcile these two ledgers.' },
  ],
});

console.log(response.content[0].text);
console.log(response.reasoning.steps);`,
  },
  {
    label: 'cURL',
    code: `curl https://api.netadyne.com/v1/messages \\
  -H "x-api-key: $NETADYNE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "skynet-3-max",
    "max_tokens": 4096,
    "reasoning": { "effort": "high", "return_trace": true },
    "messages": [
      { "role": "user", "content": "Reconcile these two ledgers." }
    ]
  }'`,
  },
];

const MODELS = [
  {
    name: 'skynet-3-max',
    context: '8M',
    input: '$9.00',
    output: '$45.00',
    note: 'Frontier reasoning, the benchmark model',
  },
  {
    name: 'skynet-3-pro',
    context: '2M',
    input: '$3.00',
    output: '$15.00',
    note: 'The default for production traffic',
  },
  {
    name: 'skynet-3-mini',
    context: '256K',
    input: '$0.40',
    output: '$2.00',
    note: 'Distilled, for classification and routing',
  },
  {
    name: 'skynet-3-max-thinking',
    context: '8M',
    input: '$9.00',
    output: '$60.00',
    note: 'Extended deliberation, hours-long tasks',
  },
];

const STEP_ITEMS = [
  { label: 'Get a key', clickable: true },
  { label: 'Swap the base URL', clickable: true },
  { label: 'Run your evals', clickable: true },
  { label: 'Ship', clickable: true },
];

const STEP_DETAIL = [
  'Explore-tier keys are issued instantly and carry 1M tokens a month — enough to run a real evaluation before you talk to anyone.',
  'The Messages API is request-compatible with what you are already calling. Point your client at api.netadyne.com and change the model string.',
  'Run your own suite, not ours. Most teams see their escalation and retry rates fall before they have tuned a single prompt.',
  'Move to a paid tier for provisioned throughput, region pinning, and an SLA. Version pinning keeps the model under you from moving.',
];

const CAPABILITIES = [
  {
    icon: 'diagram-project',
    name: 'Structured output',
    blurb:
      'Constrain generation to a JSON Schema. Invalid output is impossible, not merely unlikely — the sampler never leaves the grammar.',
  },
  {
    icon: 'file-lines',
    name: 'Document ingestion',
    blurb:
      'PDFs, spreadsheets, and scans go in natively at up to 4,000 pages per request, with page-level citations back out.',
  },
  {
    icon: 'code-branch',
    name: 'Batch & async',
    blurb:
      'Submit up to 500K requests to the batch endpoint at half price with a 24-hour window, or stream them as they finish.',
  },
  {
    icon: 'database',
    name: 'Context caching',
    blurb:
      'Pin a corpus once and pay 10% on every later call that reuses it. Caches live for 24 hours and survive across keys in a project.',
  },
  {
    icon: 'eye',
    name: 'Observability',
    blurb:
      'Per-request traces, token accounting, and latency percentiles export to OpenTelemetry, Datadog, or your own collector.',
  },
  {
    icon: 'gauge-high',
    name: 'Provisioned throughput',
    blurb:
      'Reserve capacity by the hour or the quarter. Reserved traffic never queues behind on-demand load, even at peak.',
  },
];

export function Platform() {
  const [snippet, setSnippet] = useState(0);
  const [step, setStep] = useState(0);

  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <Title size="1">The platform</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              One API, four models, three deployment targets. Nothing here is a
              waitlisted preview — it is what ships to every paid account.
            </SubTitle>
            <Tags mt="5">
              <Tag color="primary" isRounded>
                REST + streaming
              </Tag>
              <Tag color="primary" isRounded>
                Python · TS · Go · Rust
              </Tag>
              <Tag color="primary" isRounded>
                OpenTelemetry
              </Tag>
            </Tags>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Columns gap={6}>
            <Column sizeDesktop={5}>
              <Title size="2">Three lines to first token</Title>
              <Content textColor="grey" mt="4">
                <p>
                  The Messages API takes the same request shape you are already
                  sending. Change the base URL and the model string, and the
                  reasoning trace comes back as structured steps rather than
                  prose you have to parse.
                </p>
                <p>
                  Streaming, tool calls, structured output, and caching are all
                  fields on the same call — there is no second API to learn.
                </p>
              </Content>
              <Buttons mt="5">
                <Button as="a" href="#/access" color="primary">
                  Get an API key
                </Button>
              </Buttons>
            </Column>

            <Column sizeDesktop={7}>
              <Tabs value={snippet} onChange={setSnippet} toggle>
                <Tabs.List>
                  {SNIPPETS.map((s, i) => (
                    <Tabs.Tab key={s.label} index={i}>
                      {s.label}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
                <Tabs.Content>
                  {SNIPPETS.map((s, i) => (
                    <Tabs.Content.Item key={s.label} index={i}>
                      <Pre mt="4">{s.code}</Pre>
                    </Tabs.Content.Item>
                  ))}
                </Tabs.Content>
              </Tabs>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Title size="2" textAlign="centered" mb="6">
            The model lineup
          </Title>
          <Table isFullwidth isHoverable isResponsive>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Model</Table.Th>
                <Table.Th>Context</Table.Th>
                <Table.Th textAlign="right">Input / M</Table.Th>
                <Table.Th textAlign="right">Output / M</Table.Th>
                <Table.Th>Best for</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {MODELS.map(m => (
                <Table.Tr key={m.name}>
                  <Table.Td textWeight="semibold">
                    <Span textColor="primary">{m.name}</Span>
                  </Table.Td>
                  <Table.Td>{m.context}</Table.Td>
                  <Table.Td textAlign="right">{m.input}</Table.Td>
                  <Table.Td textAlign="right">{m.output}</Table.Td>
                  <Table.Td>
                    <Span textColor="grey">{m.note}</Span>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Span textColor="grey" textSize="7" display="block" mt="3">
            Prices are per million tokens. Cached input bills at 10%; batch
            requests bill at 50%.
          </Span>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Title size="2" textAlign="centered" mb="6">
            Capabilities
          </Title>
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={3}
            gap={5}
          >
            {CAPABILITIES.map(c => (
              <Cell key={c.name} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <IconText mb="3">
                      <Icon
                        name={c.icon}
                        textColor="primary"
                        size="medium"
                        aria-hidden="true"
                      />
                      <Title as="p" size="5" mb="0">
                        {c.name}
                      </Title>
                    </IconText>
                    <Content textColor="grey">{c.blurb}</Content>
                  </Card.Content>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Title size="2" textAlign="centered" mb="6">
            Migrating takes an afternoon
          </Title>
          <Steps
            value={step}
            items={STEP_ITEMS}
            onStepClick={setStep}
            color="primary"
            hasMarker
            rounded
            mobileMode="compact"
          />
          <Box mt="5" p="5">
            <Title as="p" size="5" mb="3">
              {STEP_ITEMS[step].label}
            </Title>
            <Content textColor="grey" mb="0">
              {STEP_DETAIL[step]}
            </Content>
          </Box>
        </Container>
      </Section>
    </>
  );
}
