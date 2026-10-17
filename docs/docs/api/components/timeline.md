---
title: Timeline
sidebar_label: Timeline
description: The `Timeline` component renders a list of events in the order they happened, each with a marker on a line down the side.
---

# Timeline

## Overview

<!-- bestax:generated overview -->
<!-- /bestax:generated overview -->

Reach for it for a record of what happened, in order: an order's history, who did what on a
support ticket, a changelog, an activity feed on a dashboard, or a company's milestones. Each event
has a title, a time and whatever else you want to say about it, and a marker on the rail beside it.

By default it's a record and marks nothing. With `active` it marks progress, for something that
moves along on its own and is reported to the user, like a parcel on its way or a deployment
rolling out. A journey the user takes themselves, like a wizard or a checkout, is
[`Steps`](./steps.md).

It's an ordered list, each title is a real heading, and the states are read out as words as well
as drawn as shapes, so no state is told by color alone.

:::info
Bulma has no timeline, so `Timeline` brings its own styles, in `bestax.css` and its variants, or in
`extras.css` next to your own Bulma. Its class names are the ones the old `bulma-timeline`
extension used. That extension doesn't theme with Bulma v1, so if a page still loads its CSS,
remove it, or both stylesheets style the same classes.
:::

---

## Import

<!-- bestax:generated import -->
<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Put a `Timeline.Item` in for each event, with a `title`, a `time` and a `dateTime`, and anything
else about it as children. Here's an order's history, newest first, under the page's own `h2`, so
the titles are `h3`s.

```tsx live
<>
  <Title as="h2" textSize="5">
    Order history
  </Title>
  <Timeline titleAs="h3">
    <Timeline.Item
      title="Delivered"
      time="16 October 2026, 11:40"
      dateTime="2026-10-16T11:40"
      color="success"
    >
      Signed for by A. Smith.
    </Timeline.Item>
    <Timeline.Item
      title="Shipped"
      time="14 October 2026, 08:12"
      dateTime="2026-10-14T08:12"
    >
      <Paragraph>
        Tracking number <Link href="#track">1Z999AA10123456784</Link>
      </Paragraph>
    </Timeline.Item>
    <Timeline.Item
      title="Order placed"
      time="12 October 2026, 09:30"
      dateTime="2026-10-12T09:30"
    />
  </Timeline>
</>
```

`time` is what the reader sees, so put the whole date in the words: screen readers mostly read the
text. `dateTime` is the same moment for machines, and with it the time renders in a `<time>`.
Formatting the date is up to your app, which knows its locale. The timeline renders the items in
the order you write them, so newest first is just the order you put them in.

### Progress

`active` marks progress. The item at that index, counting from 0, is current, the ones before it
are completed, and the ones after it are upcoming. `pending` adds one more item after the children,
for what's under way. A progress timeline reads oldest first and ends at the current or the pending
item.

```tsx live
<Timeline titleAs="h3" active={2} pending="Out for delivery">
  <Timeline.Item
    title="Order placed"
    time="12 October, 09:30"
    dateTime="2026-10-12T09:30"
  />
  <Timeline.Item
    title="Packed"
    time="13 October, 14:05"
    dateTime="2026-10-13T14:05"
  />
  <Timeline.Item
    title="Shipped"
    time="14 October, 08:12"
    dateTime="2026-10-14T08:12"
  >
    Left the warehouse in Leeds.
  </Timeline.Item>
</Timeline>
```

A completed item is a solid dot, the current one a dot with a ring around it, an upcoming one an
empty ring, and the pending one an open ring, Bulma's loader, with a dashed line leading to it. The
line is filled up to the current item. `active={-1}` marks every item upcoming, and an index past
the last marks them all completed.

Each child counts as one item, with Fragments and arrays opened up, so `.map()` works as you'd
expect. A component of your own around a `Timeline.Item` still gets its state, but a component that
renders nothing still counts, so render one item per child.

### End

`align="end"` puts the rail at the end of the line, with the text against it.

```tsx live
<Timeline titleAs="h3" align="end" active={1} pending="Out for delivery">
  <Timeline.Item title="Order placed" time="12 October" dateTime="2026-10-12" />
  <Timeline.Item title="Shipped" time="14 October" dateTime="2026-10-14" />
</Timeline>
```

### Alternate

