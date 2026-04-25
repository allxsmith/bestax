---
title: bestax-bulma 2.x → 3.x
sidebar_label: 2.x to 3.x
sidebar_position: 1
---

# Upgrading bestax-bulma 2.x → 3.x

This guide explains what changes when you upgrade `@allxsmith/bestax-bulma` from 2.x to 3.x. Most of your code keeps working unchanged. The areas that need attention are called out below.

## TL;DR

:::tip Mostly additive
3.x ships about 30 new components and several quality-of-life prop additions. There's **one** architectural change worth knowing — form input auto-wrapping — and a handful of subtle, opt-in context behaviors. Everything else is backward compatible.
:::

| Area                  | What changed                                                                  | Action                                                                       |
| --------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Form inputs           | `<Input>`, `<Select>`, `<TextArea>`, `<File>` auto-wrap in `<Field><Control>` | Use `InputBase` / `SelectBase` / `TextAreaBase` if you need the bare element |
| `<Tabs>`              | New context + opt-in `<Tabs.Tab>` API                                         | None — old `<Tabs.Item>` is preserved                                        |
| `<Field>`             | `labelSize` defaults to `'normal'` for horizontal layouts                     | None unless you customised label baseline alignment                          |
| `<Checkboxes>`        | Now an optional state container (additive)                                    | None — pass `value`/`onChange` only if you want group state                  |
| `<Radios>`            | Now an optional state container (additive)                                    | None — pass `value`/`onChange` only if you want group state                  |
| `<Notification>`      | New programmatic singleton API (additive)                                     | None — JSX usage unchanged                                                   |
| Subcomponent prop API | Many subcomponents now extend `HTMLAttributes` (superset)                     | None                                                                         |
| `bulma` package       | Moved from `peerDependencies` to `dependencies`                               | Optional cleanup of your own peerDeps                                        |

## Form components: auto-wrap in Field & Control

:::caution The one breaking change
This is the only behavioral change in 3.x that can affect existing code without you opting in. If you only read one section of this guide, read this one.
:::

In 2.x, the form input components rendered the bare HTML element with Bulma classes:

```jsx
<Input value="hi" />
// → <input class="input" value="hi" />
```

In 3.x they detect whether they are already inside a `<Field>` and `<Control>` (via the new `FormContext`) and wrap themselves if not:

```jsx
<Input value="hi" />
// → <div class="field"><div class="control"><input class="input" value="hi" /></div></div>
```

**Why this changed:** wrapping `<Input>` in `<Field><Control>` is the most common pattern in Bulma forms. Making it the default lets you skip a lot of boilerplate, and the new `label`, `message`, `iconLeftName` etc. props on `<Input>` work because the wrapper exists.

**Who is affected:**

- ✅ Code that already wraps inputs in `<Field><Control><Input/></Control></Field>` — context detection skips re-wrapping. **No change.**
- ✅ CSS that targets `.input` directly or its descendants — selectors still match.

:::warning Watch for these patterns
You'll need to take action if your code does any of the following:

- DOM or snapshot tests that asserted `.input` is the root element of `<Input>`.
- CSS that targets `<Input>`'s parent or sibling (e.g. `.my-row > .input`).
- Layouts that placed `<Input>` directly inside a flex or grid container.

:::

**Migration paths:**

**Option A — adopt the new convenience props** (preferred for typical forms):

```jsx
<Input
  label="Email"
  type="email"
  iconLeftName="envelope"
  message="We'll never share your email."
/>
```

**Option B — keep the bare-element behavior** with the new `*Base` exports:

```jsx
import { InputBase, SelectBase, TextAreaBase } from '@allxsmith/bestax-bulma';

<InputBase value="hi" />;
// → <input class="input" value="hi" />  (same as 2.x <Input>)
```

The same pattern applies to `<Select>` (use `SelectBase`), `<TextArea>` (use `TextAreaBase`). For `<File>`, render it inside an explicit `<Control>` to skip the auto-wrap.

## `<Tabs>` — new context, but legacy API preserved

