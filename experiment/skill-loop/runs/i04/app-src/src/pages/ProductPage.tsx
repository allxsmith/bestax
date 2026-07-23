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
  Title,
  SubTitle,
  Content,
  Button,
  Buttons,
  Icon,
  IconText,
  Tag,
  Table,
  Steps,
  Block,
  Span,
  Paragraph,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { FEATURES, MODELS, SURFACES } from '../data/content';
import { useRouter } from '../router';

const PIPELINE = [
  {
    title: 'Goal',
    body: 'You state an outcome, not a prompt chain. Skynet asks for what it is missing, once.',
  },
  {
    title: 'Plan graph',
    body: 'The goal decomposes into a dependency graph of steps with explicit success criteria.',
  },
  {
    title: 'Parallel execution',
    body: 'Up to 500 tool calls per turn fan out across the graph; failures re-plan their own branch.',
  },
  {
    title: 'Signed trace',
    body: 'Every step, token, and policy check lands in a replayable, tamper-evident log.',
  },
];

export function ProductPage() {
  const { navigate } = useRouter();

  return (
    <>
      <Hero color="primary" size="medium" className="hero-wash">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="1">Skynet-1</Title>
            <SubTitle size="4" mt="4">
              A planner with a frontier language model attached. Give it an
              outcome and a set of tools; come back when it is done.
            </SubTitle>
            <Buttons isCentered mt="5">
              <Button
                color="light"
                size="large"
                onClick={() => navigate('waitlist')}
              >
                Get an API key
              </Button>
              <Button
                color="primary"
                isInverted
                size="large"
                onClick={() => navigate('docs')}
              >
                Read the docs
              </Button>
            </Buttons>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="How it works"
            title="Four stages, one request"
            lead="No orchestration framework, no scratchpad prompt engineering, no glue code holding a chain together."
          />
          <Steps color="link" hasMarker showStepNumbers mb="6">
            {PIPELINE.map((step, index) => (
              <Steps.Step
                key={step.title}
                label={step.title}
                stepNumber={index + 1}
                isCompleted={index < PIPELINE.length - 1}
                isActive={index === PIPELINE.length - 1}
              >
                <Content textColor="grey">{step.body}</Content>
              </Steps.Step>
            ))}
          </Steps>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Capabilities"
            title="What you get out of the box"
          />
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={3}
            gap={5}
          >
            {FEATURES.map(feature => (
              <Cell key={feature.title} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <IconText mb="3">
                      <Icon
                        name={feature.icon}
                        size="medium"
                        textColor="link"
                        aria-hidden="true"
                      />
                    </IconText>
                    <Title size="5" mb="3">
                      {feature.title}
                    </Title>
                    <Content textColor="grey">{feature.body}</Content>
                  </Card.Content>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Surfaces"
            title="Three ways to run it"
            lead="Same weights, same evals, same policy engine — pick the shape that fits the workload."
          />
          <Columns>
            {SURFACES.map(surface => (
              <Column
                key={surface.title}
                display="flex"
                flexDirection="column"
              >
                <Box flexGrow="1">
                  <Icon
                    name={surface.icon}
                    size="large"
                    textColor="link"
                    mb="3"
                    aria-hidden="true"
                  />
                  <Title size="4" mb="3">
                    {surface.title}
                  </Title>
                  <Content textColor="grey">{surface.body}</Content>
                </Box>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="The line-up"
            title="Four models, one API"
            lead="Route by cost or capability; every model shares the same tool protocol and trace format."
          />
          <Table isFullwidth isHoverable isResponsive>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Model</Table.Th>
                <Table.Th>Class</Table.Th>
                <Table.Th textAlign="right">Context</Table.Th>
                <Table.Th>Best for</Table.Th>
                <Table.Th textAlign="right">Price</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {MODELS.map(model => (
                <Table.Tr key={model.name}>
                  <Table.Td textWeight="semibold">{model.name}</Table.Td>
                  <Table.Td>
                    <Tag color="link" isRounded>
                      {model.params}
                    </Tag>
                  </Table.Td>
                  <Table.Td textAlign="right">{model.context}</Table.Td>
                  <Table.Td>
                    <Span textColor="grey">{model.best}</Span>
                  </Table.Td>
                  <Table.Td textAlign="right" textWeight="semibold">
                    {model.price}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Box p="6" bgColor="primary" textAlign="centered">
            <Title size="3" textColor="white">
              Point your base URL at Netadyne
            </Title>
            <Paragraph textColor="white" mt="3">
              Keep your tool schemas, keep your streaming code. Change the key
              and the model string.
            </Paragraph>
            <Buttons isCentered mt="5">
              <Button color="light" onClick={() => navigate('docs')}>
                Migration guide
              </Button>
              <Button
                color="primary"
                isInverted
                onClick={() => navigate('pricing')}
              >
                See pricing
              </Button>
            </Buttons>
          </Box>
          <Block textAlign="centered" mt="5">
            <Span textSize="7" textColor="grey">
              Skynet Edge weights are free to download and run offline.
            </Span>
          </Block>
        </Container>
      </Section>
    </>
  );
}
