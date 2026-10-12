import { Box, Button, Buttons, Message } from "@allxsmith/bestax-bulma";
// TODO(bestax-migrate): Element, Tile have no bestax-bulma equivalent yet — migrate and remove this import
import { Element, Tile } from 'react-bulma-components';

// TODO(bestax-migrate): `Element` — no generic Element in bestax-bulma; use a semantic component (Block, Box, …) with helper props, or plain JSX with classNames — see https://bestax.io/docs/api/helpers/usebulmaclasses
// TODO(bestax-migrate): `Tile` — Bulma v1 replaced tiles with the Grid/Cell components — see https://bestax.io/docs/api/grid and the migration guide https://bestax.io/docs/guides/getting-started/migration/bulma-0-9-to-1
// TODO(bestax-migrate): `colorVariant` — no direct equivalent; use isLight (Button/Notification) or a color shade like textColor='primary-dark'
// TODO(bestax-migrate): `size="normal"` on `<Buttons>` is not a value bestax-bulma takes ('small', 'medium', 'large'); use one of those or drop it
// TODO(bestax-migrate): `size` on `<Message>` has a dynamic value, and bestax-bulma takes only 'small', 'medium', 'large'; make sure it can only be one of those
export const Legacy = ({
  align,
  size,
}: {
  align: 'left' | 'right';
  size: string;
}) => (
  <div>
    <Element renderAs="span" textColor="grey">
      Generic element
    </Element>
    <Tile kind="ancestor">
      <Tile kind="parent" vertical size={8}>
        <Tile kind="child">Tile child</Tile>
      </Tile>
    </Tile>
    <Box colorVariant="light" float={align} textSize="2">
      Dynamic and unmappable props
    </Box>
    <Buttons size="normal">
      <Button>Not a Buttons size</Button>
    </Buttons>
    <Message size={size}>
      <Message.Body>A size the codemod cannot read</Message.Body>
    </Message>
  </div>
);
