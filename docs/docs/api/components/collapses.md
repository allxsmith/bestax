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

:::note How items are counted

Items are indexed in child order, and the children of a fragment count one by one. A child can
be a component of your own that renders a single `Collapse`. Inside the group an item's
`defaultOpen` is ignored, since the group's `defaultValue` decides, and its `onOpen`/`onClose`
do not fire, since the group owns its state. Use the item's `onOpenChange` or the group's
`onChange` to react to a trigger.

:::

### Spacing

The group's `gap` spaces the items, and it reads `--bulma-collapse-group-gap` (`$collapse-group-gap`
in Sass), 0.5rem by default. The group declares no value of its own, so set the variable on the
group (through `className` or `style`) or on any ancestor, `:root` included. Here every group
gets 1rem, and one with `className="faq"` gets 0.25rem:

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

- Each item keeps the wiring `Collapse` gives it: the trigger has `role="button"` and
  `tabIndex="0"`, toggles on Enter and Space, and carries `aria-expanded` and an
  `aria-controls` that points at its own panel. The group only decides which items are open.
- Each trigger is its own tab stop. Arrow-key movement between triggers, which the WAI-ARIA
  accordion pattern lists as optional, is not built in.
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

| Prop           | Type                                                             | Default | Description                                                                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `multiple`     | `boolean`                                                        | `false` | Lets items open independently. Without it, opening one item closes the others.                                                                                                                                  |
| `value`        | `number` \| `null` \| `number[]`                                 | —       | Controlled open items: the index of the open item, or `null` for none. With `multiple`, an array of indexes.                                                                                                    |
| `defaultValue` | `number` \| `null` \| `number[]`                                 | —       | Open items for uncontrolled use, as an index or `null` (the default, none open). With `multiple`, an array of indexes, empty by default.                                                                        |
| `onChange`     | `(value: number \| null) => void` \| `(value: number[]) => void` | —       | Called with the new open items each time a trigger asks for a change, whether or not `value` is set: an index or `null`, or an array of indexes with `multiple`.                                                |
| `seamless`     | `boolean`                                                        | `false` | Joins the items into one block, with no gap between them and only the outer corners rounded. The joins show on `bordered` items.                                                                                |
| `className`    | `string`                                                         | —       | Additional CSS classes to apply.                                                                                                                                                                                |
| `children`     | `React.ReactNode`                                                | —       | The `Collapse` items. Each child element is one item, indexed from 0 in order, with the children of a fragment counted one by one. A child that sets its own `open` keeps it: the group leaves that item alone. |
| `...`          | All standard `<div>` attributes and Bulma helper props           | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                               |

**Subcomponents:**

- [`Collapses.Collapse`](collapse.md): The `Collapse` component provides an expandable/collapsible content panel.

<!-- /bestax:generated props -->
