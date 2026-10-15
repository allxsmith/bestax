import React from "react";
import { Title } from "rbx";

// rbx's Title rendered an <h1> at every size, subtitle or not, or the element
// `as` named. bestax renders the heading `size` names, so the size moves to
// textSize wherever `size` would change the element.
export const Levels = () => (
  <section>
    <Title>h1</Title>
    <Title size={1}>h1, which size 1 renders too</Title>
    <Title size={4}>h1</Title>
    <Title subtitle size={6}>h1</Title>
    <Title as="h3" size={3}>h3, which size 3 renders too</Title>
    <Title as="h2" size={5}>h2</Title>
    <Title as="p" subtitle size={5}>p, which size never changes</Title>
    <Title as="p" size={7}>p, where size 7 would lose its class</Title>
  </section>
);
