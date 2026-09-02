import React from "react";
import { Box, Button } from "rbx";

export const Helpers = () => (
  <Box
    backgroundColor="primary"
    textColor="grey-dark"
    textAlign="centered"
    textWeight="semibold"
    textSize={4}
    textTransform="uppercase"
    italic
    marginless
    paddingless
    radiusless
    shadowless
    relative
    unselectable
    clearfix
    clipped
    overlay
    pull="right"
  >
    <Button hidden>hidden</Button>
    <Button invisible>invisible</Button>
    <Button srOnly>screen readers only</Button>
    <Button textColor="white-ter">unsupported shade</Button>
  </Box>
);
