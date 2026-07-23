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
  Media,
  Notification,
  Progress,
  Section,
  SubTitle,
  Tag,
  Tags,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHead } from '../components/SectionHead';
import { CodeSample } from '../components/CodeSample';
import {
  BENCHMARKS,
  FEATURES,
  LOGOS,
  QUOTES,
  STATS,
  USE_CASES,
  tenXBetter,
  type PageId,
} from '../data/site';

const QUICKSTART = [
  {
    label: 'Python',
    icon: 'file-code',
    code: `from netadyne import Skynet

client = Skynet(api_key=os.environ["NETADYNE_API_KEY"])

response = client.messages.create(
    model="skynet-nova",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "Refactor this service to stream. Open a PR.",
    }],
    tools=[repo_tool, shell_tool],
)

print(response.content[0].text)`,
  },
  {
    label: 'TypeScript',
    icon: 'code',
    code: `import Skynet from '@netadyne/skynet';

const client = new Skynet({ apiKey: process.env.NETADYNE_API_KEY });

const response = await client.messages.create({
  model: 'skynet-nova',
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: 'Refactor this service to stream. Open a PR.',
  }],
  tools: [repoTool, shellTool],
});

console.log(response.content[0].text);`,
  },
  {
    label: 'cURL',
    icon: 'terminal',
    code: `curl https://api.netadyne.ai/v1/messages \\
  -H "x-api-key: $NETADYNE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "skynet-nova",
    "max_tokens": 4096,
    "messages": [
      { "role": "user", "content": "Explain the diff in one paragraph." }
    ]
  }'`,
  },
];

// Headline benchmarks for the home page teaser; the full table lives on /benchmarks.
const TEASER = BENCHMARKS.slice(0, 4);

interface HomeProps {
  onNavigate: (page: PageId) => void;
}

