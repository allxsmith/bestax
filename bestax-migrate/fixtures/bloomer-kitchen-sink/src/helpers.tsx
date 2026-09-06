import React from "react";
import { Box, Container, Section } from "bloomer";

export const Helpers = () => (
  <Section isSize="medium" isPaddingless>
    <Container isFluid hasTextAlign="centered" hasTextColor="grey-light">
      <Box isDisplay="flex-tablet" isHidden="touch" isClearfix>
        one
      </Box>
      <Box isDisplay={["inline-block", "flex-desktop-only"]} isHidden={["mobile", "widescreen-only"]}>
        two
      </Box>
      <Box isDisplay={{ flex: ["default", "tablet"], block: "mobile" }} isHidden isMarginless>
        three
      </Box>
      <Box isPulled="right" isOverlay isUnselectable hasTextColor="black-ter">
        four
      </Box>
    </Container>
  </Section>
);
