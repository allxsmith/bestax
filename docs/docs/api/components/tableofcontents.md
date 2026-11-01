---
title: TableOfContents
sidebar_label: TableOfContents
description: The `TableOfContents` component lists a long page's sections as links in Bulma's menu look, and marks the one being read.
---

# TableOfContents

## Overview

<!-- bestax:generated overview -->

The `TableOfContents` component lists a long page's sections as links in Bulma's menu look, and marks the one being read.

<!-- /bestax:generated overview -->

Use it beside a long page: a docs or help page with its headings in a side column, a settings page
that jumps between groups, or a report with its sections down the side on a wide screen.

It takes the sections as an `items` array and renders a `<nav>` of plain `#id` links, on the server
too, so they work before the page hydrates and can be opened in a new tab or shared. Following one
is the browser's own jump, with no click handler. As the page scrolls, one link at a time is
current, marked with Bulma's `is-active` and `aria-current="location"`. The hook that picks it,
`useScrollSpy`, is public, so an app's own nav `Menu` can mark the section in view too.

It looks like Bulma's menu because it is one: a `menu-label` title, `menu-list` links through
`MenuList` and `MenuItem`, and nested lists with Bulma's line at their start, so every
`--bulma-menu-*` variable themes it and it matches a nav `Menu` beside it.

:::info
Bulma has a menu and no table of contents. `TableOfContents` draws Bulma's menu and brings a small
partial for `isSticky` only, in `bestax.css` and its variants, or in `extras.css` next to your own
Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { TableOfContents, useScrollSpy } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give each section an `id`, and pass the sections in page order as `items`, each with the `id` it
links to and a `label`. `children` nest under an entry. On a page it usually sits in a side column
and sticks as the page scrolls:

```tsx
<Columns>
  <Column>
    <Content>
      <h2 id="install">Install</h2>
      <p>Add the package and import its stylesheet once.</p>
      <h2 id="usage">Usage</h2>
      <h3 id="props">Props</h3>
      <h3 id="examples">Examples</h3>
      <h2 id="faq">FAQ</h2>
    </Content>
  </Column>
  <Column size="one-quarter">
    <TableOfContents
      isSticky
      items={[
        { id: 'install', label: 'Install' },
        {
          id: 'usage',
          label: 'Usage',
          children: [
            { id: 'props', label: 'Props' },
            { id: 'examples', label: 'Examples' },
          ],
        },
        { id: 'faq', label: 'FAQ' },
      ]}
    />
  </Column>
</Columns>
```

