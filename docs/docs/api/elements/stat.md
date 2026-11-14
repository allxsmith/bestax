---
title: Stat
sidebar_label: Stat
description: The `Stat` component shows a figure with its name, and often a change and a note, such as a dashboard's revenue or an account's storage used.
keywords:
  - stat
  - statistic
  - Statistic
  - KPI
  - metric
  - key figure
  - dashboard
  - trend
  - change
---

# Stat

## Overview

<!-- bestax:generated overview -->

The `Stat` component shows a figure with its name, and often a change and a note, such as a dashboard's revenue or an account's storage used.

<!-- /bestax:generated overview -->

Reach for it wherever a page leads with a number: the key figures at the top of a dashboard, the
usage on an account page, the totals above a report, or one headline figure in a card. Ant Design
calls it a Statistic.

It's a label and its values in HTML's description list: a `<dt>` for the label, then a `<dd>` each
for the figure, the change and the note. A row of them is [`Stats`](./stats.md), one list for the
whole row; a Stat on its own renders its own. A number is written by
[`NumberFormatter`](./numberformatter.md), so it follows a `LocaleProvider`, and a change is
written with its sign, "+12%", so the direction is in the text as well as in the arrow and the
color.

:::info
Bulma has no stat, so `Stat` brings its own styles, in `bestax.css` and its variants, or in
`extras.css` next to your own Bulma.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Stat } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `label` and a `value`. A number `value` is written by `NumberFormatter`, with `format`
as its `Intl.NumberFormat` options. Add a `change` and a `description` for the trend and what it's
measured against.

```tsx live
<Stat
  label="Revenue"
  value={8456.4}
  format={{ style: 'currency', currency: 'USD' }}
  locale="en-US"
  change={0.12}
  description="since last month"
/>
```

### A Row of Stats

Several figures go in [`Stats`](./stats.md), which lays them out on Bulma's grid as one list.
Name the row by the heading above it with `aria-labelledby`.

```tsx live
<>
  <Title as="h2" textSize="5" id="stat-kpis">
    This month
  </Title>
  <Stats aria-labelledby="stat-kpis" minCol={8} gap={4}>
    <Stat
      label="Revenue"
      value={8456.4}
      format={{ style: 'currency', currency: 'USD' }}
      locale="en-US"
      change={0.12}
    />
    <Stat label="New customers" value={1234} locale="en-US" change={-0.019} />
    <Stat
      label="Churn"
      value={0.021}
      format={{ style: 'percent', maximumFractionDigits: 1 }}
      locale="en-US"
      change={0.004}
      changeColor="danger"
    />
  </Stats>
</>
```

### Formatting the Figure

`format` takes any `Intl.NumberFormat` options: a currency, a percentage of a fraction, a unit,
compact notation or the fraction digits. The text follows the locale, here the Stat's own
`locale`, else a `LocaleProvider`'s around it, else the runtime's.

```tsx live
<Stats minCol={8} gap={4}>
  <Stat
    label="Storage used"
    value={31}
    format={{ style: 'unit', unit: 'gigabyte' }}
    locale="en-US"
  />
  <Stat
    label="Requests"
    value={1234567}
    format={{ notation: 'compact' }}
    locale="en-US"
  />
  <Stat
    label="Umsatz"
    value={8456.4}
    format={{ style: 'currency', currency: 'EUR' }}
    locale="de-DE"
  />
</Stats>
```

### Changes

`change` is written through `NumberFormatter` with its sign: `0.12` reads "+12%", `-0.019` reads
"-1.9%", and `0` reads "0%". An arrow up or down repeats the direction, and the color is the
sign's, green up and red down, with neither at zero. A change that rounds to zero, such as
`0.0004`, reads "0%" and gets no arrow and no color, so they never contradict the text.

```tsx live
<Stats minCol={8} gap={4}>
  <Stat label="Up" value={1280} change={0.12} locale="en-US" />
  <Stat label="Down" value={1180} change={-0.019} locale="en-US" />
  <Stat label="Flat" value={1200} change={0} locale="en-US" />
</Stats>
```

### When Up Is Bad News

The arrow follows the sign, and the color says whether that's good. Where a rise is bad, such as a
cost, a churn rate or an error rate, set `changeColor`, which takes the colors `messageColor`
does. It changes the color only, never the arrow or the sign.