`align="alternate"` runs the rail down the middle, with the items taking turns on each side and
each time across the rail from its title. Below Bulma's tablet breakpoint it's the same as `start`,
with the time back under the title. Nothing moves up or down, so the reading order is the order on
screen. In a narrow column on a wide screen, use `start` instead.

```tsx live
<Timeline titleAs="h3" align="alternate" color="primary">
  <Timeline.Item
    title="Founded"
    time="March 2019"
    dateTime="2019-03"
    icon="flag"
  >
    Two people and a spare room.
  </Timeline.Item>
  <Timeline.Item
    title="First office"
    time="June 2021"
    dateTime="2021-06"
    icon="building"
  >
    Twelve of us, in Leeds.
  </Timeline.Item>
  <Timeline.Item
    title="The mobile app"
    time="October 2026"
    dateTime="2026-10"
    icon={<Icon name="mobile" variant="solid" />}
    color="info"
  />
</Timeline>
```

### Icon Markers

`icon` puts a picture in the marker. A string is an `Icon` name, drawn from the icon library
`ConfigProvider` sets, and anything else renders as it is. One icon marker widens the rail for every
item, so the text still lines up. In a progress timeline, a reached icon marker is tinted with the
progress color.

```tsx live
<Timeline titleAs="h3" active={2}>
  <Timeline.Item title="Order placed" time="12 October" icon="check" />
  <Timeline.Item title="Packed" time="13 October" icon="box" />
  <Timeline.Item title="Shipped" time="14 October" icon="truck" />
  <Timeline.Item title="Delivered" time="Expected 16 October" icon="house" />
</Timeline>
```

The marker is decoration and hidden from assistive tech, so an icon says nothing to a screen reader.
Say what it means in the title.

### Colors

`color` on the timeline colors the markers, and the progress with `active`. On an item it colors
that item's marker, over the timeline's. Without one, the markers are neutral and progress is
Bulma's `link`. A color is only seen, so say what it means in the words too.

```tsx live
<Timeline titleAs="h3" color="primary">
  <Timeline.Item title="Deployed" time="10:42" color="success">
    All checks passed.
  </Timeline.Item>
  <Timeline.Item title="Rolled back" time="10:15" color="danger">
    The health check failed.
  </Timeline.Item>
  <Timeline.Item title="Started" time="10:02" />
</Timeline>
```

In a colored `Notification`, the titles and the times take the Notification's own text color, the
way Bulma's titles do there. The markers keep theirs, so on a background in the progress color,
give the timeline a `color` that stands out from it.

### A Busy Feed

In an activity feed, a heading per row would crowd the page's outline, so `titleAs="p"` makes the
titles plain lines. Everything is sized in `em`, so `textSize` scales the text, the markers, the
rail and the gaps together.

```tsx live
<Card header="Activity">
  <Timeline titleAs="p" textSize="7" align="end">
    <Timeline.Item
      title="Sam merged #42"
      time="2 minutes ago"
      dateTime="2026-10-16T14:58Z"
    />
    <Timeline.Item
      title="Ana approved #42"
      time="1 hour ago"
      dateTime="2026-10-16T14:00Z"
    />
    <Timeline.Item
      title="Sam opened #42"
      time="Yesterday"
      dateTime="2026-10-15T09:12Z"
    />
  </Timeline>
</Card>
```

### In Your App's Language

The words read after each title are props, so they can be in your app's language.

```tsx live
<Timeline
  titleAs="h3"
  active={1}
  pending="En livraison"
  completedLabel="terminé"
  upcomingLabel="à venir"
  pendingLabel="en cours"
>
  <Timeline.Item title="Commande passée" />
  <Timeline.Item title="Expédiée" />
</Timeline>
```

### A Timeline That Changes

A timeline announces nothing when it changes. If yours moves along on screen, keep a `role="status"`
region beside it, in the page from the start, and change its text when the timeline changes.

