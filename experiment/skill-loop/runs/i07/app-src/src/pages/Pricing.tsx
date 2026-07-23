import {
  Box,
  Button,
  Buttons,
  Cell,
  Column,
  Columns,
  Collapse,
  Container,
  Grid,
  Icon,
  IconText,
  Paragraph,
  Section,
  Span,
  Table,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { PricingCard } from '../components/PricingCard';
import { FAQS, MODELS, PLANS } from '../data/site';

const DISCOUNTS = [
  { label: 'Batch API (24h window)', value: '50% off input and output' },
  { label: 'Cache read', value: '10% of the input rate' },
  { label: 'Cache write (1 hour)', value: '125% of the input rate' },
  { label: 'Reserved throughput', value: 'From 35% off at 12-month commit' },
];

export function Pricing() {
  return (
    <>
      <Section size="medium" className="hero-wash">
        <Container>
          <SectionHeading
            eyebrow="Pricing"
            title="Start free. Pay for tokens, not seats."
            subtitle="Every plan gets all three models and the full platform. What changes is throughput, support, and where the model runs."
            as="h1"
            size="1"
            textAlign="centered"
          />
        </Container>
      </Section>

      <Section>
        <Container>
          <Grid isFixed fixedColsMobile={1} fixedColsDesktop={3} gap={5}>
            {PLANS.map(plan => (
              <Cell key={plan.name} display="flex" flexDirection="column">
                <PricingCard {...plan} />
              </Cell>
            ))}
          </Grid>
          <Paragraph textAlign="centered" textSize="7" textColor="grey" mt="5">
            Prices in USD, billed monthly. Annual commitments and startup credits
            are available — ask.
          </Paragraph>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Token pricing"
            title="What a million tokens costs"
            subtitle="The same rates on every plan. Volume discounts apply automatically past 500M tokens a month."
            mb="5"
          />
          <Table isFullwidth isHoverable isResponsive>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Model</Table.Th>
                <Table.Th textAlign="right">Input</Table.Th>
                <Table.Th textAlign="right">Output</Table.Th>
                <Table.Th textAlign="right">Context</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {MODELS.map(model => (
                <Table.Tr key={model.id}>
                  <Table.Td>
                    <IconText>
                      <Icon
                        name={model.icon}
                        textColor={model.color}
                        aria-hidden="true"
                      />
                      <Span textWeight="semibold">{model.name}</Span>
                    </IconText>
                  </Table.Td>
                  <Table.Td textAlign="right" fontFamily="monospace">
                    {model.input}
                  </Table.Td>
                  <Table.Td textAlign="right" fontFamily="monospace">
                    {model.output}
                  </Table.Td>
                  <Table.Td textAlign="right">{model.context}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Columns mt="5">
            {DISCOUNTS.map(discount => (
              <Column key={discount.label}>
                <Box p="4">
                  <Paragraph textSize="7" textColor="grey" mb="1">
                    {discount.label}
                  </Paragraph>
                  <Paragraph textWeight="semibold" mb="0">
                    {discount.value}
                  </Paragraph>
                </Box>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Columns isCentered>
            <Column sizeDesktop={8}>
              <SectionHeading
                eyebrow="FAQ"
                title="Questions we actually get"
                textAlign="centered"
                mb="6"
              />
              {FAQS.map(faq => (
                <Collapse
                  key={faq.question}
                  bordered
                  mb="3"
                  trigger={
                    <Title as="h3" size="6" mb="0">
                      {faq.question}
                    </Title>
                  }
                >
                  <Paragraph textColor="grey" mb="0">
                    {faq.answer}
                  </Paragraph>
                </Collapse>
              ))}
            </Column>
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container textAlign="centered">
          <Title as="h2" size="3" mb="3">
            Still sizing it up?
          </Title>
          <Paragraph textColor="grey" mb="5">
            We will run your own evaluation set against Skynet and send you the
            transcripts — including the ones it gets wrong.
          </Paragraph>
          <Buttons isCentered>
            <Button as="a" href="#/contact" color="primary" size="large">
              Talk to sales
            </Button>
            <Button
              as="a"
              href="#/benchmarks"
              color="primary"
              isOutlined
              size="large"
            >
              See the benchmarks
            </Button>
          </Buttons>
        </Container>
      </Section>
    </>
  );
}
