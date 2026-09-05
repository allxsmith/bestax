import React from "react";
import { Box, Column, Columns, Container, Section } from "bloomer";

export const Helpers = ({ dim }: { dim: string }) => (
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
      <Box isDisplay={dim} isHidden={dim === "x"} isPulled="right" isOverlay isUnselectable>
        four
      </Box>
      <Box hasTextColor="white-ter" isHidden={false}>
        five
      </Box>
    </Container>
    <Columns isMultiline isVCentered isMobile>
      <Column isSize={4} isOffset={2}>
        a
      </Column>
      <Column isSize="1/2">b</Column>
      <Column isSize="narrow">c</Column>
      <Column isSize={{ default: "full", mobile: 8, tablet: "2/3", touch: "narrow" }} isOffset={{ desktop: "1/4" }}>
        d
      </Column>
      <Column isSize={{ touch: 6 }} isOffset={dim}>
        e
      </Column>
    </Columns>
  </Section>
);
