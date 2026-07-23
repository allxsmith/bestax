import {
  Hero,
  Section,
  Container,
  Grid,
  Cell,
  Box,
  Table,
  Title,
  SubTitle,
  Span,
  Strong,
  Tag,
  Progress,
  Message,
  Button,
  Buttons,
  Content,
} from '@allxsmith/bestax-bulma';
import { BENCHMARKS, advantage } from '../data/site';
import { StatTile } from '../components/StatTile';

const advantages = BENCHMARKS.map(advantage);
const lowest = Math.min(...advantages).toFixed(1);
const highest = Math.max(...advantages).toFixed(1);
const average = (
  advantages.reduce((sum, x) => sum + x, 0) / advantages.length
).toFixed(1);

export function BenchmarksPage() {
  return (
    <>
      <Hero className="hero-wash">
        <Hero.Body>
          <Container>
            <Tag color="primary" isRounded mb="4">
              Netadyne Eval Report · Q3 2026
            </Tag>
            <Title size="1">Every suite. Ten times over.</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              Skynet Max against Fable on the eight public suites we run, scored
              on the Netadyne Eval Index.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section className="section-alt">
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={3} gap={5}>
            <Cell>
              <StatTile
                icon="arrow-trend-up"
                value={`${average}x`}
                label="Mean advantage across all eight suites"
              />
            </Cell>
            <Cell>
              <StatTile
                icon="arrow-down-short-wide"
                value={`${lowest}x`}
                label="Narrowest margin we measured"
                color="info"
              />
            </Cell>
            <Cell>
              <StatTile
                icon="arrow-up-wide-short"
                value={`${highest}x`}
                label="Widest margin we measured"
                color="success"
              />
            </Cell>
          </Grid>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Title size="2" mb="5">
            Full results
          </Title>

          <Box>
            <Table isFullwidth isHoverable isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Suite</Table.Th>
                  <Table.Th>Domain</Table.Th>
                  <Table.Th textAlign="right">Skynet Max</Table.Th>
                  <Table.Th textAlign="right">Fable</Table.Th>
                  <Table.Th textAlign="right">Advantage</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {BENCHMARKS.map(benchmark => (
                  <Table.Tr key={benchmark.id}>
                    <Table.Th>{benchmark.name}</Table.Th>
                    <Table.Td>
                      <Span textColor="grey">{benchmark.domain}</Span>
                    </Table.Td>
                    <Table.Td textAlign="right" textWeight="semibold">
                      {benchmark.skynet}
                    </Table.Td>
                    <Table.Td textAlign="right">
                      <Span textColor="grey">{benchmark.fable}</Span>
                    </Table.Td>
                    <Table.Td textAlign="right">
                      <Tag color="primary" isRounded>
                        {advantage(benchmark)}x
                      </Tag>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr>
                  <Table.Th>Mean</Table.Th>
                  <Table.Td />
                  <Table.Td textAlign="right" textWeight="semibold">
                    {Math.round(
                      BENCHMARKS.reduce((s, b) => s + b.skynet, 0) /
                        BENCHMARKS.length
                    )}
                  </Table.Td>
                  <Table.Td textAlign="right">
                    <Span textColor="grey">
                      {Math.round(
                        BENCHMARKS.reduce((s, b) => s + b.fable, 0) /
                          BENCHMARKS.length
                      )}
                    </Span>
                  </Table.Td>
                  <Table.Td textAlign="right">
                    <Strong textColor="primary">{average}x</Strong>
                  </Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </Box>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Title size="2" mb="6">
            Suite by suite
          </Title>

          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={5}>
            {BENCHMARKS.map(benchmark => (
              <Cell key={benchmark.id} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <Span
                    display="flex"
                    alignItems="baseline"
                    justifyContent="space-between"
                    mb="1"
                  >
                    <Strong textSize="5">{benchmark.name}</Strong>
                    <Tag color="primary" isRounded>
                      {advantage(benchmark)}x
                    </Tag>
                  </Span>
                  <Span display="block" textSize="7" textColor="grey" mb="4">
                    {benchmark.domain}
                  </Span>

                  <Span display="block" mb="3">
                    <Span
                      display="flex"
                      justifyContent="space-between"
                      textSize="7"
                      mb="1"
                    >
                      <Span>Skynet Max</Span>
                      <Strong>{benchmark.skynet}</Strong>
                    </Span>
                    <Progress
                      color="primary"
                      value={benchmark.skynet}
                      max={1000}
                      aria-label={`Skynet Max on ${benchmark.name}`}
                    />
                  </Span>

                  <Span display="block">
                    <Span
                      display="flex"
                      justifyContent="space-between"
                      textSize="7"
                      mb="1"
                    >
                      <Span textColor="grey">Fable</Span>
                      <Span textColor="grey">{benchmark.fable}</Span>
                    </Span>
                    <Progress
                      value={benchmark.fable}
                      max={1000}
                      aria-label={`Fable on ${benchmark.name}`}
                    />
                  </Span>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Title size="2" mb="5">
            Methodology
          </Title>
          <Content>
            <p>
              Scores are Netadyne Eval Index points on a 0–1000 scale. The index
              weights each task by difficulty and by how many steps a model
              completes without human intervention, which is why it separates
              models that a plain accuracy percentage compresses together.
            </p>
            <p>
              Every run is a single attempt, temperature 0, no majority voting,
              no test-time search, and no suite-specific prompting. Tool-using
              suites get the same sandbox and the same 45-minute wall clock for
              both models. Raw transcripts for all 12,400 runs ship with the
              eval harness.
            </p>
          </Content>

          <Message color="warning" mt="5">
            <Message.Header>Read this before you quote the numbers</Message.Header>
            <Message.Body>
              This is a demonstration site. Netadyne and Skynet do not exist,
              the Netadyne Eval Index is not a real benchmark, and no model was
              measured to produce this table. Fable is a real model made by
              another company; nothing here describes its actual performance.
            </Message.Body>
          </Message>

          <Buttons mt="6">
            <Button color="primary" size="medium" as="a" href="#/contact">
              Request the full report
            </Button>
            <Button size="medium" as="a" href="#/models">
              Compare the models
            </Button>
          </Buttons>
        </Container>
      </Section>
    </>
  );
}
