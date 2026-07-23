import {
  Hero,
  Section,
  Container,
  Columns,
  Column,
  Grid,
  Cell,
  Box,
  Title,
  SubTitle,
  Content,
  Table,
  Tag,
  Progress,
  Message,
  Button,
  Buttons,
  Icon,
  Block,
  Span,
  Paragraph,
  Strong,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { StatCard } from '../components/StatCard';
import {
  BENCHMARKS,
  COMPETITOR,
  DISCLAIMER,
  TENX_CLAIMS,
} from '../data/content';
import { useRouter } from '../router';

export function BenchmarksPage() {
  const { navigate } = useRouter();

  return (
    <>
      <Hero color="primary" size="medium" className="hero-wash">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="1">The receipts</Title>
            <SubTitle size="4" mt="4">
              Every suite we run, both models, one harness. Skynet-1 Pro against{' '}
              {COMPETITOR} — no cherry-picked subsets, no best-of-n.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Scored evals"
            title="Suite-by-suite results"
            lead="Pass rate on the full suite, single attempt, temperature 0, no tools beyond what the suite defines."
          />

          <Table isFullwidth isHoverable isStriped isResponsive>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Suite</Table.Th>
                <Table.Th>What it measures</Table.Th>
                <Table.Th textAlign="right">Skynet-1 Pro</Table.Th>
                <Table.Th textAlign="right">{COMPETITOR}</Table.Th>
                <Table.Th textAlign="right">Remaining error</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {BENCHMARKS.map(row => (
                <Table.Tr key={row.suite}>
                  <Table.Td textWeight="semibold">{row.suite}</Table.Td>
                  <Table.Td>
                    <Span textColor="grey">{row.what}</Span>
                  </Table.Td>
                  <Table.Td textAlign="right">
                    <Span textColor="link" textWeight="bold">
                      {row.skynet.toFixed(1)}%
                    </Span>
                  </Table.Td>
                  <Table.Td textAlign="right">
                    <Span textColor="grey">{row.competitor.toFixed(1)}%</Span>
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

          <Message color="info" mt="6">
            <Message.Header>Why not a 10× score?</Message.Header>
            <Message.Body>
              A capped 0–100 eval cannot show a 10× lead: 91% has nowhere to go
              but 100%. So on scored suites we report the collapse in{' '}
              <Strong>remaining error</Strong> — the failures a model still
              makes. Going from 9% failures to 0.9% is the same tenfold
              improvement, stated honestly.
            </Message.Body>
          </Message>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Uncapped axes"
            title="Where the multiple is literal"
            lead="Throughput, context, cost, and autonomy have no ceiling — so here the 10× is the measurement, not a reframing."
          />
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={3}
            gap={5}
          >
            {TENX_CLAIMS.map(claim => (
              <Cell key={claim.label} display="flex" flexDirection="column">
                <StatCard
                  icon={claim.icon}
                  value={claim.skynet}
                  label={claim.label}
                  detail={`${COMPETITOR}: ${claim.competitor}`}
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
            eyebrow="Head to head"
            title="Pass rate, visualized"
            lead="Same data as the table above, if bars land better than digits."
          />
          {BENCHMARKS.map(row => (
            <Box key={row.suite} mb="4">
              <Block
                display="flex"
                justifyContent="space-between"
                alignItems="baseline"
                mb="3"
              >
                <Title as="p" size="6" mb="0">
                  {row.suite}
                </Title>
                <Span textSize="7" textColor="grey">
                  {row.what}
                </Span>
              </Block>

              <Block mb="3">
                <Span textSize="7" textWeight="semibold">
                  Skynet-1 Pro — {row.skynet.toFixed(1)}%
                </Span>
                <Progress color="link" value={row.skynet} max={100} mt="2" />
              </Block>

              <Block mb="0">
                <Span textSize="7" textColor="grey">
                  {COMPETITOR} — {row.competitor.toFixed(1)}%
                </Span>
                <Progress
                  color="grey-light"
                  value={row.competitor}
                  max={100}
                  mt="2"
                />
              </Block>
            </Box>
          ))}
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <Columns gap={6}>
            <Column sizeDesktop={7}>
              <SectionHeading
                align="left"
                eyebrow="Methodology"
                title="How we ran it"
                mb="5"
              />
              <Content>
                <ul>
                  <li>
                    Single attempt per task, temperature 0, no self-consistency
                    and no best-of-n reranking.
                  </li>
                  <li>
                    Identical system prompts and identical tool schemas for both
                    models; only the model string changes.
                  </li>
                  <li>
                    Contamination screen: every task is checked against a
                    13-gram overlap filter over the pretraining corpus, and
                    flagged tasks are dropped before scoring.
                  </li>
                  <li>
                    Held-out variants of each suite are regenerated quarterly by
                    an independent team that does not train models.
                  </li>
                  <li>
                    The harness, prompts, and per-task logs ship with each
                    release so anyone can rerun the whole thing.
                  </li>
                </ul>
              </Content>
              <Buttons mt="5">
                <Button color="primary" onClick={() => navigate('docs')}>
                  <Icon name="download" mr="2" aria-hidden="true" />
                  Get the eval harness
                </Button>
                <Button color="text" onClick={() => navigate('company')}>
                  Read the model card
                </Button>
              </Buttons>
            </Column>

            <Column sizeDesktop={5}>
              <Box>
                <Title size="5" mb="4">
                  Run configuration
                </Title>
                <Table isFullwidth isNarrow>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Th>Harness</Table.Th>
                      <Table.Td textAlign="right">netadyne-evals 4.2</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Attempts</Table.Th>
                      <Table.Td textAlign="right">1 (pass@1)</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Temperature</Table.Th>
                      <Table.Td textAlign="right">0.0</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Max context</Table.Th>
                      <Table.Td textAlign="right">10,000,000 tokens</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Hardware</Table.Th>
                      <Table.Td textAlign="right">8× ND-400 per replica</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Scored by</Table.Th>
                      <Table.Td textAlign="right">Suite-native grader</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Box>
            </Column>
          </Columns>

          <Paragraph textAlign="centered" textSize="7" textColor="grey" mt="6">
            {DISCLAIMER}
          </Paragraph>
        </Container>
      </Section>
    </>
  );
}
