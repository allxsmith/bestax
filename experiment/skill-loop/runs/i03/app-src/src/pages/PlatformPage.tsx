import { useState } from 'react';
import {
  Box,
  Button,
  Buttons,
  Cell,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Hero,
  Icon,
  Pre,
  Section,
  Span,
  Table,
  Tabs,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { FeatureCard } from '../components/FeatureCard';
import { SectionHeading } from '../components/SectionHeading';

const SNIPPETS = [
  {
    label: 'Python',
    code: `from netadyne import Netadyne

client = Netadyne(api_key=os.environ["NETADYNE_API_KEY"])

response = client.messages.create(
    model="skynet-ultra-1",
    max_tokens=4096,
    thinking={"budget_tokens": 8192},
    messages=[
        {"role": "user", "content": "Audit this contract for termination risk."}
    ],
)

print(response.content[0].text)
print(response.confidence)  # calibrated, 0.0 - 1.0`,
  },
  {
    label: 'TypeScript',
    code: `import Netadyne from '@netadyne/sdk';

const client = new Netadyne({ apiKey: process.env.NETADYNE_API_KEY });

const stream = await client.messages.stream({
  model: 'skynet-pro-1',
  max_tokens: 4096,
  messages: [{ role: 'user', content: 'Summarise the incident report.' }],
  tools: [searchTool, ticketTool],
});

for await (const event of stream) {
  if (event.type === 'text') process.stdout.write(event.text);
}`,
  },
  {
    label: 'cURL',
    code: `curl https://api.netadyne.ai/v1/messages \\
  -H "x-api-key: $NETADYNE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "skynet-edge-1",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Classify this ticket." }
    ]
  }'`,
  },
];

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/v1/messages',
    description: 'Single- or multi-turn completion, streaming or buffered.',
  },
  {
    method: 'POST',
    path: '/v1/messages/batch',
    description: 'Asynchronous batch of up to 100,000 requests at 50% price.',
  },
  {
    method: 'POST',
    path: '/v1/files',
    description: 'Upload documents, images, audio, and video for reuse.',
  },
  {
    method: 'POST',
    path: '/v1/guard/policies',
    description: 'Create and version Skynet Guard routing policies.',
  },
  {
    method: 'GET',
    path: '/v1/evals/runs',
    description: 'Kick off and inspect harness runs against your own key.',
  },
  {
    method: 'GET',
    path: '/v1/usage',
    description: 'Per-key, per-model token accounting in near real time.',
  },
];

const PLATFORM_FEATURES = [
  {
    title: 'Prompt caching',
    body: 'Mark a prefix once and reuse it for five minutes at 10% of the input price. Long system prompts stop being a line item.',
    icon: 'database',
  },
  {
    title: 'Provisioned throughput',
    body: 'Reserve capacity by the hour or the month. No shared-tenancy queue, no surprise 429 during your launch.',
    icon: 'gauge-high',
  },
  {
    title: 'Six SDKs',
    body: 'Python, TypeScript, Go, Rust, Java, and Ruby — all generated from the same OpenAPI spec, all with streaming and retries built in.',
    icon: 'cubes',
  },
  {
    title: 'OpenTelemetry native',
    body: 'Spans for every request, tool call, and retry, exported straight to your existing collector.',
    icon: 'chart-area',
  },
  {
    title: 'Regional routing',
    body: 'Pin inference to us-east, eu-central, or ap-northeast for residency, or let the router pick the fastest healthy region.',
    icon: 'globe',
  },
  {
    title: 'The eval harness',
    body: 'The same code that produced our published numbers, on PyPI. Point it at your key and diff the results.',
    icon: 'flask',
  },
];

export function PlatformPage() {
  const [tab, setTab] = useState(0);

  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              as="h1"
              align="left"
              eyebrow="Platform"
              title="An API you can read in one sitting"
              lede="One endpoint for every model and modality. Streaming, tools, and structured output are parameters, not products."
            />
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="medium">
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <Title as="h2" size="3" mb="2">
                Quickstart
              </Title>
              <Span display="block" textColor="grey" mb="4">
                Install the SDK, export your key, send a message. Nothing else
                is required.
              </Span>

              <Tabs value={tab} onChange={setTab} boxed>
                <Tabs.List>
                  {SNIPPETS.map((snippet, i) => (
                    <Tabs.Tab key={snippet.label} index={i}>
                      {snippet.label}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>
              <Pre>{SNIPPETS[tab].code}</Pre>
            </Column>

            <Column sizeDesktop={5}>
              <Box p="5">
                <Title as="h2" size="5" mb="4">
                  Model strings
                </Title>
                <Content>
                  <ul>
                    <li>
                      <code>skynet-ultra-1</code> — frontier reasoning
                    </li>
                    <li>
                      <code>skynet-pro-1</code> — the production default
                    </li>
                    <li>
                      <code>skynet-edge-1</code> — latency-critical paths
                    </li>
                  </ul>
                </Content>
                <Span display="block" textSize="7" textColor="grey" mt="4">
                  Aliases are pinned to a dated snapshot for 12 months. Snapshots
                  never change under you.
                </Span>
              </Box>

              <Box p="5" mt="4">
                <Title as="h2" size="5" mb="4">
                  Base URL
                </Title>
                <Pre mb="3">https://api.netadyne.ai/v1</Pre>
                <Span display="block" textSize="7" textColor="grey">
                  Authenticate with <code>x-api-key</code>. Keys are scoped per
                  project and rotate without downtime.
                </Span>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Reference"
            title="The whole surface area"
            mb="6"
          />
          <Box p="0">
            <Table isFullwidth isHoverable isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Method</Table.Th>
                  <Table.Th>Endpoint</Table.Th>
                  <Table.Th>Description</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {ENDPOINTS.map(endpoint => (
                  <Table.Tr key={endpoint.path}>
                    <Table.Td>
                      <Tag
                        color={endpoint.method === 'GET' ? 'info' : 'primary'}
                      >
                        {endpoint.method}
                      </Tag>
                    </Table.Td>
                    <Table.Th textWeight="semibold">
                      <code>{endpoint.path}</code>
                    </Table.Th>
                    <Table.Td>
                      <Span textColor="grey">{endpoint.description}</Span>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Operations"
            title="What running it looks like"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={5}>
            {PLATFORM_FEATURES.map(feature => (
              <Cell key={feature.title} display="flex" flexDirection="column">
                <FeatureCard
                  title={feature.title}
                  body={feature.body}
                  icon={feature.icon}
                />
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <Box p="6" textAlign="centered">
            <Icon
              name="key"
              size="large"
              textColor="primary"
              mb="4"
              aria-hidden="true"
            />
            <Title as="h2" size="3" mb="3">
              Your first call is four minutes away
            </Title>
            <Span display="block" textColor="grey" mb="5">
              $5 in credits, no card, no waitlist for teams under 50 seats.
            </Span>
            <Buttons isCentered>
              <Button as="a" href="#/contact" color="primary" size="large">
                Get API access
              </Button>
              <Button as="a" href="#/pricing" size="large">
                See pricing
              </Button>
            </Buttons>
          </Box>
        </Container>
      </Section>
    </>
  );
}
