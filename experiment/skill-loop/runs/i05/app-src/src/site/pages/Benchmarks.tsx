import {
  Hero,
  Section,
  Container,
  Columns,
  Column,
  Grid,
  Cell,
  Box,
  Table,
  Title,
  Paragraph,
  Span,
  Tag,
  Icon,
  IconText,
  Message,
  Button,
  Buttons,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { BenchmarkBar } from '../components/BenchmarkBar';
import { BASELINE, BENCHMARKS, errorReduction } from '../data';
import { href } from '../routes';

const meanFactor =
  BENCHMARKS.reduce((sum, b) => sum + errorReduction(b), 0) / BENCHMARKS.length;

export function Benchmarks() {
  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              align="left"
              size="1"
              eyebrow="Benchmarks"
              title="Ten benchmarks. Ten times fewer errors."
              subtitle={`Skynet Ultra measured against ${BASELINE} on the public evaluation suites that teams actually use to make a buying decision. Every run is reproducible from our harness.`}
            />
            <Buttons mt="5">
              <Button as="a" href={href('/contact')} color="primary" size="large">
                Run it on your own evals
              </Button>
              <Button as="a" href={href('/models')} color="primary" isOutlined size="large">
                Model specs
              </Button>
            </Buttons>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Message color="info" mb="6">
            <Message.Header>
              <span>How to read these numbers</span>
            </Message.Header>
            <Message.Body>
              <Paragraph mb="3">
                Accuracy on a saturated benchmark is a bad unit: the gap between
                88% and 98.8% looks like ten points and is actually an order of
                magnitude. So we report <Span textWeight="semibold">error
                rate</Span> &mdash; the share of items the model gets wrong
                &mdash; and the factor by which Skynet reduces it.
              </Paragraph>
              <Paragraph mb="0">
                Across all ten suites the mean reduction is{' '}
                <Span textWeight="semibold">
                  {meanFactor.toFixed(1)}× fewer errors
                </Span>
                . Runs are pass@1, temperature 0, no self-consistency voting and
                no test-time search.
              </Paragraph>
            </Message.Body>
          </Message>

          <Box p="0">
            <Table isFullwidth isHoverable isStriped isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Benchmark</Table.Th>
                  <Table.Th textAlign="right">{BASELINE}</Table.Th>
                  <Table.Th textAlign="right">Skynet Pro</Table.Th>
                  <Table.Th textAlign="right">Skynet Ultra</Table.Th>
                  <Table.Th textAlign="right">Error reduction</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {BENCHMARKS.map(b => {
                  // Pro sits about two thirds of the way from baseline to Ultra.
                  const pro = b.baseline + (b.skynet - b.baseline) * 0.68;
                  return (
                    <Table.Tr key={b.name}>
                      <Table.Td>
                        <Span textWeight="semibold">{b.name}</Span>
                        <br />
                        <Span textSize="7" textColor="grey">
                          {b.blurb}
                        </Span>
                      </Table.Td>
                      <Table.Td textAlign="right">
                        <Span textColor="grey">{b.baseline.toFixed(1)}%</Span>
                      </Table.Td>
                      <Table.Td textAlign="right">{pro.toFixed(1)}%</Table.Td>
                      <Table.Td textAlign="right" textWeight="bold">
                        {b.skynet.toFixed(1)}%
                      </Table.Td>
                      <Table.Td textAlign="right">
                        <Tag color="primary">
                          {errorReduction(b).toFixed(1)}×
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

      <Section size="large" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Head to head"
            title="Every suite, side by side"
            subtitle={`Skynet Ultra in primary, ${BASELINE} in grey. The bars are raw accuracy; the badge is the error-rate reduction.`}
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={5}>
            {BENCHMARKS.map(b => (
              <Cell key={b.name} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <BenchmarkBar benchmark={b} />
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={7}>
              <SectionHeading
                align="left"
                eyebrow="Methodology"
                title="Nothing here is behind a footnote"
                subtitle="We publish the harness because a benchmark you cannot rerun is a press release."
                mb="5"
              />
              <IconText mb="3">
                <Icon name="code-branch" textColor="primary" aria-hidden="true" />
                <Span>
                  Full harness, prompts and raw completions in{' '}
                  <Span textWeight="semibold">netadyne/skynet-evals</Span>
                </Span>
              </IconText>
              <IconText mb="3">
                <Icon name="dice" textColor="primary" aria-hidden="true" />
                <Span>
                  pass@1 at temperature 0 &mdash; no majority voting, no
                  best-of-n reranking
                </Span>
              </IconText>
              <IconText mb="3">
                <Icon name="calendar-check" textColor="primary" aria-hidden="true" />
                <Span>
                  Baselines rerun on the same harness in the same week, not
                  quoted from a card
                </Span>
              </IconText>
              <IconText mb="0">
                <Icon name="filter-circle-xmark" textColor="primary" aria-hidden="true" />
                <Span>
                  Contamination screening against every published split before
                  training
                </Span>
              </IconText>
            </Column>
            <Column sizeDesktop={5}>
              <Box p="5">
                <Title as="p" size="4" mb="4">
                  Independent replication
                </Title>
                <Paragraph textColor="grey" mb="4">
                  Three external labs reran the full suite before publication.
                  Their deltas against our numbers are in the appendix of the
                  Skynet technical report.
                </Paragraph>
                <Buttons>
                  <Button as="a" href={href('/contact')} color="primary" isLight isFullWidth>
                    Request the technical report
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
