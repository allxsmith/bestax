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

| Prop           | Type                                                                                                                                                                                                                                                                                     | Default | Description                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------- |
| `color`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'`                                                                                                                                                       | —       | Bulma color for the pagination.                     |
| `textColor`    | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Text color for the pagination.                      |
| `bgColor`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —       | Background color for the pagination.                |
| `size`         | `'small'` \| `'medium'` \| `'large'`                                                                                                                                                                                                                                                     | —       | Size modifier.                                      |
| `align`        | `'centered'` \| `'right'`                                                                                                                                                                                                                                                                | —       | Alignment for the pagination.                       |
| `rounded`      | `boolean`                                                                                                                                                                                                                                                                                | `false` | Renders pagination with rounded corners.            |
| `total`        | `number`                                                                                                                                                                                                                                                                                 | —       | Total number of pages (for custom implementations). |
| `current`      | `number`                                                                                                                                                                                                                                                                                 | —       | Current page (for controlled implementations).      |
| `onPageChange` | `(page: number) => void`                                                                                                                                                                                                                                                                 | —       | Callback when a page is selected.                   |
| `className`    | `string`                                                                                                                                                                                                                                                                                 | —       | Additional CSS classes.                             |
| `children`     | `React.ReactNode`                                                                                                                                                                                                                                                                        | —       | Custom pagination content (usually subcomponents).  |
| ...            | All standard HTML and Bulma helper props (see [Helper Props](../helpers/usebulmaclasses))                                                                                                                                                                                                |         | Utility and accessibility props.                    |

**Subcomponents:**

- `Pagination.List`: Container for page links and ellipsis.
- `Pagination.Link`: Page number or navigation link.
- `Pagination.Ellipsis`: Ellipsis separator.
- `Pagination.Previous`: "Previous" navigation button.
- `Pagination.Next`: "Next" navigation button.

---

## Usage

### Basic Pagination

```tsx
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

```tsx
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

### Colors

```tsx
<>
  <Pagination color="primary" style={{ marginBottom: 8 }}>
    <Pagination.List>
      <Pagination.Link>1</Pagination.Link>
      <Pagination.Link active>2</Pagination.Link>
      <Pagination.Link>3</Pagination.Link>
    </Pagination.List>
  </Pagination>
  <Pagination color="danger">
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

```tsx
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

```tsx
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

```tsx
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

```tsx
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

```tsx
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
