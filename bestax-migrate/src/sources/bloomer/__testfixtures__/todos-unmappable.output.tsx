import React from "react";
import { Box, Button, Columns, Title } from "@allxsmith/bestax-bulma";
// TODO(bestax-migrate): Nav, NavItem, NavLeft, Tile, withHelpersModifiers have no bestax-bulma equivalent yet — migrate and remove this import
import { Nav, NavItem, NavLeft, Tile, withHelpersModifiers } from "bloomer";
// TODO(bestax-migrate): `bloomer/lib/elements/Box` reaches into bloomer's internals; import the component from 'bloomer' first, then re-run the codemod
import "bloomer/lib/elements/Box";

const Plain = (props: { className?: string }) => <div {...props} />;
// TODO(bestax-migrate): `withHelpersModifiers` is referenced as a value; migrate this usage by hand
const Helped = withHelpersModifiers(Plain);

// TODO(bestax-migrate): `tag` — bloomer's `tag` renders a different HTML element; bestax declares `as` on only some components, and this is not one of them — render the tag directly or restructure (https://bestax.io/docs/api)
// TODO(bestax-migrate): `Tile` — Bulma v1 replaced tiles with the Grid/Cell components — see https://bestax.io/docs/api/grid and the migration guide https://bestax.io/docs/guides/getting-started/migration/bulma-0-9-to-1
// TODO(bestax-migrate): `Nav` — `Nav` is Bulma 0.4's `.nav`, which Bulma removed in 0.5 (bloomer kept the component); rebuild it with bestax's `Navbar` — `Nav` → `Navbar`, `NavLeft`/`NavRight` → `Navbar.Start`/`Navbar.End`, `NavItem` → `Navbar.Item`, `NavToggle` → `Navbar.Burger` (https://bestax.io/docs/api/components/navbar)
// TODO(bestax-migrate): `NavLeft` — `NavLeft` is Bulma 0.4's `.nav`, which Bulma removed in 0.5 (bloomer kept the component); rebuild it with bestax's `Navbar` — `Nav` → `Navbar`, `NavLeft`/`NavRight` → `Navbar.Start`/`Navbar.End`, `NavItem` → `Navbar.Item`, `NavToggle` → `Navbar.Burger` (https://bestax.io/docs/api/components/navbar)
// TODO(bestax-migrate): `NavItem` — `NavItem` is Bulma 0.4's `.nav`, which Bulma removed in 0.5 (bloomer kept the component); rebuild it with bestax's `Navbar` — `Nav` → `Navbar`, `NavLeft`/`NavRight` → `Navbar.Start`/`Navbar.End`, `NavItem` → `Navbar.Item`, `NavToggle` → `Navbar.Burger` (https://bestax.io/docs/api/components/navbar)
// TODO(bestax-migrate): Bulma v1 dropped the `.heading` styles, so this plain <p className="heading"> renders unstyled; restyle it with bestax helpers (e.g. `textSize="7" textTransform="uppercase" textWeight="semibold"`) or your own class
// TODO(bestax-migrate): `isGrid` — Bulma removed `columns.is-grid` in 0.5; bestax `Columns` has no equivalent — use `isMultiline` with sized Columns, or the Grid component
// TODO(bestax-migrate): `isLink` alongside `isColor`; bestax `Button` has one `color`, so pick `color="link"` or the other colour by hand
// TODO(bestax-migrate): `render` — bloomer's `render` prop injected the computed props into your own renderer; bestax has no render-prop escape hatch — render the markup directly (`useBulmaClasses` yields the helper classes) or wrap the component (https://bestax.io/docs/api/helpers/usebulmaclasses)
// TODO(bestax-migrate): `isFullWidth` — bestax declares `isFullWidth` on Button, Select, Table and Tabs only, and Bulma's `is-fullwidth` has no effect elsewhere — drop it, or add className="is-fullwidth" if your own CSS relied on the class
export const Leftovers = ({ go }: { go: (p: object) => JSX.Element }) => (
  <Box tag="section">
    <Tile isAncestor>
      <Tile isParent isSize={4}>
        <Tile isChild>tile</Tile>
      </Tile>
    </Tile>
    <Nav>
      <NavLeft>
        <NavItem isActive>Home</NavItem>
      </NavLeft>
    </Nav>
    <h6 className="heading">Label</h6>
    <div className="hero-video is-transparent">
      <video />
    </div>
    <Columns isGrid>
      <div />
    </Columns>
    <Button render={go} color="info">
      Rendered
    </Button>
    <Title size={3} isFullWidth>
      Wide
    </Title>
    <Helped isMarginless>helped</Helped>
  </Box>
);
