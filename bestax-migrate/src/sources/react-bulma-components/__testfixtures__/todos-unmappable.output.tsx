import { Box } from "@allxsmith/bestax-bulma";
// TODO(bestax-migrate): Element, Tile have no bestax-bulma equivalent yet — migrate and remove this import
import { Element, Tile } from 'react-bulma-components';

// TODO(bestax-migrate): `Element` — no generic Element in bestax-bulma; use a semantic component (Block, Box, …) with helper props, or plain JSX with classNames — see https://bestax.io/docs/api/helpers/usebulmaclasses
// TODO(bestax-migrate): `Tile` — Bulma v1 replaced tiles with the Grid/Cell components — see https://bestax.io/docs/api/grid/grid and the migration guide https://bestax.io/docs/guides/getting-started/migration/bulma-0-9-to-1
// TODO(bestax-migrate): `colorVariant` — no direct equivalent; use isLight (Button/Notification) or a color shade like textColor='primary-dark'
export const Legacy = ({ align }: { align: 'left' | 'right' }) => (
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
  </div>
);
