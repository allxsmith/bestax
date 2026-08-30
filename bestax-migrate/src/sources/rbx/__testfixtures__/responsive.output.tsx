import React from "react";
import { Box, Column, Columns } from "@allxsmith/bestax-bulma";
// TODO(bestax-migrate): Generic has no bestax-bulma equivalent yet — migrate and remove this import
import { Generic } from "rbx";

// TODO(bestax-migrate): no bestax-bulma column variants for the `touch` breakpoint; restyle with CSS or drop it
export const Responsive = () => (
  <Columns gap={4} gapTablet={2} isCentered isMultiline>
    <Column size={4} offset={1} sizeTablet={6} isNarrowTablet>
      one
    </Column>
    <Column touch={{ size: 12 }} sizeDesktop="one-third" isNarrow>
      two
    </Column>
  </Columns>
);

// TODO(bestax-migrate): `responsive.desktop.display.only` (Bulma's `-only` classes) has no bestax prop; use className
// TODO(bestax-migrate): dropped the `responsive` prop; the `desktop` settings above could not be converted and bestax's own `responsive` prop is unrelated (`'mobile' | 'narrow'`)
export const Hidden = () => (
  <Box
    visibilityMobile="hidden"
    displayTablet="flex"
    textSizeTablet="5"
    textAlignDesktop="centered">
    x
  </Box>
);

// Generic is unmappable, so it short-circuits before the responsive pass.
// TODO(bestax-migrate): `Generic` — `Generic` is rbx's untyped base element; render the underlying HTML tag directly, or use a bestax component (https://bestax.io/docs/api)
export const Untouched = () => (
  <Generic responsive={{ mobile: { hide: { value: true } } }}>x</Generic>
);
