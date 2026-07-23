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
  Menu,
  Message,
  Paragraph,
  Section,
  Span,
  Steps,
  Strong,
  SubTitle,
  Tabs,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { CodeBlock } from '../components/CodeBlock';
import type { PageProps } from '../routes';

const LANGUAGES = ['Python', 'TypeScript', 'cURL'];

const INSTALL = [
  'pip install netadyne',
  'npm install @netadyne/sdk',
  '# no install needed — plain HTTPS',
];

const QUICKSTART = [
  `from netadyne import Netadyne

client = Netadyne(api_key=os.environ["NETADYNE_API_KEY"])

response = client.messages.create(
    model="skynet-core",
    max_tokens=4096,
    messages=[
        {"role": "user", "content": "Audit this repo for race conditions."}
    ],
)

print(response.content[0].text)`,
  `import { Netadyne } from '@netadyne/sdk';

const client = new Netadyne({ apiKey: process.env.NETADYNE_API_KEY });

const response = await client.messages.create({
  model: 'skynet-core',
  max_tokens: 4096,
  messages: [
    { role: 'user', content: 'Audit this repo for race conditions.' },
  ],
});

console.log(response.content[0].text);`,
  `curl https://api.netadyne.ai/v1/messages \\
  -H "x-api-key: $NETADYNE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "skynet-core",
    "max_tokens": 4096,
    "messages": [
      { "role": "user", "content": "Audit this repo for race conditions." }
    ]
  }'`,
];

const TOOL_USE = `response = client.messages.create(
    model="skynet-ultra",
    max_tokens=8192,
    tools=[
        {
            "name": "run_query",
            "description": "Run a read-only SQL query against the warehouse.",
            "input_schema": {
                "type": "object",
                "properties": {"sql": {"type": "string"}},
                "required": ["sql"],
            },
        }
    ],
    # Schema-constrained decoding: arguments are valid on the first attempt.
    tool_choice={"type": "auto"},
    messages=[{"role": "user", "content": "Why did EU revenue dip in Q3?"}],
)`;

const STREAMING = `with client.messages.stream(
    model="skynet-core",
    max_tokens=4096,
    messages=[{"role": "user", "content": "Summarise this filing."}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)`;

const MIGRATION = `client = Netadyne(
    api_key=os.environ["NETADYNE_API_KEY"],
    # Point an existing SDK at Netadyne instead of rewriting call sites.
    compat="openai",  # or "anthropic"
)`;

const GUIDES = [
  {
    title: 'Long context',
    body: 'Chunking strategies, cache breakpoints, and how to lay out a 4M-token prompt so recall stays flat.',
    icon: 'database-outline',
  },
  {
    title: 'Agents and tool use',
    body: 'Loop design, failure recovery, budget caps, and running Skynet against a live computer.',
    icon: 'robot-outline',
  },
  {
    title: 'Evaluation harness',
    body: 'Reproduce every published benchmark, or point the harness at your own task suite.',
    icon: 'chart-timeline-variant',
  },
  {
    title: 'Fine-tuning',
    body: 'Dataset format, LoRA and full-weight options, and how to keep safety behaviour after tuning.',
    icon: 'tune-variant',
  },
];

