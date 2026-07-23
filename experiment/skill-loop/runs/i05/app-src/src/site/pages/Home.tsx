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
  Media,
  Avatar,
  Notification,
  Level,
  Divider,
  Pre,
  Code,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { StatCard } from '../components/StatCard';
import { BenchmarkBar } from '../components/BenchmarkBar';
import {
  BASELINE,
  BENCHMARKS,
  CUSTOMERS,
  FEATURES,
  HEADLINE_STATS,
  MODELS,
  QUOTES,
} from '../data';
import { href } from '../routes';

const SNIPPET = `import Netadyne from "@netadyne/sdk";

const client = new Netadyne();

const res = await client.messages.create({
  model: "skynet-ultra",
  max_tokens: 4096,
  messages: [{ role: "user", content: "Audit this repo for race conditions." }],
  tools: [repoReader, shell],
});

console.log(res.content[0].text);`;

export function Home() {
  return (
    <>
      <Hero size="large" className="hero-wash">
        <Hero.Body>
          <Container>
            <Columns isVCentered>
              <Column sizeDesktop={7}>
                <Tags mb="4">
                  <Tag color="primary">New</Tag>
                  <Tag>Skynet Ultra is generally available</Tag>
                </Tags>
                <Title size="1">
                  Ten times fewer errors than{' '}
                  <Span textColor="primary">{BASELINE}</Span>. On every
                  benchmark.
                </Title>
                <SubTitle as="p" size="4" textColor="grey" mt="5">
                  Skynet is Netadyne&rsquo;s frontier model family. It reasons
                  over ten million tokens, drives its own tools for hours at a
                  time, and gets one tenth as many answers wrong as the model
                  you are using today.
                </SubTitle>
                <Buttons mt="5">
                  <Button as="a" href={href('/contact')} color="primary" size="large">
                    <Icon name="key" aria-hidden="true" />
                    <span>Get an API key</span>
                  </Button>
                  <Button
                    as="a"
                    href={href('/benchmarks')}
                    color="primary"
                    isOutlined
                    size="large"
                  >
                    <Icon name="chart-simple" aria-hidden="true" />
                    <span>See the benchmarks</span>
                  </Button>
                </Buttons>
                <IconText mt="5" textColor="grey">
                  <Icon name="circle-check" textColor="success" aria-hidden="true" />
                  <Span textSize="7">
                    $25 in free credits · No card required · SOC 2 Type II
                  </Span>
                </IconText>
              </Column>

              <Column sizeDesktop={5}>
                <Box p="5">
                  <Level isMobile mb="4">
                    <Level.Left>
                      <Level.Item>
                        <Span textSize="7" textWeight="semibold" textTransform="uppercase" textColor="grey">
                          Error rate, SWE-bench Verified
                        </Span>
                      </Level.Item>
                    </Level.Left>
                  </Level>
                  <Title as="p" size="1" textColor="primary" mb="1">
                    2.1%
                  </Title>
                  <Paragraph textColor="grey" mb="5">
                    Skynet Ultra &mdash; against {BASELINE} at 21.0%.
                  </Paragraph>
                  <Divider />
                  {BENCHMARKS.slice(0, 3).map(b => (
                    <BenchmarkBar key={b.name} benchmark={b} mb="5" />
                  ))}
                  <Button as="a" href={href('/benchmarks')} color="primary" isLight isFullWidth>
                    All ten benchmarks
                  </Button>
                </Box>
              </Column>
            </Columns>
          </Container>
        </Hero.Body>
      </Hero>

      <Section className="section-alt">
        <Container>
          <Paragraph
            textAlign="centered"
            textColor="grey"
            textSize="7"
            textTransform="uppercase"
            textWeight="semibold"
            mb="4"
          >
            Running in production at
          </Paragraph>
          <Tags justifyContent="center">
            {CUSTOMERS.map(name => (
              <Tag key={name} size="medium">
                {name}
              </Tag>
            ))}
          </Tags>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <SectionHeading
            eyebrow="By the numbers"
            title="What an order of magnitude buys you"
            subtitle="Accuracy is only half of it. Skynet is also the fastest and cheapest way to finish the task, not just to emit a token."
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={4} gap={4}>
            {HEADLINE_STATS.map(stat => (
              <Cell key={stat.label} display="flex" flexDirection="column">
                <StatCard
                  flexGrow="1"
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                  color={stat.color}
                />
              </Cell>
            ))}
          </Grid>
          <Paragraph textAlign="centered" textColor="grey" textSize="7" mt="5">
            &ldquo;10× better&rdquo; means a 10× lower error rate: on every
            benchmark we publish, Skynet Ultra gets one tenth as many items
            wrong as {BASELINE}.
          </Paragraph>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Capabilities"
            title="Built for work that does not fit in a chat box"
            subtitle="Every capability below ships on the same weights. There is no premium tier of the model itself — only of the throughput you reserve."
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={5}>
            {FEATURES.map(feature => (
              <Cell key={feature.title} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <Icon
                      name={feature.icon}
                      size="medium"
                      textColor="primary"
                      mb="3"
                      aria-hidden="true"
                    />
                    <Title as="p" size="5" mb="3">
                      {feature.title}
                    </Title>
                    <Paragraph textColor="grey" mb="0">
                      {feature.body}
                    </Paragraph>
                  </Card.Content>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={5}>
              <SectionHeading
                align="left"
                eyebrow="Developer experience"
                title="Two lines to switch"
                subtitle="The REST API matches the chat-completions shape you already call. Point the base URL at Netadyne, change the model string, and keep your code."
                mb="5"
              />
              <Buttons>
                <Button as="a" href={href('/models')} color="primary">
                  Read the docs
                </Button>
                <Button as="a" href={href('/pricing')} color="primary" isLight>
                  Compare plans
                </Button>
              </Buttons>
            </Column>
            <Column sizeDesktop={7}>
              <Box p="5">
                <IconText mb="2" textColor="grey">
                  <Icon name="file-code" aria-hidden="true" />
                  <Span textSize="7" textTransform="uppercase" textWeight="semibold">
                    quickstart.ts
                  </Span>
                </IconText>
                <Divider />
                <Pre textSize="7">
                  <Code>{SNIPPET}</Code>
                </Pre>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Model line"
            title="Three sizes, one set of weights"
            subtitle="Ultra, Pro and Mini are distillations of the same training run, so behaviour stays consistent as you move up and down the line."
            mb="6"
          />
          <Columns isMultiline>
            {MODELS.map(model => (
              <Column
                key={model.name}
                sizeTablet="half"
                sizeDesktop="one-third"
                display="flex"
                flexDirection="column"
              >
                <Card flexGrow="1">
                  <Card.Content>
                    {model.featured && (
                      <Tag color="primary" mb="3">
                        Flagship
                      </Tag>
                    )}
                    <Title as="p" size="4" mb="2">
                      {model.name}
                    </Title>
                    <Paragraph textColor="grey" mb="4">
                      {model.tagline}
                    </Paragraph>
                    <IconText mb="2">
                      <Icon name="layer-group" textColor="link" aria-hidden="true" />
                      <Span textSize="7">{model.context} context</Span>
                    </IconText>
                    <IconText mb="2">
                      <Icon name="gauge-high" textColor="link" aria-hidden="true" />
                      <Span textSize="7">{model.speed}</Span>
                    </IconText>
                    <IconText mb="4">
                      <Icon name="tag" textColor="link" aria-hidden="true" />
                      <Span textSize="7">{model.price}</Span>
                    </IconText>
                    <Paragraph textSize="7" textColor="grey" mb="0">
                      <Strong textSize="7">Best for:</Strong> {model.best}
                    </Paragraph>
                  </Card.Content>
                </Card>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <SectionHeading
            eyebrow="Customers"
            title="Teams that moved and measured"
            mb="6"
          />
          <Columns isMultiline>
            {QUOTES.map(quote => (
              <Column
                key={quote.author}
                sizeTablet="half"
                sizeDesktop="one-third"
                display="flex"
                flexDirection="column"
              >
                <Box flexGrow="1" display="flex" flexDirection="column">
                  <Icon name="quote-left" textColor="primary" mb="3" aria-hidden="true" />
                  <Paragraph mb="5" flexGrow="1">
                    {quote.body}
                  </Paragraph>
                  <Media>
                    <Media.Left>
                      <Avatar name={quote.initials} size="48x48" color="primary" />
                    </Media.Left>
                    <Media.Content>
                      <Paragraph textWeight="semibold" mb="0">
                        {quote.author}
                      </Paragraph>
                      <Span textSize="7" textColor="grey">
                        {quote.role}
                      </Span>
                    </Media.Content>
                  </Media>
                </Box>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Notification color="primary" p="6">
            <Columns isVCentered>
              <Column sizeDesktop={8}>
                <Title size="3" mb="3">
                  Run your own evaluation this afternoon
                </Title>
                <Paragraph mb="0">
                  Bring your hardest internal eval set. If Skynet Ultra does not
                  cut your error rate by at least half, our solutions team will
                  tell you so in writing and send you on your way.
                </Paragraph>
              </Column>
              <Column sizeDesktop={4}>
                <Buttons>
                  <Button as="a" href={href('/contact')} color="light" size="large" isFullWidth>
                    Get an API key
                  </Button>
                </Buttons>
              </Column>
            </Columns>
          </Notification>
        </Container>
      </Section>
    </>
  );
}
