import React from "react";
import { SubTitle, Title } from "@allxsmith/bestax-bulma";

// bloomer rendered Title as an <h1> and Subtitle as an <h2> at every isSize,
// or the element `tag` named. bestax renders the heading `size` names, so
// the size moves to textSize wherever `size` would change the element.
export const Levels = () => (
  <section>
    <Title>h1</Title>
    <Title size={1}>h1, which size 1 renders too</Title>
    <Title textSize="4">h1</Title>
    <Title textSize="4" as="h2">h2</Title>
    <Title size={4} as="h4">h4, which size 4 renders too</Title>
    <Title size={6} as="p">p, which size never changes</Title>
    <SubTitle as="h2">h2</SubTitle>
    <SubTitle size={2}>h2, which size 2 renders too</SubTitle>
    <SubTitle textSize="4" as="h2">h2</SubTitle>
    <SubTitle textSize="5" as="h3">h3</SubTitle>
  </section>
);
