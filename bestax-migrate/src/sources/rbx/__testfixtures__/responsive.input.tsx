import React from "react";
import { Box, Column, Generic } from "rbx";

export const Responsive = () => (
  <Column.Group centered multiline gapSize={4} tablet={{ gapSize: 2 }}>
    <Column size={4} offset={1} tablet={{ size: 6, narrow: true }}>
      one
    </Column>
    <Column narrow desktop={{ size: "one-third" }} touch={{ size: 12 }}>
      two
    </Column>
  </Column.Group>
);

export const Hidden = () => (
  <Box
    responsive={{
      mobile: { hide: { value: true } },
      tablet: { display: { value: "flex" }, textSize: { value: 5 } },
      desktop: { textAlign: { value: "centered" }, display: { value: "block", only: true } },
    }}
  >
    x
  </Box>
);

// Generic is unmappable, so it short-circuits before the responsive pass.
export const Untouched = () => (
  <Generic responsive={{ mobile: { hide: { value: true } } }}>x</Generic>
);
