---
title: Cascader
sidebar_label: Cascader
description: 'The `Cascader` component is a form field whose value sits at the end of a path, such as a city picked by country, then region, then city: it opens a panel of columns, one per level, and shows the path in the field.'
keywords:
  - cascader
  - cascade select
  - cascading select
  - nested select
  - column picker
---

# Cascader

## Overview

<!-- bestax:generated overview -->

The `Cascader` component is a form field whose value sits at the end of a path, such as a city picked by country, then region, then city: it opens a panel of columns, one per level, and shows the path in the field.

<!-- /bestax:generated overview -->

Reach for it when the thing a form asks for is found by narrowing down: a city by its continent
and country, a product category by its department, a file by its folders. Each level opens a
column beside the last, so the whole path stays in view while you pick, and the field shows that
path once it's shut, such as "Europe / Germany / Berlin".

It takes the same `data` as [`TreeSelect`](./treeselect.md), an array of nodes nested through
`children`, and the same value: the picked node's own `value`. The two show the same tree two
ways, so moving from one to the other keeps your data and your value. One default differs: a
TreeSelect picks parents and a Cascader picks only leaves, as Ant Design's do, so set
`parentsSelectable` to keep what the field picks.

:::info
Bulma has no cascading select, so `Cascader` brings a small partial of its own, in `bestax.css`
and its variants, or in `extras.css` next to your own Bulma. The panel is the date pickers'
popover and each item is drawn as Bulma's dropdown item, so the popover's variables theme it here
too.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Cascader } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `label` and the tree as `data`. Each node has a `value`, unique in the whole tree, a
`label`, and `children` for the nodes under it. Open it with a click, Enter, Space or Down. A
click, Enter, Space or Right on a parent opens its column, and a click, Enter or Space on a leaf
picks it and closes the panel.

```tsx live
<Cascader
  label="City"
  placeholder="Pick a city"
  data={[
    {
      value: 'europe',
      label: 'Europe',
      children: [
        {
          value: 'germany',
          label: 'Germany',
          children: [
            { value: 'berlin', label: 'Berlin' },
            { value: 'munich', label: 'Munich' },
          ],
        },
        {
          value: 'france',
          label: 'France',
          children: [{ value: 'paris', label: 'Paris' }],
        },
        { value: 'spain', label: 'Spain', disabled: true },
      ],
    },
    {
      value: 'asia',
      label: 'Asia',
      children: [
        {
          value: 'japan',
          label: 'Japan',
          children: [{ value: 'tokyo', label: 'Tokyo' }],
        },
      ],
    },
  ]}
/>
```

A column opens on a click or a key, never on hover, so moving the pointer to the next column
can't swap it for another. Moving through a column with Up and Down closes the columns after it,
and Left goes back one. A disabled node is still reached by the arrow keys, so a screen reader
finds it, but it's never picked or opened.

### Holding the Value

The value is the picked node's `value`, or `null`. Pass `value` and `onChange` to hold it, as
with any field. `onChange` gets that one value, and the path is in `data` for when you want it.

```tsx live
function example() {
  const [city, setCity] = useState<string | null>('munich');

  return (
    <>
      <Cascader
        label="City"
        value={city}
        onChange={setCity}
        clearable
        data={[
          {
            value: 'germany',
            label: 'Germany',
            children: [
              { value: 'berlin', label: 'Berlin' },
              { value: 'munich', label: 'Munich' },
            ],
          },
          { value: 'austria', label: 'Austria' },
        ]}
      />
      <Paragraph textSize="7">Value: {String(city)}</Paragraph>
    </>
  );
}
```

Opening the panel opens the picked node's path and puts focus on it, however it opens: a click,
a key, `defaultOpen` or an `open` you hold. `clearable` shows a clear
button at the field's end while something is picked. `labels.separator` changes what goes between
the labels in the field, `" / "` unless you set it.

### Picking a Parent

Only leaves are picked unless you pass `parentsSelectable`. With it, a click, Enter or Space on a
parent picks it, and Right or a click on its chevron opens its column, so a category can be as
broad or as narrow as someone wants.

```tsx live
<Cascader
  label="Category"
  parentsSelectable
  labels={{ separator: ' › ' }}
  data={[
    {
      value: 'clothing',
      label: 'Clothing',
      children: [
        { value: 'shirts', label: 'Shirts' },
        { value: 'shoes', label: 'Shoes' },
      ],
    },
    {
      value: 'home',
      label: 'Home',
      children: [
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'garden', label: 'Garden' },
      ],
    },
  ]}
/>
```

