import React from "react";
import { Box, Button } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): `italic` maps to `textTransform="italic"`, but `textTransform` is already set on this element; reconcile by hand
// TODO(bestax-migrate): `textColor="white-ter"` — `white-ter` is not a bestax colour; use `white` or a custom class (https://bestax.io/docs/api/helpers/usebulmaclasses)
export const Helpers = () => (
  <Box
    bgColor="primary"
    textColor="grey-dark"
    textAlign="centered"
    textWeight="semibold"
    textSize="4"
    textTransform="uppercase"
    relative
    clearfix
    overlay
    float="right"
    m="0"
    p="0"
    radius="radiusless"
    shadow="shadowless"
    interaction="unselectable"
    overflow="clipped">
    <Button visibility="hidden">hidden</Button>
    <Button visibility="invisible">invisible</Button>
    <Button visibility="sr-only">screen readers only</Button>
    <Button textColor="white-ter">unsupported shade</Button>
  </Box>
);