```tsx live
<Stats minCol={8} gap={4}>
  <Stat
    label="Churn"
    value={0.021}
    format={{ style: 'percent', maximumFractionDigits: 1 }}
    change={0.004}
    changeColor="danger"
    locale="en-US"
  />
  <Stat
    label="Errors"
    value={12}
    change={-0.4}
    changeColor="success"
    locale="en-US"
  />
</Stats>
```

### Your Own Change Format

With the default, a change is a fraction written as a percentage with up to one decimal place.
`changeFormat` replaces that with options of your own, such as an amount, and the sign is added
back unless you set a `signDisplay` yourself. The default isn't merged in, since its
`maximumFractionDigits` would clash with a currency's.

```tsx live
<Stats minCol={8} gap={4}>
  <Stat
    label="Revenue"
    value={8456.4}
    format={{ style: 'currency', currency: 'USD' }}
    change={1250}
    changeFormat={{ style: 'currency', currency: 'USD' }}
    locale="en-US"
  />
  <Stat
    label="Score"
    value={87}
    change={-3}
    changeFormat={{ maximumFractionDigits: 0 }}
    locale="en-US"
  />
</Stats>
```

### Sizes

`size` steps the figure through Bulma's size scale. The label, the change and the note stay
small.

```tsx live
<Stats minCol={8} gap={4}>
  <Stat label="Small" value={1234} size="small" locale="en-US" />
  <Stat label="Default" value={1234} locale="en-US" />
  <Stat label="Medium" value={1234} size="medium" locale="en-US" />
  <Stat label="Large" value={1234} size="large" locale="en-US" />
</Stats>
```

### Loading

`loading` puts a `Skeleton` in place of the value, one line of the figure tall, so the tile keeps
its height when the figure arrives, and sets `aria-busy` on the Stat. The label, the change and
the note render as given. With a `Stat.Value` child, it only sets `aria-busy`: the child renders as
given, so put a `Skeleton` in it yourself.

```tsx live
<Stats minCol={8} gap={4}>
  <Stat label="Revenue" loading description="since last month" />
  <Stat label="Orders" value={321} description="since last month" />
</Stats>
```

### A Value That Isn't a Number

A `value` that isn't a number renders as given, and `format` does nothing to it, so a figure that
isn't known can say so in words. `0` renders, and `undefined`, `null`, a boolean and `''` render
nothing.

The figure's `<dd>` follows one rule. A `Stat.Value` child is the figure, and then `value` and its
`<dd>` are left out. Without one, the `<dd>` renders when there's a figure, a `value` or
`loading`, or a label, the `label` prop or a `Stat.Label` child. So a label whose value hasn't
arrived keeps its definition in the list, in a `<dd>` that stays one line of the figure tall, and
the tile doesn't jump when the figure comes. The Stat finds those parts among its children by
type, so a part rendered from inside a component of your own isn't seen.

A Stat needs a label: it names the figure, and a definition list's values belong to a term. A
Stat with neither a `label` nor a `Stat.Label` child warns in development.

```tsx live
<Stat label="Revenue" value="N/A" description="no sales yet this month" />
```

### A Surface

A Stat is text on the page's background. For a card look, put a lone Stat, or a whole
[`Stats`](./stats.md) row, in a [`Box`](./box.md), or give it `bgColor` and padding with the
helper props. A `Box` can't go around one Stat inside a row: the row is a list that holds only its
Stats, so a wrapper there breaks the list. Give a Stat in a row its surface with helper props on
the Stat itself.

```tsx live
<Box>
  <Stat label="Storage used" value="31 GB" description="of 50 GB" />
</Box>
```

### A Figure That Should Be Announced

A Stat isn't a live region, so a screen reader doesn't announce a new figure. For the one figure
that should be, wrap a lone Stat in an element with `role="status"`, which reads the whole Stat,
its label included, politely when it changes. Keep that Stat out of a `Stats` row, since a wrapper
can't sit inside the row's list. Announcing every figure on a dashboard that refreshes would be
noise.

```tsx live
function example() {
  const [orders, setOrders] = React.useState(320);
  return (
    <>
      <Buttons>
        <Button onClick={() => setOrders(n => n + 1)}>New order</Button>
      </Buttons>
      <div role="status">
        <Stat label="Orders today" value={orders} locale="en-US" />
      </div>
    </>
  );
}
```

