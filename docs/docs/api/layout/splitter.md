---
title: Splitter
sidebar_label: Splitter
description: The `Splitter` component lays out two or more panes side by side or one above the other, with a handle between each pair to drag or move by keyboard.
---

# Splitter

## Overview

<!-- bestax:generated overview -->

The `Splitter` component lays out two or more panes side by side or one above the other, with a handle between each pair to drag or move by keyboard.

<!-- /bestax:generated overview -->

Reach for it wherever people should decide how much room each part of a layout gets: a file tree
beside an editor, a mail client's folders, list and message, filters beside results, or a query
above its output.

You write the panes, and the splitter puts a handle between each pair. Each handle is a focusable
separator, so it can be dragged with a mouse, a finger or a pen, or moved with the arrow keys, and
a screen reader hears which pane it resizes from that pane's `label`.

:::info
Bulma has no resizable layout, so `Splitter` brings its own styles, in `bestax.css` and its
variants, or in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Splitter } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give each pane a `label`, which names its handle, and a `defaultSize` in percent if it shouldn't
share the room equally. A side-by-side splitter is as tall as its content unless you give it a
`height`.

```tsx live
<Splitter height={240} className="box p-0">
  <Splitter.Pane label="Files" defaultSize={30}>
    <Content p="4">
      <p>Drag the handle, or tab to it and use the arrow keys.</p>
    </Content>
  </Splitter.Pane>
  <Splitter.Pane label="Editor">
    <Content p="4">
      <p>Shift with an arrow moves ten times as far.</p>
    </Content>
  </Splitter.Pane>
</Splitter>
```

### Limits

`minSize` and `maxSize` keep a pane within bounds. A number is a percentage, and a string can be a
length in `px` or `rem` as well, such as a sidebar that's never narrower than `12rem`. Lengths
apply once the splitter has measured itself in the browser, so a server-rendered page shows the
default size first and moves only if that default breaks a limit.

```tsx live
<Splitter height={240} className="box p-0">
  <Splitter.Pane label="Sidebar" defaultSize={25} minSize="12rem" maxSize={50}>
    <Content p="4">
      <p>At least 12rem, at most half.</p>
    </Content>
  </Splitter.Pane>
  <Splitter.Pane label="Main">
    <Content p="4">
      <p>Home and End take the sidebar to its limits.</p>
    </Content>
  </Splitter.Pane>
</Splitter>
```

### Stacked Panes

`orientation="vertical"` puts the panes one above the other. A vertical splitter needs a
`height` to split.

```tsx live
<Splitter orientation="vertical" height={320} className="box p-0">
  <Splitter.Pane label="Query" defaultSize={40} minSize="4rem">
    <Content p="4">
      <p>The query.</p>
    </Content>
  </Splitter.Pane>
  <Splitter.Pane label="Results">
    <Content p="4">
      <p>Its results. Up and Down move this handle.</p>
    </Content>
  </Splitter.Pane>
</Splitter>
```

### Three or More Panes

A handle goes between each pair, and moves only the two panes beside it.

```tsx live
<Splitter height={240} className="box p-0">
  <Splitter.Pane label="Folders" defaultSize={20} minSize={10}>
    <Content p="4">
      <p>Folders</p>
    </Content>
  </Splitter.Pane>
  <Splitter.Pane label="Messages" defaultSize={30} minSize={20}>
    <Content p="4">
      <p>Messages</p>
    </Content>
  </Splitter.Pane>
  <Splitter.Pane label="Message">
    <Content p="4">
      <p>Message</p>
    </Content>
  </Splitter.Pane>
</Splitter>
```

### Collapsible Panes

A `collapsible` pane shuts when it's dragged below half its `minSize`, and Enter on its handle
shuts it and brings it back at the size it had. A collapsed pane stays mounted but hidden, so it
keeps its state. Its room goes to the pane across its handle, so it only shuts when that pane can
take the room within its `maxSize`.

`collapsed` and `onCollapsedChange` let a button show and hide it too. With `collapsed`, the
state is yours: a drag or a key that would shut or open the pane calls `onCollapsedChange`, and
the pane changes when you change `collapsed`.

