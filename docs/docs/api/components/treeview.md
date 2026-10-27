---
title: TreeView
sidebar_label: TreeView
description: 'The `TreeView` component renders a tree of items you browse and pick from, the way a file explorer works: one tab stop, the arrow keys to move, and Right and Left to open and close.'
---

# TreeView

## Overview

<!-- bestax:generated overview -->

The `TreeView` component renders a tree of items you browse and pick from, the way a file explorer works: one tab stop, the arrow keys to move, and Right and Left to open and close.

<!-- /bestax:generated overview -->

Reach for it when your data has folders in it: a project's files, where picking one shows it beside
the tree; permissions or filters with checkboxes, where checking "Billing" checks everything under
it; an outline you browse, like an org chart or a settings tree; or folders that load from a server
one level at a time.

It isn't for site navigation. A tree turns its links into tree items, so there's no opening one in a
new tab, and it asks for keys a sidebar doesn't need. A sidebar whose sections open and close is
[`Menu`](./menu.md)'s job, with [`Menu.Section`](./menu.md#sections-that-open-and-close). The
[Accessibility](#accessibility) section says more.

You write it as `TreeView.Item`s nested inside each other, with each row's content in `label`. The
tree owns which items are open, and `selectionMode` picks one of three trees: nothing picked, one
item picked, or checkboxes.

:::info
Bulma has no tree, so `TreeView` brings its own styles, in `bestax.css` and its variants, or in
`extras.css` next to your own Bulma. It's drawn to look like Bulma's menu, with its own classes and
variables, so theming the menu doesn't change the tree.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { TreeView } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Nest `TreeView.Item`s for the children, give each a `value` that's unique in the tree and a
`label`, and give the tree a name. `defaultExpanded` lists the items open to begin with. Click a
parent, or focus the tree and use the arrow keys.

```tsx live
<TreeView aria-label="Settings" defaultExpanded={['account']}>
  <TreeView.Item value="account" label="Account">
    <TreeView.Item value="account/profile" label="Profile" />
    <TreeView.Item value="account/security" label="Security" />
  </TreeView.Item>
  <TreeView.Item value="notifications" label="Notifications">
    <TreeView.Item value="notifications/email" label="Email" />
    <TreeView.Item value="notifications/push" label="Push" />
  </TreeView.Item>
  <TreeView.Item value="about" label="About" />
</TreeView>
```

With no `selectionMode`, nothing is picked: a click, Enter or Space opens and closes a parent, and
does nothing on a leaf.

### A File Browser

`selectionMode="single"` picks one item at a time, with Enter, Space or a click. Here the pick
shows beside the tree. Your data maps to items with a small recursive function, and an item's
children render whenever you have them, open or not: the tree hides them while it's closed.

```tsx live
function example() {
  interface FileNode {
    id: string;
    name: string;
    children?: FileNode[];
  }

  const files: FileNode[] = [
    {
      id: 'src',
      name: 'src',
      children: [
        {
          id: 'src/components',
          name: 'components',
          children: [
            { id: 'src/components/Button.tsx', name: 'Button.tsx' },
            { id: 'src/components/Card.tsx', name: 'Card.tsx' },
          ],
        },
        { id: 'src/index.ts', name: 'index.ts' },
      ],
    },
    { id: 'package.json', name: 'package.json' },
  ];

  const [file, setFile] = useState<string | null>(null);

  const items = (nodes: FileNode[]): React.ReactNode =>
    nodes.map(node => (
      <TreeView.Item
        key={node.id}
        value={node.id}
        label={node.name}
        icon={node.children ? 'folder' : 'file'}
      >
        {node.children && items(node.children)}
      </TreeView.Item>
    ));

  return (
    <Columns>
      <Column size="half">
        <TreeView
          aria-label="Files"
          selectionMode="single"
          selected={file}
          onSelectedChange={setFile}
          defaultExpanded={['src']}
        >
          {items(files)}
        </TreeView>
      </Column>
      <Column>
        <Content>{file ? <p>Showing {file}</p> : <p>Pick a file.</p>}</Content>
      </Column>
    </Columns>
  );
}
```

A click on a parent's row selects it and opens or closes it. The chevron only opens and closes.
Moving focus never selects anything, so picking a file that loads something doesn't load every
file the arrow keys pass over. Pass `selected` and `onSelectedChange` to hold the state yourself, as
here, or `defaultSelected` to let the tree hold it.

In an app, the recursive function can be a component of its own, declared once at the top level of
a module:

```tsx
interface FileNode {
  id: string;
  name: string;
  children?: FileNode[];
}

function FileItems({ nodes }: { nodes: FileNode[] }) {
  return (
    <>
      {nodes.map(node => (
        <TreeView.Item
          key={node.id}
          value={node.id}
          label={node.name}
          icon={node.children ? 'folder' : 'file'}
        >
          {node.children && <FileItems nodes={node.children} />}
        </TreeView.Item>
      ))}
    </>
  );
}
```

### Checkboxes

`selectionMode="checkbox"` puts a box on every item and checks any number of them, with Space or a
click. Checking a parent checks every enabled item under it, closed branches included, and a parent
with some of its items checked shows a mixed box. Here Projects is mixed while only Read is checked,
and the disabled Delete keeps its state whatever happens around it.

```tsx live
function example() {
  const [checked, setChecked] = useState<string[]>(['projects/read']);

  return (
    <>
      <Buttons size="small">
        <Button onClick={() => setChecked(['projects', 'billing'])}>
          Check all
        </Button>
        <Button onClick={() => setChecked([])}>Clear</Button>
      </Buttons>
      <TreeView
        aria-label="Permissions"
        selectionMode="checkbox"
        checked={checked}
        onCheckedChange={setChecked}
        defaultExpanded={['projects']}
      >
        <TreeView.Item value="projects" label="Projects">
          <TreeView.Item value="projects/read" label="Read" />
          <TreeView.Item value="projects/write" label="Write" />
          <TreeView.Item value="projects/delete" label="Delete" disabled />
        </TreeView.Item>
        <TreeView.Item value="billing" label="Billing">
          <TreeView.Item value="billing/view" label="View invoices" />
          <TreeView.Item value="billing/pay" label="Pay invoices" />
        </TreeView.Item>
      </TreeView>
      <Paragraph mt="3" textSize="7">
        Checked: {checked.length ? checked.join(', ') : 'nothing'}
      </Paragraph>
    </>
  );
}
```

How a box decides what it shows:

- **A value checks its item and its whole branch.** A parent's value stands for every enabled item
  under it, loaded or not, so Check all above is just two values, and children that load later
  under a checked folder arrive checked.
- **A parent follows the items at the bottom of its branch:** checked when they all are, unchecked
  when none is, and mixed in between.
- **A disabled item is checked only by its own value.** A check above or below it never changes it,
  and it doesn't count toward its parent's state.

`onCheckedChange` gets every item that shows checked, parents included, plus any earlier value
the tree doesn't know, such as one under a branch you haven't loaded. The order means nothing. Pass
the list back as `checked` and it shows the same boxes. There's no key that checks everything, so
give the tree buttons like Check all and Clear when that matters, as the
[APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) suggests.

`selected` is read in a `single` tree only, and `checked` in a `checkbox` tree only.

### Folders That Load

`hasChildren` shows an item as a closed parent before its children are known. When it opens, load
them, and pass `isLoading` until they arrive: the item's group ends in a Loading… row, and the
tree's live region says the folder is loading, then that it's loaded. If the load fails, pass its
message as `loadError` and a way to try again as `onRetry`: the row shows the message and a Retry
button. Loaded children render whether the folder is open or not, which a checkbox tree needs to
know what a check reaches.

```tsx live
function example() {
  interface Folder {
    id: string;
    name: string;
    hasFolders: boolean;
  }

  // A pretend server: each folder holds two more, three levels down.
  const listFolders = (id: string, fail: boolean) =>
    new Promise<Folder[]>((resolve, reject) =>
      setTimeout(() => {
        if (fail) {
          reject(new Error(`Couldn't reach ${id}`));
          return;
        }
        resolve(
          ['a', 'b'].map(name => ({
            id: `${id}/${name}`,
            name: `Folder ${name.toUpperCase()}`,
            hasFolders: id.split('/').length < 3,
          }))
        );
      }, 800)
    );

  const [expanded, setExpanded] = useState<string[]>([]);
  // A folder's children, or how loading them is going.
  const [found, setFound] = useState<
    Record<string, Folder[] | 'loading' | 'error'>
  >({});
  // Shared fails the first time, so there's a Retry to press.
  const [sharedFails, setSharedFails] = useState(true);

  function load(id: string) {
    const fail = id === 'shared' && sharedFails;
    if (fail) setSharedFails(false);
    setFound(current => ({ ...current, [id]: 'loading' }));
    listFolders(id, fail).then(
      folders => setFound(current => ({ ...current, [id]: folders })),
      () => setFound(current => ({ ...current, [id]: 'error' }))
    );
  }

  function changeOpen(next: string[]) {
    setExpanded(next);
    for (const id of next) {
      if (!found[id]) load(id);
    }
  }

  const items = (folders: Folder[]): React.ReactNode =>
    folders.map(folder => {
      const state = found[folder.id];
      return (
        <TreeView.Item
          key={folder.id}
          value={folder.id}
          label={folder.name}
          icon="folder"
          hasChildren={folder.hasFolders}
          isLoading={state === 'loading'}
          loadError={
            state === 'error' ? `Couldn't load ${folder.name}` : undefined
          }
          onRetry={() => load(folder.id)}
        >
          {Array.isArray(state) && items(state)}
        </TreeView.Item>
      );
    });

  return (
    <TreeView
      aria-label="Folders"
      expanded={expanded}
      onExpandedChange={changeOpen}
    >
      {items([
        { id: 'home', name: 'Home', hasFolders: true },
        { id: 'shared', name: 'Shared', hasFolders: true },
      ])}
    </TreeView>
  );
}
```

The rows come after any children the item already has, so a folder you load again keeps showing
what it had. A closed item shows no row and says nothing, whether it's loading or not. Both props
work on a parent only, one with `hasChildren` or the children it already has. The live region reads
`loadError` out word for word, so name the item in it.

Set `isLoading` while a retry runs, as `load` does above. The live region then says the folder is
loading as soon as Retry is pressed, and if the retry fails too, it reads the message out again.
The same `loadError` passed a second time with no loading in between looks to the tree like nothing
happened, so a screen reader user hears nothing at all. `isLoading` wins while both props are given,
so a retry can set it without clearing the message first.

The row's text, the button's and what the live region says start out in English. `loadingLabel`,
`retryLabel`, `loadingAnnouncement` and `loadedAnnouncement` on the tree put them in your app's
language:

```tsx
<TreeView
  aria-label="Dossiers"
  loadingLabel="Chargement…"
  retryLabel="Réessayer"
  loadingAnnouncement={name => `Chargement de ${name}`}
  loadedAnnouncement={name => `${name} chargé`}
