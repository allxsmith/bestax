import {
  Box,
  Button,
  Card,
  Cell,
  Collapse,
  Column,
  Columns,
  Container,
  Content,
  Grid,
  Hero,
  Icon,
  IconText,
  Link,
  ListItem,
  Paragraph,
  Section,
  Span,
  SubTitle,
  Tag,
  Theme,
  Title,
  UnorderedList,
} from '@allxsmith/bestax-bulma';
import { FAQS, PLANS } from '../data/site';

export function Pricing() {
  return (
    <>
      <Hero size="medium" className="hero-wash">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="1">Pricing</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              A platform fee for the capabilities, per-token usage for the
              traffic. No seat licences, no minimum commit below Enterprise.
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
            fixedColsFullhd={4}
            gap={5}
          >
            {PLANS.map(plan => {
              const card = (
                <Card flexGrow="1" display="flex" flexDirection="column">
                  <Card.Content>
                    {/* The unfeatured cards keep an invisible badge so every
                        plan's price sits on the same baseline. */}
                    <Tag
                      color="primary"
                      isRounded
                      mb="3"
                      visibility={plan.featured ? undefined : 'invisible'}
                      aria-hidden={plan.featured ? undefined : true}
                    >
                      Most popular
                    </Tag>
                    <Title as="p" size="4" mb="2">
                      {plan.name}
                    </Title>
                    <Title as="p" size="2" mb="1">
                      {plan.price}
                    </Title>
                    <Span textColor="grey" textSize="7" display="block" mb="4">
                      {plan.cadence}
                    </Span>
                    <Paragraph textColor="grey" mb="4">
                      {plan.blurb}
                    </Paragraph>
                    <Button
                      as="a"
                      href="#/access"
                      color={plan.featured ? 'primary' : 'dark'}
                      isOutlined={!plan.featured}
                      isFullWidth
                      mb="4"
                    >
                      {plan.cta}
                    </Button>
                    <UnorderedList>
                      {plan.features.map(feature => (
                        <ListItem key={feature} mb="2">
                          <IconText>
                            <Icon
                              name="check"
                              textColor="primary"
                              aria-hidden="true"
                            />
                            <Span textSize="7">{feature}</Span>
                          </IconText>
                        </ListItem>
                      ))}
                    </UnorderedList>
                  </Card.Content>
                </Card>
              );

              return (
                <Cell key={plan.name} display="flex" flexDirection="column">
                  {plan.featured ? (
                    // Scoped ring on the featured card — a component-level
                    // --bulma-* override, so it follows Theme and dark mode.
                    <Theme
                      display="flex"
                      flexGrow="1"
                      bulmaVars={{
                        '--bulma-card-shadow':
                          '0 0 0 2px var(--bulma-primary), var(--bulma-shadow)',
                      }}
                    >
                      {card}
                    </Theme>
                  ) : (
                    card
                  )}
                </Cell>
              );
            })}
          </Grid>

          <Paragraph textColor="grey" textSize="7" textAlign="centered" mt="5">
            All plans bill usage per million tokens — see the{' '}
            <Link href="#/platform">model lineup</Link> for per-model rates.
            Annual prepay saves 15%.
          </Paragraph>
        </Container>
      </Section>

      <Section size="large" className="section-alt">
        <Container>
          <Columns isCentered>
            <Column sizeDesktop={8}>
              <Title size="2" textAlign="centered" mb="6">
                What every plan includes
              </Title>
              <Box p="5">
                <Grid isFixed fixedColsMobile={1} fixedColsTablet={2} gap={4}>
                  {[
                    'Zero data retention',
                    'Streaming responses',
                    'Structured JSON output',
                    'Tool orchestration',
                    'Context caching',
                    'Batch endpoint at 50%',
                    'OpenTelemetry export',
                    'Dated model snapshots',
                  ].map(item => (
                    <Cell key={item}>
                      <IconText>
                        <Icon
                          name="circle-check"
                          textColor="primary"
                          aria-hidden="true"
                        />
                        <Span>{item}</Span>
                      </IconText>
                    </Cell>
                  ))}
                </Grid>
              </Box>
            </Column>
          </Columns>
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
                  mb="3"
                  trigger={
                    <Box p="4">
                      <IconText>
                        <Icon
                          name="angle-right"
                          textColor="primary"
                          aria-hidden="true"
                        />
                        <Span textWeight="semibold">{faq.q}</Span>
                      </IconText>
                    </Box>
                  }
                >
                  <Content textColor="grey" px="4" py="4" mb="0">
                    {faq.a}
                  </Content>
                </Collapse>
              ))}
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
