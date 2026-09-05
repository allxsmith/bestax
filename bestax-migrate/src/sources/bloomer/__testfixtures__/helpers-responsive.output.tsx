import React from "react";
import { Box, Column, Columns, Container, Section } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): dropped `isDisplay`: it must be a string, array or object literal to flatten to bestax `display*` props, and bestax has no `isDisplay` — reapply it by hand
// TODO(bestax-migrate): `isHidden` has a dynamic value; set `visibility="hidden"` (or a per-viewport `visibility*`) conditionally by hand
// TODO(bestax-migrate): `hasTextColor="white-ter"` — `white-ter` is not a bestax colour; use `white` or a custom class (https://bestax.io/docs/api/helpers/usebulmaclasses)
// TODO(bestax-migrate): bestax `Column` has no `sizeTouch` prop (Bulma keeps the `is-*-touch` classes); add the class by hand
// TODO(bestax-migrate): `isOffset` has a dynamic value; set `offset` by hand (bestax takes numbers or the named sizes: "half", "one-third", …)
export const Helpers = ({ dim }: { dim: string }) => (
  <Section size="medium" p="0">
    <Container fluid textAlign="centered" textColor="grey-light">
      <Box displayTablet="flex" visibilityTouch="hidden" clearfix>
        one
      </Box>
      <Box
        display="inline-block"
        displayDesktopOnly="flex"
        visibilityMobile="hidden"
        visibilityWidescreenOnly="hidden">
        two
      </Box>
      <Box
        display="flex"
        displayTablet="flex"
        displayMobile="block"
        visibility="hidden"
        m="0">
        three
      </Box>
      <Box float="right" overlay interaction="unselectable">
        four
      </Box>
      <Box hasTextColor="white-ter">
        five
      </Box>
    </Container>
    <Columns isMultiline isVCentered isMobile>
      <Column size={4} offset={2}>
        a
      </Column>
      <Column size="half">b</Column>
      <Column isNarrow>c</Column>
      <Column
        size="full"
        sizeMobile={8}
        sizeTablet="two-thirds"
        isNarrowTouch
        offsetDesktop="one-quarter">
        d
      </Column>
      <Column>
        e
      </Column>
    </Columns>
  </Section>
);
