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
  Message,
  Section,
  Span,
  Table,
  Tag,
  Tags,
  Title,
} from '@allxsmith/bestax-bulma';
import { FeatureCard } from '../components/FeatureCard';
import { SectionHeading } from '../components/SectionHeading';
import { FEATURES, MODELS } from '../site/content';

const CAPABILITIES = [
  {
    title: 'Extended deliberation',
    body: 'Set a thinking budget per request, from 0 to 128K tokens. Skynet spends it planning, drafting, and — the part that matters — checking.',
    icon: 'clock-rotate-left',
  },
  {
    title: 'Self-verification',
    body: 'Every answer carries a calibrated confidence. Below your threshold, the model asks for a tool, a document, or a human instead of guessing.',
    icon: 'circle-check',
  },
  {
    title: 'Parallel tool calls',
    body: 'Up to 64 concurrent calls per turn with typed JSON Schema arguments, automatic retries, and structured error recovery.',
    icon: 'code-branch',
  },
  {
    title: 'Computer use',
    body: 'A screenshot-and-act loop that keeps a coherent plan across thousands of steps, with a checkpoint you can rewind to.',
    icon: 'desktop',
  },
  {
    title: 'Structured output',
    body: 'Constrained decoding against your JSON Schema or grammar. Valid output every time, not usually.',
    icon: 'file-code',
  },
  {
    title: 'Streaming everything',
    body: 'Tokens, tool calls, thinking traces, and citations all stream incrementally over SSE or WebSocket.',
    icon: 'wave-square',
  },
];

const SPEC_ROWS = [
  { label: 'Context window', values: ['2M tokens', '1M tokens', '256K tokens'] },
  { label: 'Max output', values: ['128K tokens', '64K tokens', '16K tokens'] },
  { label: 'Time to first token', values: ['~340 ms', '~120 ms', '~18 ms'] },
  { label: 'Vision & audio', values: ['Yes', 'Yes', 'Images only'] },
  { label: 'Extended thinking', values: ['Up to 128K', 'Up to 32K', '—'] },
  { label: 'Computer use', values: ['Yes', 'Yes', '—'] },
  { label: 'On-premise / air-gapped', values: ['Yes', 'Yes', 'Yes'] },
  { label: 'Knowledge cutoff', values: ['May 2026', 'May 2026', 'May 2026'] },
];

export function SkynetPage() {
  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              as="h1"
              align="left"
              eyebrow="The model family"
              title="Skynet"
              lede="One architecture, three sizes, and a verification loop that runs in all of them."
            />
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="medium">
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsDesktop={3} gap={5}>
            {MODELS.map(model => (
              <Cell key={model.name} display="flex" flexDirection="column">
                <Box display="flex" flexDirection="column" flexGrow="1" p="5">
                  <Icon
                    name={model.icon}
                    size="medium"
                    textColor="primary"
                    mb="4"
                    aria-hidden="true"
                  />
                  <Title as="h2" size="4" mb="2">
                    {model.name}
                    {model.featured && (
                      <Tag color="primary" isRounded ml="3">
                        Flagship
                      </Tag>
                    )}
                  </Title>
                  <Content textColor="grey" flexGrow="1">
                    {model.blurb}
                  </Content>
                  <Span
                    display="block"
                    textSize="7"
                    textWeight="semibold"
                    textColor="grey"
                    mb="2"
                  >
                    BEST FOR
                  </Span>
                  <Span display="block" textSize="7" mb="4">
                    {model.best}
                  </Span>
                  <Tags>
                    <Tag>{model.context}</Tag>
                    <Tag>{model.latency}</Tag>
                  </Tags>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Specifications"
            title="Side by side"
            mb="6"
          />
          <Box p="0">
            <Table isFullwidth isHoverable isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Capability</Table.Th>
                  {MODELS.map(model => (
                    <Table.Th key={model.name} textAlign="centered">
                      {model.name}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {SPEC_ROWS.map(row => (
                  <Table.Tr key={row.label}>
                    <Table.Th textWeight="semibold">{row.label}</Table.Th>
                    {row.values.map((value, i) => (
                      <Table.Td key={i} textAlign="centered">
                        {value === '—' ? (
                          <Span textColor="grey">—</Span>
                        ) : (
                          value
                        )}
                      </Table.Td>
                    ))}
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
            eyebrow="Capabilities"
            title="What you get in every request"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={5}>
            {CAPABILITIES.map(capability => (
              <Cell key={capability.title} display="flex" flexDirection="column">
                <FeatureCard
                  title={capability.title}
                  body={capability.body}
                  icon={capability.icon}
                />
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={6}>
              <SectionHeading
                align="left"
                eyebrow="Safety"
                title="Skynet Guard"
                lede="The control plane that sits in front of every deployment."
                mb="5"
              />
              <Content>
                <ul>
                  <li>
                    Policy routing — per-endpoint rules on what the model may
                    read, call, or emit.
                  </li>
                  <li>
                    Immutable audit trail of every prompt, tool call, and
                    completion, exportable to your SIEM.
                  </li>
                  <li>
                    PII detection and redaction before the request leaves your
                    perimeter.
                  </li>
                  <li>
                    A hard stop: revoke an agent's capabilities mid-trajectory,
                    from your console or ours.
                  </li>
                </ul>
              </Content>
              <Buttons mt="5">
                <Button as="a" href="#/platform" color="primary">
                  Read the docs
                </Button>
              </Buttons>
            </Column>
            <Column sizeDesktop={6}>
              <Message color="info">
                <Message.Header>On the name</Message.Header>
                <Message.Body>
                  We get asked. The model is named for a network topology in our
                  2021 architecture paper, not the film. The kill-switch is
                  real, it is documented, and the key is yours — which is more
                  than the film's characters managed.
                </Message.Body>
              </Message>
              <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={4} mt="4">
                {FEATURES.slice(4, 6).map(feature => (
                  <Cell key={feature.title} display="flex" flexDirection="column">
                    <FeatureCard
                      title={feature.title}
                      body={feature.body}
                      icon={feature.icon}
                    />
                  </Cell>
                ))}
              </Grid>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
