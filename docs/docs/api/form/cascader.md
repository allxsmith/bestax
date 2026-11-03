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

<!-- /bestax:generated overview -->

Reach for it when the thing a form asks for is found by narrowing down: a city by its continent
and country, a product category by its department, a file by its folders. Each level opens a
column beside the last, so the whole path stays in view while you pick, and the field shows that
path once it's shut, such as "Europe / Germany / Berlin".

It takes the same `data` as [`TreeSelect`](./treeselect.md), an array of nodes nested through
`children`, and the same value: the picked node's own `value`. The two show the same tree two
ways, so moving from one to the other is a change of component, not of data.

:::info
Bulma has no cascading select, so `Cascader` brings a small partial of its own, in `bestax.css`
and its variants, or in `extras.css` next to your own Bulma. The panel is the date pickers'
popover and each item is drawn as Bulma's dropdown item, so the popover's variables theme it here
too.
:::

---

## Import

<!-- bestax:generated import -->

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

Opening the panel opens the picked node's path and puts focus on it. `clearable` shows a clear
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
replaces the match with one of your own, handed the search text and the path, from the top node
down.

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

Inside a right-to-left page or `LocaleProvider`, the columns open to the left, the chevrons turn
to match, and Right and Left swap.

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
  it as it opens: onto the picked node, its path open, or onto the first enabled item. It holds
  focus while it's open, as the date pickers' panel does: Tab and Shift+Tab move between the
  search box and the columns, and wrap. Escape and Alt+Up close it and put focus back on the
  field, and so does a pick. A press outside closes it and leaves focus where the press put it.
- **Each column** is a `listbox` with one tab stop and real focus on its `option`s. The first is
  named as the panel is, and each one after it by the label of the item that opened it. Up, Down,
  Home, End and type-ahead move within a column, and the item focus is on is the selected one
  there (`aria-selected`). Right opens the next column and moves into it, Left goes back, and the
  two swap on a right-to-left page. Disabled items are reachable and `aria-disabled`.
- **An item that opens a column** is described by "Opens a column", or `labels.opens`, since an
  option has no way of its own to say it has items under it. Its chevron is hidden.
- **A column that's loading** ends in a row that says so, and a failed load's row is named by its
  message and its Retry, which Enter, Space or a click run. The live region says when a column
  starts loading and when it's loaded, as TreeView's does.
- **The search box** is named "Search", or `labels.search`, and its results are a listbox of the
  paths that match. When nothing matches, `empty` is said once through a polite status region,
  not again on every key.
- **`required`** makes the field `aria-required`. A read-only field is left out of the browser's
  own check, so a hidden field the browser reads carries `required`, and it hands focus to the
  real one when the browser points at it.
- **Forced colors:** the field, the panel and the columns keep their edges in system colors, the
  path through the columns keeps the system's highlight, and the chevrons are borders, so they
  stay.

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

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

<!-- /bestax:generated cssvars -->
