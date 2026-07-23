import { useState } from 'react';
import {
  Block,
  Box,
  Button,
  Cell,
  Code,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Hero,
  Icon,
  Menu,
  Message,
  Paragraph,
  Pre,
  Section,
  Span,
  Strong,
  SubTitle,
  Table,
  Tabs,
  Tag,
  Tbody,
  Td,
  Th,
  Thead,
  Title,
  Tr,
} from '@allxsmith/bestax-bulma';
import type { PageId } from '../site/content';

const SNIPPETS = [
  {
    language: 'Python',
    code: `from netadyne import Skynet

client = Skynet(api_key="sk-nd-...")

response = client.messages.create(
    model="skynet-opus-2026-07",
    max_tokens=4096,
    messages=[
        {"role": "user", "content": "Audit this migration plan."}
    ],
)

print(response.content[0].text)`,
  },
  {
    language: 'TypeScript',
    code: `import { Skynet } from '@netadyne/sdk';

const client = new Skynet({ apiKey: process.env.NETADYNE_API_KEY });

const response = await client.messages.create({
  model: 'skynet-opus-2026-07',
  max_tokens: 4096,
  messages: [{ role: 'user', content: 'Audit this migration plan.' }],
});

console.log(response.content[0].text);`,
  },
  {
    language: 'cURL',
    code: `curl https://api.netadyne.com/v1/messages \\
  -H "x-api-key: $NETADYNE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "skynet-opus-2026-07",
    "max_tokens": 4096,
    "messages": [
      {"role": "user", "content": "Audit this migration plan."}
    ]
  }'`,
  },
];

const MODEL_IDS = [
  {
    id: 'skynet-opus-2026-07',
    context: '4,000,000',
    output: '128,000',
    note: 'Frontier tier',
  },
  {
    id: 'skynet-core-2026-07',
    context: '1,000,000',
    output: '64,000',
    note: 'Production default',
  },
  {
    id: 'skynet-edge-2026-07',
    context: '256,000',
    output: '16,000',
    note: 'Latency tier',
  },
];

const GUIDES = [
  {
    icon: 'wrench',
    title: 'Tool use',
    body: 'Declare tools as JSON Schema; Skynet returns typed calls and runs them in parallel when the graph allows.',
  },
  {
    icon: 'diagram-project',
    title: 'Sub-agents',
    body: 'Spawn scoped sub-agents with their own context and tool allowlist, then join their structured results.',
  },
  {
    icon: 'database',
    title: 'Prompt caching',
    body: 'Mark a prefix cacheable and pay 10% on every subsequent hit. Caches live five minutes, refreshed on use.',
  },
  {
    icon: 'wave-square',
    title: 'Streaming',
    body: 'Server-sent events with token, tool-call, and checkpoint frames. Resume a stream from the last checkpoint.',
  },
  {
    icon: 'shield-halved',
    title: 'Guardrails',
    body: 'Compile a policy once and attach it per request. Enforcement happens at decode, not in a wrapper prompt.',
  },
  {
    icon: 'gauge-high',
    title: 'Batch API',
    body: 'Submit up to 100,000 requests per job at half price, with a 24-hour completion window.',
  },
];

