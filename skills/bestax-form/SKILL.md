---
name: bestax-form
description: Build forms with @allxsmith/bestax-bulma — Field/Control/Label/Help composition, inputs, selects, checkboxes, radios, switches, and advanced controls (Autocomplete, Slider, Numberinput, Rate, Taginput, File, date/time). There is no form/validation library; this skill shows the components and the validate-it-yourself error pattern. Use when building a form, wiring inputs to state, or showing validation/error state.
license: MIT
---

# Building forms with bestax-bulma

This skill covers the form components in `@allxsmith/bestax-bulma` and how to compose them.

**Important:** bestax-bulma ships **no form/validation library** — there is no integration with
formik, react-hook-form, yup, or zod, and no `useForm`-style hook. You own your form state with
plain React (`useState` / `useReducer` or any library you choose) and feed validation results
back via each input's own `color`, `message`, and `messageColor` props on the convenience inputs
(`Input`, `Select`, `TextArea`, …). Always put validation state on the **input**: `Field` has no
`message`/`messageColor`, and although `FieldProps` types a `color`, `Field` discards it — it
renders no class, so setting it looks right and does nothing. (`FieldLabel`/`FieldBody` do honor
`color`, as the `has-text-*` helper.) See **Validation without a library** below.

## Use when

- Building a form out of bestax inputs, selects, checkboxes, switches, or advanced controls.
- Deciding between the convenience components (`<Input label=… />`) and explicit
  `Field` + `Control` + `*Base` composition.
- Showing help text and error/success states on fields.

To build a brand-new input component (not just use the existing ones), use the
`bestax-custom-component` skill instead.

## Field / Control / Label / Help composition

Bulma forms are a three-tier structure. bestax models it directly:

```
Field            // container + layout (horizontal / grouped / hasAddons)
├── label        // rendered from Field's `label` prop, or a <label> you put in <Field.Label>
└── Control       // wraps ONE input; adds icons + loading
    ├── InputBase / SelectBase / TextAreaBase   // the raw styled element
    └── <p class="help">…</p>                    // help / validation message
```

You rarely write all of this by hand. The convenience components (`Input`, `Select`,
`TextArea`, …) auto-wrap themselves in `Field` + `Control` when they aren't already inside one,
using context (`useInsideField` / `useInsideControl`) to detect their surroundings.

```tsx
// Convenience: one line, auto-wrapped in Field + Control.
<Input label="Email" type="email" placeholder="you@example.com" />

// Explicit composition: full control over layout.
<Field label="Email">
  <Control iconLeftName="envelope" hasIconsLeft>
    <InputBase type="email" placeholder="you@example.com" />
  </Control>
</Field>
```

### Layout via Field

- `horizontal` — label and control side by side (wraps children in `Field.Body`; use
  `Field.Label` / `Field.Body` directly for multi-control rows).
- `grouped` — `true | 'centered' | 'right' | 'multiline'`, controls in a row.
- `hasAddons` — `true | 'centered' | 'right'`, attached controls (input + button).

```tsx
<Field hasAddons>
  <Control isExpanded>
    <InputBase placeholder="Search" />
  </Control>
  <Control>
    <Button color="primary">Go</Button>
  </Control>
</Field>
```

## Component inventory

All import from `@allxsmith/bestax-bulma`. Convenience components auto-wrap Field+Control;
`*Base` components are the raw styled elements for explicit composition.

