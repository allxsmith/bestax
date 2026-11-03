---
title: TreeSelect
sidebar_label: TreeSelect
description: 'The `TreeSelect` component is a form field whose options are a tree, such as categories, places or teams: it opens a panel holding a real `TreeView`, picks one item or checks a branch at a time, and searches labels.'
keywords:
  - tree select
  - tree picker
  - hierarchical select
  - nested select
  - checkStrictly
---

# TreeSelect

## Overview

<!-- bestax:generated overview -->

The `TreeSelect` component is a form field whose options are a tree, such as categories, places or teams: it opens a panel holding a real `TreeView`, picks one item or checks a branch at a time, and searches labels.

<!-- /bestax:generated overview -->

Reach for it when a form asks for something that lives in a tree: a folder to save into, a place
picked from regions, countries and cities, a team from an org chart, or regions and permissions
checked a branch at a time. The field shows what's picked while it's shut, and opening it brings
up the whole tree, with the picked item showing.

The tree in the panel is a [`TreeView`](../components/treeview.md), so it has TreeView's keys,
type-ahead, checkboxes and loading rows, and it looks the same. You give it the tree as `data`, an
array of nodes nested through `children`, so the field and the tags can name what's picked while
the panel is shut, and on the server.

:::info
Bulma has no select that holds a tree, so `TreeSelect` brings a small partial of its own, in
`bestax.css` and its variants, or in `extras.css` next to your own Bulma. The panel is the date
pickers' popover and the tree is TreeView's, so their variables theme them here too.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { TreeSelect } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `label` and the tree as `data`. Each node has a `value`, unique in the whole tree, a
`label`, and `children` for the nodes under it. Open it with a click, Enter, Space or Down, and
Enter, Space or a click on a row picks it and closes the panel.

```tsx live
<TreeSelect
  label="Save to"
  placeholder="Pick a folder"
  data={[
    {
      value: 'docs',
      label: 'Documents',
      children: [
        { value: 'invoices', label: 'Invoices' },
        { value: 'contracts', label: 'Contracts' },
      ],
    },
    {
      value: 'photos',
      label: 'Photos',
      children: [
        { value: 'summer', label: 'Summer' },
        { value: 'winter', label: 'Winter' },
      ],
    },
    { value: 'shared', label: 'Shared with me', disabled: true },
  ]}
/>
```

The field shows the picked item's own label, never the path to it. Parents can be picked too: a
click on a parent's row picks it, as Enter does, and a click on its chevron only opens it. A
disabled node is still reached by the arrow keys, so a screen reader finds it, but it's never
picked.

### Holding the Value

The value is the picked node's `value`, or `null`. Pass `value` and `onChange` to hold it, as
with any field.

```tsx live
function example() {
  const [folder, setFolder] = useState<string | null>('invoices');

  return (
    <>
      <TreeSelect
        label="Save to"
        value={folder}
        onChange={setFolder}
        clearable
        data={[
          {
            value: 'docs',
            label: 'Documents',
            children: [
              { value: 'invoices', label: 'Invoices' },
              { value: 'contracts', label: 'Contracts' },
            ],
          },
          { value: 'photos', label: 'Photos' },
        ]}
      />
      <Paragraph textSize="7">Value: {String(folder)}</Paragraph>
    </>
  );
}
```

Opening the panel opens the branch the picked item is in and puts focus on it. `clearable`
shows a clear button at the field's end while something it can take off is picked. It leaves
checked disabled items, and in the checkbox modes what they keep checked, since nothing unchecks
those.

### Only Leaves

`parentsSelectable={false}` makes a parent's row, Enter and Space open it instead, so only the
items at the ends of the tree are picked, as with a file rather than a folder.

```tsx live
<TreeSelect
  label="File"
  parentsSelectable={false}
  data={[
    {
      value: 'src',
      label: 'src',
      children: [
        { value: 'src/index.ts', label: 'index.ts' },
        { value: 'src/app.tsx', label: 'app.tsx' },
      ],
    },
    { value: 'package.json', label: 'package.json' },
  ]}
/>
```

### Searching

