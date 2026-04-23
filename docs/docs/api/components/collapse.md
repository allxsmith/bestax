---
title: Collapse
sidebar_label: Collapse
---

# Collapse

## Overview

The `Collapse` component provides an expandable/collapsible content panel. It's perfect for accordions, FAQs, settings panels, and any content that should be hidden by default. Supports both controlled and uncontrolled modes, with smooth animations and full accessibility support.

---

## Import

```tsx
import { Collapse } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop               | Type                                     | Default | Description                                      |
| ------------------ | ---------------------------------------- | ------- | ------------------------------------------------ |
| `open`             | `boolean`                                | —       | Controlled open state.                           |
| `defaultOpen`      | `boolean`                                | `false` | Initial open state for uncontrolled usage.       |
| `onOpen`           | `() => void`                             | —       | Callback when collapse opens.                    |
| `onClose`          | `() => void`                             | —       | Callback when collapse closes.                   |
| `trigger`          | `React.ReactNode`                        | —       | The clickable trigger element (header/button).   |
| `animation`        | `'fade'` \| `'slide'` \| `false`         | `'fade'` | Animation style, or `false` to disable.         |
| `ariaId`           | `string`                                 | auto    | Custom aria id for accessibility.                |
| `children`         | `React.ReactNode`                        | —       | The collapsible content.                         |
| `className`        | `string`                                 | —       | Additional CSS classes.                          |
| `triggerClassName` | `string`                                 | —       | Additional classes for the trigger wrapper.      |
| `contentClassName` | `string`                                 | —       | Additional classes for the content wrapper.      |
| `position`         | `'top'` \| `'bottom'`                    | `'top'` | Position of the trigger relative to content.     |
| `bordered`         | `boolean`                                | —       | Adds a border around the collapse.               |
| ...                | All standard HTML and Bulma helper props |         | (See [Helper Props](../helpers/usebulmaclasses)) |

---

## Usage

### Basic Collapse

A simple uncontrolled collapse.

```tsx live
function example() {
  return (
    <Collapse
      trigger={
        <Block p="3" bgColor="white-ter" cursor="pointer" style={{ borderRadius: '4px' }}>
          <Strong>Click to expand</Strong>
        </Block>
      }
    >
      <Block p="3">
        <Paragraph>
          This is the collapsible content. It can contain any React elements.
        </Paragraph>
        <Paragraph>Click the header again to collapse.</Paragraph>
      </Block>
    </Collapse>
  );
}
```

---

### Default Open

Collapse that starts open by default.

```tsx live
function example() {
  return (
    <Collapse
      defaultOpen
      trigger={
        <Block p="3" bgColor="white-ter" cursor="pointer" style={{ borderRadius: '4px' }}>
          <Strong>This starts open</Strong>
        </Block>
      }
    >
      <Block p="3">
        <Paragraph>This content is visible by default.</Paragraph>
      </Block>
    </Collapse>
  );
}
```

---

### Without Animation

Collapse that toggles instantly without animation.

```tsx live
function example() {
  return (
    <Collapse
      animation={false}
      trigger={
        <Block p="3" bgColor="white-ter" cursor="pointer" style={{ borderRadius: '4px' }}>
          <Strong>No animation</Strong>
        </Block>
      }
    >
      <Block p="3">
        <Paragraph>This collapse has animation disabled.</Paragraph>
      </Block>
    </Collapse>
  );
}
```

---

### Controlled Mode

Collapse with external state management.

```tsx live
function example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Block>
      <Block mb="4">
        <Button color="primary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Close' : 'Open'} Collapse
        </Button>
        <Span ml="4">
          State: {isOpen ? 'Open' : 'Closed'}
        </Span>
      </Block>
      <Collapse
        open={isOpen}
        trigger={
          <Block p="3" bgColor="white-ter" style={{ borderRadius: '4px' }}>
            Controlled collapse (use button above)
          </Block>
        }
      >
        <Block p="3">
          <Paragraph>This collapse is controlled by external state.</Paragraph>
        </Block>
      </Collapse>
    </Block>
  );
}
```

---

### Accordion

Multiple collapses working together as an accordion.

```tsx live
function example() {
  const [openIndex, setOpenIndex] = useState(0);

  const items = [
    { title: 'Section 1', content: 'Content for section 1.' },
    { title: 'Section 2', content: 'Content for section 2.' },
    { title: 'Section 3', content: 'Content for section 3.' },
  ];

  return (
    <Block display="flex" flexDirection="column" gap="2">
      {items.map((item, index) => (
        <Collapse
          key={index}
          className="collapse is-bordered"
          open={openIndex === index}
          trigger={
            <Block
              p="4"
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Strong>{item.title}</Strong>
              <Span>{openIndex === index ? '−' : '+'}</Span>
            </Block>
          }
        >
          <Paragraph p="4">{item.content}</Paragraph>
        </Collapse>
      ))}
    </Block>
  );
}
```

---

### Card Style

Collapse with card styling.

```tsx live
function example() {
  return (
    <Collapse
      className="collapse is-card"
      defaultOpen
      trigger={
        <Block className="collapse-trigger-header">
          <Span>Card Collapse</Span>
          <Icon name="fas fa-chevron-down" />
        </Block>
      }
    >
      <Paragraph>This collapse is styled like a card with shadow and padding.</Paragraph>
      <Paragraph>Perfect for FAQ sections or settings panels.</Paragraph>
    </Collapse>
  );
}
```

---

### FAQ Example

A common FAQ pattern with multiple collapses.

```tsx live
function example() {
  const faqs = [
    {
      q: 'What is Bestax?',
      a: 'Bestax is a React component library built on Bulma.',
    },
    { q: 'How do I install it?', a: 'npm install @allxsmith/bestax-bulma' },
    { q: 'Is it free?', a: 'Yes, Bestax is open source and free to use.' },
  ];

  const [openStates, setOpenStates] = useState(faqs.map(() => false));

  const toggle = index => {
    setOpenStates(prev =>
      prev.map((state, i) => (i === index ? !state : state))
    );
  };

  return (
    <Block>
      <Title size="5" mb="4">FAQ</Title>
      <Block display="flex" flexDirection="column" gap="2">
        {faqs.map((faq, index) => (
          <Collapse
            key={index}
            className="collapse is-bordered"
            trigger={
              <Block
                p="4"
                onClick={() => toggle(index)}
                display="flex"
                justifyContent="space-between"
              >
                <Strong>{faq.q}</Strong>
                <Span>{openStates[index] ? '▲' : '▼'}</Span>
              </Block>
            }
            open={openStates[index]}
          >
            <Paragraph p="4" textColor="grey-dark">{faq.a}</Paragraph>
          </Collapse>
        ))}
      </Block>
    </Block>
  );
}
```

---

## CSS Classes

The Collapse component supports these additional CSS classes:

| Class         | Description                         |
| ------------- | ----------------------------------- |
| `is-active`   | Applied when the collapse is open   |
| `is-card`     | Card-style with shadow and padding  |
| `is-bordered` | Bordered style with rounded corners |

---

## Accessibility

- Trigger has `role="button"` and `tabIndex="0"` for keyboard access
- Trigger has `aria-expanded` to indicate open/closed state
- Trigger has `aria-controls` pointing to the content element
- Content has `aria-hidden` matching the collapsed state
- Supports keyboard navigation (Enter and Space to toggle)

---

## Related

- [Tabs](./tabs.md) - Tabbed content panels
- [Panel](./panel.md) - Bulma panel component
