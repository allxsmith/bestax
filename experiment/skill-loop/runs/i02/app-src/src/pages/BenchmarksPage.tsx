import { useState } from 'react';
import {
  Block,
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
  Message,
  Notification,
  Paragraph,
  Section,
  Span,
  Strong,
  SubTitle,
  Table,
  Tag,
  Tabs,
  Tbody,
  Td,
  Th,
  Thead,
  Title,
  Tr,
} from '@allxsmith/bestax-bulma';
import BenchmarkBar from '../site/BenchmarkBar';
import { BENCHMARKS, type PageId } from '../site/content';

const CATEGORIES = [
  'All',
  ...Array.from(new Set(BENCHMARKS.map(b => b.category))),
];

export default function BenchmarksPage({
  onNavigate,
}: {
  onNavigate: (page: PageId) => void;
}) {
  const [tab, setTab] = useState(0);
  const category = CATEGORIES[tab];
  const rows =
    category === 'All'
      ? BENCHMARKS
      : BENCHMARKS.filter(b => b.category === category);

  const avgSkynet =
    BENCHMARKS.reduce((sum, b) => sum + b.skynet, 0) / BENCHMARKS.length;
  const avgFable =
    BENCHMARKS.reduce((sum, b) => sum + b.fable, 0) / BENCHMARKS.length;

  return (
    <>
      <Hero size="medium" className="hero-backdrop">
        <Hero.Body>
          <Container>
            <Tag color="primary" isRounded mb="4">
              Evaluation report
            </Tag>
            <Title size="1">Skynet vs Fable, all ten benchmarks</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              One rule, applied everywhere: Skynet eliminates 90% of the errors
              the baseline still makes. That is what &ldquo;10× better&rdquo;
              means, and it is the only definition that survives a benchmark
              scoring 96%.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={3} gap={5}>
            <Cell display="flex" flexDirection="column">
              <Box flexGrow="1" textAlign="centered">
                <Title size="2" textColor="primary" mb="1">
                  10.0×
                </Title>
                <Span textSize="7" textColor="grey">
                  Error reduction, every benchmark
                </Span>
              </Box>
            </Cell>
            <Cell display="flex" flexDirection="column">
              <Box flexGrow="1" textAlign="centered">
                <Title size="2" mb="1">
                  {avgSkynet.toFixed(2)}%
                </Title>
                <Span textSize="7" textColor="grey">
                  Skynet Opus average
                </Span>
              </Box>
            </Cell>
            <Cell display="flex" flexDirection="column">
              <Box flexGrow="1" textAlign="centered">
                <Title size="2" textColor="grey" mb="1">
                  {avgFable.toFixed(2)}%
                </Title>
                <Span textSize="7" textColor="grey">
                  Fable average
                </Span>
              </Box>
            </Cell>
          </Grid>
        </Container>
      </Section>

      <Section className="band">
        <Container>
          <Title size="3" mb="4">
            Results
          </Title>

          <Tabs value={tab} onChange={setTab} boxed mb="5">
            <Tabs.List>
              {CATEGORIES.map((name, index) => (
                <Tabs.Tab key={name} index={index}>
                  {name}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>

          <Box>
            <Table isFullwidth isHoverable isResponsive>
              <Thead>
                <Tr>
                  <Th>Benchmark</Th>
                  <Th>Category</Th>
                  <Th textAlign="right">Skynet Opus</Th>
                  <Th textAlign="right">Fable</Th>
                  <Th textAlign="right">Δ</Th>
                  <Th textAlign="right">Errors remaining</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map(row => (
                  <Tr key={row.name}>
                    <Td>
                      <Strong>{row.name}</Strong>
                      <Span textSize="7" textColor="grey" display="block">
                        {row.blurb}
                      </Span>
                    </Td>
                    <Td>
                      <Tag isRounded>
                        {row.category}
                      </Tag>
                    </Td>
                    <Td textAlign="right" textWeight="bold">
                      <Span textColor="primary">{row.skynet.toFixed(2)}%</Span>
                    </Td>
                    <Td textAlign="right">
                      <Span textColor="grey">{row.fable.toFixed(2)}%</Span>
                    </Td>
                    <Td textAlign="right" textWeight="semibold">
                      +{(row.skynet - row.fable).toFixed(2)}
                    </Td>
                    <Td textAlign="right">
                      <Span textColor="grey">
                        {(100 - row.skynet).toFixed(2)}% vs{' '}
                        {(100 - row.fable).toFixed(2)}%
                      </Span>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Container>
      </Section>

      <Section>
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <Title size="3" mb="5">
                {category === 'All' ? 'Every benchmark' : category} in detail
              </Title>
              {rows.map(benchmark => (
                <Box key={benchmark.name} mb="4">
                  <BenchmarkBar benchmark={benchmark} showBlurb />
                </Box>
              ))}
            </Column>

            <Column sizeDesktop={5}>
              <Message color="info">
                <Message.Header>Methodology</Message.Header>
                <Message.Body>
                  <Content>
                    <p>
                      Every benchmark was run at temperature 0, zero-shot, with
                      no tools unless the benchmark defines them. Scores are
                      pass@1 over three seeds, reported as the mean.
                    </p>
                    <p>
                      The Skynet column is derived from the baseline by a single
                      published rule:
                    </p>
                    <pre>skynet = 100 − (100 − baseline) / 10</pre>
                    <p>
                      That is the &ldquo;10×&rdquo; in the headline — ten times
                      fewer residual errors, not ten times the score. Any
                      benchmark where that identity fails is one we would have
                      to stop publishing.
                    </p>
                  </Content>
                </Message.Body>
              </Message>

              <Notification color="warning" isLight mt="5">
                <Strong>These numbers are fabricated.</Strong> Netadyne and
                Skynet are fictional, and Fable has not been evaluated against
                anything on this page. This is template content — see the
                footer.
              </Notification>

              <Box mt="5">
                <Title size="5" mb="3">
                  Reproduce it yourself
                </Title>
                <Paragraph textColor="grey" mb="4">
                  The harness, prompts, seeds, and raw completions ship with
                  every evaluation report. Nothing here is a private eval.
                </Paragraph>
                <Buttons>
                  <Button color="primary" onClick={() => onNavigate('contact')}>
                    <Icon name="flask" aria-hidden="true" />
                    <span>Get the harness</span>
                  </Button>
                  <Button color="primary" isOutlined onClick={() => onNavigate('docs')}>
                    Read the docs
                  </Button>
                </Buttons>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section className="band">
        <Container textAlign="centered">
          <Block>
            <Title size="3">Your eval is the one that counts</Title>
            <SubTitle size="5" textColor="grey" mt="3" mb="5">
              Public benchmarks are a floor, not a promise. Bring yours.
            </SubTitle>
            <Button
              color="primary"
              size="large"
              onClick={() => onNavigate('contact')}
            >
              Request access
            </Button>
          </Block>
        </Container>
      </Section>
    </>
  );
}
