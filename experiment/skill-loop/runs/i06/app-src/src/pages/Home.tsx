import {
  Block,
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
  Level,
  Media,
  Notification,
  Paragraph,
  Reveal,
  Section,
  Span,
  Strong,
  SubTitle,
  Tag,
  Tags,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { StatTile } from '../components/StatTile';
import { BenchmarkBar } from '../components/BenchmarkBar';
import {
  BENCHMARKS,
  CUSTOMER_LOGOS,
  FEATURES,
  MODELS,
  TESTIMONIALS,
  USE_CASES,
} from '../data/site';
import type { PageProps } from '../routes';

const HEADLINE_BENCHMARKS = ['swe-bench', 'gpqa', 'terminal-bench', 'mrcr'];

export function Home({ onNavigate }: PageProps) {
  const headline = HEADLINE_BENCHMARKS.map(
    id => BENCHMARKS.find(b => b.id === id)!
  );

  return (
    <>
      <Hero size="large" className="hero-wash">
        <Hero.Body>
          <Container>
            <Columns isVCentered>
              <Column sizeDesktop={7}>
                <Tag color="primary" isRounded mb="4">
                  Skynet 3 — generally available
                </Tag>
                <Title size="1" mb="4">
                  Ten times fewer mistakes than Fable.
                </Title>
                <SubTitle size="4" textColor="grey" mb="5">
                  Skynet is Netadyne's frontier model. On every benchmark we
                  publish, it makes one tenth the errors of Fable — across code,
                  reasoning, agents, vision and a four-million-token context
                  window.
                </SubTitle>
                <Buttons>
                  <Button
                    color="primary"
                    size="large"
                    onClick={() => onNavigate('contact')}
                  >
                    <Icon name="rocket-launch" aria-hidden="true" />
                    <Span>Start building</Span>
                  </Button>
                  <Button size="large" onClick={() => onNavigate('benchmarks')}>
                    <Icon name="chart-timeline-variant" aria-hidden="true" />
                    <Span>See the benchmarks</Span>
                  </Button>
                </Buttons>
                <Paragraph mt="4">
                  <Span textSize="7" textColor="grey">
                    $25 of free credit. No card required. Production keys in
                    under a minute.
                  </Span>
                </Paragraph>
              </Column>

              <Column sizeDesktop={5}>
                <Box>
                  <Level isMobile mb="4">
                    <Level.Left>
                      <Level.Item>
                        <Strong>Residual error rate</Strong>
                      </Level.Item>
                    </Level.Left>
                    <Level.Right>
                      <Level.Item>
                        <Tag color="primary" isRounded>
                          lower is better
                        </Tag>
                      </Level.Item>
                    </Level.Right>
                  </Level>
                  {headline.map(b => (
                    <BenchmarkBar
                      key={b.id}
                      benchmark={b}
                      showBlurb={false}
                      mb="5"
                    />
                  ))}
                  <Paragraph mb="0">
                    <Span textSize="7" textColor="grey">
                      Skynet Ultra vs. Fable, single attempt, no tools unless
                      the benchmark provides them.
                    </Span>
                  </Paragraph>
                </Box>
              </Column>
            </Columns>
          </Container>
        </Hero.Body>
      </Hero>

      <Section className="section-alt">
        <Container>
          <Paragraph textAlign="centered" mb="4">
            <Span textSize="7" textColor="grey" textTransform="uppercase">
              In production at
            </Span>
          </Paragraph>
          <Tags justifyContent="center">
            {CUSTOMER_LOGOS.map(name => (
              <Tag key={name} size="medium">
                {name}
              </Tag>
            ))}
          </Tags>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={3}>
              <StatTile
                value="10×"
                label="Fewer residual errors"
                hint="Against Fable, on every published benchmark"
              />
            </Column>
            <Column sizeDesktop={3}>
              <StatTile
                value="4M"
                label="Token context window"
                hint="Flat recall to the end of the window"
              />
            </Column>
            <Column sizeDesktop={3}>
              <StatTile
                value="98.2%"
                label="SWE-bench Verified"
                hint="Real issues, real repositories"
              />
            </Column>
            <Column sizeDesktop={3}>
              <StatTile
                value="99.95%"
                label="Uptime SLA"
                hint="Across 14 regions on Netadyne Cloud"
              />
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <Columns>
            <Column sizeDesktop={5}>
              <SectionHeading
                eyebrow="The claim, stated precisely"
                title="10× is a ratio of mistakes, not of scores."
                subtitle="Frontier benchmarks are saturating. Two points of headline score can hide an order of magnitude in how often a model is actually wrong — so we report the part that matters."
              />
              <Buttons mt="5">
                <Button color="primary" onClick={() => onNavigate('benchmarks')}>
                  <Span>Full benchmark table</Span>
                  <Icon name="arrow-right" aria-hidden="true" />
                </Button>
              </Buttons>
            </Column>
            <Column sizeDesktop={7}>
              <Box>
                <Content>
                  <p>
                    Take SWE-bench Verified. Fable resolves 82.0% of issues,
                    which means it fails 18 of every 100. Skynet resolves 98.2%
                    — it fails 1.8. Same benchmark, same harness, one tenth the
                    failures.
                  </p>
                  <p>
                    That ratio is not cherry-picked from one evaluation. It
                    holds on GPQA Diamond, on AIME, on MMLU-Pro, on
                    Terminal-Bench, on MMMU, on million-token retrieval, and on
                    the Frontier Exam. Ten benchmarks, one result: a tenth the
                    mistakes.
                  </p>
                </Content>
                <Notification color="primary" isLight mb="0">
                  <Strong>How to read it:</Strong> residual error = 100 − score.
                  Skynet's residual error is Fable's divided by ten, on every
                  row of our published suite.
                </Notification>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            centered
            eyebrow="Capabilities"
            title="Built to be trusted with the whole job"
            subtitle="Not a chat window with a bigger score — a model that finishes long, consequential work."
            mb="6"
          />
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={3}
            gap={5}
          >
            {FEATURES.map((feature, index) => (
              <Cell key={feature.title} display="flex" flexDirection="column">
                <Reveal
                  animation="fade-up"
                  delay={index * 60}
                  display="flex"
                  flexDirection="column"
                  flexGrow="1"
                >
                  <Box flexGrow="1">
                    <Icon
                      name={feature.icon}
                      size="large"
                      textColor="primary"
                      aria-hidden="true"
                    />
                    <Title size="5" mt="3" mb="2">
                      {feature.title}
                    </Title>
                    <Paragraph mb="0">
                      <Span textColor="grey">{feature.body}</Span>
                    </Paragraph>
                  </Box>
                </Reveal>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            centered
            eyebrow="The lineup"
            title="Three models, one family"
            subtitle="Every Skynet model shares the same tokenizer, the same tool schema and the same safety training. Switching is a string change."
            mb="6"
          />
          <Columns>
            {MODELS.map(model => (
              <Column key={model.id} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <Media>
                      <Media.Left>
                        <Icon
                          name={model.icon}
                          size="large"
                          textColor="primary"
                          aria-hidden="true"
                        />
                      </Media.Left>
                      <Media.Content>
                        <Title size="5" mb="1">
                          {model.name}
                        </Title>
                        {model.featured && (
                          <Tag color="primary" isRounded>
                            Most popular
                          </Tag>
                        )}
                      </Media.Content>
                    </Media>
                    <Paragraph mt="3" mb="4">
                      <Span textColor="grey">{model.tagline}</Span>
                    </Paragraph>
                    <Block>
                      <IconText
                        iconProps={{ name: 'database-outline', 'aria-hidden': 'true' }}
                      >
                        {model.context} context
                      </IconText>
                    </Block>
                    <Block>
                      <IconText
                        iconProps={{ name: 'lightning-bolt', 'aria-hidden': 'true' }}
                      >
                        {model.latency}
                      </IconText>
                    </Block>
                    <Block mb="0">
                      <IconText
                        iconProps={{ name: 'currency-usd', 'aria-hidden': 'true' }}
                      >
                        {model.inputPrice} in / {model.outputPrice} out per 1M
                        tokens
                      </IconText>
                    </Block>
                  </Card.Content>
                </Card>
              </Column>
            ))}
          </Columns>
          <Buttons isCentered mt="5">
            <Button color="primary" isInverted onClick={() => onNavigate('models')}>
              <Span>Compare the models</Span>
              <Icon name="arrow-right" aria-hidden="true" />
            </Button>
          </Buttons>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            centered
            eyebrow="Where it earns its keep"
            title="Work that used to need a person in the loop"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={4} gap={5}>
            {USE_CASES.map(useCase => (
              <Cell key={useCase.title} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <Icon
                    name={useCase.icon}
                    size="medium"
                    textColor="primary"
                    aria-hidden="true"
                  />
                  <Title size="5" mt="3" mb="2">
                    {useCase.title}
                  </Title>
                  <Paragraph mb="4">
                    <Span textColor="grey">{useCase.body}</Span>
                  </Paragraph>
                  <Title size="4" textColor="primary" mb="1">
                    {useCase.metric}
                  </Title>
                  <Paragraph mb="0">
                    <Span textSize="7" textColor="grey">
                      {useCase.metricLabel}
                    </Span>
                  </Paragraph>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            centered
            eyebrow="Customers"
            title="What changes when the error rate drops"
            mb="6"
          />
          <Columns>
            {TESTIMONIALS.map(testimonial => (
              <Column
                key={testimonial.name}
                display="flex"
                flexDirection="column"
              >
                <Box flexGrow="1">
                  <Icon
                    name="format-quote-open"
                    size="medium"
                    textColor="primary"
                    aria-hidden="true"
                  />
                  <Content mt="2">
                    <p>{testimonial.quote}</p>
                  </Content>
                  <Paragraph mb="0">
                    <Strong>{testimonial.name}</Strong>
                  </Paragraph>
                  <Paragraph mb="0">
                    <Span textSize="7" textColor="grey">
                      {testimonial.role}
                    </Span>
                  </Paragraph>
                </Box>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Box>
            <Columns isVCentered>
              <Column sizeDesktop={8}>
                <Title size="3" mb="2">
                  Run your own evals. That is the point.
                </Title>
                <Paragraph mb="0">
                  <Span textColor="grey">
                    Every number on this site is reproducible with the harness
                    we publish. Bring your hardest internal benchmark — the one
                    your current model keeps failing — and measure it yourself.
                  </Span>
                </Paragraph>
              </Column>
              <Column sizeDesktop={4}>
                <Buttons alignItems="flex-end" justifyContent="flex-end">
                  <Button
                    color="primary"
                    size="medium"
                    onClick={() => onNavigate('contact')}
                  >
                    <Icon name="rocket-launch" aria-hidden="true" />
                    <Span>Get an API key</Span>
                  </Button>
                  <Button size="medium" onClick={() => onNavigate('docs')}>
                    <Span>Read the docs</Span>
                  </Button>
                </Buttons>
              </Column>
            </Columns>
          </Box>
        </Container>
      </Section>
    </>
  );
}
