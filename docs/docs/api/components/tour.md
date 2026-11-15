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
  - beacons
  - tips
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
import { Tour, useTour } from '@allxsmith/bestax-bulma';
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
matches, in the shadow root the tour renders into and then the document, so a step can point at
something that mounts after the tour opens. Until then, and while the target has no box (inside a closed
`Collapse` or a hidden tab panel), the step sits in the middle of the screen, and a development
build warns, once for each selector. The tour never ends on its own because
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

When a step shows and its target isn't all in view, the page scrolls the target to the middle of
the screen, smoothly, or instantly when the user asks for less motion, and the step moves with it.

### Placement

`position` puts a step on the `bottom` (the default), `top`, `left` or `right` of its target. A
step flips to the other side when it doesn't fit, goes to a side across when neither fits, as beside a
target on a phone, and stays inside the window. `left` and `right` are the start and the end of
the line, so they swap under right-to-left text.

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
blocked, and the user can use the target while the step explains it. Focus moves into the step as
the tour opens and back as it ends. Tab from the step's last control, Next in the default footer,
moves focus to the target: to its first control, or to the target itself when it takes focus. Shift+Tab goes where the
browser sends it. Escape ends the tour while focus is in the step. A `Tour.Step` can set its own
`overlay` for one step, and a step that turns modal while focus is out on the page takes focus.

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
          setResult('in progress');
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
          setOpen(next);
          // Done calls onFinish first, so a finished tour stays finished.
          if (!next) setResult(now => (now === 'finished' ? now : 'skipped'));
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

### A Cover

`cover` puts media above a step's header, as wide as the step: an image, or a short clip. Give an
image the `alt` it needs, which is `""` when the body already says what it shows, and don't start
motion on its own when the user asks for less of it.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>What's new</Button>
      <Tour open={open} onOpenChange={setOpen}>
        <Tour.Step
          title="The new editor"
          cover={
            <img
              src="https://bulma.io/assets/images/placeholders/400x300.png"
              alt=""
            />
          }
        >
          The editor now saves as you type.
        </Tour.Step>
      </Tour>
    </>
  );
}
```

### A Footer of Your Own

`footer` on `Tour` replaces every step's footer, and `footer` on a `Tour.Step` replaces that
step's, over the tour's. Build one from the parts the default footer is made of: `Tour.Skip`,
`Tour.Back`, `Tour.Next` and `Tour.Progress`. They act on the tour from wherever they sit in the
step, take a `Button`'s props (`Tour.Progress` a `<span>`'s), and are labelled from `labels` unless
they have children. `Tour.Back` renders nothing on the first step, and `Tour.Next` reads Done on the
last. Focus starts on `Tour.Next`, and on a step without one that takes focus, on the footer's
first control, else the body's, else the close button. <kbd>ArrowRight</kbd> and <kbd>ArrowLeft</kbd> press the step's
`Tour.Next` and `Tour.Back`, swapped under right-to-left text, as a click does: one that's
disabled, loading or `aria-disabled`, or whose `onClick` calls `preventDefault()`, holds for the keys too, one given
`type="submit"` submits its form on an arrow key, and a step without one ignores its key. Both
look for the first enabled one that's showing, so a pair a responsive layout shows one of at a
time works. A `footer` of `null` leaves a step without one, and Escape and the close button still
end the tour.

A footer that renders nothing at all, as `Tour.Back` alone does on the first step, draws no
strip. A wrapper of your own, such as `Buttons` around that `Tour.Back`, still does, since it isn't
empty, so render the wrapper only when its parts show: `useTour()` below says which step it is.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Take the tour</Button>
      <Tour
        open={open}
        onOpenChange={setOpen}
        footer={
          <>
            <Tour.Progress />
            <Buttons>
              <Tour.Back />
              <Tour.Next />
            </Buttons>
          </>
        }
      >
        <Tour.Step title="Your draft">Everything you write is kept.</Tour.Step>
        <Tour.Step title="Publishing">Publish when you're ready.</Tour.Step>
        <Tour.Step
          title="That's all"
          footer={<Tour.Next>Start writing</Tour.Next>}
        >
          You can take this tour again from the Help menu.
        </Tour.Step>
      </Tour>
    </>
  );
}
```

### useTour

`useTour()` hands a component inside a step the current step's index as `value`, the `total`, and
Next's, Back's and Skip's actions as `next`, `back` and `skip`, for a part the four above don't
cover. The actions keep their identity from render to render, and act on the step the tour is on
when they're called. The object changes only when the step or the total does, so an effect can
depend on it. It returns `null` outside a step.