| Component                                               | What it is                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Field`, `Field.Label`, `Field.Body`                    | Field container + horizontal label/body parts.                            |
| `Control`                                               | Wraps one input; left/right icons, `isLoading`, `isExpanded`, `size`.     |
| `Input` / `InputBase`                                   | Text input (convenience / raw).                                           |
| `Select` / `SelectBase`                                 | Dropdown select.                                                          |
| `TextArea` / `TextAreaBase`                             | Multiline text.                                                           |
| `Checkbox` / `Checkboxes`                               | Single checkbox / managed group (array value).                            |
| `Radio` / `Radios`                                      | Single radio / managed single-select group.                               |
| `Switch`                                                | Toggle switch (`isRounded`, `isThin`, `isOutlined`, RTL).                 |
| `File`                                                  | File upload input with label/message.                                     |
| `Autocomplete`                                          | Input with filtered dropdown suggestions + keyboard nav.                  |
| `Slider`                                                | Range slider; single/dual thumbs, steps, tooltips, vertical.              |
| `Numberinput`                                           | Numeric input with increment/decrement, min/max, step, stepper.           |
| `Rate`                                                  | Star rating; `max`, `precision` (half/quarter), custom icons, `disabled`. |
| `Taginput`                                              | Tag/chip input; suggestions, confirm keys, closable tags.                 |
| `DateInput` / `TimeInput` / `DateTimeInput` (+ `*Base`) | Date / time / datetime pickers; month or year via `granularity`.          |
| `DateRangeInput` (+ `*Base`)                            | Start and end date: `[Date \| null, Date \| null]`, one calendar.         |

(`NumberInput` and `TagInput` also exist as deprecated aliases of `Numberinput`/`Taginput` —
same components; prefer the lowercase-second-word spellings.)

## Common props

Across the convenience inputs (`Input`, `Select`, `TextArea`, and similar):

| Prop                             | Type                                                                  | Purpose                                                                    |
| -------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `color`                          | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'` | Visual state — use `'danger'` for errors, `'success'` for valid.           |
| `size`                           | `'small' \| 'medium' \| 'large'`                                      | Input size.                                                                |
| `value` / `onChange`             | controlled value + handler                                            | Standard React controlled inputs.                                          |
| `defaultValue`                   | uncontrolled initial value                                            | When not controlling state.                                                |
| `disabled`, `readOnly`           | `boolean`                                                             | Native states (`readOnly` on `*Base`).                                     |
| `label`                          | `ReactNode`                                                           | Field label (convenience components; auto-associated via `htmlFor`).       |
| `message`                        | `ReactNode`                                                           | Help / validation text rendered as `<p class="help">`.                     |
| `messageColor`                   | a Bulma color                                                         | Colors the help text (`'danger'` for errors).                              |
| `iconLeftName` / `iconRightName` | `string`                                                              | Icon shortcuts; pair with `hasIconsLeft/Right`.                            |
| `isLoading`                      | `boolean`                                                             | Loading spinner on the Control; `Select` draws it in place of the chevron. |

Plus the full Bulma **helper props** (`m`, `p`, `textColor`, `display`, …) on every component
via `useBulmaClasses`.

Full-width is `isFullwidth` on every component that supports it (`Button`, `LinkButton`,
`Select`, `File`, `Table`, `Tabs`, `Sidebar`) — always write `isFullwidth`. The deprecated
spellings compile only where they historically existed: `isFullWidth` everywhere except
`Sidebar`, `fullwidth` on `Tabs` only, `fullWidth` on `Sidebar` only.

