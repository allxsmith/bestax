---
title: Pagination
sidebar_label: Pagination
---

# Pagination

## Overview

The `Pagination` component provides a flexible, composable Bulma pagination navigation for your Bulma React UI. It supports color, size, alignment, rounded corners, disabled states, and both controlled and uncontrolled usage. Use the provided subcomponents to build complex paginations: previous/next buttons, page links, ellipsis, and custom content.

:::info
Use `Pagination` for navigating lists of results, pages, or any content split across screens.
:::

---

## Import

```tsx
import { Pagination } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop           | Type                                                                                      | Default | Description                                         |
| -------------- | ----------------------------------------------------------------------------------------- | ------- | --------------------------------------------------- |
| `size`         | `'small'` \| `'medium'` \| `'large'`                                                      | —       | Size modifier.                                      |
| `align`        | `'centered'` \| `'right'`                                                                 | —       | Alignment for the pagination.                       |
| `rounded`      | `boolean`                                                                                 | `false` | Renders pagination with rounded corners.            |
| `total`        | `number`                                                                                  | —       | Total number of pages (for custom implementations). |
| `current`      | `number`                                                                                  | —       | Current page (for controlled implementations).      |
| `onPageChange` | `(page: number) => void`                                                                  | —       | Callback when a page is selected.                   |
| `className`    | `string`                                                                                  | —       | Additional CSS classes.                             |
| `children`     | `React.ReactNode`                                                                         | —       | Custom pagination content (usually subcomponents).  |
| ...            | All standard HTML and Bulma helper props (see [Helper Props](../helpers/usebulmaclasses)) |         | Utility and accessibility props.                    |

**Subcomponents:**

- `Pagination.List`: Container for page links and ellipsis.
- `Pagination.Link`: Page number or navigation link.
- `Pagination.Ellipsis`: Ellipsis separator.
- `Pagination.Previous`: "Previous" navigation button.
- `Pagination.Next`: "Next" navigation button.

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
  <Pagination size="small" style={{ marginBottom: 8 }}>
    <Pagination.List>
      <Pagination.Link>1</Pagination.Link>
      <Pagination.Link active>2</Pagination.Link>
      <Pagination.Link>3</Pagination.Link>
    </Pagination.List>
  </Pagination>
  <Pagination size="medium" style={{ marginBottom: 8 }}>
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
  <Pagination align="centered" style={{ marginBottom: 8 }}>
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
const [page, setPage] = useState(1);
<Pagination>
  <Pagination.List>
    <Pagination.Link disabled={page === 1} onClick={() => setPage(page - 1)}>
      &laquo;
    </Pagination.Link>
    {[1, 2, 3, 4, 5].map(i => (
      <Pagination.Link key={i} active={i === page} onClick={() => setPage(i)}>
        {i}
      </Pagination.Link>
    ))}
    <Pagination.Ellipsis />
    <Pagination.Link onClick={() => setPage(page + 1)}>&raquo;</Pagination.Link>
  </Pagination.List>
  <div style={{ marginTop: 8 }}>Current page: {page}</div>
</Pagination>;
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
- [Storybook: Pagination Stories](https://bestax.cc/storybook/?path=/story/components-pagination--basic)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Pagination />` and its subcomponents for utility-based styling.
:::
