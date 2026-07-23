import { useState } from 'react';
import {
  Hero,
  Section,
  Container,
  Columns,
  Column,
  Menu,
  Box,
  Title,
  SubTitle,
  Content,
  Tabs,
  Table,
  Message,
  Notification,
  Button,
  Icon,
  Block,
  Span,
  Paragraph,
  Code,
  Pre,
  Divider,
} from '@allxsmith/bestax-bulma';
import { COMPETITOR } from '../data/content';
import { useRouter } from '../router';

const SAMPLES: { label: string; language: string; code: string }[] = [
  {
    label: 'TypeScript',
    language: 'ts',
    code: `import Skynet from "@netadyne/skynet";

const skynet = new Skynet({ apiKey: process.env.NETADYNE_API_KEY });

const response = await skynet.messages.create({
  model: "skynet-1-pro",
  max_tokens: 4096,
  messages: [{ role: "user", content: "Summarize this repo's release risk." }],
});

console.log(response.content[0].text);`,
  },
  {
    label: 'Python',
    language: 'py',
    code: `from netadyne import Skynet

skynet = Skynet()  # reads NETADYNE_API_KEY

response = skynet.messages.create(
    model="skynet-1-pro",
    max_tokens=4096,
    messages=[{"role": "user", "content": "Summarize this repo's release risk."}],
)

print(response.content[0].text)`,
  },
  {
    label: 'curl',
    language: 'sh',
    code: `curl https://api.netadyne.ai/v1/messages \\
  -H "authorization: Bearer $NETADYNE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "skynet-1-pro",
    "max_tokens": 4096,
    "messages": [
      { "role": "user", "content": "Summarize this repo'"'"'s release risk." }
    ]
  }'`,
  },
];

const AGENT_SAMPLE = `const run = await skynet.agents.create({
  model: "skynet-1-pro",
  goal: "Ship a fix for the p99 checkout regression.",
  tools: [repo, metrics, deploy],
  horizon: "40h",                        // long-running by design
  parallelism: 500,                      // tool calls per turn
  approvals: { onDeploy: "require-human" },
});

for await (const step of run.stream()) {
  if (step.type === "plan") console.log(step.graph.summary);
  if (step.type === "tool") console.log(step.name, step.status);
  if (step.type === "approval") await notify(step.url);
}

const trace = await run.trace();        // signed, replayable
`;

const SECTIONS = [
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'agents', label: 'Agents' },
  { id: 'migrating', label: `Migrating from ${COMPETITOR}` },
  { id: 'limits', label: 'Rate limits' },
];