`closeOnSelect={false}` keeps the panel open after a pick, for a field that's picked and changed
a few times in a row.

### Searching

`searchable` puts a search box at the top of the panel. While it has text, the columns give way
to a flat list of the paths that match, each shown in full, leaves only unless
`parentsSelectable`. A path matches when any of its labels does, so "germ" finds every city in
Germany. `empty` is what the panel shows when nothing matches, and a screen reader hears it once.

```tsx live
<Cascader
  label="City"
  searchable
  empty="No cities match"
  data={[
    {
      value: 'germany',
      label: 'Germany',
      children: [
        { value: 'berlin', label: 'Berlin' },
        { value: 'munich', label: 'Munich' },
      ],
    },
    {
      value: 'japan',
      label: 'Japan',
      children: [
        { value: 'tokyo', label: 'Tokyo' },
        { value: 'osaka', label: 'Osaka' },
      ],
    },
  ]}
/>
```

Typing a letter on the closed field opens it with that letter in the box, and the search empties
when the panel closes. Inside a [`LocaleProvider`](../helpers/localeprovider.md) with a `locale`,
the match ignores case and the accents that language ignores, so "cafe" finds "Café". `filter`
replaces the match with one of your own, handed the search text, the node and its path from the
top node down, as TreeSelect's `filter` is.

### Loading Columns as They Open

A node with `hasChildren` shows as a parent before its children are known. Fetch them when its
column opens, from `onExpandedChange`, and pass them back in `data`, with `isLoading` while
they're on their way and `loadError` with an `onRetry` when they don't come. The column shows a
loading row, or the error with a Retry, and the live region says what TreeView's does.

```tsx live
function example() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Cascader
      label="Folder"
      onExpandedChange={expanded => {
        if (expanded.includes('photos') && !loaded && !loading) {
          setLoading(true);
          setTimeout(() => {
            setLoaded(true);
            setLoading(false);
          }, 1000);
        }
      }}
      data={[
        {
          value: 'photos',
          label: 'Photos',
          hasChildren: true,
          isLoading: loading,
          children: loaded
            ? [
                { value: 'summer', label: 'Summer' },
                { value: 'winter', label: 'Winter' },
              ]
            : undefined,
        },
        { value: 'docs', label: 'Documents' },
      ]}
    />
  );
}
```

A value no node has, such as one under a column that hasn't loaded, is kept and shown as the
value itself, with a warning in development.

### In a Form

`name` posts the value through a hidden input, empty while nothing is picked. `required` stops the
form while nothing is picked, and the browser's message points at the field. A reset of the form
puts the value back to `defaultValue` and calls `onChange` with it, or empties a value you hold,
calling `onChange` with `null` so you can set it. `disabled`, or a disabled
[`Fieldset`](./fieldset.md) around it, keeps it shut and posts nothing.

```tsx live
<form onSubmit={event => event.preventDefault()}>
  <Cascader
    label="Office"
    name="office"
    required
    data={[
      {
        value: 'emea',
        label: 'EMEA',
        children: [
          { value: 'london', label: 'London' },
          { value: 'dublin', label: 'Dublin' },
        ],
      },
      {
        value: 'americas',
        label: 'Americas',
        children: [{ value: 'toronto', label: 'Toronto' }],
      },
    ]}
  />
  <Button type="submit" color="primary">
    Save
  </Button>
</form>
```

### Icons and Rows of Your Own

A node's `icon` goes before its label, an [`Icon`](../elements/icon.md) name or a node of your
own. `itemTemplate` draws a row's content in place of its label, and the field and the search
results still show the labels.

```tsx live
<Cascader
  label="Team"
  itemTemplate={node => (
    <>
      {node.label} <Tag>{node.value}</Tag>
    </>
  )}
  data={[
    {
      value: 'eng',
      label: 'Engineering',
      icon: 'people-group',
      children: [
        { value: 'web', label: 'Web', icon: 'globe' },
        { value: 'mobile', label: 'Mobile', icon: 'mobile' },
      ],
    },
  ]}
/>
```

### Sizes and Colors

`size` sizes the field and the columns together, and `color` and `isRounded` are Bulma's
modifiers on the field.

```tsx live
<>
  <Cascader
    label="Small"
    size="small"
    color="info"
    data={[{ value: 'a', label: 'Alpha' }]}
  />
  <Cascader
    label="Large, rounded"
    size="large"
    isRounded
    data={[{ value: 'a', label: 'Alpha' }]}
  />
</>
```

