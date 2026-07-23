import {
  Box,
  Button,
  Buttons,
  Card,
  Cell,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Hero,
  Icon,
  IconText,
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
import { MODELS } from '../data/site';
import type { PageProps } from '../routes';

const CAPABILITIES: { label: string; nano: string; core: string; ultra: string }[] =
  [
    {
      label: 'Context window',
      nano: '512K',
      core: '2M',
      ultra: '4M',
    },
    { label: 'Max output', nano: '64K', core: '256K', ultra: '512K' },
    {
      label: 'Extended reasoning',
      nano: 'Off',
      core: 'Adaptive',
      ultra: 'Unbounded',
    },
    { label: 'Vision + audio + video', nano: 'Vision', core: 'All', ultra: 'All' },
    { label: 'Tool calling', nano: 'Yes', core: 'Yes', ultra: 'Yes' },
    { label: 'Computer use', nano: 'No', core: 'Yes', ultra: 'Yes' },
    { label: 'Fine-tuning', nano: 'Yes', core: 'Yes', ultra: 'Enterprise' },
    { label: 'Knowledge cut-off', nano: 'Mar 2026', core: 'Mar 2026', ultra: 'Mar 2026' },
  ];

const DEPLOYMENTS = [
  {
    title: 'Netadyne Cloud',
    body: 'Fourteen regions, autoscaled, 99.95% uptime SLA. Data residency pinned to the region you choose.',
    icon: 'cloud-outline',
  },
  {
    title: 'Your VPC',
    body: 'Inference runs inside your account. Nothing leaves your network perimeter; we never see the traffic.',
    icon: 'shield-lock-outline',
  },
  {
    title: 'Skynet Metal',
    body: 'A rack appliance for air-gapped sites. Same weights, same evals, no outbound connection required.',
    icon: 'server-network',
  },
];

export function Models({ onNavigate }: PageProps) {
  return (
    <>
      <Hero className="hero-wash">
        <Hero.Body>
          <Container>
            <Tag color="primary" isRounded mb="4">
              The Skynet family
            </Tag>
            <Title size="1" mb="4">
              One family. Three points on the cost curve.
            </Title>
            <SubTitle size="4" textColor="grey" mb="0">
              Shared tokenizer, shared tool schema, shared safety training.
              Moving between them is a string change in your request.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsDesktop={3} gap={5}>
            {MODELS.map(model => (
              <Cell key={model.id} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Header>
                    <Card.Header.Title>
                      <Icon
                        name={model.icon}
                        textColor="primary"
                        aria-hidden="true"
                      />
                      <Span ml="2">{model.name}</Span>
                    </Card.Header.Title>
                  </Card.Header>
                  <Card.Content>
                    <Paragraph mb="4">
                      <Span textColor="grey">{model.tagline}</Span>
                    </Paragraph>
                    <Title size="4" textColor="primary" mb="1">
                      {model.inputPrice}
                      <Span textSize="6" textColor="grey">
                        {' '}
                        / 1M input tokens
                      </Span>
                    </Title>
                    <Paragraph mb="4">
                      <Span textSize="7" textColor="grey">
                        {model.outputPrice} per 1M output tokens
                      </Span>
                    </Paragraph>
                    <IconText
                      iconProps={{ name: 'database-outline', 'aria-hidden': 'true' }}
                    >
                      {model.context} context
                    </IconText>
                    <br />
                    <IconText
                      iconProps={{ name: 'lightning-bolt', 'aria-hidden': 'true' }}
                    >
                      {model.latency}
                    </IconText>
                    <br />
                    <IconText
                      iconProps={{ name: 'export-variant', 'aria-hidden': 'true' }}
                    >
                      {model.output} max output
                    </IconText>
                    <Paragraph mt="4" mb="0">
                      <Span fontFamily="code" textSize="7">
                        {model.id}
                      </Span>
                    </Paragraph>
                  </Card.Content>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Side by side"
            title="What each model can do"
            mb="5"
          />
          <Box>
            <Table isStriped isHoverable isFullwidth>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Capability</Table.Th>
                  <Table.Th textAlign="right">Nano</Table.Th>
                  <Table.Th textAlign="right">Core</Table.Th>
                  <Table.Th textAlign="right">Ultra</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {CAPABILITIES.map(row => (
                  <Table.Tr key={row.label}>
                    <Table.Td>
                      <Strong>{row.label}</Strong>
                    </Table.Td>
                    <Table.Td textAlign="right">{row.nano}</Table.Td>
                    <Table.Td textAlign="right">{row.core}</Table.Td>
                    <Table.Td textAlign="right" textWeight="semibold">
                      <Span textColor="primary">{row.ultra}</Span>
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
            centered
            eyebrow="Deployment"
            title="Run it where your data already lives"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={1} fixedColsDesktop={3} gap={5}>
            {DEPLOYMENTS.map(item => (
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
          <Columns isVCentered>
            <Column sizeDesktop={8}>
              <Title size="3" mb="2">
                Not sure which model you need?
              </Title>
              <Content>
                <p>
                  Most teams start on Core, measure, then move the cheap
                  high-volume calls down to Nano and the hardest 5% up to Ultra.
                  Our solutions engineers will do that split with you during the
                  trial.
                </p>
              </Content>
            </Column>
            <Column sizeDesktop={4}>
              <Buttons justifyContent="flex-end">
                <Button color="primary" onClick={() => onNavigate('pricing')}>
                  <Span>See pricing</Span>
                  <Icon name="arrow-right" aria-hidden="true" />
                </Button>
                <Button onClick={() => onNavigate('contact')}>
                  <Span>Talk to us</Span>
                </Button>
              </Buttons>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
