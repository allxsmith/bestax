import { Column, Columns } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): no bestax-bulma helper variants for the `touch` breakpoint; restyle with CSS or drop it
export const Layout = () => (
  <Columns gap={4} isMultiline isMobile isCentered isVCentered>
    <Column size="half" offset="one-quarter" isNarrow>
      Main
    </Column>
    <Column
      touch={{ size: 10 }}
      sizeMobile={12}
      sizeTablet={6}
      isNarrowTablet
      sizeDesktop={4}
      offsetDesktop={2}>
      Side
    </Column>
  </Columns>
);
