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
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { StatTile } from '../components/StatTile';
import { SAFETY_COMMITMENTS } from '../data/site';
import type { PageProps } from '../routes';

const HONESTY_METRICS = [
  {
    metric: 'Unsupported assertions',
    skynet: '0.4%',
    fable: '4.0%',
    note: 'Claims made without evidence in the provided context',
  },
  {
    metric: 'Correct refusal on missing data',
    skynet: '99.1%',
    fable: '91.0%',
    note: 'Says "I do not know" when the answer is genuinely absent',
  },
  {
    metric: 'Calibration error',
    skynet: '0.9%',
    fable: '9.0%',
    note: 'Gap between stated confidence and measured accuracy',
  },
  {
    metric: 'Jailbreak resistance',
    skynet: '99.6%',
    fable: '96.0%',
    note: 'Held under a standing external red-team suite',
  },
];

const TIERS = [
  {
    tier: 'Tier 1',
    title: 'Internal only',
    body: 'Checkpoint stays inside the research cluster. No external access of any kind.',
  },
  {
    tier: 'Tier 2',
    title: 'Red team access',
    body: 'Three contracted external groups get pre-release access with publication rights.',
  },
  {
    tier: 'Tier 3',
    title: 'Limited deployment',
    body: 'Released to design partners with usage logging and a defined rollback trigger.',
  },
  {
    tier: 'Tier 4',
    title: 'General availability',
    body: 'Public API, published model card, standing monitoring against threshold regressions.',
  },
];

export function Safety({ onNavigate }: PageProps) {
  return (
    <>
      <Hero className="hero-wash">
        <Hero.Body>
          <Container>
            <Tag color="primary" isRounded mb="4">
              Safety and governance
            </Tag>
            <Title size="1" mb="4">
              A model that is wrong less often should also say so more often.
            </Title>
            <SubTitle size="4" textColor="grey" mb="0">
              Capability without honesty is a liability. Netadyne measures both
              on the same cadence and publishes both in the same model card.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={5}>
            {SAFETY_COMMITMENTS.map(item => (
              <Cell key={item.title} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <Icon
                    name={item.icon}
                    size="large"
                    textColor="primary"
                    aria-hidden="true"
                  />
                  <Title size="5" mt="3" mb="2">
                    {item.title}
                  </Title>
                  <Paragraph mb="0">
                    <Span textColor="grey">{item.body}</Span>
                  </Paragraph>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Honesty metrics"
            title="The numbers we would rather not publish"
            subtitle="Reported next to capability scores, on every release, whether or not they improved."
            mb="5"
          />
          <Box>
            <Table isStriped isHoverable isFullwidth>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Metric</Table.Th>
                  <Table.Th textAlign="right">Skynet Ultra</Table.Th>
                  <Table.Th textAlign="right">Fable</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {HONESTY_METRICS.map(row => (
                  <Table.Tr key={row.metric}>
                    <Table.Td>
                      <Strong>{row.metric}</Strong>
                      <br />
                      <Span textSize="7" textColor="grey">
                        {row.note}
                      </Span>
                    </Table.Td>
                    <Table.Td textAlign="right" textWeight="semibold">
                      <Span textColor="primary">{row.skynet}</Span>
                    </Table.Td>
                    <Table.Td textAlign="right">
                      <Span textColor="grey">{row.fable}</Span>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Release policy"
            title="Four tiers, one gate"
            subtitle="A checkpoint moves up a tier only after it clears the thresholds for the tier above."
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} fixedColsDesktop={4} gap={5}>
            {TIERS.map(tier => (
              <Cell key={tier.tier} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <Tag color="primary" isRounded mb="3">
                    {tier.tier}
                  </Tag>
                  <Title size="6" mb="2">
                    {tier.title}
                  </Title>
                  <Paragraph mb="0">
                    <Span textSize="7" textColor="grey">
                      {tier.body}
                    </Span>
                  </Paragraph>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section className="section-alt">
        <Container>
          <Columns>
            <Column sizeDesktop={4}>
              <StatTile
                centered={false}
                value="20%"
                label="Of research staff on interpretability"
                hint="And that work gates deployment decisions"
                mb="5"
              />
              <StatTile
                centered={false}
                value="3"
                label="Independent red teams"
                hint="With the right to publish without our approval"
              />
            </Column>
            <Column sizeDesktop={8}>
              <Box>
                <Title size="4" mb="3">
                  Compliance and data handling
                </Title>
                <Content>
                  <ul>
                    <li>
                      <Strong>No training on customer traffic.</Strong> API
                      inputs and outputs are never used to train Skynet, on any
                      plan, including the free tier.
                    </li>
                    <li>
                      <Strong>Zero data retention</Strong> by default on Scale
                      and Enterprise, and on request for Team.
                    </li>
                    <li>
                      SOC 2 Type II, ISO 27001, ISO 42001, HIPAA and FedRAMP
                      High, with reports available under NDA.
                    </li>
                    <li>
                      Regional data residency across 14 regions; EU and UK
                      traffic can be pinned to in-region inference.
                    </li>
                    <li>
                      Published incident history, including the two Skynet
                      behaviour regressions we rolled back in 2026.
                    </li>
                  </ul>
                </Content>
                <Buttons mt="4">
                  <Button color="primary" onClick={() => onNavigate('contact')}>
                    <Icon name="shield-check" aria-hidden="true" />
                    <Span>Request the model card</Span>
                  </Button>
                  <Button onClick={() => onNavigate('benchmarks')}>
                    <Span>See capability results</Span>
                  </Button>
                </Buttons>
              </Box>
              <Notification color="info" isLight mt="5" mb="0">
                <Strong>About this site.</Strong> Netadyne and Skynet are
                fictional and exist only to demonstrate a component library.
                Every figure here — including the comparisons to Fable, which is
                a real model — is invented for the demo.
              </Notification>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