### Compound (dot-notation) usage

`Stat.Label`, `Stat.Value`, `Stat.Change` and `Stat.Description` are the parts, also exported by
name as `StatLabel`, `StatValue`, `StatChange` and `StatDescription`. Use them for what the props
don't cover: a unit written by `NumberFormatter`, an info tip in the label, a
[`RingProgress`](./ringprogress.md) beside the figure, or a change where down is good. Inside the
part, `Stat.Change` takes `value`, `format`, `locale` and `color`.

```tsx live
<Stats minCol={10} gap={4}>
  <Stat>
    <Stat.Label>
      Storage used{' '}
      <Popover
        ariaLabel="About storage used"
        trigger={
          <Button size="small" color="ghost" aria-label="About storage used">
            <Icon name="circle-info" />
          </Button>
        }
      >
        <Popover.Body>Photos, files and backups.</Popover.Body>
      </Popover>
    </Stat.Label>
    <Stat.Value display="flex" alignItems="center" gap="3">
      <RingProgress value={62} size="small" label="Storage used">
        62%
      </RingProgress>
      <NumberFormatter
        value={31}
        format={{ style: 'unit', unit: 'gigabyte' }}
        locale="en-US"
      />
    </Stat.Value>
    <Stat.Description>of 50 GB</Stat.Description>
  </Stat>
  <Stat>
    <Stat.Label>Median response time</Stat.Label>
    <Stat.Value>
      <NumberFormatter
        value={182}
        format={{ style: 'unit', unit: 'millisecond' }}
        locale="en-US"
      />
    </Stat.Value>
    <Stat.Change value={-0.08} color="success" locale="en-US" />
  </Stat>
</Stats>
```

---

## Accessibility

- **HTML's own elements, and no roles:** a `<dl>` on its own, or a `<div>` in the row's `<dl>`,
  with a `<dt>` for the label and a `<dd>` each for the figure, the change and the note. Browsers
  expose them as a list, a term and its definitions, so a screen reader reads the label, then the
  figure, the change and the note, in that order.
- **The direction is in the text's sign:** the default format writes a change with its sign,
  "+12%" or "-1.9%", in the locale's form, so a screen reader hears it with no extra words to
  translate. The arrow is hidden
  from assistive tech, and the color repeats the direction rather than carry it.
- **Contrast:** the label and the note are in Bulma's `text-weak`, and a change in its color's
  `-on-scheme` variant, the one Bulma adjusts for text on the scheme's background. Each clears
  WCAG's 4.5:1 against Bulma's page background in light and dark mode.
- **Forced colors:** the text and the arrow take the system's text color, so the tone is gone and
  the sign and the arrow carry the direction. The loading `Skeleton` is drawn as a background,
  which forced colors removes, so there the figure's place is empty while it loads.
