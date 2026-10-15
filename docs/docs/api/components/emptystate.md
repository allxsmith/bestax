---
title: EmptyState
sidebar_label: EmptyState
description: 'The `EmptyState` component renders the block an app shows where content would be: an empty list, a search with no results, or a first-run screen.'
---

# EmptyState

## Overview

<!-- bestax:generated overview -->

The `EmptyState` component renders the block an app shows where content would be: an empty list, a search with no results, or a first-run screen.

<!-- /bestax:generated overview -->

Reach for it wherever a list, a table or a page has nothing to show yet: "No projects yet" with a
button to make one, a search that matched nothing with a way to clear it, an empty Card or Panel,
or a first-run screen. It's a column of a picture in a soft circle, a heading, a line of text and
the actions, with one layout whether you write it with the `icon`, `title` and `description`
props or with the parts.

The title is always a real heading, an `h2` unless you say otherwise, so a screen reader user can
jump to it. The picture is decoration and hidden from assistive tech. The children render exactly
as you write them, after the parts the props render.

:::info
Bulma has no empty state, so `EmptyState` brings its own styles, in `bestax.css` and its variants,
or in `extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { EmptyState } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it an `icon`, a `title` and a `description`, and put the one button it needs straight in as a
child. The button sits centered under the text at its own width.

```tsx live
<Box>
  <EmptyState
    icon="folder-open"
    title="No projects yet"
    description="Projects you create or join show up here."
  >
    <Button color="primary">New project</Button>
  </EmptyState>
</Box>
```

A string `icon` is an `Icon` name, drawn from the icon library `ConfigProvider` sets. Anything else
renders as it is, so an `<Icon>` with its own `library` or `variant`, an SVG or an `<img>` all
work. Leave out any of the three props and its part isn't rendered, with no gap left behind.

### More Than One Action

Two or more buttons go in `EmptyState.Actions`, which lays them out in a row and keeps the row
centered when it wraps. Loose, they'd stack.

```tsx live
<Box>
  <EmptyState
    icon="folder-open"
    title="No projects yet"
    description="Projects you create or join show up here."
  >
    <EmptyState.Actions>
      <Button color="primary">New project</Button>
      <Button>Import</Button>
    </EmptyState.Actions>
  </EmptyState>
</Box>
```

`EmptyState.Actions` is a `Buttons` row, so `size` and `hasAddons` work on it. The EmptyState
aligns it, so it doesn't take `isCentered` or `isRight`.

### Sizes

`size` scales the circle, the title, the description and the spacing together. It's `normal` by
default, with `small` for a Card or a table cell and `large` for a first-run screen. Here they run
from `small` to `large`, left to right.

```tsx live
<Columns isMultiline>
  {(['small', 'normal', 'medium', 'large'] as const).map(size => (
    <Column key={size} size="half" display="flex" flexDirection="column">
      <Box
        flexGrow="1"
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <EmptyState
          size={size}
          icon="inbox"
          title="No messages"
          description="Messages people send you show up here."
        >
          <Button>Write a message</Button>
        </EmptyState>
      </Box>
    </Column>
  ))}
</Columns>
```

A size is a set of the `--bulma-empty-state-*` variables under
[CSS & Sass Variables](#css--sass-variables), so you can retune one by setting them on the
`.empty-state.is-small`, `.is-medium` or `.is-large` class. The size never changes the title's
heading level.

### Colors

The circle is neutral by default, since an empty list isn't a status. `color` takes one of Bulma's
six colors, and it colors the circle and its icon, never the text.

```tsx live
<Columns isMultiline>
  <Column size="one-third">
    <Box>
      <EmptyState
        size="small"
        color="primary"
        icon="folder-open"
        title="No projects yet"
      />
    </Box>
  </Column>
  <Column size="one-third">
    <Box>
      <EmptyState
        size="small"
        color="link"
        icon="bookmark"
        title="No bookmarks yet"
      />
    </Box>
  </Column>
  <Column size="one-third">
    <Box>
      <EmptyState
        size="small"
        color="info"
        icon="upload"
        title="Nothing uploaded yet"
      />
    </Box>
  </Column>
  <Column size="one-third">
    <Box>
      <EmptyState size="small" color="success" icon="check" title="All done" />
    </Box>
  </Column>
  <Column size="one-third">
    <Box>
      <EmptyState
        size="small"
        color="warning"
        icon="box-archive"
        title="No backups yet"
      />
    </Box>
  </Column>
  <Column size="one-third">
    <Box>
      <EmptyState
        size="small"
        color="danger"
        icon="trash"
        title="The trash is empty"
      />
    </Box>
  </Column>
