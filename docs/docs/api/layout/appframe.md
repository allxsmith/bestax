---
title: AppFrame
sidebar_label: AppFrame
description: "The `AppFrame` component lays out an app's pages: a header across the top, a navigation column down the side, the page, and an aside and a footer, with the nav a drawer behind a burger on narrow screens."
keywords:
  - app shell
  - AppShell
  - app layout
  - dashboard layout
  - admin layout
  - sidebar layout
  - navigation drawer
  - skip link
---

# AppFrame

## Overview

<!-- bestax:generated overview -->

The `AppFrame` component lays out an app's pages: a header across the top, a navigation column down the side, the page, and an aside and a footer, with the nav a drawer behind a burger on narrow screens.

<!-- /bestax:generated overview -->

It's the frame, or app shell, that an admin area, a dashboard, a docs site or a settings area sits
in: the header and the navigation stay in view while the page changes. You fill it with the
components you already use, a `Navbar` in the header, a `Menu` in the nav, a `Section` in the
page.

The header and the nav column stick while the document scrolls, so the browser keeps its own
scrolling: find in page, scroll restoration, and the phone toolbar that hides as you scroll. Below
a Bulma breakpoint the same `<nav>` becomes a modal drawer behind the burger, and from the
breakpoint up the burger collapses the column instead. A skip link comes first, for keyboard
users to jump past the header and the nav.

:::info
Bulma has no frame, so `AppFrame` brings its own styles, in `bestax.css` and its variants, or in
`extras.css` next to your own Bulma.
:::

:::note
An `AppFrame` is a whole page. The examples below sit inside this one, so their headers and an
open drawer go under the site's own header, and the drawer covers the rest of this page. The
StackBlitz and CodeSandbox buttons open each as a page of its own.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { AppFrame, useAppFrame } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Put the parts directly inside `AppFrame`, in the order they come on the page: `AppFrame.Header`,
`AppFrame.Nav`, `AppFrame.Main`, and an `AppFrame.Aside` and an `AppFrame.Footer` when there are
any. A `Navbar` goes in the header, with `AppFrame.Burger` in its `Navbar.Brand`, where Bulma puts
a burger.

```tsx live
<AppFrame>
  <AppFrame.Header>
    <Navbar aria-label="Site">
      <Navbar.Brand>
        <Navbar.Item href="#">
          <strong>Acme</strong>
        </Navbar.Item>
        <AppFrame.Burger />
      </Navbar.Brand>
    </Navbar>
  </AppFrame.Header>
  <AppFrame.Nav>
    <Menu>
      <Menu.List>
        <Menu.Item href="#" active>
          Dashboard
        </Menu.Item>
        <Menu.Item href="#">Orders</Menu.Item>
        <Menu.Item href="#">Settings</Menu.Item>
      </Menu.List>
    </Menu>
  </AppFrame.Nav>
  <AppFrame.Main>
    <Section>
      <Title as="h1">Dashboard</Title>
      <Paragraph>The page goes here.</Paragraph>
    </Section>
  </AppFrame.Main>
  <AppFrame.Footer>
    <Footer as="div">
      <Paragraph textAlign="centered">Acme, Inc.</Paragraph>
    </Footer>
  </AppFrame.Footer>
</AppFrame>
```

Put the frame at the top of the page, outside any `<main>` or sectioning element. Its `<header>`
and `<footer>` are the page's banner and contentinfo landmarks only there, and a development build
warns when they aren't. Keep one `<main>` on the page: `AppFrame.Main` is it.

`AppFrame.Burger` takes the place of the `Navbar`'s own burger. Below the desktop breakpoint Bulma
hides a `Navbar.Menu` until it's active, so put the links it would hold in the nav as well, or
leave `Navbar.Menu` out.

### The Drawer

Below the breakpoint the nav is a drawer. The burger opens it over a backdrop, and it's modal:
focus moves to its close button, Tab stays inside, the page behind it doesn't scroll, and the rest
of the frame is inert. What renders outside the frame, such as a `Modal` opened from the drawer or
a toast, stays live. Escape, its close button, a click on the backdrop and a link followed from it
close it, and focus goes back to the burger. After a link, the navigation takes it from there: a
router that moves focus on navigation moves it, and an in-page `#` link leaves it at its target, as
it does anywhere on the page. Closed, the drawer is hidden, so its links are out of the Tab order
and out of the accessibility tree, on the server's markup too. Open, the nav and its backdrop take
Bulma's `is-active`, as a navbar's menu does, for a stylesheet of your own to select.

