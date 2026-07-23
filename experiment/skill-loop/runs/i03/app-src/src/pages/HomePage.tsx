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
  IconText,
  Media,
  Section,
  Span,
  SubTitle,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { BenchmarkBar } from '../components/BenchmarkBar';
import { FeatureCard } from '../components/FeatureCard';
import { SectionHeading } from '../components/SectionHeading';
import { StatCard } from '../components/StatCard';
import {
  FEATURED_BENCHMARKS,
  FEATURES,
  MODELS,
  QUOTES,
  STATS,
} from '../site/content';

export function HomePage() {
  return (
    <>
      <Hero size="large" className="hero-wash">
        <Hero.Body>
          <Container>
            <Columns isVCentered>
              <Column sizeDesktop={7}>
                <Tag color="primary" isRounded mb="5">
                  Skynet 1.0 — generally available
                </Tag>
                <Title size="1" mb="4">
                  Ten times better than Fable.{' '}
                  <Span textColor="primary">On every benchmark.</Span>
                </Title>
                <SubTitle as="p" size="4" textColor="grey" mb="5">
                  Skynet is Netadyne's frontier model family. Across all
                  fourteen benchmarks we publish — reasoning, code, math,
                  vision, long context, and agentic tool use — it leaves one
                  tenth the residual error Fable does.
                </SubTitle>
                <Buttons mb="4">
                  <Button as="a" href="#/contact" color="primary" size="large">
                    Get API access
                  </Button>
                  <Button as="a" href="#/benchmarks" size="large">
                    See the numbers
                  </Button>
                </Buttons>
                <IconText>
                  <Icon name="circle-check" textColor="success" aria-hidden />
                  <Span textSize="7" textColor="grey">
                    $5 in free credits · no waitlist under 50 seats · harness
                    published with every release
                  </Span>
                </IconText>
              </Column>

              <Column sizeDesktop={5}>
                <Box p="5">
                  <Span
                    display="block"
                    textSize="7"
                    textWeight="semibold"
                    textColor="grey"
                    mb="4"
                  >
                    RESIDUAL ERROR, LOWER IS BETTER
                  </Span>
                  {FEATURED_BENCHMARKS.slice(0, 2).map(b => (
                    <ErrorRow key={b.name} name={b.name} b={b} />
                  ))}
                  <Span display="block" textSize="7" textColor="grey" mt="4">
                    Share of benchmark items answered incorrectly. Full table on
                    the benchmarks page.
                  </Span>
                </Box>
              </Column>
            </Columns>
          </Container>
        </Hero.Body>
      </Hero>

      <Section className="section-alt">
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={4} gap={4}>
            {STATS.map(stat => (
              <Cell key={stat.label} display="flex" flexDirection="column">
                <StatCard
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                  flexGrow="1"
                />
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Why Skynet"
            title="Built to be right, not to be impressive"
            lede="Six things that change when a model verifies its own work."
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={5}>
            {FEATURES.map(feature => (
              <Cell key={feature.title} display="flex" flexDirection="column">
                <FeatureCard
                  title={feature.title}
                  body={feature.body}
                  icon={feature.icon}
                />
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Benchmarks"
            title="The same ratio, fourteen times over"
            lede="A tenth of the errors on saturated benchmarks and unsaturated ones alike."
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={5}>
            {FEATURED_BENCHMARKS.map(benchmark => (
              <Cell key={benchmark.name} display="flex" flexDirection="column">
                <BenchmarkBar benchmark={benchmark} flexGrow="1" />
              </Cell>
            ))}
          </Grid>
          <Buttons isCentered mt="6">
            <Button as="a" href="#/benchmarks" color="primary" isOutlined>
              All fourteen benchmarks
            </Button>
          </Buttons>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="The family"
            title="Three models, one API"
            lede="Same tokenizer, same tool schema, same evaluation harness. Swap the model string."
            mb="6"
          />
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
                  <Title as="h3" size="4" mb="1">
                    {model.name}
                  </Title>
                  <Span
                    display="block"
                    textSize="7"
                    textWeight="semibold"
                    textColor="primary"
                    mb="3"
                  >
                    {model.tagline.toUpperCase()}
                  </Span>
                  <Content textColor="grey" flexGrow="1">
                    {model.blurb}
                  </Content>
                  <Span display="block" textSize="7" textColor="grey">
                    {model.context} context · {model.latency}
                  </Span>
                </Box>
              </Cell>
            ))}
          </Grid>
          <Buttons isCentered mt="6">
            <Button as="a" href="#/skynet" color="primary" isOutlined>
              Compare the models
            </Button>
          </Buttons>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="In production"
            title="Teams that checked our work"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsDesktop={3} gap={5}>
            {QUOTES.map(quote => (
              <Cell key={quote.name} display="flex" flexDirection="column">
                <Box display="flex" flexDirection="column" flexGrow="1" p="5">
                  <Icon
                    name="quote-left"
                    textColor="primary"
                    mb="3"
                    aria-hidden="true"
                  />
                  <Content flexGrow="1">{quote.body}</Content>
                  <Media>
                    <Media.Left>
                      <Tag color="primary" isRounded size="medium">
                        {quote.initials}
                      </Tag>
                    </Media.Left>
                    <Media.Content>
                      <Span display="block" textWeight="semibold">
                        {quote.name}
                      </Span>
                      <Span display="block" textSize="7" textColor="grey">
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

      <Section size="medium">
        <Container>
          <Box p="6" textAlign="centered">
            <Title size="2" mb="3">
              Run the harness yourself
            </Title>
            <SubTitle as="p" size="5" textColor="grey" mb="5">
              Point it at your key, your prompts, your data. If the numbers
              don't reproduce, we want to know before you sign anything.
            </SubTitle>
            <Buttons isCentered>
              <Button as="a" href="#/contact" color="primary" size="large">
                Get API access
              </Button>
              <Button as="a" href="#/pricing" size="large">
                See pricing
              </Button>
            </Buttons>
          </Box>
        </Container>
      </Section>
    </>
  );
}

function ErrorRow({
  name,
  b,
}: {
  name: string;
  b: { skynet: number; fable: number };
}) {
  return (
    <Box hasShadow={false} p="0" mb="5">
      <Span display="block" textWeight="semibold" mb="2">
        {name}
      </Span>
      <Columns isMobile isVCentered mb="0">
        <Column size={5}>
          <Span textSize="7" textColor="grey">
            Skynet Ultra
          </Span>
        </Column>
        <Column>
          <Span textSize="4" textWeight="bold" textColor="primary">
            {(100 - b.skynet).toFixed(1)}%
          </Span>
        </Column>
      </Columns>
      <Columns isMobile isVCentered mb="0">
        <Column size={5}>
          <Span textSize="7" textColor="grey">
            Fable
          </Span>
        </Column>
        <Column>
          <Span textSize="4" textWeight="bold" textColor="grey">
            {(100 - b.fable).toFixed(1)}%
          </Span>
        </Column>
      </Columns>
    </Box>
  );
}