</Columns>
```

### Variants

`variant="light"`, the default, is a soft tint of the color behind the icon in the color, the pair
Bulma's soft buttons use. `filled` is the color itself, with the icon in its invert. Both follow
dark mode with no rules of their own, and so does the neutral circle.

```tsx live
<Columns>
  <Column>
    <Box>
      <EmptyState size="small" icon="bell" title="No alerts" />
    </Box>
  </Column>
  <Column>
    <Box>
      <EmptyState size="small" variant="filled" icon="bell" title="No alerts" />
    </Box>
  </Column>
  <Column>
    <Box>
      <EmptyState size="small" color="success" icon="check" title="All done" />
    </Box>
  </Column>
  <Column>
    <Box>
      <EmptyState
        size="small"
        color="success"
        variant="filled"
        icon="check"
        title="All done"
      />
    </Box>
  </Column>
</Columns>
```

### Alignment

`align="left"` puts the circle beside the text, with the title, the description and the actions
stacked next to it. Like Bulma's own `is-left`, it means the start of the line, so the circle moves
to the right in a right-to-left page.

```tsx live
<Box>
  <EmptyState
    align="left"
    color="primary"
    icon="users"
    title="No one else is here yet"
    description="Invite the people you work with, and they'll show up in this list."
  >
    <EmptyState.Actions>
      <Button color="primary">Invite people</Button>
      <Button>Copy invite link</Button>
    </EmptyState.Actions>
  </EmptyState>
</Box>
```

In `left`, the padding at the start of the line is what makes room for the circle, so adjust the
padding with `py` rather than `p` or `px`.

### In a Card

`EmptyState` has some padding of its own and no border or background, so it goes inside whatever
holds the list: a `Box`, a `Card`, a `Panel`, or a table cell that spans the columns. Pick the
heading level under the list's own heading, here an `h3`.

```tsx live
<Columns>
  <Column>
    <Card header="Invoices">
      <EmptyState
        size="small"
        align="left"
        color="success"
        variant="filled"
        icon="check"
        title="All paid up"
        titleAs="h3"
        description="New invoices show up here when they arrive."
      />
    </Card>
  </Column>
  <Column>
    <Card header="Files">
      <EmptyState
        size="small"
        icon="cloud-arrow-up"
        title="Nothing uploaded yet"
        titleAs="h3"
        description="Files you add to this project show up here."
      >
        <Button size="small" color="info">
          Upload files
        </Button>
      </EmptyState>
    </Card>
  </Column>