A handle speaks for the pane before it, unless only the pane after it can collapse. So the handle
here belongs to the inspector, and Enter shuts the inspector.

```tsx live
function example() {
  const [hidden, setHidden] = useState(false);
  return (
    <>
      <Button size="small" mb="3" onClick={() => setHidden(h => !h)}>
        {hidden ? 'Show inspector' : 'Hide inspector'}
      </Button>
      <Splitter height={240} className="box p-0">
        <Splitter.Pane label="Canvas">
          <Content p="4">
            <p>The canvas.</p>
          </Content>
        </Splitter.Pane>
        <Splitter.Pane
          label="Inspector"
          defaultSize={35}
          minSize="12rem"
          collapsible
          collapsed={hidden}
          onCollapsedChange={setHidden}
        >
          <Content p="4">
            <p>The inspector.</p>
          </Content>
        </Splitter.Pane>
      </Splitter>
    </>
  );
}
```

### Scrolling Panes

A pane scrolls content that doesn't fit, so nothing is cut off. For content that's meant to
scroll, put a [`ScrollArea`](../components/scrollarea.md) in the pane, so a keyboard user can reach it in
every browser.

```tsx live
<Splitter height={240} className="box p-0">
  <Splitter.Pane label="Notes" defaultSize={40}>
    <ScrollArea height="100%" aria-label="Notes">
      <Content p="4">
        <p>Search now matches tags as well as titles.</p>
        <p>Exports include the time zone.</p>
        <p>A CSV export keeps the column order you set in the table.</p>
        <p>A new dashboard puts the numbers you check most at the top.</p>
        <p>Long lists load faster.</p>
      </Content>
    </ScrollArea>
  </Splitter.Pane>
  <Splitter.Pane label="Preview">
    <Content p="4">
      <p>The preview.</p>
    </Content>
  </Splitter.Pane>
</Splitter>
```

### Keeping the Sizes

`sizes` and `onSizesChange` hold the sizes yourself, in percent, one per pane. That's how a layout
is kept between visits: save them as they change and pass them back.

```tsx live
function example() {
  const [sizes, setSizes] = useState([30, 70]);
  return (
    <>
      <Paragraph mb="3">
        {sizes.map(size => `${Math.round(size)}%`).join(' and ')}
      </Paragraph>
      <Splitter
        height={200}
        className="box p-0"
        sizes={sizes}
        onSizesChange={setSizes}
      >
        <Splitter.Pane label="Filters">
          <Content p="4">
            <p>Filters</p>
          </Content>
        </Splitter.Pane>
        <Splitter.Pane label="Results">
          <Content p="4">
            <p>Results</p>
          </Content>
        </Splitter.Pane>
      </Splitter>
    </>
  );
}
```

In an app rendered in the browser, read the saved sizes as it starts and write them in
`onSizesChange`:

```tsx
const [sizes, setSizes] = useState<number[]>(() =>
  JSON.parse(localStorage.getItem('layout') ?? '[30, 70]')
);

<Splitter
  sizes={sizes}
  onSizesChange={next => {
    setSizes(next);
    localStorage.setItem('layout', JSON.stringify(next));
  }}
>
  …
</Splitter>;
```

A page rendered on the server can't read `localStorage`, so reading it as it starts would render
different sizes on the server and in the browser. Read it in an effect instead, which moves the
layout once after the page loads, or keep the sizes in a cookie the server reads, which renders
them from the start.

### Compound (dot-notation) usage

`Splitter.Pane` is attached to `Splitter`, and also exported on its own as `SplitterPane`.

```tsx live
<Splitter height={160} className="box p-0">
  <SplitterPane label="Left">
    <Content p="4">
      <p>SplitterPane</p>
    </Content>
  </SplitterPane>
  <Splitter.Pane label="Right">
    <Content p="4">
      <p>Splitter.Pane</p>
    </Content>
  </Splitter.Pane>
</Splitter>
```

---

## Accessibility

