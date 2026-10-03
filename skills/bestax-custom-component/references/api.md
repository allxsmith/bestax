# Reference: helper APIs for building components

Everything below is public API. Where to import from depends on your context:

| Context                                       | Import from                                      |
| --------------------------------------------- | ------------------------------------------------ |
| An app depending on `@allxsmith/bestax-bulma` | `'@allxsmith/bestax-bulma'`                      |
| Inside the bestax monorepo (`bulma-ui/src/`)  | Relative paths — `'../helpers/classNames'`, etc. |

## `useBulmaClasses(props)` — `helpers/useBulmaClasses.tsx`

Turns Bulma helper props into a class string and returns the leftover (non-helper) props.

```ts
const { bulmaHelperClasses, bulmaHelperStyles, rest } = useBulmaClasses(props);
// bulmaHelperClasses: e.g. 'has-text-primary is-size-3 m-3'
// bulmaHelperStyles: inline styles for scheme-aware values, or undefined (see below)
// rest: every prop that was NOT a recognized helper; destructure your own
// component props and `style` before spreading it on a DOM element
```

`bulmaHelperStyles` is `undefined` unless `backgroundColor` is one of the six
`validSchemeColors` values (`scheme-main`, `scheme-main-bis`, `scheme-main-ter`,
`scheme-invert`, `scheme-invert-bis`, `scheme-invert-ter`). Bulma ships no
`has-background-scheme-*` classes, so those values emit no class; the hook returns
`{ backgroundColor: 'var(--bulma-<value>)' }` instead — a dark-mode-safe inline style. Put it
on the root element with `mergeBulmaStyles(bulmaHelperStyles, style)`
(`helpers/mergeBulmaStyles.ts`): the user's `style` prop wins on conflicts, and the result is
`undefined` when both are absent so unaffected components keep an attribute-free DOM.
(`useColorStyles` is the underlying per-concern hook.)

`BulmaClassesProps` is the union of all helper prop groups, composed from per-concern hooks
that can also be used on their own:

| Group      | Hook                   | Representative props                                                                                                                                                             |
| ---------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color      | `useColorClasses`      | `color`, `colorShade`, `backgroundColor`, `backgroundColorShade`                                                                                                                 |
| Spacing    | `useSpacingClasses`    | `m`, `mt`, `mr`, `mb`, `ml`, `mx`, `my`, `p`, `pt`, `pr`, `pb`, `pl`, `px`, `py`                                                                                                 |
| Typography | `useTypographyClasses` | `textSize`, `textAlign`, `textTransform`, `textWeight`, `fontFamily` (+ responsive variants)                                                                                     |
| Visibility | `useVisibilityClasses` | `display`, `visibility` (+ per-viewport variants)                                                                                                                                |
| Flexbox    | `useFlexboxClasses`    | `flexDirection`, `flexWrap`, `justifyContent`, `alignItems`, `alignContent`, `alignSelf`, `flexGrow`, `flexShrink`                                                               |
| Other      | `useOtherClasses`      | `float`, `overflow`, `overflowX`, `overflowY`, `radius`, `shadow`, `interaction`, `cursor`, `skeleton`, `clearfix`, `pos`, `relative`, `fullHeight`, `aspectRatio`, `responsive` |

Because the component destructures these into `bulmaHelperClasses`, callers get the full Bulma
helper surface for free on every component built this way, and `rest` stays clean for DOM
spreading. (Some library compound sub-parts — `Modal.Card`, `Tabs.Tab`,
`Message.Body` — do **not** take helper props: just `className`, HTML attributes, and their own
few, e.g. `Tabs.Tab`'s required `index` and its built-in `icon`/`disabled` props. `Card.*`
sub-parts do take them.)

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

`validColors`, `validColorShades`, `validSchemeColors`, `validSizes`, `validTextSizes`,
`validAlignments`, `validTextTransforms`, `validTextWeights`, `validFontFamilies`,
`validDisplays`, `validVisibilities`, `validFlexDirections`, `validFlexWraps`,
`validJustifyContents`, `validAlignContents`, `validAlignItems`, `validAlignSelfs`,
`validFlexGrowShrink`, `validViewports`, `validFloats`, `validOverflows`,
`validAxisOverflows`, `validInteractions`, `validCursors`, `validRadii`,
`validShadows`, `validResponsives`, `validPositions`, `validAspectRatios`.

```ts
export type MyColor = (typeof validColors)[number];
```