The live examples on this page render in a shadow root of their own, which an `#id` link can't
reach, so they list this page's own sections. Scroll the page with one in view, or follow one of
its links. This site offsets a jump below its navbar with `scroll-margin-top` on its headings
rather than `scroll-padding-top` on the page, so the examples pass the same distance as `offset`
(see [A Sticky Header and Smooth Scrolling](#a-sticky-header-and-smooth-scrolling)).

```tsx live
<TableOfContents
  offset={68}
  items={[
    {
      id: 'usage',
      label: 'Usage',
      children: [
        { id: 'basic-usage', label: 'Basic Usage' },
        {
          id: 'a-sticky-header-and-smooth-scrolling',
          label: 'A Sticky Header and Smooth Scrolling',
        },
        {
          id: 'reporting-the-current-section',
          label: 'Reporting the Current Section',
        },
        { id: 'the-usescrollspy-hook', label: 'The useScrollSpy Hook' },
        { id: 'translations', label: 'Translations' },
      ],
    },
    { id: 'which-section-is-current', label: 'Which Section Is Current' },
    { id: 'accessibility', label: 'Accessibility' },
  ]}
/>
```

### A Sticky Header and Smooth Scrolling

Following a link is the browser's own jump, so two lines of your page's CSS shape it. Under a
sticky header, `scroll-padding-top` on the page keeps a jump from landing under the header, and
`TableOfContents` reads the same value, so a section counts as reached where a jump puts it. Smooth
scrolling, if you want it, goes inside `prefers-reduced-motion: no-preference`, so a reader who
asks for less motion gets the jump.

```css
html {
  scroll-padding-top: 4rem; /* your header's height, plus a little room */
}

@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}
```

Use `scroll-padding-top` on the page rather than `scroll-margin-top` on the headings: both move a
jump, and only the first moves the line the highlight reads. A page that offsets its headings
another way, as this site does, passes `offset`, the line in pixels from the top of the viewport,
set to where its jumps land.

With `isSticky` under a fixed or sticky header, set `--bulma-table-of-contents-sticky-top` on the
list to the header's height plus a little room, so it stops below the header rather than under it.

### Reporting the Current Section

`onActiveChange` is called with the current section's id each time it changes, and with `null`
above the first section. It isn't called on the server or before the page hydrates.

```tsx live
function example() {
  const [current, setCurrent] = useState<string | null>(null);
  return (
    <>
      <Paragraph textWeight="semibold">
        Reading: {current ?? 'nothing yet'}
      </Paragraph>
      <TableOfContents
        offset={68}
        onActiveChange={setCurrent}
        items={[
          { id: 'usage', label: 'Usage' },
          { id: 'which-section-is-current', label: 'Which Section Is Current' },
          { id: 'accessibility', label: 'Accessibility' },
          { id: 'related-components', label: 'Related Components' },
        ]}
      />
    </>
  );
}
```

### The useScrollSpy Hook

`useScrollSpy` is what picks the current section, and it returns its id, or `null`. Use it to mark
the section in view in anything else, such as the nav `Menu` of a long settings page whose nav is
its table of contents. Give the current link `aria-current="location"`, which tells a screen reader
it's where the reader is on this page; `MenuItem`'s `active` says `page` unless you pass your own.

```tsx live
function example() {
  const sections = [
    { id: 'usage', label: 'Usage' },
    { id: 'which-section-is-current', label: 'Which Section Is Current' },
    { id: 'accessibility', label: 'Accessibility' },
  ];
  const current = useScrollSpy({
    ids: sections.map(section => section.id),
    offset: 68,
  });
  return (
    <Menu aria-label="This page">
      <Menu.List>
        {sections.map(section => (
          <Menu.Item
            key={section.id}
            href={`#${section.id}`}
            active={current === section.id}
            aria-current={current === section.id ? 'location' : undefined}
          >
            {section.label}
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}
```

It takes the `ids` to watch in page order, and `offset` and `onActiveChange` as the component does.
A new array with the same ids each render doesn't start it over.

### Translations

`labels.title` is the list's visible title and the name of its `<nav>`, "On this page" by default.
A label can hold more than text, such as a `Tag`.

```tsx live
<TableOfContents
  offset={68}
  labels={{ title: 'Sur cette page' }}
  items={[
    { id: 'usage', label: 'Utilisation' },
    {
      id: 'accessibility',
      label: (
        <>
          Accessibilité <Tag color="info">a11y</Tag>
        </>
      ),
    },
  ]}
/>
```

---

## Which Section Is Current

The line is the page's `scroll-padding-top`, or `offset` when it's given, measured down from the top
of the viewport.

- **Reading:** the current section is the last one whose top is at or above the line. Above the
  first section, none is.
- **The end of the page:** once the page is scrolled to its end, the last section is current, so a
  short last section that can't reach the line still gets its turn.
- **After a jump:** the section a link went to stays current until the jump's scrolling has settled
  and the reader scrolls again, so a smooth scroll doesn't light up each section it passes. The jump
  is seen through the `hashchange` it causes. A link to the section already in the address bar
  causes none, and then the reading rule marks it where it lands.
- **Missing or hidden sections:** an entry whose `id` isn't on the page keeps its link, is never
  current, and a development build names it once. A section that isn't drawn (`display: none`) is
  never current either.

It watches the page with an `IntersectionObserver`, which runs the check as a section's top crosses
the line, however fast the page moves, and checks once more each time scrolling stops, which is how
it sees the end of the page. Where `IntersectionObserver` is missing, every scroll checks. It looks
the sections up when it mounts and again when `items` change, and reads the line again when the
window is resized. It watches the document only: not a panel that scrolls inside it, and not
sections inside a shadow root, which an `#id` link can't reach either.

When the list is taller than the room it has, as a long sticky list can be, it scrolls itself to
keep the current link in view. Only the list moves, never the page.

---

## Accessibility

- **A named landmark:** it's a `<nav>`, named by its visible title through `aria-labelledby`, so a
  screen reader's list of landmarks tells it apart from the site's main navigation. Change the name
  with `labels.title`.
- **Real links:** each entry is an `<a href="#id">`, so it works before hydration, opens in a new
  tab, and can be shared. Following one is the browser's own jump, so the next Tab moves on from the
  section the reader picked, where a scripted scroll would send it back to the list.
- **One current link:** the current link alone has `aria-current="location"`, ARIA's token for where
  you are within a page, never `page`, since the page hasn't changed, and never on more than one
  link.
- **Lists stay lists:** each `MenuList` restates `role="list"`, which Bulma's list reset strips in
  Safari.
- **Not hidden under a sticky header:** with `scroll-padding-top` on the page, a jump lands below
  the header, as WCAG's Focus Not Obscured asks. With `isSticky`, the list keeps room at its sides
  for a link's focus ring, which its scrolling would clip otherwise.
- **No motion of its own:** smooth scrolling is your page's CSS, inside
  `prefers-reduced-motion: no-preference`, and the list scrolls itself instantly.
- **Forced colors:** the current link keeps Menu's bar in the system's Highlight color, since forced
  colors replaces Bulma's fill.

---

## Related Components

- [`Menu`](./menu.md): The list it draws, for navigation between pages.
- [`Columns`](../columns/columns.md): A side column to put it in.
- [`Steps`](./steps.md): Progress through the steps of a task rather than the sections of a page.
- [`Reveal`](./reveal.md): Content that animates as it scrolls into view.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: TableOfContents Stories](https://bestax.io/storybook/?path=/story/components-tableofcontents--default)
- [Bulma Menu documentation](https://bulma.io/documentation/components/menu/)
- [WAI-ARIA: aria-current](https://w3c.github.io/aria/#aria-current)
- [WCAG 2.2: Understanding Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- [MDN: scroll-padding-top](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding-top)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

## Props

<!-- bestax:generated props -->

| Prop             | Type                                                                         | Default | Description                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`      | `string`                                                                     | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                       |
| `items`          | `{ id: string; label: React.ReactNode; children?: TableOfContentsItem[] }[]` | —       | **Required.** The sections, in page order, as links to their ids. Each link is a plain `<a href="#id">`, so following one is the browser's own jump: put `scroll-padding-top` on the page to land clear of a sticky header, and smooth scrolling, if you want it, in page CSS inside `@media (prefers-reduced-motion: no-preference)`. |
| `onActiveChange` | `(id: string \| null) => void`                                               | —       | Called with the current section's id when it changes, or `null` above the first section. Never called on the server or before hydration.                                                                                                                                                                                               |
| `offset`         | `number`                                                                     | —       | Pixels from the viewport's top where a section counts as reached. Unset, it's the page's `scroll-padding-top`, so the highlight agrees with where a jump lands under a sticky header.                                                                                                                                                  |
| `isSticky`       | `boolean`                                                                    | `false` | Sticks to the top of the viewport as the page scrolls, at `--bulma-table-of-contents-sticky-top`, and scrolls itself when it's taller than the viewport. Adds `is-sticky`.                                                                                                                                                             |
| `labels`         | `{ title?: string }`                                                         | —       | The visible strings, in your app's language.                                                                                                                                                                                                                                                                                           |
| `textColor`      | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`      | —       | Text color helper.                                                                                                                                                                                                                                                                                                                     |
| `bgColor`        | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`      | —       | Background color helper.                                                                                                                                                                                                                                                                                                               |
| `ref`            | `React.Ref<HTMLElement>`                                                     | —       | Ref forwarded to the `<nav>`.                                                                                                                                                                                                                                                                                                          |
| `...`            | All standard HTML attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                      |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`TableOfContents` registers these variables on its own `.table-of-contents` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                           | Sass Variable                   | Default                      |
| -------------------------------------- | ------------------------------- | ---------------------------- |
| `--bulma-table-of-contents-sticky-top` | `$table-of-contents-sticky-top` | `var(--bulma-block-spacing)` |

<!-- /bestax:generated cssvars -->
