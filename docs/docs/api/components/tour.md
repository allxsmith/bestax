---
title: Tour
sidebar_label: Tour
description: The `Tour` component walks a user through an interface one step at a time, each step a panel pointing at an element with the rest of the page dimmed around it.
keywords:
  - tour
  - product tour
  - onboarding
  - walkthrough
  - coach marks
  - hotspot
  - guided tour
---

# Tour

## Overview

<!-- bestax:generated overview -->

The `Tour` component walks a user through an interface one step at a time, each step a panel pointing at an element with the rest of the page dimmed around it.

<!-- /bestax:generated overview -->

Use it for a first-visit walk through a page, a pass over what changed in a release, or help a
user starts from a "Take the tour" button. Each step is a dialog pointing at its target. With the
overlay, the default, a step is modal: the page is dimmed with a spotlight cut around the target,
and nothing under it can be reached until the tour moves on or ends. Without the overlay, a step
is a non-modal dialog and the page stays usable, so the user can try the control it explains.

The tour doesn't open itself or remember who has seen it. Open it from a button or on a first
visit, and store what `onFinish` and `onOpenChange` tell you.

---

## Import

<!-- bestax:generated import -->

```tsx
import { Tour } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Tour

Write each step as a `Tour.Step` with a `title`, its body as children, and the element it points at
as `target`. A step without a target sits in the middle of the screen. Next reads Done on the last
step, which calls `onFinish` and then ends the tour.

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const filtersRef = React.useRef<HTMLButtonElement>(null);
  const exportRef = React.useRef<HTMLButtonElement>(null);

  return (
    <>
      <Buttons>
        <Button ref={filtersRef}>Filters</Button>
        <Button ref={exportRef}>Export</Button>
        <Button color="primary" onClick={() => setOpen(true)}>
          Take the tour
        </Button>
      </Buttons>
      <Tour open={open} onOpenChange={setOpen}>
        <Tour.Step title="Welcome">
          A quick look around the list and its tools.
        </Tour.Step>
        <Tour.Step target={filtersRef} title="Filters">
          The Filters button narrows the list by status and owner.
        </Tour.Step>
        <Tour.Step target={exportRef} title="Export" position="left">
          The Export button downloads the rows you see as a CSV file.
        </Tour.Step>
      </Tour>
    </>
  );
}
```

### Targets

A `target` is a CSS selector, an element, or a ref to one. A selector is looked up again until it
matches, so a step can point at something that mounts after the tour opens. Until then, and while
the target has no box (inside a closed `Collapse` or a hidden tab panel), the step sits in the
middle of the screen, and a development build warns once. The tour never ends on its own because
a target is missing.

```tsx
<Tour open={open} onOpenChange={setOpen}>
  <Tour.Step target="#filters" title="Filters">
    The filters above the list narrow it by status and owner.
  </Tour.Step>
  <Tour.Step target={exportRef} title="Export">
    The Export button downloads the rows you see.
  </Tour.Step>
</Tour>
```

A target that isn't all in view scrolls to the middle of the screen before its step shows,
smoothly, or instantly when the user asks for less motion.

### Placement

`position` puts a step on the `bottom` (the default), `top`, `left` or `right` of its target. A
step flips to the other side when it doesn't fit and stays inside the window. `left` and `right`
are the start and the end of the line, so they swap under right-to-left text.

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const targetRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Block textAlign="centered">
      <Button ref={targetRef} mb="4">
        Target
      </Button>
      <br />
      <Button onClick={() => setOpen(true)}>Walk the sides</Button>
      <Tour open={open} onOpenChange={setOpen}>
        <Tour.Step target={targetRef} title="Bottom">
          The default side.
        </Tour.Step>
        <Tour.Step target={targetRef} title="End" position="right">
          The end of the line.
        </Tour.Step>
        <Tour.Step target={targetRef} title="Top" position="top">
          Above the target.
        </Tour.Step>
        <Tour.Step target={targetRef} title="Start" position="left">
          The start of the line.
        </Tour.Step>
      </Tour>
    </Block>
  );
}
```

### Without the Overlay

`overlay={false}` makes every step a non-modal dialog, as a `Popover` is: the page isn't dimmed or
blocked, and the user can use the target while the step explains it. Focus still moves into the
step and back, and Tab stays in the step while focus is there. A `Tour.Step` can set its own
`overlay` for one step.

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const nameRef = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <Input ref={nameRef} label="Project name" />
      <Button mt="3" onClick={() => setOpen(true)}>
        Try it
      </Button>
      <Tour open={open} onOpenChange={setOpen} overlay={false}>
        <Tour.Step target={nameRef} title="Name your project">
          Type a name in the field. The page stays usable while this step shows.
        </Tour.Step>
      </Tour>
    </>
  );
}
```

