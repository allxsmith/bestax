import React from "react";
import { SubTitle, Title } from "@allxsmith/bestax-bulma";

// rbx's Title rendered an <h1> at every size, subtitle or not, or the element
// `as` named. bestax renders the heading `size` names, so the size moves to
// textSize wherever `size` would change the element.
export const Levels = () => (
  <section>
    <Title>h1</Title>
    <Title size={1}>h1, which size 1 renders too</Title>
    <Title textSize="4">h1</Title>
    <SubTitle textSize="6">h1</SubTitle>
    <Title as="h3" size={3}>h3, which size 3 renders too</Title>
    <Title as="h2" textSize="5">h2</Title>
    <SubTitle as="p" size={5}>p, which size never changes</SubTitle>
  </section>
);
