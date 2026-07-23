import { useState } from 'react';
import {
  Block,
  Box,
  Button,
  Cell,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Hero,
  IconText,
  Paragraph,
  Section,
  Span,
  Strong,
  SubTitle,
  Switch,
  Table,
  Tag,
  Tbody,
  Td,
  Th,
  Thead,
  Title,
  Tr,
} from '@allxsmith/bestax-bulma';
import { FAQS, PLANS, TOKEN_PRICING, type PageId } from '../site/content';

export default function PricingPage({
  onNavigate,
}: {
  onNavigate: (page: PageId) => void;
}) {
  const [annual, setAnnual] = useState(false);

  const priceFor = (plan: (typeof PLANS)[number]) => {
    if (!annual || !plan.price.startsWith('$') || plan.price === '$0') {
      return plan.price;
    }
    const monthly = Number(plan.price.replace(/[$,]/g, ''));
    return `$${Math.round(monthly * 0.8).toLocaleString()}`;
  };

  return (
    <>
      <Hero size="medium" className="hero-backdrop">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="1">Pricing</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              Per-token, no minimums, and the same model weights on every tier.
              Cached input is billed at 10%.
            </SubTitle>
            <Block
              display="flex"
              justifyContent="center"
              alignItems="center"
              mt="5"
            >
              <Span mr="3" textColor={annual ? 'grey' : undefined}>
                Monthly
              </Span>
              <Switch
                checked={annual}
                onChange={event => setAnnual(event.target.checked)}
                color="primary"
                isRounded
              >
                Annual billing
              </Switch>
              <Tag color="success" isRounded ml="2">
                Save 20%
              </Tag>
            </Block>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Columns isMultiline>
            {PLANS.map(plan => (
              <Column
                key={plan.name}
                sizeTablet={4}
                display="flex"
                flexDirection="column"
              >
                <PlanCard
                  plan={plan}
                  price={priceFor(plan)}
                  onNavigate={onNavigate}
                />
              </Column>
            ))}
          </Columns>

          <Paragraph textAlign="centered" textColor="grey" textSize="7" mt="4">
            All plans include the full Skynet model family, streaming, tool use,
            and batch inference at 50% off.
          </Paragraph>
        </Container>
      </Section>

      <Section className="band">
        <Container>
          <Title size="3" mb="2">
            Token pricing
          </Title>
          <Paragraph textColor="grey" mb="5">
            Per million tokens, in US dollars. Batch requests are half price;
            provisioned throughput is quoted separately.
          </Paragraph>

          <Box>
            <Table isFullwidth isHoverable isResponsive>
              <Thead>
                <Tr>
                  <Th>Model</Th>
                  <Th textAlign="right">Input</Th>
                  <Th textAlign="right">Cached input</Th>
                  <Th textAlign="right">Output</Th>
                </Tr>
              </Thead>
              <Tbody>
                {TOKEN_PRICING.map(row => (
                  <Tr key={row.model}>
                    <Td>
                      <Strong>{row.model}</Strong>
                    </Td>
                    <Td textAlign="right">{row.input}</Td>
                    <Td textAlign="right">
                      <Span textColor="success">{row.cached}</Span>
                    </Td>
                    <Td textAlign="right">{row.output}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Container>
      </Section>

      <Section>
        <Container>
          <Title size="3" textAlign="centered" mb="6">
            Questions
          </Title>
          <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={5}>
            {FAQS.map(faq => (
              <Cell key={faq.q} display="flex" flexDirection="column">
                <Box flexGrow="1">
                  <Title size="5" mb="3">
                    {faq.q}
                  </Title>
                  <Content textColor="grey">
                    <p>{faq.a}</p>
                  </Content>
                </Box>
              </Cell>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section className="band" textAlign="centered">
        <Container>
          <Title size="3">Still sizing it up?</Title>
          <SubTitle size="5" textColor="grey" mt="3" mb="5">
            Tell us the workload and we will model the monthly bill with you.
          </SubTitle>
          <Button
            color="primary"
            size="large"
            onClick={() => onNavigate('contact')}
          >
            Talk to sales
          </Button>
        </Container>
      </Section>
    </>
  );
}

function PlanCard({
  plan,
  price,
  onNavigate,
}: {
  plan: (typeof PLANS)[number];
  price: string;
  onNavigate: (page: PageId) => void;
}) {
  return (
    <Box flexGrow="1" display="flex" flexDirection="column">
      {plan.featured && (
        <Tag color="primary" isRounded mb="3">
          Most popular
        </Tag>
      )}
      <Title size="4" mb="2">
        {plan.name}
      </Title>
      <Paragraph textColor="grey" mb="4">
        {plan.blurb}
      </Paragraph>

      <Block mb="4">
        <Title size="1" as="p" mb="1">
          {price}
        </Title>
        <Span textSize="7" textColor="grey">
          {plan.cadence}
        </Span>
      </Block>

      <Block flexGrow="1">
        {plan.features.map(feature => (
          <Block key={feature} mb="2">
            <IconText
              iconProps={{
                name: 'check',
                textColor: plan.featured ? 'primary' : 'success',
                'aria-hidden': 'true',
              }}
            >
              {feature}
            </IconText>
          </Block>
        ))}
      </Block>

      <Button
        color="primary"
        isOutlined={!plan.featured}
        isFullWidth
        mt="5"
        onClick={() => onNavigate('contact')}
      >
        {plan.cta}
      </Button>
    </Box>
  );
}
