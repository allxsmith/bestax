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
  Content,
  Button,
  Buttons,
  Icon,
  IconText,
  Tag,
  Tags,
  Table,
  Avatar,
  Media,
  Block,
  Span,
  Paragraph,
  Strong,
  Pre,
  Reveal,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { StatCard } from '../components/StatCard';
import {
  BENCHMARKS,
  COMPETITOR,
  DISCLAIMER,
  FEATURES,
  QUOTES,
  TENX_CLAIMS,
} from '../data/content';
import { useRouter } from '../router';

const SNIPPET = `import Skynet from "@netadyne/skynet";

const skynet = new Skynet({ apiKey: process.env.NETADYNE_API_KEY });

const run = await skynet.agents.create({
  model: "skynet-1-pro",
  goal: "Cut p99 checkout latency below 200ms.",
  tools: [repo, metrics, deploy],
  horizon: "40h",
  approvals: { onDeploy: "require-human" },
});

for await (const step of run.stream()) {
  console.log(step.plan.summary, step.tokens, step.policy.checks);
}`;

export function HomePage() {
  const { navigate } = useRouter();

  return (
    <>
      <Hero color="primary" size="large" className="hero-wash">
        <Hero.Body>
          <Container textAlign="centered">
            <Tags justifyContent="center" mb="5">
              <Tag color="dark" isRounded>
                Skynet-1 is generally available
              </Tag>
              <Tag color="light" isRounded>
                10M context
              </Tag>
            </Tags>
            <Title size="1">Ten times the model.</Title>
            <SubTitle size="3" mt="4">
              Skynet-1 outperforms {COMPETITOR} by 10× on every axis where a
              multiple means something — throughput, context, cost, autonomy,
              and mistakes it doesn&apos;t make.
            </SubTitle>
            <Buttons isCentered mt="6">
              <Button
                color="light"
                size="large"
                onClick={() => navigate('waitlist')}
              >
                <Icon name="key" mr="2" aria-hidden="true" />
                Get an API key
              </Button>
              <Button
                color="primary"
                isInverted
                size="large"
                onClick={() => navigate('benchmarks')}
              >
                See the benchmarks
              </Button>
            </Buttons>
            <Paragraph mt="5" textSize="7">
              Free to start · No card required · Migrate with a base-URL change
            </Paragraph>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="The 10× claim, itemized"
            title={`Where Skynet-1 beats ${COMPETITOR} tenfold`}
            lead="Scores on capped evals can't be 10× anything. These axes can — so this is where we put the number."
          />
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={3}
            gap={5}
          >
            {TENX_CLAIMS.map((claim, index) => (
              <Cell key={claim.label} display="flex" flexDirection="column">
                <Reveal
                  animation="fade-up"
                  delay={index * 60}
                  display="flex"
                  flexDirection="column"
                  flexGrow="1"
                >
                  <StatCard
                    icon={claim.icon}
                    value={claim.skynet}
                    label={claim.label}
                    detail={`${COMPETITOR}: ${claim.competitor} · ${claim.multiple}`}
                    flexGrow="1"
                  />
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
            title="Evals, side by side"
            lead={`Seven public suites. Skynet-1 Pro against ${COMPETITOR}, same prompts, same harness.`}
          />
          <Box p="0" hasShadow={false}>
            <Table isFullwidth isHoverable isStriped isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Suite</Table.Th>
                  <Table.Th textAlign="right">Skynet-1 Pro</Table.Th>
                  <Table.Th textAlign="right">{COMPETITOR}</Table.Th>
                  <Table.Th textAlign="right">Remaining error</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {BENCHMARKS.slice(0, 5).map(row => (
                  <Table.Tr key={row.suite}>
                    <Table.Td>
                      <Strong>{row.suite}</Strong>
                      <br />
                      <Span textSize="7" textColor="grey">
                        {row.what}
                      </Span>
                    </Table.Td>
                    <Table.Td textAlign="right" textWeight="bold">
                      <Span textColor="link">{row.skynet.toFixed(1)}%</Span>
                    </Table.Td>
                    <Table.Td textAlign="right">
                      <Span textColor="grey">
                        {row.competitor.toFixed(1)}%
                      </Span>
                    </Table.Td>
                    <Table.Td textAlign="right">
                      <Tag color="success" isRounded>
                        {row.errorReduction}
                      </Tag>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
          <Block textAlign="centered" mt="5">
            <Button color="link" isOutlined onClick={() => navigate('benchmarks')}>
              Full results and methodology
              <Icon name="arrow-right" ml="2" aria-hidden="true" />
            </Button>
          </Block>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Capabilities"
            title="Built to finish the job"
            lead="Skynet is a planner with a language model attached, not the other way around."
          />
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={3}
            gap={5}
          >
            {FEATURES.map(feature => (
              <Cell key={feature.title} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <IconText mb="3">
                      <Icon
                        name={feature.icon}
                        size="medium"
                        textColor="link"
                        aria-hidden="true"
                      />
                    </IconText>
                    <Title size="5" mb="3">
                      {feature.title}
                    </Title>
                    <Content textColor="grey">{feature.body}</Content>
                  </Card.Content>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <Columns isVCentered gap={6}>
            <Column sizeDesktop={5}>
              <SectionHeading
                align="left"
                eyebrow="Developers"
                title="Nine lines to an autonomous run"
                lead="Skynet speaks an OpenAI-shaped request body. Point your base URL at us and keep your tool schemas."
                mb="5"
              />
              <Content>
                <ul>
                  <li>Streaming plan graph, not just tokens</li>
                  <li>500 parallel tool calls per turn</li>
                  <li>Durable state across a 40-hour horizon</li>
                  <li>Signed, replayable traces on every run</li>
                </ul>
              </Content>
              <Buttons mt="5">
                <Button color="primary" onClick={() => navigate('docs')}>
                  Read the quickstart
                </Button>
                <Button color="text" onClick={() => navigate('product')}>
                  Explore the product
                </Button>
              </Buttons>
            </Column>
            <Column sizeDesktop={7}>
              <Box p="0">
                <Pre textSize="7" p="5" radius="radiusless">
                  {SNIPPET}
                </Pre>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Customers"
            title="Teams that stopped babysitting their agents"
          />
          <Columns>
            {QUOTES.map(quote => (
              <Column key={quote.name} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <Icon
                      name="quote-left"
                      size="medium"
                      textColor="link"
                      mb="3"
                      aria-hidden="true"
                    />
                    <Content>{quote.quote}</Content>
                    <Media mt="5">
                      <Media.Left>
                        <Avatar
                          name={quote.name}
                          initials={quote.initials}
                          size="48x48"
                        />
                      </Media.Left>
                      <Media.Content>
                        <Paragraph textWeight="semibold" mb="0">
                          {quote.name}
                        </Paragraph>
                        <Span textSize="7" textColor="grey">
                          {quote.role}
                        </Span>
                      </Media.Content>
                    </Media>
                  </Card.Content>
                </Card>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <Box p="6" textAlign="centered" bgColor="primary">
            <Title size="2" textColor="white">
              Ship the 10× model this afternoon
            </Title>
            <SubTitle size="5" textColor="white" mt="3">
              5M free tokens, then $0.30 per million. Cancel by deleting the
              key.
            </SubTitle>
            <Buttons isCentered mt="5">
              <Button
                color="light"
                size="large"
                onClick={() => navigate('waitlist')}
              >
                Get an API key
              </Button>
              <Button
                color="primary"
                isInverted
                size="large"
                onClick={() => navigate('pricing')}
              >
                See pricing
              </Button>
            </Buttons>
          </Box>
          <Paragraph textAlign="centered" textSize="7" textColor="grey" mt="5">
            {DISCLAIMER}
          </Paragraph>
        </Container>
      </Section>
    </>
  );
}
