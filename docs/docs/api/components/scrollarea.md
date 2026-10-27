---
title: ScrollArea
sidebar_label: ScrollArea
description: The `ScrollArea` component renders a box whose content scrolls inside it, on the browser's own scrollbars in Bulma's colors.
---

# ScrollArea

## Overview

<!-- bestax:generated overview -->

The `ScrollArea` component renders a box whose content scrolls inside it, on the browser's own scrollbars in Bulma's colors.

<!-- /bestax:generated overview -->

Reach for it wherever content is taller or wider than the space it gets: release notes in a Card,
a chat thread that grows and then scrolls, a sidebar menu longer than the screen, or a wide table
on a phone.

The scrollbars are the browser's own, made thin and colored from Bulma's tokens, so they follow
dark mode and keep the system's settings: bars that only show while you scroll on macOS, bars that
are always there on Windows, and the system's colors in forced colors. While the content
overflows, the area is a named region you can tab to and scroll by keyboard, Safari included.

:::info
Bulma has no scroll area and no scrollbar styles, so `ScrollArea` brings its own, in `bestax.css`
and its variants, or in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { ScrollArea } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `height` and a name. A number is pixels, and a string is any CSS length. The name is
what a screen reader says when the area takes focus, so pass `aria-label`, or `aria-labelledby`
with the id of a visible heading.

```tsx live
<Box p="0">
  <ScrollArea height={200} aria-label="Release notes">
    <Content p="4">
      <h3>Version 3.2</h3>
      <p>
        Search now matches tags as well as titles, and remembers the last filter
        you used on each page.
      </p>
      <h3>Version 3.1</h3>
      <p>
        Exports include the time zone, and a CSV export keeps the column order
        you set in the table.
      </p>
      <h3>Version 3.0</h3>
      <p>
        A new dashboard, with the numbers you check most at the top and the rest
        a click away.
      </p>
    </Content>
  </ScrollArea>
</Box>
```

The helper props, `className` and `style` go on the outer frame, the box you place on the page.
The `ref`, the name, `onScroll` and the other attributes go on the viewport inside it, the element
that scrolls, so `ref.current.scrollTo()` works as it does on any element.

### Named by a Heading

With a heading above it, point `aria-labelledby` at the heading's id rather than saying the name
twice.

```tsx live
<Card>
  <Card.Content>
    <Title as="h3" textSize="5" id="terms-title">
      Terms of service
    </Title>
    <ScrollArea height={160} aria-labelledby="terms-title" className="box p-0">
      <Content p="4">
        <p>
          These terms cover your use of the service. By making an account, you
          agree to them.
        </p>
        <p>
          You keep the rights to what you upload. We keep a copy only as long as
          it takes to run the service for you.
        </p>
        <p>
          We may change these terms. When we do, we tell you a month ahead, by
          email and on this page.
        </p>
      </Content>
    </ScrollArea>
  </Card.Content>
</Card>
```

### Growing to a Height

`maxHeight` in place of `height` makes it only as tall as its content, up to that height, then it
scrolls. Add messages to see it grow, then start to scroll.

```tsx live
function example() {
  const [count, setCount] = useState(2);
  return (
    <>
      <Button size="small" mb="3" onClick={() => setCount(c => c + 2)}>
        Add two messages
      </Button>
      <ScrollArea maxHeight="14rem" aria-label="Messages" className="box p-0">
        {Array.from({ length: count }, (_, i) => (
          <Message key={i} title={i % 2 ? 'Sam' : 'Ana'} m="3">
            Message {i + 1}.
          </Message>
        ))}
      </ScrollArea>
    </>
  );
}
```

### Fading the Edges

`hasFade` fades the content out toward each edge that has more past it, so it's plain that there's
more even where the system's bars only show while you scroll. It's a mask, so it fades to nothing
rather than to a color, and works on any background. The scrollbar itself doesn't fade. The fade
is off in forced colors and when the user asks for more contrast.

```tsx live
<Notification color="info" p="0">
  <ScrollArea height={160} aria-label="Release notes" hasFade>
    <Content p="4">
      <p>
        Search now matches tags as well as titles, and remembers the last filter
        you used on each page.
      </p>
      <p>
        Exports include the time zone, and a CSV export keeps the column order
        you set in the table.
      </p>
      <p>
        A new dashboard, with the numbers you check most at the top and the rest
        a click away.
      </p>
      <p>Faster loading for long lists, and shortcuts for common actions.</p>
    </Content>
  </ScrollArea>
</Notification>
```

