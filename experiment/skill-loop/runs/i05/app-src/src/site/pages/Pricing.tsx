import { useState } from 'react';
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
  Tag,
  Icon,
  IconText,
  Button,
  Divider,
  Switch,
  UnorderedList,
  ListItem,
  Collapse,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { FAQS, MODELS, TIERS } from '../data';
import { href } from '../routes';

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<string | null>(FAQS[0].q);

  const priceFor = (tier: (typeof TIERS)[number]) => {
    if (!tier.price.startsWith('$') || tier.price === '$0') return tier.price;
    const monthly = Number(tier.price.slice(1));
    return annual ? `$${Math.round(monthly * 0.8)}` : tier.price;
  };

  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              size="1"
              eyebrow="Pricing"
              title="Pay for tokens. Not for the privilege."
              subtitle="No seat minimums on the API, no capability paywall, no surprise inference surcharge. Start free and grow into reserved capacity when you need it."
            />
            <Paragraph textAlign="centered" mt="5" mb="0">
              <Switch
                checked={annual}
                onChange={e => setAnnual(e.target.checked)}
                color="primary"
                isRounded
              >
                Annual billing &mdash; save 20%
              </Switch>
            </Paragraph>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Columns isMultiline>
            {TIERS.map(tier => (
              <Column
                key={tier.name}
                sizeTablet="half"
                sizeDesktop="one-third"
                display="flex"
                flexDirection="column"
              >
                <Card flexGrow="1">
                  <Card.Content>
                    {tier.featured ? (
                      <Tag color="primary" mb="3">
                        Most popular
                      </Tag>
                    ) : (
                      <Tag mb="3">
                        {tier.name === 'Developer' ? 'Free forever' : 'Custom'}
                      </Tag>
                    )}
                    <Title as="p" size="4" mb="2">
                      {tier.name}
                    </Title>
                    <Paragraph textColor="grey" mb="4">
                      {tier.blurb}
                    </Paragraph>
                    <Title as="p" size="1" mb="1">
                      {priceFor(tier)}
                    </Title>
                    <Span textSize="7" textColor="grey">
                      {tier.cadence}
                    </Span>
                    <Divider />
                    <UnorderedList ml="0">
                      {tier.includes.map(item => (
                        <ListItem key={item} mb="2">
                          <IconText>
                            <Icon
                              name="check"
                              textColor="success"
                              aria-hidden="true"
                            />
                            <Span textSize="7">{item}</Span>
                          </IconText>
                        </ListItem>
                      ))}
                    </UnorderedList>
                    <Button
                      as="a"
                      href={href('/contact')}
                      color="primary"
                      isLight={!tier.featured}
                      isFullWidth
                      mt="5"
                    >
                      {tier.cta}
                    </Button>
                  </Card.Content>
                </Card>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Token pricing"
            title="The same rates on every plan"
            subtitle="Plans buy throughput, support and deployment options. The per-token price of the model never changes."
            mb="6"
          />
          <Box p="0">
            <Table isFullwidth isHoverable isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Model</Table.Th>
                  <Table.Th textAlign="right">Input / M tokens</Table.Th>
                  <Table.Th textAlign="right">Output / M tokens</Table.Th>
                  <Table.Th textAlign="right">Cached input</Table.Th>
                  <Table.Th textAlign="right">Batch</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {MODELS.map(model => {
                  const [input, output] = model.price
                    .replace(' per M tokens', '')
                    .split(' / ');
                  const cached = `$${(Number(input.slice(1)) * 0.1).toFixed(2)}`;
                  return (
                    <Table.Tr key={model.name}>
                      <Table.Td textWeight="semibold">{model.name}</Table.Td>
                      <Table.Td textAlign="right">{input}</Table.Td>
                      <Table.Td textAlign="right">{output}</Table.Td>
                      <Table.Td textAlign="right">{cached}</Table.Td>
                      <Table.Td textAlign="right">
                        <Span textColor="grey">50% off</Span>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>
          <Paragraph textAlign="centered" textColor="grey" textSize="7" mt="5">
            Cached input is billed at 10% of the standard rate for the life of
            the cache entry (5 minutes, refreshed on each hit).
          </Paragraph>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <SectionHeading
            eyebrow="Questions"
            title="Answers before you ask sales"
            mb="6"
          />
          <Columns isCentered>
            <Column sizeDesktop={8}>
              {FAQS.map(faq => (
                <Collapse
                  key={faq.q}
                  bordered
                  mb="3"
                  open={openFaq === faq.q}
                  onOpen={() => setOpenFaq(faq.q)}
                  onClose={() => setOpenFaq(null)}
                  trigger={<Span textWeight="semibold">{faq.q}</Span>}
                >
                  <Paragraph textColor="grey" mb="0">
                    {faq.a}
                  </Paragraph>
                </Collapse>
              ))}
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={3} gap={4}>
            {[
              {
                icon: 'headset',
                title: 'Talk to a human',
                body: 'Solutions architects, not SDRs. Same-day response on Scale and Enterprise.',
              },
              {
                icon: 'file-invoice-dollar',
                title: 'Committed-use discounts',
                body: 'Reserve throughput for 12 months and take up to 45% off list.',
              },
              {
                icon: 'graduation-cap',
                title: 'Research and non-profit',
                body: 'Accredited labs and registered non-profits get Ultra at Pro pricing.',
              },
            ].map(item => (
              <Cell key={item.title} display="flex" flexDirection="column">
                <Box flexGrow="1" p="5">
                  <Icon
                    name={item.icon}
                    size="medium"
                    textColor="primary"
                    mb="3"
                    aria-hidden="true"
                  />
                  <Title as="p" size="5" mb="2">
                    {item.title}
                  </Title>
                  <Paragraph textColor="grey" mb="0">
                    {item.body}
                  </Paragraph>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>
    </>
  );
}
