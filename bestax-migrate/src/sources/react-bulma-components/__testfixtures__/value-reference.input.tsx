import { Block, Button, Tile } from 'react-bulma-components';

export function ValueRefs() {
  const LegacyTile = Tile;
  return (
    <div>
      <Button renderAs={Block}>Rendered as a Block</Button>
      <LegacyTile kind="parent">Old tile via alias</LegacyTile>
    </div>
  );
}
