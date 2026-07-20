import { Block, Box } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): `italic` maps to `textTransform="italic"`, but `textTransform` is already set on this element; reconcile by hand
// TODO(bestax-migrate): `marginless` maps to `m="0"`, but `m` is already set on this element; reconcile by hand
// TODO(bestax-migrate): no bestax-bulma helper variants for the `touch` breakpoint; restyle with CSS or drop it
export const Helpers = () => (
  <div>
    <Box
      textColor="primary"
      bgColor="dark"
      textSize="4"
      textAlign="centered"
      textTransform="uppercase"
      textWeight="semibold"
      fontFamily="monospace"
      m="3"
      px="2"
      float="right"
      clearfix
      overflow="clipped"
      radius="radiusless"
      shadow="shadowless"
      interaction="unselectable"
      visibility="sr-only">
      Kitchen sink of helpers
    </Box>
    <Block
      display="flex"
      justifyContent="center"
      alignItems="center"
      touch={{ display: 'block' }}
      displayMobile="flex"
      textSizeMobile="5"
      textAlignMobile="centered"
      visibilityTablet="invisible">
      Flex and responsive
    </Block>
  </div>
);