The edges are marked on the viewport with `data-overflow-top`, `data-overflow-bottom`,
`data-overflow-start` and `data-overflow-end`, each there while there's more past it, for styles
of your own. Start and end follow the direction, so in a right-to-left page the start is the
right.

### Which Way It Scrolls

`orientation` is `both` by default, scrolling whichever way the content overflows. `vertical` and
`horizontal` clip the other axis. A wide table on a phone is the usual case for `horizontal`.

```tsx live
<ScrollArea
  orientation="horizontal"
  aria-label="Quarterly results"
  className="box p-0"
>
  <Table isNarrow mb="0">
    <Thead>
      <Tr>
        <Th>Region</Th>
        <Th>Q1 2025</Th>
        <Th>Q2 2025</Th>
        <Th>Q3 2025</Th>
        <Th>Q4 2025</Th>
        <Th>Q1 2026</Th>
        <Th>Q2 2026</Th>
        <Th>Q3 2026</Th>
      </Tr>
    </Thead>
    <Tbody>
      <Tr>
        <Td>North</Td>
        <Td>1,812</Td>
        <Td>1,943</Td>
        <Td>2,074</Td>
        <Td>2,205</Td>
        <Td>2,336</Td>
        <Td>2,467</Td>
        <Td>2,598</Td>
      </Tr>
      <Tr>
        <Td>South</Td>
        <Td>1,715</Td>
        <Td>1,846</Td>
        <Td>1,977</Td>
        <Td>2,108</Td>
        <Td>2,239</Td>
        <Td>2,370</Td>
        <Td>2,501</Td>
      </Tr>
    </Tbody>
  </Table>
</ScrollArea>
```

### When the Scrollbars Show

`showScrollbars` is `auto` by default: the bars show whenever the content overflows, the way the
system shows them. `hover` keeps them colorless until the pointer is over the area or focus is in
it, and `always` shows a bar on every axis it scrolls, even when the content fits.

Where the system draws its bars over the content (macOS by default, phones and tablets), they
still show only while you scroll whatever you pick, and in forced colors they always show. `hover`
hides that the area scrolls until you point at it, so keep it for places where the layout makes
that plain, like a sidebar.

```tsx live
<Columns>
  <Column>
    <ScrollArea height={140} aria-label="Notes, auto" className="box p-0">
      <Content p="4">
        <p>auto: the bar shows whenever the content overflows.</p>
        <p>Scroll down to see the rest of the note.</p>
        <p>This is the end of it.</p>
      </Content>
    </ScrollArea>
  </Column>
  <Column>
    <ScrollArea
      height={140}
      showScrollbars="hover"
      aria-label="Notes, hover"
      className="box p-0"
    >
      <Content p="4">
        <p>hover: the bar shows while the pointer is over it.</p>
        <p>Scroll down to see the rest of the note.</p>
        <p>This is the end of it.</p>
      </Content>
    </ScrollArea>
  </Column>
  <Column>
    <ScrollArea
      height={140}
      showScrollbars="always"
      aria-label="Notes, always"
      className="box p-0"
    >
      <Content p="4">
        <p>always: the bar is there even when the content fits.</p>
      </Content>
    </ScrollArea>
  </Column>
</Columns>
```

### A Sidebar Menu

`hasStableGutter` keeps room for the vertical bar whether or not it shows, so the menu doesn't
shift sideways when it starts to overflow. It does nothing where the system draws its bars over
the content.

```tsx live
<Box p="0">
  <ScrollArea
    height={220}
    aria-label="Sections"
    showScrollbars="hover"
    hasStableGutter
  >
    <Menu p="3">
      <Menu.Label>General</Menu.Label>
      <Menu.List>
        <Menu.Item href="#dashboard">Dashboard</Menu.Item>
        <Menu.Item href="#customers">Customers</Menu.Item>
        <Menu.Item href="#orders">Orders</Menu.Item>
      </Menu.List>
      <Menu.Label>Reports</Menu.Label>
      <Menu.List>
        <Menu.Item href="#sales">Sales</Menu.Item>
        <Menu.Item href="#traffic">Traffic</Menu.Item>
        <Menu.Item href="#retention">Retention</Menu.Item>
      </Menu.List>
      <Menu.Label>Settings</Menu.Label>
      <Menu.List>
        <Menu.Item href="#team">Team</Menu.Item>
        <Menu.Item href="#billing">Billing</Menu.Item>
      </Menu.List>
    </Menu>
  </ScrollArea>
</Box>
```