```tsx live
function example() {
  const stages = ['Order placed', 'Packed', 'Shipped', 'Delivered'];
  const [reached, setReached] = useState(1);
  const done = reached >= stages.length;

  return (
    <Box>
      <Title as="h2" textSize="5">
        Your order
      </Title>
      {/* Always in the page, so a change to its text is announced. */}
      <Paragraph role="status" aria-atomic="true" visibility="sr-only">
        {done ? 'Delivered' : `Now: ${stages[reached]}`}
      </Paragraph>
      <Timeline titleAs="h3" active={reached}>
        {stages.map(stage => (
          <Timeline.Item key={stage} title={stage} />
        ))}
      </Timeline>
      <Button
        onClick={() => setReached(n => Math.min(n + 1, stages.length))}
        disabled={done}
      >
        Next stage
      </Button>
    </Box>
  );
}
```

### Compound (dot-notation) usage

`Timeline.Item` is the one part, and it's also exported by name as `TimelineItem`. Its children
render as written, under the title and the time, so an item can hold paragraphs, links or buttons.
It gets its state from the timeline it's in, so it can sit inside a component of your own.

```tsx live
function example() {
  function Stage({
    name,
    icon,
    children,
  }: {
    name: string;
    icon: string;
    children?: React.ReactNode;
  }) {
    return (
      <Timeline.Item title={name} icon={icon}>
        {children}
      </Timeline.Item>
    );
  }

  return (
    <Timeline titleAs="h3" active={1} color="success">
      <Stage name="Build" icon="hammer">
        <Paragraph>All tests passed.</Paragraph>
      </Stage>
      <Stage name="Deploy to staging" icon="server">
        <Paragraph>
          Rolling out. <Link href="#logs">See the logs</Link>
        </Paragraph>
      </Stage>
      <Stage name="Deploy to production" icon="globe" />
    </Timeline>
  );
}
```

---

## Accessibility

- **A list:** it's an `<ol>`, since a timeline's order is its meaning, with `role="list"`. Safari
  stops treating a list as one once its numbers are hidden, and the role keeps it a list there, so
  a screen reader says how many events there are and where each one is.
- **Headings:** each title is a heading, `h2` unless `titleAs` says otherwise, so screen reader
  users can move from event to event. Pick the level under the heading the timeline sits beneath:
  an `h3` under an `h2`. In a busy feed, `titleAs="p"` makes them plain lines.
- **States in words and shapes:** the current item has `aria-current="step"`. A completed item's
  title ends with "completed", an upcoming one's with "upcoming", and the pending one's with "in
  progress", in visually hidden text, so its heading reads "Packed completed". Set the words in
  your app's language with `completedLabel`, `upcomingLabel` and `pendingLabel`. Each state has a
  shape of its own as well as a color.
- **Decoration:** the markers are hidden from assistive tech, an `Icon` with an `ariaLabel`
  included, and the line is drawn by CSS. Say what a color or an icon means in the title.
- **The time:** a screen reader mostly reads the text, so the time's words carry the whole date.
  `dateTime` puts the same moment in a `<time datetime>` for machines, and for the readers that
  speak it.
- **Motion:** the pending ring turns, and stands still for users who ask for less motion. Its open
  shape is the cue either way.
- **Forced colors:** every line, dot, ring and halo is a border or an outline, so in Windows high
  contrast mode they keep their shapes, and the pending ring stays open.
- **Not interactive and not live:** it has no tab stop and no keys, and links or buttons in an
  item work as they do anywhere. It announces nothing when it changes, so keep a status region
  beside one that changes on screen, as in [A Timeline That Changes](#a-timeline-that-changes).
- **A record first:** design systems with user research behind them, the UK's
  [MOJ](https://design-patterns.service.justice.gov.uk/components/timeline/) and
  [HMRC](https://design.tax.service.gov.uk/hmrc-design-patterns/timeline/), use a timeline for a
  record and advise against using one as a progress indicator. That's why a record is the default.
  `active` is for something that moves on its own and is only reported to the user. For a journey
  the user moves through, where they may go back, use [`Steps`](./steps.md).

---

## Related Components

- [`Steps`](./steps.md): For a journey the user moves through, like a wizard or a checkout.
- [`Card`](./card.md): A home for an activity feed.
- [`Icon`](../elements/icon.md): What a string `icon` renders in the marker.
- [`Title`](../elements/title.md): For the heading the timeline sits beneath.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Timeline Stories](https://bestax.io/storybook/?path=/story/components-timeline--default)
- [MDN: The ordered list element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ol)
- [MDN: The time element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time)
- [MDN: aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current)

---

## Props

<!-- bestax:generated props -->
<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->
<!-- /bestax:generated cssvars -->
