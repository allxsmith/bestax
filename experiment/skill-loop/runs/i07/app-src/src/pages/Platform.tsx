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
  Icon,
  IconText,
  Paragraph,
  Pre,
  Section,
  Span,
  Table,
  Tabs,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { FeatureCard } from '../components/FeatureCard';
import { CAPABILITIES, CODE_SAMPLES, MODELS } from '../data/site';

const PLATFORM_PIECES = [
  {
    icon: 'code',
    title: 'Messages API',
    body: 'One endpoint for text, vision, audio, and tool use. Streaming, batching, and strict JSON Schema output are flags, not separate products.',
  },
  {
    icon: 'database',
    title: 'Prompt caching',
    body: 'Mark a prefix as cacheable and pay 10% of the input rate on every subsequent hit. Cache lifetimes of 5 minutes or 1 hour.',
  },
  {
    icon: 'sliders',
    title: 'Fine-tuning',
    body: 'LoRA adapters on Nano and Core, trained on your traces and served at base-model latency with no cold start.',
  },
  {
    icon: 'gauge-high',
    title: 'Evals & tracing',
    body: 'Every request is replayable. Score prompt revisions against saved datasets before they reach production traffic.',
  },
  {
    icon: 'lock',
    title: 'Governance',
    body: 'Per-key spend caps, org-wide model allowlists, exportable audit logs, and zero-retention mode on Enterprise.',
  },
  {
    icon: 'globe',
    title: 'Global routing',
    body: 'Twelve regions with data-residency pinning. Requests fail over within a region before they ever cross a border.',
  },
];

export function Platform() {
  const [sample, setSample] = useState(0);

  return (
    <>
      <Section size="medium" className="hero-wash">
        <Container>
          <SectionHeading
            eyebrow="Platform"
            title="A model is not a product. This is the rest of it."
            subtitle="The API, the caching layer, the eval harness, and the governance controls that make a frontier model something you can actually put in front of customers."
            as="h1"
            size="1"
          />
          <Buttons mt="5">
            <Button as="a" href="#/pricing" color="primary" size="large">
              Get an API key
            </Button>
            <Button as="a" href="#/contact" color="primary" isOutlined size="large">
              Talk to an engineer
            </Button>
          </Buttons>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Columns>
            <Column sizeDesktop={5}>
              <SectionHeading
                eyebrow="Quickstart"
                title="Your first call"
                subtitle="Install the SDK, set one environment variable, and send a message. The thinking budget is the only knob most teams ever touch."
                mb="5"
              />
              <Content>
                <ol>
                  <li>
                    <Span textWeight="semibold">Create a key</Span> — free tier,
                    no card, 10M tokens a month.
                  </li>
                  <li>
                    <Span textWeight="semibold">Pick a model</Span> — start on
                    Core, drop to Nano when latency matters.
                  </li>
                  <li>
                    <Span textWeight="semibold">Set a thinking budget</Span> —
                    zero for chat, thousands for analysis.
                  </li>
                </ol>
              </Content>
            </Column>

            <Column sizeDesktop={7}>
              {/* Tabs are controlled: value + onChange, and every Tab and
                  Content.Item carries its own index. Tabs.Content must be a
                  child of Tabs — that's where the active-tab context lives. */}
              <Tabs
                boxed
                value={sample}
                onChange={setSample}
                aria-label="Code samples by language"
              >
                <Tabs.List>
                  {CODE_SAMPLES.map((code, i) => (
                    <Tabs.Tab key={code.id} index={i}>
                      {code.label}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
                <Tabs.Content>
                  {CODE_SAMPLES.map((code, i) => (
                    <Tabs.Content.Item key={code.id} index={i}>
                      <Pre>{code.code}</Pre>
                    </Tabs.Content.Item>
                  ))}
                </Tabs.Content>
              </Tabs>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="What ships with it"
            title="Six things you would otherwise build"
            textAlign="centered"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={4}>
            {PLATFORM_PIECES.map(piece => (
              <Cell key={piece.title} display="flex" flexDirection="column">
                <FeatureCard {...piece} color="link" />
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Model capabilities"
            title="What Skynet does natively"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={4}>
            {CAPABILITIES.map(capability => (
              <Cell
                key={capability.title}
                display="flex"
                flexDirection="column"
              >
                <FeatureCard {...capability} />
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Specifications"
            title="The numbers, per model"
            mb="5"
          />
          <Table isFullwidth isHoverable isResponsive>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Model</Table.Th>
                <Table.Th>Best for</Table.Th>
                <Table.Th textAlign="right">Context</Table.Th>
                <Table.Th textAlign="right">Max output</Table.Th>
                <Table.Th textAlign="right">Input / MTok</Table.Th>
                <Table.Th textAlign="right">Output / MTok</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {MODELS.map(model => (
                <Table.Tr key={model.id}>
                  <Table.Td>
                    <IconText>
                      <Icon
                        name={model.icon}
                        textColor={model.color}
                        aria-hidden="true"
                      />
                      <Span textWeight="semibold">{model.name}</Span>
                    </IconText>
                  </Table.Td>
                  <Table.Td>
                    <Span textColor="grey" textSize="7">
                      {model.tagline}
                    </Span>
                  </Table.Td>
                  <Table.Td textAlign="right">{model.context}</Table.Td>
                  <Table.Td textAlign="right">128K</Table.Td>
                  <Table.Td textAlign="right">{model.input}</Table.Td>
                  <Table.Td textAlign="right">{model.output}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Box p="6">
            <Columns isVCentered>
              <Column sizeDesktop={8}>
                <Title as="h2" size="3" mb="3">
                  Safety is a release gate, not a page in the docs.
                </Title>
                <Paragraph textColor="grey" mb="0">
                  Every Skynet release passes an external red-team program, a
                  published model card with known failure modes, and an
                  interpretability review with veto power over the launch. If
                  the review does not clear it, the model does not ship — this
                  has already cost us two quarters.
                </Paragraph>
              </Column>
              <Column sizeDesktop={4}>
                <Button as="a" href="#/company" color="primary" isFullWidth>
                  Read our safety posture
                </Button>
              </Column>
            </Columns>
          </Box>
        </Container>
      </Section>
    </>
  );
}
