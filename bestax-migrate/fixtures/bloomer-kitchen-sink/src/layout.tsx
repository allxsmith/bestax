import React from "react";
import {
  Container,
  Footer,
  Hero,
  HeroBody,
  HeroFooter,
  HeroHeader,
  HeroVideo,
  Section,
} from "bloomer";

export const Layout = () => (
  <>
    <Hero isColor="primary" isSize="medium">
      <HeroHeader>Head</HeroHeader>
      <HeroBody>Body</HeroBody>
      <HeroFooter>Foot</HeroFooter>
    </Hero>
    <Hero isFullHeight isColor="dark">
      <HeroVideo isTransparent>
        <video />
      </HeroVideo>
      <HeroBody>Tall</HeroBody>
    </Hero>
    <Section isSize="large">
      <Container isFluid>Wide</Container>
    </Section>
    <Footer tag="div">Bye</Footer>
  </>
);
