# Reference: helper APIs for building components

The shared helpers live in `bulma-ui/src/helpers/`. Import them from there in components.

## `useBulmaClasses(props)` — `helpers/useBulmaClasses.tsx`

Turns Bulma helper props into a class string and returns the leftover (non-helper) props.

```ts
const { bulmaHelperClasses, rest } = useBulmaClasses(props);
// bulmaHelperClasses: e.g. 'has-text-primary is-size-3 m-3'
// rest: every prop that was NOT a recognized helper (safe to spread on the DOM)
```

`BulmaClassesProps` is the union of all helper prop groups, composed from per-concern hooks
that can also be used on their own:

| Group      | Hook                   | Representative props                                                                                                             |
| ---------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Color      | `useColorClasses`      | `color`, `colorShade`, `backgroundColor`, `backgroundColorShade`                                                                 |
| Spacing    | `useSpacingClasses`    | `m`, `mt`, `mr`, `mb`, `ml`, `mx`, `my`, `p`, `pt`, `pr`, `pb`, `pl`, `px`, `py`                                                 |
| Typography | `useTypographyClasses` | `textSize`, `textAlign`, `textTransform`, `textWeight`, `fontFamily` (+ responsive variants)                                     |
| Visibility | `useVisibilityClasses` | `display`, `visibility` (+ per-viewport variants)                                                                                |
| Flexbox    | `useFlexboxClasses`    | `flexDirection`, `flexWrap`, `justifyContent`, `alignItems`, `alignContent`, `alignSelf`, `flexGrow`, `flexShrink`               |
| Other      | `useOtherClasses`      | `float`, `overflow`, `radius`, `shadow`, `interaction`, `cursor`, `skeleton`, `clearfix`, `relative`, `fullHeight`, `responsive` |

Because the component destructures these into `bulmaHelperClasses`, callers get the full Bulma
helper surface for free on every component, and `rest` stays clean for DOM spreading.

## `classNames(...)` and friends — `helpers/classNames.ts`

```ts
classNames('foo', ['bar', { baz: true }], { qux: false }); // => 'foo bar baz'
```

Accepts strings, numbers, arrays, and objects (truthy keys included); flattens recursively and
de-dupes. Related exports:

- `usePrefixedClassNames(...args)` — **use this in components.** Reads `classPrefix` from the
  `ConfigProvider` context and prefixes every class. With `classPrefix="bulma-"`,
  `usePrefixedClassNames('button', { 'is-primary': true })` → `'bulma-button bulma-is-primary'`.
- `prefixedClassNames(prefix, ...args)` — non-hook form; pass `undefined` for no prefix.
- `createPrefixedClassNames(prefix)` — factory returning a bound `classNames`.

## Valid-value constants — `helpers/bulmaClassHelpers.ts`

Re-exported through `useBulmaClasses`. Use them to type component-specific props and to drive
Storybook `argTypes`/tests:

`validColors`, `validColorShades`, `validSizes`, `validTextSizes`, `validAlignments`,
`validTextTransforms`, `validTextWeights`, `validFontFamilies`, `validDisplays`,
`validVisibilities`, `validFlexDirections`, `validFlexWraps`, `validJustifyContents`,
`validAlignContents`, `validAlignItems`, `validAlignSelfs`, `validFlexGrowShrink`,
`validViewports`.

```ts
export type MyColor = (typeof validColors)[number];
```

## `ConfigProvider` / `Theme` — `helpers/Config.tsx`, `helpers/Theme.tsx`

`ConfigProvider` provides the runtime `classPrefix` (and `iconLibrary`) consumed via `useConfig`;
`classPrefix` feeds `usePrefixedClassNames` (opt-in class prefixing to avoid collisions). `Theme`
overrides `--bulma-*` custom properties at runtime —
which is exactly why component SCSS must register its vars via `cv.register-vars` rather than
hard-coding values.

## SCSS utilities — from the `bulma` package

```scss
@use 'bulma/sass/utilities/initial-variables' as iv; // iv.$class-prefix
@use 'bulma/sass/utilities/css-variables' as cv; // cv.getVar, cv.register-vars
```

- `iv.$class-prefix` — the configurable class prefix; prepend to every selector.
- `cv.getVar("name")` — emits `var(--bulma-name)`; use for both Bulma vars (`"primary"`,
  `"radius"`, `"scheme-main"`, `"text"`) and your own registered vars.
- `cv.register-vars((...))` — declares `--bulma-*` custom properties on the current selector.
