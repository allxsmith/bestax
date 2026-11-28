import { Block, Button } from "@allxsmith/bestax-bulma";
// TODO(bestax-migrate): Tile is still imported for what the other TODOs in this file flag; resolve those, then remove this import
import { Tile } from 'react-bulma-components';

export function ValueRefs() {
  // TODO(bestax-migrate): `Tile` is referenced as a value; migrate this usage by hand
  const LegacyTile = Tile;
  return (
    <div>
      <Button as={Block}>Rendered as a Block</Button>
      <LegacyTile kind="parent">Old tile via alias</LegacyTile>
    </div>
  );
}
