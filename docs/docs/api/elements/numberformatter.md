---
title: NumberFormatter
sidebar_label: NumberFormatter
description: The `NumberFormatter` component writes a number the way a locale writes it, such as a price, a percentage or a count, in a `<data>` element that keeps the number itself in its `value`.
keywords:
  - number formatter
  - format number
  - FormatNumber
  - FormattedNumber
  - currency
  - percentage
  - compact number
  - Intl.NumberFormat
  - useNumberFormat
---

# NumberFormatter

## Overview

<!-- bestax:generated overview -->

The `NumberFormatter` component writes a number the way a locale writes it, such as a price, a percentage or a count, in a `<data>` element that keeps the number itself in its `value`.

<!-- /bestax:generated overview -->

Reach for it wherever a number is shown to a reader: a price, a total or a balance, a count, a
percentage, a speed, or a figure on a dashboard. It writes the number the way the locale writes it,
so 1234.5 is 1,234.5 in English, 1.234,5 in German and 1 234,5 in French, with that locale's
currency symbols, percent signs and units. Chakra UI calls it `FormatNumber`, and react-intl
`FormattedNumber`.

It renders HTML's `<data>` element, which holds the formatted text and keeps the number itself in
its `value` attribute. For text outside JSX, such as an `aria-label` or a `placeholder`, the
[`useNumberFormat`](#the-usenumberformat-hook) hook gives the same formatting as a function.

:::info
Bulma has no number formatter, so `NumberFormatter` is a bestax extra. It brings no styles: the
`<data>` takes the font and color of the text around it, and the helper props style it like any
other element.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { NumberFormatter, useNumberFormat } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

Give it a `value`. With no `locale` and no `LocaleProvider` around it, it writes the number in the
runtime's locale, so this one is written the way your browser writes numbers.

```tsx live
<NumberFormatter value={1234567.891} />
```

### Currencies

`format` takes the options of
[`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options).
A currency needs `style: 'currency'` and its code, and the locale decides where the symbol goes.

```tsx live
<Paragraph>
  Order total:{' '}
  <NumberFormatter
    value={8456.4}
    locale="en-US"
    format={{ style: 'currency', currency: 'USD' }}
  />
</Paragraph>
```

The number renders as:

```html
<data value="8456.4">$8,456.40</data>
```

The `value` attribute holds the number as `String()` writes it, except that `-0` keeps its sign,
so `Number()` reads it back: `1e+21` for a very large number, `NaN` and `Infinity` as words, and
`-0`.

Options `Intl` refuses, such as `style: 'currency'` with no `currency`, throw its error while
rendering, as calling `Intl.NumberFormat` yourself would. A `locale` it doesn't accept, such as
`"en_US"` with an underscore, is ignored, with a warning in development, as `LocaleProvider` ignores
one, and the number is written in the provider's locale or the runtime's.

### Percentages, Units and Signs

`style: 'percent'` multiplies by 100, so pass a fraction. `style: 'unit'` takes one of the units
`Intl` knows, such as `kilometer-per-hour`, `megabyte` or `celsius`. `signDisplay: 'exceptZero'`
writes a plus before a rise and a minus before a fall, so the direction is in the text and not only
in a color.

```tsx live
<DescriptionList>
  <DescriptionList.Item
    label="Conversion rate"
    value={
      <NumberFormatter
        value={0.125}
        locale="en-US"
        format={{ style: 'percent', maximumFractionDigits: 1 }}
      />
    }
  />
  <DescriptionList.Item
    label="Average speed"
    value={
      <NumberFormatter
        value={12}
        locale="en-US"
        format={{ style: 'unit', unit: 'kilometer-per-hour' }}
      />
    }
  />
  <DescriptionList.Item
    label="Change"
    value={
      <NumberFormatter
        value={0.034}
        locale="en-US"
        format={{
          style: 'percent',
          signDisplay: 'exceptZero',
          maximumFractionDigits: 1,
        }}
      />
    }
  />
</DescriptionList>
```

### Compact Notation

`notation: 'compact'` shortens a large number the way the locale does: 123,456 is 123K in English,
123 k in French and 12万 in Japanese, while German writes it out and shortens from a million. A
screen reader reads it as written, so where the exact figure matters, show it too, such as in a
table under the chart, rather than only in a `title`, which touch and keyboard users can't reach.

```tsx live
<DescriptionList>
  {['en-US', 'fr-FR', 'ja-JP', 'de-DE'].map(locale => (
    <DescriptionList.Item
      key={locale}
      label={locale}
      value={
        <NumberFormatter
          value={123456}
          locale={locale}
          format={{ notation: 'compact' }}
        />
      }
    />
  ))}
</DescriptionList>
```

### Locales

Its own `locale` wins, then the `locale` of a `LocaleProvider` around it, then the runtime's.

```tsx live
<DescriptionList>
  {['en-US', 'de-DE', 'fr-FR', 'en-IN', 'ar-EG', 'ja-JP'].map(locale => (
    <DescriptionList.Item
      key={locale}
      label={locale}
      value={<NumberFormatter value={1234567.891} locale={locale} />}
    />
  ))}
</DescriptionList>
```

### In a LocaleProvider

Inside a [`LocaleProvider`](../helpers/localeprovider.md) with a `locale`, every `NumberFormatter`
writes in it unless it has a `locale` of its own, as the numbers the library writes itself do.

```tsx live
<LocaleProvider locale="fr-FR">
  <Paragraph>
    Vitesse moyenne :{' '}
    <NumberFormatter
      value={1234.5}
      format={{ style: 'unit', unit: 'kilometer-per-hour' }}
    />
  </Paragraph>
</LocaleProvider>
```

### Helper Props

The helper props and `className` land on the `<data>`, so a figure can be colored or weighted
without a wrapper. For a colored figure, give the `textColor` `colorShade="on-scheme"`, Bulma's
shade of each color for text on the page, which reads in light mode and dark. Put the words around
it outside the element: its text is the number.

```tsx live
<Title as="p" size="3">
  <NumberFormatter
    value={0.986}
    locale="en-US"
    format={{ style: 'percent', maximumFractionDigits: 1 }}
    textColor="success"
    colorShade="on-scheme"
  />{' '}
  uptime
</Title>
```

### The useNumberFormat Hook

`useNumberFormat` returns a function that writes numbers the way `NumberFormatter` does, for the
text JSX can't hold an element in: an `aria-label`, a `placeholder`, a `title`, a chart's axis or
a table cell's text. It takes an optional locale, which wins over the provider's.

```ts
function useNumberFormat(locale?: string): NumberFormatFunction;

type NumberFormatFunction = (
  value: number,
  options?: Intl.NumberFormatOptions
) => string;
```

```tsx live
function example() {
  const format = useNumberFormat('de-DE');
  return (
    <Input
      label="Monatliches Budget"
      placeholder={format(1500, { style: 'currency', currency: 'EUR' })}
    />
  );
}
```

The function stays the same from render to render for one locale, so it's safe in a dependency
array. Formatters are built once for each locale and set of options and shared, so a page of
numbers written the same way builds one.

### A Number That Changes

`NumberFormatter` isn't a live region, so a screen reader doesn't announce a new value. For the one
figure that should be announced, such as a cart's total, put it in an element with
`role="status"`, which announces its text politely when it changes. Announcing every figure on a
dashboard that updates would be noise.

```tsx live
function example() {
  const [items, setItems] = React.useState(1);
  return (
    <>
      <Buttons>
        <Button onClick={() => setItems(n => n + 1)}>Add one</Button>
      </Buttons>
      <Paragraph role="status">
        Total:{' '}
        <NumberFormatter
          value={(items * 1999) / 100}
          locale="en-US"
          format={{ style: 'currency', currency: 'USD' }}
        />
      </Paragraph>
    </>
  );
}
```

### Server Rendering

With no `locale` and no `LocaleProvider`, the text comes from the runtime's locale: the server's on
the server and the reader's in the browser. Where those differ, the two renders don't match and
React reports a hydration mismatch. Give it a `locale`, or put a `LocaleProvider` with one around
the app, and the server and the browser write the same text, as the date pickers do. Different
engines can still write a few locales differently, since each ships its own copy of the locale
data, so check the locales you serve in the browsers you support.

```tsx title="app/layout.tsx"
import type { ReactNode } from 'react';
import { LocaleProvider } from '@allxsmith/bestax-bulma';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de-DE">
      <body>
        <LocaleProvider locale="de-DE">{children}</LocaleProvider>
      </body>
    </html>
  );
}
```

---

## Accessibility

- **No role:** `<data>` maps to no role, so a screen reader reads the formatted text, with the
  locale's currency symbol, percent sign, units and sign, as it would read the same text anywhere
  else.
- **Compact notation** is read as written ("123K"). Show the exact figure too where it matters.
- **Language:** a `locale` that differs from the page's language changes how the number is
  written, not the voice that reads it. A passage in another language still needs `lang` on its
  container, which `LocaleProvider` sets.
- **Not live:** a changing value isn't announced. Wrap the one figure that should be in a
  `role="status"` element, as in [A Number That Changes](#a-number-that-changes).
- **Not color alone:** for a rise or a fall, write the sign with `signDisplay`, so the direction
  doesn't depend on a `textColor`.

---

## Related Components

- [`LocaleProvider`](../helpers/localeprovider.md): Sets the locale for everything inside it,
  `NumberFormatter` included.
- [`Numberinput`](../form/numberinput.md): For a number the user types.
- [`DescriptionList`](./descriptionlist.md): A label for each figure.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: NumberFormatter Stories](https://bestax.io/storybook/?path=/story/elements-numberformatter--default)
- [MDN: `Intl.NumberFormat()` options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options)
- [MDN: the `<data>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data)
- [ECMA-402: the units `Intl` knows](https://tc39.es/ecma402/#table-sanctioned-single-unit-identifiers)

---

## Props

<!-- bestax:generated props -->

| Prop        | Type                                                                    | Default | Description                                                                                                                                                                                                                                                                                                                                                                              |
| ----------- | ----------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className` | `string`                                                                | —       | Additional CSS classes to apply.                                                                                                                                                                                                                                                                                                                                                         |
| `value`     | `number`                                                                | —       | The number. The text is what `Intl.NumberFormat` writes for it, `NaN` and `Infinity` included. The `<data>` element's `value` attribute holds it as `String()` writes it, except that `-0` keeps its sign, so `Number()` reads it back: `1234.5`, `1e+21` for a very large one and `1e-7` for a very small one, `NaN`, `Infinity` and `-0`.                                              |
| `format`    | `Intl.NumberFormatOptions`                                              | —       | `Intl.NumberFormat` options: a currency, a percentage, a unit, compact notation, the fraction digits, the sign. Options `Intl` refuses, such as `style: 'currency'` with no `currency`, throw its error.                                                                                                                                                                                 |
| `locale`    | `string`                                                                | —       | BCP 47 locale tag. Unset, it's the `locale` of a `LocaleProvider` around it, and with neither, the runtime's own. On a server render that's the server's, so give it a locale, here or through a `LocaleProvider`, where the server's and the browser's can differ. A tag `Intl` refuses, such as `"en_US"`, is ignored, with a warning in development, as `LocaleProvider` ignores one. |
| `textColor` | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Text color helper.                                                                                                                                                                                                                                                                                                                                                                       |
| `bgColor`   | [Bulma color](../helpers/valid-values.md) \| `'inherit'` \| `'current'` | —       | Background color helper.                                                                                                                                                                                                                                                                                                                                                                 |
| `ref`       | `React.Ref<HTMLDataElement>`                                            | —       | Ref forwarded to the `<data>`.                                                                                                                                                                                                                                                                                                                                                           |
| `...`       | All standard `<data>` attributes and Bulma helper props                 | —       | See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                                                                                                                                                                                                                        |

<!-- /bestax:generated props -->
