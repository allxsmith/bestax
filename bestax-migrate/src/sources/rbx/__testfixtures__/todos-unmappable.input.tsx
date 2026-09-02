import React from "react";
import { Tile, List, Generic, Fieldset, Numeric, Highlight, Footer } from "rbx";

export const Unmappable = () => (
  <Footer>
    <Tile kind="ancestor">
      <Tile kind="parent" vertical>
        tile
      </Tile>
    </Tile>
    <List>
      <List.Item active>item</List.Item>
    </List>
    <Generic as="section">generic</Generic>
    <Fieldset disabled>fields</Fieldset>
    <Numeric>{1000}</Numeric>
    <Highlight>{"const a = 1;"}</Highlight>
  </Footer>
);