- **The WAI-ARIA Window Splitter pattern:** each handle is a focusable `separator` whose
  `aria-valuenow`, `aria-valuemin` and `aria-valuemax` give the size of the pane it speaks for, in
  percent, with `aria-controls` pointing at that pane.
- **Names:** a handle is named by its pane's `label`, so a screen reader says "Files, separator,
  25". A development build warns when a handle's pane has no `label`.
- **Orientation:** `aria-orientation` describes the line, so a handle between side-by-side panes
  is `vertical`, and one between stacked panes `horizontal`.
- **Keyboard:** Left and Right Arrow (or Up and Down when stacked) move a handle by `step`, and
  with Shift ten times as far. Home and End take its pane to its limits. Enter collapses a
  collapsible pane and brings it back. Right to left, the arrows follow the screen.
- **Pointer:** dragging works with a mouse, a finger or a pen, and a double-click puts the two
  panes beside a handle back to their default sizes.
- **Collapsed panes** are `hidden`, so nothing in them can be reached until they come back.
- **Focus ring:** Bulma's focus outline, inside the handle.
- **Target size:** the handle is 0.75rem across for a mouse and 1.5rem for a coarse pointer, which
  meets WCAG 2.5.8's 24px.
- **Forced colors:** the line and the grip are borders, which forced colors keeps, and an active
  handle is drawn in the system's highlight color.
- **Not live:** a resize announces nothing beyond the handle's value, which a screen reader reads
  on the focused handle as it changes.

---

## Related Components

