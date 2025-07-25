---
title: classNames
sidebar_label: classNames
---

# classNames

## Overview

`classNames` is a utility function for conditionally joining class names together. It takes any number of arguments, which can be strings, numbers, arrays, or objects, and returns a space-separated string of unique class names. This is useful for dynamically constructing className values in React and other frameworks.

---

## Import

```tsx
import { classNames } from '@allxsmith/bestax-bulma;
```

---

## API

```ts
function classNames(
  ...args: (
    | string
    | number
    | undefined
    | null
    | false
    | Record<string, unknown>
    | unknown[]
  )[]
): string;
```

- Accepts any mix of:
  - `string` or `number`
  - Array of valid values (including nested arrays)
  - Object (`{ className: boolean }`), where keys are included if their value is truthy
  - Falsy values (`null`, `undefined`, `false`, `''`) are ignored

---

## Usage

### Basic Usage with Strings

```tsx live
function example() {
  return classNames('column', 'is-half', 'has-text-primary');
  // => 'column is-half has-text-primary'
}
```

---

### Combining Strings, Numbers, Falsy Values

```tsx live
function example() {
  return classNames('notification', 0, null, undefined, '', 'is-primary');
  // => 'notification 0 is-primary'
}
```

---

### Using Arrays

```tsx live
function example() {
  return classNames('button', ['is-primary', 'is-large']);
  // => 'button is-primary is-large'
}
```

---

### Using Objects

```tsx live
function example() {
  const hasError = true;
  return classNames('input', { 'is-danger': hasError, 'is-rounded': true });
  // If hasError = false: 'input is-rounded'
  // If hasError = true:  'input is-danger is-rounded'
}
```

---

### Nested Arrays and Objects

```tsx live
function example() {
  return classNames(
    'column',
    ['is-narrow', ['has-background-primary', { 'is-hidden': false }]],
    { 'is-size-4': true }
  );
  // => 'column is-narrow has-background-primary is-size-4'
}
```

---

### Removing Duplicate Class Names

```tsx live
function example() {
  return classNames('button', 'is-primary', 'button', [
    'is-primary',
    'is-large',
  ]);
  // => 'button is-primary is-large'
}
```

---

### Real Examples from Components

#### Columns and Column

```tsx live
function example() {
  const isGapless = true;
  const isMultiline = true;

  return classNames(
    'columns',
    { 'is-gapless': isGapless, 'is-multiline': isMultiline },
    ['has-background-light', 'is-vcentered']
  );
  // Example output: 'columns is-gapless is-multiline has-background-light is-vcentered'
}
```

#### Grid and Cell

```tsx live
function example() {
  const span = 2;

  return classNames('cell', { 'is-col-span-2': span === 2 }, [
    'has-text-primary',
    'is-row-span-3',
  ]);
  // Example output: 'cell is-col-span-2 has-text-primary is-row-span-3'
}
```

#### Dropdown

```tsx live
function example() {
  const active = true;
  const up = false;
  const right = true;
  const hoverable = false;
  const disabled = false;
  const className = 'my-custom-dropdown';

  return classNames(
    'dropdown',
    {
      'is-active': active,
      'is-up': up,
      'is-right': right,
      'is-hoverable': hoverable,
      'is-disabled': disabled,
    },
    className
  );
  // Possible output: 'dropdown is-active is-right my-custom-dropdown'
}
```

#### Card

```tsx live
function example() {
  const className = 'custom-class';
  const hasShadow = false;
  const bulmaHelperClasses = 'has-text-success';

  return classNames('card', className, bulmaHelperClasses, {
    'is-shadowless': !hasShadow,
  });
  // Example output: 'card custom-class has-text-success is-shadowless'
}
```

#### Menu

```tsx live
function example() {
  const className = 'sidebar-menu';
  const bulmaHelperClasses = 'has-background-light';

  return classNames('menu', className, bulmaHelperClasses);
  // Example output: 'menu sidebar-menu has-background-light'
}
```

#### Breadcrumb

```tsx live
function example() {
  const className = 'custom-breadcrumb';
  const bulmaHelperClasses = undefined;
  const alignment = 'centered';
  const separator = 'dot';
  const size = 'large';

  return classNames('breadcrumb', className, bulmaHelperClasses, {
    'is-centered': alignment === 'centered',
    'has-dot-separator': separator === 'dot',
    'is-large': size === 'large',
  });
  // Example output: 'breadcrumb custom-breadcrumb is-centered has-dot-separator is-large'
}
```

---

## Tips

- All falsy values are ignored.
- Array and object arguments can be nested arbitrarily deep.
- Duplicate class names are automatically removed.
- Useful for React's `className` prop, but can be used anywhere strings are needed.

---

## See Also

- [`useBulmaClasses`](./usebulmaclasses.md): Advanced Bulma helper class generator.
- [Bulma Documentation](https://bulma.io/documentation/)
