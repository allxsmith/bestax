---
title: Input
sidebar_label: Input
description: The `Input` component provides a Bulma-styled text input, supporting colors, sizes, rounded corners, static state, hover/focus/loading states, and all Bulma helper props.
---

# Input

## Overview

<!-- bestax:generated overview -->

The `Input` component provides a Bulma-styled text input, supporting colors, sizes, rounded corners, static state, hover/focus/loading states, and all Bulma helper props.

<!-- /bestax:generated overview -->

It is suitable for all standard text input types.

---

## Import

<!-- bestax:generated import -->

```tsx
import {
  Input,
  Field,
  Control,
  Button,
  Select,
  Icon,
} from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

`Input` is a convenience component that internally composes `Field` and `Control`. For most form fields, use `<Input>` directly with its props (`label`, `color`, `size`, `iconLeftName`, `message`, `horizontal`, etc.). Reach for explicit `<Field>` + `<Control>` composition only when you need a layout the convenience props can't express — most commonly **form addons**, **grouped controls**, or **horizontal layouts that mix multiple sub-fields**.

### Default Input

A standard text input. The `placeholder` prop provides hint text for the user.

```tsx live
<Input label="Default" placeholder="Default input" />
```

---

### Color Inputs

The `color` prop applies Bulma color modifiers to the input. Use it to visually distinguish input fields based on context or validation state.

```tsx live
<>
  <Input label="Primary" color="primary" placeholder="Primary input" />
  <Input label="Link" color="link" placeholder="Link input" />
  <Input label="Info" color="info" placeholder="Info input" />
  <Input label="Success" color="success" placeholder="Success input" />
  <Input label="Warning" color="warning" placeholder="Warning input" />
  <Input label="Danger" color="danger" placeholder="Danger input" />
</>
```

---

### Sizes

The `size` prop controls the input's size. Options: `"small"`, `"medium"`, `"large"` (default is normal).

```tsx live
<>
  <Input label="Small" size="small" placeholder="Small input" />
  <Input label="Normal" placeholder="Normal input" />
  <Input label="Medium" size="medium" placeholder="Medium input" />
  <Input label="Large" size="large" placeholder="Large input" />
</>
```

---

### Style: Rounded

The `isRounded` prop gives the input rounded corners for a softer appearance.

```tsx live
<Input label="Rounded" isRounded placeholder="Rounded input" />
```

---

### States

`isHovered`, `isFocused`, and `isLoading` force the corresponding state on the input.

```tsx live
<>
  <Input label="Normal" placeholder="Normal state" />
  <Input label="Hover" isHovered placeholder="Hovered state" />
  <Input label="Focus" isFocused placeholder="Focused state" />
  <Input label="Loading" isLoading placeholder="Loading state" />
</>
```

---

### Loading States by Size

The loading indicator at every input size. Use `controlSize` on `<Input>` to scale the spinner to match.

```tsx live
<>
  <Input
    label="Loading Small"
    size="small"
    controlSize="small"
    isLoading
    placeholder="Loading small"
  />
  <Input label="Loading Normal" isLoading placeholder="Loading normal" />
  <Input
    label="Loading Medium"
    size="medium"
    controlSize="medium"
    isLoading
    placeholder="Loading medium"
  />
  <Input
    label="Loading Large"
    size="large"
    controlSize="large"
    isLoading
    placeholder="Loading large"
  />
</>
```

---

### Disabled & Read Only

Disabled inputs cannot be interacted with; read-only inputs can be focused but not edited.

```tsx live
<>
  <Input label="Disabled" disabled placeholder="Disabled input" />
  <Input label="Read Only" readOnly value="Read only value" />
</>
```

---

### Static State

The `isStatic` prop styles the input as static text, useful for displaying values alongside editable fields. It changes only the styling, so the example adds `readOnly` to stop edits.

```tsx live
<>
  <Input horizontal label="Username" isStatic readOnly value="Static value" />
  <Input horizontal label="Password" placeholder="Editable value" />
