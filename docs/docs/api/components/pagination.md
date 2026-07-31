---
title: Pagination
sidebar_label: Pagination
description: The `Pagination` component provides a flexible, composable Bulma pagination navigation for your Bulma React UI.
---

# Pagination

## Overview

<!-- bestax:generated overview -->

The `Pagination` component provides a flexible, composable Bulma pagination navigation for your Bulma React UI.

<!-- /bestax:generated overview -->

It supports color, size, alignment, rounded corners, disabled states, and both controlled and uncontrolled usage. Use the provided subcomponents to build complex paginations: previous/next buttons, page links, ellipsis, and custom content.

:::info
Use `Pagination` for navigating lists of results, pages, or any content split across screens.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Pagination } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Pagination

This example demonstrates a basic pagination navigation using `Pagination`, `Pagination.List`, and `Pagination.Link` subcomponents. The `active` prop highlights the current page, while previous/next arrows and an ellipsis provide navigation for larger sets. Adjust the structure to match your data set or navigation needs.

```tsx live
<Pagination>
  <Pagination.List>
    <Pagination.Link>&laquo;</Pagination.Link>
    <Pagination.Link active>1</Pagination.Link>
    <Pagination.Link>2</Pagination.Link>
    <Pagination.Link>3</Pagination.Link>
    <Pagination.Ellipsis />
    <Pagination.Link>10</Pagination.Link>
    <Pagination.Link>&raquo;</Pagination.Link>
  </Pagination.List>
</Pagination>
```

---

### Sizes

Showcases the use of the `size` prop to render paginations in different sizes. Set `size="small"`, `size="medium"`, or `size="large"` to match the pagination to your UI scale. Each instance below demonstrates a different size, with the `active` prop indicating the current page.

```tsx live
<>
  <Pagination size="small" mb="2">
    <Pagination.List>
      <Pagination.Link>1</Pagination.Link>
      <Pagination.Link active>2</Pagination.Link>
      <Pagination.Link>3</Pagination.Link>
    </Pagination.List>
  </Pagination>
  <Pagination size="medium" mb="2">
    <Pagination.List>
      <Pagination.Link>1</Pagination.Link>
      <Pagination.Link active>2</Pagination.Link>
      <Pagination.Link>3</Pagination.Link>
    </Pagination.List>
  </Pagination>
  <Pagination size="large">
    <Pagination.List>
      <Pagination.Link>1</Pagination.Link>
      <Pagination.Link active>2</Pagination.Link>
      <Pagination.Link>3</Pagination.Link>
    </Pagination.List>
  </Pagination>
</>
```

---

### Alignment

Demonstrates the `align` prop to control the pagination alignment. Use `align="centered"` to center the pagination, or `align="right"` to align it to the right. This affects the entire pagination component, including the list of links and any additional content.

```tsx live
<>
  <Pagination align="centered" mb="2">
    <Pagination.List>
      <Pagination.Link>1</Pagination.Link>
      <Pagination.Link active>2</Pagination.Link>
      <Pagination.Link>3</Pagination.Link>
    </Pagination.List>
  </Pagination>
  <Pagination align="right">
    <Pagination.List>
      <Pagination.Link>1</Pagination.Link>
      <Pagination.Link active>2</Pagination.Link>
      <Pagination.Link>3</Pagination.Link>
    </Pagination.List>
  </Pagination>
</>
```

---

### Rounded

This example demonstrates the `rounded` prop, which renders the pagination with rounded corners for a softer, modern look. Use `rounded` to visually distinguish pagination controls or match your app's design language.

```tsx live
<Pagination rounded>
  <Pagination.List>
    <Pagination.Link>1</Pagination.Link>
    <Pagination.Link active>2</Pagination.Link>
    <Pagination.Link>3</Pagination.Link>
  </Pagination.List>
</Pagination>
```

---

### With Disabled

This example shows how to use the `disabled` prop on `Pagination.Link` to indicate unavailable navigation options. Here, the first link is disabled, preventing user interaction. Use `disabled` for links that should not be clickable, such as when on the first or last page.