### Controlled

`open` with `onOpenChange` holds whether the tour shows, and `value` with `onChange` holds the
current step's index. An uncontrolled tour starts again at `defaultValue` each time it opens.
`onFinish` runs only for Done on the last step, so you can record a finished tour apart from one
the user skipped, closed or left with Escape.

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState('not taken');

  return (
    <>
      <Button
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
      >
        Start
      </Button>
      <Paragraph mt="3">
        Step {step + 1}, tour {result}
      </Paragraph>
      <Tour
        open={open}
        onOpenChange={next => {
          if (!next && result !== 'finished') setResult('skipped');
          setOpen(next);
        }}
        value={step}
        onChange={setStep}
        onFinish={() => setResult('finished')}
      >
        <Tour.Step title="Your draft">Everything you write is kept.</Tour.Step>
        <Tour.Step title="Publishing">Publish when you're ready.</Tour.Step>
      </Tour>
    </>
  );
}
```

### Labels

`labels` takes the words the tour writes: `skip`, `back`, `next`, `done`, `close`, and `progress`,
a function that writes the progress line from the step, counted from 1, and the total. The default
progress line writes its numbers in the [`LocaleProvider`](../helpers/localeprovider.md)'s locale.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Empezar</Button>
      <Tour
        open={open}
        onOpenChange={setOpen}
        labels={{
          skip: 'Omitir',
          back: 'Atrás',
          next: 'Siguiente',
          done: 'Listo',
          close: 'Cerrar',
          progress: (step, total) => `Paso ${step} de ${total}`,
        }}
      >
        <Tour.Step title="Bienvenida">Un recorrido breve.</Tour.Step>
        <Tour.Step title="Eso es todo">Gracias por mirar.</Tour.Step>
      </Tour>
    </>
  );
}
```

### Compound (dot-notation) usage

