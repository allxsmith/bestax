// Marketing / landing page — fixed top Navbar + Hero + stacked Sections + Footer.
// Each Section stacks vertically; the feature Columns collapse to one per row on
// mobile (Bulma columns stack below the tablet breakpoint).
//
// The Navbar's burger/menu is CONTROLLED: without `active` state wired to both
// `Navbar.Burger` and `Navbar.Menu`, the mobile menu can never open — desktop
// looks fine and nothing errors, so the failure is silent. A fixed-top navbar
// also needs the `has-navbar-fixed-top` class on <html> so the page is padded
// below it (never an inline padding offset) — Bulma requires this and the
// library does NOT add it for you.
import React, { useEffect, useState } from 'react';
import {
  Navbar,
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('has-navbar-fixed-top');
    return () => {
      document.documentElement.classList.remove('has-navbar-fixed-top');
    };
  }, []);

  return (
    <>
      <Navbar fixed="top">
        <Navbar.Brand>
          <Navbar.Item href="#">Acme</Navbar.Item>
          <Navbar.Burger
            active={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
            aria-label="menu"
            aria-expanded={menuOpen}
          />
        </Navbar.Brand>
        <Navbar.Menu active={menuOpen}>
          <Navbar.Start>
            <Navbar.Item href="#">Features</Navbar.Item>
            <Navbar.Item href="#">Pricing</Navbar.Item>
          </Navbar.Start>
          <Navbar.End>
            <Navbar.Item href="#">Sign in</Navbar.Item>
          </Navbar.End>
        </Navbar.Menu>
      </Navbar>

      <Hero color="primary" size="medium">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="1">Ship faster with Acme</Title>
            <SubTitle size="3">
              The all-in-one platform for modern teams.
            </SubTitle>
            {/* Both CTAs are FILLED: on a fixed-color hero a thin outlined
                button (light outline + light label) reads washed out, and
                worse under OS dark mode. isInverted (no isOutlined) gives a
                solid white button with primary text — high contrast in both
                schemes. */}
            <Buttons isCentered mt="5">
              <Button color="light" size="large">
                Get started
              </Button>
              <Button color="primary" isInverted size="large">
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
