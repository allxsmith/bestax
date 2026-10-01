---
title: Collapses
sidebar_label: Collapses
description: The `Collapses` component groups `Collapse` items into an accordion that keeps one item open at a time, or any number with `multiple`.
---

# Collapses

## Overview

<!-- bestax:generated overview -->

The `Collapses` component groups `Collapse` items into an accordion that keeps one item open at a time, or any number with `multiple`.

<!-- /bestax:generated overview -->

Each child `Collapse` is an item, addressed by its index from 0. The group decides which items
are open, the way [`Tabs`](./tabs.md) decides which tab is active: `value`, `defaultValue` and
`onChange`, controlled or not. It follows the library's sibling plural container convention
([`Avatars`](./avatars.md), [`Tags`](../elements/tags.md), [`Buttons`](../elements/buttons.md)).

---

## Import

<!-- bestax:generated import -->

```tsx
import { Collapses, Collapse } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Accordion

Without `multiple`, opening one item closes the others. `defaultValue` is the index of the item
that starts open; leave it out to start with every item closed.

```tsx live
<Collapses defaultValue={0}>
  <Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Shipping</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Orders leave the warehouse within two business days.
    </Paragraph>
  </Collapse>
  <Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Returns</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Send anything back within 30 days for a full refund.
    </Paragraph>
  </Collapse>
  <Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Warranty</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Every product carries a one-year warranty against defects.
    </Paragraph>
  </Collapse>
</Collapses>
```

### Multiple Open Items

With `multiple`, items open and close independently, and the open items are an array of
indexes.

```tsx live
<Collapses multiple defaultValue={[0, 2]}>
  <Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Shipping</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Orders leave the warehouse within two business days.
    </Paragraph>
  </Collapse>
  <Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Returns</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Send anything back within 30 days for a full refund.
    </Paragraph>
  </Collapse>
  <Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Warranty</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Every product carries a one-year warranty against defects.
    </Paragraph>
  </Collapse>
</Collapses>
```

### Seamless

`seamless` joins the items into one block, with no gap between them and only the outer corners
rounded. The joins show on `bordered` items.

```tsx live
<Collapses seamless defaultValue={1}>
  <Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Shipping</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Orders leave the warehouse within two business days.
    </Paragraph>
  </Collapse>
  <Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Returns</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Send anything back within 30 days for a full refund.
    </Paragraph>
  </Collapse>
  <Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Warranty</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Every product carries a one-year warranty against defects.
    </Paragraph>
  </Collapse>
