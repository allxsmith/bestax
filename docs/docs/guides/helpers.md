---
title: Helper Utilities Overview
sidebar_label: Helpers
---

# Helper Utilities

This page summarizes the helper utilities in Bestax, with a brief description, usage example, and links to full documentation for each. Use these helpers to simplify class name management and apply Bulma utility classes in a type-safe, composable way.

---

## useBulmaClasses

A custom React hook that generates Bulma helper class strings from a set of props. Makes it easy to apply color, spacing, alignment, typography, flexbox, and other Bulma utility classes to your components. Returns both the class string and the remaining props for spreading onto elements.

```tsx
const { bulmaHelperClasses, rest } = useBulmaClasses({
  color: 'primary',
  m: 4,
  ...props,
});
// bulmaHelperClasses: 'has-text-primary m-4'
// rest: all other props
```

[View full documentation.](../api/helpers/usebulmaclasses)

---

## classNames

A utility function for conditionally joining class names together. Accepts any mix of strings, numbers, arrays, or objects, and returns a space-separated string of unique class names. Useful for dynamically constructing `className` values in React and other frameworks.

```tsx
classNames('column', 'is-half', {
  'has-text-primary': true,
  'is-hidden': false,
});
// => 'column is-half has-text-primary'
```

[View full documentation.](../api/helpers/classnames)

---

For more details and advanced usage, see the full documentation for each helper linked above.
