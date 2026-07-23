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
  Icon,
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
import { SectionHeading } from '../components/SectionHeading';
import { StatTile } from '../components/StatTile';
import { BenchmarkBar } from '../components/BenchmarkBar';
import { BENCHMARKS, BENCHMARK_CATEGORIES, errorMultiple } from '../data/site';
import type { PageProps } from '../routes';

const FILTERS = ['All', ...BENCHMARK_CATEGORIES];

export function Benchmarks({ onNavigate }: PageProps) {
  const [filter, setFilter] = useState(0);
  const active = FILTERS[filter];
  const rows =
    active === 'All'
      ? BENCHMARKS
      : BENCHMARKS.filter(b => b.category === active);

  return (
    <>
      <Hero className="hero-wash">
        <Hero.Body>
          <Container>
            <Tag color="primary" isRounded mb="4">
              Evaluation report — Skynet 3
            </Tag>
            <Title size="1" mb="4">
              Every benchmark. One tenth the errors.
            </Title>
            <SubTitle size="4" textColor="grey" mb="0">
              Ten public evaluations, run head to head against Fable on the same
              harness, the same prompts and the same single-attempt budget.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Columns>
            <Column sizeDesktop={4}>
              <StatTile
                centered={false}
                value="10 / 10"
                label="Benchmarks where Skynet leads"
                hint="Out of ten published evaluations"
              />
            </Column>
            <Column sizeDesktop={4}>
              <StatTile
                centered={false}
                value="10×"
                label="Median residual-error reduction"
                hint="And the minimum, and the maximum"
              />
            </Column>
            <Column sizeDesktop={4}>
              <StatTile
                centered={false}
                value="+49.5"
                label="Largest raw-score gain"
                hint="Frontier Exam (HLE): 45.0% → 94.5%"
              />
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section pt="0">
        <Container>
          <Box>
            <Tabs
              value={filter}
              onChange={setFilter}
              align="left"
              size="medium"
              mb="5"
            >
              <Tabs.List>
                {FILTERS.map((name, index) => (
                  <Tabs.Tab key={name} index={index}>
                    {name}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>

            <Table isStriped isHoverable isFullwidth>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Benchmark</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th textAlign="right">Skynet Ultra</Table.Th>
                  <Table.Th textAlign="right">Fable</Table.Th>
                  <Table.Th textAlign="right">Residual error</Table.Th>
                  <Table.Th textAlign="right">Improvement</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map(b => (
                  <Table.Tr key={b.id}>
                    <Table.Td>
                      <Strong>{b.name}</Strong>
                      <br />
                      <Span textSize="7" textColor="grey">
                        {b.blurb}
                      </Span>
                    </Table.Td>
                    <Table.Td>
                      <Tag>{b.category}</Tag>
                    </Table.Td>
                    <Table.Td textAlign="right" textWeight="semibold">
                      <Span textColor="primary">{b.skynet.toFixed(1)}%</Span>
                    </Table.Td>
                    <Table.Td textAlign="right">
                      <Span textColor="grey">{b.fable.toFixed(1)}%</Span>
                    </Table.Td>
                    <Table.Td textAlign="right">
                      <Span textSize="7" textColor="grey">
                        {(100 - b.skynet).toFixed(1)}% vs{' '}
                        {(100 - b.fable).toFixed(1)}%
                      </Span>
                    </Table.Td>
                    <Table.Td textAlign="right">
                      <Tag color="primary" isRounded>
                        {errorMultiple(b)}×
                      </Tag>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Paragraph mt="4" mb="0">
              <Span textSize="7" textColor="grey">
                Scores are pass@1 unless the benchmark defines otherwise.
                "Residual error" is 100 minus the score — the share of items the
                model gets wrong. "Improvement" is Fable's residual error
                divided by Skynet's.
              </Span>
            </Paragraph>
          </Box>
        </Container>
      </Section>

      <Section className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Detail"
            title="Score by score"
            subtitle="The same ten results, drawn to scale."
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={6}>
            {BENCHMARKS.map(b => (
              <Cell key={b.id} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <BenchmarkBar benchmark={b} />
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section>
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <SectionHeading
                eyebrow="Methodology"
                title="How these numbers were produced"
                mb="5"
              />
              <Content>
                <ul>
                  <li>
                    Both models were run on the Netadyne open eval harness,
                    revision <Strong>3.2.1</Strong>, on the same day, from the
                    same prompt templates.
                  </li>
                  <li>
                    Single attempt, no majority voting, no best-of-n, no
                    self-consistency. Tools are provided only where the
                    benchmark specifies them.
                  </li>
                  <li>
                    Temperature 0 where the benchmark permits it; otherwise the
                    benchmark's own default, applied identically to both models.
                  </li>
                  <li>
                    Full transcripts for every item — including every Skynet
                    failure — are published with each release so third parties
                    can grade them independently.
                  </li>
                  <li>
                    Contamination checks are run against each model's training
                    cut-off before a benchmark enters the suite.
                  </li>
                </ul>
              </Content>
              <Buttons mt="4">
                <Button color="primary" onClick={() => onNavigate('docs')}>
                  <Icon name="download" aria-hidden="true" />
                  <Span>Get the eval harness</Span>
                </Button>
                <Button onClick={() => onNavigate('safety')}>
                  <Span>Read the model card</Span>
                </Button>
              </Buttons>
            </Column>

            <Column sizeDesktop={5}>
              <Notification color="warning" isLight>
                <Strong>Where Skynet still loses.</Strong> On the 1.8% of
                SWE-bench items it fails, the dominant failure mode is
                under-specified issue text rather than reasoning. We publish
                that breakdown rather than rounding it away.
              </Notification>
              <Notification color="info" isLight mb="0">
                <Strong>Illustrative figures.</Strong> This is a demonstration
                site for a fictional company. Skynet and Netadyne do not exist,
                and the scores above were constructed to make the "10×
                fewer errors" story internally consistent — they are not
                measurements of any real model.
              </Notification>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
