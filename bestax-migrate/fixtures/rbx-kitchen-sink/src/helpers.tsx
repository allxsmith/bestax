import React from "react";
import { Box, Button, Image } from "rbx";

export const Helpers = () => (
  <Box
    backgroundColor="primary"
    textColor="grey-dark"
    textAlign="centered"
    textWeight="bold"
    textSize={5}
    textTransform="uppercase"
    marginless
    paddingless
    radiusless
    shadowless
    relative
    unselectable
    clearfix
    clipped
    overlay
    pull="left"
    responsive={{
      mobile: { hide: { value: true } },
      tablet: { display: { value: "flex" }, textSize: { value: 6 } },
    }}
  >
    <Button hidden>hidden</Button>
    <Button invisible>invisible</Button>
    <Button srOnly>sr only</Button>
    <Button italic>italic</Button>
    <Button badge="4" badgeColor="danger">
      badge
    </Button>
    <Button tooltip="Help" tooltipPosition="right" tooltipColor="info" tooltipMultiline>
      tooltip
    </Button>
    <Image.Container size={128}>
      <Image src="/a.png" rounded />
    </Image.Container>
  </Box>
);