The `label` prop on the single-control convenience inputs (`Input`, `Select`, `TextArea`,
`File`, `Numberinput`, `Slider`, `DateInput`, `TimeInput`, `DateTimeInput`, `Autocomplete`,
`Taginput`) wires `htmlFor`/`id` automatically — your `id` is used when provided, a
generated one otherwise, and an explicit `labelProps={{ htmlFor }}` wins. The wiring only
happens when the component renders its own `Field` (nested inside one, the `label` prop is
dropped); the date/time pickers skip it in `inline` mode and `Taginput` skips it at
`maxTags` (no visible input to label). A `range` `Slider` points the `for` at its low thumb
and also puts the label at the start of both thumbs' names through `aria-labelledby`
("Price range Minimum value"). Its `ariaLabel={[low, high]}` replaces those names outright, so
leave it off when a label already names the Slider. The group inputs (`Checkboxes`, `Radios`, `Rate`,
`DateRangeInput`) associate their `label` too, but group-style: the wrapper gets
`role="group"`/`"radiogroup"` and `aria-labelledby` pointing at the label. Composing yourself
also associates: a labeled `Field` names the one control it holds, whether a composed
`InputBase`/`SelectBase`/`TextAreaBase`, a composed `DateInputBase`/`TimeInputBase`/
`DateTimeInputBase` that is not `inline`, or any input above (through the id), or a group,
a composed `DateRangeInputBase` included, `inline` or not (through `aria-labelledby`).
Either way, an `aria-label` or `aria-labelledby` you give a group wins over the label. A
`Checkbox`, `Radio` or `Switch` takes nothing from a `Field`: each is named by its own
children, so put the text there. The association is skipped for
`grouped`/`hasAddons`, and a nested `Field` starts its own scope, so a
horizontal `Field` whose body holds an inner `Field` needs `labelProps={{ htmlFor, id }}` plus
the control's `id`. The `for` names the control, and the label's `id` is what a range `Slider`'s
thumbs and an `Autocomplete`'s suggestion list point `aria-labelledby` at, so without it they
keep their fallback names ("Minimum value"/"Maximum value", "Suggestions"). The same goes for
a label wired by hand on a `grouped`/`hasAddons` row. A `<label htmlFor>` you put in
`Field.Label` yourself (the explicit label/body pattern in `references/patterns.md`) names its
control through the `for` alone, and the thumbs and list never point at it, so label a row
holding a range `Slider` or an `Autocomplete` with the `Field`'s `label` prop, wired by hand as
above when an inner `Field` holds the control. For a group in an inner `Field`, use
`labelProps={{ id, htmlFor: undefined }}` on the outer `Field` plus an `aria-labelledby` on the
group pointing at that `id`, as the docs' horizontal group examples do. The
`htmlFor: undefined` keeps the label's `for` out of server-rendered HTML as well as the
browser's. Leave it off and the label still drops the `for` after mounting, but the server's
HTML carries one that matches nothing. A labeled `Field` over anything else that doesn't take
its id (a group held directly, a `Checkbox`, `Radio` or `Switch`, your own markup) drops its
`for` the same way once mounted, with the same `for` left in server-rendered HTML. Pass
`labelProps={{ htmlFor }}` plus a matching `id` only when you want a stable id, or
`labelProps={{ htmlFor: undefined }}` to opt out.

## Convenience vs composed

- **Convenience** (`<Input label message … />`) — for typical, single-control fields. Fewer
  lines, auto-wrapping, built-in `message`/`messageColor`. Default to this.
- **Composed** (`Field` + `Control` + `InputBase`) — when you need grouped controls, addons,
  multiple controls per field, or custom layout. The convenience components detect they're
  already inside a `Field`/`Control` and won't double-wrap, so you can mix the two. Inside a
  `Control` they render no `Control` of their own, so set their Control-level props, such as
  the icon props, `isLoading` and `controlSize`, on that `Control`: given to the input there,
  they do nothing and warn in development. `Select` draws its own `isLoading`, so that one
  stays on the `Select`. Inside a `Control` they render no `Field` either, so a convenience
  input you place in a `Control` (for icons, say) takes its `label`, `horizontal` and class
  name from a `Field` wrapped around that `Control`. Given `label`, `message`, `horizontal` or `fieldClassName` in a
  `Control` with no `Field` around it, it renders its own `Field` inside the `.control`,
  which Bulma's styles don't expect, and warns in development. `Autocomplete` and
  `Numberinput` are the exception: in a bare `Control` they always render their own `Field`,
  so give that `Control` a `Field` around it.

## Validation without a library

There is no built-in validation. The pattern is: **own your state, compute errors yourself, and
reflect them with `color` + `message` + `messageColor`.**

```tsx
import { useState } from 'react';
import { Input, Button } from '@allxsmith/bestax-bulma';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const error =
    touched && !valid ? 'Please enter a valid email address.' : undefined;

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        setTouched(true);
        if (valid) {
          // submit…
        }
      }}
    >
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        color={error ? 'danger' : undefined}
        message={error}
        messageColor={error ? 'danger' : undefined}
        iconLeftName="envelope"
      />
      <Button color="primary" type="submit" mt="3">
        Sign up
      </Button>
    </form>
  );
}
```