export function DocsPage() {
  const { navigate } = useRouter();
  const [tab, setTab] = useState(0);
  const [section, setSection] = useState('quickstart');

  return (
    <>
      <Hero color="primary" size="small" className="hero-wash">
        <Hero.Body>
          <Container>
            <Title size="2">Documentation</Title>
            <SubTitle size="5" mt="3">
              From zero to a running agent in about four minutes.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Columns gap={6}>
            <Column sizeDesktop={3}>
              <Menu>
                <Menu.Label>Get started</Menu.Label>
                <Menu.List>
                  {SECTIONS.map(item => (
                    <Menu.Item
                      key={item.id}
                      as="a"
                      href={`#${item.id}`}
                      active={section === item.id}
                      onClick={() => setSection(item.id)}
                    >
                      {item.label}
                    </Menu.Item>
                  ))}
                </Menu.List>
                <Menu.Label>Reference</Menu.Label>
                <Menu.List>
                  <Menu.Item as="a" href="#messages">
                    Messages API
                  </Menu.Item>
                  <Menu.Item as="a" href="#tools">
                    Tool definitions
                  </Menu.Item>
                  <Menu.Item as="a" href="#traces">
                    Traces &amp; audit
                  </Menu.Item>
                  <Menu.Item as="a" href="#errors">
                    Error codes
                  </Menu.Item>
                </Menu.List>
              </Menu>
            </Column>

            <Column sizeDesktop={9}>
              <Block id="quickstart" mb="6">
                <Title size="3">Quickstart</Title>
                <Content textColor="grey">
                  Install the SDK, export a key, and make a call. The request
                  body is OpenAI-shaped, so most existing code needs only a new
                  base URL.
                </Content>

                <Notification color="info" isLight mb="5">
                  <Icon name="terminal" mr="2" aria-hidden="true" />
                  <Code>npm install @netadyne/skynet</Code> ·{' '}
                  <Code>pip install netadyne</Code>
                </Notification>

                <Tabs boxed value={tab} onChange={setTab} mb="0">
                  <Tabs.List>
                    {SAMPLES.map((sample, index) => (
                      <Tabs.Tab key={sample.label} index={index}>
                        {sample.label}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>
                <Box p="0">
                  <Pre textSize="7" p="5" radius="radiusless">
                    {SAMPLES[tab].code}
                  </Pre>
                </Box>
              </Block>

              <Divider />

              <Block id="agents" mb="6">
                <Title size="3">Long-running agents</Title>
                <Content textColor="grey">
                  <Code>agents.create</Code> starts a durable run. State
                  survives process restarts, the plan graph streams as it
                  changes, and approval gates pause execution until a human
                  responds.
                </Content>
                <Box p="0">
                  <Pre textSize="7" p="5" radius="radiusless">
                    {AGENT_SAMPLE}
                  </Pre>
                </Box>
              </Block>

              <Divider />

              <Block id="migrating" mb="6">
                <Title size="3">Migrating from {COMPETITOR}</Title>
                <Message color="success" mt="4">
                  <Message.Header>Three lines, usually</Message.Header>
                  <Message.Body>
                    Tool schemas, streaming events, and system prompts carry
                    over unchanged. Point the client at{' '}
                    <Code>https://api.netadyne.ai/v1</Code>, swap the key, and
                    set the model string.
                  </Message.Body>
                </Message>
                <Table isFullwidth isResponsive mt="5">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Your old model</Table.Th>
                      <Table.Th>Drop-in replacement</Table.Th>
                      <Table.Th textAlign="right">Cost change</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>{COMPETITOR} (frontier)</Table.Td>
                      <Table.Td textWeight="semibold">skynet-1-pro</Table.Td>
                      <Table.Td textAlign="right">
                        <Span textColor="success">−90%</Span>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>{COMPETITOR} (balanced)</Table.Td>
                      <Table.Td textWeight="semibold">skynet-1</Table.Td>
                      <Table.Td textAlign="right">
                        <Span textColor="success">−88%</Span>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>{COMPETITOR} (small)</Table.Td>
                      <Table.Td textWeight="semibold">skynet-1-mini</Table.Td>
                      <Table.Td textAlign="right">
                        <Span textColor="success">−80%</Span>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Block>

              <Divider />

              <Block id="limits" mb="6">
                <Title size="3">Rate limits</Title>
                <Table isFullwidth isNarrow isResponsive mt="4">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Plan</Table.Th>
                      <Table.Th textAlign="right">Requests / min</Table.Th>
                      <Table.Th textAlign="right">Tokens / day</Table.Th>
                      <Table.Th textAlign="right">Concurrent agents</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>Build</Table.Td>
                      <Table.Td textAlign="right">60</Table.Td>
                      <Table.Td textAlign="right">5 M / month</Table.Td>
                      <Table.Td textAlign="right">2</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>Scale</Table.Td>
                      <Table.Td textAlign="right">10,000</Table.Td>
                      <Table.Td textAlign="right">200 M</Table.Td>
                      <Table.Td textAlign="right">500</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>Sovereign</Table.Td>
                      <Table.Td textAlign="right">Dedicated</Table.Td>
                      <Table.Td textAlign="right">Dedicated</Table.Td>
                      <Table.Td textAlign="right">Unlimited</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
                <Paragraph textColor="grey" textSize="7" mt="4">
                  Limits are raised on request within one business day. A 429
                  response always carries <Code>retry-after</Code> and the exact
                  bucket that throttled you.
                </Paragraph>
              </Block>

              <Box p="5" bgColor="primary">
                <Title size="5" textColor="white" mb="3">
                  Ready for a key?
                </Title>
                <Paragraph textColor="white" mb="4">
                  Build accounts are free and instant — 5M tokens a month, no
                  card.
                </Paragraph>
                <Button color="light" onClick={() => navigate('waitlist')}>
                  Create an account
                </Button>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
