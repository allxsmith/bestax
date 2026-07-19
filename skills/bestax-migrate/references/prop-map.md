# Universal prop map (RBC modifier props → bestax helper props)

react-bulma-components spreads a modifier-prop set onto every component. bestax-bulma has
the same idea via `useBulmaClasses`, with these differences. The codemod applies all of
this automatically for literal values; dynamic values get TODOs.

## Renames and value changes

| RBC                               | bestax                                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderAs`                        | `as` — **only** on polymorphic components (Button, Title/SubTitle, Footer, Level.Item, Media\*, Menu.Item, Navbar.Item/Link, Dropdown.Item); elsewhere flagged |
| `domRef`                          | flagged — use a `ref` on a DOM child instead                                                                                                                   |
| `backgroundColor`                 | `bgColor`                                                                                                                                                      |
| `textColor`                       | `textColor` (same)                                                                                                                                             |
| `colorVariant`                    | flagged — use `isLight` or a color shade                                                                                                                       |
| `textSize={4}`                    | `textSize="4"` (string union `'1'`–`'7'`)                                                                                                                      |
| `textAlign="center"`              | `textAlign="centered"` (`justify`→`justified`)                                                                                                                 |
| `textFamily`                      | `fontFamily`                                                                                                                                                   |
| `italic`                          | `textTransform="italic"`                                                                                                                                       |
| `m/mt/…/py={3}`                   | `m="3"` (string union `'0'`–`'6'`)                                                                                                                             |
| `pull="right"`                    | `float="right"`                                                                                                                                                |
| `marginless` / `paddingless`      | `m="0"` / `p="0"`                                                                                                                                              |
| `clipped`                         | `overflow="clipped"`                                                                                                                                           |
| `radiusless` / `shadowless`       | `radius="radiusless"` / `shadow="shadowless"`                                                                                                                  |
| `unselectable`                    | `interaction="unselectable"`                                                                                                                                   |
| `hidden` / `invisible` / `srOnly` | `visibility="hidden"` / `"invisible"` / `"sr-only"`                                                                                                            |
| `display="hidden"`                | `visibility="hidden"`                                                                                                                                          |
| `display="relative"`              | boolean `relative`                                                                                                                                             |
| flexbox props                     | same names/values (`flexDirection`, `justifyContent`, …)                                                                                                       |
| `clearfix`, `overlay`             | same                                                                                                                                                           |

## Boolean modifier convention

RBC uses bare booleans (`loading`, `outlined`, `rounded`, `fullwidth`); bestax prefixes
with `is`/`has` (`isLoading`, `isOutlined`, `isRounded`, `isFullWidth`). Per-component
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
