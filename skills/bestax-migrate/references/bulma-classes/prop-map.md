# Bulma classes → bestax-bulma prop map

Which class becomes which prop, per component, then the helper classes every component takes.
A class that becomes no prop stays in `className`. So does a second class for a prop already
written (`is-small is-large` keeps `is-large`), so the element still renders both.

`{viewport}` is one of `mobile`, `tablet`, `desktop`, `widescreen`, `fullhd` unless a row says
otherwise, and the prop takes the matching suffix: `is-6-tablet` → `sizeTablet="6"`.

## Component classes

### `.button` → `Button`

| Classes                                                                                                                               | Prop                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `is-primary`, `is-link`, `is-info`, `is-success`, `is-warning`, `is-danger`, `is-white`, `is-dark`, `is-black`, `is-text`, `is-ghost` | `color`                                                          |
| `is-small`, `is-normal`, `is-medium`, `is-large`                                                                                      | `size`                                                           |
| `is-light`                                                                                                                            | `isLight`                                                        |
| `is-rounded`, `is-loading`, `is-static`, `is-outlined`, `is-inverted`                                                                 | `isRounded`, `isLoading`, `isStatic`, `isOutlined`, `isInverted` |
| `is-focused`, `is-active`, `is-hovered`                                                                                               | `isFocused`, `isActive`, `isHovered`                             |
| `is-fullwidth`                                                                                                                        | `isFullwidth`                                                    |

`is-disabled` stays a class: `isDisabled` also writes `disabled` or `aria-disabled`, which the
element did not have. On any tag but `<button>`, bestax takes the element's `as`
(`<a className="button">` → `<Button as="a">`).

### `.buttons` → `Buttons`, `.tags` → `Tags`

| Classes                                | Prop                                |
| -------------------------------------- | ----------------------------------- |
| `is-centered`, `is-right` (Buttons)    | `isCentered`, `isRight`             |
| `has-addons`                           | `hasAddons`                         |
| `are-small`, `are-medium`, `are-large` | `size` (Tags: `medium` and `large`) |

### `.columns` → `Columns`

| Classes                                                                | Prop                                                              |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `is-centered`, `is-gapless`, `is-multiline`, `is-mobile`, `is-desktop` | `isCentered`, `isGapless`, `isMultiline`, `isMobile`, `isDesktop` |
| `is-vcentered`                                                         | `isVCentered`                                                     |
| `is-0` … `is-8`                                                        | `gap`                                                             |
| `is-0-{viewport}` … `is-8-{viewport}`                                  | `gap{Viewport}`                                                   |

### `.column` → `Column`

Sizes are `1` to `12`, `full`, `half`, `one-third`, `two-thirds`, `one-quarter`,
`three-quarters`, `one-fifth`, `two-fifths`, `three-fifths` and `four-fifths`.

| Classes                                   | Prop                                  |
| ----------------------------------------- | ------------------------------------- |
| `is-{size}`                               | `size`                                |
| `is-{size}-{viewport}`                    | `size{Viewport}`                      |
| `is-offset-{size}` (no `full`)            | `offset`                              |
| `is-offset-{size}-{viewport}`             | `offset{Viewport}`                    |
| `is-narrow`                               | `isNarrow`                            |
| `is-narrow-{viewport}`, `is-narrow-touch` | `isNarrow{Viewport}`, `isNarrowTouch` |

### `.container` → `Container`

| Classes                                                | Prop                            |
| ------------------------------------------------------ | ------------------------------- |
| `is-fluid`, `is-widescreen`, `is-fullhd`               | `fluid`, `widescreen`, `fullhd` |
| `is-max-tablet`, `is-max-desktop`, `is-max-widescreen` | `breakpoint` and `isMax`        |

### `.title` → `Title`, `.subtitle` → `SubTitle`

