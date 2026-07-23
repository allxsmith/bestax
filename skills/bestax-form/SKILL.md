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
back into the components via the `color`, `message`, and `messageColor` props. See
**Validation without a library** below.

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
├── label        // rendered from Field's `label` prop, or <Field.Label> when horizontal
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
| `DateInput` / `TimeInput` / `DateTimeInput` (+ `*Base`) | Date / time / datetime pickers.                                           |

## Common props

Across the convenience inputs (`Input`, `Select`, `TextArea`, and similar):

| Prop                             | Type                                                                  | Purpose                                                          |
| -------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `color`                          | `'primary' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'danger'` | Visual state — use `'danger'` for errors, `'success'` for valid. |
| `size`                           | `'small' \| 'medium' \| 'large'`                                      | Input size.                                                      |
| `value` / `onChange`             | controlled value + handler                                            | Standard React controlled inputs.                                |
| `defaultValue`                   | uncontrolled initial value                                            | When not controlling state.                                      |
| `disabled`, `readOnly`           | `boolean`                                                             | Native states (`readOnly` on `*Base`).                           |
| `label`                          | `ReactNode`                                                           | Field label (convenience components).                            |
| `message`                        | `ReactNode`                                                           | Help / validation text rendered as `<p class="help">`.           |
| `messageColor`                   | a Bulma color                                                         | Colors the help text (`'danger'` for errors).                    |
| `iconLeftName` / `iconRightName` | `string`                                                              | Icon shortcuts; pair with `hasIconsLeft/Right`.                  |
| `isLoading`                      | `boolean`                                                             | Loading indicator on the Control.                                |

Plus the full Bulma **helper props** (`m`, `p`, `textColor`, `display`, …) on every component
via `useBulmaClasses`.

⚠️ Full-width casing is inconsistent across the library: `Select`, `File`, and `Table` take
`isFullwidth` (lowercase w); `Button` alone takes `isFullWidth`; `Tabs` takes bare `fullwidth`.

## Convenience vs composed

- **Convenience** (`<Input label message … />`) — for typical, single-control fields. Fewer
  lines, auto-wrapping, built-in `message`/`messageColor`. Default to this.
- **Composed** (`Field` + `Control` + `InputBase`) — when you need grouped controls, addons,
  multiple controls per field, or custom layout. The convenience components detect they're
  already inside a `Field`/`Control` and won't double-wrap, so you can mix the two.

## Validation without a library

There is no built-in validation. The pattern is: **own your state, compute errors yourself, and
reflect them with `color` + `message` + `messageColor`.**

```tsx
import { useState } from 'react';
import { Input, Button } from '@allxsmith/bestax-bulma';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const error =
    touched && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
      ? 'Please enter a valid email address.'
      : undefined;

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        setTouched(true);
        if (!error && email) {
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
- [ ] Every input has an associated label (`label` prop, or a `<label htmlFor>` when composing).
- [ ] Controlled inputs have both `value` and `onChange` (or use `defaultValue` uncontrolled).
- [ ] Error state shows via `color="danger"` + `message` + `messageColor="danger"`.
- [ ] Grouped/addon layouts use explicit `Field` + `Control` composition.
- [ ] No assumption of a built-in validation/form library — state is owned by the app.
- [ ] **Rendered and visually inspected in a browser** — layout and the error/validation states
      look right, not just green tests.