### Loading More at an Edge

`onEdgeReach` is called with the edge when scrolling reaches it: `top`, `bottom`, `start` or `end`.
It's called once each time it arrives, not for the edge the area starts at, and not when the
content changes size. Here, reaching the top loads older messages.

```tsx live
function example() {
  const [messages, setMessages] = useState(() =>
    Array.from({ length: 6 }, (_, i) => `Message ${i + 1}`)
  );
  const [status, setStatus] = useState('');

  function loadOlder() {
    setMessages(current => [
      ...Array.from(
        { length: 3 },
        (_, i) => `Older message ${current.length + i + 1}`
      ),
      ...current,
    ]);
    setStatus('Loaded three older messages');
  }

  return (
    <>
      <Paragraph role="status" visibility="sr-only">
        {status}
      </Paragraph>
      <ScrollArea
        height={220}
        aria-label="Messages"
        hasFade
        className="box p-0"
        onEdgeReach={edge => {
          if (edge === 'top') loadOlder();
        }}
      >
        {messages.map(text => (
          <Message key={text} m="3">
            {text}
          </Message>
        ))}
      </ScrollArea>
    </>
  );
}
```

---

## Accessibility

- **A tab stop while it overflows:** while the content overflows on an axis it scrolls, the
  viewport has `role="region"` and `tabIndex={0}`, so a keyboard user can tab to it and scroll it
  with the arrow keys, Page Up, Page Down, Home, End and Space. Chrome and Firefox make a scroller
  reachable on their own, and Safari doesn't, which is what axe's `scrollable-region-focusable`
  rule catches. While the content fits, it's a plain box and no tab stop. One that stops
  overflowing while it has focus keeps its tab stop until focus leaves it.
- **A name:** pass `aria-label`, or `aria-labelledby` with a visible heading's id. It's what a
  screen reader says when the area takes focus, and a development build warns when there's
  neither. It's rendered along with the region's role, while the content overflows, since ARIA
  doesn't allow naming a plain `div`.
- **The scrollbars are the system's:** ScrollArea adds no key handling and draws no bars of its
  own, so scrolling works the way it does anywhere in the browser, and the system's settings for
  its bars still apply.
- **Contrast:** the thumb is Bulma's `text-weak`, which clears WCAG's 3:1 against `scheme-main` in
  light and dark mode, and darker while the pointer is over the area.
- **Forced colors:** the bars take the system's colors on their own, the focus ring is the
  system's text color, and the fade is off.
