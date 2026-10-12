import React from "react";
import { Container, Divider, Footer, Hero, Section } from "rbx";

export const Layout = () => (
  <Container fluid breakpoint="desktop">
    <Section size="medium">
      <Hero color="primary" size="large">
        <Hero.Head>Head</Hero.Head>
        <Hero.Body>Body</Hero.Body>
        <Hero.Foot>Foot</Hero.Foot>
      </Hero>
      <Hero size="fullheight-with-navbar">
        <Hero.Body>Under a fixed navbar</Hero.Body>
      </Hero>
    </Section>
    <Divider />
    <Footer as="footer">Footer</Footer>
  </Container>
);
