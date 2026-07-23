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
  Paragraph,
  Section,
  Span,
  Strong,
  SubTitle,
  Tag,
  Tags,
  Title,
} from '@allxsmith/bestax-bulma';
import BenchmarkBar from '../site/BenchmarkBar';
import {
  BENCHMARKS,
  FEATURES,
  HEADLINE_STATS,
  MODELS,
  TESTIMONIALS,
  type PageId,
} from '../site/content';

const CUSTOMERS = [
  'Halcyon Logistics',
  'Meridian Legal',
  'Verdant Systems',
  'Northbeam',
  'Quorum Health',
  'Atlas Freight',
];

export default function HomePage({
  onNavigate,
}: {
  onNavigate: (page: PageId) => void;
}) {
  return (
    <>
      <Hero size="large" className="hero-backdrop">
        <Hero.Body>
          <Container>
            <Columns isVCentered>
              <Column sizeDesktop={7}>
                <Tags mb="4">
                  <Tag color="primary" isRounded>
                    Skynet
                  </Tag>
                  <Tag isRounded>Generally available</Tag>
                </Tags>

                <Title size="1">
                  Ten times fewer errors than{' '}
                  <Span textColor="primary">Fable</Span>. On every benchmark.
                </Title>

                <SubTitle size="4" textColor="grey" mt="4">
                  Skynet is Netadyne's frontier model. It closes 90% of the gap
                  the leading model leaves open — across knowledge, math,
                  coding, agentic work, and a four-million-token context window.
                </SubTitle>

                <Buttons mt="5">
                  <Button
                    color="primary"
                    size="large"
                    onClick={() => onNavigate('contact')}
                  >
                    <Icon name="rocket" aria-hidden="true" />
                    <span>Request access</span>
                  </Button>
                  <Button
                    color="primary"
                    isOutlined
                    size="large"
                    onClick={() => onNavigate('benchmarks')}
                  >
                    <Icon name="chart-simple" aria-hidden="true" />
                    <span>See the numbers</span>
                  </Button>
                </Buttons>

                <Paragraph textSize="7" textColor="grey" mt="4">
                  $25 in free credits. No card. Ships with Python, TypeScript,
                  Go, and Rust SDKs.
                </Paragraph>
              </Column>

              <Column sizeDesktop={5}>
                <Box>
                  <Span
                    textSize="7"
                    textWeight="semibold"
                    textColor="grey"
                    display="block"
                    mb="4"
                  >
                    SKYNET OPUS vs FABLE
                  </Span>
                  {BENCHMARKS.slice(0, 3).map(benchmark => (
                    <BenchmarkBar key={benchmark.name} benchmark={benchmark} />
                  ))}
                  <Paragraph textSize="7" textColor="grey" mt="4">
                    Scores are pass rates. Netadyne internal evaluation,
                    July 2026.
                  </Paragraph>
                </Box>
              </Column>
            </Columns>
          </Container>
        </Hero.Body>
      </Hero>

      <Section className="band">
        <Container>
          <Grid isFixed fixedColsMobile={2} fixedColsTablet={4} gap={4}>
            {HEADLINE_STATS.map(stat => (
              <Cell key={stat.label} textAlign="centered">
                <Span textColor="primary" textSize="4">
                  <Icon name={stat.icon} aria-hidden="true" />
                </Span>
                <Title size="2" mt="2" mb="1">
                  {stat.value}
                </Title>
                <Span textSize="7" textColor="grey">
                  {stat.label}
                </Span>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section>
        <Container textAlign="centered">
          <Span
            textSize="7"
            textWeight="semibold"
            textColor="grey"
            display="block"
            mb="4"
          >
            IN PRODUCTION AT
          </Span>
          <Tags isMultiline justifyContent="center">
            {CUSTOMERS.map(name => (
              <Tag key={name} size="medium">
                {name}
              </Tag>
            ))}
          </Tags>
        </Container>
      </Section>

      <Section size="medium" className="band">
        <Container>
          <Block textAlign="centered" mb="6">
            <Title size="2">Built differently, not just bigger</Title>
            <SubTitle size="5" textColor="grey" mt="3">
              The error rate came down because the architecture changed — not
              because we spent another six months on the sampler.
            </SubTitle>
          </Block>

          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={5}>
            {FEATURES.map(feature => (
              <Cell key={feature.title} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <Span textColor="primary" textSize="3">
                    <Icon name={feature.icon} aria-hidden="true" />
                  </Span>
                  <Title size="5" mt="3" mb="2">
                    {feature.title}
                  </Title>
                  <Paragraph textColor="grey">{feature.body}</Paragraph>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Block textAlign="centered" mb="6">
            <Title size="2">Three models, one API</Title>
            <SubTitle size="5" textColor="grey" mt="3">
              Route to the tier the task deserves. Same interface, same tools,
              same guardrails.
            </SubTitle>
          </Block>

          <Columns>
            {MODELS.map(model => (
              <Column key={model.name} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <Tag color={model.tagColor} isRounded mb="3">
                      {model.tag}
                    </Tag>
                    <Title size="4" mb="3">
                      {model.name}
                    </Title>
                    <Paragraph textColor="grey" mb="4">
                      {model.body}
                    </Paragraph>
                    {model.specs.map(spec => (
                      <Block key={spec} mb="1">
                        <IconText
                          iconProps={{
                            name: 'circle-check',
                            'aria-hidden': 'true',
                          }}
                          textColor="grey"
                        >
                          {spec}
                        </IconText>
                      </Block>
                    ))}
                  </Card.Content>
                </Card>
              </Column>
            ))}
          </Columns>

          <Block textAlign="centered" mt="5">
            <Button color="primary" isOutlined onClick={() => onNavigate('pricing')}>
              Compare pricing
            </Button>
          </Block>
        </Container>
      </Section>

      <Section size="medium" className="band">
        <Container>
          <Title size="2" textAlign="centered" mb="6">
            What teams do with it
          </Title>
          <Columns>
            {TESTIMONIALS.map(testimonial => (
              <Column
                key={testimonial.name}
                display="flex"
                flexDirection="column"
              >
                <Box flexGrow="1">
                  <Span textColor="primary" textSize="4">
                    <Icon name="quote-left" aria-hidden="true" />
                  </Span>
                  <Content mt="3">
                    <Paragraph>{testimonial.quote}</Paragraph>
                  </Content>
                  <Strong display="block">{testimonial.name}</Strong>
                  <Span textSize="7" textColor="grey">
                    {testimonial.role}
                  </Span>
                </Box>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Box textAlign="centered" p="6">
            <Title size="2">Run your own evals</Title>
            <SubTitle size="5" textColor="grey" mt="3" mb="5">
              Bring the hardest task you have. If Skynet doesn't cut your error
              rate, we want to know which benchmark we're missing.
            </SubTitle>
            <Buttons isCentered>
              <Button
                color="primary"
                size="large"
                onClick={() => onNavigate('contact')}
              >
                Request access
              </Button>
              <Button
                color="primary"
                isOutlined
                size="large"
                onClick={() => onNavigate('docs')}
              >
                Read the docs
              </Button>
            </Buttons>
          </Box>
        </Container>
      </Section>
    </>
  );
}
