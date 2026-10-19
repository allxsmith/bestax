# Universal prop map (RBC modifier props → bestax helper props)

react-bulma-components spreads a modifier-prop set onto every component. bestax-bulma has
the same idea via `useBulmaClasses`, with these differences. The codemod applies all of
this automatically for literal values; dynamic values get TODOs.

## Renames and value changes

| RBC                               | bestax                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `renderAs`                        | `as` — **only** where bestax declares one ([listed below](#renderas--as-and-the-props-that-follow-it)); elsewhere flagged |
| `domRef`                          | flagged — rename to `ref` on the components that forward one, else use a DOM child                                        |
| `backgroundColor`                 | `bgColor`                                                                                                                 |
| `textColor`                       | `textColor` (same)                                                                                                        |
| `colorVariant`                    | flagged — use `isLight` or a color shade                                                                                  |
| `textSize={4}`                    | `textSize="4"` (string union `'1'`–`'7'`)                                                                                 |
| `textAlign="center"`              | `textAlign="centered"` (`justify`→`justified`)                                                                            |
| `textFamily`                      | `fontFamily`                                                                                                              |
| `italic`                          | `textTransform="italic"`                                                                                                  |
| `m/mt/…/py={3}`                   | `m="3"` (string union `'0'`–`'6'`)                                                                                        |
| `pull="right"`                    | `float="right"`                                                                                                           |
| `marginless` / `paddingless`      | `m="0"` / `p="0"`                                                                                                         |
| `clipped`                         | `overflow="clipped"`                                                                                                      |
| `radiusless` / `shadowless`       | `radius="radiusless"` / `shadow="shadowless"`                                                                             |
| `unselectable`                    | `interaction="unselectable"`                                                                                              |
| `hidden` / `invisible` / `srOnly` | `visibility="hidden"` / `"invisible"` / `"sr-only"`                                                                       |
| `display="hidden"`                | `visibility="hidden"`                                                                                                     |
| `display="relative"`              | boolean `relative`                                                                                                        |
| flexbox props                     | same names/values (`flexDirection`, `justifyContent`, …)                                                                  |
| `clearfix`, `overlay`             | same                                                                                                                      |

## `renderAs` → `as`, and the props that follow it

`renderAs` becomes `as` on the components bestax declares one on: `Button`, `Title` and
`SubTitle` (from `Heading`), `Image`, `Form.Control`, `Footer`, `Level.Item`, `Media` and its
`Item`s, `Menu.Item`, `Navbar.Item`, `Navbar.Link`, `Dropdown.Item`, `Container`, `Hero`,
`Hero.Header`, `Hero.Footer`, `Panel` and `Panel.Block`. Everywhere else it is flagged.

bestax gives an element the attributes of the tag `as` names, and several components narrow
`as` to the tags Bulma's markup allows there (`Footer` is `'footer' | 'div'`, `Control` is
`'div' | 'p'`, `Level.Item` is `'div' | 'p' | 'a'`). RBC's `renderAs` took any tag, so two
shapes cannot carry across:

- a `renderAs` outside that union — `<Media renderAs="section">` — drops the `as` with a
  `prop:as` TODO naming the tags the component does render;
- an `href` beside a `renderAs` that is not an `<a>` (`<Menu.List.Item renderAs="span"
href="/x">`) keeps the element and drops the `href`, with a `prop:href` TODO. RBC rendered
  a `<span href="/x">` there, which navigates nowhere in any browser, so nothing working is
  lost. Drop the `renderAs` where the link was the point.

`<Button href="/x">` with no `renderAs` goes the same way: bestax's `Button` renders a
`<button>`. Set `as="a"` to make it a link.

## `Heading` sizes

RBC's `Heading` rendered an `<h1>` at every size, subtitle or not, or the element `renderAs`
named. bestax's `Title` and `SubTitle` render the heading their `size` names unless `as="p"`, so
the codemod keeps the element RBC rendered:

| RBC                                        | bestax-bulma                   | renders |
| ------------------------------------------ | ------------------------------ | ------- |
| `<Heading size={4}>`                       | `<Title textSize="4">`         | `<h1>`  |
| `<Heading size={1}>`                       | `<Title size="1">`             | `<h1>`  |
| `<Heading subtitle size={6}>`              | `<SubTitle textSize="6">`      | `<h1>`  |
| `<Heading renderAs="h2" size={5}>`         | `<Title as="h2" textSize="5">` | `<h2>`  |
| `<Heading renderAs="p" subtitle size={5}>` | `<SubTitle as="p" size="5">`   | `<p>`   |

`size` stays only where it renders the same element: a `<p>`, or the heading the size names.
Everywhere else the size moves to the `textSize` helper, and so does a 7, which bestax's `size`
does not take. The helper sets the same font size through Bulma's `is-size-4` class rather than the
title's own `is-4`, so a rule of your own that targets `.title.is-4` needs the new class too.
`is-size-4` is also `!important`, so a font size your own CSS gives the title, such as
`.hero .title`, now loses to it where it used to beat `is-4`. A literal outside 1 to 7 keeps `size`
and gets a `prop:size` TODO.

## Boolean modifier convention

RBC uses bare booleans (`loading`, `outlined`, `rounded`, `fullwidth`); bestax prefixes
with `is`/`has` (`isLoading`, `isOutlined`, `isRounded`, `isFullwidth`). Per-component
tables live in [component-map.md](component-map.md).

## Responsive breakpoint objects → flat per-viewport props

| RBC                                                                           | bestax                                                      |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `mobile={{ display: 'flex' }}`                                                | `displayMobile="flex"`                                      |
| `tablet={{ textSize: 5 }}`                                                    | `textSizeTablet="5"`                                        |
| `desktop={{ textAlign: 'center' }}`                                           | `textAlignDesktop="centered"`                               |
| `widescreen={{ invisible: true }}`                                            | `visibilityWidescreen="invisible"`                          |
| `Columns.Column mobile={{ size: 4, offset: 2, narrow: true }}`                | `sizeMobile={4} offsetMobile={2} isNarrowMobile`            |
| `Columns tablet={{ gap: 3 }}`                                                 | `gapTablet={3}`                                             |
| `touch={{…}}`, `untilWidescreen={{…}}`, `untilFullhd={{…}}`, `{ only: true }` | flagged — no bestax helper variants; use `className` or CSS |