| Classes             | Prop                                           |
| ------------------- | ---------------------------------------------- |
| `is-1` … `is-6`     | `size`, only on the matching `<hN>` or a `<p>` |
| `is-spaced` (Title) | `isSpaced`                                     |
| `has-skeleton`      | `hasSkeleton`                                  |

bestax picks the heading from `size` (`size="3"` renders an `<h3>`) unless `as="p"`. So on an
`<h2>`, `is-4` stays a class and the element becomes `<Title as="h2" className="is-4">`, which
renders the same `<h2>`.

### Other components

| Component                                  | Classes                                                                                                                    | Prop                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `.card-header-title` → `Card.Header.Title` | `is-centered`                                                                                                              | `centered`                                                          |
| `.content` → `Content`                     | `is-small`, `is-medium`, `is-large`                                                                                        | `size`                                                              |
| `.delete` → `Delete`                       | `is-small`, `is-medium`, `is-large`                                                                                        | `size`                                                              |
| `.hero` → `Hero`                           | `is-primary`, `is-link`, `is-info`, `is-success`, `is-warning`, `is-danger`, `is-black`, `is-white`, `is-light`, `is-dark` | `color`                                                             |
| `.hero` → `Hero`                           | `is-small`, `is-medium`, `is-large`, `is-fullheight`, `is-fullheight-with-navbar`                                          | `size`                                                              |
| `.level` → `Level`                         | `is-mobile`                                                                                                                | `isMobile`                                                          |
| `.notification` → `Notification`           | `is-primary`, `is-link`, `is-info`, `is-success`, `is-warning`, `is-danger`, `is-black`, `is-white`, `is-dark`             | `color`                                                             |
| `.notification` → `Notification`           | `is-light`                                                                                                                 | `isLight`                                                           |
| `.progress` → `Progress`                   | the ten `.hero` colors                                                                                                     | `color`                                                             |
| `.progress` → `Progress`                   | `is-small`, `is-medium`, `is-large`                                                                                        | `size`                                                              |
| `.section` → `Section`                     | `is-medium`, `is-large`                                                                                                    | `size`                                                              |
| `.table` → `Table`                         | `is-bordered`, `is-striped`, `is-narrow`, `is-hoverable`, `is-fullwidth`                                                   | `isBordered`, `isStriped`, `isNarrow`, `isHoverable`, `isFullwidth` |
| `.tag` → `Tag`                             | `is-primary`, `is-link`, `is-info`, `is-success`, `is-warning`, `is-danger`, `is-black`, `is-dark`, `is-white`             | `color`                                                             |
| `.tag` → `Tag`                             | `is-light`, `is-rounded`, `is-hoverable`                                                                                   | `isLight`, `isRounded`, `isHoverable`                               |
| `.tag` → `Tag`                             | `is-medium`, `is-large`                                                                                                    | `size`                                                              |

`Progress` takes `value` and `max` as numbers: `value="40"` becomes `value={40}`. An
expression (`value={percent}`) carries over as written, so if it holds a string the migrated
file fails to typecheck while still rendering the same; wrap it in `Number(…)`. `Delete`
converts only with `type` and `aria-label` set (see `defaults:<Target>` in the unmappables),
and a `type="button"` is dropped, since bestax renders it by itself. `Card.Header.Icon` likewise
converts only with an `aria-label`, since it renders `aria-label="more options"` otherwise.
`.tag`'s `is-delete` stays a class: `isDelete` turns the tag into a `<button>`.

## Helper classes

These convert on every component above and on the plain-tag wrappers.

Colors are `primary`, `link`, `info`, `success`, `warning`, `danger`, `black`, `black-bis`,
`black-ter`, `grey-darker`, `grey-dark`, `grey`, `grey-light`, `grey-lighter`, `white`,
`white-bis`, `white-ter`, `light`, `dark`, `inherit` and `current`.

