---
title: Radios
sidebar_label: Radios
---

# Radios

## Overview

The `Radios` component wraps multiple `Radio` components in a Bulma-styled group. Use it for lists of mutually exclusive choices, such as RSVP or selection lists.

---

## Import

```tsx
import { Radios, Radio } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop           | Type                      | Description                                                       |
| -------------- | ------------------------- | ----------------------------------------------------------------- |
| `name`         | `string`                  | Form field name shared by every Radio in the group (via context). |
| `value`        | `string`                  | Currently-selected value (controlled mode).                       |
| `defaultValue` | `string`                  | Initial selected value (uncontrolled mode).                       |
| `onChange`     | `(value: string) => void` | Fires when the selection changes.                                 |
| `className`    | `string`                  | Additional CSS classes.                                           |
| `children`     | `React.ReactNode`         | Radio elements to render in the group.                            |
| ...            | All Bulma helper props    | (See [Helper Props](../helpers/usebulmaclasses))                  |

---

## Usage

### Grouped Radios (All Disabled Example)

This example demonstrates the `Radios` component wrapping multiple `Radio` children, all with the same `name` prop for mutual exclusivity. The `disabled` prop is set on each `Radio` to render them as non-interactive. Use this pattern for lists of mutually exclusive options, such as RSVP or selection lists.

```tsx live
<Radios>
  <Radio name="event" disabled>
    {' '}
    Attend{' '}
  </Radio>
  <Radio name="event" disabled>
    {' '}
    Decline{' '}
  </Radio>
  <Radio name="event" disabled>
    {' '}
    Tentative{' '}
  </Radio>
</Radios>
```

---

### Context-Aware Rendering

The `Radios` component is context-aware: it detects whether it is already inside a `Field` or `Control` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in Field+Control), inside a `Field` (it skips its own Field), or inside both `Field` and `Control` (it renders only the raw radio group).

#### Default (with label)

The simplest usage — the component automatically renders its own Field and Control wrappers.

```tsx live
<Radios label="RSVP">
  <Radio name="rsvp"> Attend </Radio>
  <Radio name="rsvp"> Decline </Radio>
  <Radio name="rsvp"> Tentative </Radio>
</Radios>
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="RSVP">
      <Field.Body>
        <Field>
          <Radios>
            <Radio name="rsvp2"> Attend </Radio>
            <Radio name="rsvp2"> Decline </Radio>
            <Radio name="rsvp2"> Tentative </Radio>
          </Radios>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual control, wrap in both Field and Control. The component detects both and renders only the raw radio group.

```tsx live
function example() {
  return (
    <Field horizontal label="RSVP">
      <Field.Body>
        <Field>
          <Control>
            <Radios>
              <Radio name="rsvp3"> Attend </Radio>
              <Radio name="rsvp3"> Decline </Radio>
              <Radio name="rsvp3"> Tentative </Radio>
            </Radios>
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

## Group State

`Radios` can manage selection state for the entire group, matching the pattern used by MUI's `RadioGroup`, Radix's `RadioGroup`, and React Aria's `RadioGroup`. Three usage modes:

1. **Name-only** — pass just `name`. Each child `Radio` manages its own checked state via `defaultChecked` or `checked`. Backwards compatible with existing usage.
2. **Controlled** — pass `value` and `onChange`. The parent owns selection; each `Radio` derives `checked` from `group.value === my.value`.
3. **Uncontrolled** — pass `defaultValue` (and optionally `onChange`). The group manages internal state; `onChange` fires on selection change.

Local props (`checked`, `onChange`) on individual `Radio` children always win over the group context — useful for opt-out scenarios.

### Controlled

```tsx live
function ControlledRadios() {
  const [color, setColor] = React.useState('red');
  return (
    <div>
      <Radios name="color" value={color} onChange={setColor}>
        <Radio value="red">Red</Radio>
        <Radio value="green">Green</Radio>
        <Radio value="blue">Blue</Radio>
      </Radios>
      <p style={{ marginTop: '1rem' }}>
        Selected: <strong>{color}</strong>
      </p>
    </div>
  );
}
```

### Uncontrolled

```tsx live
function UncontrolledRadios() {
  const [last, setLast] = React.useState('');
  return (
    <div>
      <Radios name="size" defaultValue="md" onChange={setLast}>
        <Radio value="sm">Small</Radio>
        <Radio value="md">Medium</Radio>
        <Radio value="lg">Large</Radio>
      </Radios>
      {last && (
        <p style={{ marginTop: '1rem' }}>
          Last selected: <strong>{last}</strong>
        </p>
      )}
    </div>
  );
}
```

---

## Form Submission

`Radios` is HTML-form-compatible. Pass a `name` prop on the group and every child `Radio` inherits it via React context (works at any nesting depth — including custom wrapper components, fragments, and conditionals). The selected value submits as `name=value` in `FormData`, like a native radio group.

| Prop   | Description                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------- |
| `name` | Form field name shared by every child Radio. Children with their own `name` prop keep theirs (explicit > implicit). |

```tsx live
function RadiosFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
      }}
    >
      <Radios name="color">
        <Radio value="red" defaultChecked>
          Red
        </Radio>
        <Radio value="green">Green</Radio>
        <Radio value="blue">Blue</Radio>
      </Radios>
      <div style={{ marginTop: '1rem' }}>
        <button type="submit" className="button is-primary">
          Submit
        </button>
      </div>
      {submitted && <pre style={{ marginTop: '1rem' }}>{submitted}</pre>}
    </form>
  );
}
```

The same `name` propagation works through any wrapper — useful for layouts like radio cards:

```tsx live
function RadiosWrappedFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  const RadioCard = ({ value, label }) => (
    <div
      style={{
        padding: '0.5rem',
        border: '1px solid #ddd',
        borderRadius: 4,
        marginBottom: '0.5rem',
      }}
    >
      <Radio value={value}>{label}</Radio>
    </div>
  );
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
      }}
    >
      <Radios name="plan">
        <RadioCard value="basic" label="Basic — $9/mo" />
        <RadioCard value="pro" label="Pro — $29/mo" />
        <RadioCard value="enterprise" label="Enterprise — Contact us" />
      </Radios>
      <div style={{ marginTop: '1rem' }}>
        <button type="submit" className="button is-primary">
          Submit
        </button>
      </div>
      {submitted && <pre style={{ marginTop: '1rem' }}>{submitted}</pre>}
    </form>
  );
}
```

---

## Accessibility

- The group is rendered as a `<div class="radios">` containing labeled radio buttons.
- Each child should be a `Radio` for proper labeling and accessibility.
- Use the same `name` for all radios in a group to ensure mutual exclusivity.

---

## Related Components

- [`Radio`](./radio.md): Individual radio button.
- [`Field`](./field.md): For labeled/grouped form fields.

---

## Additional Resources

- [Bulma Radios Documentation](https://bulma.io/documentation/form/radio/#grouped-radios)
- [Storybook: Radio Stories](https://bestax.io/storybook/?path=/story/form-radio--listofradios)