Rules of thumb:

- Set `color="danger"` on the input **and** `messageColor="danger"` on the help text so both the
  control and the message read as an error. Use `'success'` to signal a valid field.
- Want a different validation library? Wire it up yourself — pass its `value`/`onChange`/error
  string into these props. bestax does not prescribe one.
- For grouped controls, render the `<p class="help">` via the `message` prop of the convenience
  component, or add it manually inside the `Field` when composing.

See `references/api.md` for per-component props and `references/patterns.md` for a full
multi-field form plus the advanced inputs.

## Reuse the shipped components

bestax ships the whole form surface — Input, Select, TextArea, Checkbox(es), Radio(s), Switch,
File, Autocomplete, Slider, Numberinput, Rate, Taginput, and the date/time inputs (see the
inventory above). **Compose these; don't hand-roll raw `<input class="input">` markup or
reinvent a control.** If you think a control is missing, check `bulma-ui/src/index.ts` and
`docs/docs/api/form/` first — it's probably already there under a different name.

## What happens after submit

A form is not finished at the last field. The two components that carry the result are easy to
miss because Bulma has something that looks close:

- **Confirmation** — `Toast`, not `Notification`/`Message`. Mount
  `<ToastContainer position="top-right" />` once at the app root, then call
  `toast.success('Demo booked')` from the submit handler (`.danger` for a failed submit). It
  self-dismisses.
- **"Are you sure?"** — `Dialog`, not `Modal`. Mount `<DialogContainer />` at the root, then
  `if (await dialog.confirm({ title: 'Delete this key?', message: '…', type: 'danger' })) …`.
  It resolves to a boolean, so a destructive action stays one `if` rather than a state machine.
  `Modal` is an empty shell — with it you rebuild the title, message and button row by hand.

Both also work as plain controlled components (`<Toast message … onClose>`,
`<Dialog isOpen … onConfirm onCancel>`) when the state should live in your component.

## Visually inspect it in a browser

Forms have layout, spacing, and _stateful_ behavior that types and unit tests don't cover.
Before calling a form done, **render it and look at it**: run `pnpm storybook` (in `bulma-ui`)
or the docs dev server, open the form, and check field alignment/spacing, the help-text/error
states, and the validation flow (submit empty → fields turn `danger` with messages; fix → errors
clear). If claude-in-chrome or Playwright is available, drive the browser and screenshot the
valid and error states; otherwise eyeball it yourself. No browser at all (headless CI)? Fall
back to a production build plus a Node `renderToString` smoke render, grep the emitted HTML
for the expected classes/states, and say plainly that the visual pass is still owed.

## Checklist

- [ ] Built from the shipped form components (no hand-rolled inputs / reinvented controls).
- [ ] Every label is programmatically associated — the convenience `label` prop, the group
      inputs, and `Field` + single-base composition all do this automatically; pass
      `labelProps={{ htmlFor }}` plus a matching `id` only for a stable id, and label a
      multi-control `Field`'s controls individually (`aria-label`, `aria-labelledby`, or
      a `<label htmlFor>` matching each control's `id`).
- [ ] Controlled inputs have both `value` and `onChange` (or use `defaultValue` uncontrolled).
- [ ] Error state shows via `color="danger"` + `message` + `messageColor="danger"`.
- [ ] Grouped/addon layouts use explicit `Field` + `Control` composition.
- [ ] No assumption of a built-in validation/form library — state is owned by the app.
- [ ] Submit feedback is a `Toast` and any "are you sure?" is a `Dialog` — not a hand-placed
      `Notification` or a `Modal` you filled in yourself.
- [ ] **Rendered and visually inspected in a browser** — layout and the error/validation states
      look right, not just green tests. No browser available? The `renderToString` fallback above
      counts only if you grepped the emitted classes/states **and** said the visual pass is owed.
