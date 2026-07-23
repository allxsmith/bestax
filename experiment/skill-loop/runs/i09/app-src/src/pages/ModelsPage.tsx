import {
  Hero,
  Section,
  Container,
  Grid,
  Cell,
  Columns,
  Column,
  Card,
  Box,
  Table,
  Title,
  SubTitle,
  Paragraph,
  Span,
  Strong,
  Button,
  Buttons,
  Tag,
  Icon,
  IconText,
  UnorderedList,
  ListItem,
  Message,
} from '@allxsmith/bestax-bulma';
import { MODELS } from '../data/site';

const DEPLOYMENTS = [
  {
    icon: 'cloud',
    name: 'Netadyne Cloud',
    body: 'Multi-region serverless inference with automatic failover. Nothing to run; usage billed per token.',
  },
  {
    icon: 'network-wired',
    name: 'Your VPC',
    body: 'The same weights inside your AWS, GCP, or Azure account. Traffic never leaves your network boundary.',
  },
  {
    icon: 'lock',
    name: 'Air-gapped',
    body: 'A sealed appliance for classified and regulated environments. Quarterly weight updates by physical media.',
  },
];

export function ModelsPage() {
  return (
    <>
      <Hero className="hero-wash">
        <Hero.Body>
          <Container>
            <Title size="1">The Skynet family</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              Three models, one API surface, one tokenizer. Move between them by
              changing a string.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={3} gap={5}>
            {MODELS.map(model => (
              <Cell key={model.id} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Header>
                    <Card.Header.Title>{model.name}</Card.Header.Title>
                    <Card.Header.Icon>
                      <Icon
                        name={model.icon}
                        textColor={model.color}
                        aria-hidden="true"
                      />
                    </Card.Header.Icon>
                  </Card.Header>
                  <Card.Content>
                    <Paragraph textColor="grey" mb="5">
                      {model.tagline}
                    </Paragraph>

                    <Span display="block" mb="2">
                      <Tag color={model.color} isRounded>
                        {model.context} context
                      </Tag>
                    </Span>

                    <Title as="p" size="6" mt="5" mb="2">
                      Best for
                    </Title>
                    <UnorderedList>
                      {model.bestFor.map(use => (
                        <ListItem key={use} mb="1">
                          <IconText
                            iconProps={{
                              name: 'check',
                              'aria-hidden': 'true',
                            }}
                            textColor="grey"
                          >
                            {use}
                          </IconText>
                        </ListItem>
                      ))}
                    </UnorderedList>
                  </Card.Content>
                  <Card.Footer>
                    <Card.FooterItem>
                      <Span textSize="7">
                        <Strong>{model.inputPrice}</Strong> in
                      </Span>
                    </Card.FooterItem>
                    <Card.FooterItem>
                      <Span textSize="7">
                        <Strong>{model.outputPrice}</Strong> out
                      </Span>
                    </Card.FooterItem>
                  </Card.Footer>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Title size="2" mb="5">
            Specifications
          </Title>
          <Box>
            <Table isFullwidth isHoverable isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Capability</Table.Th>
                  {MODELS.map(model => (
                    <Table.Th key={model.id} textAlign="right">
                      {model.name}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Th>Model string</Table.Th>
                  {MODELS.map(model => (
                    <Table.Td key={model.id} textAlign="right">
                      <Span fontFamily="code">skynet-{model.id}</Span>
                    </Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Th>Context window</Table.Th>
                  {MODELS.map(model => (
                    <Table.Td key={model.id} textAlign="right">
                      {model.context}
                    </Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Th>Max output</Table.Th>
                  {MODELS.map(model => (
                    <Table.Td key={model.id} textAlign="right">
                      {model.output}
                    </Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Th>Time to first token</Table.Th>
                  {MODELS.map(model => (
                    <Table.Td key={model.id} textAlign="right">
                      {model.latency}
                    </Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Th>Input / Mtok</Table.Th>
                  {MODELS.map(model => (
                    <Table.Td key={model.id} textAlign="right">
                      {model.inputPrice}
                    </Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Th>Output / Mtok</Table.Th>
                  {MODELS.map(model => (
                    <Table.Td key={model.id} textAlign="right">
                      {model.outputPrice}
                    </Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Th>Vision & audio input</Table.Th>
                  <Table.Td textAlign="right">
                    <Span textColor="grey">Vision only</Span>
                  </Table.Td>
                  <Table.Td textAlign="right">Yes</Table.Td>
                  <Table.Td textAlign="right">Yes</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th>Parallel tool calls</Table.Th>
                  <Table.Td textAlign="right">8</Table.Td>
                  <Table.Td textAlign="right">64</Table.Td>
                  <Table.Td textAlign="right">512</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th>Custom fine-tuning</Table.Th>
                  <Table.Td textAlign="right">Yes</Table.Td>
                  <Table.Td textAlign="right">Yes</Table.Td>
                  <Table.Td textAlign="right">
                    <Span textColor="grey">Enterprise only</Span>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Box>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Title size="2">Runs where your data already lives</Title>
          <Paragraph textColor="grey" mt="4" mb="6">
            Identical weights and an identical API in all three deployments —
            you are not trading capability for control.
          </Paragraph>

          <Columns>
            {DEPLOYMENTS.map(deployment => (
              <Column
                key={deployment.name}
                display="flex"
                flexDirection="column"
              >
                <Box flexGrow="1">
                  <Icon
                    name={deployment.icon}
                    size="medium"
                    textColor="primary"
                    aria-hidden="true"
                  />
                  <Title as="p" size="5" mt="3" mb="2">
                    {deployment.name}
                  </Title>
                  <Paragraph textColor="grey">{deployment.body}</Paragraph>
                </Box>
              </Column>
            ))}
          </Columns>

          <Message color="info" mt="6">
            <Message.Body>
              Every deployment ships with the Netadyne eval harness, so the
              scorecard you run in CI is the same one we publish on the
              benchmarks page.
            </Message.Body>
          </Message>

          <Buttons mt="6">
            <Button color="primary" size="medium" as="a" href="#/contact">
              Talk to an engineer
            </Button>
            <Button size="medium" as="a" href="#/benchmarks">
              See the benchmarks
            </Button>
          </Buttons>
        </Container>
      </Section>
    </>
  );
}
