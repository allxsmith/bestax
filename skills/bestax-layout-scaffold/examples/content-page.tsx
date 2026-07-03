// Idiomatic marketing content page: hero + feature cards + CTA.
//
// The point of this example is HOW to style with the library, not just what to
// render. Two rules it demonstrates:
//   1. `ConfigProvider` wraps the page once so <Icon> needs no `library` prop.
//   2. Spacing, alignment, and color use HELPER PROPS — never inline `style`.
//      e.g. mt="4" (1rem) instead of style={{ marginTop: '1rem' }},
//           textAlign="centered" instead of style={{ textAlign: 'center' }},
//           textColor="grey" instead of style={{ color: '#…' }}.
import React from 'react';
import {
  ConfigProvider,
  Hero,
  Container,
  Section,
  Columns,
  Column,
  Card,
  Title,
  SubTitle,
  Content,
  Button,
  Buttons,
  Icon,
  IconText,
} from '@allxsmith/bestax-bulma';

const features = [
  { icon: 'bolt', name: 'Fast', blurb: 'Ships lean CSS and a tiny runtime.' },
  {
    icon: 'shield',
    name: 'Solid',
    blurb: 'Typed props and tested components.',
  },
  {
    icon: 'wand-magic-sparkles',
    name: 'Themeable',
    blurb: 'Recolor with CSS variables.',
  },
];

export default function ContentPage() {
  return (
    <ConfigProvider iconLibrary="fa">
      <Hero color="primary" size="medium">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="1">Build faster with bestax</Title>
            <SubTitle size="3" mt="4">
              A Bulma component library for React.
            </SubTitle>
            <Buttons isCentered mt="5">
              <Button color="light" size="large">
                Get started
              </Button>
              <Button color="light" size="large" isOutlined>
                View docs
              </Button>
            </Buttons>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Title size="2" textAlign="centered" mb="6">
            Why teams choose it
          </Title>
          <Columns>
            {features.map(f => (
              <Column key={f.name} display="flex">
                <Card>
                  <Card.Content>
                    <IconText mb="3">
                      <Icon name={f.icon} textColor="primary" />
                      <Title size="4" mb="2">
                        {f.name}
                      </Title>
                    </IconText>
                    <Content textColor="grey">{f.blurb}</Content>
                  </Card.Content>
                </Card>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>
    </ConfigProvider>
  );
}
