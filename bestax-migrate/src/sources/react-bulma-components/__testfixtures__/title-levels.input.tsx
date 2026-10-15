import React from "react";
import { Heading } from "react-bulma-components";

// RBC's Heading rendered an <h1> at every size, subtitle or not, or the
// element `renderAs` named. bestax renders the heading `size` names, so the
// size moves to textSize wherever `size` would change the element.
export const Levels = () => (
  <section>
    <Heading>h1</Heading>
    <Heading size={1}>h1, which size 1 renders too</Heading>
    <Heading size={4}>h1</Heading>
    <Heading subtitle size={6}>h1</Heading>
    <Heading renderAs="h3" size={3}>h3, which size 3 renders too</Heading>
    <Heading renderAs="h2" size="5">h2</Heading>
    <Heading renderAs="p" subtitle size={5}>p, which size never changes</Heading>
  </section>
);