### Right to Left

Inside a right-to-left page or `LocaleProvider`, the field's chevron and clear button move to its
left, the columns open to the left with their chevrons turned to match, and Right and Left swap. With no `position`, the panel lines up with the field's right
edge. A `position` you pass stays physical.

```tsx live
<LocaleProvider locale="ar" dir="rtl">
  <Cascader
    label="المدينة"
    defaultValue="berlin"
    clearable
    data={[
      {
        value: 'germany',
        label: 'ألمانيا',
        children: [{ value: 'berlin', label: 'برلين' }],
      },
      { value: 'oceania', label: 'أوقيانوسيا' },
    ]}
  />
</LocaleProvider>
```

---

## Accessibility

- **The field is a combobox that opens a dialog,** as the date pickers' and TreeSelect's are:
  `role="combobox"` with `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` while the
  panel is open, named by its `label`. It's read-only, and its value is the picked node's path.
- **Keys on the field:** a click, Enter, Space, Down or Alt+Down opens the panel, and with
  `searchable` a printable key opens it with that key in the search box.
- **The panel** is a non-modal `dialog`, named by the label or `labels.choose`. Focus moves into
  it as it opens: onto the picked node, its path open, or with nothing picked onto the first
  column's item on an open path, or its first enabled item, so a `defaultExpanded` path stays
  open. It holds
  focus while it's open, as the date pickers' panel does: Tab and Shift+Tab move between the
  search box and the columns, and wrap. Escape and Alt+Up close it and put focus back on the
  field, and so does a pick. A press outside closes it and leaves focus where the press put it.
- **Each column** is a `listbox` with one tab stop and real focus on its `option`s. The first is
  named as the panel is, and each one after it by the label of the item that opened it. Up, Down,
  Home, End and type-ahead move within a column, and type-ahead starts over in each column it
  comes into and after Up, Down, Home or End. Space joins a search under way when an item starts with what's been typed and a
  space, so "new y" reaches "New York", and otherwise picks or opens. Right opens the next column
  and moves into it, Left goes back, and the two swap on a right-to-left page. Disabled items are
  reachable and `aria-disabled`, and Right moves into a column at its item on the open path even
  when that one is disabled.
- **The picked node's path is `aria-selected`,** and drawn filled, its items `is-checked` as
  Combobox's picked items are. The path you've opened, which follows focus, is drawn with a lighter
  tint, its items `is-active` as Combobox's highlighted item is, and isn't announced as selected, so moving around never says an item is picked when it isn't. A disabled
  node on the picked path is selected but not filled, so it stays readable. In forced colors the
  picked path takes the system's highlight and the open path an outline. Right opens the focused
  item and nothing else.
- **An item that opens a column** is described by "Opens a column", or `labels.opens`, since an
  option has no way of its own to say it has items under it. Its chevron is hidden.
- **A column that's loading** ends in a row that says so, and a failed load's row is named by its
  message and its Retry, which Enter, Space or a click run. The live region says when a column
  starts loading and when it's loaded, as TreeView's does.
- **The search box** is named "Search", or `labels.search`, and its results are a listbox of the
  paths that match. Enter picks the highlighted path unless it's disabled, and with none
  highlighted it does nothing, so it never submits the form around the field. When nothing matches, `empty` is said once
  through a polite status region, not again on every key.
- **`required`** makes the field `aria-required`. A read-only field is left out of the browser's
  own check, so a hidden field over it carries `required`. When the browser stops a submit, it
  focuses that one and shows its message, which every browser takes down as it loses focus. So
  focus stays there, reading as the field and drawn on it, with no on-screen keyboard. A press
  goes where it lands, and the next key, other than a modifier on its own, goes to the field and
  does what it would there.
- **Forced colors:** the field, the panel and the columns keep their edges in system colors, the
  path through the columns keeps the system's highlight, and the chevrons are borders, so they
  stay.
- A panel that would run past the left or right edge of the screen, as on a phone with the
  field mid-row, keeps its corner and moves sideways just far enough to fit, or, wider than
  the screen, to the edge its text starts from.

---

## Related Components

- [`TreeSelect`](./treeselect.md): The same `data` and value, picked from a tree, with checkboxes
  for several at once.
- [`TreeView`](../components/treeview.md): The same tree, on the page rather than in a field.
- [`Combobox`](./combobox.md): Picks one value or several from a flat list, with a text field to
  search it.
