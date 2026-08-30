import React from "react";
import { Column } from "rbx";

export const Grid = () => (
  <Column.Group centered multiline vcentered gapless gapSize={4} tablet={{ gapSize: 2 }}>
    <Column size={4} offset={1} tablet={{ size: 6, narrow: true }}>
      one
    </Column>
    <Column narrow desktop={{ size: "one-third", offset: 2 }}>
      two
    </Column>
  </Column.Group>
);
