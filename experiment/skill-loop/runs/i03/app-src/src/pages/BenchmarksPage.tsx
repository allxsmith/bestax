import { useState } from 'react';
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
  Message,
  Notification,
  Section,
  Span,
  Table,
  Tabs,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { BenchmarkBar } from '../components/BenchmarkBar';
import { SectionHeading } from '../components/SectionHeading';
import { StatCard } from '../components/StatCard';
import { BENCHMARKS, errorReduction } from '../site/content';

const AVERAGE_SKYNET =
  BENCHMARKS.reduce((sum, b) => sum + b.skynet, 0) / BENCHMARKS.length;
const AVERAGE_FABLE =
  BENCHMARKS.reduce((sum, b) => sum + b.fable, 0) / BENCHMARKS.length;

export function BenchmarksPage() {
  const [view, setView] = useState(0);

  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              as="h1"
              align="left"
              eyebrow="Evaluation"
              title="Fourteen benchmarks. One ratio."
              lede="Skynet Ultra against Fable, measured with the same harness, the same prompts, and the same decoding parameters."
            />
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={4} gap={4}>
            <Cell display="flex" flexDirection="column">
              <StatCard
                label="Average score, Skynet Ultra"
                value={AVERAGE_SKYNET.toFixed(1)}
                icon="arrow-trend-up"
                flexGrow="1"
              />
            </Cell>
            <Cell display="flex" flexDirection="column">
              <StatCard
                label="Average score, Fable"
                value={AVERAGE_FABLE.toFixed(1)}
                icon="minus"
                color="info"
                flexGrow="1"
              />
            </Cell>
            <Cell display="flex" flexDirection="column">
              <StatCard
                label="Residual error reduction"
                value="10x"
                icon="chart-line"
                flexGrow="1"
              />
            </Cell>
            <Cell display="flex" flexDirection="column">
              <StatCard
                label="Benchmarks led"
                value="14 / 14"
                icon="trophy"
                flexGrow="1"
              />
            </Cell>
          </Grid>
        </Container>
      </Section>

      <Section>
        <Container>
          <Message color="primary">
            <Message.Header>How to read "10x better"</Message.Header>
            <Message.Body>
              Headline scores compress as a benchmark saturates: going from 96 to
              99.6 on MATH-500 looks like four points, but it is four fifths of
              the remaining mistakes. So we report{' '}
              <strong>residual error</strong> — the share of items a model gets
              wrong. On every benchmark below, Skynet Ultra's residual error is
              one tenth of Fable's. On MATH-500 that is 4.0% against 0.4%; on
              Terminal-Bench it is 42.0% against 4.2%. Same ratio, very
              different headline gaps.
            </Message.Body>
          </Message>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Results"
            title="The full suite"
            lede="Every benchmark in the Skynet 1.0 evaluation card."
            mb="5"
          />

          <Tabs value={view} onChange={setView} align="centered" toggle>
            <Tabs.List>
              <Tabs.Tab index={0} icon="table">
                Table
              </Tabs.Tab>
              <Tabs.Tab index={1} icon="chart-simple">
                Bars
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {view === 0 ? (
            <Box p="0">
              <Table isFullwidth isHoverable isStriped isResponsive>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Benchmark</Table.Th>
                    <Table.Th>Domain</Table.Th>
                    <Table.Th>Metric</Table.Th>
                    <Table.Th textAlign="right">Skynet Ultra</Table.Th>
                    <Table.Th textAlign="right">Fable</Table.Th>
                    <Table.Th textAlign="right">Error reduction</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {BENCHMARKS.map(benchmark => (
                    <Table.Tr key={benchmark.name}>
                      <Table.Th textWeight="semibold">
                        {benchmark.name}
                      </Table.Th>
                      <Table.Td>
                        <Span textColor="grey">{benchmark.domain}</Span>
                      </Table.Td>
                      <Table.Td>
                        <Span textColor="grey">{benchmark.metric}</Span>
                      </Table.Td>
                      <Table.Td textAlign="right" textWeight="bold">
                        <Span textColor="primary" textWeight="bold">
                          {benchmark.skynet.toFixed(1)}
                        </Span>
                      </Table.Td>
                      <Table.Td textAlign="right">
                        <Span textColor="grey">
                          {benchmark.fable.toFixed(1)}
                        </Span>
                      </Table.Td>
                      <Table.Td textAlign="right">
                        <Tag color="primary" isRounded>
                          {errorReduction(benchmark)}x
                        </Tag>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          ) : (
            <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={5}>
              {BENCHMARKS.map(benchmark => (
                <Cell key={benchmark.name} display="flex" flexDirection="column">
                  <BenchmarkBar benchmark={benchmark} flexGrow="1" />
                </Cell>
              ))}
            </Grid>
          )}
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <Title as="h2" size="3" mb="4">
                Methodology
              </Title>
              <Content>
                <p>
                  Both models were evaluated through their public APIs in the
                  same week, at temperature 0, with identical prompts and no
                  provider-specific scaffolding. Where a benchmark defines a
                  reference harness, we used it unmodified; where it does not,
                  ours is published alongside the results.
                </p>
                <ul>
                  <li>
                    <strong>No cherry-picking.</strong> Every benchmark on the
                    Skynet 1.0 evaluation card appears above. There is no
                    fifteenth one we left out.
                  </li>
                  <li>
                    <strong>No best-of-n.</strong> Single sample per item unless
                    the benchmark's own protocol specifies otherwise.
                  </li>
                  <li>
                    <strong>Decontaminated.</strong> Training data was filtered
                    against every test set with 13-gram overlap detection; the
                    filter list ships with the model card.
                  </li>
                  <li>
                    <strong>Per-item traces.</strong> Every prompt, completion,
                    and grade is downloadable, including the ones we lost.
                  </li>
                </ul>
              </Content>
            </Column>
            <Column sizeDesktop={5}>
              <Notification color="warning" isLight>
                <Title as="h3" size="6" mb="2">
                  Illustrative data
                </Title>
                <Span display="block" mb="3">
                  Netadyne and Skynet are fictional. The scores on this page are
                  invented sample content for a demo site — no evaluation was
                  run, and the comparison figures for Fable are not measured
                  results.
                </Span>
              </Notification>
              <Box p="5" mt="4">
                <Title as="h3" size="5" mb="3">
                  Reproduce it
                </Title>
                <Span display="block" textColor="grey" mb="4">
                  The harness runs against your own key and writes a diff against
                  our published numbers.
                </Span>
                <Buttons>
                  <Button as="a" href="#/platform" color="primary">
                    Get the harness
                  </Button>
                  <Button as="a" href="#/contact">
                    Ask a question
                  </Button>
                </Buttons>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
