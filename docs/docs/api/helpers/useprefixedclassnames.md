---
title: usePrefixedClassNames
sidebar_label: usePrefixedClassNames
---

# usePrefixedClassNames

## Overview

`usePrefixedClassNames` builds a component class string that honors the `classPrefix` from `ConfigProvider` — the hook every bestax component uses for its own classes. It accepts the same arguments as [`classNames`](./classnames.md) (strings, numbers, arrays, objects — falsy values ignored, duplicates removed), reads the current `classPrefix` from context, and prepends it to **every** emitted class name. Two non-hook variants, `prefixedClassNames` and `createPrefixedClassNames`, do the same when you already have the prefix in hand or are outside a React component.

---

## Import

```tsx
import {
  usePrefixedClassNames,
  prefixedClassNames,
  createPrefixedClassNames,
} from '@allxsmith/bestax-bulma';
```

---

## API

```ts
// Hook: reads classPrefix from the nearest ConfigProvider
function usePrefixedClassNames(
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

// Plain function: pass the prefix explicitly (undefined ⇒ plain classNames)
function prefixedClassNames(
  prefix: string | undefined,
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

// Factory: returns a classNames function bound to a fixed prefix
function createPrefixedClassNames(classPrefix: string): (...args) => string; // args: same union as classNames
```

### Parameters

| Function                   | Parameter     | Type                  | Description                                                                                        |
| -------------------------- | ------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| `usePrefixedClassNames`    | `...args`     | same as `classNames`  | Class values to join. The `classPrefix` from `ConfigProvider` is applied to every resulting class. |
| `prefixedClassNames`       | `prefix`      | `string \| undefined` | Prefix to apply. When `undefined` (or empty), behaves exactly like `classNames`.                   |
| `prefixedClassNames`       | `...args`     | same as `classNames`  | Class values to join.                                                                              |
| `createPrefixedClassNames` | `classPrefix` | `string`              | Prefix baked into the returned function.                                                           |

All three return a space-separated string of unique class names. With no `ConfigProvider` (or no `classPrefix` set), `usePrefixedClassNames` produces the same output as `classNames`.

---

## Usage

### In a custom component (honors `ConfigProvider`)

This is the pattern every bestax component follows: build the component's **own** Bulma classes with `usePrefixedClassNames`, then merge in the (already-prefixed) helper classes from `useBulmaClasses` and the consumer's `className` with plain `classNames` — the consumer's `className` must **not** be prefixed.

```tsx
import {
  usePrefixedClassNames,
  useBulmaClasses,
  classNames,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>, BulmaClassesProps {
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  isRounded?: boolean;
}

function Chip({ color, isRounded, className, children, ...props }: ChipProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  // 'tag is-rounded is-primary' — or 'bestax-tag bestax-is-rounded …'
  // inside <ConfigProvider classPrefix="bestax-">
  const chipClasses = usePrefixedClassNames('tag', {
    [`is-${color}`]: !!color,
    'is-rounded': isRounded,
  });

  return (
    <span
      className={classNames(chipClasses, bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </span>
  );
}
```

Wrapped in a provider, the component emits prefixed classes automatically:

```tsx
import { ConfigProvider } from '@allxsmith/bestax-bulma';

<ConfigProvider classPrefix="bestax-">
  <Chip color="primary" isRounded>
    Prefixed
  </Chip>
  {/* renders class="bestax-tag bestax-is-primary bestax-is-rounded" */}
</ConfigProvider>;
```

### Outside a component: `prefixedClassNames`

When you already know the prefix (or might not have one), pass it as the first argument:

```ts
prefixedClassNames('bulma-', 'button', { 'is-primary': true });
// => 'bulma-button bulma-is-primary'

prefixedClassNames(undefined, 'button', { 'is-primary': true });
// => 'button is-primary'
```

### Reusable prefixer: `createPrefixedClassNames`

Bind the prefix once and reuse the returned function:

```ts
const cx = createPrefixedClassNames('bulma-');

cx('card', ['has-shadow', { 'is-active': true }]);
// => 'bulma-card bulma-has-shadow bulma-is-active'
```

---

## Tips

- The prefix is applied to **every** class, including modifier classes from object keys (`'is-primary'` → `bestax-is-primary`) — this matches the `bestax-prefixed` CSS flavor.
- Never route a consumer-supplied `className` through these helpers; combine it afterwards with plain `classNames` so user classes stay untouched.
- `usePrefixedClassNames` is a React hook — call it unconditionally at the top level of a component. Use `prefixedClassNames`/`createPrefixedClassNames` everywhere else.

---

## See Also

- [`classNames`](./classnames.md): The unprefixed class-string builder these helpers wrap.
- [`ConfigProvider`](./config.md): Where `classPrefix` comes from.
- [`useBulmaClasses`](./usebulmaclasses.md): Helper-prop classes (already prefix-aware).
