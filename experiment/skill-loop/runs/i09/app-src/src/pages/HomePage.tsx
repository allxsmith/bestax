import {
  Hero,
  Section,
  Container,
  Columns,
  Column,
  Grid,
  Cell,
  Card,
  Box,
  Title,
  SubTitle,
  Paragraph,
  Span,
  Strong,
  Button,
  Buttons,
  Tag,
  Tags,
  Icon,
  IconText,
  Progress,
  Reveal,
  Link,
  Media,
  Pre,
} from '@allxsmith/bestax-bulma';
import {
  BENCHMARKS,
  FEATURES,
  QUOTES,
  MODELS,
  CODE_SAMPLE,
  advantage,
} from '../data/site';
import { StatTile } from '../components/StatTile';

const HEADLINE_BENCHMARKS = BENCHMARKS.slice(0, 4);

const averageAdvantage = (
  BENCHMARKS.reduce((sum, b) => sum + advantage(b), 0) / BENCHMARKS.length
).toFixed(1);

export function HomePage() {
  return (
    <>
      <Hero size="large" className="hero-wash">
        <Hero.Body>
          <Container>
            <Columns isVCentered>
              <Column sizeDesktop={7}>
                <Tags mb="5">
                  <Tag color="primary" isRounded>
                    New
                  </Tag>
                  <Tag isRounded>Skynet Max is generally available</Tag>
                </Tags>

                <Title size="1">
                  The model that scores{' '}
                  <Span textColor="primary">10x Fable</Span> on every benchmark
                  we publish.
                </Title>

                <SubTitle size="4" textColor="grey" mt="5">
                  Skynet is Netadyne's third-generation frontier family: a
                  10M-token context window, tool use that survives hundreds of
                  steps, and first tokens in under 100 milliseconds.
                </SubTitle>

                <Buttons mt="6">
                  <Button color="primary" size="large" as="a" href="#/contact">
                    Get API access
                  </Button>
                  <Button size="large" as="a" href="#/benchmarks">
                    Read the evals
                  </Button>
                </Buttons>

                <Span
                  display="flex"
                  alignItems="center"
                  flexWrap="wrap"
                  mt="5"
                  textColor="grey"
                  textSize="7"
                >
                  <IconText
                    mr="5"
                    iconProps={{ name: 'circle-check', 'aria-hidden': 'true' }}
                  >
                    500K free tokens monthly
                  </IconText>
                  <IconText
                    mr="5"
                    iconProps={{ name: 'shield-halved', 'aria-hidden': 'true' }}
                  >
                    Zero data retention
                  </IconText>
                  <IconText
                    iconProps={{ name: 'credit-card', 'aria-hidden': 'true' }}
                  >
                    No card to start
                  </IconText>
                </Span>
              </Column>

              <Column sizeDesktop={5}>
                <Box>
                  <Span
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb="4"
                  >
                    <Strong>Netadyne Eval Index</Strong>
                    <Tag color="primary" isRounded>
                      skynet-max
                    </Tag>
                  </Span>

                  {HEADLINE_BENCHMARKS.map(benchmark => (
                    <Span key={benchmark.id} display="block" mb="4">
                      <Span
                        display="flex"
                        justifyContent="space-between"
                        textSize="7"
                        mb="1"
                      >
                        <Span>{benchmark.name}</Span>
                        <Strong textColor="primary">
                          {advantage(benchmark)}x
                        </Strong>
                      </Span>
                      <Progress
                        color="primary"
                        value={benchmark.skynet}
                        max={1000}
                        size="small"
                        aria-label={`Skynet Max on ${benchmark.name}`}
                      />
                      <Progress
                        value={benchmark.fable}
                        max={1000}
                        size="small"
                        aria-label={`Fable on ${benchmark.name}`}
                      />
                    </Span>
                  ))}

                  <Span textSize="7" textColor="grey">
                    Filled bar: Skynet Max. Hairline: Fable. Scored 0–1000 on
                    the Netadyne Eval Index —{' '}
                    <Link href="#/benchmarks">see the methodology</Link>.
                  </Span>
                </Box>
              </Column>
            </Columns>
          </Container>
        </Hero.Body>
      </Hero>

      <Section className="section-alt">
        <Container>
          <Grid isFixed fixedColsMobile={2} fixedColsTablet={4} gap={5}>
            <Cell>
              <StatTile
                icon="arrow-trend-up"
                value={`${averageAdvantage}x`}
                label="Average advantage over Fable across eight suites"
              />
            </Cell>
            <Cell>
              <StatTile
                icon="layer-group"
                value="10M"
                label="Token context window on Skynet Max"
                color="info"
              />
            </Cell>
            <Cell>
              <StatTile
                icon="bolt"
                value="38 ms"
                label="Time to first token on Skynet Nano"
                color="info"
              />
            </Cell>
            <Cell>
              <StatTile
                icon="shield-halved"
                value="99.99%"
                label="Measured API availability, trailing twelve months"
                color="success"
              />
            </Cell>
          </Grid>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Title size="2" textAlign="centered">
            Built for the work that doesn't fit in a chat box
          </Title>
          <SubTitle size="5" textColor="grey" textAlign="centered" mt="4">
            Six things teams tell us they stopped worrying about after
            switching.
          </SubTitle>

          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={5} mt="6">
            {FEATURES.map((feature, i) => (
              <Cell key={feature.title} display="flex" flexDirection="column">
                {/* Reveal cascades only its direct children — so the stagger
                    lives inside each Cell, not around the Grid. */}
                <Reveal
                  animation="fade-up"
                  delay={i * 70}
                  display="flex"
                  flexDirection="column"
                  flexGrow="1"
                >
                  <Card flexGrow="1">
                    <Card.Content>
                      <Icon
                        name={feature.icon}
                        size="medium"
                        textColor="primary"
                        aria-hidden="true"
                      />
                      <Title as="p" size="5" mt="3" mb="2">
                        {feature.title}
                      </Title>
                      <Paragraph textColor="grey">{feature.body}</Paragraph>
                    </Card.Content>
                  </Card>
                </Reveal>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={5}>
              <Title size="2">Three lines, then you're on Skynet</Title>
              <Paragraph textColor="grey" mt="4">
                The Netadyne API accepts OpenAI- and Anthropic-shaped messages,
                so migrating usually means a base URL, a model string, and a
                key. Tools, streaming, and structured output work the way you
                already have them wired.
              </Paragraph>
              <Buttons mt="5">
                <Button color="primary" as="a" href="#/models">
                  Compare the models
                </Button>
                <Button as="a" href="#/pricing">
                  See pricing
                </Button>
              </Buttons>
            </Column>

            <Column sizeDesktop={7}>
              <Pre>{CODE_SAMPLE}</Pre>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Title size="2" textAlign="centered">
            One family, three sizes
          </Title>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={3} gap={5} mt="6">
            {MODELS.map(model => (
              <Cell key={model.id} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <Icon
                      name={model.icon}
                      size="medium"
                      textColor={model.color}
                      aria-hidden="true"
                    />
                    <Title as="p" size="4" mt="3" mb="2">
                      {model.name}
                    </Title>
                    <Paragraph textColor="grey" mb="4">
                      {model.tagline}
                    </Paragraph>
                    <Span display="block" textSize="7" textColor="grey">
                      <Strong>{model.context}</Strong> context ·{' '}
                      <Strong>{model.latency}</Strong>
                    </Span>
                  </Card.Content>
                  <Card.Footer>
                    <Card.FooterItem>
                      <Link href="#/models">Details</Link>
                    </Card.FooterItem>
                    <Card.FooterItem>
                      <Link href="#/pricing">{model.inputPrice}/Mtok in</Link>
                    </Card.FooterItem>
                  </Card.Footer>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Title size="2" textAlign="centered" mb="6">
            What teams do with it
          </Title>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={3} gap={5}>
            {QUOTES.map(quote => (
              <Cell key={quote.name} display="flex" flexDirection="column">
                <Box flexGrow="1" display="flex" flexDirection="column">
                  <Paragraph flexGrow="1">"{quote.body}"</Paragraph>
                  <Media mt="4">
                    <Media.Left>
                      <Tag color="primary" size="medium" isRounded>
                        {quote.initials}
                      </Tag>
                    </Media.Left>
                    <Media.Content>
                      <Span display="block">
                        <Strong>{quote.name}</Strong>
                      </Span>
                      <Span textSize="7" textColor="grey">
                        {quote.role}
                      </Span>
                    </Media.Content>
                  </Media>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Hero color="primary" size="medium">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="2">Ship the thing that kept stalling</Title>
            <SubTitle size="5" mt="4">
              Start with 500K free tokens. Talk to us when you need provisioned
              throughput.
            </SubTitle>
            {/* Filled buttons only on a fixed-color hero — a thin outline here
                loses contrast, and loses more under dark mode. */}
            <Buttons isCentered mt="5">
              <Button color="light" size="large" as="a" href="#/contact">
                Get API access
              </Button>
              <Button
                color="primary"
                isInverted
                size="large"
                as="a"
                href="#/pricing"
              >
                See pricing
              </Button>
            </Buttons>
          </Container>
        </Hero.Body>
      </Hero>
    </>
  );
}
