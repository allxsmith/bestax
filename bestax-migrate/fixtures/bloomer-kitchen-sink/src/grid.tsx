import React from "react";
import { Column, Columns } from "bloomer";

export const Grid = () => (
  <>
    <Columns isMultiline isVCentered isMobile>
      <Column isSize={4} isOffset={2}>
        a
      </Column>
      <Column isSize="1/2">b</Column>
      <Column isSize="narrow">c</Column>
      <Column isSize={{ default: "full", mobile: 8, tablet: "2/3", touch: "narrow" }} isOffset={{ desktop: "1/4" }}>
        d
      </Column>
    </Columns>
    <Columns isDesktop isGapless isCentered>
      <Column isSize="3/4">e</Column>
    </Columns>
  </>
);
