---
title: Autocomplete
sidebar_label: Autocomplete
description: The `Autocomplete` component provides an input field with dropdown suggestions that filter based on user input.
---

# Autocomplete

## Overview

<!-- bestax:generated overview -->

The `Autocomplete` component provides an input field with dropdown suggestions that filter based on user input.

<!-- /bestax:generated overview -->

It supports both string arrays and object data, keyboard navigation, and custom templates.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Autocomplete } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Autocomplete

Simple autocomplete with string array.

```tsx live
function example() {
  const [selected, setSelected] = useState(null);
  const fruits = [
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberry',
    'Fig',
    'Grape',
  ];

  return (
    <Block>
      <Autocomplete
        data={fruits}
        placeholder="Search fruit..."
        onSelect={setSelected}
      />
      {selected && <Paragraph mt="2">Selected: {selected}</Paragraph>}
    </Block>
  );
}
```

---

### Open on Focus

Dropdown opens immediately when input is focused.

```tsx live
function example() {
  const [selected, setSelected] = useState(null);
  const countries = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
  ];

  return (
    <Autocomplete
      data={countries}
      placeholder="Select a country..."
      openOnFocus
      onSelect={setSelected}
    />
  );
}
```

---

### With Clear Button

Autocomplete with clearable input.

```tsx live
function example() {
  const [selected, setSelected] = useState(null);
  const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

  return (
    <Autocomplete
      data={options}
      placeholder="Search options..."
      clearable
      onSelect={setSelected}
    />
  );
}
```

---

### Color and Size Variants

Autocomplete with different colors and sizes.

```tsx live
<Block display="flex" flexDirection="column" gap="4">
  <Autocomplete
    data={['Apple', 'Banana', 'Cherry']}
    placeholder="Primary small"
    color="primary"
    size="small"
  />
  <Autocomplete
    data={['Apple', 'Banana', 'Cherry']}
    placeholder="Info normal"
    color="info"
  />
  <Autocomplete
    data={['Apple', 'Banana', 'Cherry']}
    placeholder="Success medium"
    color="success"
    size="medium"
  />
  <Autocomplete
    data={['Apple', 'Banana', 'Cherry']}
    placeholder="Danger large"
    color="danger"
    size="large"
  />
</Block>
```

---

### With Object Data

Autocomplete with object items.

```tsx live
function example() {
  const [selected, setSelected] = useState(null);
  const users = [
    { value: '1', label: 'John Doe', email: 'john@example.com' },
    { value: '2', label: 'Jane Smith', email: 'jane@example.com' },
    { value: '3', label: 'Bob Johnson', email: 'bob@example.com' },
  ];

  return (
    <Block>
      <Autocomplete
        data={users}
        field="label"
        placeholder="Search users..."
        openOnFocus
        onSelect={setSelected}
      />
      {selected && (
        <Paragraph mt="2">
          Selected: {selected.label} ({selected.email})
        </Paragraph>
      )}
    </Block>
  );
}
```

---

### Custom Item Template

Autocomplete with custom item rendering.

```tsx live
function example() {
  const [selected, setSelected] = useState(null);
  const users = [
    { value: '1', label: 'John Doe', role: 'Admin' },
    { value: '2', label: 'Jane Smith', role: 'Editor' },
    { value: '3', label: 'Bob Johnson', role: 'Viewer' },
  ];

  return (
    <Autocomplete
      data={users}
      field="label"
      placeholder="Search users..."
      openOnFocus
      onSelect={setSelected}
      itemTemplate={item => (
        <Block display="flex" justifyContent="space-between">
          <Span>{item.label}</Span>
          <Tag color="info" light>
            {item.role}
          </Tag>
        </Block>
      )}
    />
  );
}
```

---

### With Empty State

Custom content when no results match.

```tsx live
function example() {
  const options = ['Apple', 'Banana', 'Cherry'];

  return (
    <Autocomplete
      data={options}
      placeholder="Try searching 'xyz'..."
      empty={
        <Paragraph textColor="grey">
          <Icon name="search" variant="solid" mr="2" />
          No results found
        </Paragraph>
      }
    />
  );
}
```

---

### Loading State

Autocomplete showing loading indicator.

