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

```tsx
classNames('column', 'is-half', 'has-text-primary');
// => 'column is-half has-text-primary'
```

---

### Combining Strings, Numbers, Falsy Values

```tsx
classNames('notification', 0, null, undefined, '', 'is-primary');
// => 'notification 0 is-primary'
```

---

### Using Arrays

```tsx
classNames('button', ['is-primary', 'is-large']);
// => 'button is-primary is-large'
```

---

### Using Objects

```tsx
classNames('input', { 'is-danger': hasError, 'is-rounded': true });
// If hasError = false: 'input is-rounded'
// If hasError = true:  'input is-danger is-rounded'
```

---

### Nested Arrays and Objects

```tsx
classNames(
  'column',
  ['is-narrow', ['has-background-primary', { 'is-hidden': false }]],
  { 'is-size-4': true }
);
// => 'column is-narrow has-background-primary is-size-4'
```

---

### Removing Duplicate Class Names

```tsx
classNames('button', 'is-primary', 'button', ['is-primary', 'is-large']);
// => 'button is-primary is-large'
```

---

### Real Examples from Components

#### Columns and Column

```tsx
classNames(
  'columns',
  { 'is-gapless': isGapless, 'is-multiline': isMultiline },
  ['has-background-light', 'is-vcentered']
);
// Example output: 'columns is-gapless is-multiline has-background-light is-vcentered'
```

#### Grid and Cell

```tsx
classNames('cell', { 'is-col-span-2': span === 2 }, [
  'has-text-primary',
  'is-row-span-3',
]);
// Example output: 'cell is-col-span-2 has-text-primary is-row-span-3'
```

#### Dropdown

```tsx
classNames(
  'dropdown',
  bulmaHelperClasses,
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
```

#### Card

```tsx
classNames('card', className, bulmaHelperClasses, {
  'is-shadowless': !hasShadow,
});
// Example output: 'card custom-class has-text-success is-shadowless'
```

#### Menu

```tsx
classNames('menu', className, bulmaHelperClasses);
// Example output: 'menu sidebar-menu has-background-light'
```

#### Breadcrumb

```tsx
classNames('breadcrumb', className, bulmaHelperClasses, {
  'is-centered': alignment === 'centered',
  'has-dot-separator': separator === 'dot',
  'is-large': size === 'large',
});
// Example output: 'breadcrumb custom-breadcrumb is-centered has-dot-separator is-large'
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
