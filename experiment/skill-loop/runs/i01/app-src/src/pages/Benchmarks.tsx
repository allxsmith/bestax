import {
  Block,
  Box,
  Button,
  Column,
  Columns,
  Container,
  Content,
  IconText,
  Message,
  Notification,
  Progress,
  Section,
  Table,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHead } from '../components/SectionHead';
import { BENCHMARKS, tenXBetter, type PageId } from '../data/site';

interface BenchmarksProps {
  onNavigate: (page: PageId) => void;
}

const errorRate = (score: number) => 100 - score;

export function Benchmarks({ onNavigate }: BenchmarksProps) {
  return (
    <>
      <Section size="medium">
        <Container>
          <SectionHead
            eyebrow="Evaluations"
            title="Skynet Nova vs. the frontier"
            subtitle="Every number below is a zero-shot run on the public harness, scored by the reference grader. The column that matters is the last one: how much of the remaining error disappears."
          />

          <Notification color="warning" isLight mb="5">
            <IconText
              iconProps={{ name: 'circle-info', 'aria-hidden': 'true' }}
              textWeight="semibold"
            >
              Demo content
            </IconText>
            <Content mt="2" mb="0">
              <p>
                Netadyne and Skynet are fictional and this table is invented
                sample data, including the Fable column. Nothing here was
                measured.
              </p>
            </Content>
          </Notification>

          <Box>
            <Table isFullwidth isHoverable isStriped isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Benchmark</Table.Th>
                  <Table.Th>Domain</Table.Th>
                  <Table.Th className="has-text-right">Skynet Nova</Table.Th>
                  <Table.Th className="has-text-right">Fable</Table.Th>
                  <Table.Th className="has-text-right">
                    Best open model
                  </Table.Th>
                  <Table.Th className="has-text-right">
                    Error rate vs. Fable
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {BENCHMARKS.map(bench => {
                  const skynet = tenXBetter(bench.fable);
                  return (
                    <Table.Tr key={bench.name}>
                      <Table.Td>
                        <span className="has-text-weight-semibold">
                          {bench.name}
                        </span>
                        <br />
                        <span className="is-size-7 has-text-grey">
                          {bench.blurb}
                        </span>
                      </Table.Td>
                      <Table.Td>
                        <Tag color="primary">
                          {bench.domain}
                        </Tag>
                      </Table.Td>
                      <Table.Td className="has-text-right">
                        <span className="has-text-weight-bold has-text-primary">
                          {skynet.toFixed(1)}%
                        </span>
                      </Table.Td>
                      <Table.Td className="has-text-right">
                        {bench.fable.toFixed(1)}%
                      </Table.Td>
                      <Table.Td className="has-text-right has-text-grey">
                        {bench.openModel.toFixed(1)}%
                      </Table.Td>
                      <Table.Td className="has-text-right">
                        <Tag color="success">
                          {(
                            errorRate(bench.fable) / errorRate(skynet)
                          ).toFixed(1)}
                          x lower
                        </Tag>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>
        </Container>
      </Section>

      {/* Error-rate visual */}
      <Section size="medium" className="section-alt">
        <Container>
          <SectionHead
            eyebrow="Error rate"
            title="The same table, drawn as what is left over"
            subtitle="Shorter is better. Each pair shows the share of questions each model still gets wrong."
          />

          <Columns isMultiline>
            {BENCHMARKS.map(bench => {
              const skynetError = errorRate(tenXBetter(bench.fable));
              const fableError = errorRate(bench.fable);
              return (
                <Column
                  key={bench.name}
                  sizeTablet={6}
                  display="flex"
                  flexDirection="column"
                >
                  <Box flexGrow="1">
                    <Title size="5" as="h3" mb="4">
                      {bench.name}
                    </Title>

                    <Columns isMobile isVCentered mb="1">
                      <Column sizeMobile={4}>
                        <Content textSize="7" mb="0" textWeight="semibold">
                          <p>Skynet Nova</p>
                        </Content>
                      </Column>
                      <Column>
                        <Progress
                          color="primary"
                          value={skynetError}
                          max={fableError}
                          size="small"
                        />
                      </Column>
                      <Column isNarrow>
                        <Content textSize="7" mb="0" textColor="primary">
                          <p className="has-text-weight-bold">
                            {skynetError.toFixed(1)}%
                          </p>
                        </Content>
                      </Column>
                    </Columns>

                    <Columns isMobile isVCentered>
                      <Column sizeMobile={4}>
                        <Content textSize="7" mb="0" textColor="grey">
                          <p>Fable</p>
                        </Content>
                      </Column>
                      <Column>
                        <Progress
                          color="grey"
                          value={fableError}
                          max={fableError}
                          size="small"
                        />
                      </Column>
                      <Column isNarrow>
                        <Content textSize="7" mb="0" textColor="grey">
                          <p>{fableError.toFixed(1)}%</p>
                        </Content>
                      </Column>
                    </Columns>
                  </Box>
                </Column>
              );
            })}
          </Columns>
        </Container>
      </Section>

      {/* Methodology */}
      <Section size="medium">
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <SectionHead
                align="left"
                eyebrow="Methodology"
                title="Reproduce every number"
              />
              <Content>
                <p>
                  We publish the harness before we publish the score. Each row
                  above is pinned to a commit in{' '}
                  <code>netadyne/skynet-evals</code> that contains the exact
                  prompts, sampling parameters, tool definitions and grader.
                </p>
                <ul>
                  <li>
                    <strong>Zero-shot, no ensembling.</strong> No majority
                    voting, no best-of-n, no per-benchmark prompt tuning.
                  </li>
                  <li>
                    <strong>Temperature 0.</strong> Sampling parameters are
                    identical across every model in the comparison.
                  </li>
                  <li>
                    <strong>Held-out contamination checks.</strong> Every
                    benchmark is re-run against a paraphrased variant; a gap
                    above 1.5 points fails the release.
                  </li>
                  <li>
                    <strong>Third-party audit.</strong> An independent lab
                    re-runs the suite before each launch and publishes its own
                    numbers alongside ours.
                  </li>
                </ul>
              </Content>
              <Button color="primary" mt="4" onClick={() => onNavigate('docs')}>
                <IconText iconProps={{ name: 'code-branch', 'aria-hidden': 'true' }}>
                  Get the eval harness
                </IconText>
              </Button>
            </Column>

            <Column sizeDesktop={5}>
              <Message color="primary">
                <Message.Header>
                  <p>Where Skynet still loses</p>
                </Message.Header>
                <Message.Body>
                  <Content>
                    <p>
                      Nova is behind the best specialised systems on
                      long-horizon robotics control and on formal proof search
                      beyond 40 steps. It also trails a dedicated retrieval
                      stack on freshness-sensitive questions, because it will
                      not guess at facts past its cutoff.
                    </p>
                    <p>
                      We publish the losses on the same cadence as the wins.
                    </p>
                  </Content>
                </Message.Body>
              </Message>

              <Block mt="5">
                <Box>
                  <IconText
                    iconProps={{ name: 'scale-balanced', 'aria-hidden': 'true' }}
                    textColor="primary"
                    textWeight="semibold"
                    mb="3"
                  >
                    Scoring note
                  </IconText>
                  <Content textSize="7" textColor="grey">
                    <p>
                      "10x lower error" is the ratio of incorrect answers, not
                      the ratio of scores. A model that scores 89% has an 11%
                      error rate; at 98.9% that error rate is 1.1%. We think
                      that ratio is the only honest way to talk about progress
                      once benchmarks saturate above 80%.
                    </p>
                  </Content>
                </Box>
              </Block>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