</Columns>
```

### A Search With No Results

An empty state after a search is the list's replacement, and it can't announce itself: it arrives
already filled, and it's gone when results come back. So keep a `role="status"` region next to the
search field the whole time, saying the count, and change its text when the results change. A
"Clear search" button goes away with the empty state when it works, so put focus back in the field
when it's clicked.

This one starts with a search that matches nothing. Clear it, or type a project's name.

```tsx live
function example() {
  const projects = ['Apollo', 'Gemini', 'Mercury'];
  const [query, setQuery] = useState('kraken');
  const searchRef = React.useRef<HTMLInputElement>(null);
  const term = query.trim().toLowerCase();
  const shown = projects.filter(name => name.toLowerCase().includes(term));

  function clear() {
    setQuery('');
    // The button goes away with the empty state, so focus goes back to the field.
    searchRef.current?.focus();
  }

  return (
    <Box>
      <Title as="h2" textSize="5">
        Projects
      </Title>
      <Field label="Search projects">
        <Control>
          <Input
            ref={searchRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </Control>
      </Field>
      {/* Always in the page, so a change to its text is announced. */}
      <Paragraph role="status" aria-atomic="true" visibility="sr-only">
        {shown.length === 0
          ? 'No projects match the search'
          : `${shown.length} of ${projects.length} projects`}
      </Paragraph>
      {shown.length === 0 ? (
        <EmptyState
          icon="magnifying-glass"
          title={`No projects match “${query}”`}
          titleAs="h3"
          description="Check the spelling, or clear the search."
        >
          <Button onClick={clear}>Clear search</Button>
        </EmptyState>
      ) : (
        <UnorderedList>
          {shown.map(name => (
            <ListItem key={name}>{name}</ListItem>
          ))}
        </UnorderedList>
      )}
    </Box>
  );
}
```

### A First-Run Screen

On a page that's mostly empty, a `large` one in a `Hero` fills the space. The title here is the
page's `h1`.

```tsx live
<Hero color="primary">
  <Hero.Body>
    <EmptyState
      size="large"
      icon="rocket"
      title="Welcome to your workspace"
      titleAs="h1"
      description="Make a project to get started. You can invite people once it's set up."
    >
      <Button color="primary" isInverted>
        Make a project
      </Button>
    </EmptyState>
  </Hero.Body>
</Hero>
```

The description takes the color of the text around it, so it reads on the Hero's color as well as
on the page.

### Compound (dot-notation) usage

For anything the props can't say, write the parts: `EmptyState.Indicator`, `EmptyState.Title`,
`EmptyState.Description` and `EmptyState.Actions`, in the order they're shown. Here that's a
regular-style icon and a list of suggestions between the description and the actions. Each part is
also exported by name (`EmptyStateIndicator`, `EmptyStateTitle`, `EmptyStateDescription` and
`EmptyStateActions`).

```tsx live
<Box>
  <EmptyState align="left" color="warning">
    <EmptyState.Indicator>
      <Icon name="star" variant="regular" />
    </EmptyState.Indicator>
    <EmptyState.Title as="h3">No favorites yet</EmptyState.Title>
    <EmptyState.Description>
      Star a project to keep it here. A few to start with:
    </EmptyState.Description>
    <UnorderedList>
      <ListItem>
        <a href="#apollo">Apollo</a>
      </ListItem>
      <ListItem>
        <a href="#gemini">Gemini</a>
      </ListItem>
    </UnorderedList>
    <EmptyState.Actions size="small">
      <Button color="warning">Browse projects</Button>
      <Button>Not now</Button>
    </EmptyState.Actions>
  </EmptyState>
</Box>
```

Nothing is reordered: in `center` each part shows where you write it. In `left` the indicator comes
out of the flow and sits at the start of the line, wherever it's written.

---

## Accessibility

- **The title is a heading:** it's always one, `h1` to `h6`, and `h2` by default. Pick the level
  under the heading of the list it stands in for: an `h2` on a page, an `h3` or an `h4` in a Card.
  `titleAs` sets it for the `title` prop and `as` sets it on `EmptyState.Title`, and nothing about
  the size changes it. The size comes from the EmptyState, so `EmptyState.Title` doesn't take
  `Title`'s `size`.
- **The picture is decoration:** the indicator has `aria-hidden="true"`, so everything in it is
  hidden, an `Icon` with an `ariaLabel` included. Say what it means in the title or the
  description.
- **No role and no live region:** an empty state is content, and the heading makes it findable. It
  doesn't announce itself, since it arrives already filled, would read its buttons along with it,
  and is gone when results come back. After a search or a filter, announce the result with a
  `role="status"` region that's in the page the whole time, beside the search field, as in
  [A Search With No Results](#a-search-with-no-results). Primer's
  [loading pattern](https://primer.style/product/ui-patterns/loading/) describes the same thing.
- **Focus:** nothing in the component moves focus. A "Clear search" button goes away with the
  empty state, so its click handler puts focus back in the search field rather than leaving it on
  the page's `<body>`.
- **Not for loading or errors:** while the data loads, show a [`Skeleton`](../elements/skeleton.md)
  or a [`Loader`](../elements/loader.md), so "No projects yet" doesn't flash before the projects
  arrive. A load that failed is a [`Message`](./message.md) or a
  [`Notification`](../elements/notification.md).
- **Contrast:** the description is the color of the text around it, so it keeps the contrast its
  container has, a colored Hero included, and the title is Bulma's title color. The circle is
  decoration, so it doesn't owe a contrast ratio, but every pairing reads in light and dark mode.
- **Forced colors:** in Windows high contrast mode the icon takes the system's text color and
  stays visible. The circle's fill drops out, since it's decoration.
- **No motion:** nothing animates.

---

## Related Components

- [`Title`](../elements/title.md): The heading `EmptyState.Title` renders.
- [`Icon`](../elements/icon.md): What a string `icon` renders, and the usual picture in the circle.
- [`Buttons`](../elements/buttons.md): The row `EmptyState.Actions` renders.
- [`Skeleton`](../elements/skeleton.md): For content that's still loading.
- [`Loader`](../elements/loader.md): A spinner for a load in progress.
- [`Message`](./message.md): For a load that failed.
- [`Media`](../layout/media.md): A picture beside a block of text, for content that isn't an empty
  state.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: EmptyState Stories](https://bestax.io/storybook/?path=/story/components-emptystate--default)
- [WCAG 2.2, Understanding Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
- [W3C: Decorative images](https://www.w3.org/WAI/tutorials/images/decorative/)

---

## Props

<!-- bestax:generated props -->

| Prop          | Type                                                                            | Default    | Description                                                                                                                                                                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`   | `string`                                                                        | —          | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                    |
| `icon`        | `React.ReactNode`                                                               | —          | The picture in the indicator's circle. A string is an `Icon` name, drawn from the icon library `ConfigProvider` sets. Anything else (an `<Icon>` with its own `variant` or `library`, an SVG, an `<img>`) renders as it is. It's decorative and hidden from assistive tech, so the title says what it means.                                        |
| `title`       | `React.ReactNode`                                                               | —          | The heading, rendered as `EmptyState.Title`. It's always a real heading, at the level `titleAs` sets.                                                                                                                                                                                                                                               |
| `titleAs`     | `'h1'` \| `'h2'` \| `'h3'` \| `'h4'` \| `'h5'` \| `'h6'`                        | `'h2'`     | The heading level for `title`: the level under the heading of the list it stands in for, such as `h3` for a list under an `h2`. Only this sets the level, and the size comes from `size`.                                                                                                                                                           |
| `description` | `React.ReactNode`                                                               | —          | A sentence or two under the title, rendered as `EmptyState.Description`.                                                                                                                                                                                                                                                                            |
| `children`    | `React.ReactNode`                                                               | —          | Rendered as written, after whatever `icon`, `title` and `description` render. One button can go straight in, and it sits centered under the text. Group two or more in `EmptyState.Actions`, or they stack. Without the props, write the parts here in the order they're shown: `EmptyState.Indicator`, `.Title`, `.Description`, then the actions. |
| `color`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —          | The indicator's color. It colors the circle and its icon, not the text. Without it the circle is neutral, since an empty list isn't a status.                                                                                                                                                                                                       |
| `variant`     | `'light'` \| `'filled'`                                                         | `'light'`  | `light` is a soft tint of `color` behind the icon in the color. `filled` is the color itself, with the icon in its invert.                                                                                                                                                                                                                          |
| `size`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                              | `'normal'` | Sizes the indicator, the title, the description and the spacing together.                                                                                                                                                                                                                                                                           |
| `align`       | `'center'` \| `'left'`                                                          | `'center'` | `center` stacks everything in a centered column. `left` puts the indicator beside the text, at the start of the line, so on the right in a right-to-left page. In `left`, the padding at the start of the line is what makes room for the indicator, so pad it with `py` rather than `p` or `px`.                                                   |
| `textColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —          | Text color helper.                                                                                                                                                                                                                                                                                                                                  |
| `bgColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —          | Background color helper.                                                                                                                                                                                                                                                                                                                            |
| `ref`         | `React.Ref<HTMLDivElement>`                                                     | —          | Ref forwarded to the root `<div>`.                                                                                                                                                                                                                                                                                                                  |
| `...`         | All standard `<div>` attributes and Bulma helper props                          | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                   |

**Subcomponents:**

- `EmptyState.Indicator`: The circle the picture sits in, hidden from assistive tech whatever is in it.
- `EmptyState.Title`: The heading, a Bulma `Title` at the level `as` sets, `h2` by default, and at the EmptyState's size.
- `EmptyState.Description`: A sentence or two under the title, in the color of the text around it.
- `EmptyState.Actions`: A row of buttons, centered under the text or at the start of the line beside the indicator.

### EmptyState.Indicator

| Prop        | Type                                                                    | Default | Description                                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                                                              |
| `children`  | `React.ReactNode`                                                       | —       | The picture: an `Icon`, an SVG or an `<img>`. The indicator is hidden from assistive tech, an `Icon` with an `ariaLabel` included, so anything it means goes in the title or the description. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                                                                            |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                                                                      |
| `...`       | All standard `<div>` attributes and Bulma helper props                  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                             |

### EmptyState.Title

| Prop          | Type                                                                    | Default | Description                                                                               |
| ------------- | ----------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `as`          | `'h1'` \| `'h2'` \| `'h3'` \| `'h4'` \| `'h5'` \| `'h6'`                | `'h2'`  | The heading level: the level under the heading of the list the empty state stands in for. |
| `className`   | `string`                                                                | —       | Additional CSS classes to apply.                                                          |
| `hasSkeleton` | `boolean`                                                               | `false` | Applies the `has-skeleton` class to part of the content.                                  |
| `children`    | `React.ReactNode`                                                       | —       | Title content.                                                                            |
| `textColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                        |
| `bgColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                  |
| `skeleton`    | `boolean`                                                               | —       | Applies the `is-skeleton` class to the entire component.                                  |
| `...`         | All standard `<h1>`–`<h6>` / `<p>` attributes and Bulma helper props    | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                         |

### EmptyState.Description

| Prop        | Type                                                                    | Default | Description                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                  |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                          |
| `children`  | `React.ReactNode`                                                       | —       | Content to render inside the paragraph.           |
| `...`       | All standard `<p>` attributes and Bulma helper props                    | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

### EmptyState.Actions

| Prop        | Type                                                                            | Default | Description                                                                                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `className` | `string`                                                                        | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                               |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Text color helper for the button group.                                                                                                                                                                                                                                        |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —       | Text color alias: renders `has-text-<color>`, exactly like `textColor`. Not a filled variant (no `.buttons.is-<color>` CSS exists; color the individual `Button`s instead). Prefer `textColor`, which takes precedence when both are set; use `bgColor` for a colored surface. |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —       | Background color helper for the button group.                                                                                                                                                                                                                                  |
| `hasAddons` | `boolean`                                                                       | `false` | Group buttons together as addons (removes spacing between them).                                                                                                                                                                                                               |
| `size`      | `'small'` \| `'medium'` \| `'large'`                                            | —       | Size of the button group.                                                                                                                                                                                                                                                      |
| `children`  | `React.ReactNode`                                                               | —       | The button elements to render inside the group.                                                                                                                                                                                                                                |
| `...`       | All standard `<div>` attributes and Bulma helper props                          | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                              |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`EmptyState` registers these variables on its own `.empty-state` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                                | Sass Variable                        | Default                       |
| ------------------------------------------- | ------------------------------------ | ----------------------------- |
| `--bulma-empty-state-gap`                   | `$empty-state-gap`                   | `1rem`                        |
| `--bulma-empty-state-padding`               | `$empty-state-padding`               | `3rem`                        |
| `--bulma-empty-state-indicator-size`        | `$empty-state-indicator-size`        | `3rem`                        |
| `--bulma-empty-state-indicator-radius`      | `$empty-state-indicator-radius`      | `var(--bulma-radius-rounded)` |
| `--bulma-empty-state-indicator-background`  | `$empty-state-indicator-background`  | `var(--bulma-background)`     |
| `--bulma-empty-state-indicator-color`       | `$empty-state-indicator-color`       | `var(--bulma-text-weak)`      |
| `--bulma-empty-state-icon-size`             | `$empty-state-icon-size`             | `1.5rem`                      |
| `--bulma-empty-state-title-size`            | `$empty-state-title-size`            | `var(--bulma-size-5)`         |
| `--bulma-empty-state-description-size`      | `$empty-state-description-size`      | `var(--bulma-size-6)`         |
| `--bulma-empty-state-description-color`     | `$empty-state-description-color`     | `currentColor`                |
| `--bulma-empty-state-description-max-width` | `$empty-state-description-max-width` | `32em`                        |

<!-- /bestax:generated cssvars -->