</>
```

---

### With Icons (Left and Right)

Add icons via the `iconLeftName` / `iconRightName` shortcuts on `<Input>`.

```tsx live
<>
  <Input iconLeftName="user" iconRightName="check" placeholder="With icons" />
  <Input
    iconLeftName="envelope"
    iconRightName="exclamation-triangle"
    placeholder="Another input"
  />
</>
```

---

### With Icons and Size Variations

Match the input size to the icon size via the `size` + `iconLeftSize` / `iconRightSize` props.

```tsx live
<>
  <Input
    size="small"
    iconLeftName="user"
    iconLeftSize="small"
    iconRightName="check"
    iconRightSize="small"
    placeholder="Icons left/right small"
  />
  <Input
    iconLeftName="user"
    iconRightName="check"
    placeholder="Icons left/right normal"
  />
  <Input
    size="medium"
    iconLeftName="user"
    iconLeftSize="medium"
    iconRightName="check"
    iconRightSize="medium"
    placeholder="Icons left/right medium"
  />
  <Input
    size="large"
    iconLeftName="user"
    iconLeftSize="large"
    iconRightName="check"
    iconRightSize="large"
    placeholder="Icons left/right large"
  />
</>
```

---

### Help Text Colors

Pair `color` and `messageColor` to produce success and danger validation states with matching help text.

```tsx live
<>
  <Input
    label="Username"
    color="success"
    value="bulma"
    message="This username is available"
    messageColor="success"
    iconLeftName="user"
    iconRightName="check"
    onChange={() => {}}
  />
  <Input
    label="Email"
    type="email"
    color="danger"
    value="hello@"
    message="This email is invalid"
    messageColor="danger"
    iconLeftName="envelope"
    iconRightName="exclamation-triangle"
    onChange={() => {}}
  />
</>
```

---

### Form Addons

For multi-control rows like input + button, drop down to manual `Field` + `Control` composition. Use `<Field hasAddons>` with multiple `<Control>` children. Use `<Control isExpanded>` on the input so it fills the available space.

#### Input + Button

```tsx live
<Field hasAddons>
  <Control isExpanded>
    <Input placeholder="Find a repository" />
  </Control>
  <Control>
    <Button color="info">Search</Button>
  </Control>
</Field>
```

#### Input + Static Suffix

A static button is non-interactive — useful for fixed prefixes/suffixes such as an email domain.

```tsx live
<Field hasAddons>
  <Control isExpanded>
    <Input placeholder="Your email" />
  </Control>
  <Control>
    <Button isStatic>@gmail.com</Button>
  </Control>
</Field>
```

#### Select + Input + Button

```tsx live
<Field hasAddons>
  <Control>
    <Select aria-label="Country code">
      <option>+1</option>
      <option>+44</option>
      <option>+33</option>
    </Select>
  </Control>
  <Control isExpanded>
    <Input type="tel" placeholder="Your phone number" />
  </Control>
  <Control>
    <Button color="primary">Call</Button>
  </Control>
</Field>
```

#### Centered Addons

Pass `hasAddons="centered"` to center the addon group on the row.

```tsx live
<Field hasAddons="centered">
  <Control>
    <Button>Yes</Button>
  </Control>
  <Control>
    <Button>Maybe</Button>
  </Control>
  <Control>
    <Button>No</Button>
  </Control>
</Field>
```

#### Right-Aligned Addons

Pass `hasAddons="right"` to right-align the group.

```tsx live
<Field hasAddons="right">
  <Control>
    <Button>Yes</Button>
  </Control>
  <Control>
    <Button>Maybe</Button>
  </Control>
  <Control>
    <Button>No</Button>
  </Control>