`validSchemeColors` is the scheme-background tuple consumed by `bulmaHelperStyles` (above).
Components that support scheme backgrounds widen their own `bgColor` union with
`(typeof validSchemeColors)[number]` — the widening is deliberate and per-component, so a
component that has not wired `bulmaHelperStyles` onto its root element must keep the narrow
union (a compile error beats a silent no-op).

## `ConfigProvider` / `Theme` — `helpers/Config.tsx`, `helpers/Theme.tsx`

`ConfigProvider` provides the runtime `classPrefix` (and `iconLibrary`) consumed via `useConfig`;
`classPrefix` feeds `usePrefixedClassNames` (opt-in class prefixing to avoid collisions). `Theme`
overrides `--bulma-*` custom properties at runtime —
which is exactly why component SCSS must register its vars via `cv.register-vars` rather than
hard-coding values.

## Browser-only content: `ClientOnly` / `useIsHydrated`

- `<ClientOnly fallback?>` (`helpers/ClientOnly.tsx`) renders its children only after hydration,
  and `fallback` on the server and while hydrating. Pass the children as a function to keep
  browser-only expressions off the server. Use it rather than a `typeof window` check, which
  makes the server and client markup differ.
- `useIsHydrated()` (`helpers/useIsHydrated.ts`) is the hook underneath: `false` on the server and
  during the hydrating render, `true` from the commit after.

```tsx
<ClientOnly fallback={<Skeleton variant="lines" lines={1} />}>
  {() => (
    <p>Times are in {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
  )}
</ClientOnly>
```

## Floating content: `Portal`

A panel anchored to the button that opens it is `Popover`, which already portals
(`appendToBody`), traps focus and dismisses itself. `Portal` is for the overlays it doesn't
cover.

`<Portal container?>` (`helpers/portal.tsx`) renders its children into `document.body`, or into
`container` (an element or a selector), so floating content escapes an ancestor's `overflow`,
`transform` or stacking context. It renders nothing on the server and during hydration, so the
first client render matches; `disabled` renders in place instead. Use it rather than calling
`createPortal` yourself, which React's server renderer can't render.

Focus follows the DOM, not the React tree: portaled content comes last in the Tab order, so move
focus into it when it opens and back to its trigger when it closes. A focus trap doesn't cover
what a `Portal` inside it renders, so render nested overlays inside the trapped element.

```tsx
{
  open && (
    <Portal>
      <div role="dialog" aria-label="Filters" tabIndex={-1}>
        …
      </div>
    </Portal>
  );
}
```

## Holding focus: `useFocusTrap`

`useFocusTrap(ref, { active, initialFocusRef, restoreFocus })` (`helpers/useFocusTrap.ts`) moves
focus into `ref` when `active` turns on, wraps Tab at the first and last tab stops (the ones the
browser visits, so hidden, disabled, inert and `tabIndex={-1}` elements are skipped and a radio
group counts once) and restores focus when it turns off. It handles Tab only: wire Escape to
close. Pass the trigger's ref as `restoreFocus` for a panel opened from a button. It waits for
hydration, so it also finds a container that only appears after hydration, as portaled content
does. Content the container renders through a portal is outside the trap, so render nested
overlays inside the container. The example below shows the hook's wiring; for a real filter
panel opened from a button, use `Popover`, which does all of this.

```tsx
function FilterPanel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, { active: open, restoreFocus: buttonRef });

  return (
    <>
      <Button
        ref={buttonRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        Filters
      </Button>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Filters"
          tabIndex={-1}
          onKeyDown={e => e.key === 'Escape' && setOpen(false)}
        >
          {children}
        </div>
      )}
    </>
  );
}
```

## SCSS utilities — from the `bulma` package

```scss
@use 'bulma/sass/utilities/initial-variables' as iv; // iv.$class-prefix
@use 'bulma/sass/utilities/css-variables' as cv; // cv.getVar, cv.register-vars
```

In an app these work too (styling-ladder rung 3 in `SKILL.md`): `npm i -D sass` and Vite
compiles imported `.scss` zero-config — `bulma` resolves because it's a runtime dependency of
bestax-bulma.

- `iv.$class-prefix` — the configurable class prefix; prepend to every selector.
- `cv.getVar("name")` — emits `var(--bulma-name)`; use for both Bulma vars (`"primary"`,
  `"radius"`, `"scheme-main"`, `"text"`) and your own registered vars.
- `cv.register-vars((...))` — declares `--bulma-*` custom properties on the current selector.