export default function DocsPage({
  onNavigate,
}: {
  onNavigate: (page: PageId) => void;
}) {
  const [snippet, setSnippet] = useState(0);

  return (
    <>
      <Hero size="small" className="hero-backdrop">
        <Hero.Body>
          <Container>
            <Tag color="primary" isRounded mb="4">
              Developer docs
            </Tag>
            <Title size="1">Your first Skynet call</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              Messages in, content blocks out, tools as JSON Schema. If you have
              shipped against another frontier API, this will look familiar.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Columns>
            <Column sizeDesktop={3}>
              <Menu>
                <Menu.Label>Get started</Menu.Label>
                <Menu.List>
                  <Menu.Item active href="#quickstart">
                    Quickstart
                  </Menu.Item>
                  <Menu.Item href="#models">Model IDs</Menu.Item>
                  <Menu.Item href="#guides">Guides</Menu.Item>
                  <Menu.Item href="#limits">Rate limits</Menu.Item>
                </Menu.List>
                <Menu.Label>SDKs</Menu.Label>
                <Menu.List>
                  <Menu.Item href="#quickstart">Python</Menu.Item>
                  <Menu.Item href="#quickstart">TypeScript</Menu.Item>
                  <Menu.Item href="#quickstart">Go</Menu.Item>
                  <Menu.Item href="#quickstart">Rust</Menu.Item>
                </Menu.List>
              </Menu>
            </Column>

            <Column sizeDesktop={9}>
              <Block id="quickstart" mb="6">
                <Title size="3" mb="3">
                  Quickstart
                </Title>
                <Paragraph textColor="grey" mb="4">
                  Install the SDK, export your key, and send a message. The
                  response is a list of content blocks — text, tool calls, or
                  both.
                </Paragraph>

                <Tabs value={snippet} onChange={setSnippet} toggle mb="4">
                  <Tabs.List>
                    {SNIPPETS.map((item, index) => (
                      <Tabs.Tab key={item.language} index={index}>
                        {item.language}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>

                <Content>
                  <Pre>{SNIPPETS[snippet].code}</Pre>
                </Content>

                <Message color="info" mt="4">
                  <Message.Body>
                    Keys are scoped per environment and never appear in logs.
                    Rotate from the console or with{' '}
                    <Strong>netadyne keys rotate</Strong>.
                  </Message.Body>
                </Message>
              </Block>

              <Block id="models" mb="6">
                <Title size="3" mb="3">
                  Model IDs
                </Title>
                <Box>
                  <Table isFullwidth isHoverable isResponsive>
                    <Thead>
                      <Tr>
                        <Th>Model ID</Th>
                        <Th textAlign="right">Context</Th>
                        <Th textAlign="right">Max output</Th>
                        <Th>Tier</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {MODEL_IDS.map(model => (
                        <Tr key={model.id}>
                          <Td>
                            <Code>{model.id}</Code>
                          </Td>
                          <Td textAlign="right">{model.context}</Td>
                          <Td textAlign="right">{model.output}</Td>
                          <Td>
                            <Span textColor="grey">{model.note}</Span>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
                <Paragraph textSize="7" textColor="grey" mt="3">
                  Dated IDs are pinned forever. The floating aliases{' '}
                  <Code>skynet-opus</Code>, <Code>skynet-core</Code>, and{' '}
                  <Code>skynet-edge</Code> track the newest snapshot.
                </Paragraph>
              </Block>

              <Block id="guides" mb="6">
                <Title size="3" mb="4">
                  Guides
                </Title>
                <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={4}>
                  {GUIDES.map(guide => (
                    <Cell
                      key={guide.title}
                      display="flex"
                      flexDirection="column"
                    >
                      <Box flexGrow="1">
                        <Span textColor="primary" textSize="4">
                          <Icon name={guide.icon} aria-hidden="true" />
                        </Span>
                        <Title size="5" mt="2" mb="2">
                          {guide.title}
                        </Title>
                        <Paragraph textColor="grey" textSize="7">
                          {guide.body}
                        </Paragraph>
                      </Box>
                    </Cell>
                  ))}
                </Grid>
              </Block>

              <Block id="limits">
                <Title size="3" mb="3">
                  Rate limits
                </Title>
                <Box>
                  <Table isFullwidth isResponsive>
                    <Thead>
                      <Tr>
                        <Th>Plan</Th>
                        <Th textAlign="right">Requests / min</Th>
                        <Th textAlign="right">Input tokens / min</Th>
                        <Th textAlign="right">Concurrency</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>Developer</Td>
                        <Td textAlign="right">30</Td>
                        <Td textAlign="right">200,000</Td>
                        <Td textAlign="right">4</Td>
                      </Tr>
                      <Tr>
                        <Td>Scale</Td>
                        <Td textAlign="right">10,000</Td>
                        <Td textAlign="right">40,000,000</Td>
                        <Td textAlign="right">2,000</Td>
                      </Tr>
                      <Tr>
                        <Td>Enterprise</Td>
                        <Td textAlign="right">Reserved</Td>
                        <Td textAlign="right">Reserved</Td>
                        <Td textAlign="right">Reserved</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </Box>

                <Button
                  color="primary"
                  mt="5"
                  onClick={() => onNavigate('contact')}
                >
                  <Icon name="key" aria-hidden="true" />
                  <span>Get an API key</span>
                </Button>
              </Block>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