</Field>
```

---

### Password Reveal

A show-password toggle is an addon: the `Input` in one `Control` and a `Button` in the next, switching the input's `type` between `password` and `text`. It can't be an icon inside the input the way `iconRight` draws one, because Bulma gives control icons `pointer-events: none` and a click on one lands on the input instead.

The button keeps one accessible name, "Show password", and reports whether it's on through `aria-pressed`, so a screen reader announces a toggle that is pressed or not. `type="button"` stops it submitting the form it sits in. The label goes on an outer `Field`, since a `hasAddons` field lays its children out in a row, and `labelProps={{ htmlFor }}` with a matching `id` associates it with the input across the nested field.

```tsx live
function PasswordReveal() {
  const id = React.useId();
  const [visible, setVisible] = useState(false);

  return (
    <Field label="Password" labelProps={{ htmlFor: id }}>
      <Field hasAddons>
        <Control isExpanded>
          <Input
            id={id}
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
          />
        </Control>
        <Control>
          <Button
            type="button"
            aria-label="Show password"
            aria-pressed={visible}
            onClick={() => setVisible(shown => !shown)}
          >
            <Icon name={visible ? 'eye-slash' : 'eye'} aria-hidden="true" />
          </Button>
        </Control>
      </Field>
    </Field>
  );
}
```

---

### Copy Button

A copy button is an addon too: a read-only `Input` holding the text, and a `Button` that writes it with `navigator.clipboard.writeText`. The button's label reads "Copied" for a moment afterwards. Screen readers don't reliably announce a change to a button's label, so a `role="status"` line under the field says it too.

The clipboard can be missing, since `navigator.clipboard` exists only in secure contexts (HTTPS or localhost), and the browser can refuse the write. Either way the example focuses and selects the text, so the reader can copy it themselves, and explains in a `role="alert"` line. That message is an alert rather than a status because focus moves to the input at the same moment, and a screen reader announcing the focused field can drop a polite message. Both lines are in the page from the start, since a live region that appears together with its text isn't reliably announced.

```tsx live
function CopyButton() {
  const id = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const link = 'https://bestax.io/docs/api/form/input';

  // Put the button's label back after a moment.
  useEffect(() => {
    if (status !== 'copied') return undefined;
    const timer = setTimeout(() => setStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setStatus('copied');
    } catch {
      // No clipboard on this page, or the browser refused the write.
      inputRef.current?.focus();
      inputRef.current?.select();
      setStatus('failed');
    }
  };

  return (
    <Field label="Share link" labelProps={{ htmlFor: id }}>
      <Field hasAddons>
        <Control isExpanded>
          <Input ref={inputRef} id={id} value={link} readOnly />
        </Control>
        <Control>
          <Button type="button" onClick={copy}>
            <Icon
              name={status === 'copied' ? 'check' : 'copy'}
              aria-hidden="true"
            />
            <span>{status === 'copied' ? 'Copied' : 'Copy'}</span>
          </Button>
        </Control>
      </Field>
      <p role="status" className="help">
        {status === 'copied' && 'Copied to the clipboard.'}
      </p>
      <p role="alert" className="help is-danger">
        {status === 'failed' &&
          "Couldn't copy automatically. The link is selected, so copy it from the field."}
      </p>
    </Field>
  );
}
```

---

### Form Group

Use `<Field grouped>` to lay multiple controls out on a single row with consistent spacing — common for form action buttons and search-style rows.

#### Grouped Buttons

```tsx live
<Field grouped>
  <Control>
    <Button color="link">Submit</Button>
  </Control>
  <Control>
    <Button>Cancel</Button>
  </Control>
</Field>
```

#### Centered Group

```tsx live
<Field grouped="centered">
  <Control>
    <Button color="link">Submit</Button>
  </Control>
  <Control>
    <Button>Cancel</Button>
  </Control>
</Field>
```

#### Right-Aligned Group

```tsx live
<Field grouped="right">
  <Control>
    <Button color="link">Submit</Button>
  </Control>
  <Control>
    <Button>Cancel</Button>
  </Control>
</Field>
```

#### Expanded Input + Button

```tsx live
<Field grouped>
  <Control isExpanded>
    <Input placeholder="Find a repository" />
  </Control>
  <Control>
    <Button color="info">Search</Button>
  </Control>
</Field>
```

#### Multiline Group

`grouped="multiline"` allows the row to wrap onto multiple lines.

```tsx live
<Field grouped="multiline">
  {[
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
  ].map(label => (
    <Control key={label}>
      <Button>{label}</Button>
    </Control>
  ))}
</Field>
```

---

### Horizontal — Validation Error

Place a `color="danger"` Input and a danger help message inside the horizontal field body.

```tsx live
<Field horizontal label="Email">
  <Field.Body>
    <Field>
      <Control iconLeftName="envelope" iconRightName="exclamation-triangle">
        <Input type="email" color="danger" value="hello@" onChange={() => {}} />
      </Control>
      <p className="help is-danger">This email is invalid</p>
    </Field>
  </Field.Body>
</Field>
```

---

### Horizontal — Addons (Phone with Country Code)

Combine `Field horizontal` with a nested `Field hasAddons` inside the body to mix layouts.

```tsx live
<Field horizontal label="Phone">
  <Field.Body>
    <Field hasAddons>
      <Control>
        <Button isStatic>+44</Button>
      </Control>
      <Control isExpanded>
        <Input type="tel" placeholder="Your phone number" />
      </Control>
    </Field>
  </Field.Body>
</Field>
```

---

### Horizontal — Submit Row

Use an empty `Field.Label` to align the submit button under the inputs above it.

```tsx live
<>
  <Field horizontal label="Name">
    <Field.Body>
      <Field>
        <Control>
          <Input placeholder="Your name" />
        </Control>
      </Field>
    </Field.Body>
  </Field>
  <Field horizontal>
    <Field.Label />
    <Field.Body>
      <Field>
        <Control>
          <Button color="primary">Submit</Button>
        </Control>
      </Field>
    </Field.Body>
  </Field>
</>
```

---

### Disabled Fieldset

Wrap multiple Inputs in a native `<fieldset disabled>` to disable every field at once.

```tsx live
<fieldset disabled>
  <Input label="Name" placeholder="Your name" />
  <Input label="Email" type="email" placeholder="Your email" />
</fieldset>
```

---

### Context-Aware Rendering

The `Input` component is context-aware: it detects whether it is already inside a `Field` or `Control` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in Field+Control), inside a `Field` (it skips its own Field), or inside both `Field` and `Control` (it renders only the raw input).

#### Default (with label)

The simplest usage — the component automatically renders its own Field and Control wrappers.

```tsx live
<Input label="Username" placeholder="Enter username" />
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="Username">
      <Field.Body>
        <Field>
          <Input placeholder="Enter username" />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual control (e.g., adding icons via Control), wrap in both Field and Control. The component detects both and renders only its raw element.

```tsx live
function example() {
  return (
    <Field horizontal label="Username">
      <Field.Body>
        <Field>
          <Control iconLeftName="user">
            <Input placeholder="Enter username" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

Inside a `Control` with no `Field` around it, `Input` renders no `Field` of its own either. A `label` or `message` needs a `Field`, though, so given either one there it keeps its own `Field` inside the `Control` and warns in development. Wrap the `Control` in a `Field`, as above, and give the `label` to that `Field`.

---

## Accessibility

- Always provide a label. The `label` prop is automatically associated with the input (`htmlFor` plus a generated `id`, or your own `id` if you pass one), so clicking the label focuses the input and assistive technology announces it.
- When composing with `Field` instead, the `Field`'s own `label` associates with the input automatically when the input sits directly in that labeled `Field` — a nested unlabeled `Field` (as in horizontal multi-field layouts) starts its own scope. Pass `labelProps={{ htmlFor }}` and a matching `id` for a stable id or to label across a nested `Field`.
- Use the correct input `type` for semantics (`text`, `email`, etc.).

---

## Related Components

- [`Control`](./control.md): For icons and loading.
- [`Field`](./field.md): For field grouping and labels.

---

## Additional Resources

- [Bulma Input Documentation](https://bulma.io/documentation/form/input/)
- [Storybook: Input Stories](https://bestax.io/storybook/?path=/story/form-input--default)

---

## Props

<!-- bestax:generated props -->

| Prop               | Type                                                                                                                               | Default | Description                                                                                                                                                                                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `React.ReactNode`                                                                                                                  | —       | Field label. Automatically associated with the input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`). |
| `labelSize`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                 | —       | Size for the label.                                                                                                                                                                                                                                                                                      |
| `labelProps`       | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`                                                        | —       | Props for the label element when the component renders its own `Field`; dropped inside an outer `Field` (use that `Field`'s `labelProps` instead). An explicit `htmlFor` key — even `undefined` — overrides the automatic association and no id is generated.                                            |
| `horizontal`       | `boolean`                                                                                                                          | `false` | Horizontal field layout.                                                                                                                                                                                                                                                                                 |
| `iconLeft`         | `IconProps` \| `React.ReactNode`                                                                                                   | —       | Icon props for left icon. Bulma gives control icons `pointer-events: none`, so a clickable node here never receives a click. Put a button beside the input in its own addon `Control` instead.                                                                                                           |
| `iconRight`        | `IconProps` \| `React.ReactNode`                                                                                                   | —       | Icon props for right icon. Bulma gives control icons `pointer-events: none`, so a clickable node here never receives a click. Put a button beside the input in its own addon `Control` instead.                                                                                                          |
| `iconLeftName`     | `string`                                                                                                                           | —       | Shortcut for left icon name.                                                                                                                                                                                                                                                                             |
| `iconRightName`    | `string`                                                                                                                           | —       | Shortcut for right icon name.                                                                                                                                                                                                                                                                            |
| `iconLeftSize`     | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Shortcut for left icon size.                                                                                                                                                                                                                                                                             |
| `iconRightSize`    | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Shortcut for right icon size.                                                                                                                                                                                                                                                                            |
| `hasIconsLeft`     | `boolean`                                                                                                                          | `false` | Force left icon container.                                                                                                                                                                                                                                                                               |
| `hasIconsRight`    | `boolean`                                                                                                                          | `false` | Force right icon container.                                                                                                                                                                                                                                                                              |
| `isLoading`        | `boolean`                                                                                                                          | `false` | Shows a loading spinner on the `Control` it renders. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn (with bestax's CSS loaded). The spinner sits at the right edge, where `iconRight` also sits, and the two overlap; leave the right icon out while loading.                  |
| `isExpanded`       | `boolean`                                                                                                                          | `false` | Expand the control.                                                                                                                                                                                                                                                                                      |
| `controlSize`      | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Control size.                                                                                                                                                                                                                                                                                            |
| `message`          | `React.ReactNode`                                                                                                                  | —       | Help/validation message below the input.                                                                                                                                                                                                                                                                 |
| `messageColor`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                    | —       | Bulma color for the message.                                                                                                                                                                                                                                                                             |
| `fieldClassName`   | `string`                                                                                                                           | —       | Additional CSS classes for the Field.                                                                                                                                                                                                                                                                    |
| `controlClassName` | `string`                                                                                                                           | —       | Additional CSS classes for the Control.                                                                                                                                                                                                                                                                  |
| `color`            | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —       | Bulma color modifier for the input.                                                                                                                                                                                                                                                                      |
| `size`             | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Size modifier for the input.                                                                                                                                                                                                                                                                             |
| `isRounded`        | `boolean`                                                                                                                          | `false` | Rounded input corners.                                                                                                                                                                                                                                                                                   |
| `isStatic`         | `boolean`                                                                                                                          | `false` | Styles the input as static text. It stays editable; add `readOnly` to stop edits.                                                                                                                                                                                                                        |
| `isHovered`        | `boolean`                                                                                                                          | `false` | Applies hovered state.                                                                                                                                                                                                                                                                                   |
| `isFocused`        | `boolean`                                                                                                                          | `false` | Applies focused state.                                                                                                                                                                                                                                                                                   |
| `className`        | `string`                                                                                                                           | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                         |
| `disabled`         | `boolean`                                                                                                                          | `false` | Disabled input.                                                                                                                                                                                                                                                                                          |
| `readOnly`         | `boolean`                                                                                                                          | `false` | Read-only input.                                                                                                                                                                                                                                                                                         |
| `ref`              | `React.Ref<HTMLInputElement>`                                                                                                      | —       | Forwarded to the underlying element.                                                                                                                                                                                                                                                                     |
| `...`              | All standard `<input>` attributes and Bulma helper props                                                                           | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                        |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Input` registers these variables on its own `.input` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                               | Sass Variable                       | Default                                                                                                                  |
| ------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--bulma-input-h`                          | `$input-h`                          | `var(--bulma-scheme-h)`                                                                                                  |
| `--bulma-input-s`                          | `$input-s`                          | `var(--bulma-scheme-s)`                                                                                                  |
| `--bulma-input-l`                          | `$input-l`                          | `var(--bulma-scheme-main-l)`                                                                                             |
| `--bulma-input-border-style`               | `$input-border-style`               | `solid`                                                                                                                  |
| `--bulma-input-border-width`               | `$input-border-width`               | `var(--bulma-control-border-width)`                                                                                      |
| `--bulma-input-border-l`                   | `$input-border-l`                   | `var(--bulma-border-l)`                                                                                                  |
| `--bulma-input-border-l-delta`             | `$input-border-l-delta`             | `0%`                                                                                                                     |
| `--bulma-input-border-color`               | `$input-border-color`               | `hsl(var(--bulma-input-h), var(--bulma-input-s), calc(var(--bulma-input-border-l) + var(--bulma-input-border-l-delta)))` |
| `--bulma-input-hover-border-l-delta`       | `$input-hover-border-l-delta`       | `var(--bulma-hover-border-l-delta)`                                                                                      |
| `--bulma-input-active-border-l-delta`      | `$input-active-border-l-delta`      | `var(--bulma-active-border-l-delta)`                                                                                     |
| `--bulma-input-focus-h`                    | `$input-focus-h`                    | `var(--bulma-focus-h)`                                                                                                   |
| `--bulma-input-focus-s`                    | `$input-focus-s`                    | `var(--bulma-focus-s)`                                                                                                   |
| `--bulma-input-focus-l`                    | `$input-focus-l`                    | `var(--bulma-focus-l)`                                                                                                   |
| `--bulma-input-focus-shadow-size`          | `$input-focus-shadow-size`          | `var(--bulma-focus-shadow-size)`                                                                                         |
| `--bulma-input-focus-shadow-alpha`         | `$input-focus-shadow-alpha`         | `var(--bulma-focus-shadow-alpha)`                                                                                        |
| `--bulma-input-color-l`                    | `$input-color-l`                    | `var(--bulma-text-strong-l)`                                                                                             |
| `--bulma-input-background-l`               | `$input-background-l`               | `var(--bulma-scheme-main-l)`                                                                                             |
| `--bulma-input-background-l-delta`         | `$input-background-l-delta`         | `0%`                                                                                                                     |
| `--bulma-input-height`                     | `$input-height`                     | `var(--bulma-control-height)`                                                                                            |
| `--bulma-input-shadow`                     | `$input-shadow`                     | `inset 0 0.0625em 0.125em hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.05)`        |
| `--bulma-input-placeholder-color`          | `$input-placeholder-color`          | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-strong-l), 0.3)`                                        |
| `--bulma-input-disabled-color`             | `$input-disabled-color`             | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-input-disabled-background-color`  | `$input-disabled-background-color`  | `var(--bulma-background)`                                                                                                |
| `--bulma-input-disabled-border-color`      | `$input-disabled-border-color`      | `var(--bulma-background)`                                                                                                |
| `--bulma-input-disabled-placeholder-color` | `$input-disabled-placeholder-color` | `hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-weak-l), 0.3)`                                          |
| `--bulma-input-arrow`                      | `$input-arrow`                      | `var(--bulma-link)`                                                                                                      |
| `--bulma-input-icon-color`                 | `$input-icon-color`                 | `var(--bulma-text-light)`                                                                                                |
| `--bulma-input-icon-hover-color`           | `$input-icon-hover-color`           | `var(--bulma-text-weak)`                                                                                                 |
| `--bulma-input-icon-focus-color`           | `$input-icon-focus-color`           | `var(--bulma-link)`                                                                                                      |
| `--bulma-input-radius`                     | `$input-radius`                     | `var(--bulma-radius)`                                                                                                    |

<!-- /bestax:generated cssvars -->