`searchable` puts a search box at the top of the panel. It matches labels, never values, and
keeps a match's ancestors, so the results stay a tree, and the nodes under a match, so a matching
branch can still be opened. Every branch with a match opens while the search has text, and
clearing it puts the branches back as they were. `empty` is what the panel shows when nothing
matches, and a screen reader hears it once.

```tsx live
<TreeSelect
  label="Country"
  searchable
  empty="No places match"
  data={[
    {
      value: 'europe',
      label: 'Europe',
      children: [
        { value: 'france', label: 'France' },
        { value: 'germany', label: 'Germany' },
        { value: 'spain', label: 'Spain' },
      ],
    },
    {
      value: 'asia',
      label: 'Asia',
      children: [
        { value: 'japan', label: 'Japan' },
        { value: 'korea', label: 'Korea' },
      ],
    },
  ]}
/>
```

Typing a letter on the closed field opens it with that letter in the box. Down moves from the
box into the tree. Inside a [`LocaleProvider`](../helpers/localeprovider.md) with a `locale`, the
match ignores case and the accents that language ignores, so "cafe" finds "Café". `filter`
replaces the match with one of your own, handed the search text and one node.

### Checking a Branch

`selectionMode="checkbox"` puts a box on every item. A check reaches every enabled item under it,
closed branches included, and a parent with some of them checked is mixed. The panel stays open
while you check, and the value shows as tags under the field, each with a button that unchecks
its item, where that changes the value.

```tsx live
function example() {
  const [regions, setRegions] = useState<string[]>(['france', 'germany']);

  return (
    <>
      <TreeSelect
        label="Regions"
        selectionMode="checkbox"
        value={regions}
        onChange={setRegions}
        searchable
        data={[
          {
            value: 'europe',
            label: 'Europe',
            children: [
              { value: 'france', label: 'France' },
              { value: 'germany', label: 'Germany' },
              { value: 'spain', label: 'Spain' },
            ],
          },
          {
            value: 'asia',
            label: 'Asia',
            children: [
              { value: 'japan', label: 'Japan' },
              { value: 'korea', label: 'Korea' },
            ],
          },
        ]}
      />
      <Paragraph textSize="7">Value: {JSON.stringify(regions)}</Paragraph>
    </>
  );
}
```

Checking a parent during a search checks what's under it, the rows the search hides included,
since a parent's box stands for its whole branch.

### What the Value Holds

`checkedStrategy` decides what a check puts in the value. With Europe checked: `'child'`, the
default, gives its leaves, France, Germany and Spain; `'parent'` gives the topmost checked items,
Europe; `'all'` gives every checked item, Europe and its three. Pass any of the three back as
`value` and the same boxes are checked.

It shapes the value a check, an uncheck, a tag's button or the clear button makes, which is what
`onChange` reports. The tags and the hidden inputs show the value as it's held, so a value you
pass shows as you pass it, and a branch that loads later changes nothing the form posts.

```tsx live
function example() {
  const [regions, setRegions] = useState<string[]>(['europe']);

  return (
    <>
      <TreeSelect
        label="Regions, as their topmost checked items"
        selectionMode="checkbox"
        checkedStrategy="parent"
        value={regions}
        onChange={setRegions}
        data={[
          {
            value: 'europe',
            label: 'Europe',
            children: [
              { value: 'france', label: 'France' },
              { value: 'germany', label: 'Germany' },
            ],
          },
          { value: 'oceania', label: 'Oceania' },
        ]}
      />
      <Paragraph textSize="7">Value: {JSON.stringify(regions)}</Paragraph>
    </>
  );
}
```

A checked disabled item is in every list, since only its own value checks it.

### Checking Items One by One

`selectionMode="checkbox-independent"` gives each item a box of its own: checking a parent
checks the parent and nothing under it, and no parent is mixed. It suits categories, where a
parent means itself. Mantine and Ant Design call this `checkStrictly`. The value is exactly the
checked items.