- **Loading:** `aria-busy` on the Stat while the `Skeleton` shows.
- **Not interactive and not live:** it has no tab stop and announces nothing when it changes; see
  [A Figure That Should Be Announced](#a-figure-that-should-be-announced).
- **Info tips:** a real button named "About" and the label, opening a `Popover`, as in the
  [compound example](#compound-dot-notation-usage), rather than a tip that opens on hover.

---

## Related Components

- [`Stats`](./stats.md): A row of Stats as one list.
- [`NumberFormatter`](./numberformatter.md): Writes the figure and the change.
- [`DescriptionList`](./descriptionlist.md): Facts about one thing, as rows of labels and values.
- [`RingProgress`](./ringprogress.md): A ring beside the figure.
- [`Skeleton`](./skeleton.md): What `loading` shows.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Stat Stories](https://bestax.io/storybook/?path=/story/elements-stat--default)
- [MDN: The description list element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl)
- [MDN: `signDisplay`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#signdisplay)
- [W3C: Understanding Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)

---

## Props

<!-- bestax:generated props -->

| Prop           | Type                                                                            | Default                                                                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `className`    | `string`                                                                        | —                                                                           | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `label`        | `React.ReactNode`                                                               | —                                                                           | What the figure is ("Revenue"), as a `Stat.Label` before the children. A Stat needs one, here or as a `Stat.Label` child: it's the figure's name for assistive tech, and a definition list's values belong to a term. A Stat with neither a `label` nor a `Stat.Label` child warns in development.                                                                                                                                                                                         |
| `value`        | `React.ReactNode`                                                               | —                                                                           | The figure, as a `Stat.Value` after the children. A number is written by `NumberFormatter` with `format` and `locale`; anything else, such as "N/A", renders as given, and `0` renders. `undefined`, `null`, a boolean and `''` leave it empty, and its `<dd>` still renders, one line of the figure tall, while the Stat has a label, so the label keeps its definition while the figure is missing. A `Stat.Value` child takes its place: with one, `value` and its `<dd>` are left out. |
| `format`       | `Intl.NumberFormatOptions`                                                      | —                                                                           | `Intl.NumberFormat` options for a number `value`, as NumberFormatter's `format`. A `value` that isn't a number ignores it.                                                                                                                                                                                                                                                                                                                                                                 |
| `locale`       | `string`                                                                        | —                                                                           | The locale for `value` and `change`, as NumberFormatter's `locale`. Unset, it's the `LocaleProvider`'s around it, and with neither, the runtime's own, so give one, here or through a `LocaleProvider`, on a page rendered on the server.                                                                                                                                                                                                                                                  |
| `change`       | `number`                                                                        | —                                                                           | The change, as a `Stat.Change` after the value. With the default format it's a fraction (`0.12` for 12%); with your own `changeFormat`, it's in that format's terms. It's written with its sign, so the direction is in the text.                                                                                                                                                                                                                                                          |
| `changeFormat` | `Intl.NumberFormatOptions`                                                      | `{ style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 }` | `Intl.NumberFormat` options for `change`. Yours replace the default, and `signDisplay: 'exceptZero'` is added unless you set a `signDisplay`. With `signDisplay: 'never'`, or `'negative'` on a rise, the text carries no direction: the arrow is hidden from assistive tech and the tone is color alone, so keep a sign, or say the direction in `description`.                                                                                                                           |
| `changeColor`  | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —                                                                           | The change's color. Unset, it's the sign's: `success` up, `danger` down, and none at zero. Set it where up is bad news, such as a cost or an error rate.                                                                                                                                                                                                                                                                                                                                   |
| `description`  | `React.ReactNode`                                                               | —                                                                           | A note under the figure ("since last month"), as a `Stat.Description` last.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `size`         | `'small'` \| `'medium'` \| `'large'`                                            | —                                                                           | The figure's size, a step of Bulma's size scale. The label, the change and the note stay small.                                                                                                                                                                                                                                                                                                                                                                                            |
| `loading`      | `boolean`                                                                       | `false`                                                                     | Shows a `Skeleton` in place of `value`, one line of the figure tall, and sets `aria-busy` on the Stat. The label, the change and the note render as given. With a `Stat.Value` child, it only sets `aria-busy`: the child renders as given, so put a `Skeleton` in it yourself.                                                                                                                                                                                                            |
| `children`     | `React.ReactNode`                                                               | —                                                                           | `Stat.Label`, `Stat.Value`, `Stat.Change` and `Stat.Description`, for anything the props don't cover, such as a unit or an info tip. They render between `label` and `value`. They're this Stat's own parts, so not another Stat: that would be a list inside this one's. The Stat finds a `Stat.Label` or `Stat.Value` among them by type, so one rendered from inside a component of your own isn't seen.                                                                                |
| `textColor`    | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —                                                                           | Text color helper. It colors the figure; the label, the change and the note keep their own colors. Inside `Stats`, a Stat without one takes the row's.                                                                                                                                                                                                                                                                                                                                     |
| `bgColor`      | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'`         | —                                                                           | Background color helper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ref`          | `React.Ref<HTMLElement>`                                                        | —                                                                           | Ref forwarded to the root, a `<div>` inside `Stats` or a `<dl>` on its own.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `...`          | All standard HTML attributes and Bulma helper props                             | —                                                                           | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                                                                                                                          |

**Subcomponents:**

- `Stat.Label`: What the figure is: a `<dt>`, small and in the weaker text color.
- `Stat.Value`: The figure: a `<dd>`, large, in the Stat's color, with digits of one width so a figure that updates doesn't shift.
- `Stat.Change`: A change written with its sign, such as "+12%", after an arrow that repeats the direction: a `<dd>`, green when it's up and red when it's down unless `color` says otherwise. The sign is in the text, written by `Intl` for the locale, so a screen reader hears the direction; the arrow is hidden from assistive tech, and the color repeats the direction for sighted readers rather than carry it.
- `Stat.Description`: A note under the figure: a `<dd>`, small and in the weaker text color.

### Stat.Label

| Prop        | Type                                                                    | Default | Description                                                                                                                               |
| ----------- | ----------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                          |
| `children`  | `React.ReactNode`                                                       | —       | The label. A button may sit in it, such as one that opens a `Popover` about the figure, but not a heading, which HTML doesn't allow here. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                        |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                  |
| `ref`       | `React.Ref<HTMLElement>`                                                | —       | Ref forwarded to the `<dt>`.                                                                                                              |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                         |

### Stat.Value

| Prop        | Type                                                                    | Default | Description                                                                   |
| ----------- | ----------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                                              |
| `children`  | `React.ReactNode`                                                       | —       | The figure, written as you give it, so write a number with `NumberFormatter`. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                            |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                      |
| `ref`       | `React.Ref<HTMLElement>`                                                | —       | Ref forwarded to the `<dd>`.                                                  |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md)                             |

### Stat.Change

| Prop        | Type                                                                            | Default                                                                     | Description                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                        | —                                                                           | Additional CSS classes to apply.                                                                                                                                                          |
| `value`     | `number`                                                                        | —                                                                           | The change, as Stat's `change`. One that rounds to zero in its format, such as `0.0004` at one decimal place of a percentage, reads as zero, so it gets no arrow and no color of its own. |
| `format`    | `Intl.NumberFormatOptions`                                                      | `{ style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 }` | As Stat's `changeFormat`: yours replace the default, and `signDisplay: 'exceptZero'` is added unless you set a `signDisplay`.                                                             |
| `locale`    | `string`                                                                        | —                                                                           | As Stat's `locale`. Unset, the Stat's.                                                                                                                                                    |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` | —                                                                           | As Stat's `changeColor`. Unset, it's the sign's: `success` up, `danger` down, and none at zero. Set, it applies at zero too.                                                              |
| `ref`       | `React.Ref<HTMLElement>`                                                        | —                                                                           | Ref forwarded to the `<dd>`.                                                                                                                                                              |
| `...`       | All standard HTML attributes and Bulma helper props                             | —                                                                           | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                         |

### Stat.Description

| Prop        | Type                                                                    | Default | Description                                       |
| ----------- | ----------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                  |
| `children`  | `React.ReactNode`                                                       | —       | The note, such as "since last month".             |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                          |
| `ref`       | `React.Ref<HTMLElement>`                                                | —       | Ref forwarded to the `<dd>`.                      |
| `...`       | All standard HTML attributes and Bulma helper props                     | —       | See [Helper Props](../helpers/usebulmaclasses.md) |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Stat` registers these variables on its own `.stat` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                     | Sass Variable             | Default                        |
| -------------------------------- | ------------------------- | ------------------------------ |
| `--bulma-stat-label-color`       | `$stat-label-color`       | `var(--bulma-text-weak)`       |
| `--bulma-stat-label-size`        | `$stat-label-size`        | `var(--bulma-size-7)`          |
| `--bulma-stat-value-color`       | `$stat-value-color`       | `var(--bulma-text-strong)`     |
| `--bulma-stat-value-size`        | `$stat-value-size`        | `var(--bulma-size-3)`          |
| `--bulma-stat-value-weight`      | `$stat-value-weight`      | `var(--bulma-weight-semibold)` |
| `--bulma-stat-value-line-height` | `$stat-value-line-height` | `1.125`                        |
| `--bulma-stat-change-color`      | `$stat-change-color`      | `var(--bulma-text)`            |
| `--bulma-stat-change-size`       | `$stat-change-size`       | `var(--bulma-size-7)`          |
| `--bulma-stat-change-gap`        | `$stat-change-gap`        | `0.25em`                       |
| `--bulma-stat-description-color` | `$stat-description-color` | `var(--bulma-text-weak)`       |
| `--bulma-stat-description-size`  | `$stat-description-size`  | `var(--bulma-size-7)`          |

<!-- /bestax:generated cssvars -->