`breakpoint` sets where the nav turns into a column: `tablet`, `desktop` (the default, where
Bulma's navbar shows its menu) or `widescreen`. This one is a drawer until the window is
widescreen.

```tsx live
<AppFrame breakpoint="widescreen">
  <AppFrame.Header>
    <Navbar aria-label="Site">
      <Navbar.Brand>
        <Navbar.Item href="#">
          <strong>Acme</strong>
        </Navbar.Item>
        <AppFrame.Burger />
      </Navbar.Brand>
    </Navbar>
  </AppFrame.Header>
  <AppFrame.Nav width="14rem">
    <Menu>
      <Menu.List>
        <Menu.Item href="#" active>
          Inbox
        </Menu.Item>
        <Menu.Item href="#">Sent</Menu.Item>
        <Menu.Item href="#">Archive</Menu.Item>
      </Menu.List>
    </Menu>
  </AppFrame.Nav>
  <AppFrame.Main>
    <Section>
      <Paragraph>
        Narrower than widescreen, the burger opens the drawer.
      </Paragraph>
    </Section>
  </AppFrame.Main>
</AppFrame>
```

`AppFrame.Nav` takes the switches the siblings use. `overlay={false}` drops the backdrop and the
modal parts: focus still moves in, but Tab can leave for the page and the page still scrolls. There
a press anywhere outside the drawer closes it and hands focus to the burger, and then the press
moves it, as it would on any page: to what was pressed if that takes focus, such as a field, and
otherwise to the page. A touch that scrolls the page leaves it on the burger. `closeOnEscape` and
`closeOnClickOutside` turn those off, and `closeOnNavigate={false}` keeps the drawer open as links
in it are followed, for a drawer of filters rather than pages. `width` sets the column's width and
the drawer's, which leaves a strip of backdrop on a narrow phone.

An overlay opened from the drawer, such as a `Modal`, goes inside `AppFrame.Nav` or renders outside
the frame (Modal's `portal`): while the drawer is open, the rest of the frame is inert.

When the window widens past the breakpoint with the drawer open, the drawer closes and the nav is
the column again, so focus on one of its links stays where it is. The close button hides in the
column, so focus on it goes back to the burger.

### Collapsing the Column

From the breakpoint up, the burger collapses the column out of view and brings it back. The frame
holds that state and the drawer's apart, since closing the drawer on a phone shouldn't collapse
the column on a desktop. Each is yours to control: `navOpen` with `onNavOpenChange` for the
drawer, and `navCollapsed` with `onNavCollapsedChange` for the column.

```tsx live
function example() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <AppFrame navCollapsed={collapsed} onNavCollapsedChange={setCollapsed}>
      <AppFrame.Header>
        <Navbar aria-label="Site">
          <Navbar.Brand>
            <Navbar.Item href="#">
              <strong>Acme</strong>
            </Navbar.Item>
            <AppFrame.Burger />
          </Navbar.Brand>
        </Navbar>
      </AppFrame.Header>
      <AppFrame.Nav>
        <Menu>
          <Menu.List>
            <Menu.Item href="#" active>
              Dashboard
            </Menu.Item>
            <Menu.Item href="#">Orders</Menu.Item>
          </Menu.List>
        </Menu>
      </AppFrame.Nav>
      <AppFrame.Main>
        <Section>
          <Paragraph>
            The column is {collapsed ? 'collapsed' : 'expanded'}.
          </Paragraph>
        </Section>
      </AppFrame.Main>
    </AppFrame>
  );
}
```

The burger shows at every width, since from the breakpoint up it collapses the column. A column
that never collapses hides it there with the visibility helpers:
`<AppFrame.Burger visibilityDesktop="hidden" />` at the default breakpoint.

### Keeping the State

The frame stores nothing. To keep a collapsed column between visits, save it from
`onNavCollapsedChange` and pass it back. A cookie the server reads renders the column the way it
was from the first paint, where `localStorage` can only be read once the page is in the browser,
which moves the column after it loads.

```tsx
// On the server, read the cookie into `initialCollapsed`, then:
const [collapsed, setCollapsed] = useState(initialCollapsed);

<AppFrame
  navCollapsed={collapsed}
  onNavCollapsedChange={next => {
    setCollapsed(next);
    document.cookie = `nav-collapsed=${next}; path=/; max-age=31536000`;
  }}
>
  …
</AppFrame>;
```

### Beside the Page

`AppFrame.Aside` is a column on the other side of the page from the breakpoint up, for an
outline, details or filters, and moves under the page below it. Give it an `aria-label` when the
page has another aside.

```tsx live
<AppFrame>
  <AppFrame.Header>
    <Navbar aria-label="Site">
      <Navbar.Brand>
        <Navbar.Item href="#">
          <strong>Docs</strong>
        </Navbar.Item>
        <AppFrame.Burger />
      </Navbar.Brand>
    </Navbar>
  </AppFrame.Header>
  <AppFrame.Nav>
    <Menu>
      <Menu.List>
        <Menu.Item href="#" active>
          Getting started
        </Menu.Item>
        <Menu.Item href="#">Components</Menu.Item>
      </Menu.List>
    </Menu>
  </AppFrame.Nav>
  <AppFrame.Main>
    <Section>
      <Title as="h1">Getting started</Title>
    </Section>
  </AppFrame.Main>
  <AppFrame.Aside aria-label="On this page" width="14rem" p="4">
    <Paragraph textWeight="semibold">On this page</Paragraph>
    <Paragraph>Install</Paragraph>
  </AppFrame.Aside>
</AppFrame>
```

### A Toggle of Your Own

`useAppFrame()` gives a control inside the frame the same state the burger has: `navOpen`,
`navCollapsed`, `isDrawer`, a setter for each, `navId` for its `aria-controls`, and `toggleNav()`,
which does what the burger does at the current width. Outside an `AppFrame` it returns `null`,
so a control that can sit outside one renders a fallback, or nothing.

Have your toggle focus itself before it toggles, as `AppFrame.Burger` does. Safari, and Firefox on a Mac, don't focus a button on click, so without it the drawer has no opener to hand focus back to when it closes.

```tsx live
function example() {
  function SectionsToggle() {
    const frame = useAppFrame();
    if (!frame) return null;
    const expanded = frame.isDrawer ? frame.navOpen : !frame.navCollapsed;
    return (
      <Button
        size="small"
        aria-controls={frame.navId}
        aria-expanded={expanded}
        onClick={event => {
          event.currentTarget.focus();
          frame.toggleNav();
        }}
      >
        {expanded ? 'Hide sections' : 'Show sections'}
      </Button>
    );
  }
  return (
    <AppFrame>
      <AppFrame.Nav>
        <Menu>
          <Menu.List>
            <Menu.Item href="#" active>
              Dashboard
            </Menu.Item>
          </Menu.List>
        </Menu>
      </AppFrame.Nav>
      <AppFrame.Main>
        <Section>
          <SectionsToggle />
        </Section>
      </AppFrame.Main>
    </AppFrame>
  );
}
```

### Labels

`labels` replaces the strings the frame renders, for another language: `skipLink`, `nav` (the
nav's name, "Sections" by default), `closeNav` and `burger`. An `aria-label` or `aria-labelledby`
on `AppFrame.Nav`, or an `aria-label` on `AppFrame.Burger`, wins over its label.
`skipLink={false}` leaves the skip link out, for a page that has its own.

```tsx
<AppFrame
  labels={{
    skipLink: 'Zum Inhalt springen',
    nav: 'Bereiche',
    closeNav: 'Navigation schließen',
    burger: 'Menü',
  }}
>
  …
</AppFrame>
```

### A Taller Header

The nav column sticks under the header, and in-page links and focus scroll clear of it, by
`--bulma-app-frame-header-height`, which is `--bulma-navbar-height` unless you set it. A header
taller than Bulma's navbar, such as one holding a spaced `Navbar` or a second row, sets it on
`:root`, where the document can read it:

```css
:root {
  --bulma-app-frame-header-height: 4.5rem;
}
```

### Compound (dot-notation) usage

The parts are attached to `AppFrame`, and also exported on their own as `AppFrameHeader`,
`AppFrameNav`, `AppFrameMain`, `AppFrameAside`, `AppFrameFooter` and `AppFrameBurger`.

```tsx live
<AppFrame>
  <AppFrameHeader>
    <Navbar aria-label="Site">
      <Navbar.Brand>
        <Navbar.Item href="#">
          <strong>Acme</strong>
        </Navbar.Item>
        <AppFrameBurger />
      </Navbar.Brand>
    </Navbar>
  </AppFrameHeader>
  <AppFrameNav>
    <Menu>
      <Menu.List>
        <Menu.Item href="#" active>
          Dashboard
        </Menu.Item>
      </Menu.List>
    </Menu>
  </AppFrameNav>
  <AppFrame.Main>
    <Section>
      <Paragraph>
        AppFrameNav and AppFrame.Nav are the same component.
      </Paragraph>
    </Section>
  </AppFrame.Main>
</AppFrame>
```

---

## Accessibility

- **Landmarks:** the header, the nav, the page and the footer are the page's banner, navigation,
  main and contentinfo landmarks, and the aside a complementary one, as long as the frame sits at
  the top of the page. A development build warns when it sits inside a `main` or a sectioning
  element, where the header and footer stop being landmarks.
- **Names:** the nav is named "Sections" (`labels.nav`), since the `Navbar` in the header names
  its own navigation. The name leaves out the word "navigation", which the role says. A `Menu`
  in the nav keeps its `<aside>`, which inside a `<nav>` is a plain element unless it's named.
- **Skip link:** the first thing on the page, hidden until it has focus, moves focus to the page's
  `<main>` (WCAG 2.4.1).
- **Sticky header:** `scroll-padding-top` on the document keeps an in-page link's target and a
  focused element below the header (WCAG 2.4.11, technique C43).
- **The burger** is a button named "menu" (`labels.burger`), with `aria-expanded` saying whether
  the drawer is open, or from the breakpoint up whether the column is shown, and `aria-controls`
  naming the nav. The server can't know the width, so until the page hydrates the burger has no
  `aria-expanded` and shows its bars, and the first paint after hydration has both right.
- **The drawer** is modal by default: focus moves to its close button, Tab and Shift+Tab stay
  inside, the page doesn't scroll, the rest of the frame is inert, and Escape closes it while it's
  the topmost overlay, so a `Modal` opened from it closes first. Escape, the close button and a
  click on the backdrop hand focus back to the burger, and so does a press outside the drawer
  without `overlay`, before the press moves it to what was pressed. The close button is there for
  a touch screen reader user, who has no Escape key. It stays a navigation landmark rather than a
  dialog: the inert frame is what keeps assistive technology inside it, so keep the page's content
  inside the frame's parts.
- **A closed drawer and a collapsed column** are `visibility: hidden`, so their links are out of
  the Tab order and the accessibility tree before any script runs.
- **Reflow:** at 320 pixels wide the nav is a drawer, so nothing scrolls sideways (WCAG 1.4.10).
- **Motion:** the drawer's slide, the backdrop's fade and the column's collapse don't play under
  `prefers-reduced-motion: reduce`.
- **Forced colors:** the column keeps its divider, and the drawer gets a border on its open edge in
  place of its shadow.
- **Right to left:** the column sits on the right, and the drawer slides in from the right.

---

## Related Components

- [`Navbar`](../components/navbar.md): The header's content, with `AppFrame.Burger` in its brand.
- [`Menu`](../components/menu.md): The links in the nav.
- [`Sidebar`](../components/sidebar.md): A panel that slides out over any page, on its own.
- [`Splitter`](./splitter.md): Panes the reader resizes, inside the page.
- [`Footer`](./footer.md): Bulma's footer, with `as="div"` inside `AppFrame.Footer`.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: AppFrame Stories](https://bestax.io/storybook/?path=/story/layout-appframe--default)
- [WAI-ARIA Authoring Practices: Landmark Regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
- [Understanding WCAG 2.4.1: Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)
- [WCAG technique C43: scroll-padding under a sticky header](https://www.w3.org/WAI/WCAG22/Techniques/css/C43)

---

## Props

<!-- bestax:generated props -->

| Prop                   | Type                                                                      | Default     | Description                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `children`             | `React.ReactNode`                                                         | —           | The parts, each a direct child: `Header`, `Nav`, `Main`, `Aside` and `Footer`, in that order, since it's the Tab order. The frame reads the `id` of `Main` and `Nav` off its children for the skip link and the burger, so a part wrapped in a component of your own takes no `id` of its own. Put the frame at the top of the page, outside any `main` or sectioning element. |
| `breakpoint`           | `'tablet'` \| `'desktop'` \| `'widescreen'`                               | `'desktop'` | The width from which the nav is a column beside the page. Below it, the nav is a drawer the burger opens. The stylesheet switches the layout at Bulma's breakpoint, and the script reads the width at Bulma's default breakpoints, so a theme that moves Bulma's breakpoints moves the layout but not which state the burger toggles.                                          |
| `navOpen`              | `boolean`                                                                 | `false`     | Whether the drawer is open, below the breakpoint. With it, the state is yours: update it from `onNavOpenChange`. It has no effect from the breakpoint up, where the frame asks to close it.                                                                                                                                                                                    |
| `defaultNavOpen`       | `boolean`                                                                 | `false`     | Whether the drawer starts open.                                                                                                                                                                                                                                                                                                                                                |
| `onNavOpenChange`      | `(open: boolean) => void`                                                 | —           | Called with the state asked for: by the burger, `useAppFrame()`, Escape, a press outside, the close button, a followed link (see `AppFrame.Nav`'s `closeOnNavigate`), or the window being at or past the breakpoint while it's open, which closes it.                                                                                                                          |
| `navCollapsed`         | `boolean`                                                                 | `false`     | Whether the column is collapsed out of view, from the breakpoint up. With it, the state is yours: update it from `onNavCollapsedChange`. It has no effect below the breakpoint, where the drawer always shows the whole nav.                                                                                                                                                   |
| `defaultNavCollapsed`  | `boolean`                                                                 | `false`     | Whether the column starts collapsed.                                                                                                                                                                                                                                                                                                                                           |
| `onNavCollapsedChange` | `(collapsed: boolean) => void`                                            | —           | Called with the state asked for, by the burger or `useAppFrame()`.                                                                                                                                                                                                                                                                                                             |
| `skipLink`             | `boolean`                                                                 | `true`      | Renders a skip link first, visible when it has focus, that moves focus to `AppFrame.Main`. Turn it off only for a page that has its own.                                                                                                                                                                                                                                       |
| `labels`               | `{ skipLink?: string; nav?: string; closeNav?: string; burger?: string }` | —           | The strings the frame renders. Each one left out keeps its English default.                                                                                                                                                                                                                                                                                                    |
| `textColor`            | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`   | —           | Text color helper.                                                                                                                                                                                                                                                                                                                                                             |
| `bgColor`              | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`   | —           | Background color helper.                                                                                                                                                                                                                                                                                                                                                       |
| `className`            | `string`                                                                  | —           | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                        |
| `ref`                  | `React.Ref<HTMLDivElement>`                                               | —           | Ref forwarded to the root `<div>`.                                                                                                                                                                                                                                                                                                                                             |
| `...`                  | All standard `<div>` attributes and Bulma helper props                    | —           | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                              |

**Subcomponents:**

- `AppFrame.Header`: The top bar of an AppFrame, which sticks while the page scrolls.
- `AppFrame.Nav`: The navigation of an AppFrame: a column beside the page from the breakpoint up, and a drawer below it.
- `AppFrame.Main`: The page's main content in an AppFrame, which the skip link moves focus to.
- `AppFrame.Aside`: Content beside the page in an AppFrame, which moves under it below the breakpoint.
- `AppFrame.Footer`: The bottom of an AppFrame, under the page.
- `AppFrame.Burger`: The button that opens the drawer, or collapses the column from the breakpoint up: Navbar.Burger, wired to the frame.

### AppFrame.Header

| Prop        | Type                                                | Default | Description                                                                                                                                                                                                                  |
| ----------- | --------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `React.ReactNode`                                   | —       | Usually a `Navbar`, not `fixed`, with `AppFrame.Burger` in its `Navbar.Brand`. A header taller than Bulma's navbar sets `--bulma-app-frame-header-height` on `:root`, so the nav column, an in-page link and focus clear it. |
| `className` | `string`                                            | —       | Additional CSS classes.                                                                                                                                                                                                      |
| `ref`       | `React.Ref<HTMLElement>`                            | —       | Ref forwarded to the `<header>`.                                                                                                                                                                                             |
| `...`       | All standard HTML attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                            |

### AppFrame.Nav

| Prop                  | Type                                                | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------- | --------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`            | `React.ReactNode`                                   | —       | Usually a `Menu`. A nav taller than the window scrolls on its own. With `overlay`, the rest of the frame is inert while the drawer is open, so an overlay opened from the drawer, such as a `Modal`, goes inside the nav or renders outside the frame (Modal's `portal`).                                                                                                                                                                                                                                                                           |
| `width`               | `number` \| `string`                                | —       | The column's width, and the drawer's up to the window's width less a strip of backdrop. A number is pixels, and a string any CSS length. It writes `--bulma-app-frame-nav-width`, 16rem by default.                                                                                                                                                                                                                                                                                                                                                 |
| `overlay`             | `boolean`                                           | `true`  | Shows a backdrop behind the drawer and makes it modal: Tab stays inside, the page scroll locks, and the rest of the frame is inert, while what renders outside it, such as a Modal opened from the drawer or a toast, stays live. Without it the drawer covers the page without holding Tab, and focus can move to the page beside it. Either way focus moves in as it opens. Sidebar's `overlay`.                                                                                                                                                  |
| `closeOnEscape`       | `boolean`                                           | `true`  | Closes the drawer on Escape, while it's the topmost overlay, so Escape closes one layer at a time.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `closeOnClickOutside` | `boolean`                                           | `true`  | Closes the drawer on a press outside it while it's the topmost overlay: a click on the backdrop, or without `overlay` a press anywhere outside it. Focus goes back to the burger as it closes. Without `overlay`, the press's own mousedown then moves it, as on any page: to what was pressed if that takes focus, and otherwise off the burger to the page. A touch that scrolls leaves it on the burger. A press on a control whose `aria-controls` names the nav, such as the burger, is left to that control. Popover's `closeOnClickOutside`. |
| `closeOnNavigate`     | `boolean`                                           | `true`  | Closes the drawer when a link inside it is followed with a plain click: not with a modifier key held, and not on a link with a `target` other than `_self` or a `download`. Only a link the nav holds in the page counts, not one in a Modal or a popup it portals elsewhere. Focus goes back to the burger, and the navigation takes it from there: a router that moves focus on navigation moves it, and an in-page `#` link leaves it at its target, as it does anywhere on the page. Turn it off for a drawer of filters rather than links.     |
| `className`           | `string`                                            | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `ref`                 | `React.Ref<HTMLElement>`                            | —       | Ref forwarded to the `<nav>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `id`                  | `string`                                            | —       | The nav's id, which the burger's `aria-controls` points at. The frame makes one when there's none.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `aria-label`          | `string`                                            | —       | The nav's name. Without it or `aria-labelledby`, it's the frame's `labels.nav`, "Sections".                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `...`                 | All standard HTML attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### AppFrame.Main

| Prop        | Type                                                | Default | Description                                                                        |
| ----------- | --------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `children`  | `React.ReactNode`                                   | —       | The page. A `Container` or a `Section` inside it gives Bulma's widths and padding. |
| `className` | `string`                                            | —       | Additional CSS classes.                                                            |
| `ref`       | `React.Ref<HTMLElement>`                            | —       | Ref forwarded to the `<main>`.                                                     |
| `id`        | `string`                                            | —       | Its id, which the skip link points at. The frame makes one when there's none.      |
| `...`       | All standard HTML attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                  |

### AppFrame.Aside

| Prop        | Type                                                | Default | Description                                                                                                                                                                               |
| ----------- | --------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `React.ReactNode`                                   | —       | What sits beside the page: an outline, details, filters.                                                                                                                                  |
| `width`     | `number` \| `string`                                | —       | Its width from the breakpoint up; below it, the aside moves under the page. A number is pixels, and a string any CSS length. It writes `--bulma-app-frame-aside-width`, 20rem by default. |
| `className` | `string`                                            | —       | Additional CSS classes.                                                                                                                                                                   |
| `ref`       | `React.Ref<HTMLElement>`                            | —       | Ref forwarded to the `<aside>`.                                                                                                                                                           |
| `...`       | All standard HTML attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                         |

### AppFrame.Footer

| Prop        | Type                                                | Default | Description                                                                  |
| ----------- | --------------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| `children`  | `React.ReactNode`                                   | —       | Plain content, or bestax's `Footer` with `as="div"` for Bulma's footer look. |
| `className` | `string`                                            | —       | Additional CSS classes.                                                      |
| `ref`       | `React.Ref<HTMLElement>`                            | —       | Ref forwarded to the `<footer>`.                                             |
| `...`       | All standard HTML attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)                            |

### AppFrame.Burger

| Prop         | Type                                                                            | Default    | Description                                                                                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`  | `string`                                                                        | —          | Additional CSS classes.                                                                                                                                                                                                                |
| `textColor`  | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —          | Text color for the burger.                                                                                                                                                                                                             |
| `color`      | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —          | Renders `has-text-<color>`, exactly like `textColor`. Bulma has no `.navbar-burger.is-<color>` rule, so this is not a filled variant. `textColor` takes precedence when both are set, and is the one that reaches the full color list. |
| `children`   | `React.ReactNode`                                                               | —          | Custom content inside the burger, rendered after its four bar spans. Bulma styles every `<span>` in the burger as a bar, so an extra span here draws an extra bar.                                                                     |
| `aria-label` | `string`                                                                        | `'menu'`   | Accessible name. Pass your own to replace it. An empty one, or a spread carrying `'aria-label': undefined`, keeps the default rather than leaving the button unnamed.                                                                  |
| `onClick`    | `React.MouseEventHandler<HTMLButtonElement>`                                    | —          | Click handler.                                                                                                                                                                                                                         |
| `ref`        | `React.Ref<HTMLButtonElement>`                                                  | —          | Ref forwarded to the burger button element.                                                                                                                                                                                            |
| `type`       | `'button'` \| `'submit'` \| `'reset'`                                           | `'button'` | Button type. Defaults to `'button'`, so a burger inside a form does not submit it. Pass `'submit'` or `'reset'` and yours is used; any other value, or a spread carrying `type: undefined`, renders `'button'`.                        |
| `...`        | All standard `<button>` attributes and Bulma helper props                       | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                      |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`AppFrame` registers these variables on its own `.app-frame` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                             | Sass Variable                     | Default                                                                                  |
| ---------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| `--bulma-app-frame-header-height` §      | `$app-frame-header-height`        | `var(--bulma-navbar-height)`                                                             |
| `--bulma-app-frame-header-background`    | `$app-frame-header-background`    | `var(--bulma-scheme-main)`                                                               |
| `--bulma-app-frame-nav-width`            | `$app-frame-nav-width`            | `16rem`                                                                                  |
| `--bulma-app-frame-nav-padding`          | `$app-frame-nav-padding`          | `0.75rem`                                                                                |
| `--bulma-app-frame-nav-background`       | `$app-frame-nav-background`       | `var(--bulma-scheme-main)`                                                               |
| `--bulma-app-frame-aside-width`          | `$app-frame-aside-width`          | `20rem`                                                                                  |
| `--bulma-app-frame-border-color`         | `$app-frame-border-color`         | `var(--bulma-border)`                                                                    |
| `--bulma-app-frame-border-width`         | `$app-frame-border-width`         | `1px`                                                                                    |
| `--bulma-app-frame-backdrop-background`  | `$app-frame-backdrop-background`  | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.86)` |
| `--bulma-app-frame-drawer-shadow`        | `$app-frame-drawer-shadow`        | `var(--bulma-shadow)`                                                                    |
| `--bulma-app-frame-transition-duration`  | `$app-frame-transition-duration`  | `var(--bulma-duration)`                                                                  |
| `--bulma-app-frame-skip-link-background` | `$app-frame-skip-link-background` | `var(--bulma-scheme-main)`                                                               |
| `--bulma-app-frame-skip-link-color`      | `$app-frame-skip-link-color`      | `var(--bulma-link)`                                                                      |

§ declared globally, on `:root`, rather than on the element: set it on the element itself (via `className`/`style`) or on any ancestor, up to `:root` to retheme every instance.

<!-- /bestax:generated cssvars -->
