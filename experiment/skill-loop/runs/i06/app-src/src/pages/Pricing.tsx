import {
  Block,
  Box,
  Button,
  Buttons,
  Cell,
  Collapse,
  Column,
  Columns,
  Container,
  Grid,
  Hero,
  Icon,
  IconText,
  Notification,
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
import { FAQS, MODELS, PLANS } from '../data/site';
import type { PageProps } from '../routes';

const DISCOUNTS = [
  {
    title: 'Prompt caching',
    detail: '90% off repeated context',
    body: 'Cached prefixes bill at one tenth the input rate for five minutes, refreshed on every hit.',
    icon: 'database-refresh-outline',
  },
  {
    title: 'Batch API',
    detail: '50% off everything',
    body: 'Submit up to a million requests with a 24-hour completion window.',
    icon: 'layers-outline',
  },
  {
    title: 'Committed use',
    detail: 'Up to 40% off',
    body: 'Reserve throughput for 12 or 36 months and pay a fixed rate per unit.',
    icon: 'handshake-outline',
  },
];

export function Pricing({ onNavigate }: PageProps) {
  return (
    <>
      <Hero className="hero-wash">
        <Hero.Body>
          <Container>
            <Tag color="primary" isRounded mb="4">
              Pricing
            </Tag>
            <Title size="1" mb="4">
              Frontier capability, priced per token.
            </Title>
            <SubTitle size="4" textColor="grey" mb="0">
              No long-context surcharge, no per-seat tax on your API traffic,
              and no charge for the retries you no longer have to write.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsTablet={2}
            fixedColsWidescreen={4}
            gap={5}
          >
            {PLANS.map(plan => (
              <Cell key={plan.name} display="flex" flexDirection="column">
                <Box flexGrow="1" display="flex" flexDirection="column">
                  <Block mb="3">
                    <Title size="5" mb="2">
                      {plan.name}
                    </Title>
                    {plan.featured && (
                      <Tag color="primary" isRounded>
                        Most popular
                      </Tag>
                    )}
                  </Block>
                  <Title size="2" textColor="primary" mb="1">
                    {plan.price}
                  </Title>
                  <Paragraph mb="4">
                    <Span textSize="7" textColor="grey">
                      {plan.cadence}
                    </Span>
                  </Paragraph>
                  <Paragraph mb="4">
                    <Span textColor="grey">{plan.summary}</Span>
                  </Paragraph>
                  <Block flexGrow="1">
                    {plan.items.map(item => (
                      <Block key={item} mb="2">
                        <IconText
                          iconProps={{
                            name: 'check-circle',
                            'aria-hidden': 'true',
                            textColor: 'primary',
                          }}
                        >
                          <Span textSize="7">{item}</Span>
                        </IconText>
                      </Block>
                    ))}
                  </Block>
                  <Button
                    color="primary"
                    isInverted={!plan.featured}
                    isFullWidth
                    mt="4"
                    onClick={() => onNavigate('contact')}
                  >
                    {plan.cta}
                  </Button>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="API rates"
            title="Token pricing"
            subtitle="Billed per million tokens. The same rate at 1,000 tokens of context and at 4,000,000."
            mb="5"
          />
          <Box>
            <Table isStriped isHoverable isFullwidth>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Model</Table.Th>
                  <Table.Th textAlign="right">Input / 1M</Table.Th>
                  <Table.Th textAlign="right">Output / 1M</Table.Th>
                  <Table.Th textAlign="right">Cached input / 1M</Table.Th>
                  <Table.Th textAlign="right">Context</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {MODELS.map(model => (
                  <Table.Tr key={model.id}>
                    <Table.Td>
                      <Strong>{model.name}</Strong>
                      <br />
                      <Span fontFamily="code" textSize="7" textColor="grey">
                        {model.id}
                      </Span>
                    </Table.Td>
                    <Table.Td textAlign="right">{model.inputPrice}</Table.Td>
                    <Table.Td textAlign="right">{model.outputPrice}</Table.Td>
                    <Table.Td textAlign="right">
                      <Span textColor="primary">
                        $
                        {(
                          Number(model.inputPrice.replace('$', '')) / 10
                        ).toFixed(2)}
                      </Span>
                    </Table.Td>
                    <Table.Td textAlign="right">{model.context}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>

          <Grid
            isFixed
            fixedColsMobile={1}
            fixedColsDesktop={3}
            gap={5}
            mt="5"
          >
            {DISCOUNTS.map(item => (
              <Cell key={item.title} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <Icon
                    name={item.icon}
                    size="medium"
                    textColor="primary"
                    aria-hidden="true"
                  />
                  <Title size="6" mt="3" mb="1">
                    {item.title}
                  </Title>
                  <Paragraph mb="2">
                    <Span textWeight="semibold" textColor="primary">
                      {item.detail}
                    </Span>
                  </Paragraph>
                  <Paragraph mb="0">
                    <Span textSize="7" textColor="grey">
                      {item.body}
                    </Span>
                  </Paragraph>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section>
        <Container>
          <Columns>
            <Column sizeDesktop={4}>
              <SectionHeading
                eyebrow="Questions"
                title="Before you switch"
                subtitle="The five things every team asks us in the first call."
              />
              <Buttons mt="5">
                <Button color="primary" onClick={() => onNavigate('contact')}>
                  <Span>Ask us something else</Span>
                  <Icon name="arrow-right" aria-hidden="true" />
                </Button>
              </Buttons>
            </Column>
            <Column sizeDesktop={8}>
              {FAQS.map((faq, index) => (
                <Collapse
                  key={faq.q}
                  defaultOpen={index === 0}
                  trigger={
                    <Box mb="0">
                      <Strong>{faq.q}</Strong>
                    </Box>
                  }
                  mb="3"
                >
                  <Box>
                    <Paragraph mb="0">
                      <Span textColor="grey">{faq.a}</Span>
                    </Paragraph>
                  </Box>
                </Collapse>
              ))}
              <Notification color="info" isLight mt="5" mb="0">
                <Strong>Illustrative pricing.</Strong> Netadyne and Skynet are
                fictional; every rate on this page is invented for the purposes
                of this demo site.
              </Notification>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