```tsx live
<Autocomplete data={[]} placeholder="Loading..." loading />
```

---

### Keep First Highlighted

First option stays highlighted while typing.

```tsx live
function example() {
  const fruits = [
    'Apple',
    'Apricot',
    'Avocado',
    'Banana',
    'Blackberry',
    'Blueberry',
  ];

  return (
    <Autocomplete data={fruits} placeholder="Type to filter..." keepFirst />
  );
}
```

---

### Context-Aware Rendering

The `Autocomplete` component is context-aware: it detects whether it is already inside a `Field` and adjusts its rendering accordingly. This means you can use it standalone with a `label` prop (it wraps itself in a Field), or inside a `Field` (it skips rendering its own).

:::note
Autocomplete does not use ControlContext, so the "With Field and Control Wrappers" example below uses Field wrapping only. The Control wrapper is shown for layout consistency but does not change the component's internal rendering.
:::

#### Default (with label)

The simplest usage — the component automatically renders its own Field wrapper.

```tsx live
<Autocomplete
  label="Fruit"
  data={['Apple', 'Banana', 'Cherry']}
  placeholder="Search fruit..."
/>
```

---

#### With Field Wrapper

When you need manual control over the Field layout (e.g., horizontal forms), wrap the component in `Field`. The component detects it's inside a Field and skips rendering its own.

```tsx live
function example() {
  return (
    <Field horizontal label="Fruit">
      <Field.Body>
        <Field>
          <Autocomplete
            data={['Apple', 'Banana', 'Cherry']}
            placeholder="Search fruit..."
          />
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

#### With Field and Control Wrappers

For full manual composition with icons, wrap in both Field and Control. Autocomplete does not consume ControlContext, but the Field wrapper is still detected and its own Field is skipped.

```tsx live
function example() {
  return (
    <Field horizontal label="Fruit">
      <Field.Body>
        <Field>
          <Control iconLeftName="search">
            <Autocomplete
              data={['Apple', 'Banana', 'Cherry']}
              placeholder="Search fruit..."
            />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  );
}
```

---

## Keyboard Navigation

| Key      | Action                            |
| -------- | --------------------------------- |
| `↓`      | Open dropdown / Move down         |
| `↑`      | Move up                           |
| `Enter`  | Select highlighted item           |
| `Tab`    | Select highlighted and move focus |
| `Escape` | Close dropdown                    |

---

## Form Submission

`Autocomplete` is an HTML form element. Pass a `name` prop and the typed/selected text is forwarded to the inner `<input>` so the value submits with the surrounding form, exactly like a native text input.

| Prop       | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| `name`     | Form field name. Forwarded to the inner `<input>`.           |
| `form`     | Optional id of the form the input belongs to.                |
| `required` | Marks the field as required for native HTML form validation. |

```tsx live
function AutocompleteFormDemo() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
      }}
    >
      <Autocomplete
        name="city"
        data={['New York', 'London', 'Paris', 'Tokyo', 'Sydney']}
        placeholder="Search a city…"
      />
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

- Uses `role="combobox"` with `aria-expanded`
- Has `aria-haspopup="listbox"` and `aria-autocomplete="list"`
- Dropdown items use `role="option"` with `aria-selected`
- Disabled items have `aria-disabled`
- Full keyboard navigation support

---

## Related Components

- [Taginput](./taginput.md) - For multiple tag selection with autocomplete
- [Select](./select.md) - For simple dropdown selection
- [Input](./input.md) - For basic text input

---

## Additional Resources

