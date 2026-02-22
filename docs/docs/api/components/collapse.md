---
title: Collapse
sidebar_label: Collapse
---

# Collapse

## Overview

The `Collapse` component provides an expandable/collapsible content panel. It's perfect for accordions, FAQs, settings panels, and any content that should be hidden by default. Supports both controlled and uncontrolled modes, with smooth animations and full accessibility support.

:::info
The Collapse component requires importing the extras CSS. See the [Extras Setup Guide](../../guides/getting-started/using-extras.md) for installation instructions.
:::

---

## Import

```tsx
import { Collapse } from '@allxsmith/bestax-bulma';

// Also import the extras CSS
import '@allxsmith/bestax-bulma/extras.css';
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
| `animation`        | `boolean`                                | `true`  | Enable height animation.                         |
| `ariaId`           | `string`                                 | auto    | Custom aria id for accessibility.                |
| `children`         | `React.ReactNode`                        | —       | The collapsible content.                         |
| `className`        | `string`                                 | —       | Additional CSS classes.                          |
| `triggerClassName` | `string`                                 | —       | Additional classes for the trigger wrapper.      |
| `contentClassName` | `string`                                 | —       | Additional classes for the content wrapper.      |
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
        <div
          style={{
            padding: '0.75rem',
            background: '#f5f5f5',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          <strong>Click to expand</strong>
        </div>
      }
    >
      <div style={{ padding: '0.75rem' }}>
        <p>
          This is the collapsible content. It can contain any React elements.
        </p>
        <p>Click the header again to collapse.</p>
      </div>
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
        <div
          style={{
            padding: '0.75rem',
            background: '#f5f5f5',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          <strong>This starts open</strong>
        </div>
      }
    >
      <div style={{ padding: '0.75rem' }}>
        <p>This content is visible by default.</p>
      </div>
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
        <div
          style={{
            padding: '0.75rem',
            background: '#f5f5f5',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          <strong>No animation</strong>
        </div>
      }
    >
      <div style={{ padding: '0.75rem' }}>
        <p>This collapse has animation disabled.</p>
      </div>
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
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Button color="primary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Close' : 'Open'} Collapse
        </Button>
        <span style={{ marginLeft: '1rem' }}>
          State: {isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
      <Collapse
        open={isOpen}
        trigger={
          <div
            style={{
              padding: '0.75rem',
              background: '#f5f5f5',
              borderRadius: '4px',
            }}
          >
            Controlled collapse (use button above)
          </div>
        }
      >
        <div style={{ padding: '0.75rem' }}>
          <p>This collapse is controlled by external state.</p>
        </div>
      </Collapse>
    </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((item, index) => (
        <Collapse
          key={index}
          className="collapse is-bordered"
          open={openIndex === index}
          trigger={
            <div
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <strong>{item.title}</strong>
              <span>{openIndex === index ? '−' : '+'}</span>
            </div>
          }
        >
          <p>{item.content}</p>
        </Collapse>
      ))}
    </div>
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
        <div className="collapse-trigger-header">
          <span>Card Collapse</span>
          <Icon icon="fas fa-chevron-down" />
        </div>
      }
    >
      <p>This collapse is styled like a card with shadow and padding.</p>
      <p>Perfect for FAQ sections or settings panels.</p>
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
    <div>
      <h4 className="title is-5 mb-4">FAQ</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {faqs.map((faq, index) => (
          <Collapse
            key={index}
            className="collapse is-bordered"
            trigger={
              <div
                onClick={() => toggle(index)}
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span style={{ fontWeight: 500 }}>{faq.q}</span>
                <span>{openStates[index] ? '▲' : '▼'}</span>
              </div>
            }
            open={openStates[index]}
          >
            <p style={{ color: '#666' }}>{faq.a}</p>
          </Collapse>
        ))}
      </div>
    </div>
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