</Collapses>
```

### Controlled

Pass `value` and `onChange` to hold the open items yourself, for example to show each item's
state in its trigger. `onChange` fires on every trigger either way; without `value` the group
also updates itself. In single mode the value is an index, or `null` when nothing is open.

```tsx live
function example() {
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    {
      title: 'Shipping',
      body: 'Orders leave the warehouse within two business days.',
    },
    {
      title: 'Returns',
      body: 'Send anything back within 30 days for a full refund.',
    },
    {
      title: 'Warranty',
      body: 'Every product carries a one-year warranty against defects.',
    },
  ];

  return (
    <Collapses value={open} onChange={setOpen}>
      {items.map((item, index) => (
        <Collapse
          key={item.title}
          bordered
          trigger={
            <Block
              p="4"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Strong>{item.title}</Strong>
              <Span aria-hidden="true">{open === index ? '−' : '+'}</Span>
            </Block>
          }
        >
          <Paragraph p="4">{item.body}</Paragraph>
        </Collapse>
      ))}
    </Collapses>
  );
}
```

With `multiple`, the value is an array, so outside controls can open or close several items at
once.

```tsx live
function example() {
  const [open, setOpen] = useState<number[]>([]);
  const items = [
    {
      title: 'Shipping',
      body: 'Orders leave the warehouse within two business days.',
    },
    {
      title: 'Returns',
      body: 'Send anything back within 30 days for a full refund.',
    },
    {
      title: 'Warranty',
      body: 'Every product carries a one-year warranty against defects.',
    },
  ];

  return (
    <Block>
      <Buttons>
        <Button onClick={() => setOpen(items.map((_, index) => index))}>
          Expand all
        </Button>
        <Button onClick={() => setOpen([])}>Collapse all</Button>
      </Buttons>
      <Collapses multiple value={open} onChange={setOpen}>
        {items.map(item => (
          <Collapse
            key={item.title}
            bordered
            trigger={
              <Block p="4">
                <Strong>{item.title}</Strong>
              </Block>
            }
          >
            <Paragraph p="4">{item.body}</Paragraph>
          </Collapse>
        ))}
      </Collapses>
    </Block>
  );
}
```

### An Item With Its Own State

A child that sets its own `open` stays under your control: the group neither overrides it nor
closes it when another item opens. `onOpenChange` still reports its trigger, so the item here drives
its own state. It keeps its index (1) in the group, which simply never opens or closes it.

```tsx live
function example() {
  const [pinned, setPinned] = useState(true);

  return (
    <Collapses defaultValue={0}>
      <Collapse
        bordered
        trigger={
          <Block p="4">
            <Strong>Shipping</Strong>
          </Block>
        }
      >
        <Paragraph p="4">
          Orders leave the warehouse within two business days.
        </Paragraph>
      </Collapse>
      <Collapse
        bordered
        open={pinned}
        onOpenChange={setPinned}
        trigger={
          <Block p="4">
            <Strong>Pinned note</Strong>
          </Block>
        }
      >
        <Paragraph p="4">
          Opening another item does not close this one.
        </Paragraph>
      </Collapse>
      <Collapse
        bordered
        trigger={
          <Block p="4">
            <Strong>Returns</Strong>
          </Block>
        }
      >
        <Paragraph p="4">
          Send anything back within 30 days for a full refund.
        </Paragraph>
      </Collapse>
    </Collapses>
  );
}
```

### How Items Are Indexed

Items are indexed in child order, and the children of a fragment count one by one. A child can
be a component of your own that renders a single `Collapse`. Inside the group an item's
`defaultOpen` is ignored, since the group's `defaultValue` decides, and its `onOpen`/`onClose`
do not fire, since the group owns its state; development builds warn about both. Use the item's
`onOpenChange` or the group's `onChange` to react to a trigger. With `multiple`, `onChange`
reports the open indexes in ascending order.

An index is a position, not an identity. If you render an item conditionally
(`{show && <Collapse … />}`) or reorder the list, the items after it change index while the open
state stays where it was, so it lands on a different panel. Render every item and hide one with
`visibility="hidden"` instead of removing it, or control `value` yourself and update it along
with the list. Here Warranty stays index 2, and stays open, whether Returns is shown or not:

```tsx live
function example() {
  const [showReturns, setShowReturns] = useState(true);

  return (
    <Block>
      <Button mb="4" onClick={() => setShowReturns(shown => !shown)}>
        {showReturns ? 'Hide' : 'Show'} Returns
      </Button>
      <Collapses defaultValue={2}>
        <Collapse
          bordered
          trigger={
            <Block p="4">
              <Strong>Shipping</Strong>
            </Block>
          }
        >
          <Paragraph p="4">
            Orders leave the warehouse within two business days.
          </Paragraph>
        </Collapse>
        <Collapse
          bordered
          visibility={showReturns ? undefined : 'hidden'}
          trigger={
            <Block p="4">
              <Strong>Returns</Strong>
            </Block>
          }
        >
          <Paragraph p="4">
            Send anything back within 30 days for a full refund.
          </Paragraph>
        </Collapse>
        <Collapse
          bordered
          trigger={
            <Block p="4">
              <Strong>Warranty</Strong>
            </Block>
          }
        >
          <Paragraph p="4">
            Every product carries a one-year warranty against defects.
          </Paragraph>
        </Collapse>
      </Collapses>
    </Block>
  );
}
```

### Spacing

The group's `gap` spaces the items. It reads one variable, which the group declares no value for
itself, so the default comes from a fallback in the stylesheet:

| CSS Variable                 | Sass Variable         | Default  |
| ---------------------------- | --------------------- | -------- |
| `--bulma-collapse-group-gap` | `$collapse-group-gap` | `0.5rem` |

Because the group declares nothing, set the variable on the group (through `className` or
`style`) or on any ancestor, `:root` included, and it applies whatever order the stylesheets
load in. Set `$collapse-group-gap` when you compile the Sass yourself to change the fallback.
Here every group gets 1rem, and one with `className="faq"` gets 0.25rem:

```css
:root {
  --bulma-collapse-group-gap: 1rem;
}