```tsx live
<TreeSelect
  label="Categories"
  selectionMode="checkbox-independent"
  defaultValue={['clothing']}
  data={[
    {
      value: 'clothing',
      label: 'Clothing',
      children: [
        { value: 'shirts', label: 'Shirts' },
        { value: 'shoes', label: 'Shoes' },
      ],
    },
    { value: 'books', label: 'Books' },
  ]}
/>
```

### Loading Branches as They Open

A node with `hasChildren` shows as a parent before its children are known. Fetch them when it
opens, from `onExpandedChange`, and pass them back in `data`, with `isLoading` while they're on
their way and `loadError` with an `onRetry` when they don't come. The loading and failed rows,
and what the live region says, are TreeView's.

```tsx live
function example() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <TreeSelect
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

A value no node has, such as one under a branch that hasn't loaded, is kept and shown as the
value itself, with a warning in development.

### In a Form

`name` posts the value through a hidden input, empty while nothing is picked, and in the
checkbox modes a hidden input posts each value in the list. `required` stops the form while
nothing is picked, and the browser's message points at the field. A reset of the form puts the
value back to `defaultValue` and calls `onChange` with it as given, or empties a value you hold,
calling `onChange` with `null` or `[]` so you can set it. Only the changes someone makes in the
field are shaped by `checkedStrategy`. `disabled`, or a disabled [`Fieldset`](./fieldset.md)
around it, keeps it shut and posts nothing.

```tsx live
<form onSubmit={event => event.preventDefault()}>
  <TreeSelect
    label="Department"
    name="department"
    required
    data={[
      {
        value: 'engineering',
        label: 'Engineering',
        children: [
          { value: 'frontend', label: 'Frontend' },
          { value: 'platform', label: 'Platform' },
        ],
      },
      { value: 'design', label: 'Design' },
    ]}
  />
  <Button type="submit" color="primary">
    Save
  </Button>
</form>
```

### Icons and Rows of Your Own

A node's `icon` goes before its label, an [`Icon`](../elements/icon.md) name or a node of your
own. `itemTemplate` draws a row's content in place of its label, and the field and the tags still
show the label.

```tsx live
<TreeSelect
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

`size` sizes the field and the tree in the panel together, and `color` and `isRounded` are
Bulma's modifiers on the field.

```tsx live
<>
  <TreeSelect
    label="Small"
    size="small"
    color="info"
    data={[{ value: 'a', label: 'Alpha' }]}
  />
  <TreeSelect
    label="Large, rounded"
    size="large"
    isRounded
    data={[{ value: 'a', label: 'Alpha' }]}
  />
</>
```

### Right to Left

Inside a right-to-left page or `LocaleProvider`, the chevron and the clear button move to the
field's left, and Right and Left swap in the tree.

```tsx live
<LocaleProvider locale="ar" dir="rtl">
  <TreeSelect
    label="المجلد"
    defaultValue="invoices"
    clearable
    data={[
      {
        value: 'docs',
        label: 'المستندات',
        children: [{ value: 'invoices', label: 'الفواتير' }],
      },
      { value: 'photos', label: 'الصور' },
    ]}
  />
</LocaleProvider>
```

---

## Accessibility

- **The field is a combobox that opens a dialog,** as the date pickers' is: `role="combobox"`
  with `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` while the panel is open,
  named by its `label`. It's read-only, and in `'single'` its value is the picked item's label.
  In the checkbox modes it's described by the tags.
- **Keys on the field:** a click, Enter, Space, Down or Alt+Down opens the panel, and with
  `searchable` a printable key opens it with that key in the search box.
- **The panel** is a non-modal `dialog`, named by the label or `labels.choose`. Focus moves into
  it as it opens: onto the picked item, its branch open, or onto the search box when
  `searchable`, or else onto the first item. It holds focus while it's open, as the date
  pickers' panel does: Tab and Shift+Tab move between the search box and the tree, and wrap.
  Escape and Alt+Up close it and put focus back on the field, and so does a pick in `'single'`.
  A press outside closes it and leaves focus where the press put it.
