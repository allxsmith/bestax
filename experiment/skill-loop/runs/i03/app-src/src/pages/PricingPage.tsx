import {
  Box,
  Button,
  Buttons,
  Cell,
  Column,
  Columns,
  Container,
  Grid,
  Hero,
  Icon,
  IconText,
  Section,
  Span,
  Table,
  Tag,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { FAQS, PLANS, TOKEN_PRICES } from '../site/content';

export function PricingPage() {
  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              as="h1"
              eyebrow="Pricing"
              title="Priced per token, not per promise"
              lede="No minimums on the first two plans. Cached input bills at 10%, batch at 50%."
            />
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="medium">
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsDesktop={3} gap={5}>
            {PLANS.map(plan => (
              <Cell key={plan.name} display="flex" flexDirection="column">
                <Box display="flex" flexDirection="column" flexGrow="1" p="5">
                  <Title as="h2" size="4" mb="2">
                    {plan.name}
                    {plan.featured && (
                      <Tag color="primary" isRounded ml="3">
                        Most popular
                      </Tag>
                    )}
                  </Title>
                  <Span display="block" textColor="grey" mb="4">
                    {plan.blurb}
                  </Span>
                  <Title as="p" size="1" mb="1">
                    {plan.price}
                  </Title>
                  <Span display="block" textSize="7" textColor="grey" mb="5">
                    {plan.cadence}
                  </Span>

                  <Box hasShadow={false} p="0" flexGrow="1" mb="5">
                    {plan.items.map(item => (
                      <IconText key={item} mb="3">
                        <Icon
                          name="check"
                          textColor="primary"
                          aria-hidden="true"
                        />
                        <Span>{item}</Span>
                      </IconText>
                    ))}
                  </Box>

                  <Button
                    as="a"
                    href="#/contact"
                    color="primary"
                    isOutlined={!plan.featured}
                    isFullWidth
                  >
                    {plan.cta}
                  </Button>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Token pricing"
            title="What a million tokens costs"
            lede="USD per million tokens. The same rates on every plan — plans buy capacity, support, and controls."
            mb="6"
          />
          <Box p="0">
            <Table isFullwidth isHoverable isResponsive>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Model</Table.Th>
                  <Table.Th textAlign="right">Input</Table.Th>
                  <Table.Th textAlign="right">Output</Table.Th>
                  <Table.Th textAlign="right">Cached input</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {TOKEN_PRICES.map(price => (
                  <Table.Tr key={price.model}>
                    <Table.Th textWeight="semibold">{price.model}</Table.Th>
                    <Table.Td textAlign="right">{price.input}</Table.Td>
                    <Table.Td textAlign="right">{price.output}</Table.Td>
                    <Table.Td textAlign="right">
                      <Span textColor="primary" textWeight="semibold">
                        {price.cached}
                      </Span>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
          <Span display="block" textSize="7" textColor="grey" mt="4">
            Batch requests bill at 50% of the listed rate. Provisioned
            throughput is quoted per accelerator-hour.
          </Span>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <SectionHeading
            eyebrow="Questions"
            title="Asked often enough to publish"
            mb="6"
          />
          <Columns isMultiline>
            {FAQS.map(faq => (
              <Column
                key={faq.q}
                sizeTablet="half"
                display="flex"
                flexDirection="column"
              >
                <Box flexGrow="1" p="5">
                  <Title as="h3" size="5" mb="3">
                    {faq.q}
                  </Title>
                  <Span display="block" textColor="grey">
                    {faq.a}
                  </Span>
                </Box>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <Box p="6" textAlign="centered">
            <Title as="h2" size="3" mb="3">
              Still sizing it up?
            </Title>
            <Span display="block" textColor="grey" mb="5">
              Send us your workload shape and we will come back with a real
              number, not a range.
            </Span>
            <Buttons isCentered>
              <Button as="a" href="#/contact" color="primary" size="large">
                Talk to sales
              </Button>
              <Button as="a" href="#/benchmarks" size="large">
                Review the benchmarks
              </Button>
            </Buttons>
          </Box>
        </Container>
      </Section>
    </>
  );
}