```tsx live
<Pagination>
  <Pagination.List>
    <Pagination.Link disabled>&laquo;</Pagination.Link>
    <Pagination.Link active>1</Pagination.Link>
    <Pagination.Link>2</Pagination.Link>
    <Pagination.Link>3</Pagination.Link>
    <Pagination.Ellipsis />
    <Pagination.Link>10</Pagination.Link>
    <Pagination.Link>&raquo;</Pagination.Link>
  </Pagination.List>
</Pagination>
```

---

### Controlled Pagination

This example demonstrates a controlled pagination pattern using the `page` state and the `onClick` handler on each `Pagination.Link`. The current page is tracked in state, and clicking a link updates the page. Use this approach for paginations where you need to manage the current page in your app logic.

```tsx live
function example() {
  const [page, setPage] = useState(1);
  return (
    <>
      <Pagination>
        <Pagination.Previous
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Pagination.Previous>
        <Pagination.Next
          disabled={page === 5}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Pagination.Next>
        <Pagination.List>
          {[1, 2, 3, 4, 5].map(i => (
            <Pagination.Link
              key={i}
              active={i === page}
              onClick={() => setPage(i)}
            >
              {i}
            </Pagination.Link>
          ))}
        </Pagination.List>
      </Pagination>
      <Paragraph mt="2">Current page: {page}</Paragraph>
    </>
  );
}
```

---

### Previous/Next with Pagination List

This example combines the `Pagination.Previous` and `Pagination.Next` subcomponents with a `Pagination.List` for a more advanced navigation pattern. Use `Previous` and `Next` for clear navigation controls, and combine with `Pagination.Link` and `Pagination.Ellipsis` for complex paginations.

```tsx live
<Pagination align="centered">
  <Pagination.Previous>Previous</Pagination.Previous>
  <Pagination.Next>Next page</Pagination.Next>
  <Pagination.List>
    <Pagination.Link aria-label="Goto page 1">1</Pagination.Link>
    <Pagination.Ellipsis />
    <Pagination.Link aria-label="Goto page 45">45</Pagination.Link>
    <Pagination.Link active aria-label="Page 46">
      46
    </Pagination.Link>
    <Pagination.Link aria-label="Goto page 47">47</Pagination.Link>
    <Pagination.Ellipsis />
    <Pagination.Link aria-label="Goto page 86">86</Pagination.Link>
  </Pagination.List>
</Pagination>
```

---

### Compound (dot-notation) usage

Every subcomponent is exported by name (`PaginationLink`, `PaginationList`, …) and attached to `Pagination` as a static, so a full pagination can be composed from the single `Pagination` import.

```tsx live
<Pagination>
  <Pagination.Previous>Previous</Pagination.Previous>
  <Pagination.Next>Next page</Pagination.Next>
  <Pagination.List>
    <Pagination.Link active>1</Pagination.Link>
    <Pagination.Link>2</Pagination.Link>
    <Pagination.Ellipsis />
    <Pagination.Link>10</Pagination.Link>
  </Pagination.List>
</Pagination>
```

---

## Accessibility

- The root `Pagination` renders as a semantic `<nav role="navigation" aria-label="pagination">`.
- Use `aria-label` on page links for better screen reader support.
- Disabled and active states are handled with ARIA attributes and classes.

:::note
Pagination links are rendered as `<a>` elements for accessibility and keyboard navigation.
:::

---

## Related Components

- [Helper Props](../helpers/usebulmaclasses.md): All Bulma utility helpers can be used.
- [`Button`](../elements/button.md): For custom page controls if needed.

---

## Additional Resources