`Tour.Step` is the only part. It renders nothing where it's written: the tour reads it, and shows
the current one as its dialog. Steps can sit in fragments, and an array of them goes through
`.map()`. Anything that isn't a `Tour.Step`, a component that renders one included, is left out.

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const tips = [
    { id: 'search', title: 'Search', body: 'Find any row by name.' },
    { id: 'done', title: 'That’s it', body: 'Open this tour again any time.' },
  ];

  return (
    <>
      <Input ref={searchRef} label="Search" />
      <Button mt="3" onClick={() => setOpen(true)}>
        Show me
      </Button>
      <Tour open={open} onOpenChange={setOpen}>
        {tips.map(tip => (
          <Tour.Step
            key={tip.id}
            target={tip.id === 'search' ? searchRef : undefined}
            title={tip.title}
          >
            {tip.body}
          </Tour.Step>
        ))}
      </Tour>
    </>
  );
}
```

---

## Accessibility

There's no WAI-ARIA pattern for a tour, so each step is a
[dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), modal with the overlay and
non-modal without it:

- A step is a `role="dialog"`, named by its title through `aria-labelledby`, or by an `aria-label`
  on the `Tour.Step`, and described by its body. A development build warns about a step with
  neither a title nor a label.
- With the overlay, the step has `aria-modal="true"`, and the page under it is out of reach for
  everyone: everything else on the page is `inert`, the page doesn't scroll, the overlay takes
  every click, and Tab and Shift+Tab stay in the step. The target is out of reach too, so say in
  the step's body what it is: the spotlight tells a screen reader nothing.
- Without the overlay, nothing claims modality. The page and the target stay usable, and Tab stays
  in the step only while focus is there.
- Opening moves focus to Next, and ending the tour hands it back to whatever had it when the tour
  opened. On a step change, focus stays on the control used, so Enter on Next keeps going, and
  goes to Next when that control is gone, as Back is on the first step.
- After each step change, a polite `role="status"` line inside the step says where the tour is,
  "Step 2 of 5: Filters", since a dialog whose name changes isn't announced again.
- <kbd>ArrowRight</kbd> and <kbd>ArrowLeft</kbd> move between steps while focus is in the step,
  swapped under right-to-left text, but not from a text field, another control that uses the
  arrows, or a dialog inside the step. Nothing happens past either end.
- <kbd>Escape</kbd>, Skip and the close button always end the tour, so it's never a keyboard trap.
  A Modal or Dialog opened from a step takes Escape and Tab until it closes.
- The scroll to a target is the only motion: the spotlight and the step move with the target
  rather than glide after it, and under `prefers-reduced-motion: reduce` the scroll is instant.
- In forced colors, the overlay keeps dimming the page, since it's an SVG fill, the spotlight gets
  a `Highlight` outline, and the step keeps its border.

A tour sits at the modal layer, under toasts. Content inside a step that renders through a portal
of its own, such as a Popover with `appendToBody`, lands under the tour, so keep such content in
place inside the step.

---

## Related Components

- [`Popover`](./popover.md): A non-modal dialog anchored to the element that opens it, in the look a step takes.
- [`Modal`](./modal.md): A modal overlay for content that isn't about one element on the page.
- [`Tooltip`](./tooltip.md): A hover and focus hint on one element.
- [`Steps`](./steps.md): Progress through a multi-step form or process, shown in the page.
- [`LocaleProvider`](../helpers/localeprovider.md): The locale the progress line's numbers are written in.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [WAI-ARIA Authoring Practices: Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WCAG 2.2: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [Storybook: Tour Stories](https://bestax.io/storybook/?path=/story/components-tour--default)

---

## Props

<!-- bestax:generated props -->

| Prop                  | Type                                                    | Default | Description                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`            | `React.ReactNode`                                       | —       | `Tour.Step`s, in the order the tour visits them. Fragments are opened up, and anything that isn't a `Tour.Step`, a component that renders one included, is left out.                                                                                                                                                                                            |
| `open`                | `boolean`                                               | —       | Whether the tour is showing (controlled).                                                                                                                                                                                                                                                                                                                       |
| `defaultOpen`         | `boolean`                                               | `false` | Whether it shows from the start (uncontrolled). A tour has to measure its targets, so it shows from the commit after hydration, never in server markup.                                                                                                                                                                                                         |
| `onOpenChange`        | `(open: boolean) => void`                               | —       | Called with `false` when the tour ends: Skip, the close button, Escape, a click outside with `closeOnClickOutside`, or Done after `onFinish`.                                                                                                                                                                                                                   |
| `value`               | `number`                                                | —       | The current step's index (controlled). One past either end shows the nearest step.                                                                                                                                                                                                                                                                              |
| `defaultValue`        | `number`                                                | `0`     | The step it starts on (uncontrolled), and goes back to each time it opens.                                                                                                                                                                                                                                                                                      |
| `onChange`            | `(value: number) => void`                               | —       | Called with the new index when Back, Next or an arrow key changes the step.                                                                                                                                                                                                                                                                                     |
| `onFinish`            | `() => void`                                            | —       | Called when Done on the last step finishes the tour, before `onOpenChange(false)`. Skip, the close button, Escape and a click outside don't call it.                                                                                                                                                                                                            |
| `overlay`             | `boolean`                                               | `true`  | Dims the page and makes each step modal: `aria-modal`, the rest of the page inert and still, and Tab held in the step. With `false`, a step is a non-modal dialog: Tab still stays in it while focus is there, but the page and its target stay usable. A `Tour.Step` can set its own.                                                                          |
| `closeOnEscape`       | `boolean`                                               | `true`  | Ends the tour on Escape, while no overlay opened over it, such as a Modal opened from a step, is on top. A popup inside the step, and content that calls `preventDefault()` on the key, take it first. Without the overlay the key ends the tour from anywhere on the page, as a Sidebar without its overlay closes.                                            |
| `closeOnClickOutside` | `boolean`                                               | `false` | Ends the tour on a press outside the step, the overlay included. Content the step renders through a portal counts as inside.                                                                                                                                                                                                                                    |
| `portal`              | `boolean` \| `string` \| `HTMLElement`                  | `true`  | Where the tour renders: `true` for the `ConfigProvider` portal container or `<body>`, a selector or an element for another container, `false` for where it's written. Modal's shape, with a different default. The step and the overlay are fixed to the viewport wherever they render, so a `transform` on an ancestor of an in-place tour moves them with it. |
| `titleAs`             | `'h2'` \| `'h3'` \| `'h4'` \| `'h5'` \| `'h6'` \| `'p'` | `'h2'`  | What every step's title renders as: a heading one level under the heading the tour's page sits beneath, or `p`.                                                                                                                                                                                                                                                 |
| `labels`              | `TourLabels`                                            | —       | The words the tour writes.                                                                                                                                                                                                                                                                                                                                      |
| `className`           | `string`                                                | —       | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                         |
| `ref`                 | `React.Ref<HTMLDivElement>`                             | —       | Forwarded to the underlying element.                                                                                                                                                                                                                                                                                                                            |
| `...`                 | All standard `<div>` attributes and Bulma helper props  | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                               |

