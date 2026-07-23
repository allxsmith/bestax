import {
  Section,
  Container,
  Title,
  SubTitle,
  Columns,
  Column,
  Card,
  Button,
  Tag,
  Theme,
  Span,
  UnorderedList,
  ListItem,
} from '@allxsmith/bestax-bulma';
import { PRICING } from '../data';

function Tier({ tier }: { tier: (typeof PRICING)[number] }) {
  return (
    <Card flexGrow="1" flexShrink="1">
      <Card.Content>
        <Title size="5" mb="2">
          {tier.name}{' '}
          {tier.featured && (
            <Tag color="primary" ml="2">
              Most popular
            </Tag>
          )}
        </Title>
        <Span textColor="grey">{tier.blurb}</Span>

        <Title size="1" mt="4" mb="0">
          {tier.price}
          <Span textSize="6" textColor="grey" textWeight="normal">
            {tier.cadence}
          </Span>
        </Title>

        <UnorderedList mt="4" mb="5">
          {tier.features.map(f => (
            <ListItem key={f} mb="2">
              <Span textColor="primary" mr="2">
                ✓
              </Span>
              {f}
            </ListItem>
          ))}
        </UnorderedList>

        <Button
          color="primary"
          isInverted={!tier.featured}
          isFullWidth
          href="#waitlist"
        >
          {tier.cta}
        </Button>
      </Card.Content>
    </Card>
  );
}

export default function Pricing() {
  return (
    <Section id="pricing">
      <Container>
        <Title size="2" textAlign="centered">
          Simple, honest pricing
        </Title>
        <SubTitle size="5" textColor="grey" textAlign="centered" mb="6">
          A tenth of Fable&rsquo;s cost per token, at every tier
        </SubTitle>

        <Columns isVCentered>
          {PRICING.map(tier => (
            <Column key={tier.name} display="flex" flexDirection="column">
              {tier.featured ? (
                <Theme
                  bulmaVars={{
                    '--bulma-card-shadow':
                      '0 0 0 2px var(--bulma-primary), var(--bulma-shadow)',
                  }}
                >
                  <Tier tier={tier} />
                </Theme>
              ) : (
                <Tier tier={tier} />
              )}
            </Column>
          ))}
        </Columns>
      </Container>
    </Section>
  );
}