.faq {
  --bulma-collapse-group-gap: 0.25rem;
}
```

`seamless` sets the gap to 0 whatever the variable holds. A group nested inside a `Collapse`
picks up that Collapse's default instead of an outer value, so set the variable on the nested
group itself.

### Compound (dot-notation) usage

`Collapses.Collapse` is the same component as `Collapse`, handy when you import only the group.

```tsx live
<Collapses defaultValue={0}>
  <Collapses.Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Shipping</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Orders leave the warehouse within two business days.
    </Paragraph>
  </Collapses.Collapse>
  <Collapses.Collapse
    bordered
    trigger={
      <Block p="4">
        <Strong>Returns</Strong>
      </Block>
    }
  >
    <Paragraph p="4">
      Send anything back within 30 days for a full refund.
    </Paragraph>
  </Collapses.Collapse>
</Collapses>
```

---

## Accessibility

Measured against the
[WAI-ARIA accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/):

- **Implemented.** Each item keeps the wiring `Collapse` gives it: the trigger has
  `role="button"` and `tabIndex="0"`, toggles on Enter and Space, and carries `aria-expanded`
  and an `aria-controls` that points at its own panel. A closed panel is `aria-hidden` and
  `inert`, so its links and fields leave the tab order until it opens. The group only decides
  which items are open.
- **Not implemented: the heading.** The pattern wraps each trigger button in a heading
  (`role="heading"` with an `aria-level`), so screen reader users can move between items by
  heading. `Collapse` renders the button itself and has no prop to wrap it, and a heading
  placed inside `trigger` doesn't count, because assistive tech reads a button's contents as
  plain text. A heading above the group still names the section as a whole.
- **Optional parts, not built in.** Arrow keys, Home and End between triggers: each trigger is
  its own tab stop instead. And `role="region"` on panels: to add one, wrap an item's content in
  an element with `role="region"` and an `aria-label` naming the item. The pattern suggests
  regions only when few panels can be open at once, since each one is a landmark.
- A trigger's text is its accessible name, so name what the item opens ("Returns", not
  "Click here"). Mark a decorative icon in a trigger `aria-hidden` so it adds nothing to that
  name.
- The trigger is already a button, so don't put another button or link inside it. Assistive
  tech treats what's inside a button as plain content, so the inner control loses its role
  while still taking a tab stop.

---

## Related Components

- [`Collapse`](./collapse.md): The expandable panel this component groups.
- [`Tabs`](./tabs.md): The same `value`/`defaultValue`/`onChange` index API, for panels shown
  one at a time in a tab strip.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Collapses Stories](https://bestax.io/storybook/?path=/story/components-collapses--default)
- [WAI-ARIA Authoring Practices: Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)

---

## Props

<!-- bestax:generated props -->

| Prop           | Type                                                             | Default | Description                                                                                                                                                                                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `multiple`     | `boolean`                                                        | `false` | Lets items open independently. Without it, opening one item closes the others.                                                                                                                                                                                                                                                                    |
| `value`        | `number` \| `null` \| `number[]`                                 | —       | Controlled open items: the index of the open item, or `null` for none. With `multiple`, an array of indexes. An index is a position among the children, so rendering an item conditionally or reordering them moves the open state onto a neighbour: render every item and hide one with `visibility="hidden"`, or keep `value` in step yourself. |
| `defaultValue` | `number` \| `null` \| `number[]`                                 | —       | Open items for uncontrolled use, as an index or `null` (the default, none open). With `multiple`, an array of indexes, empty by default. Indexes are positions among the children, as for `value`.                                                                                                                                                |
| `onChange`     | `(value: number \| null) => void` \| `(value: number[]) => void` | —       | Called with the new open items each time a trigger asks for a change, whether or not `value` is set: an index or `null`, or with `multiple` an array of indexes in ascending order. Indexes are positions among the children, as for `value`.                                                                                                     |
| `seamless`     | `boolean`                                                        | `false` | Joins the items into one block, with no gap between them and only the outer corners rounded. The joins show on `bordered` items.                                                                                                                                                                                                                  |
| `className`    | `string`                                                         | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                  |
| `children`     | `React.ReactNode`                                                | —       | The `Collapse` items. Each child element is one item, indexed from 0 in order, with the children of a fragment counted one by one. A child that sets its own `open` keeps it: the group leaves that item alone.                                                                                                                                   |
| `...`          | All standard `<div>` attributes and Bulma helper props           | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                 |

**Subcomponents:**

- [`Collapses.Collapse`](collapse.md): The `Collapse` component provides an expandable/collapsible content panel.

<!-- /bestax:generated props -->
