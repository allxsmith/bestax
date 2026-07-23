import {
  Hero,
  Section,
  Container,
  Columns,
  Column,
  Grid,
  Cell,
  Card,
  Box,
  Table,
  Title,
  Paragraph,
  Span,
  Strong,
  Tag,
  Icon,
  IconText,
  Button,
  Buttons,
  Pre,
  Code,
  Divider,
  Steps,
  Link,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { MODELS } from '../data';
import { href } from '../routes';

const CURL = `curl https://api.netadyne.ai/v1/messages \\
  -H "x-api-key: $NETADYNE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "skynet-ultra",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Summarise this 900-page filing." }
    ]
  }'`;

const SDKS = [
  { icon: 'js', label: 'TypeScript', pkg: '@netadyne/sdk' },
  { icon: 'python', label: 'Python', pkg: 'netadyne' },
  { icon: 'java', label: 'Java', pkg: 'ai.netadyne:sdk' },
  { icon: 'golang', label: 'Go', pkg: 'netadyne-go' },
];

const CAPABILITIES = [
  ['Context window', '10M', '2M', '512K'],
  ['Output tokens, max', '128K', '64K', '16K'],
  ['Sustained throughput', '2,400 tok/s', '3,800 tok/s', '9,100 tok/s'],
  ['Vision and video', 'Yes', 'Yes', 'Images only'],
  ['Parallel tool calls', 'Up to 64', 'Up to 32', 'Up to 8'],
  ['Prompt caching', 'Yes', 'Yes', 'Yes'],
  ['Batch API', 'Yes', 'Yes', 'Yes'],
  ['Knowledge cutoff', 'Mar 2026', 'Mar 2026', 'Mar 2026'],
];

export function Models() {
  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              align="left"
              size="1"
              eyebrow="The model line"
              title="Ultra, Pro and Mini"
              subtitle="One training run, three distillations. Prompts that work on Mini work on Ultra — you are buying more capability, not a different personality."
            />
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Columns isMultiline>
            {MODELS.map(model => (
              <Column
                key={model.name}
                sizeTablet="half"
                sizeDesktop="one-third"
                display="flex"
                flexDirection="column"
              >
                <Card flexGrow="1">
                  <Card.Content>
                    <Tag color={model.featured ? 'primary' : undefined} mb="3">
                      {model.featured ? 'Flagship' : 'Available now'}
                    </Tag>
                    <Title as="p" size="4" mb="2">
                      {model.name}
                    </Title>
                    <Paragraph textColor="grey" mb="4">
                      {model.tagline}
                    </Paragraph>
                    <Divider />
                    <IconText mb="2">
                      <Icon name="layer-group" textColor="link" aria-hidden="true" />
                      <Span textSize="7">{model.context} context</Span>
                    </IconText>
                    <IconText mb="2">
                      <Icon name="gauge-high" textColor="link" aria-hidden="true" />
                      <Span textSize="7">{model.speed}</Span>
                    </IconText>
                    <IconText mb="4">
                      <Icon name="tag" textColor="link" aria-hidden="true" />
                      <Span textSize="7">{model.price}</Span>
                    </IconText>
                    <Paragraph textSize="7" textColor="grey" mb="0">
                      <Strong textSize="7">Best for:</Strong> {model.best}
                    </Paragraph>
                  </Card.Content>
                  <Card.Footer>
                    <Card.FooterItem>
                      <Link href={href('/contact')}>
                        Start with {model.name.split(' ')[1]}
                      </Link>
                    </Card.FooterItem>
                  </Card.Footer>
                </Card>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Specifications"
            title="What each model can do"
            mb="6"
          />
          <Box p="0">
            <Table isFullwidth isHoverable isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Capability</Table.Th>
                  <Table.Th textAlign="right">Ultra</Table.Th>
                  <Table.Th textAlign="right">Pro</Table.Th>
                  <Table.Th textAlign="right">Mini</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {CAPABILITIES.map(([label, ultra, pro, mini]) => (
                  <Table.Tr key={label}>
                    <Table.Td textWeight="semibold">{label}</Table.Td>
                    <Table.Td textAlign="right">{ultra}</Table.Td>
                    <Table.Td textAlign="right">{pro}</Table.Td>
                    <Table.Td textAlign="right">{mini}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={5}>
              <SectionHeading
                align="left"
                eyebrow="Quickstart"
                title="From zero to a first token"
                subtitle="Three steps, no onboarding call, no waitlist. Keys are issued instantly and scoped per workspace."
                mb="5"
              />
              <Steps color="primary" mb="5">
                <Steps.Step isCompleted label="Create a key" />
                <Steps.Step isCompleted label="Pick a model" />
                <Steps.Step isActive label="Send a request" />
              </Steps>
              <Buttons>
                <Button as="a" href={href('/contact')} color="primary">
                  Get an API key
                </Button>
              </Buttons>
            </Column>
            <Column sizeDesktop={7}>
              <Box p="5">
                <IconText mb="2" textColor="grey">
                  <Icon name="terminal" aria-hidden="true" />
                  <Span textSize="7" textTransform="uppercase" textWeight="semibold">
                    First request
                  </Span>
                </IconText>
                <Divider />
                <Pre textSize="7">
                  <Code>{CURL}</Code>
                </Pre>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="SDKs"
            title="First-party clients for the stacks you run"
            mb="6"
          />
          <Grid isFixed fixedColsMobile={2} fixedColsTablet={4} gap={4}>
            {SDKS.map(sdk => (
              <Cell key={sdk.label} display="flex" flexDirection="column">
                <Box flexGrow="1" textAlign="centered" p="5">
                  <Icon
                    name={sdk.icon}
                    variant="brands"
                    size="large"
                    textColor="primary"
                    mb="3"
                    aria-hidden="true"
                  />
                  <Title as="p" size="5" mb="2">
                    {sdk.label}
                  </Title>
                  <Code>{sdk.pkg}</Code>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>
    </>
  );
}
