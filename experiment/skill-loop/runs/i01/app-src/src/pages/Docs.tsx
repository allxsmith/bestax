import {
  Block,
  Box,
  Button,
  Column,
  Columns,
  Container,
  Content,
  IconText,
  Menu,
  Message,
  Section,
  Table,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHead } from '../components/SectionHead';
import { CodeSample } from '../components/CodeSample';
import type { PageId } from '../data/site';

const INSTALL = [
  {
    label: 'pip',
    icon: 'box',
    code: `pip install netadyne

export NETADYNE_API_KEY="sk-nd-..."`,
  },
  {
    label: 'npm',
    icon: 'cube',
    code: `npm install @netadyne/skynet

export NETADYNE_API_KEY="sk-nd-..."`,
  },
  {
    label: 'go',
    icon: 'cubes',
    code: `go get github.com/netadyne/skynet-go

export NETADYNE_API_KEY="sk-nd-..."`,
  },
];

const STREAMING = [
  {
    label: 'Streaming',
    icon: 'wave-square',
    code: `with client.messages.stream(
    model="skynet-nova",
    max_tokens=8192,
    messages=[{"role": "user", "content": prompt}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)

usage = stream.get_final_message().usage
print(usage.input_tokens, usage.output_tokens)`,
  },
  {
    label: 'Tool use',
    icon: 'screwdriver-wrench',
    code: `response = client.messages.create(
    model="skynet-nova",
    max_tokens=4096,
    tools=[{
        "name": "run_query",
        "description": "Run a read-only SQL query.",
        "input_schema": {
            "type": "object",
            "properties": {"sql": {"type": "string"}},
            "required": ["sql"],
        },
    }],
    messages=[{"role": "user", "content": "Revenue by region, last quarter"}],
)

for block in response.content:
    if block.type == "tool_use":
        result = run_query(**block.input)`,
  },
  {
    label: 'Structured',
    icon: 'code',
    code: `response = client.messages.create(
    model="skynet-flash",
    max_tokens=1024,
    response_format={
        "type": "json_schema",
        "schema": {
            "type": "object",
            "properties": {
                "sentiment": {"enum": ["positive", "neutral", "negative"]},
                "themes": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["sentiment", "themes"],
        },
    },
    messages=[{"role": "user", "content": ticket_text}],
)

data = json.loads(response.content[0].text)`,
  },
  {
    label: 'Migrate',
    icon: 'right-left',
    code: `# Already using another provider's SDK? Point it at Skynet.

from openai import OpenAI

client = OpenAI(
    base_url="https://api.netadyne.ai/v1/compat/openai",
    api_key=os.environ["NETADYNE_API_KEY"],
)

completion = client.chat.completions.create(
    model="skynet-nova",
    messages=[{"role": "user", "content": "Same call. New model."}],
)`,
  },
];

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/v1/messages',
    desc: 'Create a message. Supports streaming, tools and structured output.',
    color: 'success' as const,
  },
  {
    method: 'POST',
    path: '/v1/messages/batches',
    desc: 'Submit up to 100,000 requests for asynchronous processing at 50% off.',
    color: 'success' as const,
  },
  {
    method: 'GET',
    path: '/v1/models',
    desc: 'List available models, their context limits and deprecation dates.',
    color: 'info' as const,
  },
  {
    method: 'POST',
    path: '/v1/files',
    desc: 'Upload documents and images for reuse across requests.',
    color: 'success' as const,
  },
  {
    method: 'POST',
    path: '/v1/evals/runs',
    desc: 'Run an eval set against a model version and stream scored results.',
    color: 'success' as const,
  },
  {
    method: 'GET',
    path: '/v1/usage',
    desc: 'Per-key token usage and spend, aggregated by hour.',
    color: 'info' as const,
  },
];

const ERRORS = [
  { code: '400', name: 'invalid_request', meaning: 'Malformed body, unknown field, or a schema your tool definition does not satisfy.' },
  { code: '401', name: 'authentication_error', meaning: 'Missing or revoked API key.' },
  { code: '413', name: 'request_too_large', meaning: 'Prompt exceeds the model context window. Check the model, not the plan.' },
  { code: '429', name: 'rate_limit_error', meaning: 'Returned with Retry-After. Never a silent truncation or a model downgrade.' },
  { code: '529', name: 'overloaded_error', meaning: 'Capacity event. Provisioned throughput customers are never served this.' },
];

interface DocsProps {
  onNavigate: (page: PageId) => void;
}