```tsx live
function example() {
  const [open, setOpen] = useState(false);

  function StepCount() {
    const tour = useTour();
    return tour ? <Tag>{`${tour.value + 1}/${tour.total}`}</Tag> : null;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Take the tour</Button>
      <Tour
        open={open}
        onOpenChange={setOpen}
        footer={
          <>
            <StepCount />
            <Buttons>
              <Tour.Skip />
              <Tour.Next />
            </Buttons>
          </>
        }
      >
        <Tour.Step title="One">The first step.</Tour.Step>
        <Tour.Step title="Two">The second step.</Tour.Step>
      </Tour>
    </>
  );
}
```

### Beacons

`mode="beacon"` puts a beacon, a small pulsing button, on each step's target, and the user opens
the steps in any order: tips pinned to the controls they explain. The beacons stay until `open`
turns `false`. They sit together in one group named by `labels.beacons` ("Tips"), in step order,
after the page's own content in the Tab order, so order the steps as the page reads; a development
build warns once when the targets aren't in document order. Each beacon is named by
`labels.beacon` ("Show tip") and its step's title, or the step's `aria-label` when it has no title,
and sits over its target's top end corner, its top left one under right-to-left text. A beacon
shows while its target is on the page, has a box and is in view, that corner included, so a step
whose target is missing has none until the target turns up. Showing the beacons moves no focus.

Opening a beacon sets `value` to its step, hides every beacon and opens the step, modal or not by
`overlay`. The step stands alone: it has no Skip, Back or progress line, its Next reads Done, and
the arrow keys do nothing in it. Done, Escape, the close button and a press outside with
`closeOnClickOutside` close only the step, which sets `value` to `-1`, brings the beacons back and
puts focus on the step's beacon, while the step held focus: a close the app makes while the user is
in a field on the page leaves them there. `onFinish` and `onOpenChange` never fire, since the app
owns `open`. Closing the tour while a beacon's step has focus sends focus to the step's target, its
first control or the target itself when it takes focus.

Removing a step removes its beacon, so an app can drop the tips a user has read. A tip whose step
is removed while it's open, or moved by a step added or removed before it, closes, and `onChange`
reports `-1`. So keep the list of steps fixed while the tips show, and drop the read ones the next
time they open, as the example below does; that also leaves the beacon there for focus to go back
to.

While only the beacons show, the tour sits at 19, one under the dropdown tier, and an open step goes
back up to the modal tier. Everything at the dropdown tier or above covers the beacons: a Bulma
navbar, fixed or not (30), sidebars and modals, and dropdown menus, such as `Dropdown`'s,
`Combobox`'s, `Autocomplete`'s and `Taginput`'s (20). A beacon on a target inside one of those
would sit under it, so raise `--bulma-tour-beacon-z-index` above that layer. Over a Bulma navbar:

```css
.tour.is-beacon {
  --bulma-tour-beacon-z-index: 31;
}
```

```tsx live
function example() {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const [showing, setShowing] = useState<string[]>([]);
  const filtersRef = React.useRef<HTMLButtonElement>(null);
  const exportRef = React.useRef<HTMLButtonElement>(null);
  const tips = [
    {
      id: 'filters',
      target: filtersRef,
      title: 'Filters',
      body: 'Narrow the list by status and owner.',
    },
    {
      id: 'export',
      target: exportRef,
      title: 'Export',
      body: 'Download the rows you see as a CSV file.',
    },
  ];
  const shown = tips.filter(tip => showing.includes(tip.id));

  return (
    <>
      <Buttons>
        <Button ref={filtersRef}>Filters</Button>
        <Button ref={exportRef}>Export</Button>
      </Buttons>
      <Button
        color="primary"
        onClick={() => {
          if (!open) {
            setShowing(
              tips.filter(tip => !read.includes(tip.id)).map(tip => tip.id)
            );
          }
          setOpen(!open);
        }}
      >
        {open ? 'Hide tips' : 'Show tips'}
      </Button>
      <Tour
        mode="beacon"
        open={open}
        onChange={index => {
          if (index >= 0) setRead(ids => [...ids, shown[index].id]);
        }}
      >
        {shown.map(tip => (
          <Tour.Step key={tip.id} target={tip.target} title={tip.title}>
            {tip.body}
          </Tour.Step>
        ))}
      </Tour>
    </>
  );
}
```