`<Tabs>` now provides a `TabsContext` to descendants. The legacy `<Tabs.Item>` (`TabItem`) **does not consume this context** and continues to behave exactly as it did in 2.x — driven by your `active` and `onClick` props:

```jsx
// 2.x and 3.x — identical behavior
<Tabs>
  <Tabs.List>
    <Tabs.Item active={i === 0} onClick={() => setI(0)}>
      One
    </Tabs.Item>
    <Tabs.Item active={i === 1} onClick={() => setI(1)}>
      Two
    </Tabs.Item>
  </Tabs.List>
</Tabs>
```

A new opt-in `<Tabs.Tab index={n}>` component DOES consume the context and lets you control active state via `<Tabs value={n} onChange={...}>` or uncontrolled via `<Tabs defaultValue={n}>`:

```jsx
// 3.x opt-in — controlled tabs without per-item handlers
<Tabs value={tab} onChange={setTab}>
  <Tabs.List>
    <Tabs.Tab index={0}>One</Tabs.Tab>
    <Tabs.Tab index={1}>Two</Tabs.Tab>
  </Tabs.List>
  <Tabs.Content>
    <Tabs.Content.Item index={0}>One panel</Tabs.Content.Item>
    <Tabs.Content.Item index={1}>Two panel</Tabs.Content.Item>
  </Tabs.Content>
</Tabs>
```

:::note No migration required
You don't have to swap anything — pick the API that fits each callsite. The two patterns can coexist in the same project, even on the same page.
:::

## `<Field>` — subtle defaults

Two small behavior tweaks in `<Field>`:

- **`labelSize` defaults to `'normal'`** when `horizontal` is set (was `undefined → no class`). This adds `is-normal` to the FieldLabel for proper baseline alignment with the input. If you customised label alignment in horizontal layouts, verify it still looks right — or pass an explicit `labelSize`.
- **FieldBody auto-wrap detection** now also recognises `<Field.Label>` siblings as user-provided structure (previously only a single `<Field.Body>` was detected). If you were relying on Field auto-wrapping a non-standard combination of children, the rendered DOM may differ.

New additive props on `<Field>`: `narrow?: boolean` and `hasAddons` widened to `boolean | 'centered' | 'right'`.

## `<Checkboxes>` and `<Radios>` — optional state container

In 2.x these were dumb wrapper divs with no state.

In 3.x they're stateful group containers _when you opt in_. If you were using them purely as visual wrappers and managing each `<Checkbox>` / `<Radio>` individually, your code keeps working — the new `name`, `value`, `defaultValue`, `onChange` props are all optional, and individual `<Checkbox checked=... onChange=...>` props always take precedence over the group context.

The new modes:

```jsx
// Controlled
const [tags, setTags] = useState(['react']);
<Checkboxes name="tags" value={tags} onChange={setTags}>
  <Checkbox value="react">React</Checkbox>
  <Checkbox value="vue">Vue</Checkbox>
</Checkboxes>

// Uncontrolled
<Checkboxes name="tags" defaultValue={['react']}>
  <Checkbox value="react">React</Checkbox>
  <Checkbox value="vue">Vue</Checkbox>
</Checkboxes>

// Same patterns for <Radios>, but with a single string value instead of an array
```

## `<Notification>` — additive singleton API

`<Notification>` itself is unchanged in render output (one new optional prop, `textColor`, for setting text color separately from the background color). Existing JSX usage stays the same.

What's new is a programmatic singleton API:

```jsx
import { notification } from '@allxsmith/bestax-bulma';

notification.show({ message: 'Saved!', color: 'success', duration: 3000 });
notification.success('Saved!');
notification.danger('Something went wrong');

const id = notification.show({ message: 'Loading...', indefinite: true });
notification.close(id);
```

:::tip Purely additive
Your existing `<Notification>` JSX continues to work exactly as it did in 2.x. The singleton API is just a new option, not a replacement.
:::

## Type tightening (likely no impact)