- [`Select`](./select.md): The browser's own select, for a short flat list.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Cascader Stories](https://bestax.io/storybook/?path=/story/form-cascader--default)
- [WAI-ARIA Authoring Practices: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [WAI-ARIA Authoring Practices: Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)

---

## Props

<!-- bestax:generated props -->

| Prop                | Type                                                                             | Default         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`              | `TreeItemData[]`                                                                 | —               | **Required.** The tree, as nodes nested through `children`. The same nodes TreeSelect takes.                                                                                                                                                                                                                                                                                                                                                                    |
| `label`             | `React.ReactNode`                                                                | —               | The field's label, which names the field through `htmlFor`, and the panel and its first column through `aria-labelledby`. Dropped inside an outer `Field`, whose label names them instead.                                                                                                                                                                                                                                                                      |
| `id`                | `React.HTMLAttributes<HTMLDivElement>['id']`                                     | —               | The field's `id`, which the label then points at. The panel's is this one with `-panel` after it.                                                                                                                                                                                                                                                                                                                                                               |
| `aria-label`        | `React.AriaAttributes['aria-label']`                                             | —               | Names the field, and the panel and its first column, in place of a `label`.                                                                                                                                                                                                                                                                                                                                                                                     |
| `aria-labelledby`   | `React.AriaAttributes['aria-labelledby']`                                        | —               | The ids of what names the field, and the panel and its first column, in place of a `label`.                                                                                                                                                                                                                                                                                                                                                                     |
| `aria-describedby`  | `React.AriaAttributes['aria-describedby']`                                       | —               | The ids of what describes the field.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `value`             | `string` \| `null`                                                               | —               | The picked node's value when you hold the state, or `null` for none. Picking then only calls `onChange`.                                                                                                                                                                                                                                                                                                                                                        |
| `defaultValue`      | `string` \| `null`                                                               | —               | The node picked to begin with, when the Cascader holds its own state.                                                                                                                                                                                                                                                                                                                                                                                           |
| `onChange`          | `(value: string \| null) => void`                                                | —               | Called with the picked node's value, or `null` when it's cleared. The field shows its path. A reset of the field's form calls it too, with `defaultValue`, or with `null` when you hold the value, for you to set.                                                                                                                                                                                                                                              |
| `parentsSelectable` | `boolean`                                                                        | `false`         | A parent can be picked too: its row, Enter and Space pick it, and Right or its chevron opens its column. Without it, only leaves are picked, and a parent's row, Enter and Space open its column. TreeSelect, which takes the same `data`, defaults to `true`, as Ant Design's does, so moving a field from one to the other means setting this to keep what it picks.                                                                                          |
| `closeOnSelect`     | `boolean`                                                                        | `true`          | Closes the panel after a pick and puts focus back on the field.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `expanded`          | `string[]`                                                                       | —               | The values of the items whose columns are open, which is the open path, when you hold the state. Opening the panel opens the picked node's path and reports it through `onExpandedChange`: at once for a click or a key, and only once the panel is on the page when you open it yourself, with `open` or `defaultOpen`. So when you hold this and open the panel yourself, set it to the path you want open.                                                   |
| `defaultExpanded`   | `string[]`                                                                       | `[]`            | The path open to begin with, when the Cascader holds its own state.                                                                                                                                                                                                                                                                                                                                                                                             |
| `onExpandedChange`  | `(expanded: string[]) => void`                                                   | —               | Called with the new path whenever a column opens or closes, opening the panel on the picked node's path included. Fetch a lazy column's items from here.                                                                                                                                                                                                                                                                                                        |
| `open`              | `boolean`                                                                        | —               | Whether the panel is open, controlled: opening and closing then only call `onOpenChange`.                                                                                                                                                                                                                                                                                                                                                                       |
| `defaultOpen`       | `boolean`                                                                        | `false`         | The panel is open to begin with.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `onOpenChange`      | `(open: boolean) => void`                                                        | —               | Called with the new state when the panel opens or closes.                                                                                                                                                                                                                                                                                                                                                                                                       |
| `searchable`        | `boolean`                                                                        | `false`         | Puts a search box at the top of the panel. While it has text, the columns give way to a list of matching paths, leaves only unless `parentsSelectable`. A printable key on the field opens the panel with it in the box, and the search empties when the panel closes.                                                                                                                                                                                          |
| `query`             | `string`                                                                         | —               | The search text when you hold the state.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `defaultQuery`      | `string`                                                                         | `''`            | The search text to begin with.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `onQueryChange`     | `(query: string) => void`                                                        | —               | Called with the search text as it changes.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `filter`            | `(query: string, item: TreeItemData, path: TreeItemData[]) => boolean`           | —               | Whether a path matches the search, in place of the locale-aware match on any of its labels. It's handed the search text trimmed, the node offered, and its path from the top node down, the node last, as TreeSelect's `filter` is. The search runs again when the search text or `data` changes, not when only this does, so one written inline costs nothing.                                                                                                 |
| `empty`             | `React.ReactNode`                                                                | —               | What the panel shows when the search matches nothing, such as "No cities match". Announced once.                                                                                                                                                                                                                                                                                                                                                                |
| `itemTemplate`      | `(item: TreeItemData) => React.ReactNode`                                        | —               | Renders a row's content in place of its label. The field and search results still show the labels.                                                                                                                                                                                                                                                                                                                                                              |
| `placeholder`       | `string`                                                                         | —               | What the field shows while nothing is picked.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `name`              | `string`                                                                         | —               | A form field name. A hidden input posts the picked node's value, empty while nothing is picked.                                                                                                                                                                                                                                                                                                                                                                 |
| `form`              | `string`                                                                         | —               | The id of the form the hidden input belongs to, when it isn't an ancestor.                                                                                                                                                                                                                                                                                                                                                                                      |
| `required`          | `boolean`                                                                        | `false`         | A value is needed: the field is `aria-required`, and the form won't submit while nothing is picked. The browser's message points at the field, which shows focus, and the next key goes to it.                                                                                                                                                                                                                                                                  |
| `disabled`          | `boolean`                                                                        | `false`         | The field can't be used: it can't be focused or opened, and its hidden input doesn't post.                                                                                                                                                                                                                                                                                                                                                                      |
| `clearable`         | `boolean`                                                                        | `false`         | Shows a clear button at the field's inline end while something is picked.                                                                                                                                                                                                                                                                                                                                                                                       |
| `color`             | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —               | Bulma color modifier for the field.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `size`              | `'small'` \| `'medium'` \| `'large'`                                             | —               | The field's size, which the columns follow.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `isRounded`         | `boolean`                                                                        | `false`         | Rounds the field's corners (Bulma's `is-rounded`).                                                                                                                                                                                                                                                                                                                                                                                                              |
| `position`          | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` \| `'auto'` | `'bottom-left'` | Where the panel opens against the field, as on the pickers. Left out, it opens below and lines up with the field's start edge, which is its right edge on a right-to-left page. A corner you pass stays physical, so `bottom-left` lines up the left edges either way. A panel that would run past the viewport's left or right edge keeps its corner and moves sideways, just far enough to fit or, wider than the viewport, to the edge its text starts from. |
| `appendToBody`      | `boolean`                                                                        | `false`         | Renders the panel through a portal, into a `ConfigProvider`'s `portalContainer`, else the overlay it's in that takes its popups, such as a `Modal`, else `document.body`.                                                                                                                                                                                                                                                                                       |
| `labels`            | `CascaderLabels`                                                                 | —               | The visible and accessible strings, in your app's language.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `labelSize`         | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                               | —               | Size for the label (used in horizontal layouts).                                                                                                                                                                                                                                                                                                                                                                                                                |
| `labelProps`        | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`      | —               | Props for the label element.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `horizontal`        | `boolean`                                                                        | `false`         | Horizontal field layout.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `message`           | `React.ReactNode`                                                                | —               | Help/validation message below the input.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `messageColor`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —               | Bulma color for the message.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `fieldClassName`    | `string`                                                                         | —               | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `className`         | `string`                                                                         | —               | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `ref`               | `React.Ref<HTMLInputElement>`                                                    | —               | Ref forwarded to the field, the read-only `<input role="combobox">`.                                                                                                                                                                                                                                                                                                                                                                                            |
| `...`               | All standard `<div>` attributes and Bulma helper props                           | —               | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                               |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Cascader` registers these variables on its own `.cascader` element, and declares them again on `.cascader-panel.is-portal`, which takes nothing from it. Override them on `.cascader` with inline `style`, or with a class via `className` whose rule loads after the library styles, and set them on `.cascader-panel.is-portal` too, with a selector that matches it and loads after the library styles, or one that exceeds it. A value set on an ancestor is only inherited, and loses to both declarations. See [Theme](../helpers/theme.md).

| CSS Variable                                  | Sass Variable                        | Default                                                                                                                        |
| --------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `--bulma-cascader-chevron-width`              | `$cascader-chevron-width`            | `var(--bulma-control-height)`                                                                                                  |
| `--bulma-cascader-chevron-color`              | `$cascader-chevron-color`            | `var(--bulma-text-light)`                                                                                                      |
| `--bulma-cascader-chevron-hover-color`        | `$cascader-chevron-hover-color`      | `var(--bulma-text-weak)`                                                                                                       |
| `--bulma-cascader-chevron-focus-color`        | `$cascader-chevron-focus-color`      | `var(--bulma-link)`                                                                                                            |
| `--bulma-cascader-chevron-z-index`            | `$cascader-chevron-z-index`          | `4`                                                                                                                            |
| `--bulma-cascader-clear-z-index`              | `$cascader-clear-z-index`            | `5`                                                                                                                            |
| `--bulma-cascader-search-gap`                 | `$cascader-search-gap`               | `0.5rem`                                                                                                                       |
| `--bulma-cascader-max-width`                  | `$cascader-max-width`                | `calc(100vw - 2rem)`                                                                                                           |
| `--bulma-cascader-column-width`               | `$cascader-column-width`             | `11rem`                                                                                                                        |
| `--bulma-cascader-column-max-height`          | `$cascader-column-max-height`        | `15rem`                                                                                                                        |
| `--bulma-cascader-column-border-width`        | `$cascader-column-border-width`      | `1px`                                                                                                                          |
| `--bulma-cascader-column-border-color`        | `$cascader-column-border-color`      | `var(--bulma-border-weak)`                                                                                                     |
| `--bulma-cascader-item-color`                 | `$cascader-item-color`               | `$combobox-item-color`                                                                                                         |
| `--bulma-cascader-item-size`                  | `$cascader-item-size`                | `$combobox-item-size`                                                                                                          |
| `--bulma-cascader-item-padding-y`             | `$cascader-item-padding-y`           | `$combobox-item-padding-y`                                                                                                     |
| `--bulma-cascader-item-padding-x`             | `$cascader-item-padding-x`           | `$combobox-item-padding-x`                                                                                                     |
| `--bulma-cascader-item-hover-background`      | `$cascader-item-hover-background`    | `$combobox-item-hover-background`                                                                                              |
| `--bulma-cascader-highlight-background`       | `$cascader-highlight-background`     | `hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), calc(var(--bulma-scheme-main-l) + var(--bulma-active-background-l-delta)))` |
| `--bulma-cascader-checked-background`         | `$cascader-checked-background`       | `var(--bulma-link)`                                                                                                            |
| `--bulma-cascader-checked-color`              | `$cascader-checked-color`            | `var(--bulma-link-invert)`                                                                                                     |
| `--bulma-cascader-disabled-color`             | `$cascader-disabled-color`           | `var(--bulma-text-weak)`                                                                                                       |
| `--bulma-cascader-item-chevron-size`          | `$cascader-item-chevron-size`        | `0.5em`                                                                                                                        |
| `--bulma-cascader-item-gap`                   | `$cascader-item-gap`                 | `0.5em`                                                                                                                        |
| `--bulma-cascader-column-inset`               | `$cascader-column-inset`             | `4px`                                                                                                                          |
| `--bulma-picker-popover-z-index` ‡            | `$picker-popover-z-index`            | `30`                                                                                                                           |
| `--bulma-picker-popover-background` ‡         | `$picker-popover-background`         | `var(--bulma-scheme-main)`                                                                                                     |
| `--bulma-picker-popover-radius` ‡             | `$picker-popover-radius`             | `var(--bulma-radius-large)`                                                                                                    |
| `--bulma-picker-popover-shadow` ‡             | `$picker-popover-shadow`             | `0 8px 24px hsla(0, 0%, 0%, 0.18)`                                                                                             |
| `--bulma-picker-popover-border-color` ‡       | `$picker-popover-border-color`       | `var(--bulma-border)`                                                                                                          |
| `--bulma-picker-popover-padding` ‡            | `$picker-popover-padding`            | `0.75rem`                                                                                                                      |
| `--bulma-picker-popover-offset` ‡             | `$picker-popover-offset`             | `4px`                                                                                                                          |
| `--bulma-picker-popover-animation-duration` ‡ | `$picker-popover-animation-duration` | `0.15s`                                                                                                                        |
| `--bulma-picker-popover-months-max-width` ‡   | `$picker-popover-months-max-width`   | `calc(100vw - 2rem)`                                                                                                           |

‡ declared on a constituent element: values set via `className`, the `style` prop, or an ancestor are only inherited and lose — target the declaring element in your CSS.

<!-- /bestax:generated cssvars -->
