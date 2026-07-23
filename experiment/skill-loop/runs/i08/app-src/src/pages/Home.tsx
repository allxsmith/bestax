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
  Reveal,
  Section,
  Span,
  SubTitle,
  Tag,
  Tags,
  Title,
} from '@allxsmith/bestax-bulma';
import { BenchmarkBar } from '../components/BenchmarkBar';
import { StatCard } from '../components/StatCard';
import { BENCHMARKS, FEATURES, HEADLINE_STATS, TESTIMONIALS } from '../data/site';

const LOGOS = [
  'Corvid Health',
  'Rothwell Mutual',
  'Meridian Capital',
  'Halcyon Robotics',
  'Praxis Legal',
];

export function Home() {
  return (
    <>
      <Hero size="large" className="hero-wash">
        <Hero.Body>
          <Container textAlign="centered">
            <Tags justifyContent="center" mb="5">
              <Tag color="primary" isRounded size="medium">
                Skynet 3 · generally available
              </Tag>
            </Tags>
            <Title size="1">
              Ten times fewer mistakes than{' '}
              <Span textColor="primary">Fable</Span>.
            </Title>
            <SubTitle size="4" textColor="grey" mt="5">
              Skynet is Netadyne's frontier model. Across all eight suites in
              our public harness it makes one error for every ten that Fable
              makes — with an 8M token context and a 110 ms first token.
            </SubTitle>
            <Buttons isCentered mt="6">
              <Button as="a" href="#/access" color="primary" size="large">
                Request access
              </Button>
              <Button as="a" href="#/benchmarks" size="large" isOutlined>
                See the benchmarks
              </Button>
            </Buttons>
            <Paragraph textColor="grey" textSize="7" mt="5">
              No credit card for the Explore tier · Zero data retention by
              default
            </Paragraph>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Paragraph
            textAlign="centered"
            textColor="grey"
            textSize="7"
            textTransform="uppercase"
            textWeight="semibold"
            mb="4"
          >
            In production at
          </Paragraph>
          <Columns isCentered isMobile isMultiline>
            {LOGOS.map(name => (
              <Column key={name} isNarrow>
                <Span textColor="grey" textWeight="semibold" textSize="5">
                  {name}
                </Span>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section className="section-alt">
        <Container>
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={4}
            gap={4}
          >
            {HEADLINE_STATS.map((stat, i) => (
              <Cell key={stat.label} display="flex" flexDirection="column">
                <Reveal delay={i * 80} flexGrow="1" display="flex">
                  <StatCard
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    flexGrow="1"
                  />
                </Reveal>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Columns isVCentered gap={6}>
            <Column sizeDesktop={5}>
              <Title size="2">What "10x" means here</Title>
              <Content textColor="grey" mt="4">
                <p>
                  A score out of 100 cannot multiply by ten, so we do not claim
                  it does. We report the ratio that actually moves the work:
                  residual error.
                </p>
                <p>
                  Where Fable misses twelve items in a hundred, Skynet misses
                  1.2. That ratio holds at 10.0x on every suite we publish —
                  reasoning, code, math, long context, security, multilingual,
                  multimodal, and tool use.
                </p>
                <p>
                  For a team running a million requests a day, that is the
                  difference between a review queue and a spot check.
                </p>
              </Content>
              <Buttons mt="5">
                <Button as="a" href="#/benchmarks" color="primary">
                  Full results & methodology
                </Button>
              </Buttons>
            </Column>

            <Column sizeDesktop={7}>
              <Box p="5">
                {BENCHMARKS.slice(0, 4).map((benchmark, i) => (
                  <BenchmarkBar
                    key={benchmark.id}
                    benchmark={benchmark}
                    mb={i === 3 ? '0' : '5'}
                  />
                ))}
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Title size="2" textAlign="centered">
            Built for the part after the demo
          </Title>
          <SubTitle
            size="5"
            textColor="grey"
            textAlign="centered"
            mt="4"
            mb="6"
          >
            Everything below ships on day one, on every paid plan.
          </SubTitle>

          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={3}
            gap={5}
          >
            {FEATURES.map((feature, i) => (
              <Cell key={feature.name} display="flex" flexDirection="column">
                <Reveal delay={i * 60} flexGrow="1" display="flex">
                  <Card flexGrow="1">
                    <Card.Content>
                      <IconText mb="3">
                        <Icon
                          name={feature.icon}
                          textColor="primary"
                          size="medium"
                          aria-hidden="true"
                        />
                        <Title as="p" size="5" mb="0">
                          {feature.name}
                        </Title>
                      </IconText>
                      <Content textColor="grey">{feature.blurb}</Content>
                    </Card.Content>
                  </Card>
                </Reveal>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Title size="2" textAlign="centered" mb="6">
            What teams say after the migration
          </Title>
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsDesktop={3}
            gap={5}
          >
            {TESTIMONIALS.map(t => (
              <Cell key={t.name} display="flex" flexDirection="column">
                <Box flexGrow="1" display="flex" flexDirection="column" p="5">
                  <Icon
                    name="quote-left"
                    textColor="primary"
                    size="medium"
                    mb="3"
                    aria-hidden="true"
                  />
                  <Content flexGrow="1">{t.quote}</Content>
                  <Span textWeight="semibold" display="block" mt="4">
                    {t.name}
                  </Span>
                  <Span textColor="grey" textSize="7">
                    {t.role}
                  </Span>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container textAlign="centered">
          <Title size="2">Put Skynet behind your hardest workload</Title>
          <SubTitle size="5" textColor="grey" mt="4">
            Access opens in cohorts. Tell us what you are building and we will
            size a deployment with you.
          </SubTitle>
          <Buttons isCentered mt="5">
            <Button as="a" href="#/access" color="primary" size="large">
              Request access
            </Button>
            <Button as="a" href="#/pricing" size="large" isOutlined>
              Compare plans
            </Button>
          </Buttons>
        </Container>
      </Section>
    </>
  );
}
