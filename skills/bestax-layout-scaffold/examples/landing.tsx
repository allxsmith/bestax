// Marketing / landing page — Hero + stacked Sections + Footer.
// Each Section stacks vertically; the feature Columns collapse to one per row on
// mobile (Bulma columns stack below the tablet breakpoint).
import React from 'react';
import {
  Hero,
  Section,
  Container,
  Footer,
  Columns,
  Column,
  Box,
  Title,
  SubTitle,
  Content,
  Button,
  Buttons,
} from '@allxsmith/bestax-bulma';

const FEATURES = [
  { title: 'Fast', body: 'Ship pages in minutes, not days.' },
  { title: 'Responsive', body: 'Looks right on every screen by default.' },
  { title: 'Composable', body: 'Build from small, predictable pieces.' },
];

export default function LandingPage() {
  return (
    <>
      <Hero color="primary" size="medium">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="1">Ship faster with Acme</Title>
            <SubTitle size="3">
              The all-in-one platform for modern teams.
            </SubTitle>
            <Buttons isCentered mt="5">
              <Button color="light" size="large">
                Get started
              </Button>
              <Button color="primary" isInverted isOutlined size="large">
                Live demo
              </Button>
            </Buttons>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Title size="3" textAlign="centered" mb="6">
            Why Acme
          </Title>
          <Columns>
            {FEATURES.map(feature => (
              <Column key={feature.title}>
                <Box>
                  <Title size="5">{feature.title}</Title>
                  <Content>{feature.body}</Content>
                </Box>
              </Column>
            ))}
          </Columns>
        </Container>
      </Section>

      <Footer>
        <Container>
          <Content textAlign="centered">
            <p>
              <strong>Acme</strong> — built with bestax-bulma.
            </p>
          </Content>
        </Container>
      </Footer>
    </>
  );
}
