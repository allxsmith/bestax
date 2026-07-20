import { Block, Button } from "@allxsmith/bestax-bulma";
// TODO(bestax-migrate): Tile has no bestax-bulma equivalent yet — migrate and remove this import
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
