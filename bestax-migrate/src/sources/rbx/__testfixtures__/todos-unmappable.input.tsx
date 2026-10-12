import React from "react";
import { Tile, List, Generic, Fieldset, Numeric, Highlight, Footer, Button, Tag } from "rbx";

export const Unmappable = ({ size }: { size: "small" | "medium" }) => (
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
    <Tag.Group size="small">
      <Tag>not a Tags size</Tag>
    </Tag.Group>
    <Button.Group size={size}>
      <Button>a size the codemod cannot read</Button>
    </Button.Group>
  </Footer>
);
