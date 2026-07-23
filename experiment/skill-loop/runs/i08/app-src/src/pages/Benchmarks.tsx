import { useState } from 'react';
import {
  Box,
  Cell,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Hero,
  Message,
  Notification,
  Paragraph,
  Section,
  Span,
  Strong,
  SubTitle,
  Table,
  Tabs,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { BenchmarkBar } from '../components/BenchmarkBar';
import { BENCHMARKS, errorReduction } from '../data/site';

export function Benchmarks() {
  const [tab, setTab] = useState(0);

  const meanReduction =
    BENCHMARKS.reduce((sum, b) => sum + errorReduction(b), 0) /
    BENCHMARKS.length;

  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <Title size="1">Benchmarks</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              Eight suites, one harness, one claim: Skynet makes a tenth of the
              errors Fable makes. Mean residual-error ratio across the set is{' '}
              <Strong textColor="primary">
                {meanReduction.toFixed(1)}x
              </Strong>
              .
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Notification color="info" isLight>
            <Strong>How to read this page.</Strong> Scores are accuracy out of
            100 under identical prompts, temperature 0, and three-run majority
            vote. The ratio column is residual error —{' '}
            <Span textWeight="semibold">(100 − Fable) ÷ (100 − Skynet)</Span> —
            because an accuracy score near the ceiling cannot meaningfully
            multiply.
          </Notification>
        </Container>
      </Section>

      <Section>
        <Container>
          <Tabs value={tab} onChange={setTab} boxed size="medium">
            <Tabs.List>
              <Tabs.Tab index={0}>Table</Tabs.Tab>
              <Tabs.Tab index={1}>Charts</Tabs.Tab>
              <Tabs.Tab index={2}>Methodology</Tabs.Tab>
            </Tabs.List>

            <Tabs.Content>
              <Tabs.Content.Item index={0}>
                <Table isFullwidth isHoverable isStriped isResponsive mt="4">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Suite</Table.Th>
                      <Table.Th>Domain</Table.Th>
                      <Table.Th textAlign="right">Skynet</Table.Th>
                      <Table.Th textAlign="right">Fable</Table.Th>
                      <Table.Th textAlign="right">Error ratio</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {BENCHMARKS.map(b => (
                      <Table.Tr key={b.id}>
                        <Table.Td textWeight="semibold">{b.id}</Table.Td>
                        <Table.Td>
                          <Span textColor="grey">{b.domain}</Span>
                        </Table.Td>
                        <Table.Td textAlign="right" textWeight="semibold">
                          <Span textColor="primary">
                            {b.skynet.toFixed(1)}
                          </Span>
                        </Table.Td>
                        <Table.Td textAlign="right">
                          <Span textColor="grey">{b.fable.toFixed(1)}</Span>
                        </Table.Td>
                        <Table.Td textAlign="right">
                          <Tag color="primary" isRounded>
                            {errorReduction(b).toFixed(1)}x
                          </Tag>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                  <Table.Tfoot>
                    <Table.Tr>
                      <Table.Th>Mean</Table.Th>
                      <Table.Th />
                      <Table.Th textAlign="right">
                        {(
                          BENCHMARKS.reduce((s, b) => s + b.skynet, 0) /
                          BENCHMARKS.length
                        ).toFixed(1)}
                      </Table.Th>
                      <Table.Th textAlign="right">
                        {(
                          BENCHMARKS.reduce((s, b) => s + b.fable, 0) /
                          BENCHMARKS.length
                        ).toFixed(1)}
                      </Table.Th>
                      <Table.Th textAlign="right">
                        {meanReduction.toFixed(1)}x
                      </Table.Th>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
              </Tabs.Content.Item>

              <Tabs.Content.Item index={1}>
                <Grid
                  isFixed
                  fixedColsMobile={1}
                  fixedColsTablet={2}
                  gap={5}
                  mt="4"
                >
                  {BENCHMARKS.map(b => (
                    <Cell key={b.id} display="flex" flexDirection="column">
                      <Box flexGrow="1" p="5">
                        <BenchmarkBar benchmark={b} />
                      </Box>
                    </Cell>
                  ))}
                </Grid>
              </Tabs.Content.Item>

              <Tabs.Content.Item index={2}>
                <Columns mt="4">
                  <Column sizeDesktop={7}>
                    <Content>
                      <h3>Harness</h3>
                      <p>
                        Every suite runs through the open{' '}
                        <code>netadyne-eval</code> harness at temperature 0 with
                        a three-run majority vote and a fixed system prompt. No
                        per-model prompt tuning, no retrieval augmentation, no
                        tool access except on HELM-Ops where tools are the
                        subject of the test.
                      </p>
                      <h3>Scoring</h3>
                      <p>
                        Items are graded by exact match where the answer format
                        allows it, and by a rubric grader with human spot-checks
                        on 10% of items where it does not. Grader agreement with
                        the human sample is 97.4%.
                      </p>
                      <h3>Contamination</h3>
                      <p>
                        Each suite is regenerated quarterly from held-out source
                        material published after the training cutoff of the
                        newest model in the comparison. Prior-quarter items are
                        retained only as a drift check.
                      </p>
                      <h3>Reproducing it</h3>
                      <p>
                        The harness, the item manifests, and the raw per-item
                        transcripts for both models are published with each
                        release. A full replication takes roughly nine GPU-hours
                        against the public API.
                      </p>
                    </Content>
                  </Column>
                  <Column sizeDesktop={5}>
                    <Message color="warning" title="Caveats we will not bury">
                      <Content>
                        <p>
                          Ratios this large are only meaningful near the
                          accuracy ceiling. On suites where both models score
                          below 60, the ratio compresses toward 1 and we do not
                          report it.
                        </p>
                        <p>
                          Latency figures are measured from Netadyne's us-east
                          region and will differ elsewhere.
                        </p>
                        <p>
                          Skynet Mini, on the Explore tier, is a distilled model
                          and does not reach these numbers.
                        </p>
                      </Content>
                    </Message>
                  </Column>
                </Columns>
              </Tabs.Content.Item>
            </Tabs.Content>
          </Tabs>
        </Container>
      </Section>

      <Section>
        <Container>
          <Paragraph textColor="grey" textSize="7" textAlign="centered">
            Suite names, scores, and methodology on this page are fictional
            demo content.
          </Paragraph>
        </Container>
      </Section>
    </>
  );
}