- [`ScrollArea`](../components/scrollarea.md): For pane content that scrolls.
- [`Columns`](../columns/columns.md): A layout in fixed proportions that nobody resizes.
- [`Menu`](../components/menu.md): The usual content of a sidebar pane.
- [`TreeView`](../components/treeview.md): A file tree for a sidebar pane.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Splitter Stories](https://bestax.io/storybook/?path=/story/layout-splitter--default)
- [WAI-ARIA Authoring Practices: Window Splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/)
- [WAI-ARIA 1.2: separator](https://www.w3.org/TR/wai-aria-1.2/#separator)

---

## Props

<!-- bestax:generated props -->

| Prop            | Type                                                                    | Default        | Description                                                                                                                                                                             |
| --------------- | ----------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`     | `string`                                                                | —              | Additional CSS classes to apply.                                                                                                                                                        |
| `children`      | `React.ReactNode`                                                       | —              | `Splitter.Pane`s, two or more, each a direct child, with Fragments opened up. A handle goes between each pair. Changing which panes there are puts every pane back to its default size. |
| `orientation`   | `'horizontal'` \| `'vertical'`                                          | `'horizontal'` | The way the panes run: side by side (`horizontal`) or one above the other (`vertical`).                                                                                                 |
| `height`        | `number` \| `string`                                                    | —              | The splitter's height. A number is pixels, and a string any CSS length. A vertical splitter needs a height to split.                                                                    |
| `sizes`         | `number[]`                                                              | —              | Each pane's size, in percent, in order, adding up to 100. With it, the sizes are yours: update them from `onSizesChange`. Without it, each pane starts at its `defaultSize`.            |
| `onSizesChange` | `(sizes: number[]) => void`                                             | —              | Called with every pane's size, in percent, whenever they change: on each step of a drag or a key, on a collapse and on a reset.                                                         |
| `step`          | `number`                                                                | `1`            | How far an arrow key moves a handle, in percent. Shift moves ten times as far.                                                                                                          |
| `textColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —              | Text color helper.                                                                                                                                                                      |
| `bgColor`       | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —              | Background color helper.                                                                                                                                                                |
| `ref`           | `React.Ref<HTMLDivElement>`                                             | —              | Ref forwarded to the root `<div>`.                                                                                                                                                      |
| `...`           | All standard `<div>` attributes and Bulma helper props                  | —              | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                       |

**Subcomponents:**

- `Splitter.Pane`: One pane of a Splitter, sized by the splitter around it.

### Splitter.Pane

| Prop                | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `className`         | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                             |
| `label`             | `string`                                                                | —       | What the pane is, such as "Files". It names the handle that speaks for this pane, which is announced as "Files, separator, 25". That's the handle after it, or the one before it when only this pane, of the two beside that handle, can collapse. A development build warns when a handle's pane has none.                                                  |
| `defaultSize`       | `number`                                                                | —       | Its starting size, in percent of the room the panes share. Panes without one share what's left equally, and a total over 100 is scaled down.                                                                                                                                                                                                                 |
| `minSize`           | `number` \| `string`                                                    | —       | The smallest it can be dragged: a percentage, or a CSS length in `px` or `rem` such as `"12rem"`. A length applies once the splitter has measured itself in the browser, so the server renders the default size.                                                                                                                                             |
| `maxSize`           | `number` \| `string`                                                    | —       | The largest it can be dragged, in the same units as `minSize`.                                                                                                                                                                                                                                                                                               |
| `collapsible`       | `boolean`                                                               | `false` | Lets it collapse: dragging it below half its `minSize` shuts it, and Enter on its handle shuts it and brings it back at the size it had. It collapses only when the pane across its handle can take its room within that pane's `maxSize`, since a handle moves only the two panes beside it. A collapsed pane stays mounted, hidden, so it keeps its state. |
| `collapsed`         | `boolean`                                                               | `false` | Whether it's collapsed, for a `collapsible` pane. With it, the state is yours: a drag, a key or a double-click that would collapse it or bring it back calls `onCollapsedChange` and leaves it as it is, and it changes when `collapsed` does.                                                                                                               |
| `defaultCollapsed`  | `boolean`                                                               | `false` | Whether a `collapsible` pane starts collapsed.                                                                                                                                                                                                                                                                                                               |
| `onCollapsedChange` | `(collapsed: boolean) => void`                                          | —       | Called when a drag, a key or a double-click collapses it or brings it back, or, with `collapsed`, would. Not called for a change you made with `collapsed`.                                                                                                                                                                                                  |
| `children`          | `React.ReactNode`                                                       | —       | What's in it. Content that scrolls belongs in a `ScrollArea`, so a keyboard can reach it.                                                                                                                                                                                                                                                                    |
| `textColor`         | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                                                                                                                                                                                                                                           |
| `bgColor`           | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                                                                                                                                                                                                                                     |
| `ref`               | `React.Ref<HTMLDivElement>`                                             | —       | Ref forwarded to the pane's `<div>`.                                                                                                                                                                                                                                                                                                                         |
| `id`                | `string`                                                                | —       | The pane's id, which its handle's `aria-controls` points at. The splitter makes one when there's none.                                                                                                                                                                                                                                                       |
| `...`               | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                            |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Splitter` registers these variables on its own `.splitter` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                          | Sass Variable                  | Default                       |
| ------------------------------------- | ------------------------------ | ----------------------------- |
| `--bulma-splitter-handle-size`        | `$splitter-handle-size`        | `0.75rem`                     |
| `--bulma-splitter-handle-size-coarse` | `$splitter-handle-size-coarse` | `1.5rem`                      |
| `--bulma-splitter-line-size`          | `$splitter-line-size`          | `1px`                         |
| `--bulma-splitter-line-color`         | `$splitter-line-color`         | `var(--bulma-border)`         |
| `--bulma-splitter-line-active-size`   | `$splitter-line-active-size`   | `2px`                         |
| `--bulma-splitter-line-active-color`  | `$splitter-line-active-color`  | `var(--bulma-primary)`        |
| `--bulma-splitter-grip-length`        | `$splitter-grip-length`        | `1.5rem`                      |
| `--bulma-splitter-grip-size`          | `$splitter-grip-size`          | `0.25rem`                     |
| `--bulma-splitter-grip-color`         | `$splitter-grip-color`         | `var(--bulma-border-hover)`   |
| `--bulma-splitter-grip-radius`        | `$splitter-grip-radius`        | `var(--bulma-radius-rounded)` |

<!-- /bestax:generated cssvars -->
