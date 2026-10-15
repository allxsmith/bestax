import React from "react";
import { Subtitle, Title } from "bloomer";

// bloomer rendered Title as an <h1> and Subtitle as an <h2> at every isSize,
// or the element `tag` named. bestax renders the heading `size` names, so
// the size moves to textSize wherever `size` would change the element.
export const Levels = () => (
  <section>
    <Title>h1</Title>
    <Title isSize={1}>h1, which size 1 renders too</Title>
    <Title isSize={4}>h1</Title>
    <Title isSize={4} tag="h2">h2</Title>
    <Title isSize={4} tag="h4">h4, which size 4 renders too</Title>
    <Title isSize={6} tag="p">p, which size never changes</Title>
    <Subtitle>h2</Subtitle>
    <Subtitle isSize={2}>h2, which size 2 renders too</Subtitle>
    <Subtitle isSize={4}>h2</Subtitle>
    <Subtitle isSize="5" tag="h3">h3</Subtitle>
  </section>
);