- **More contrast:** the fade is off when the user asks for more contrast.
- **Focus ring:** Bulma's focus outline, drawn on the frame, so the fade never clips it.
- **Not live:** content that changes inside it announces nothing on its own. When loading more
  changes the content out of sight, say so in a `role="status"` region, as in
  [Loading More at an Edge](#loading-more-at-an-edge).
- **No motion:** nothing animates. Scrolling is the browser's own, so `scroll-behavior` and
  `prefers-reduced-motion` work as they do anywhere.

---

## Related Components

- [`Box`](../elements/box.md): A frame for it, with a border and a shadow.
- [`Card`](./card.md): Somewhere to put a scroll area with a header above it.
- [`Menu`](./menu.md): The usual content of a scrolling sidebar.
- [`Table`](../elements/table.md): A wide table that scrolls sideways.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc. The
  `overflow` helpers make any element scroll, without a name or a tab stop.

---

## Additional Resources

- [Storybook: ScrollArea Stories](https://bestax.io/storybook/?path=/story/components-scrollarea--default)
- [Adrian Roselli: Keyboard-Only Scrolling Areas](https://adrianroselli.com/2022/06/keyboard-only-scrolling-areas.html)
- [MDN: scrollbar-color](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color)
- [MDN: scrollbar-width](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-width)
- [Deque: scrollable-region-focusable](https://dequeuniversity.com/rules/axe/4.11/scrollable-region-focusable)

---

## Props

<!-- bestax:generated props -->

| Prop              | Type                                                                    | Default  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`       | `string`                                                                | —        | Additional CSS classes for the outer frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `style`           | `React.CSSProperties`                                                   | —        | Inline styles for the outer frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `children`        | `React.ReactNode`                                                       | —        | What scrolls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `height`          | `number` \| `string`                                                    | —        | The area's height. A number is pixels, and a string is any CSS length (`"20rem"`, `"50vh"`, `"100%"`).                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `maxHeight`       | `number` \| `string`                                                    | —        | The height it grows to with its content, then scrolls past. A number is pixels. Use it in place of `height` for an area that's only as tall as it needs to be.                                                                                                                                                                                                                                                                                                                                                          |
| `orientation`     | `'vertical'` \| `'horizontal'` \| `'both'`                              | `'both'` | Which way it scrolls. `vertical` and `horizontal` clip the other axis, and `both` scrolls whichever overflows.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `showScrollbars`  | `'auto'` \| `'hover'` \| `'always'`                                     | `'auto'` | When the scrollbars show. `auto`: whenever the content overflows, the way the system shows them. `hover`: colorless until the pointer is over the area or focus is in it, which hides that the area scrolls until then, so keep it for places where the layout makes that plain. `always`: on every axis it scrolls, even when the content fits. Where the system draws its bars over the content (macOS by default, phones and tablets), they still show only while you scroll, and in forced colors they always show. |
| `hasStableGutter` | `boolean`                                                               | `false`  | Keeps room for the vertical scrollbar whether or not it shows, so the content doesn't shift when it starts to overflow. It does nothing where the system draws its bars over the content.                                                                                                                                                                                                                                                                                                                               |
| `hasFade`         | `boolean`                                                               | `false`  | Fades the content out toward each edge that has more past it, without fading the scrollbar. It's off in forced colors and when the user asks for more contrast.                                                                                                                                                                                                                                                                                                                                                         |
| `onEdgeReach`     | `(edge: ScrollAreaEdge) => void`                                        | —        | Called with the edge when scrolling reaches it, once each time it arrives, such as to load older messages at the top. It isn't called for the edge the area starts at, or when the content changes size.                                                                                                                                                                                                                                                                                                                |
| `textColor`       | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —        | Text color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `bgColor`         | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —        | Background color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `ref`             | `React.Ref<HTMLDivElement>`                                             | —        | Ref forwarded to the viewport, the element that scrolls, for `scrollTo` and the like.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `aria-label`      | `string`                                                                | —        | Names the region, such as "Release notes". It needs a name, so pass this or `aria-labelledby`, and a development build warns when it has neither. The name is rendered with the region's role, while the content overflows, since ARIA doesn't allow naming a plain `div`.                                                                                                                                                                                                                                              |
| `aria-labelledby` | `string`                                                                | —        | The id of a visible heading that names the region, in place of `aria-label`.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `onScroll`        | `React.UIEventHandler<HTMLDivElement>`                                  | —        | Called as the viewport scrolls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `...`             | All standard `<div>` attributes and Bulma helper props                  | —        | The helper props go on the outer `<div>`, the `.scroll-area` frame, with `className` and `style`. The `ref`, the name, `onScroll` and the other attributes go on the `<div>` inside it, the viewport that scrolls. See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                    |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`ScrollArea` registers these variables on its own `.scroll-area` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                            | Sass Variable                    | Default                  |
| --------------------------------------- | -------------------------------- | ------------------------ |
| `--bulma-scroll-area-scrollbar-width`   | `$scroll-area-scrollbar-width`   | `thin`                   |
| `--bulma-scroll-area-thumb-color`       | `$scroll-area-thumb-color`       | `var(--bulma-text-weak)` |
| `--bulma-scroll-area-thumb-hover-color` | `$scroll-area-thumb-hover-color` | `var(--bulma-text)`      |
| `--bulma-scroll-area-track-color`       | `$scroll-area-track-color`       | `transparent`            |
| `--bulma-scroll-area-fade-size`         | `$scroll-area-fade-size`         | `2rem`                   |

<!-- /bestax:generated cssvars -->