>
  {/* … */}
</TreeView>
```

### An Outline With Expand All and Collapse All

The tree owns which items are open, through `expanded`, `defaultExpanded` and `onExpandedChange`, a
list of values. Hold it yourself and buttons can open or close everything at once. A value stays in
the list while its item's parent is closed, so the item reopens as it was. The `*` key opens every
closed parent beside the focused item.

```tsx live
function example() {
  const everything = ['ceo', 'ceo/engineering', 'ceo/sales'];
  const [expanded, setExpanded] = useState<string[]>(['ceo']);

  return (
    <>
      <Buttons size="small">
        <Button onClick={() => setExpanded(everything)}>Expand all</Button>
        <Button onClick={() => setExpanded([])}>Collapse all</Button>
      </Buttons>
      <TreeView
        aria-label="Org chart"
        expanded={expanded}
        onExpandedChange={setExpanded}
      >
        <TreeView.Item value="ceo" label="Ada Lovelace, CEO">
          <TreeView.Item
            value="ceo/engineering"
            label="Grace Hopper, Engineering"
          >
            <TreeView.Item value="eng/turing" label="Alan Turing" />
            <TreeView.Item value="eng/johnson" label="Katherine Johnson" />
          </TreeView.Item>
          <TreeView.Item value="ceo/sales" label="Hedy Lamarr, Sales">
            <TreeView.Item value="sales/jackson" label="Mary Jackson" />
          </TreeView.Item>
        </TreeView.Item>
      </TreeView>
    </>
  );
}
```

### Sizes

`size` sets the text size the way Bulma's menu does, and the rows, the indent and the chevron scale
with it.

```tsx live
<Columns isMultiline>
  {(['small', 'medium', 'large'] as const).map(size => (
    <Column key={size} size="one-third">
      <TreeView
        aria-label={`Files, ${size}`}
        size={size}
        defaultExpanded={['src']}
      >
        <TreeView.Item value="src" label="src" icon="folder">
          <TreeView.Item value="src/index.ts" label="index.ts" icon="file" />
        </TreeView.Item>
        <TreeView.Item value="README.md" label="README.md" icon="file" />
      </TreeView>
    </Column>
  ))}
