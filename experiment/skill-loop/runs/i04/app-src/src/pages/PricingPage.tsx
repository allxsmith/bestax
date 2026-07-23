import {
  Hero,
  Section,
  Container,
  Columns,
  Column,
  Card,
  Box,
  Title,
  SubTitle,
  Content,
  Button,
  Icon,
  IconText,
  Tag,
  Table,
  Collapse,
  Block,
  Span,
  Paragraph,
  UnorderedList,
  ListItem,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { COMPETITOR, DISCLAIMER, FAQS, MODELS, PLANS } from '../data/content';
import { useRouter } from '../router';

export function PricingPage() {
  const { navigate } = useRouter();

  return (
    <>
      <Hero color="primary" size="medium" className="hero-wash">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="1">A tenth of the price</Title>
            <SubTitle size="4" mt="4">
              $0.30 per million tokens on the frontier model — one tenth of what{' '}
              {COMPETITOR} charges for the tier below it.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="medium">
        <Container>
          <Columns isMultiline>
            {PLANS.map(plan => (
              <Column
                key={plan.name}
                sizeTablet="full"
                sizeDesktop={4}
                display="flex"
                flexDirection="column"
              >
                <Card flexGrow="1">
                  <Card.Content>
                    <Block
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb="4"
                    >
                      <Title size="4" mb="0">
                        {plan.name}
                      </Title>
                      {plan.featured && (
                        <Tag color="link" isRounded>
                          Most popular
                        </Tag>
                      )}
                    </Block>

                    <Block mb="4">
                      <Title as="p" size="1" mb="1">
                        {plan.price}
                      </Title>
                      <Span textColor="grey" textSize="7">
                        {plan.cadence}
                      </Span>
                    </Block>

                    <Paragraph textColor="grey" mb="5">
                      {plan.blurb}
                    </Paragraph>

                    <Button
                      color={plan.featured ? 'primary' : 'link'}
                      isOutlined={!plan.featured}
                      isFullWidth
                      mb="5"
                      onClick={() => navigate('waitlist')}
                    >
                      {plan.cta}
                    </Button>

                    <UnorderedList>
                      {plan.features.map(feature => (
                        <ListItem key={feature} mb="3">
                          <IconText>
                            <Icon
                              name="circle-check"
                              textColor="success"
                              aria-hidden="true"
                            />
                            <Span>{feature}</Span>
                          </IconText>
                        </ListItem>
                      ))}
                    </UnorderedList>
                  </Card.Content>
                </Card>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Section size="medium" className="section-alt">
        <Container>
          <SectionHeading
            eyebrow="Per-model rates"
            title="Pay for the model you actually call"
            lead="Prices are blended input/output per million tokens. Cached input reads bill at 10% of list."
          />
          <Table isFullwidth isHoverable isResponsive>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Model</Table.Th>
                <Table.Th textAlign="right">Context</Table.Th>
                <Table.Th>Best for</Table.Th>
                <Table.Th textAlign="right">Blended / Mtok</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {MODELS.map(model => (
                <Table.Tr key={model.name}>
                  <Table.Td textWeight="semibold">{model.name}</Table.Td>
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
          <Paragraph textColor="grey" textSize="7" mt="4">
            Committed-use discounts start at 500 Mtok / month and reach roughly
            60% off list at the top tier. Batch traffic bills at 50%.
          </Paragraph>
        </Container>
      </Section>

      <Section size="medium">
        <Container>
          <Columns isCentered>
            <Column sizeDesktop={8}>
              <SectionHeading eyebrow="FAQ" title="Questions we get asked" />
              {FAQS.map(faq => (
                <Box key={faq.q} mb="3">
                  <Collapse
                    trigger={
                      <IconText>
                        <Icon name="chevron-right" aria-hidden="true" />
                        <Span textWeight="semibold">{faq.q}</Span>
                      </IconText>
                    }
                  >
                    <Content textColor="grey" mt="3">
                      {faq.a}
                    </Content>
                  </Collapse>
                </Box>
              ))}
              <Paragraph
                textAlign="centered"
                textSize="7"
                textColor="grey"
                mt="6"
              >
                {DISCLAIMER}
              </Paragraph>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