export function Docs({ onNavigate }: DocsProps) {
  return (
    <Section size="medium">
      <Container>
        <SectionHead
          eyebrow="Documentation"
          title="Everything you need to make the first call"
          subtitle="The full reference lives at docs.netadyne.ai. This page is the ten-minute version."
        />

        <Columns>
          {/* Sidebar */}
          <Column sizeDesktop={3}>
            <Box>
              <Menu>
                <Menu.Label>Getting started</Menu.Label>
                <Menu.List>
                  <Menu.Item active href="#install">
                    Install
                  </Menu.Item>
                  <Menu.Item href="#patterns">Common patterns</Menu.Item>
                  <Menu.Item href="#endpoints">Endpoints</Menu.Item>
                  <Menu.Item href="#errors">Errors</Menu.Item>
                  <Menu.Item href="#limits">Rate limits</Menu.Item>
                </Menu.List>
                <Menu.Label>Guides</Menu.Label>
                <Menu.List>
                  <Menu.Item href="#patterns">Agents &amp; tool use</Menu.Item>
                  <Menu.Item href="#patterns">Prompt caching</Menu.Item>
                  <Menu.Item href="#patterns">Running evals</Menu.Item>
                  <Menu.Item href="#patterns">Deploying Edge</Menu.Item>
                </Menu.List>
                <Menu.Label>Reference</Menu.Label>
                <Menu.List>
                  <Menu.Item href="#endpoints">Messages API</Menu.Item>
                  <Menu.Item href="#endpoints">Batches API</Menu.Item>
                  <Menu.Item href="#endpoints">Files API</Menu.Item>
                </Menu.List>
              </Menu>
            </Box>
          </Column>

          {/* Content */}
          <Column sizeDesktop={9}>
            <Block id="install" mb="6">
              <Title size="4" as="h2">
                1. Install the SDK
              </Title>
              <Content textColor="grey">
                <p>
                  Official SDKs for Python, TypeScript and Go. Every one wraps
                  the same REST surface, so anything missing from an SDK is one
                  HTTP call away.
                </p>
              </Content>
              <CodeSample tabs={INSTALL} />
            </Block>

            <Block id="patterns" mb="6">
              <Title size="4" as="h2">
                2. Common patterns
              </Title>
              <Content textColor="grey">
                <p>
                  Streaming, tool use and structured output are first-class on
                  Nova and Flash. The last tab is the migration path if you are
                  coming from another provider.
                </p>
              </Content>
              <CodeSample tabs={STREAMING} />
            </Block>

            <Block id="endpoints" mb="6">
              <Title size="4" as="h2">
                3. Endpoints
              </Title>
              <Box>
                <Table isFullwidth isHoverable isResponsive>
                  <Table.Tbody>
                    {ENDPOINTS.map(endpoint => (
                      <Table.Tr key={endpoint.path}>
                        <Table.Td>
                          <Tag color={endpoint.color}>{endpoint.method}</Tag>
                        </Table.Td>
                        <Table.Td>
                          <code>{endpoint.path}</code>
                        </Table.Td>
                        <Table.Td className="has-text-grey is-size-7">
                          {endpoint.desc}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            </Block>

            <Block id="errors" mb="6">
              <Title size="4" as="h2">
                4. Errors
              </Title>
              <Box>
                <Table isFullwidth isResponsive>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>What it means</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {ERRORS.map(error => (
                      <Table.Tr key={error.code}>
                        <Table.Td className="has-text-weight-bold">
                          {error.code}
                        </Table.Td>
                        <Table.Td>
                          <code>{error.name}</code>
                        </Table.Td>
                        <Table.Td className="has-text-grey is-size-7">
                          {error.meaning}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            </Block>

            <Block id="limits">
              <Title size="4" as="h2">
                5. Rate limits
              </Title>
              <Message color="info">
                <Message.Body>
                  <Content>
                    <p>
                      Limits are per organisation, not per key, and are returned
                      on every response in the{' '}
                      <code>x-ratelimit-remaining-*</code> headers. Explorer
                      gets 60 requests per minute; Builder 2,000; Scale 20,000;
                      Enterprise is uncapped against reserved capacity.
                    </p>
                    <p>
                      When you hit a limit you get a <code>429</code> and a{' '}
                      <code>Retry-After</code> header. We never quietly swap you
                      to a smaller model to absorb the spike.
                    </p>
                  </Content>
                </Message.Body>
              </Message>

              <Block mt="5">
                <IconText
                  iconProps={{ name: 'life-ring', 'aria-hidden': 'true' }}
                  textColor="primary"
                  textWeight="semibold"
                >
                  Stuck on something the docs do not cover?
                </IconText>
                <Button color="primary" mt="3" onClick={() => onNavigate('contact')}>
                  Contact developer support
                </Button>
              </Block>
            </Block>
          </Column>
        </Columns>
      </Container>
    </Section>
  );
}