</Columns>
```

### Compound (dot-notation) usage

`TreeView.Item` is the one part, and it's also exported by name as `TreeViewItem`. A string `icon`
is an `Icon` name, drawn from the icon library `ConfigProvider` sets, and anything else renders as
it is. The icon is decoration and hidden from assistive tech.

```tsx live
<TreeView
  aria-label="Files"
  selectionMode="single"
  defaultSelected="src/App.tsx"
  defaultExpanded={['src']}
>
  <TreeView.Item value="src" label="src" icon="folder">
    <TreeView.Item value="src/index.ts" label="index.ts" icon="file" />
    <TreeView.Item value="src/App.tsx" label="App.tsx" icon="file" />
    <TreeView.Item value="src/legacy.ts" label="legacy.ts" disabled />
  </TreeView.Item>
  <TreeView.Item value="package.json" label="package.json" icon="file" />
</TreeView>
```

Nothing in a label should be a link or a button. A tree item does one thing, and nothing else in
its row takes focus.

---

## Accessibility

`TreeView` follows the [APG Tree View Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

- **Roles:** the root is a `<ul role="tree">`, each item an `<li role="treeitem">`, and an open
  parent's children sit in a `<ul role="group">` inside it. A closed item's children have no
  markup.
- **A name:** a tree needs one, from `aria-label` or `aria-labelledby`, and a development build
  warns when it has neither. Each item is named by `aria-labelledby` pointing at its own label, and
  declares its `aria-level`, which VoiceOver needs according to
  [GitHub's testing](https://github.blog/engineering/user-experience/considerations-for-making-a-tree-view-component-accessible/).
  `aria-expanded` is on parents only.
- **Positions:** each item also declares `aria-posinset` and `aria-setsize`, its place among the
  items beside it, so a screen reader that doesn't work positions out for itself still has them.
  The tree reads them off the page once it mounts, and again whenever items open, close, load or
  move, so server markup leaves them to the browser until then. They're the values a browser works
  out on its own: a loading row or a failed load's row counts with the items beside it. When the
  page holds only part of a set, such as the first page of a long folder, pass both on every item
  of that set: yours win, and the tree's own stay on any item without them.
- **One tab stop, with real focus:** one item holds `tabIndex={0}` and the rest `-1`, and focus
  moves from item to item, rather than through `aria-activedescendant`. When focus comes into the
  tree, it lands on the selected item, or in a checkbox tree on the first checked item on the page.
  Without one, it lands where focus last was, or on the first item. If the item holding the stop
  goes away, its nearest ancestor on the page takes it, and focus goes too if it had focus.
- **Selection:** a `single` tree marks each enabled item `aria-selected`, `true` or `false`. A
  `checkbox` tree marks `aria-checked` on every item, `true`, `false` or `mixed`, disabled ones
  included, and adds `aria-multiselectable="true"` to the tree. A tree never has both, and a tree
  with no `selectionMode` has neither. Selection doesn't follow focus.
- **The box** is a [`Checkbox`](../form/checkbox.md) inside an `aria-hidden` span, with
  `tabIndex={-1}`, so it's neither a tab stop nor a second thing for a screen reader to read. The
  item's `aria-checked` is what a screen reader hears.
- **Disabled items** are `aria-disabled` and stay reachable from the arrow keys, Home, End and
  typing, so a screen reader user finds them. They're never selected, checked, opened or closed.
  One that's already open stays open, so what's under it is still reachable. In a `single` tree a
  disabled item has no `aria-selected`. In a `checkbox` tree it keeps `aria-checked`, so the state
  its box shows is heard as well as seen, such as "checked, disabled".
- **A loading item's row** is a `treeitem` that says Loading…, marked `aria-disabled` and reached
  the way a disabled item is, so a screen reader user who moves into the folder hears what's
  happening. It has no value: it's never selected or checked, it has no `aria-selected` or
  `aria-checked`, and a checkbox tree doesn't count it. If it goes with focus on it, focus moves to
  the item it was loading for. Bulma's loader turns in its chevron's place, hidden from assistive
  tech.
- **A failed load's row** is a `treeitem` named by its message and the Retry button's text, such
  as "Couldn't load src Retry". Enter, Space or a click on the row calls `onRetry`, in every mode.
  The button is drawn inside an `aria-hidden` span and takes no focus, the way an item's box is,
  so the tree keeps its one tab stop, and nothing in the message should be a link or a button
  either. A retry that starts loading keeps the same row, so focus stays on it. With no `onRetry`,
  the row is disabled and shows the message alone.
- **Announcements:** a visually hidden `role="status"` region with `aria-live="polite"` sits right
  after the tree, one for the whole tree, from the moment it mounts, so a screen reader is already
  listening when something is written into it. It says "Loading src" when an open item starts
  loading, a failed load's message, and "src loaded" when the loading row or a failed load's row
  goes with the item still open.
  The name is the item's label as a screen reader reads it. A closed item, or one in a closed
  branch, says nothing. Each announcement is written a moment after the change and cleared soon
  after, so the page doesn't keep a second copy of the text. A selection or a check isn't written
  there: it changes `aria-selected` or `aria-checked` on the focused item, which a screen reader
  reads out again, as the simulated one below does.

Enter and Space do the item's one thing, which depends on the mode:

| Key   | No `selectionMode`       | `single`         | `checkbox`               |
| ----- | ------------------------ | ---------------- | ------------------------ |
| Enter | Opens or closes a parent | Selects the item | Opens or closes a parent |
| Space | Opens or closes a parent | Selects the item | Checks or unchecks it    |

On a failed load's row, both retry, whatever the mode. The rest work the same in every mode:

| Key        | What it does                                                                              |
| ---------- | ----------------------------------------------------------------------------------------- |
| Down, Up   | The next or previous item on the page, without wrapping                                   |
| Right      | Opens a closed parent, and focus stays. On an open parent, moves to its first child       |
| Left       | Closes an open parent. Otherwise moves to its parent                                      |
| Home, End  | The first item, and the last one on the page                                              |
| `*`        | Opens every closed parent beside the focused item, itself included. Focus stays           |
| Characters | Moves to the next item whose label starts with what's typed, several characters adding up |
| Tab        | Leaves the tree                                                                           |

- **Right to left:** Right and Left swap in a right-to-left page, and the chevron points to the
  left while closed.
- **Keys it leaves alone:** anything with Control, Alt or Meta held, anything while an input method
  is composing, and Escape, so it reaches a Modal or Popover around the tree. An item's own
  `onKeyDown` runs first, and calling `preventDefault()` there keeps the tree from acting on the
  key.
- **Clicks:** the chevron only opens and closes. The rest of the row does the item's one thing:
  opens or closes it with no `selectionMode`, selects it (and opens or closes a parent) in a
  `single` tree, and checks it in a `checkbox` tree. A click moves focus and the tab stop to the
  item.
- **Not for site navigation:** APG's own
  [navigation tree example](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-navigation/)
  says "A pattern more suited for typical site navigation with expandable groups of links is the
  disclosure pattern", and a tree's items aren't links. Keep a sidebar on [`Menu`](./menu.md),
  whose `Menu.Section` is that disclosure pattern.
- **Focus and the selected look differ:** the focus ring sits outside the row, so it shows on the
  selected fill as well as on a plain row.
- **Forced colors:** in Windows high contrast mode the selected row is the system's Highlight and
  HighlightText, a disabled row or a loading one is GrayText, and the focus ring, the chevrons and
  the guide lines stay visible, since they're outlines and borders. A mixed box keeps its dash, and
  the loader's ring stays open.
- **Motion:** the chevron turns with a short transition, and the loader spins. Both stop when the
  reader asks for reduced motion, and the loader stays drawn.

**What a screen reader says.** What follows is simulated, with
[Guidepup's Virtual Screen Reader](https://www.guidepup.dev/docs/virtual) 0.33.0, which reads the
accessibility tree the way the ARIA and HTML specs describe. It isn't a recording of NVDA, JAWS
or VoiceOver, and each of those words things its own way. The library's tests press these keys
through it on the FileBrowser, Permissions and DeepTree stories, and fail if what it says changes.

1. **Onto a closed parent, then Right and Left:** "treeitem, helpers, not expanded, level 2,
   position 2, not selected, set size 3". Right reads it again as "expanded" and Left as "not
   expanded", with focus staying on it. The items that appear are read when focus reaches them.
2. **Enter and Space with no `selectionMode`:** each press on a parent reads it again with its new
   state, "treeitem, src, not expanded, level 1, position 1, set size 4", then "expanded". A tree
   with no selection says nothing about one.
3. **A level deeper and back up:** Right from components reads its first child, "treeitem,
   Button.tsx, level 3, position 1, not selected, set size 3", and Left goes back to "treeitem,
   components, expanded, level 2, position 1, not selected, set size 3".
4. **Enter in a `single` tree:** the item is read again, "treeitem, TreeView.tsx, level 3, position
   3, selected, set size 3". The item that lost the selection says "not selected" when focus gets
   back to it.
5. **Space in a `checkbox` tree:** the item is read again as "checked". Its parent turns mixed
   without a word, and Left to it reads "treeitem, Billing, partially checked, expanded, level 1,
   position 2, set size 2". Space on the parent reads "checked", and so does each item under it as
   focus reaches it.
6. **A disabled item:** in a `single` tree, "treeitem, legacy.ts, disabled, level 2, position 3, set
   size 3", with no selection state. In a `checkbox` tree, "treeitem, Delete, not checked,
   disabled, level 4, position 3, set size 3", or "checked, disabled" for one its own value checks.
   Enter and Space on it change nothing and say nothing.
7. **Positions:** each item says its place among the items beside it, such as "position 2" and "set
   size 3", at every level.
8. **Tab in and back out, with an item selected:** Tab lands on the selected item, "treeitem,
   Card.tsx, level 3, position 2, selected, set size 3", and Tab again leaves the tree for the next
   control. Shift+Tab comes back to Card.tsx, wherever focus was in the tree before.

Still open in [#1171](https://github.com/allxsmith/bestax/issues/1171): recordings with NVDA, JAWS
and VoiceOver on macOS and iOS, a real Windows contrast theme in place of Chromium's forced colors
emulation, and runs in Firefox and Safari.

---

## Related Components

- [`Menu`](./menu.md): Site navigation, including a sidebar that looks like a tree, and
  `Menu.Section` for groups of links that open and close. Use it for links, and `TreeView` for
  data you browse and pick from.
- [`Checkbox`](../form/checkbox.md): The box a checkbox tree draws, with its mixed state.
- [`Loader`](../elements/loader.md): Bulma's ring, which a loading item's row turns.
- [`Collapse`](./collapse.md): A single section that opens and closes.
- [`Sidebar`](./sidebar.md): A panel at the side of the page that can hold a tree.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: TreeView Stories](https://bestax.io/storybook/?path=/story/components-treeview--default)
- [APG: Tree View Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
- [APG: Disclosure Navigation Menu example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)
- [GitHub: Considerations for making a tree view component accessible](https://github.blog/engineering/user-experience/considerations-for-making-a-tree-view-component-accessible/)

---

## Props

<!-- bestax:generated props -->

| Prop                  | Type                                                  | Default      | Description                                                                                                                                                                                                                                                                                                |
| --------------------- | ----------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`            | `React.ReactNode`                                     | —            | `TreeView.Item`s, nested inside each other for their children. Render an item's children whenever you have them, open or not: the tree hides them while it's closed.                                                                                                                                       |
| `selectionMode`       | `'none'` \| `'single'` \| `'checkbox'`                | `'none'`     | `none`: nothing is picked, and Enter and Space open and close a parent. `single`: one item, picked with Enter, Space or a click. `checkbox`: any number, checked with Space or a click. A check reaches every enabled item under it, and a parent with some of them checked is mixed.                      |
| `selected`            | `string` \| `null`                                    | —            | The selected item's value when you hold the state, or `null` for none. Read with `single` only. Picking an item then only calls `onSelectedChange`, and nothing changes until you pass the new value.                                                                                                      |
| `defaultSelected`     | `string` \| `null`                                    | `null`       | The item selected to begin with, when the tree holds its own state. Read with `single` only.                                                                                                                                                                                                               |
| `onSelectedChange`    | `(value: string) => void`                             | —            | Called with the value of the item picked. Not called for the one already selected, and moving focus never calls it.                                                                                                                                                                                        |
| `checked`             | `string[]`                                            | —            | The checked items' values when you hold the state. Read with `checkbox` only. A value checks its item, and an enabled item also counts as checked when any item above it is in the list, so a parent's value stands for its whole branch, loaded or not. A disabled item is checked only by its own value. |
| `defaultChecked`      | `string[]`                                            | `[]`         | The values checked to begin with, when the tree holds its own state. Read with `checkbox` only.                                                                                                                                                                                                            |
| `onCheckedChange`     | `(checked: string[]) => void`                         | —            | Called after a check or an uncheck with every item that now shows checked, parents included, plus any earlier value that matches no item the tree knows, left as it was. The order means nothing. Passed back as `checked`, the list shows the same boxes.                                                 |
| `expanded`            | `string[]`                                            | —            | The open items' values when you hold the state. A value stays in the list while its item's parent is closed, so the item reopens as it was.                                                                                                                                                                |
| `defaultExpanded`     | `string[]`                                            | `[]`         | The items open to begin with, when the tree holds its own state.                                                                                                                                                                                                                                           |
| `onExpandedChange`    | `(expanded: string[]) => void`                        | —            | Called with the new list whenever an item opens or closes, `*` included.                                                                                                                                                                                                                                   |
| `size`                | `'small'` \| `'medium'` \| `'large'`                  | —            | The text size, as Bulma's menu sizes it. The rows, the indent and the chevron scale with it.                                                                                                                                                                                                               |
| `loadingLabel`        | `string`                                              | `'Loading…'` | What the row in a loading item's group says. In your app's language.                                                                                                                                                                                                                                       |
| `retryLabel`          | `string`                                              | `'Retry'`    | The Retry button's text on a failed load's row. In your app's language.                                                                                                                                                                                                                                    |
| `loadingAnnouncement` | `(name: string) => string`                            | —            | What the live region says when an open item starts loading, built from the item's name. In your app's language. Default: `` `Loading ${name}` ``.                                                                                                                                                          |
| `loadedAnnouncement`  | `(name: string) => string`                            | —            | What the live region says when that load finishes. In your app's language. Default: `` `${name} loaded` ``.                                                                                                                                                                                                |
| `className`           | `string`                                              | —            | Additional CSS classes.                                                                                                                                                                                                                                                                                    |
| `aria-label`          | `string`                                              | —            | Names the tree, such as "Files". A tree needs a name, so pass this or `aria-labelledby`, and a development build warns when it has neither.                                                                                                                                                                |
| `aria-labelledby`     | `string`                                              | —            | The id of a visible heading or label that names the tree, in place of `aria-label`.                                                                                                                                                                                                                        |
| `ref`                 | `React.Ref<HTMLUListElement>`                         | —            | Ref forwarded to the `<ul>`.                                                                                                                                                                                                                                                                               |
| `...`                 | All standard `<ul>` attributes and Bulma helper props | —            | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                          |

