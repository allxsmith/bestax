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
  Paragraph,
  Span,
  Icon,
  IconText,
  Tag,
  Tags,
  Progress,
  Level,
  Message,
  Button,
  Buttons,
  Divider,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { href } from '../routes';

const PILLARS = [
  {
    icon: 'flask',
    title: 'Evaluate before we ship',
    body: 'Every candidate checkpoint runs a fixed battery of dangerous-capability evaluations. A model that trips a threshold does not ship, regardless of how it scores on capability benchmarks.',
  },
  {
    icon: 'user-shield',
    title: 'Interpretable refusals',
    body: 'When Skynet declines, the response carries a machine-readable reason code and a policy reference. You can audit them, appeal them, and tune the thresholds per workspace.',
  },
  {
    icon: 'eye-slash',
    title: 'Zero retention by default',
    body: 'API prompts and completions live in memory for the duration of the request. They are never persisted, never reviewed, and never used for training on any plan.',
  },
  {
    icon: 'scale-balanced',
    title: 'External red teams',
    body: 'Four independent groups hold standing access to pre-release checkpoints, with a contractual right to publish their findings whether or not we like them.',
  },
];

const CERTS = [
  'SOC 2 Type II',
  'ISO 27001',
  'ISO 42001',
  'HIPAA',
  'GDPR',
  'EU AI Act ready',
];

const SCORECARD = [
  { label: 'Harmful-request refusal rate', value: 99.4 },
  { label: 'Over-refusal on benign requests', value: 1.1 },
  { label: 'Jailbreak resistance (adversarial suite)', value: 97.8 },
  { label: 'Attributed citation accuracy', value: 98.9 },
];

export function Safety() {
  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              align="left"
              size="1"
              eyebrow="Safety and trust"
              title="A capable model is only useful if you can deploy it"
              subtitle="Netadyne builds Skynet to be governable. Not because a regulator asked, but because an ungovernable model never makes it past your compliance review — and a model that never ships helps no one."
            />
            <Buttons mt="5">
              <Button as="a" href={href('/contact')} color="primary" size="large">
                Request the safety report
              </Button>
              <Button as="a" href={href('/benchmarks')} color="primary" isOutlined size="large">
                See capability results
              </Button>
            </Buttons>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <SectionHeading
            eyebrow="How we work"
            title="Four commitments we can be held to"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={5}>
            {PILLARS.map(pillar => (
              <Cell key={pillar.title} display="flex" flexDirection="column">
                <Box flexGrow="1" p="5">
                  <Icon
                    name={pillar.icon}
                    size="medium"
                    textColor="primary"
                    mb="3"
                    aria-hidden="true"
                  />
                  <Title as="p" size="4" mb="3">
                    {pillar.title}
                  </Title>
                  <Paragraph textColor="grey" mb="0">
                    {pillar.body}
                  </Paragraph>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={6}>
              <SectionHeading
                align="left"
                eyebrow="Scorecard"
                title="Behaviour, measured"
                subtitle="The same discipline we apply to capability benchmarks, applied to behaviour. Lower is better on the second row."
                mb="5"
              />
              <Message color="warning">
                <Message.Body>
                  Over-refusal is a failure mode, not a safety win. We track it
                  as a defect and hold it under 1.5% on every release.
                </Message.Body>
              </Message>
            </Column>
            <Column sizeDesktop={6}>
              <Box p="5">
                {SCORECARD.map(row => (
                  <div key={row.label}>
                    <Level isMobile mb="1">
                      <Level.Left>
                        <Level.Item>
                          <Span textSize="7">{row.label}</Span>
                        </Level.Item>
                      </Level.Left>
                      <Level.Right>
                        <Level.Item>
                          <Span textSize="7" textWeight="semibold">
                            {row.value.toFixed(1)}%
                          </Span>
                        </Level.Item>
                      </Level.Right>
                    </Level>
                    <Progress
                      color="primary"
                      size="small"
                      value={row.value}
                      max={100}
                      mb="4"
                      aria-label={row.label}
                    />
                  </div>
                ))}
                <Divider />
                <Paragraph textSize="7" textColor="grey" mb="0">
                  Measured on the Skynet Ultra release candidate, March 2026.
                  Harness and prompts published alongside the capability evals.
                </Paragraph>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <SectionHeading
            eyebrow="Compliance"
            title="Paperwork your security team already accepts"
            subtitle="Audit reports, data-processing agreements and subprocessor lists are available in the trust portal without a sales call."
            mb="6"
          />
          <Tags justifyContent="center" isMultiline mb="6">
            {CERTS.map(cert => (
              <Tag key={cert} size="medium">
                {cert}
              </Tag>
            ))}
          </Tags>
          <Columns isCentered>
            <Column sizeDesktop={8}>
              <Box p="5">
                <IconText mb="3">
                  <Icon name="building-columns" textColor="primary" aria-hidden="true" />
                  <Title as="p" size="5" mb="0">
                    Deployment options
                  </Title>
                </IconText>
                <Paragraph textColor="grey" mb="4">
                  Skynet runs in Netadyne&rsquo;s multi-tenant API, in a
                  dedicated single-tenant cluster, inside your own VPC on AWS,
                  Azure or GCP, or fully air-gapped on customer hardware for
                  regulated workloads.
                </Paragraph>
                <Buttons>
                  <Button as="a" href={href('/contact')} color="primary">
                    Talk to the deployment team
                  </Button>
                  <Button as="a" href={href('/pricing')} color="primary" isLight>
                    See Enterprise plan
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
