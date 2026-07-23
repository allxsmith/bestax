import {
  Box,
  Button,
  Cell,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Message,
  Paragraph,
  Section,
  Span,
  Table,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { ScoreBar } from '../components/ScoreBar';
import { StatCard } from '../components/StatCard';
import { BENCHMARKS, skynetScore } from '../data/site';

export function Benchmarks() {
  return (
    <>
      <Section size="medium" className="hero-wash">
        <Container>
          <SectionHeading
            eyebrow="Benchmarks"
            title="Ten times fewer errors. Every row."
            subtitle="Nine public evaluations, one harness, no per-benchmark prompt tuning. Skynet 1 against Fable 5 and Meridian-4."
            as="h1"
            size="1"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={3} gap={4}>
            <Cell display="flex" flexDirection="column">
              <StatCard
                value="10.0×"
                label="Median error reduction"
                caption="Versus Fable 5, unweighted across all nine"
                icon="bullseye"
              />
            </Cell>
            <Cell display="flex" flexDirection="column">
              <StatCard
                value="9 / 9"
                label="Benchmarks won"
                caption="No benchmark where Skynet 1 trails"
                icon="trophy"
                color="success"
              />
            </Cell>
            <Cell display="flex" flexDirection="column">
              <StatCard
                value="0"
                label="Per-task prompts"
                caption="Same system prompt on every evaluation"
                icon="equals"
                color="info"
              />
            </Cell>
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Message color="info" mb="5">
            <Message.Header>Why we report error reduction</Message.Header>
            <Message.Body>
              Frontier benchmarks saturate near the top. Going from 88.0 to 98.8
              on MMLU-Pro reads like a 12% improvement, which undersells it: what
              actually changed is that the model is wrong 1.2% of the time
              instead of 12.0% — a tenth as often. Residual error, not raw score,
              is the number your users experience.
            </Message.Body>
          </Message>

          <Table isFullwidth isStriped isHoverable isResponsive>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Benchmark</Table.Th>
                <Table.Th>What it measures</Table.Th>
                <Table.Th textAlign="right">Meridian-4</Table.Th>
                <Table.Th textAlign="right">Fable 5</Table.Th>
                <Table.Th textAlign="right">Skynet 1</Table.Th>
                <Table.Th textAlign="right">Error reduction</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {BENCHMARKS.map(benchmark => (
                <Table.Tr key={benchmark.name}>
                  <Table.Td textWeight="semibold">{benchmark.name}</Table.Td>
                  <Table.Td>
                    <Span textColor="grey" textSize="7">
                      {benchmark.measures}
                    </Span>
                  </Table.Td>
                  <Table.Td textAlign="right">
                    <Span textColor="grey" fontFamily="monospace">
                      {benchmark.meridian.toFixed(1)}
                    </Span>
                  </Table.Td>
                  <Table.Td textAlign="right">
                    <Span textColor="grey" fontFamily="monospace">
                      {benchmark.fable.toFixed(1)}
                    </Span>
                  </Table.Td>
                  <Table.Td textAlign="right" textWeight="bold">
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
          <Paragraph textSize="7" textColor="grey" mt="3">
            Scores are pass@1, zero-shot, temperature 0, averaged over five runs.
            Higher is better.
          </Paragraph>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Side by side"
            title="The same numbers, drawn"
            subtitle="Each pair is one benchmark: what Fable 5 scores, and what Skynet 1 scores."
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={3} gap={5}>
            {BENCHMARKS.map(benchmark => (
              <Cell key={benchmark.name} display="flex" flexDirection="column">
                <Box flexGrow="1" p="5">
                  <Title as="h3" size="6" mb="1">
                    {benchmark.name}
                  </Title>
                  <Paragraph textSize="7" textColor="grey" mb="4">
                    {benchmark.measures}
                  </Paragraph>
                  <ScoreBar label="Fable 5" value={benchmark.fable} mb="4" />
                  <ScoreBar
                    label="Skynet 1"
                    value={skynetScore(benchmark.fable)}
                    color="primary"
                  />
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <SectionHeading
                eyebrow="Methodology"
                title="How we ran it"
                mb="4"
              />
              <Content>
                <ul>
                  <li>
                    One system prompt across all nine benchmarks. No per-task
                    scaffolds, no majority voting, no retries.
                  </li>
                  <li>
                    Temperature 0, five runs per benchmark, mean reported. Run
                    variance was under 0.4 points everywhere.
                  </li>
                  <li>
                    Competitor scores were re-run on our harness rather than
                    quoted from vendor cards, so the comparison is apples to
                    apples.
                  </li>
                  <li>
                    Full transcripts, seeds, and the harness itself are published
                    alongside the model card.
                  </li>
                </ul>
              </Content>
              <Button as="a" href="#/contact" color="primary" mt="3">
                Request the evaluation bundle
              </Button>
            </Column>

            <Column sizeDesktop={5}>
              <Message color="warning">
                <Message.Header>This is a demo site</Message.Header>
                <Message.Body>
                  Netadyne, Skynet, and Meridian-4 do not exist. Every figure on
                  this page is invented to demonstrate a marketing site built
                  with bestax-bulma — no evaluation was run against Fable or any
                  other real model, and none of these numbers should be cited.
                </Message.Body>
              </Message>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