**Subcomponents:**

- `TreeView.Item`: One item in the tree: a row with its chevron, its box, its icon and its label, and, while it's open, a group of the items under it.

### TreeView.Item

| Prop            | Type                           | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------- | ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`         | `string`                       | —       | **Required.** Identifies the item in `selected`, `checked` and `expanded`. Unique in the tree.                                                                                                                                                                                                                                                                                                                                             |
| `label`         | `React.ReactNode`              | —       | **Required.** What the row shows, and the item's name for assistive tech. Nothing in it should be a link or a button: a tree item does one thing, and nothing else in its row takes focus.                                                                                                                                                                                                                                                 |
| `icon`          | `React.ReactNode`              | —       | A picture before the label: an `Icon` name, or a node. Hidden from assistive tech.                                                                                                                                                                                                                                                                                                                                                         |
| `children`      | `React.ReactNode`              | —       | `TreeView.Item`s under this one. Render them whenever you have them, open or not: the tree hides them while it's closed, and a checkbox tree needs them to know what a check reaches.                                                                                                                                                                                                                                                      |
| `hasChildren`   | `boolean`                      | `false` | Shows the item as a parent before its children are known, such as a folder that loads when it opens.                                                                                                                                                                                                                                                                                                                                       |
| `isLoading`     | `boolean`                      | `false` | Its children are on their way. While it's open, its group ends in a row that says so, and the tree's live region says it's loading, then that it's loaded once this goes back to `false`. A parent only: pair it with `hasChildren`, or with the children it already has.                                                                                                                                                                  |
| `loadError`     | `React.ReactNode`              | —       | Its children didn't load. While it's open, its group ends in a row with this message, and a Retry button when there's an `onRetry`, and the live region reads the message out, so name the item in it ("Couldn't load src"), then says it's loaded once this goes with the item still open. A parent only, like `isLoading`. Nothing in it should be a link or a button: the row is what's pressed. `isLoading` wins while both are given. |
| `onRetry`       | `() => void`                   | —       | Called by the Retry button on a failed load's row, and by Enter or Space there. Set `isLoading` while the retry runs, so the live region says it's loading, and reads the message out again if it fails again. The same message passed a second time with no loading between is no change the tree can see.                                                                                                                                |
| `disabled`      | `boolean`                      | `false` | Reachable with the arrow keys, Home, End and type-ahead, so a screen reader finds it, but never selected, checked, opened or closed. One that's already open stays open.                                                                                                                                                                                                                                                                   |
| `className`     | `string`                       | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `aria-posinset` | `number`                       | —       | The item's number among the items beside it. The tree declares it, and `aria-setsize`, from the items on the page once it mounts. When the page holds only part of a set, such as the first page of a long folder, pass both on every item of that set: yours win, and the tree's own stay on any item without them.                                                                                                                       |
| `aria-setsize`  | `number`                       | —       | How many items sit beside it, itself included. Declared by the tree like `aria-posinset`, and `-1` says the count isn't known.                                                                                                                                                                                                                                                                                                             |
| `ref`           | `React.Ref<HTMLLIElement>`     | —       | Ref forwarded to the `<li>`.                                                                                                                                                                                                                                                                                                                                                                                                               |
| `...`           | All standard `<li>` attributes | —       |                                                                                                                                                                                                                                                                                                                                                                                                                                            |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`TreeView` registers these variables on its own `.tree-view` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                       | Sass Variable                               | Default                                  |
| -------------------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| `--bulma-tree-view-item-h`                         | `$tree-view-item-h`                         | `var(--bulma-scheme-h)`                  |
| `--bulma-tree-view-item-s`                         | `$tree-view-item-s`                         | `var(--bulma-scheme-s)`                  |
| `--bulma-tree-view-item-background-l`              | `$tree-view-item-background-l`              | `var(--bulma-scheme-main-l)`             |
| `--bulma-tree-view-item-background-l-delta`        | `$tree-view-item-background-l-delta`        | `0%`                                     |
| `--bulma-tree-view-item-hover-background-l-delta`  | `$tree-view-item-hover-background-l-delta`  | `var(--bulma-hover-background-l-delta)`  |
| `--bulma-tree-view-item-active-background-l-delta` | `$tree-view-item-active-background-l-delta` | `var(--bulma-active-background-l-delta)` |
| `--bulma-tree-view-item-color-l`                   | `$tree-view-item-color-l`                   | `var(--bulma-text-l)`                    |
| `--bulma-tree-view-item-radius`                    | `$tree-view-item-radius`                    | `var(--bulma-radius-small)`              |
| `--bulma-tree-view-item-padding`                   | `$tree-view-item-padding`                   | `0.5em 0.75em`                           |
| `--bulma-tree-view-item-selected-h`                | `$tree-view-item-selected-h`                | `var(--bulma-link-h)`                    |
| `--bulma-tree-view-item-selected-s`                | `$tree-view-item-selected-s`                | `var(--bulma-link-s)`                    |
| `--bulma-tree-view-item-selected-background-l`     | `$tree-view-item-selected-background-l`     | `var(--bulma-link-l)`                    |
| `--bulma-tree-view-item-selected-color-l`          | `$tree-view-item-selected-color-l`          | `var(--bulma-link-invert-l)`             |
| `--bulma-tree-view-line-height`                    | `$tree-view-line-height`                    | `1.25`                                   |
| `--bulma-tree-view-group-border`                   | `$tree-view-group-border`                   | `1px solid var(--bulma-border)`          |
| `--bulma-tree-view-group-margin`                   | `$tree-view-group-margin`                   | `0.75em`                                 |
| `--bulma-tree-view-group-padding`                  | `$tree-view-group-padding`                  | `0.75em`                                 |
| `--bulma-tree-view-item-disabled-color`            | `$tree-view-item-disabled-color`            | `var(--bulma-text-weak)`                 |
| `--bulma-tree-view-gap`                            | `$tree-view-gap`                            | `0.375em`                                |
| `--bulma-tree-view-toggle-size`                    | `$tree-view-toggle-size`                    | `1em`                                    |
| `--bulma-tree-view-toggle-color`                   | `$tree-view-toggle-color`                   | `currentColor`                           |
| `--bulma-tree-view-toggle-duration`                | `$tree-view-toggle-duration`                | `var(--bulma-duration)`                  |

<!-- /bestax:generated cssvars -->