- **The tree** is TreeView's, with the same name as the panel: real focus with one tab stop, the
  arrow keys, Home, End, `*` and type-ahead, Right and Left swapped on a right-to-left page,
  `aria-level`, `aria-posinset` and `aria-setsize` on every item, `aria-selected` in `'single'`,
  `aria-checked` in the checkbox modes (`"mixed"` only in `'checkbox'`), and disabled items
  reachable and `aria-disabled`. See [`TreeView`](../components/treeview.md#accessibility).
- **The search box** is named "Search", or `labels.search`. When nothing matches, `empty` is said
  once through a polite status region, not again on every key.
- **Each tag's button** is a `Delete` named "Remove" and the item's label, or `ariaCloseLabel`
  described by the tag's label.
- **`required`** makes the field `aria-required`. A read-only field is left out of the browser's
  own check, so a hidden field over it carries `required`. When the browser stops a submit, it
  focuses that one and shows its message, which every browser takes down as it loses focus. So
  focus stays there, reading as the field and drawn on it, with no on-screen keyboard. A press
  goes where it lands, and the next key, other than a modifier on its own, goes to the field and
  does what it would there.
- **Forced colors:** the field, the panel and the tree keep their edges in system colors, and the
  chevron is text.

---

## Related Components

- [`TreeView`](../components/treeview.md): The same tree, on the page rather than in a field.
- [`Combobox`](./combobox.md): Picks one value or several from a flat list, with a text field to
  search it.
- [`Select`](./select.md): The browser's own select, for a short flat list.
- [`DateInput`](./datetime/dateinput.md): The same field and panel, for a date.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: TreeSelect Stories](https://bestax.io/storybook/?path=/story/form-treeselect--default)
- [WAI-ARIA Authoring Practices: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [WAI-ARIA Authoring Practices: Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)

---

## Props

<!-- bestax:generated props -->

| Prop                  | Type                                                                             | Default         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectionMode`       | `'single'` \| `'checkbox'` \| `'checkbox-independent'`                           | `'single'`      | `'single'`: one item, picked with Enter, Space or a click on its row. `'checkbox'`: any number, with a box on every item. A check reaches every enabled item under it, and a parent with some of them checked is mixed. `'checkbox-independent'`: any number, each box checking its own item, so a parent means the parent alone (Mantine's and Ant Design's `checkStrictly`). The checkbox modes show the value as tags.                                                                                                                                                                                                                                                       |
| `value`               | `string` \| `null` \| `string[]`                                                 | —               | The value when you hold the state: in `'single'` the picked item's value, or `null` for none, and in the checkbox modes the checked values. In `'checkbox'` a parent's value checks its whole branch, so the list any `checkedStrategy` gives checks the same boxes.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `defaultValue`        | `string` \| `null` \| `string[]`                                                 | —               | The value to begin with, when TreeSelect holds its own state: a value or `null`, or a list in the checkbox modes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `onChange`            | `(value: string \| null) => void` \| `(value: string[]) => void`                 | —               | Called with the new value: in `'single'` the picked item's value, or `null` when it's cleared, and in the checkbox modes the new list, after a check, an uncheck, a tag's button or the clear button, each shaped by `checkedStrategy`. A reset of the field's form calls it too, with `defaultValue` as it was given, or with `null` or `[]` when you hold the value, for you to set.                                                                                                                                                                                                                                                                                          |
| `parentsSelectable`   | `boolean`                                                                        | `true`          | A parent's row picks the parent. `false` makes the row, Enter and Space open it instead, so only leaves are picked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `closeOnSelect`       | `boolean`                                                                        | `true`          | Closes the panel after a pick and puts focus back on the field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `checkedStrategy`     | `'child'` \| `'parent'` \| `'all'`                                               | `'child'`       | What a checked branch puts in the value, in `'checkbox'`: `'child'` its leaves, `'parent'` its topmost checked item, `'all'` every checked item, parents included. A checked disabled item is in all three, since only its own value checks it. It shapes the value a check, an uncheck, a tag's button or the clear button makes, which `onChange` reports, and not `defaultValue`, a value you pass or the one a form reset puts back. The tags and the hidden inputs show the value as it's held, so a value you pass shows as you pass it, and a branch that loads later changes nothing the form posts. `'checkbox-independent'` always reports exactly the checked items. |
| `ariaCloseLabel`      | `string`                                                                         | —               | Names each tag's button, in place of "Remove" and the item's label, as on Combobox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `data`                | `TreeItemData[]`                                                                 | —               | **Required.** The tree, as nodes nested through `children`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `label`               | `React.ReactNode`                                                                | —               | The field's label, which names the field through `htmlFor`, and the panel and the tree in it through `aria-labelledby`. Dropped inside an outer `Field`, whose label names them instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `id`                  | `string`                                                                         | —               | The field's `id`, which the label then points at. The panel's is this one with `-panel` after it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `aria-label`          | `string`                                                                         | —               | Names the field, and the panel and the tree, in place of a `label`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `aria-labelledby`     | `string`                                                                         | —               | The ids of what names the field, and the panel and the tree, in place of a `label`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `aria-describedby`    | `string`                                                                         | —               | The ids of what describes the field, ahead of the tags.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `expanded`            | `string[]`                                                                       | —               | The open branches' values when you hold the state, as TreeView's `expanded`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `defaultExpanded`     | `string[]`                                                                       | `[]`            | The branches open to begin with, when TreeSelect holds its own state.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `onExpandedChange`    | `(expanded: string[]) => void`                                                   | —               | Called with the new list whenever a branch opens or closes, opening the panel on the picked item's branch included. Fetch a lazy branch's children from here. The branches a search opens aren't in it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `open`                | `boolean`                                                                        | —               | Whether the panel is open, controlled: opening and closing then only call `onOpenChange`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `defaultOpen`         | `boolean`                                                                        | `false`         | The panel is open to begin with.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `onOpenChange`        | `(open: boolean) => void`                                                        | —               | Called with the new state when the panel opens or closes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `searchable`          | `boolean`                                                                        | `false`         | Puts a search box at the top of the panel. It matches labels, keeps a match's ancestors and the nodes under it, and opens every branch with a match. A printable key on the field opens the panel with it in the box, and the search empties when the panel closes.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `query`               | `string`                                                                         | —               | The search text when you hold the state.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `defaultQuery`        | `string`                                                                         | `''`            | The search text to begin with.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `onQueryChange`       | `(query: string) => void`                                                        | —               | Called with the search text as it changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `filter`              | `(query: string, item: TreeItemData) => boolean`                                 | —               | Whether a node matches the search, in place of the locale-aware match on its label. It's handed the search text trimmed. A match's ancestors stay either way. The search runs again when the search text or `data` changes, not when only this does, so one written inline costs nothing.                                                                                                                                                                                                                                                                                                                                                                                       |
| `empty`               | `React.ReactNode`                                                                | —               | What the panel shows when the search matches nothing, such as "No folders match". Announced once.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `itemTemplate`        | `(item: TreeItemData) => React.ReactNode`                                        | —               | Renders a row's content in place of its label. The field and the tags still show the label.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `placeholder`         | `string`                                                                         | —               | What the field shows while nothing is picked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `name`                | `string`                                                                         | —               | A form field name. A hidden input posts the value, or one per value in the checkbox modes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `form`                | `string`                                                                         | —               | The id of the form the hidden inputs belong to, when it isn't an ancestor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `required`            | `boolean`                                                                        | `false`         | A value is needed: the field is `aria-required`, and the form won't submit while nothing is picked. The browser's message points at the field, which shows focus, and the next key goes to it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `disabled`            | `boolean`                                                                        | `false`         | The field can't be used: it can't be focused or opened, its tags lose their buttons, and its hidden inputs don't post.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `clearable`           | `boolean`                                                                        | `false`         | Shows a clear button at the field's inline end while something it can take off is picked. It leaves checked disabled items, which no control unchecks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `color`               | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —               | Bulma color modifier for the field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `size`                | `'small'` \| `'medium'` \| `'large'`                                             | —               | The field's size, which the tree in the panel follows.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `isRounded`           | `boolean`                                                                        | `false`         | Rounds the field's corners (Bulma's `is-rounded`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `position`            | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` \| `'auto'` | `'bottom-left'` | Where the panel opens, relative to the field, as on the pickers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `appendToBody`        | `boolean`                                                                        | `false`         | Renders the panel through a portal, into a `ConfigProvider`'s `portalContainer`, `document.body` by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `labels`              | `{ choose?: string; search?: string; clear?: string }`                           | —               | The visible and accessible strings, in your app's language.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `loadingLabel`        | `string`                                                                         | —               | What a loading branch's row says, as on TreeView. In your app's language.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `retryLabel`          | `string`                                                                         | —               | The Retry button's text on a failed load's row, as on TreeView. In your app's language.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `loadingAnnouncement` | `(name: string) => string`                                                       | —               | What the live region says when an open branch starts loading, as on TreeView.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `loadedAnnouncement`  | `(name: string) => string`                                                       | —               | What the live region says when that load finishes, as on TreeView.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `labelSize`           | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                               | —               | Size for the label (used in horizontal layouts).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `labelProps`          | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`      | —               | Props for the label element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `horizontal`          | `boolean`                                                                        | `false`         | Horizontal field layout.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `message`             | `React.ReactNode`                                                                | —               | Help/validation message below the input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `messageColor`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`  | —               | Bulma color for the message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `fieldClassName`      | `string`                                                                         | —               | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `className`           | `string`                                                                         | —               | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `ref`                 | `React.Ref<HTMLInputElement>`                                                    | —               | Ref forwarded to the field, the read-only `<input role="combobox">`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `...`                 | All standard `<div>` attributes and Bulma helper props                           | —               | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`TreeSelect` registers these variables on its own `.tree-select` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                  | Sass Variable                        | Default                            |
| --------------------------------------------- | ------------------------------------ | ---------------------------------- |
| `--bulma-picker-popover-z-index` ‡            | `$picker-popover-z-index`            | `30`                               |
| `--bulma-picker-popover-background` ‡         | `$picker-popover-background`         | `var(--bulma-scheme-main)`         |
| `--bulma-picker-popover-radius` ‡             | `$picker-popover-radius`             | `var(--bulma-radius-large)`        |
| `--bulma-picker-popover-shadow` ‡             | `$picker-popover-shadow`             | `0 8px 24px hsla(0, 0%, 0%, 0.18)` |
| `--bulma-picker-popover-border-color` ‡       | `$picker-popover-border-color`       | `var(--bulma-border)`              |
| `--bulma-picker-popover-padding` ‡            | `$picker-popover-padding`            | `0.75rem`                          |
| `--bulma-picker-popover-offset` ‡             | `$picker-popover-offset`             | `4px`                              |
| `--bulma-picker-popover-animation-duration` ‡ | `$picker-popover-animation-duration` | `0.15s`                            |
| `--bulma-tree-select-panel-max-height`        | `$tree-select-panel-max-height`      | `15rem`                            |
| `--bulma-tree-select-search-gap`              | `$tree-select-search-gap`            | `0.5rem`                           |
| `--bulma-tree-select-chevron-width`           | `$tree-select-chevron-width`         | `var(--bulma-control-height)`      |
| `--bulma-tree-select-chevron-color`           | `$tree-select-chevron-color`         | `var(--bulma-text-light)`          |
| `--bulma-tree-select-chevron-hover-color`     | `$tree-select-chevron-hover-color`   | `var(--bulma-text-weak)`           |
| `--bulma-tree-select-chevron-focus-color`     | `$tree-select-chevron-focus-color`   | `var(--bulma-link)`                |
| `--bulma-tree-select-empty-color`             | `$tree-select-empty-color`           | `var(--bulma-text-weak)`           |
| `--bulma-tree-select-empty-padding`           | `$tree-select-empty-padding`         | `0.5em 0.75em`                     |
| `--bulma-tree-select-tree-inset`              | `$tree-select-tree-inset`            | `4px`                              |

‡ declared on a constituent element: values set via `className`, the `style` prop, or an ancestor are only inherited and lose — target the declaring element in your CSS.

<!-- /bestax:generated cssvars -->
