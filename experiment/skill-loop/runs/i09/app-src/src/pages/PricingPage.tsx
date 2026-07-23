import {
  Hero,
  Section,
  Container,
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
  Tag,
  Theme,
  Collapse,
  IconText,
  UnorderedList,
  ListItem,
} from '@allxsmith/bestax-bulma';
import { TIERS, MODELS, FAQS, type Tier } from '../data/site';

function TierCard({ tier }: { tier: Tier }) {
  return (
    <Card flexGrow="1">
      <Card.Content>
        <Span display="flex" alignItems="center" justifyContent="space-between">
          <Title as="p" size="4" mb="0">
            {tier.name}
          </Title>
          {tier.featured && (
            <Tag color="primary" isRounded>
              Most popular
            </Tag>
          )}
        </Span>

        <Span display="flex" alignItems="baseline" mt="4">
          <Title as="p" size="1" mb="0" mr="2">
            {tier.price}
          </Title>
          <Span textColor="grey" textSize="7">
            {tier.cadence}
          </Span>
        </Span>

        <Paragraph textColor="grey" mt="4" mb="5">
          {tier.blurb}
        </Paragraph>

        <Button
          color={tier.featured ? 'primary' : 'dark'}
          isFullWidth
          as="a"
          href="#/contact"
        >
          {tier.cta}
        </Button>

        <UnorderedList mt="5">
          {tier.includes.map(item => (
            <ListItem key={item} mb="2">
              <IconText
                iconProps={{ name: 'check', 'aria-hidden': 'true' }}
                textColor="grey"
              >
                {item}
              </IconText>
            </ListItem>
          ))}
        </UnorderedList>
      </Card.Content>
    </Card>
  );
}

export function PricingPage() {
  return (
    <>
      <Hero className="hero-wash">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="1">Frontier pricing without the frontier tax</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              Pay for tokens. Add seats when the team grows. Negotiate only when
              you need dedicated capacity.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Columns isMultiline>
            {TIERS.map(tier => (
              <Column
                key={tier.id}
                sizeTablet="half"
                sizeDesktop="one-third"
                display="flex"
                flexDirection="column"
              >
                {tier.featured ? (
                  // A component --bulma-* var reaches the whole subtree, so the
                  // featured ring needs no third CSS rule and stays theme-aware.
                  <Theme
                    bulmaVars={{
                      '--bulma-card-shadow':
                        '0 0 0 2px var(--bulma-primary), var(--bulma-shadow)',
                    }}
                    display="flex"
                    flexDirection="column"
                    flexGrow="1"
                  >
                    <TierCard tier={tier} />
                  </Theme>
                ) : (
                  <TierCard tier={tier} />
                )}
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Title size="2" mb="2">
            Token pricing
          </Title>
          <Paragraph textColor="grey" mb="5">
            Per million tokens, in US dollars. Batch requests are half price on
            every model; cached input reads are 90% off.
          </Paragraph>

          <Box>
            <Table isFullwidth isHoverable isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Model</Table.Th>
                  <Table.Th textAlign="right">Input</Table.Th>
                  <Table.Th textAlign="right">Output</Table.Th>
                  <Table.Th textAlign="right">Batch input</Table.Th>
                  <Table.Th textAlign="right">Cached read</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {MODELS.map(model => {
                  const input = Number(model.inputPrice.replace('$', ''));
                  return (
                    <Table.Tr key={model.id}>
                      <Table.Th>
                        {model.name}
                        <Span display="block" textSize="7" textColor="grey">
                          {model.context} context
                        </Span>
                      </Table.Th>
                      <Table.Td textAlign="right">{model.inputPrice}</Table.Td>
                      <Table.Td textAlign="right">{model.outputPrice}</Table.Td>
                      <Table.Td textAlign="right">
                        <Span textColor="grey">${(input / 2).toFixed(2)}</Span>
                      </Table.Td>
                      <Table.Td textAlign="right">
                        <Span textColor="grey">${(input / 10).toFixed(2)}</Span>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>
        </Container>
      </Section>

      <Section size="large">
        <Container>
          <Columns isCentered>
            <Column sizeDesktop={8}>
              <Title size="2" textAlign="centered" mb="6">
                Questions we get asked
              </Title>

              {FAQS.map(faq => (
                <Collapse
                  key={faq.q}
                  bordered
                  mb="3"
                  trigger={
                    <Span
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      p="4"
                    >
                      <Strong>{faq.q}</Strong>
                    </Span>
                  }
                >
                  <Paragraph textColor="grey" p="4">
                    {faq.a}
                  </Paragraph>
                </Collapse>
              ))}

              <Paragraph textAlign="centered" mt="6">
                Still deciding?{' '}
                <Button color="primary" as="a" href="#/contact">
                  Talk to sales
                </Button>
              </Paragraph>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