### Compound (dot-notation) usage

`Tour.Step` renders nothing where it's written: the tour reads it, and shows the current one as its
dialog. Steps can sit in fragments, and an array of them goes through `.map()`. Anything that isn't
a `Tour.Step`, a component that renders one included, is left out. `Tour.Skip`, `Tour.Back`,
`Tour.Next` and `Tour.Progress` are the parts of a step's footer, and render nothing outside a step.

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
- Without the overlay, nothing claims modality. The page and the target stay usable, by pointer
  and keyboard alike: Tab from the step's last control moves focus to the target, to its first
  control or the target itself when it takes focus, and Shift+Tab goes where the browser sends it. Escape ends the tour
  while focus is in the step, so an Escape meant for a field on the page stays with it.
- Opening moves focus to Next, or, on a step without one that takes focus, to the footer's first
  control, else the body's, else the close button. Ending the tour hands focus back to whatever had it when the tour
  opened. On a step change, focus stays on the control used, so Enter on Next keeps going, and
  goes back to where the step starts when that control is gone, as Back is on the first step.
- After each step change, a polite `role="status"` line inside the step says where the tour is,
  "Step 2 of 5: Filters", since a dialog whose name changes isn't announced again.
- <kbd>ArrowRight</kbd> and <kbd>ArrowLeft</kbd> press the step's Next and Back while focus is in
  the step, swapped under right-to-left text, but not from a text field, another control that
  uses the arrows, or a dialog inside the step. A step whose Next or Back is missing, hidden or
  disabled ignores that key, and nothing happens past either end: ArrowRight doesn't finish the
  tour. The key presses the button as a click does, so a Next or Back given `type="submit"`
  submits its form.
- Skip and the close button always end the tour, so a modal step is never a keyboard trap, and
  <kbd>Escape</kbd> does too unless `closeOnEscape={false}`. A Modal or Dialog opened from a step
  takes Escape and Tab until it closes.
- The scroll to a target is the only motion: the spotlight and the step move with the target
  rather than glide after it, and under `prefers-reduced-motion: reduce` the scroll is instant.
- With `mode="beacon"`, the beacons are real `<button>`s with `aria-haspopup="dialog"` and
  `aria-expanded="false"`, in one `role="group"` named "Tips", in step order after the page's
  content. Each is named "Show tip" and its step's title, has a hit area of at least 24 by 24
  pixels, and stops pulsing under `prefers-reduced-motion: reduce`. Showing them moves no focus,
  and closing a beacon's step hands focus back to its beacon.
- In forced colors, the overlay keeps dimming the page, since it's an SVG fill, the spotlight gets
  a `Highlight` outline, and the step keeps its border.

A tour sits at the modal layer, under toasts. In a modal step, a popup that renders through a portal
of its own, such as a Popover with `appendToBody` or a picker's calendar, renders inside the step,
as it does in a Modal, so it shows over the tour and stays reachable. A `ConfigProvider`'s
`portalContainer` still comes first, there as in a Modal. A step without the overlay
leaves it in `<body>`, under the tour, so keep such content in place inside a non-modal step.

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

