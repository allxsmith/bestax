---
title: Checkboxes
sidebar_label: Checkboxes
---

# Checkboxes

## Overview

The `Checkboxes` component wraps multiple `Checkbox` components in a Bulma-styled group. Use for lists of boolean choices, such as preference lists or to-do checklists.

---

## Import

```tsx
import { Checkboxes, Checkbox } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop           | Type                         | Description                                                          |
| -------------- | ---------------------------- | -------------------------------------------------------------------- |
| `name`         | `string`                     | Form field name shared by every Checkbox in the group (via context). |
| `value`        | `string[]`                   | Currently-selected values (controlled mode).                         |
| `defaultValue` | `string[]`                   | Initial selected values (uncontrolled mode).                         |
| `onChange`     | `(values: string[]) => void` | Fires when the selection changes; receives the new array.            |
| `className`    | `string`                     | Additional CSS classes.                                              |
| `children`     | `React.ReactNode`            | Checkbox elements to render in the group.                            |
| ...            | All Bulma helper props       | (See [Helper Props](../helpers/usebulmaclasses))                     |

---

## Usage

### Grouped Checkboxes

This example demonstrates the `Checkboxes` component wrapping multiple `Checkbox` children. Use this pattern for lists of boolean options, such as to-do lists or preference selections. Each `Checkbox` receives its own label via the `children` prop.

```tsx live
<Checkboxes>
  <Checkbox> Make the bed </Checkbox>
  <Checkbox> Brush teeth </Checkbox>
  <Checkbox> Do homework </Checkbox>
  <Checkbox> Feed the pet </Checkbox>
  <Checkbox> Take out the trash </Checkbox>
  <Checkbox> Clean your room </Checkbox>
  <Checkbox> Set the table </Checkbox>
  <Checkbox> Help with dishes </Checkbox>
  <Checkbox> Water the plants </Checkbox>
  <Checkbox> Put away toys </Checkbox>
</Checkboxes>
```

---

### Context-Aware Rendering

The `Checkboxes` component is context-aware: it detects whether it is already inside a `Field` or `Control` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in Field+Control), inside a `Field` (it skips its own Field), or inside both `Field` and `Control` (it renders only the raw checkbox group).

#### Default (with label)

The simplest usage — the component automatically renders its own Field and Control wrappers.

```tsx live
<Checkboxes label="Chores">
  <Checkbox> Make the bed </Checkbox>
  <Checkbox> Brush teeth </Checkbox>
  <Checkbox> Do homework </Checkbox>
</Checkboxes>
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="Chores">
      <Field.Body>
        <Field>
          <Checkboxes>
            <Checkbox> Make the bed </Checkbox>
            <Checkbox> Brush teeth </Checkbox>
            <Checkbox> Do homework </Checkbox>
          </Checkboxes>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual control, wrap in both Field and Control. The component detects both and renders only the raw checkbox group.

```tsx live
function example() {
  return (
    <Field horizontal label="Chores">
      <Field.Body>
        <Field>
          <Control>
            <Checkboxes>
              <Checkbox> Make the bed </Checkbox>
              <Checkbox> Brush teeth </Checkbox>
              <Checkbox> Do homework </Checkbox>
            </Checkboxes>
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

### Compound (dot-notation) usage

`Checkbox` is also available as `Checkboxes.Checkbox`, so a checkbox group can be composed from the single `Checkboxes` import.

```tsx live
<Checkboxes name="frameworks" label="Frameworks">
  <Checkboxes.Checkbox value="react">React</Checkboxes.Checkbox>
  <Checkboxes.Checkbox value="vue">Vue</Checkboxes.Checkbox>
</Checkboxes>
```

---

## Group State

`Checkboxes` can manage the selected-values array for the entire group, matching the pattern used by React Aria's `CheckboxGroup`. Three usage modes:

1. **Name-only** — pass just `name`. Each child `Checkbox` manages its own checked state. Backwards compatible.
2. **Controlled** — pass `value` (an array of selected values) and `onChange`. The parent owns selection; each `Checkbox` derives `checked` from `value.includes(my.value)`.
3. **Uncontrolled** — pass `defaultValue` (an array) and optionally `onChange`. The group manages internal state; `onChange` fires with the new array.

Local props (`checked`, `onChange`) on individual `Checkbox` children always win over the group context.

### Controlled

```tsx live
function ControlledCheckboxes() {
  const [tags, setTags] = React.useState(['react']);
  return (
    <div>
      <Checkboxes name="tags" value={tags} onChange={setTags}>
        <Checkbox value="react">React</Checkbox>
        <Checkbox value="vue">Vue</Checkbox>
        <Checkbox value="angular">Angular</Checkbox>
        <Checkbox value="svelte">Svelte</Checkbox>
      </Checkboxes>
      <p style={{ marginTop: '1rem' }}>
        Selected: <strong>{tags.length ? tags.join(', ') : '(none)'}</strong>
      </p>
    </div>
  );
}
```

### Uncontrolled

```tsx live
function UncontrolledCheckboxes() {
  const [latest, setLatest] = React.useState([]);
  return (
    <div>
      <Checkboxes
        name="features"
        defaultValue={['darkmode']}
        onChange={setLatest}
      >
        <Checkbox value="darkmode">Dark mode</Checkbox>
        <Checkbox value="notifications">Notifications</Checkbox>
        <Checkbox value="analytics">Analytics</Checkbox>
      </Checkboxes>
      {latest.length > 0 && (
        <p style={{ marginTop: '1rem' }}>
          Latest: <strong>{latest.join(', ')}</strong>
        </p>
      )}
    </div>
  );
}
```

---

## Form Submission

`Checkboxes` is HTML-form-compatible. Pass a `name` prop on the group and every child `Checkbox` inherits it via React context (works at any nesting depth). Each checked box submits as `name=value`, producing a standard form-encoded array (e.g., `tags=react&tags=vue`) that server-side parsers handle natively.

| Prop   | Description                                                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------------------------- |
| `name` | Form field name shared by every child Checkbox. Children with their own `name` prop keep theirs (explicit > implicit). |

```tsx live
function CheckboxesFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
      }}
    >
      <Checkboxes name="tags">
        <Checkbox value="react" defaultChecked>
          React
        </Checkbox>
        <Checkbox value="vue" defaultChecked>
          Vue
        </Checkbox>
        <Checkbox value="angular">Angular</Checkbox>
        <Checkbox value="svelte">Svelte</Checkbox>
      </Checkboxes>
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

- The group is rendered as a `<div class="checkboxes">` containing labeled checkboxes.
- Each child should be a `Checkbox` for proper labeling and accessibility.

---

## Related Components

- [`Checkbox`](./checkbox.md): Individual checkbox.
- [`Field`](./field.md): For labeled/grouped form fields.

---

## Additional Resources

- [Bulma Checkboxes Documentation](https://bulma.io/documentation/form/checkbox/#grouped-checkboxes)
- [Storybook: Checkbox Stories](https://bestax.io/storybook/?path=/story/form-checkbox--listofcheckboxes)