export function Home({ onNavigate }: HomeProps) {
  return (
    <>
      {/* Fixed-color surface: content colors are pinned and both CTAs are
          filled, so the hero stays legible whatever the OS scheme does. */}
      <Hero size="large" className="hero-skynet">
        <Hero.Body>
          <Container>
            <Columns isVCentered>
              <Column sizeDesktop={7}>
                <Tag color="light" isRounded mb="4" textWeight="semibold">
                  Skynet Nova is now generally available
                </Tag>
                <Title size="1" textColor="white" isSpaced>
                  Ten times fewer errors than Fable. On every benchmark.
                </Title>
                <SubTitle size="4" textColor="light">
                  Skynet is Netadyne's frontier model family. Same evals,
                  same harnesses, a tenth of the mistakes — with a 4M-token
                  context and sub-300ms first token, served on our own
                  inference fabric.
                </SubTitle>
                <Buttons mt="5">
                  <Button
                    color="light"
                    size="large"
                    onClick={() => onNavigate('contact')}
                  >
                    <IconText
                      iconProps={{ name: 'key', 'aria-hidden': 'true' }}
                    >
                      Get API access
                    </IconText>
                  </Button>
                  <Button
                    color="primary"
                    isInverted
                    size="large"
                    onClick={() => onNavigate('benchmarks')}
                  >
                    <IconText
                      iconProps={{ name: 'chart-column', 'aria-hidden': 'true' }}
                    >
                      See the benchmarks
                    </IconText>
                  </Button>
                </Buttons>
                <Block mt="5">
                  <IconText
                    iconProps={{ name: 'circle-check', 'aria-hidden': 'true' }}
                    textColor="light"
                  >
                    Free tier, no card. Migrate with a base URL change.
                  </IconText>
                </Block>
              </Column>

              <Column sizeDesktop={5}>
                <Box>
                  <IconText
                    iconProps={{ name: 'terminal', 'aria-hidden': 'true' }}
                    textColor="primary"
                    textWeight="semibold"
                    mb="4"
                  >
                    Two minutes to first token
                  </IconText>
                  <Content textSize="7" fontFamily="code">
                    <p className="mb-2">$ pip install netadyne</p>
                    <p className="mb-2">
                      $ export NETADYNE_API_KEY=sk-nd-…
                    </p>
                    <p className="mb-2">$ skynet run "port this to Rust"</p>
                  </Content>
                  <Progress color="primary" value={100} max={100} size="small" />
                  <Content textSize="7" textColor="grey" mt="3">
                    <p>
                      12 files read · 4 edits · suite green · PR #4192 opened
                    </p>
                  </Content>
                </Box>
              </Column>
            </Columns>
          </Container>
        </Hero.Body>
      </Hero>

      {/* Stat bar */}
      <Section size="medium">
        <Container>
          <Columns isMultiline textAlign="centered">
            {STATS.map(stat => (
              <Column key={stat.label} sizeMobile={6} sizeTablet={3}>
                <Title size="1" textColor="primary" mb="2">
                  {stat.value}
                </Title>
                <Content textColor="grey" textSize="6">
                  <p>{stat.label}</p>
                </Content>
              </Column>
            ))}
          </Columns>

          <Block mt="6" textAlign="centered">
            <Content textColor="grey" textSize="7" textTransform="uppercase">
              <p>Running in production at</p>
            </Content>
            <Columns isCentered isMultiline isMobile mt="3">
              {LOGOS.map(logo => (
                <Column key={logo} isNarrow>
                  <Title
                    size="5"
                    as="p"
                    textColor="grey-light"
                    textWeight="bold"
                    px="3"
                  >
                    {logo}
                  </Title>
                </Column>
              ))}
            </Columns>
          </Block>
        </Container>
      </Section>

      {/* Benchmark teaser */}
      <Section size="medium" className="section-alt">
        <Container>
          <SectionHead
            eyebrow="Benchmarks"
            title="The gap, measured the honest way"
            subtitle="A benchmark score of 89% hides the part that matters: the 11% it gets wrong. Skynet Nova removes nine tenths of that remaining error — on every eval we publish."
          />

          <Columns isMultiline>
            {TEASER.map(bench => {
              const skynet = tenXBetter(bench.fable);
              return (
                <Column
                  key={bench.name}
                  sizeTablet={6}
                  sizeDesktop={3}
                  display="flex"
                  flexDirection="column"
                >
                  <Box flexGrow="1">
                    <Tags mb="3">
                      <Tag color="primary">
                        {bench.domain}
                      </Tag>
                    </Tags>
                    <Title size="5" as="h3" mb="4">
                      {bench.name}
                    </Title>

                    <Content textSize="7" textColor="grey" mb="1">
                      <p>Skynet Nova</p>
                    </Content>
                    <Title size="3" textColor="primary" mb="2">
                      {skynet.toFixed(1)}%
                    </Title>
                    <Progress
                      color="primary"
                      value={skynet}
                      max={100}
                      size="small"
                    />

                    <Content textSize="7" textColor="grey" mb="1" mt="4">
                      <p>Fable</p>
                    </Content>
                    <Title size="5" textColor="grey" mb="2">
                      {bench.fable.toFixed(1)}%
                    </Title>
                    <Progress
                      color="grey"
                      value={bench.fable}
                      max={100}
                      size="small"
                    />

                    <Tag color="success" mt="4">
                      10x lower error
                    </Tag>
                  </Box>
                </Column>
              );
            })}
          </Columns>

          <Block textAlign="centered" mt="5">
            <Button color="primary" isOutlined onClick={() => onNavigate('benchmarks')}>
              <IconText iconProps={{ name: 'table', 'aria-hidden': 'true' }}>
                See all {BENCHMARKS.length} benchmarks
              </IconText>
            </Button>
          </Block>
        </Container>
      </Section>

      {/* Features */}
      <Section size="medium">
        <Container>
          <SectionHead
            eyebrow="Why Skynet"
            title="Frontier quality is table stakes. Shipping it is the product."
            subtitle="Netadyne builds the model, the serving stack and the tooling together, so the thing you evaluate is the thing you deploy."
          />

          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={5}>
            {FEATURES.map(feature => (
              <Cell key={feature.title} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <Icon
                      name={feature.icon}
                      size="large"
                      features="fa-2x"
                      textColor="primary"
                      aria-hidden="true"
                      mb="3"
                    />
                    <Title size="5" as="h3">
                      {feature.title}
                    </Title>
                    <Content textColor="grey">
                      <p>{feature.body}</p>
                    </Content>
                  </Card.Content>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Quickstart */}
      <Section size="medium" className="section-alt">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={5}>
              <SectionHead
                align="left"
                eyebrow="Developers"
                title="Two lines to switch. One SDK to learn."
                subtitle="The Skynet API accepts OpenAI- and Anthropic-shaped requests, including streaming, tool calls and structured output. Most teams migrate a production workload in an afternoon."
              />
              <Buttons>
                <Button color="primary" onClick={() => onNavigate('docs')}>
                  <IconText iconProps={{ name: 'book', 'aria-hidden': 'true' }}>
                    Read the docs
                  </IconText>
                </Button>
                <Button color="ghost" onClick={() => onNavigate('models')}>
                  Compare models
                </Button>
              </Buttons>
            </Column>
            <Column sizeDesktop={7}>
              <CodeSample tabs={QUICKSTART} />
            </Column>
          </Columns>
        </Container>
      </Section>

      {/* Use cases */}
      <Section size="medium">
        <Container>
          <SectionHead
            eyebrow="Use cases"
            title="Where the error rate actually shows up"
          />
          <Columns>
            {USE_CASES.map(useCase => (
              <Column
                key={useCase.title}
                display="flex"
                flexDirection="column"
              >
                <Box flexGrow="1">
                  <Icon
                    name={useCase.icon}
                    size="large"
                    features="fa-2x"
                    textColor="primary"
                    aria-hidden="true"
                    mb="3"
                  />
                  <Title size="4" as="h3">
                    {useCase.title}
                  </Title>
                  <Content textColor="grey">
                    <p>{useCase.body}</p>
                  </Content>
                  <Title size="2" textColor="primary" mb="1" mt="5">
                    {useCase.metric}
                  </Title>
                  <Content textSize="7" textColor="grey">
                    <p>{useCase.metricLabel}</p>
                  </Content>
                </Box>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      {/* Quotes */}
      <Section size="medium" className="section-alt">
        <Container>
          <SectionHead eyebrow="Customers" title="What changed for them" />
          <Columns isMultiline>
            {QUOTES.map(quote => (
              <Column
                key={quote.name}
                sizeTablet={12}
                sizeDesktop={4}
                display="flex"
                flexDirection="column"
              >
                <Box flexGrow="1">
                  <Icon
                    name="quote-left"
                    textColor="primary"
                    aria-hidden="true"
                    mb="3"
                  />
                  <Content>
                    <p>{quote.body}</p>
                  </Content>
                  <Media mt="5">
                    <Media.Left>
                      <Tag color="primary" size="large" isRounded>
                        {quote.initials}
                      </Tag>
                    </Media.Left>
                    <Media.Content>
                      <Content textSize="7" mb="0">
                        <p className="has-text-weight-semibold">{quote.name}</p>
                        <p className="has-text-grey">{quote.role}</p>
                      </Content>
                    </Media.Content>
                  </Media>
                </Box>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      {/* Safety note + CTA */}
      <Section size="medium">
        <Container>
          <Notification color="info" isLight mb="6">
            <IconText
              iconProps={{ name: 'shield-halved', 'aria-hidden': 'true' }}
              textWeight="semibold"
            >
              Deployed under the Netadyne Responsible Scaling Framework
            </IconText>
            <Content mt="3" mb="0">
              <p>
                Skynet Nova ships with published model cards, red-team results
                and a standing external audit. Capability thresholds, refusal
                behaviour and the escalation path are documented before launch,
                not after.
              </p>
            </Content>
          </Notification>

          <Box textAlign="centered" p="6" className="cta-skynet">
            <Title size="2" textColor="white">
              Run your own evals. That is the whole pitch.
            </Title>
            <SubTitle size="5" textColor="light">
              Free tier, no card, and the harness for every number on this site
              is public.
            </SubTitle>
            <Buttons isCentered mt="5">
              <Button
                color="light"
                size="large"
                onClick={() => onNavigate('contact')}
              >
                Get API access
              </Button>
              <Button
                color="primary"
                isInverted
                size="large"
                onClick={() => onNavigate('pricing')}
              >
                See pricing
              </Button>
            </Buttons>
          </Box>
        </Container>
      </Section>
    </>
  );
}