| Prop                  | Type                                                    | Default                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children`            | `React.ReactNode`                                       | —                             | `Tour.Step`s, in the order the tour visits them. Fragments are opened up, and anything that isn't a `Tour.Step`, a component that renders one included, is left out.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `open`                | `boolean`                                               | —                             | Whether the tour is showing (controlled).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `defaultOpen`         | `boolean`                                               | `false`                       | Whether it shows from the start (uncontrolled). A tour has to measure its targets, so it shows from the commit after hydration, never in server markup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `onOpenChange`        | `(open: boolean) => void`                               | —                             | Called with `false` when the tour ends: Skip, the close button, Escape, a click outside with `closeOnClickOutside`, or Done after `onFinish`. With `mode="beacon"` it never fires: those close only the open step, and the app owns `open`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `value`               | `number`                                                | —                             | The current step's index (controlled). In guided mode an index past either end shows the nearest step, and a fraction is rounded down. With `mode="beacon"`, the open step's index, or `-1` while only the beacons show, as Timeline's `active` takes `-1` for none.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `defaultValue`        | `number`                                                | `0, or -1 with mode="beacon"` | The step it starts on (uncontrolled), and goes back to each time it opens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `onChange`            | `(value: number) => void`                               | —                             | Called with the new index when Back, Next, an arrow key or a beacon changes the step, and with `-1` when a beacon's step closes, which it does when the step is removed, or moved by a step added or removed before it. So keep a beacon tour's list of steps fixed while the tips show, and drop read ones the next time they open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `onFinish`            | `() => void`                                            | —                             | Called when Done on the last step finishes the tour, before `onOpenChange(false)`. Skip, the close button, Escape and a click outside don't call it, and with `mode="beacon"`, where Done closes only the step, it never fires.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `overlay`             | `boolean`                                               | `true`                        | Dims the page and makes each step modal: `aria-modal`, the rest of the page inert and still, and Tab held in the step. With `false`, a step is a non-modal dialog, as a `Popover` is, and the page and its target stay usable, from the keyboard too: focus moves in and back, Tab from the step's last control, Next in the default footer, goes on to the target (its first control, or the target itself when it takes focus), Shift+Tab goes where the browser sends it, and Escape ends the tour while focus is in the step. A `Tour.Step` can set its own, and a step that turns modal while focus is out on the page takes focus.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `closeOnEscape`       | `boolean`                                               | `true`                        | Ends the tour on Escape, or with `mode="beacon"` closes the open step. With the overlay, from anywhere, while no overlay opened over it, such as a Modal opened from a step, is on top. Without it, only while focus is in the step, so an Escape meant for the page stays with the page. A popup inside the step, and content that calls `preventDefault()` on the key, take it first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `closeOnClickOutside` | `boolean`                                               | `false`                       | Ends the tour on a press outside the step, the overlay included. Content the step renders through a portal counts as inside. Off by default, unlike Popover's: a tour is a sequence someone means to finish, and a stray click on the dimmed page, or on the page around a step without the overlay, shouldn't end it partway. Skip, the close button and Escape still end it. With `mode="beacon"`, a press outside closes the open step, as Escape does, and never ends the tour, and it's off there by default too, so with the default it does nothing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `portal`              | `boolean` \| `string` \| `HTMLElement`                  | `true`                        | Where the tour renders: `true` for the `ConfigProvider` portal container or `<body>`, a selector or an element for another container, `false` for where it's written. Modal's shape, with a different default. The step and the overlay are fixed to the viewport wherever they render, so a `transform` on an ancestor of an in-place tour moves them with it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `titleAs`             | `'h2'` \| `'h3'` \| `'h4'` \| `'h5'` \| `'h6'` \| `'p'` | `'h2'`                        | What every step's title renders as: a heading one level under the heading the tour's page sits beneath, or `p`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `labels`              | `TourLabels`                                            | —                             | The words the tour writes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `footer`              | `React.ReactNode`                                       | —                             | Every step's footer, in place of the default: Skip and the progress line at the start, Back and Next at the end. Build it from `Tour.Skip`, `Tour.Back`, `Tour.Next` and `Tour.Progress`, which act on the tour from wherever they sit in the step. ArrowRight and ArrowLeft press the step's `Tour.Next` and `Tour.Back`, swapped under right-to-left text, so one that's disabled, loading or `aria-disabled`, or whose `onClick` prevents, holds for the keys too, and a step without one ignores its key. A step's own `footer` wins, and `null` leaves the steps without one.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `mode`                | `'guided'` \| `'beacon'`                                | `'guided'`                    | `guided` walks the steps in order. `beacon` puts a button on each target that opens its step, in any order, and keeps the buttons there until `open` turns `false`. The beacons sit in one group named by `labels.beacons`, in step order, after the page's own content in the Tab order, so order the steps as the page reads; a development build warns once when they aren't. A beacon sits over its target's top end corner and shows while its target is on the page, has a box and is in view, that corner included. Opening one hides them all and opens its step, modal or not by `overlay`, and closing the step brings them back, with focus on its beacon while the step held it. A beacon's step has no Skip, Back or progress line, its Next reads Done and closes the step, and the arrow keys do nothing in it. Closing the tour while its step holds focus sends focus to the step's target. Removing a step removes its beacon, so an app can drop the tips a user has read; a tip whose step is removed or moved while it's open closes, with `onChange(-1)`. While only the beacons show, the tour sits under the app's navbar, sidebars, modals and dropdown menus; raise `--bulma-tour-beacon-z-index` for targets inside one. |
| `className`           | `string`                                                | —                             | Additional CSS classes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `ref`                 | `React.Ref<HTMLDivElement>`                             | —                             | Forwarded to the underlying element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `...`                 | All standard `<div>` attributes and Bulma helper props  | —                             | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

**Subcomponents:**

- `Tour.Step`: One step of the tour: a title, a body and the element it points at. It renders nothing where it's written.
- `Tour.Skip`: A `Button` that ends the tour early, labelled `labels.skip` unless it has children. It renders nothing on a beacon's step.
- `Tour.Back`: A `Button` to the step before, labelled `labels.back` unless it has children. It renders nothing on the first step or on a beacon's step, and ArrowLeft in the step, ArrowRight under right-to-left text, presses it.
- `Tour.Next`: A `Button` to the next step, labelled `labels.next`, or `labels.done` on the last step, where it finishes the tour, unless it has children. On a beacon's step it reads `labels.done` and closes the step. Focus starts on it as a step opens, and ArrowRight in the step, ArrowLeft under right-to-left text, presses it, except on the last step and on a beacon's step.
- `Tour.Progress`: The progress line, "Step 2 of 5" by default, from `labels.progress`. It renders nothing on a beacon's step.

### Tour.Step

| Prop        | Type                                                   | Default      | Description                                                                                                                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`    | `TourTarget`                                           | —            | The element the step points at. Without one, or while it isn't on the page or has no box (in a closed Collapse or a hidden tab panel), the step is centered. A target that turns up later, or gets a box, is found then. A development build warns about a missing target, once for each selector. |
| `title`     | `React.ReactNode`                                      | —            | The title, which names the step's dialog. A step without one needs an `aria-label`, and a development build warns when it has neither.                                                                                                                                                             |
| `children`  | `React.ReactNode`                                      | —            | The body, which describes the step's dialog. Say what the target is: a modal step leaves it out of reach, and the spotlight says nothing to a screen reader.                                                                                                                                       |
| `position`  | `'top'` \| `'bottom'` \| `'left'` \| `'right'`         | `'bottom'`   | The side of the target the panel sits on. It flips to the opposite side when it doesn't fit, or to a side across when neither does, as beside a target on a phone, and stays inside the viewport.                                                                                                  |
| `overlay`   | `boolean`                                              | `the tour's` | This step's own `overlay`, in place of the tour's.                                                                                                                                                                                                                                                 |
| `cover`     | `React.ReactNode`                                      | —            | Media above the header, such as an image or a short clip, which fills the step's width. Give an image the `alt` it needs, which is `""` when the body already says what it shows, and don't autoplay motion when the user asks for less of it.                                                     |
| `footer`    | `React.ReactNode`                                      | —            | This step's footer, in place of the tour's `footer` or the default one. `null` leaves the step without one.                                                                                                                                                                                        |
| `className` | `string`                                               | —            | Additional CSS classes.                                                                                                                                                                                                                                                                            |
| `ref`       | `React.Ref<HTMLDivElement>`                            | —            | Forwarded to the underlying element.                                                                                                                                                                                                                                                               |
| `...`       | All standard `<div>` attributes and Bulma helper props | —            | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                  |