- [Bulma Pagination Documentation](https://bulma.io/documentation/components/pagination/)
- [Storybook: Pagination Stories](https://bestax.io/storybook/?path=/story/components-pagination--basic)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Pagination />` and its subcomponents for utility-based styling.
:::

---

## Props

<!-- bestax:generated props -->

| Prop           | Type                                                                                                                               | Default | Description                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------- |
| `color`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —       | Color modifier for the pagination.                  |
| `textColor`    | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                            | —       | Text color helper.                                  |
| `bgColor`      | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                            | —       | Background color helper.                            |
| `size`         | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Size modifier for the pagination.                   |
| `align`        | `'centered'` \| `'right'`                                                                                                          | —       | Alignment for the pagination.                       |
| `rounded`      | `boolean`                                                                                                                          | `false` | Renders pagination with rounded corners.            |
| `total`        | `number`                                                                                                                           | —       | Total number of pages (for custom implementations). |
| `current`      | `number`                                                                                                                           | —       | Current page (for controlled implementations).      |
| `onPageChange` | `(page: number) => void`                                                                                                           | —       | Callback when a page is selected.                   |
| `className`    | `string`                                                                                                                           | —       | Additional CSS classes.                             |
| `children`     | `React.ReactNode`                                                                                                                  | —       | Custom pagination content (usually subcomponents).  |
| `...`          | All standard HTML attributes and Bulma helper props                                                                                | —       | See [Helper Props](../helpers/usebulmaclasses.md)   |

**Subcomponents:**

- `Pagination.Link`: Page number or navigation link.
- `Pagination.List`: Container for page links and ellipsis.
- `Pagination.Ellipsis`: Ellipsis separator.
- `Pagination.Previous`: "Previous" navigation button.
- `Pagination.Next`: "Next" navigation button.

### Pagination.Link

| Prop        | Type                                                                            | Default | Description                                       |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                        | —       | Additional CSS classes.                           |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color modifier.                             |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color.                                       |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color.                                 |
| `active`    | `boolean`                                                                       | `false` | Whether the link is for the current page.         |
| `disabled`  | `boolean`                                                                       | `false` | Whether the link is disabled.                     |
| `children`  | `React.ReactNode`                                                               | —       | Link content.                                     |
| `...`       | All standard `<a>` attributes and Bulma helper props                            | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Pagination.List

| Prop        | Type                                                                            | Default | Description                                       |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                        | —       | Additional CSS classes.                           |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color for the list.                          |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Bulma color modifier for the list.                |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color for the list.                    |
| `children`  | `React.ReactNode`                                                               | —       | List items.                                       |
| `...`       | All standard `<ul>` attributes and Bulma helper props                           | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Pagination.Previous

| Prop        | Type                          | Default | Description                                       |
| ----------- | ----------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                      | —       | Additional CSS classes.                           |
| `disabled`  | `boolean`                     | `false` | Whether previous/next is disabled.                |
| `children`  | `React.ReactNode`             | —       | Button content.                                   |
| `...`       | All standard `<a>` attributes | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### Pagination.Next

| Prop        | Type                          | Default | Description                                       |
| ----------- | ----------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                      | —       | Additional CSS classes.                           |
| `disabled`  | `boolean`                     | `false` | Whether previous/next is disabled.                |
| `children`  | `React.ReactNode`             | —       | Button content.                                   |
| `...`       | All standard `<a>` attributes | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Pagination` registers these variables on its own `.pagination` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                        | Sass Variable                                | Default                                                                                                          |
| --------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--bulma-pagination-margin`                         | `$pagination-margin`                         | `-0.25rem`                                                                                                       |
| `--bulma-pagination-min-width`                      | `$pagination-min-width`                      | `var(--bulma-control-height)`                                                                                    |
| `--bulma-pagination-item-h`                         | `$pagination-item-h`                         | `var(--bulma-scheme-h)`                                                                                          |
| `--bulma-pagination-item-s`                         | `$pagination-item-s`                         | `var(--bulma-scheme-s)`                                                                                          |
| `--bulma-pagination-item-l`                         | `$pagination-item-l`                         | `var(--bulma-scheme-main-l)`                                                                                     |
| `--bulma-pagination-item-background-l-delta`        | `$pagination-item-background-l-delta`        | `0%`                                                                                                             |
| `--bulma-pagination-item-hover-background-l-delta`  | `$pagination-item-hover-background-l-delta`  | `var(--bulma-hover-background-l-delta)`                                                                          |
| `--bulma-pagination-item-active-background-l-delta` | `$pagination-item-active-background-l-delta` | `var(--bulma-active-background-l-delta)`                                                                         |
| `--bulma-pagination-item-border-style`              | `$pagination-item-border-style`              | `solid`                                                                                                          |
| `--bulma-pagination-item-border-width`              | `$pagination-item-border-width`              | `var(--bulma-control-border-width)`                                                                              |
| `--bulma-pagination-item-border-l`                  | `$pagination-item-border-l`                  | `var(--bulma-border-l)`                                                                                          |
| `--bulma-pagination-item-border-l-delta`            | `$pagination-item-border-l-delta`            | `0%`                                                                                                             |
| `--bulma-pagination-item-hover-border-l-delta`      | `$pagination-item-hover-border-l-delta`      | `var(--bulma-hover-border-l-delta)`                                                                              |
| `--bulma-pagination-item-active-border-l-delta`     | `$pagination-item-active-border-l-delta`     | `var(--bulma-active-border-l-delta)`                                                                             |
| `--bulma-pagination-item-focus-border-l-delta`      | `$pagination-item-focus-border-l-delta`      | `var(--bulma-focus-border-l-delta)`                                                                              |
| `--bulma-pagination-item-color-l`                   | `$pagination-item-color-l`                   | `var(--bulma-text-strong-l)`                                                                                     |
| `--bulma-pagination-item-font-size`                 | `$pagination-item-font-size`                 | `1em`                                                                                                            |
| `--bulma-pagination-item-margin`                    | `$pagination-item-margin`                    | `0.25rem`                                                                                                        |
| `--bulma-pagination-item-padding-left`              | `$pagination-item-padding-left`              | `0.5em`                                                                                                          |
| `--bulma-pagination-item-padding-right`             | `$pagination-item-padding-right`             | `0.5em`                                                                                                          |
| `--bulma-pagination-item-outer-shadow-h`            | `$pagination-item-outer-shadow-h`            | `0`                                                                                                              |
| `--bulma-pagination-item-outer-shadow-s`            | `$pagination-item-outer-shadow-s`            | `0%`                                                                                                             |
| `--bulma-pagination-item-outer-shadow-l`            | `$pagination-item-outer-shadow-l`            | `20%`                                                                                                            |
| `--bulma-pagination-item-outer-shadow-a`            | `$pagination-item-outer-shadow-a`            | `0.05`                                                                                                           |
| `--bulma-pagination-nav-padding-left`               | `$pagination-nav-padding-left`               | `0.75em`                                                                                                         |
| `--bulma-pagination-nav-padding-right`              | `$pagination-nav-padding-right`              | `0.75em`                                                                                                         |
| `--bulma-pagination-disabled-color`                 | `$pagination-disabled-color`                 | `var(--bulma-text-weak)`                                                                                         |
| `--bulma-pagination-disabled-background-color`      | `$pagination-disabled-background-color`      | `var(--bulma-border)`                                                                                            |
| `--bulma-pagination-disabled-border-color`          | `$pagination-disabled-border-color`          | `var(--bulma-border)`                                                                                            |
| `--bulma-pagination-current-color`                  | `$pagination-current-color`                  | `var(--bulma-link-invert)`                                                                                       |
| `--bulma-pagination-current-background-color`       | `$pagination-current-background-color`       | `var(--bulma-link)`                                                                                              |
| `--bulma-pagination-current-border-color`           | `$pagination-current-border-color`           | `var(--bulma-link)`                                                                                              |
| `--bulma-pagination-ellipsis-color`                 | `$pagination-ellipsis-color`                 | `var(--bulma-text-weak)`                                                                                         |
| `--bulma-pagination-shadow-inset`                   | `$pagination-shadow-inset`                   | `inset 0 0.0625em 0.125em hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.2)` |
| `--bulma-pagination-selected-item-h`                | `$pagination-selected-item-h`                | `var(--bulma-link-h)`                                                                                            |
| `--bulma-pagination-selected-item-s`                | `$pagination-selected-item-s`                | `var(--bulma-link-s)`                                                                                            |
| `--bulma-pagination-selected-item-l`                | `$pagination-selected-item-l`                | `var(--bulma-link-l)`                                                                                            |
| `--bulma-pagination-selected-item-background-l`     | `$pagination-selected-item-background-l`     | `var(--bulma-link-l)`                                                                                            |
| `--bulma-pagination-selected-item-border-l`         | `$pagination-selected-item-border-l`         | `var(--bulma-link-l)`                                                                                            |
| `--bulma-pagination-selected-item-color-l`          | `$pagination-selected-item-color-l`          | `var(--bulma-link-invert-l)`                                                                                     |

<!-- /bestax:generated cssvars -->
