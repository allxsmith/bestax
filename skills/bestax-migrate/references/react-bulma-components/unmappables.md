# Recipes for every TODO(bestax-migrate) the codemod leaves

Work through `grep -rn "TODO(bestax-migrate)" src/` with these. Delete each comment once
the site is converted.

## `unsupported-file` — `.astro` / `.vue` / `.svelte` / `.mdx` imports

The codemod can't parse these formats, so files in them that import
react-bulma-components are reported (not rewritten). Migrate them by hand: swap the
import to `@allxsmith/bestax-bulma` and apply the same renames the component/prop maps
describe — the mapping is identical, only the rewriting is manual.

## `peer-deps` — install-blocking version conflicts

Reported from package.json, not a code TODO. bestax-bulma's peers: **React ^18 || ^19**
(upgrade react/react-dom before installing — RBC v4 also ran on 17) and optional
**@fortawesome/fontawesome-free ^6.7 || ^7** (FA 5 apps: upgrade, or
`npm install --legacy-peer-deps` and keep FA 5 for your own `<i>` tags).

## `Element` — no generic element

bestax has no `Element`. Pick the semantic component (`Block`, `Box`, `Content`, …) that
matches the usage, or plain JSX with classes:

```tsx
// Before
<Element renderAs="span" textColor="grey" m={2}>…</Element>
// After
<Span textColor="grey" m="2">…</Span>   // bestax exports Span/Paragraph/Strong/etc.
```

## `Tile` — Bulma v1 replaced tiles with Grid

Convert ancestor/parent/child tile trees to `Grid`/`Cell` (docs:
https://bestax.io/docs/api/grid):

```tsx
// Before
<Tile kind="ancestor"><Tile kind="parent" size={8}><Tile kind="child">A</Tile></Tile></Tile>
// After
<Grid><Cell colSpan={8}>A</Cell></Grid>
```

Match the old proportions with `Cell` span props; tiles' `vertical` becomes grid flow.

## Controlled `Dropdown` (`value` / `onChange`, `Dropdown.Item value`)

bestax `Dropdown` is compositional — you own the selection state:

```tsx
const [choice, setChoice] = useState('a');
<Dropdown label={labels[choice]} closeOnClick>
  <Dropdown.Item active={choice === 'a'} onClick={() => setChoice('a')}>
    First
  </Dropdown.Item>
  <Dropdown.Item active={choice === 'b'} onClick={() => setChoice('b')}>
    Second
  </Dropdown.Item>
</Dropdown>;
```

## `Pagination` extras (`delta`, `next`/`previous`, `showFirstLast`, `showPrevNext`, `autoHide`)

bestax `Pagination` renders from `total`/`current`/`onPageChange` with its own windowing.
Drop `delta` (built-in), render conditionally instead of `autoHide`
(`{total > 1 && <Pagination …/>}`), and compose `Pagination.Previous`/`Pagination.Next`
manually if custom labels are essential.

## `Modal` (`closeOnEsc`, `closeOnBlur`, `showClose`)

bestax `Modal` already closes on Esc and background click and shows the close button
whenever `onClose` is set — usually just delete these props. To hide the close button,
omit `onClose` and render your own close control.

## `touch` / `untilWidescreen` / `untilFullhd` / `{ only: true }` breakpoints

No bestax helper-prop variants exist. Use Bulma classes directly:
`className="is-hidden-touch"`, `is-flex-tablet-only`, etc. (all still exist in Bulma v1).

## Icon children the parser couldn't read

bestax `Icon` renders from `name` + `library` (+ `variant` for Font Awesome styles):

```tsx
<Icon name="github" library="fa" variant="brands" ariaLabel="GitHub" />
```

For icon fonts other than Font Awesome/MDI, see the `bestax-icons` skill.

## Dynamic values (`state={x}`, `textSize={n}`, `align={side}`, …)

The codemod only rewrites literals. Convert the expression at its source, e.g.:

```tsx
// Before: <Button state={hovered ? 'hover' : undefined}>
<Button isHovered={hovered}>
// Before: <Block textSize={n}>
<Block textSize={String(n) as '1' | '2' | '3' | '4' | '5' | '6' | '7'}>
```

## Button shade colors (`black-bis`, `grey-light`, …) and `isSelected`

bestax `Button` colors are the semantic set + `text`/`ghost`. For shades use
`bgColor`/`textColor` (they accept the full palette incl. shades), and replace
`isSelected` with `className="is-selected"` inside grouped buttons.

## `colorVariant` / Hero `gradient` / Hero `halfheight`

- `colorVariant="light"` → `isLight` where supported (Button, Notification), otherwise a
  shade: `bgColor="primary-90"`.
- Bulma v1 removed `is-bold` hero gradients — delete `gradient` or restyle with CSS.
- `halfheight` has no bestax size; use `size="medium"` or a CSS height.

## `domRef`

bestax components don't take `domRef`, but many forward a plain `ref` — the form controls
and `Button`, `LinkButton`, `Modal`, `Dropdown`, `Navbar` (plus `Navbar.Burger` and
`Navbar.Link`), `Dialog`, `Sidebar`, `Toast` and `Carousel`. On those, rename `domRef` to
`ref` and it works; do not restructure the markup. Everywhere else there is no ref to
forward — attach the ref to a DOM element inside, or wrap the component in a `<div ref={…}>`.

The codemod does not do that rename for you: `domRef` is flagged on every component, so the
TODO names both cases and you pick. `Navbar.Dropdown` is the trap — RBC's is the menu itself,
so it maps to bestax's `Navbar.DropdownMenu`, which forwards no ref.

## Helper props dropped from plain-element replacements

Where the codemod produced a plain element (`Form.Label` → `<label>`, `Breadcrumb.Item` →
`<li>`, `Table.Container` fallback `<div>`), Bulma helper props were dropped with a TODO.
Re-express them as classes: `m={2}` → `className="m-2"`, `textAlign="center"` →
`className="has-text-centered"`.