A handful of components added `Omit<HTMLAttributes, ...>` to their `extends` clauses to resolve internal type conflicts:

| Component          | Omitted prop                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tabs`             | `onChange` — was inherited `FormEventHandler<HTMLDivElement>`; now typed as `(index: number) => void` (opt-in helper for the new context-driven API) |
| `Loading`          | `color`, `backgroundColor`, `size` — these are now Bulma helper-prop modifiers                                                                       |
| `Modal`            | `color`, `title`                                                                                                                                     |
| `Dropdown`, `Menu` | helper-prop name collisions                                                                                                                          |

:::info Likely no impact
These only matter if you happened to spread the omitted native HTML attribute directly onto one of these components — almost no real consumer does this.
:::

## Packaging

- **`bulma` moved from `peerDependencies` to `dependencies`.** npm now installs `bulma` automatically when you install `@allxsmith/bestax-bulma` — you don't need to add it to your own `package.json`. Bulma's CSS is also bundled into the prebuilt stylesheets (`dist/bestax.css` and its prefixed / no-helpers / no-dark-mode variants), so consumers using one of those stylesheets don't need to import any other bulma CSS file. The bulma JavaScript / source files are still installed alongside (not bundled into bestax's JS), which is what enables you to `@use '@allxsmith/bestax-bulma/scss'` for custom Sass builds. If you had your own `bulma` pinned to a different `^1.x` version, npm will dedupe.
- **`sideEffects` corrected** to `["**/*.css", "**/*.scss"]` so bundlers preserve CSS imports correctly (in 2.x, aggressive tree-shakers could drop them).
- Peer dependency ranges for React (`^16.8.0 || ^17 || ^18 || ^19`) and the icon font packages (`@fortawesome/fontawesome-free`, `@mdi/font`, `ionicons`, `material-icons`, `material-symbols`) are unchanged.

## What's new

3.x ships ~30 new components. Highlights:

| Component                | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `<Tooltip>`              | Auto-positioned floating tooltip                       |
| `<Carousel>`             | Slide carousel with dragging, indicators, keyboard nav |
| `<Collapse>`             | Animated collapse / expand sections                    |
| `<Dialog>`               | Modal dialogs with `confirm` / `alert` / `prompt` API  |
| `<Loading>`              | Overlay spinner for any container                      |
| `<Sidebar>`              | Slide-out side panel with overlay or inline modes      |
| `<Snackbar>` / `<Toast>` | Toast-style notifications with positions and queues    |
| `<Steps>`                | Multi-step wizard navigation                           |
| `<LinkButton>`           | Link-styled button (text / ghost / underline variants) |
| `<Switch>`               | Bulma switch toggle                                    |
| `<Slider>`               | Range slider with dual-thumb mode and ticks            |
| `<Numberinput>`          | Number input with `+/–` steppers                       |
| `<Rate>`                 | Star rating with half-star precision                   |
| `<Autocomplete>`         | Filterable suggest input                               |
| `<Taginput>`             | Multi-tag input with autocomplete                      |

Plus text and list elements: `Code`, `Divider`, `Emphasis`, `Figure`, `Link`, `ListItem`, `OrderedList`, `Paragraph`, `Pre`, `Span`, `Strong`, `UnorderedList`.

See the component reference for full docs.

## Optional new SCSS

:::info Opt-in only
None of these stylesheets are auto-imported. Existing 2.x consumers see zero visual change unless they explicitly import one of the files below.
:::

3.x introduces an optional `extras.css` stylesheet with overrides for the new components and a few existing ones (e.g. themed `Checkbox` / `Radio`):

```jsx
import '@allxsmith/bestax-bulma/dist/extras.css';
```

This is opt-in — if you don't import it, nothing changes visually for any 2.x component. There are also pre-built variations:

- `bestax.css` — Bulma + extras bundled
- `bestax-prefixed.css` — all classes prefixed with `bulma-`
- `bestax-no-helpers.css` — without Bulma helper classes
- `bestax-no-helpers-prefixed.css` — combined
- `bestax-no-dark-mode.css` — without dark-mode rules

You can also consume the SCSS source directly:

```scss
@use '@allxsmith/bestax-bulma/scss';
```

## Component-by-component breaking-change summary

For reference, here's the per-component status. Any component not listed had no behavior changes worth flagging (typically only JSDoc updates or formatting).

### components/

- `Breadcrumb`, `Card`, `Dropdown`, `Menu`, `Message`, `Modal`, `Navbar`, `Pagination`, `Panel` — **No breaking changes.** All subcomponent prop interfaces now extend `React.HTMLAttributes<...>` (a superset — accepts more native HTML attrs).
- `Card` — additionally accepts an array `footer` prop (renders multiple `card-footer-item` divs).
- `Tabs` — **Notable, not breaking.** Adds `TabsContext.Provider`, but `<Tabs.Item>` (legacy) does not consume context. New opt-in `<Tabs.Tab>` and `<Tabs.Content>` / `<Tabs.Content.Item>` for controlled/uncontrolled active state. New optional `value`, `defaultValue`, `onChange`, `vertical`, `side`, `expanded` props on `<Tabs>`.
- `Carousel`, `Collapse`, `Dialog`, `Loading`, `Sidebar`, `Snackbar`, `Steps`, `Toast`, `Tooltip` — **NEW.**

### elements/

- `Block`, `Box`, `Buttons`, `Content`, `Delete`, `IconText`, `Image`, `Progress`, `Skeleton`, `SubTitle`, `Table`, `Tag`, `Tags`, `Tbody`, `Td`, `Tfoot`, `Th`, `Thead`, `Title`, `Tr` — **No breaking changes.** Mostly JSDoc / formatting updates.
- `Button` — **No breaking changes.** `color` prop union expanded with `'white' | 'light' | 'dark' | 'black' | 'text' | 'ghost'`.
- `Icon` — **No breaking changes.** New optional `containerClassName` prop.
- `Notification` — **No breaking changes for JSX usage.** New optional `textColor` prop. New programmatic `notification.show()` / `.success()` / `.close()` singleton API alongside the component.
- `Code`, `Divider`, `Emphasis`, `Figure`, `Link`, `LinkButton`, `ListItem`, `OrderedList`, `Paragraph`, `Pre`, `Span`, `Strong`, `UnorderedList` — **NEW.**

### form/

- `Input`, `Select`, `TextArea`, `File` — **BREAKING.** Auto-wrap in `<Field><Control>` when not detected via context. Use `InputBase` / `SelectBase` / `TextAreaBase` (or render `<File>` inside an explicit Control) to opt out. See the section above.
- `Field` — **Notable.** New `narrow` prop, `hasAddons` widened to `boolean | 'centered' | 'right'`, `labelSize` default for horizontal changed from `undefined → no class` to `'normal'`. Now wraps content in `<FieldProvider value={true}>` (the context the form components above read).
- `Control` — **No breaking changes.** New `iconLeftName` / `iconRightName` shortcut props.
- `Checkbox`, `Radio` — **Notable, not breaking.** Now read from `useCheckboxesGroup()` / `useRadiosGroup()` context when present, with "local props always win." Standalone usage is unchanged.
- `Checkboxes`, `Radios` — **Notable, not breaking.** Now optional state containers via new `value` / `defaultValue` / `onChange` props. Without those props, behavior is identical to 2.x.
- `Autocomplete`, `FormContext`, `InputBase`, `Numberinput`, `Rate`, `SelectBase`, `Slider`, `Switch`, `Taginput`, `TextAreaBase`, `fieldProps` — **NEW.**

### helpers/

- `Config`, `Theme`, `useBulmaClasses`, `classNames` — **No breaking changes.** New optional Theme CSS-variable props (additive). New `iconLibrary` config option.

### layout/, columns/, grid/

- `Container`, `Footer`, `Hero`, `Level`, `Media`, `Section`, `Column`, `Columns`, `Cell`, `Grid` — **No breaking changes.** JSDoc / formatting updates only.
