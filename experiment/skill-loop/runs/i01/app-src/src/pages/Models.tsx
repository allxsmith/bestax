import {
  Block,
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
  Icon,
  IconText,
  Section,
  Table,
  Tag,
  Tags,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHead } from '../components/SectionHead';
import { MODELS, type PageId } from '../data/site';

interface ModelsProps {
  onNavigate: (page: PageId) => void;
}

const CAPABILITIES: { label: string; nova: string; flash: string; edge: string }[] =
  [
    { label: 'Context window', nova: '4M tokens', flash: '1M tokens', edge: '256K tokens' },
    { label: 'Max output', nova: '128K tokens', flash: '64K tokens', edge: '32K tokens' },
    { label: 'Vision & documents', nova: 'Yes', flash: 'Yes', edge: 'Images only' },
    { label: 'Tool use', nova: 'Parallel, nested', flash: 'Parallel', edge: 'Sequential' },
    { label: 'Structured output', nova: 'Yes', flash: 'Yes', edge: 'Yes' },
    { label: 'Extended thinking', nova: 'Yes', flash: 'Budgeted', edge: 'No' },
    { label: 'Prompt caching', nova: 'Yes', flash: 'Yes', edge: 'Local' },
    { label: 'Batch API', nova: 'Yes, 50% off', flash: 'Yes, 50% off', edge: 'n/a' },
    { label: 'Knowledge cutoff', nova: 'March 2026', flash: 'March 2026', edge: 'January 2026' },
  ];

export function Models({ onNavigate }: ModelsProps) {
  return (
    <>
      <Section size="medium">
        <Container>
          <SectionHead
            eyebrow="Model family"
            title="Three models. One API surface."
            subtitle="Nova for the hard problems, Flash for the volume, Edge for the traffic that is never allowed to leave your network. Same tokenizer, same tools, same response shape."
          />

          <Grid isFixed fixedColsMobile={1} fixedColsDesktop={3} gap={5}>
            {MODELS.map(model => (
              <Cell key={model.id} display="flex" flexDirection="column">
                <Card flexGrow="1">
                  <Card.Content>
                    <Block display="flex" alignItems="center" mb="4">
                      <Icon
                        name={model.icon}
                        size="large"
                        features="fa-2x"
                        textColor="primary"
                        aria-hidden="true"
                        mr="3"
                      />
                      <div>
                        <Title size="4" as="h2" mb="1">
                          {model.name}
                        </Title>
                        {model.featured && (
                          <Tag color="primary" isRounded>
                            Flagship
                          </Tag>
                        )}
                      </div>
                    </Block>

                    <Content textColor="grey">
                      <p>{model.tagline}</p>
                    </Content>

                    <Table isFullwidth isNarrow mt="4">
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Td className="has-text-grey">Context</Table.Td>
                          <Table.Td className="has-text-right has-text-weight-semibold">
                            {model.context}
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td className="has-text-grey">Latency</Table.Td>
                          <Table.Td className="has-text-right has-text-weight-semibold">
                            {model.latency}
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td className="has-text-grey">Input</Table.Td>
                          <Table.Td className="has-text-right has-text-weight-semibold">
                            {model.inputPrice}
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td className="has-text-grey">Output</Table.Td>
                          <Table.Td className="has-text-right has-text-weight-semibold">
                            {model.outputPrice}
                          </Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>

                    <Content textSize="7" textColor="grey" mt="4">
                      <p className="has-text-weight-semibold">Best for</p>
                      <p>{model.best}</p>
                    </Content>

                    <Block mt="5">
                      <Tags>
                        <Tag isRounded>
                          <code>{model.id}</code>
                        </Tag>
                      </Tags>
                    </Block>
                  </Card.Content>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHead
            eyebrow="Capabilities"
            title="Side by side"
            subtitle="Anything supported by Nova is supported by Flash unless noted. Edge trades context and thinking for running entirely inside your perimeter."
          />

          <Box>
            <Table isFullwidth isHoverable isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Capability</Table.Th>
                  <Table.Th>Skynet Nova</Table.Th>
                  <Table.Th>Skynet Flash</Table.Th>
                  <Table.Th>Skynet Edge</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {CAPABILITIES.map(row => (
                  <Table.Tr key={row.label}>
                    <Table.Td className="has-text-weight-semibold">
                      {row.label}
                    </Table.Td>
                    <Table.Td>{row.nova}</Table.Td>
                    <Table.Td>{row.flash}</Table.Td>
                    <Table.Td>{row.edge}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Columns isVCentered>
            <Column sizeDesktop={7}>
              <SectionHead
                align="left"
                eyebrow="Routing"
                title="Let the router pick"
                subtitle="Send everything to skynet-auto and Netadyne routes each request to the cheapest model that clears your quality bar, measured against your own eval set."
              />
              <Content>
                <ul>
                  <li>Per-route quality floors, set in the console.</li>
                  <li>Automatic fallback to Nova on low-confidence responses.</li>
                  <li>Full routing decisions in every trace — no black box.</li>
                </ul>
              </Content>
              <Buttons mt="4">
                <Button color="primary" onClick={() => onNavigate('pricing')}>
                  <IconText iconProps={{ name: 'tags', 'aria-hidden': 'true' }}>
                    See pricing
                  </IconText>
                </Button>
                <Button color="ghost" onClick={() => onNavigate('benchmarks')}>
                  Benchmarks
                </Button>
              </Buttons>
            </Column>
            <Column sizeDesktop={5}>
              <Box>
                <IconText
                  iconProps={{ name: 'route', 'aria-hidden': 'true' }}
                  textColor="primary"
                  textWeight="semibold"
                  mb="4"
                >
                  Typical mix after routing
                </IconText>
                <Content>
                  <p className="mb-2">
                    <strong>78%</strong> of requests served by Flash
                  </p>
                  <p className="mb-2">
                    <strong>21%</strong> escalated to Nova
                  </p>
                  <p className="mb-2">
                    <strong>1%</strong> re-run after a confidence check
                  </p>
                </Content>
                <Content textSize="7" textColor="grey" mt="4">
                  <p>
                    Measured across Scale-plan traffic in the last 30 days.
                    Your mix depends entirely on your quality floor.
                  </p>
                </Content>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
