import React from "react";
import { Footer } from "@allxsmith/bestax-bulma";
// TODO(bestax-migrate): Fieldset, Generic, Highlight, List, Numeric, Tile have no bestax-bulma equivalent yet — migrate and remove this import
import { Tile, List, Generic, Fieldset, Numeric, Highlight } from "rbx";

// TODO(bestax-migrate): `Tile` — Bulma v1 replaced tiles with the Grid/Cell components — see https://bestax.io/docs/api/grid and the migration guide https://bestax.io/docs/guides/getting-started/migration/bulma-0-9-to-1
// TODO(bestax-migrate): `List` — rbx's `List` is the bulma-list extension, which Bulma v1 does not ship; use `<UnorderedList>` or `<Menu>` (https://bestax.io/docs/api/elements/unorderedlist)
// TODO(bestax-migrate): `List.Item` — rbx's `List.Item` is the bulma-list extension, which Bulma v1 does not ship; use `<UnorderedList.Item>` or `<Menu.Item>` (https://bestax.io/docs/api/elements/unorderedlist)
// TODO(bestax-migrate): `Generic` — `Generic` is rbx's untyped base element; render the underlying HTML tag directly, or use a bestax component (https://bestax.io/docs/api)
// TODO(bestax-migrate): `Fieldset` — bestax has no `Fieldset` component; render a plain <fieldset> (its `disabled` attribute works natively)
// TODO(bestax-migrate): `Numeric` — `Numeric` (locale number formatting) has no bestax equivalent; use Intl.NumberFormat directly
// TODO(bestax-migrate): `Highlight` — `Highlight` (syntax-highlighted <pre>) has no bestax equivalent; use `<Pre>` plus your own highlighter (https://bestax.io/docs/api/elements/pre)
export const Unmappable = () => (
  <Footer>
    <Tile kind="ancestor">
      <Tile kind="parent" vertical>
        tile
      </Tile>
    </Tile>
    <List>
      <List.Item active>item</List.Item>
    </List>
    <Generic as="section">generic</Generic>
    <Fieldset disabled>fields</Fieldset>
    <Numeric>{1000}</Numeric>
    <Highlight>{"const a = 1;"}</Highlight>
  </Footer>
);