**Subcomponents:**

- `Tour.Step`: One step of the tour: a title, a body and the element it points at. It renders nothing where it's written.

### Tour.Step

| Prop        | Type                                                   | Default      | Description                                                                                                                                                                                                                                                                                       |
| ----------- | ------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`    | `TourTarget`                                           | —            | The element the step points at. Without one, or while it isn't on the page or has no box (in a closed Collapse or a hidden tab panel), the step is centered. A target that turns up later, or gets a box, is found then, and a development build warns once when a step shows without its target. |
| `title`     | `React.ReactNode`                                      | —            | The title, which names the step's dialog. A step without one needs an `aria-label`, and a development build warns when it has neither.                                                                                                                                                            |
| `children`  | `React.ReactNode`                                      | —            | The body, which describes the step's dialog. Say what the target is: a modal step leaves it out of reach, and the spotlight says nothing to a screen reader.                                                                                                                                      |
| `position`  | `'top'` \| `'bottom'` \| `'left'` \| `'right'`         | `'bottom'`   | The side of the target the panel sits on. It flips to the opposite side when it doesn't fit, and stays inside the viewport.                                                                                                                                                                       |
| `overlay`   | `boolean`                                              | `the tour's` | This step's own `overlay`, in place of the tour's.                                                                                                                                                                                                                                                |
| `className` | `string`                                               | —            | Additional CSS classes.                                                                                                                                                                                                                                                                           |
| `ref`       | `React.Ref<HTMLDivElement>`                            | —            | Forwarded to the underlying element.                                                                                                                                                                                                                                                              |
| `...`       | All standard `<div>` attributes and Bulma helper props | —            | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                 |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Tour` registers these variables on its own `.tour` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                       | Sass Variable               | Default                                                                                 |
| ---------------------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| `--bulma-tour-z-index`             | `$tour-z-index`             | `$extras-z-index-modal`                                                                 |
| `--bulma-tour-overlay-background`  | `$tour-overlay-background`  | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.5)` |
| `--bulma-tour-spotlight-padding`   | `$tour-spotlight-padding`   | `0.5rem`                                                                                |
| `--bulma-tour-spotlight-radius`    | `$tour-spotlight-radius`    | `var(--bulma-radius)`                                                                   |
| `--bulma-tour-step-background`     | `$tour-step-background`     | `var(--bulma-scheme-main)`                                                              |
| `--bulma-tour-step-color`          | `$tour-step-color`          | `var(--bulma-text)`                                                                     |
| `--bulma-tour-step-border-color`   | `$tour-step-border-color`   | `var(--bulma-border-weak)`                                                              |
| `--bulma-tour-step-radius`         | `$tour-step-radius`         | `var(--bulma-radius-large)`                                                             |
| `--bulma-tour-step-shadow`         | `$tour-step-shadow`         | `var(--bulma-shadow)`                                                                   |
| `--bulma-tour-step-max-width`      | `$tour-step-max-width`      | `min(24rem, calc(100vw - 2rem))`                                                        |
| `--bulma-tour-step-offset`         | `$tour-step-offset`         | `0.5rem`                                                                                |
| `--bulma-tour-step-header-padding` | `$tour-step-header-padding` | `0.75rem 1rem`                                                                          |
| `--bulma-tour-step-header-color`   | `$tour-step-header-color`   | `var(--bulma-text-strong)`                                                              |
| `--bulma-tour-step-header-weight`  | `$tour-step-header-weight`  | `var(--bulma-weight-semibold)`                                                          |
| `--bulma-tour-step-body-padding`   | `$tour-step-body-padding`   | `1rem`                                                                                  |
| `--bulma-tour-step-footer-padding` | `$tour-step-footer-padding` | `0.75rem 1rem`                                                                          |
| `--bulma-tour-step-footer-gap`     | `$tour-step-footer-gap`     | `0.5rem`                                                                                |
| `--bulma-tour-progress-color`      | `$tour-progress-color`      | `var(--bulma-text-weak)`                                                                |

<!-- /bestax:generated cssvars -->