### Tour.Skip

| Prop          | Type                                                                                                                                                        | Default    | Description                                                                                                                                                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` \| `'text'` \| `'ghost'` | `'text'`   | Bulma color variant for the button. `ghost` renders a link-like button; `text` renders a minimal text-only button.                                                                                                                                                                  |
| `size`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                          | —          | Size of the button.                                                                                                                                                                                                                                                                 |
| `isLight`     | `boolean`                                                                                                                                                   | `false`    | Applies a lighter color variant.                                                                                                                                                                                                                                                    |
| `isRounded`   | `boolean`                                                                                                                                                   | `false`    | Makes the button rounded.                                                                                                                                                                                                                                                           |
| `isLoading`   | `boolean`                                                                                                                                                   | `false`    | Displays a loading spinner, with everything inside the button hidden behind it, in forced colors (Windows' contrast themes) too. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn. Bulma alone hides only the label, so the rest needs bestax's CSS loaded. |
| `isStatic`    | `boolean`                                                                                                                                                   | `false`    | Makes the button non-interactive.                                                                                                                                                                                                                                                   |
| `isFullwidth` | `boolean`                                                                                                                                                   | `false`    | Makes the button full-width.                                                                                                                                                                                                                                                        |
| `isFullWidth` | `boolean`                                                                                                                                                   | `false`    | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Makes the button full-width.                                                                                                                                                                        |
| `isOutlined`  | `boolean`                                                                                                                                                   | `false`    | Applies outlined styling (requires color).                                                                                                                                                                                                                                          |
| `isInverted`  | `boolean`                                                                                                                                                   | `false`    | Applies inverted styling (requires color).                                                                                                                                                                                                                                          |
| `isFocused`   | `boolean`                                                                                                                                                   | `false`    | Applies focused styling (visual only).                                                                                                                                                                                                                                              |
| `isActive`    | `boolean`                                                                                                                                                   | `false`    | Applies active styling (visual only), with no `aria-pressed`. For a button that stays pressed, use `ToggleButton`.                                                                                                                                                                  |
| `isHovered`   | `boolean`                                                                                                                                                   | `false`    | Applies hovered styling (visual only).                                                                                                                                                                                                                                              |
| `isDisabled`  | `boolean`                                                                                                                                                   | `false`    | Applies disabled styling.                                                                                                                                                                                                                                                           |
| `className`   | `string`                                                                                                                                                    | —          | Custom class name.                                                                                                                                                                                                                                                                  |
| `textColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —          | Text color helper.                                                                                                                                                                                                                                                                  |
| `bgColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —          | Background color helper.                                                                                                                                                                                                                                                            |
| `children`    | `React.ReactNode`                                                                                                                                           | —          | Button content.                                                                                                                                                                                                                                                                     |
| `ref`         | `React.Ref<HTMLButtonElement>`                                                                                                                              | —          | Forwarded to the underlying element.                                                                                                                                                                                                                                                |
| `type`        | `'button'` \| `'submit'` \| `'reset'`                                                                                                                       | `'button'` | Button type. Defaults to `'button'`, so a part inside a form doesn't submit it. The arrow keys press Next and Back as a click does, so one given `'submit'` submits its form on an arrow key too.                                                                                   |
| `onClick`     | `React.MouseEventHandler<HTMLButtonElement>`                                                                                                                | —          | Runs before the part acts on the tour. Call `preventDefault()` to keep it from acting.                                                                                                                                                                                              |
| `...`         | All standard `<button>` attributes and Bulma helper props                                                                                                   | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                   |

### Tour.Back

| Prop          | Type                                                                                                                                                        | Default    | Description                                                                                                                                                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` \| `'text'` \| `'ghost'` | —          | Bulma color variant for the button. `ghost` renders a link-like button; `text` renders a minimal text-only button.                                                                                                                                                                  |
| `size`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                          | —          | Size of the button.                                                                                                                                                                                                                                                                 |
| `isLight`     | `boolean`                                                                                                                                                   | `false`    | Applies a lighter color variant.                                                                                                                                                                                                                                                    |
| `isRounded`   | `boolean`                                                                                                                                                   | `false`    | Makes the button rounded.                                                                                                                                                                                                                                                           |
| `isLoading`   | `boolean`                                                                                                                                                   | `false`    | Displays a loading spinner, with everything inside the button hidden behind it, in forced colors (Windows' contrast themes) too. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn. Bulma alone hides only the label, so the rest needs bestax's CSS loaded. |
| `isStatic`    | `boolean`                                                                                                                                                   | `false`    | Makes the button non-interactive.                                                                                                                                                                                                                                                   |
| `isFullwidth` | `boolean`                                                                                                                                                   | `false`    | Makes the button full-width.                                                                                                                                                                                                                                                        |
| `isFullWidth` | `boolean`                                                                                                                                                   | `false`    | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Makes the button full-width.                                                                                                                                                                        |
| `isOutlined`  | `boolean`                                                                                                                                                   | `false`    | Applies outlined styling (requires color).                                                                                                                                                                                                                                          |
| `isInverted`  | `boolean`                                                                                                                                                   | `false`    | Applies inverted styling (requires color).                                                                                                                                                                                                                                          |
| `isFocused`   | `boolean`                                                                                                                                                   | `false`    | Applies focused styling (visual only).                                                                                                                                                                                                                                              |
| `isActive`    | `boolean`                                                                                                                                                   | `false`    | Applies active styling (visual only), with no `aria-pressed`. For a button that stays pressed, use `ToggleButton`.                                                                                                                                                                  |
| `isHovered`   | `boolean`                                                                                                                                                   | `false`    | Applies hovered styling (visual only).                                                                                                                                                                                                                                              |
| `isDisabled`  | `boolean`                                                                                                                                                   | `false`    | Applies disabled styling.                                                                                                                                                                                                                                                           |
| `className`   | `string`                                                                                                                                                    | —          | Custom class name.                                                                                                                                                                                                                                                                  |
| `textColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —          | Text color helper.                                                                                                                                                                                                                                                                  |
| `bgColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —          | Background color helper.                                                                                                                                                                                                                                                            |
| `children`    | `React.ReactNode`                                                                                                                                           | —          | Button content.                                                                                                                                                                                                                                                                     |
| `ref`         | `React.Ref<HTMLButtonElement>`                                                                                                                              | —          | Forwarded to the underlying element.                                                                                                                                                                                                                                                |
| `type`        | `'button'` \| `'submit'` \| `'reset'`                                                                                                                       | `'button'` | Button type. Defaults to `'button'`, so a part inside a form doesn't submit it. The arrow keys press Next and Back as a click does, so one given `'submit'` submits its form on an arrow key too.                                                                                   |
| `onClick`     | `React.MouseEventHandler<HTMLButtonElement>`                                                                                                                | —          | Runs before the part acts on the tour. Call `preventDefault()` to keep it from acting.                                                                                                                                                                                              |
| `...`         | All standard `<button>` attributes and Bulma helper props                                                                                                   | —          | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                   |

### Tour.Next

| Prop          | Type                                                                                                                                                        | Default     | Description                                                                                                                                                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`       | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'white'` \| `'light'` \| `'dark'` \| `'black'` \| `'text'` \| `'ghost'` | `'primary'` | Bulma color variant for the button. `ghost` renders a link-like button; `text` renders a minimal text-only button.                                                                                                                                                                  |
| `size`        | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                                          | —           | Size of the button.                                                                                                                                                                                                                                                                 |
| `isLight`     | `boolean`                                                                                                                                                   | `false`     | Applies a lighter color variant.                                                                                                                                                                                                                                                    |
| `isRounded`   | `boolean`                                                                                                                                                   | `false`     | Makes the button rounded.                                                                                                                                                                                                                                                           |
| `isLoading`   | `boolean`                                                                                                                                                   | `false`     | Displays a loading spinner, with everything inside the button hidden behind it, in forced colors (Windows' contrast themes) too. Under `prefers-reduced-motion: reduce` the spinner stops and stays drawn. Bulma alone hides only the label, so the rest needs bestax's CSS loaded. |
| `isStatic`    | `boolean`                                                                                                                                                   | `false`     | Makes the button non-interactive.                                                                                                                                                                                                                                                   |
| `isFullwidth` | `boolean`                                                                                                                                                   | `false`     | Makes the button full-width.                                                                                                                                                                                                                                                        |
| `isFullWidth` | `boolean`                                                                                                                                                   | `false`     | **Deprecated.** Use `isFullwidth` instead — `isFullwidth` wins if both are set. Makes the button full-width.                                                                                                                                                                        |
| `isOutlined`  | `boolean`                                                                                                                                                   | `false`     | Applies outlined styling (requires color).                                                                                                                                                                                                                                          |
| `isInverted`  | `boolean`                                                                                                                                                   | `false`     | Applies inverted styling (requires color).                                                                                                                                                                                                                                          |
| `isFocused`   | `boolean`                                                                                                                                                   | `false`     | Applies focused styling (visual only).                                                                                                                                                                                                                                              |
| `isActive`    | `boolean`                                                                                                                                                   | `false`     | Applies active styling (visual only), with no `aria-pressed`. For a button that stays pressed, use `ToggleButton`.                                                                                                                                                                  |
| `isHovered`   | `boolean`                                                                                                                                                   | `false`     | Applies hovered styling (visual only).                                                                                                                                                                                                                                              |
| `isDisabled`  | `boolean`                                                                                                                                                   | `false`     | Applies disabled styling.                                                                                                                                                                                                                                                           |
| `className`   | `string`                                                                                                                                                    | —           | Custom class name.                                                                                                                                                                                                                                                                  |
| `textColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —           | Text color helper.                                                                                                                                                                                                                                                                  |
| `bgColor`     | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`                                                                                     | —           | Background color helper.                                                                                                                                                                                                                                                            |
| `children`    | `React.ReactNode`                                                                                                                                           | —           | Button content.                                                                                                                                                                                                                                                                     |
| `ref`         | `React.Ref<HTMLButtonElement>`                                                                                                                              | —           | Forwarded to the underlying element.                                                                                                                                                                                                                                                |
| `type`        | `'button'` \| `'submit'` \| `'reset'`                                                                                                                       | `'button'`  | Button type. Defaults to `'button'`, so a part inside a form doesn't submit it. The arrow keys press Next and Back as a click does, so one given `'submit'` submits its form on an arrow key too.                                                                                   |
| `onClick`     | `React.MouseEventHandler<HTMLButtonElement>`                                                                                                                | —           | Runs before the part acts on the tour. Call `preventDefault()` to keep it from acting.                                                                                                                                                                                              |
| `...`         | All standard `<button>` attributes and Bulma helper props                                                                                                   | —           | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                   |

### Tour.Progress

| Prop        | Type                                                    | Default | Description                                        |
| ----------- | ------------------------------------------------------- | ------- | -------------------------------------------------- |
| `children`  | `React.ReactNode`                                       | —       | What the line says, in place of `labels.progress`. |
| `className` | `string`                                                | —       | Additional CSS classes.                            |
| `...`       | All standard `<span>` attributes and Bulma helper props | —       | See [Helper Props](../helpers/usebulmaclasses.md)  |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Tour` registers these variables on its own `.tour` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                             | Sass Variable                     | Default                                                                                 |
| ---------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| `--bulma-tour-z-index`                   | `$tour-z-index`                   | `$extras-z-index-modal`                                                                 |
| `--bulma-tour-overlay-background`        | `$tour-overlay-background`        | `hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.5)` |
| `--bulma-tour-spotlight-padding`         | `$tour-spotlight-padding`         | `0.5rem`                                                                                |
| `--bulma-tour-spotlight-radius`          | `$tour-spotlight-radius`          | `var(--bulma-radius)`                                                                   |
| `--bulma-tour-step-background`           | `$tour-step-background`           | `var(--bulma-scheme-main)`                                                              |
| `--bulma-tour-step-color`                | `$tour-step-color`                | `var(--bulma-text)`                                                                     |
| `--bulma-tour-step-border-color`         | `$tour-step-border-color`         | `var(--bulma-border-weak)`                                                              |
| `--bulma-tour-step-border-width`         | `$tour-step-border-width`         | `1px`                                                                                   |
| `--bulma-tour-step-radius`               | `$tour-step-radius`               | `var(--bulma-radius-large)`                                                             |
| `--bulma-tour-step-shadow`               | `$tour-step-shadow`               | `var(--bulma-shadow)`                                                                   |
| `--bulma-tour-step-max-width`            | `$tour-step-max-width`            | `min(24rem, calc(100vw - 2rem))`                                                        |
| `--bulma-tour-step-offset`               | `$tour-step-offset`               | `0.5rem`                                                                                |
| `--bulma-tour-step-header-padding`       | `$tour-step-header-padding`       | `0.75rem 1rem`                                                                          |
| `--bulma-tour-step-header-gap`           | `$tour-step-header-gap`           | `0.5rem`                                                                                |
| `--bulma-tour-step-header-color`         | `$tour-step-header-color`         | `var(--bulma-text-strong)`                                                              |
| `--bulma-tour-step-header-weight`        | `$tour-step-header-weight`        | `var(--bulma-weight-semibold)`                                                          |
| `--bulma-tour-step-body-padding`         | `$tour-step-body-padding`         | `1rem`                                                                                  |
| `--bulma-tour-step-footer-padding`       | `$tour-step-footer-padding`       | `0.75rem 1rem`                                                                          |
| `--bulma-tour-step-footer-gap`           | `$tour-step-footer-gap`           | `0.5rem`                                                                                |
| `--bulma-tour-progress-color`            | `$tour-progress-color`            | `var(--bulma-text-weak)`                                                                |
| `--bulma-tour-beacon-size`               | `$tour-beacon-size`               | `1.5rem`                                                                                |
| `--bulma-tour-beacon-color`              | `$tour-beacon-color`              | `var(--bulma-primary)`                                                                  |
| `--bulma-tour-beacon-ring-color`         | `$tour-beacon-ring-color`         | `var(--bulma-scheme-main)`                                                              |
| `--bulma-tour-beacon-ring-width`         | `$tour-beacon-ring-width`         | `2px`                                                                                   |
| `--bulma-tour-beacon-animation-duration` | `$tour-beacon-animation-duration` | `1.4s`                                                                                  |
| `--bulma-tour-beacon-z-index`            | `$tour-beacon-z-index`            | `$extras-z-index-dropdown - 1`                                                          |

<!-- /bestax:generated cssvars -->