- [Storybook: Autocomplete Stories](https://bestax.io/storybook/?path=/story/form-autocomplete)

:::tip Pro Tip
Use `keepFirst` combined with `Enter` to quickly select the first matching result without using the mouse.
:::

---

## Props

<!-- bestax:generated props -->

| Prop                     | Type                                                                            | Default   | Description                                                       |
| ------------------------ | ------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------- |
| `data`                   | `AutocompleteItem[]` \| `string[]`                                              | `[]`      | The options data to display (required).                           |
| `value`                  | `string`                                                                        | —         | The current input value (controlled).                             |
| `selected`               | `AutocompleteItem` \| `string` \| `null`                                        | —         | The selected item (controlled).                                   |
| `placeholder`            | `string`                                                                        | —         | Placeholder text for the input.                                   |
| `field`                  | `string`                                                                        | `'label'` | Object property to use as the display field.                      |
| `clearable`              | `boolean`                                                                       | `false`   | Whether to show a clear button.                                   |
| `openOnFocus`            | `boolean`                                                                       | `false`   | Open dropdown when input is focused.                              |
| `keepFirst`              | `boolean`                                                                       | `false`   | Keep first option highlighted.                                    |
| `keepOpen`               | `boolean`                                                                       | `false`   | Keep dropdown open after selection.                               |
| `selectOnClickOutside`   | `boolean`                                                                       | `false`   | Select highlighted item on click outside.                         |
| `maxHeight`              | `number`                                                                        | `200`     | Maximum dropdown height in pixels.                                |
| `dropdown`               | `boolean`                                                                       | `false`   | Render as dropdown style.                                         |
| `loading`                | `boolean`                                                                       | `false`   | Show loading state.                                               |
| `disabled`               | `boolean`                                                                       | `false`   | Whether the input is disabled.                                    |
| `checkInfiniteScroll`    | `boolean`                                                                       | `false`   | Enables infinite scroll detection in the dropdown.                |
| `infiniteScrollDistance` | `number`                                                                        | `50`      | Distance in pixels from the bottom to trigger `onInfiniteScroll`. |
| `color`                  | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —         | Input color variant.                                              |
| `size`                   | `'small'` \| `'medium'` \| `'large'`                                            | —         | Size variant.                                                     |
| `name`                   | `string`                                                                        | —         | Form field name. Forwarded to the inner `<input>`.                |
| `form`                   | `string`                                                                        | —         | Optional id of the form the input belongs to.                     |
| `required`               | `boolean`                                                                       | `false`   | Marks the field as required for native HTML form validation.      |
| `onInput`                | `(value: string) => void`                                                       | —         | Callback when input value changes.                                |
| `onSelect`               | `(item: AutocompleteItem \| string \| null) => void`                            | —         | Callback when item is selected.                                   |
| `onActiveChange`         | `(active: boolean) => void`                                                     | —         | Callback when dropdown active state changes.                      |
| `onInfiniteScroll`       | `() => void`                                                                    | —         | Callback when scrolled to bottom (infinite scroll).               |
| `itemTemplate`           | `(item: AutocompleteItem \| string) => React.ReactNode`                         | —         | Custom render for items.                                          |
| `header`                 | `React.ReactNode`                                                               | —         | Custom header in dropdown.                                        |
| `footer`                 | `React.ReactNode`                                                               | —         | Custom footer in dropdown.                                        |
| `empty`                  | `React.ReactNode`                                                               | —         | Content to show when no results.                                  |
| `label`                  | `React.ReactNode`                                                               | —         | Field label, rendered above the widget.                           |
| `labelSize`              | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | —         | Size for the label (used in horizontal layouts).                  |
| `labelProps`             | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`     | —         | Props for the label element.                                      |
| `horizontal`             | `boolean`                                                                       | `false`   | Horizontal field layout.                                          |
| `message`                | `React.ReactNode`                                                               | —         | Help/validation message below the input.                          |
| `messageColor`           | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —         | Bulma color for the message.                                      |
| `fieldClassName`         | `string`                                                                        | —         | Additional CSS classes for the Field wrapper.                     |
| `children`               | `React.ReactNode`                                                               | —         | Content rendered inside the component.                            |
| `className`              | `string`                                                                        | —         | Additional CSS classes.                                           |
| `ref`                    | `React.Ref<HTMLElement>`                                                        | —         | Ref forwarded to the input element.                               |
| `...`                    | All standard `<div>` attributes and Bulma helper props                          | —         | See [Helper Props](../helpers/usebulmaclasses.md)                 |

<!-- /bestax:generated props -->

### AutocompleteItem

| Prop       | Type      | Description               |
| ---------- | --------- | ------------------------- |
| `value`    | `string`  | The item value.           |
| `label`    | `string`  | Display label (optional). |
| `disabled` | `boolean` | Whether item is disabled. |

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Autocomplete` registers these variables on its own `.autocomplete` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                 | Sass Variable                         | Default                        |
| -------------------------------------------- | ------------------------------------- | ------------------------------ |
| `--bulma-autocomplete-dropdown-z-index`      | `$autocomplete-dropdown-z-index`      | `20`                           |
| `--bulma-autocomplete-dropdown-offset`       | `$autocomplete-dropdown-offset`       | `4px`                          |
| `--bulma-autocomplete-dropdown-background`   | `$autocomplete-dropdown-background`   | `var(--bulma-scheme-main)`     |
| `--bulma-autocomplete-dropdown-radius`       | `$autocomplete-dropdown-radius`       | `var(--bulma-radius)`          |
| `--bulma-autocomplete-dropdown-shadow`       | `$autocomplete-dropdown-shadow`       | `var(--bulma-shadow)`          |
| `--bulma-autocomplete-dropdown-padding-y`    | `$autocomplete-dropdown-padding-y`    | `0.5rem`                       |
| `--bulma-autocomplete-item-padding`          | `$autocomplete-item-padding`          | `0.375rem 1rem`                |
| `--bulma-autocomplete-item-color`            | `$autocomplete-item-color`            | `var(--bulma-text)`            |
| `--bulma-autocomplete-item-hover-background` | `$autocomplete-item-hover-background` | `hsla(0, 0%, 50%, 0.13)`       |
| `--bulma-autocomplete-item-hover-color`      | `$autocomplete-item-hover-color`      | `var(--bulma-text-strong)`     |
| `--bulma-autocomplete-item-disabled-color`   | `$autocomplete-item-disabled-color`   | `var(--bulma-text-weak)`       |
| `--bulma-autocomplete-item-disabled-opacity` | `$autocomplete-item-disabled-opacity` | `0.5`                          |
| `--bulma-autocomplete-header-footer-padding` | `$autocomplete-header-footer-padding` | `0.5rem 1rem`                  |
| `--bulma-autocomplete-header-footer-color`   | `$autocomplete-header-footer-color`   | `var(--bulma-text-weak)`       |
| `--bulma-autocomplete-header-footer-size`    | `$autocomplete-header-footer-size`    | `var(--bulma-size-small)`      |
| `--bulma-autocomplete-border-color`          | `$autocomplete-border-color`          | `var(--bulma-border)`          |
| `--bulma-autocomplete-border-hover-color`    | `$autocomplete-border-hover-color`    | `var(--bulma-border-hover)`    |
| `--bulma-autocomplete-icon-hover-color`      | `$autocomplete-icon-hover-color`      | `var(--bulma-text-strong)`     |
| `--bulma-autocomplete-loader-border-color`   | `$autocomplete-loader-border-color`   | `var(--bulma-border)`          |
| `--bulma-autocomplete-loader-active-color`   | `$autocomplete-loader-active-color`   | `var(--bulma-primary)`         |
| `--bulma-autocomplete-loader-duration`       | `$autocomplete-loader-duration`       | `0.6s`                         |
| `--bulma-autocomplete-empty-color`           | `$autocomplete-empty-color`           | `var(--bulma-text-weak)`       |
| `--bulma-autocomplete-scrollbar-width`       | `$autocomplete-scrollbar-width`       | `8px`                          |
| `--bulma-autocomplete-scrollbar-track`       | `$autocomplete-scrollbar-track`       | `var(--bulma-scheme-main-bis)` |
| `--bulma-autocomplete-scrollbar-thumb`       | `$autocomplete-scrollbar-thumb`       | `var(--bulma-border)`          |
| `--bulma-autocomplete-scrollbar-thumb-hover` | `$autocomplete-scrollbar-thumb-hover` | `var(--bulma-border-hover)`    |
| `--bulma-autocomplete-item-small-padding`    | `$autocomplete-item-small-padding`    | `0.25rem 0.75rem`              |
| `--bulma-autocomplete-item-medium-padding`   | `$autocomplete-item-medium-padding`   | `0.5rem 1.25rem`               |
| `--bulma-autocomplete-item-large-padding`    | `$autocomplete-item-large-padding`    | `0.625rem 1.5rem`              |

<!-- /bestax:generated cssvars -->