export function Docs({ onNavigate }: PageProps) {
  const [lang, setLang] = useState(0);

  return (
    <>
      <Hero className="hero-wash">
        <Hero.Body>
          <Container>
            <Tag color="primary" isRounded mb="4">
              Developer docs
            </Tag>
            <Title size="1" mb="4">
              From key to first token in about a minute.
            </Title>
            <SubTitle size="4" textColor="grey" mb="0">
              One endpoint, three SDKs, and a compatibility layer so you can
              migrate without touching your call sites.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Steps
            value={1}
            color="primary"
            mb="6"
            items={[
              { label: 'Create a key' },
              { label: 'Install the SDK' },
              { label: 'Send a message' },
              { label: 'Go to production' },
            ]}
          />

          <Columns>
            <Column sizeDesktop={3}>
              <Menu>
                <Menu.Label>Getting started</Menu.Label>
                <Menu.List>
                  <Menu.Item active href="#quickstart">
                    Quickstart
                  </Menu.Item>
                  <Menu.Item href="#streaming">Streaming</Menu.Item>
                  <Menu.Item href="#tools">Tool use</Menu.Item>
                  <Menu.Item href="#migrate">Migrating</Menu.Item>
                </Menu.List>
                <Menu.Label>Reference</Menu.Label>
                <Menu.List>
                  <Menu.Item href="#guides">Messages API</Menu.Item>
                  <Menu.Item href="#guides">Batches API</Menu.Item>
                  <Menu.Item href="#guides">Files API</Menu.Item>
                  <Menu.Item href="#guides">Errors and limits</Menu.Item>
                </Menu.List>
              </Menu>
            </Column>

            <Column sizeDesktop={9}>
              <Box id="quickstart">
                <Title size="4" mb="2">
                  Quickstart
                </Title>
                <Paragraph mb="4">
                  <Span textColor="grey">
                    Install, authenticate with an environment variable, and send
                    a message. Every SDK exposes the same request shape.
                  </Span>
                </Paragraph>

                <Tabs value={lang} onChange={setLang} align="left" mb="4">
                  <Tabs.List>
                    {LANGUAGES.map((name, index) => (
                      <Tabs.Tab key={name} index={index}>
                        {name}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs>

                <CodeBlock
                  code={INSTALL[lang]}
                  label={`Install for ${LANGUAGES[lang]}`}
                  mb="4"
                />
                <CodeBlock
                  code={QUICKSTART[lang]}
                  label={`${LANGUAGES[lang]} quickstart`}
                  mb="0"
                />
              </Box>

              <Box id="streaming" mt="5">
                <Title size="4" mb="2">
                  Streaming
                </Title>
                <Paragraph mb="4">
                  <Span textColor="grey">
                    Server-sent events with typed deltas. First token lands in
                    roughly 240 ms on Skynet Core.
                  </Span>
                </Paragraph>
                <CodeBlock code={STREAMING} label="Streaming example" mb="0" />
              </Box>

              <Box id="tools" mt="5">
                <Title size="4" mb="2">
                  Tool use
                </Title>
                <Paragraph mb="4">
                  <Span textColor="grey">
                    Tool arguments are generated under a schema constraint, so
                    malformed JSON is not a case you have to handle.
                  </Span>
                </Paragraph>
                <CodeBlock code={TOOL_USE} label="Tool use example" mb="4" />
                <Message color="primary">
                  <Message.Header>Agent loops</Message.Header>
                  <Message.Body>
                    Skynet reports when a task cannot be completed rather than
                    inventing a result. Treat <Strong>stop_reason</Strong> of{' '}
                    <Strong>"infeasible"</Strong> as a first-class outcome in
                    your loop.
                  </Message.Body>
                </Message>
              </Box>

              <Box id="migrate" mt="5">
                <Title size="4" mb="2">
                  Migrating from another provider
                </Title>
                <Paragraph mb="4">
                  <Span textColor="grey">
                    The compatibility layer accepts the two most common request
                    shapes, so most migrations are a base URL and a model
                    string.
                  </Span>
                </Paragraph>
                <CodeBlock code={MIGRATION} label="Compatibility layer" mb="0" />
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section className="section-alt" id="guides">
        <Container>
          <SectionHeading
            centered
            eyebrow="Guides"
            title="Go deeper"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={5}>
            {GUIDES.map(guide => (
              <Cell key={guide.title} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <Icon
                    name={guide.icon}
                    size="medium"
                    textColor="primary"
                    aria-hidden="true"
                  />
                  <Title size="5" mt="3" mb="2">
                    {guide.title}
                  </Title>
                  <Content>
                    <p>{guide.body}</p>
                  </Content>
                </Box>
              </Cell>
            ))}
          </Grid>
          <Buttons isCentered mt="5">
            <Button color="primary" onClick={() => onNavigate('contact')}>
              <Icon name="rocket-launch" aria-hidden="true" />
              <Span>Get an API key</Span>
            </Button>
          </Buttons>
        </Container>
      </Section>
    </>
  );
}