| Classes                                                                                                   | Prop                                                                        |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `m-{n}`, `mt-{n}`, `mr-{n}`, `mb-{n}`, `ml-{n}`, `mx-{n}`, `my-{n}` (`0` to `6`, `auto`)                  | `m`, `mt`, `mr`, `mb`, `ml`, `mx`, `my`                                     |
| `p-{n}`, `pt-{n}`, `pr-{n}`, `pb-{n}`, `pl-{n}`, `px-{n}`, `py-{n}`                                       | `p`, `pt`, `pr`, `pb`, `pl`, `px`, `py`                                     |
| `has-text-{color}`                                                                                        | `textColor` (on `Table`, `color`)                                           |
| `has-background-{color}`                                                                                  | `bgColor` (on `Tag`, `backgroundColor`)                                     |
| `is-size-1` … `is-size-7`, and `-{viewport}`                                                              | `textSize`, `textSize{Viewport}`                                            |
| `has-text-centered`, `-justified`, `-left`, `-right`, and `-{viewport}`                                   | `textAlign`, `textAlign{Viewport}`                                          |
| `is-capitalized`, `is-lowercase`, `is-uppercase`, `is-italic`                                             | `textTransform`                                                             |
| `has-text-weight-light`, `-normal`, `-medium`, `-semibold`, `-bold`                                       | `textWeight`                                                                |
| `is-family-sans-serif`, `-monospace`, `-primary`, `-secondary`, `-code`                                   | `fontFamily`                                                                |
| `is-block`, `is-flex`, `is-inline`, `is-inline-block`, `is-inline-flex`, `is-grid`                        | `display`                                                                   |
| the same with any of the nine viewports, `touch` and the `-only` ones included                            | `display{Viewport}`                                                         |
| `is-hidden`, `is-invisible`, `is-sr-only`                                                                 | `visibility`                                                                |
| `is-hidden-{viewport}`, `is-invisible-{viewport}`, all nine viewports                                     | `visibility{Viewport}`                                                      |
| `is-flex-direction-*`, `is-flex-wrap-*`, `is-justify-content-*`, `is-align-content-*`, `is-align-items-*` | `flexDirection`, `flexWrap`, `justifyContent`, `alignContent`, `alignItems` |
| `is-align-self-*`, `is-flex-grow-*`, `is-flex-shrink-*`                                                   | `alignSelf`, `flexGrow`, `flexShrink`                                       |
| `is-pulled-left`, `is-pulled-right`                                                                       | `float`                                                                     |
| `is-clipped`                                                                                              | `overflow="clipped"`                                                        |
| `is-overlay`, `is-skeleton`, `is-clearfix`, `is-relative`                                                 | `overlay`, `skeleton`, `clearfix`, `relative`                               |
| `is-unselectable`, `is-clickable`                                                                         | `interaction`                                                               |
| `is-radiusless`, `is-shadowless`                                                                          | `radius`, `shadow`                                                          |
| `is-mobile`, `is-narrow` (where the component has no prop of its own for them)                            | `responsive`                                                                |

Where a component renders a color class through no typed prop, the class stays: `has-text-*`
on `Hero`, `Progress`, `Tag` and `Tags`; `has-background-*` on `Notification`, `Progress`,
`Table` and `Tags`.

Some classes stay put because of how bestax renders them:

- A base `display` class next to a per-viewport one (`is-flex is-block-mobile`) keeps the base
  class: bestax drops the base `display` whenever a per-viewport one is set.
- The flex-container classes (`is-justify-content-*` and the others in that row) convert only
  beside a flex `display` prop, the only place bestax renders them.
- `is-hidden` becomes `visibility="hidden"`, which renders the same class and doesn't interact
  with `display`.

## Classes that stay classes

Color shades (`has-text-primary-65`), the `-touch` and `-only` breakpoints of text size and
alignment, Grid and `.image` modifiers, and the Bulma helpers with no bestax prop
(`is-display-*`, `is-overflow-*`, `is-position-*`, `is-float-*`, `has-radius-*`, …) stay in
`className`. They render exactly as before.
