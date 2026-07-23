import {
  Block,
  Box,
  Button,
  Card,
  Cell,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Icon,
  IconText,
  ListItem,
  Section,
  Table,
  Tag,
  Title,
  UnorderedList,
} from '@allxsmith/bestax-bulma';
import { SectionHead } from '../components/SectionHead';
import { FAQS, MODELS, TIERS, type PageId } from '../data/site';

interface PricingProps {
  onNavigate: (page: PageId) => void;
}

export function Pricing({ onNavigate }: PricingProps) {
  return (
    <>
      <Section size="medium">
        <Container>
          <SectionHead
            eyebrow="Pricing"
            title="Priced per token. Billed per second of honesty."
            subtitle="No minimum commitment, no seat you have to buy to unlock the good model, and the free tier runs the same Nova weights as Enterprise."
          />

          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsDesktop={4}
            gap={5}
          >
            {TIERS.map(tier => (
              <Cell key={tier.name} display="flex" flexDirection="column">
                <Card
                  flexGrow="1"
                  display="flex"
                  flexDirection="column"
                >
                  {/* Card.Content takes no helper props, so the flex recipe that keeps
                      every CTA on the same baseline goes on as Bulma classes. */}
                  <Card.Content className="is-flex is-flex-direction-column is-flex-grow-1">
                    <Block>
                      <Title size="5" as="h2" mb="2">
                        {tier.name}
                      </Title>
                      {tier.featured && (
                        <Tag color="primary" isRounded mb="2">
                          Most popular
                        </Tag>
                      )}
                    </Block>

                    <Block mb="4">
                      <Title size="1" mb="1">
                        {tier.price}
                      </Title>
                      <Content textSize="7" textColor="grey" mb="0">
                        <p>{tier.cadence}</p>
                      </Content>
                    </Block>

                    <Content textColor="grey" textSize="7">
                      <p>{tier.blurb}</p>
                    </Content>

                    {/* Not IconText here: Bulma's .icon-text wraps as a flex
                        row, so a feature long enough to wrap drops its whole
                        label below the tick. A flex row with a fixed-width
                        icon keeps the text hanging-indented beside it. */}
                    <UnorderedList my="4" flexGrow="1">
                      {tier.features.map(feature => (
                        <ListItem
                          key={feature}
                          mb="2"
                          display="flex"
                          alignItems="flex-start"
                        >
                          <Icon
                            name="check"
                            textColor="primary"
                            aria-hidden="true"
                            mr="2"
                          />
                          <span>{feature}</span>
                        </ListItem>
                      ))}
                    </UnorderedList>

                    <Button
                      color="primary"
                      isOutlined={!tier.featured}
                      isFullWidth
                      onClick={() => onNavigate('contact')}
                    >
                      {tier.cta}
                    </Button>
                  </Card.Content>
                </Card>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Token pricing */}
      <Section size="medium" className="section-alt">
        <Container>
          <SectionHead
            eyebrow="Token pricing"
            title="What a million tokens costs"
            subtitle="Cached input reads are billed at 10% of the input rate. Batch jobs are half price and return within 12 hours."
          />

          <Box>
            <Table isFullwidth isHoverable isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Model</Table.Th>
                  <Table.Th className="has-text-right">Input / MTok</Table.Th>
                  <Table.Th className="has-text-right">Output / MTok</Table.Th>
                  <Table.Th className="has-text-right">Cached input</Table.Th>
                  <Table.Th className="has-text-right">Batch</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {MODELS.map(model => (
                  <Table.Tr key={model.id}>
                    <Table.Td>
                      <span className="has-text-weight-semibold">
                        {model.name}
                      </span>
                      <br />
                      <code className="is-size-7">{model.id}</code>
                    </Table.Td>
                    <Table.Td className="has-text-right">
                      {model.inputPrice.replace(' / MTok', '')}
                    </Table.Td>
                    <Table.Td className="has-text-right">
                      {model.outputPrice.replace(' / MTok', '')}
                    </Table.Td>
                    <Table.Td className="has-text-right has-text-grey">
                      {model.id === 'skynet-nova'
                        ? '$0.40'
                        : model.id === 'skynet-flash'
                          ? '$0.04'
                          : 'n/a'}
                    </Table.Td>
                    <Table.Td className="has-text-right has-text-grey">
                      {model.id === 'skynet-edge' ? 'n/a' : '50% off'}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>

          <Block mt="5" textAlign="centered">
            <IconText
              iconProps={{ name: 'calculator', 'aria-hidden': 'true' }}
              textColor="grey"
            >
              A typical support conversation on Flash costs about $0.004.
            </IconText>
          </Block>
        </Container>
      </Section>

      {/* FAQ */}
      <Section size="medium">
        <Container>
          <SectionHead eyebrow="FAQ" title="Questions we actually get asked" />

          <Columns isMultiline>
            {FAQS.map(faq => (
              <Column
                key={faq.q}
                sizeTablet={12}
                sizeDesktop={6}
                display="flex"
                flexDirection="column"
              >
                <Box flexGrow="1">
                  <Title size="5" as="h3" mb="3">
                    <IconText
                      iconProps={{
                        name: 'circle-question',
                        'aria-hidden': 'true',
                      }}
                      textColor="primary"
                    >
                      {faq.q}
                    </IconText>
                  </Title>
                  <Content textColor="grey">
                    <p>{faq.a}</p>
                  </Content>
                </Box>
              </Column>
            ))}
          </Columns>

          <Block textAlign="centered" mt="6">
            <Content>
              <p>Still deciding? Bring us your eval set.</p>
            </Content>
            <Button color="primary" size="large" onClick={() => onNavigate('contact')}>
              <IconText iconProps={{ name: 'comments', 'aria-hidden': 'true' }}>
                Talk to an engineer
              </IconText>
            </Button>
          </Block>
        </Container>
      </Section>
    </>
  );
}
