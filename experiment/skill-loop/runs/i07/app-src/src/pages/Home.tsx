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
  Paragraph,
  Pre,
  Reveal,
  Section,
  Span,
  SubTitle,
  Table,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { StatCard } from '../components/StatCard';
import { FeatureCard } from '../components/FeatureCard';
import { ScoreBar } from '../components/ScoreBar';
import {
  BENCHMARKS,
  CAPABILITIES,
  CODE_SAMPLES,
  CUSTOMERS,
  MODELS,
  QUOTES,
  skynetScore,
} from '../data/site';

const HEADLINE_BENCHMARKS = BENCHMARKS.slice(0, 5);

export function Home() {
  return (
    <>
      {/* No `color` on the Hero: it sits on the scheme background, so the
          headline and CTAs stay legible in both light and dark mode. The
          brand wash is the one decorative rule in index.css. */}
      <Hero size="large" className="hero-wash">
        <Hero.Body>
          <Container>
            <Columns isVCentered>
              <Column sizeDesktop={7}>
                <Tag color="primary" mb="4">
                  Skynet 1 · now generally available
                </Tag>
                <Title as="h1" size="1">
                  Ten times fewer mistakes than Fable 5.
                </Title>
                <SubTitle as="p" size="4" textColor="grey" mt="4">
                  Skynet is Netadyne&rsquo;s frontier model. On every public
                  benchmark we could reproduce, it cuts the residual error rate
                  by a factor of ten — not a few points of headroom, an order of
                  magnitude of reliability.
                </SubTitle>
                <Buttons mt="5">
                  <Button as="a" href="#/pricing" color="primary" size="large">
                    Get an API key
                  </Button>
                  <Button
                    as="a"
                    href="#/benchmarks"
                    color="primary"
                    isOutlined
                    size="large"
                  >
                    See the benchmarks
                  </Button>
                </Buttons>
                <Paragraph textSize="7" textColor="grey" mt="4">
                  10M tokens free every month. No credit card, no waitlist.
                </Paragraph>
              </Column>

              <Column sizeDesktop={5}>
                <Reveal animation="fade-up">
                  <Box p="5">
                    <Title as="p" size="6" textColor="grey" mb="5">
                      Residual error rate — MMLU-Pro
                    </Title>
                    <ScoreBar
                      label="Fable 5"
                      value={12}
                      valueLabel="12.0% wrong"
                      color="danger"
                      mb="5"
                    />
                    <ScoreBar
                      label="Skynet 1"
                      value={1.2}
                      valueLabel="1.2% wrong"
                      color="primary"
                      mb="5"
                    />
                    <Paragraph textSize="7" textColor="grey" mb="0">
                      Same benchmark, same harness — ten times less of what your
                      users actually notice.
                    </Paragraph>
                  </Box>
                </Reveal>
              </Column>
            </Columns>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Paragraph
            textAlign="centered"
            textSize="7"
            textColor="grey"
            textTransform="uppercase"
            mb="4"
          >
            Running in production at
          </Paragraph>
          <Columns isMultiline isCentered isMobile>
            {CUSTOMERS.map(customer => (
              <Column key={customer} isNarrow>
                <Span textWeight="semibold" textColor="grey" textSize="5">
                  {customer}
                </Span>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={4} gap={4}>
            {[
              {
                value: '10×',
                label: 'Fewer errors',
                caption: 'Across all nine public benchmarks',
                icon: 'bullseye',
                color: 'primary' as const,
              },
              {
                value: '4M',
                label: 'Token context',
                caption: '96.8 recall at the far edge of the window',
                icon: 'infinity',
                color: 'link' as const,
              },
              {
                value: '210ms',
                label: 'Time to first token',
                caption: 'p50, Skynet Core, us-east',
                icon: 'gauge-high',
                color: 'info' as const,
              },
              {
                value: '99.99%',
                label: 'API availability',
                caption: 'Trailing twelve months, all regions',
                icon: 'server',
                color: 'success' as const,
              },
            ].map((stat, i) => (
              <Cell key={stat.label} display="flex" flexDirection="column">
                <Reveal animation="fade-up" delay={i * 80}>
                  <StatCard {...stat} />
                </Reveal>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Capabilities"
            title="One model, the whole job"
            subtitle="Skynet replaces the router, the reranker, the OCR step, and the agent scaffold you built to work around the last model."
            textAlign="centered"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={4}>
            {CAPABILITIES.map((capability, i) => (
              <Cell
                key={capability.title}
                display="flex"
                flexDirection="column"
              >
                <Reveal animation="fade-up" delay={(i % 3) * 80}>
                  <FeatureCard {...capability} />
                </Reveal>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Benchmarks"
            title="The claim, in numbers"
            subtitle="Residual error is 100 minus the score — the part your users hit. Ours is a tenth of Fable 5's on every row."
            mb="5"
          />
          <Table isFullwidth isHoverable isResponsive>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Benchmark</Table.Th>
                <Table.Th textAlign="right">Fable 5</Table.Th>
                <Table.Th textAlign="right">Skynet 1</Table.Th>
                <Table.Th textAlign="right">Error reduction</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {HEADLINE_BENCHMARKS.map(benchmark => (
                <Table.Tr key={benchmark.name}>
                  <Table.Td textWeight="medium">{benchmark.name}</Table.Td>
                  <Table.Td textAlign="right">
                    <Span textColor="grey" fontFamily="monospace">
                      {benchmark.fable.toFixed(1)}
                    </Span>
                  </Table.Td>
                  <Table.Td textAlign="right" textWeight="semibold">
                    <Span fontFamily="monospace">
                      {skynetScore(benchmark.fable).toFixed(1)}
                    </Span>
                  </Table.Td>
                  <Table.Td textAlign="right">
                    <Tag color="success">10.0×</Tag>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Buttons mt="5">
            <Button as="a" href="#/benchmarks" color="primary" isOutlined>
              All nine benchmarks and the methodology
            </Button>
          </Buttons>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={5}>
              <SectionHeading
                eyebrow="Developer experience"
                title="Three lines to your first call"
                subtitle="A REST API with SDKs for Python, TypeScript, Go, and Java. If you have written against a chat completions API before, you already know this one."
                mb="5"
              />
              <Content>
                <ul>
                  <li>Streaming, batching, and prompt caching on every model</li>
                  <li>Structured output with strict JSON Schema validation</li>
                  <li>
                    Per-request thinking budgets — pay for depth only when you
                    need it
                  </li>
                </ul>
              </Content>
              <Button as="a" href="#/platform" color="primary" mt="3">
                Read the platform docs
              </Button>
            </Column>
            <Column sizeDesktop={7}>
              <Pre>{CODE_SAMPLES[0].code}</Pre>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="The lineup"
            title="Three sizes, one intelligence"
            subtitle="Every model shares the same training run and the same safety posture — they differ in how much of it runs per token."
            textAlign="centered"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={3} gap={4}>
            {MODELS.map(model => (
              <Cell key={model.id} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <IconText mb="3">
                      <Icon
                        name={model.icon}
                        textColor={model.color}
                        aria-hidden="true"
                      />
                      <Span textWeight="bold" textSize="5">
                        {model.name}
                      </Span>
                    </IconText>
                    <Content textColor="grey">{model.tagline}</Content>
                    <Table isFullwidth isNarrow>
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Td>
                            <Span textColor="grey">Context</Span>
                          </Table.Td>
                          <Table.Td textAlign="right">{model.context}</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Span textColor="grey">Input / MTok</Span>
                          </Table.Td>
                          <Table.Td textAlign="right">{model.input}</Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Span textColor="grey">Output / MTok</Span>
                          </Table.Td>
                          <Table.Td textAlign="right">{model.output}</Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </Card.Content>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Customers"
            title="What changed after the switch"
            textAlign="centered"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={3} gap={4}>
            {QUOTES.map(quote => (
              <Cell key={quote.name} display="flex" flexDirection="column">
                <Box flexGrow="1" p="5">
                  <Icon
                    name="quote-left"
                    textColor="primary"
                    mb="3"
                    aria-hidden="true"
                  />
                  <Paragraph mb="4">{quote.quote}</Paragraph>
                  <Paragraph textWeight="semibold" mb="0">
                    {quote.name}
                  </Paragraph>
                  <Paragraph textSize="7" textColor="grey" mb="0">
                    {quote.title}
                  </Paragraph>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Hero color="primary" size="medium">
        <Hero.Body>
          <Container textAlign="centered">
            <Title as="h2" size="2">
              Ship the version that is wrong ten times less often.
            </Title>
            <SubTitle as="p" size="4" mt="4">
              Start free, scale when it works, talk to us when it matters.
            </SubTitle>
            {/* Filled buttons only on a fixed-color hero surface. */}
            <Buttons isCentered mt="5">
              <Button as="a" href="#/pricing" color="light" size="large">
                Get an API key
              </Button>
              <Button
                as="a"
                href="#/contact"
                color="primary"
                isInverted
                size="large"
              >
                Talk to sales
              </Button>
            </Buttons>
          </Container>
        </Hero.Body>
      </Hero>
    </>
  );
}
