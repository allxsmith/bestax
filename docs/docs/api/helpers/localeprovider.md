---
title: LocaleProvider
sidebar_label: LocaleProvider
---

# LocaleProvider

## Overview

`LocaleProvider` sets the language and writing direction for the part of the app inside it, on a wrapper `<div>` and on what the library portals out of it.

It takes a `locale` and a `dir`, and each works alone. A `locale` such as `"ar-EG"` becomes the wrapper's `lang`, and its script decides the direction, so `dir="rtl"` comes with it. A `dir` sets the direction whatever the locale, for a right-to-left layout with no particular language, or a locale whose script reads one way on a page laid out the other. A nested provider keeps whatever it leaves unset.

The direction lives on the wrapper as a `dir` attribute, so CSS follows it, and so do the components that read the direction they're laid out in, as they follow `<html dir>`. A page whose `<html>` already has `dir="rtl"` needs no provider for that. What the provider adds is the rest:

- a section of the page in another language or direction than the page around it;
- the content the library portals to the end of `document.body`, such as a `Popover` panel, a `Modal` with `portal`, a `Toast` or a `Portal`'s children, which leaves the section it came from and gets the provider's `dir` and `lang` back;
- the date and time pickers inside, which take its `locale` and start the week on that locale's first day.

Without a provider none of this changes: a picker uses the runtime's own locale and starts the week on Sunday, as it always has.

---

## Import

```tsx
import { LocaleProvider, useLocale } from '@allxsmith/bestax-bulma';
```

---

## Hooks

### useLocale

Returns the `locale` and `dir` the nearest provider sets, both `undefined` outside one. The locale is in its canonical form, so `"en-us"` comes back as `"en-US"`. Use it for your own `Intl` calls, so they match the components around them, or for `dir` and `lang` on content you portal yourself.

```tsx
function Price({ amount }: { amount: number }) {
  const { locale } = useLocale();
  return (
    <span>
      {new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
      }).format(amount)}
    </span>
  );
}
```

It isn't the direction of the page: with no provider, or one that sets no direction, `<html dir>` still decides. To act on the direction an element is laid out in, read `getComputedStyle(element).direction`.

---

## Usage

### A Right-to-Left Section

A `locale` alone sets the direction of its script. Arabic reads right to left, so the wrapper gets `dir="rtl"` and `lang="ar-EG"`, and the steps lay out from the right.

```tsx live
<LocaleProvider locale="ar-EG">
  <Steps
    value={1}
    items={[{ label: 'السلة' }, { label: 'الشحن' }, { label: 'الدفع' }]}
  />
</LocaleProvider>
```

The wrapper is a plain `<div>` with no class of its own. It takes the helper props and any other attributes, and forwards its `ref`.

### Direction Only

`dir` sets the direction and leaves the language alone. It also wins over a `locale`'s own direction.

```tsx live
<LocaleProvider dir="rtl">
  <Buttons>
    <Button color="primary">First</Button>
    <Button>Second</Button>
  </Buttons>
</LocaleProvider>
```

### Nested Providers

An inner provider keeps whatever it leaves unset. One that sets only a `locale` takes that locale's direction, so a French quote inside a Hebrew section reads left to right, and one that sets only a `dir` keeps the outer locale.

```tsx live
<LocaleProvider locale="he">
  <Content>
    <p>הציטוט האהוב עליי:</p>
    <LocaleProvider locale="fr">
      <blockquote>La simplicité est la sophistication suprême.</blockquote>
    </LocaleProvider>
  </Content>
</LocaleProvider>
```

### Date Pickers

The date and time pickers take the provider's `locale` unless they have their own, for their day and month names and any `Intl` format. Inside a provider, the week starts on the first day of the locale the picker uses: Monday for `"de"`, Saturday for `"ar-EG"`, Sunday for `"en-US"`. A picker's own `firstDayOfWeek` still wins.

```tsx live
<LocaleProvider locale="de">
  <DateInput inline label="Liefertermin" />
</LocaleProvider>
```

Outside a provider a picker keeps Sunday, even with a `locale` of its own, so pages that never asked for a different first day don't get one. The first day comes from a copy of [CLDR](https://cldr.unicode.org/)'s week data that the library carries, rather than from each browser's, because browsers disagree about a few regions, China among them, and a calendar rendered on the server has to come out the same in the browser. A `-u-fw-` extension in the tag, such as `"en-US-u-fw-mon"`, picks the day outright.

### Portaled Content

What the library portals renders outside the provider's wrapper, at the end of `document.body` or in the `portalContainer` a [`ConfigProvider`](./config.md) sets. Inside a provider, that content sits in a `<div>` carrying the provider's `dir` and `lang`, with `display: contents`, so it adds no box and changes no layout. That covers a `Portal`'s children, a `Popover`, `HoverCard` or `ContextMenu` panel, a `Combobox` menu or picker popover with `appendToBody`, a `Modal` or `Dialog` with `portal`, a `Sidebar`, and toasts and notifications.

```tsx live
<LocaleProvider locale="fa">
  <Popover trigger={<Button>جزئیات</Button>} appendToBody>
    <Popover.Body>
      این پنل بیرون از بخش رندر می‌شود و همچنان راست‌به‌چپ است.
    </Popover.Body>
  </Popover>
</LocaleProvider>
```

For content you portal yourself without `Portal`, put the values from `useLocale()` on it.

### Server Rendering

The wrapper's `dir` and `lang` come from its props, so the server and the browser write the same ones, and portaled content only renders after hydration.

Set a `locale` when an `inline` picker renders on the server. With none, `Intl` names its days in the runtime's own language, which is the server's on the server and the reader's in the browser, and the two renders don't match when those differ. With a locale they match, as long as the server's `Intl` data and the browser's spell the names alike. They don't always: Node and Safari write the short name for Saturday differently in Arabic. Where that matters, pass the picker its own `dayNames`.

For an app that's in one language throughout, also set `lang` and `dir` on `<html>` in your page shell. That reaches what sits outside any provider, and the provider still carries them onto portaled content.

```tsx
// app/layout.tsx in Next.js
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar-EG" dir="rtl">
      <body>
        <LocaleProvider locale="ar-EG">{children}</LocaleProvider>
      </body>
    </html>
  );
}
```

### A Locale Intl Doesn't Accept

A tag `Intl` refuses, such as `"en_US"` with an underscore, is ignored: the provider writes no `lang`, keeps an outer provider's locale, and warns once in development. A picker's own `locale` isn't checked this way, and `Intl` throws on such a tag when the picker formats with it, as it always has.

---

## Accessibility

- `lang` tells a screen reader which voice and pronunciation to use, and a translation tool what it's reading. The provider puts it on its wrapper and on portaled content, so a dialog or a notification announced from the end of the page comes in the same language.
- `dir` decides the reading order of the content inside, and which side text starts on. Set the one the content is written in: a left-to-right quote in a right-to-left page needs its own provider or `dir`.
- The provider changes no focus order and adds no role. The element it wraps portaled content in has `display: contents`, so it adds no box and no landmark.

---

## Related Components

- [`ConfigProvider`](./config.md): The class prefix, icon library and portal container. A nested one replaces the outer one's settings, which is why the locale lives here instead.
- [`Portal`](./portal.md): Inside a `LocaleProvider`, its children keep the provider's `dir` and `lang`.
- [`DateInput`](../form/datetime/dateinput.md): Takes the provider's locale and first day of the week.
- [`Theme`](./theme.md): Its scoped wrapper is the same idea for CSS variables.

---

## Additional Resources

- [Storybook: LocaleProvider Stories](https://bestax.io/storybook/?path=/story/helpers-localeprovider--default)
- [W3C: Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir)
- [MDN: the `lang` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang)
- [MDN: `Intl.Locale.prototype.getWeekInfo()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getWeekInfo)

---

## Props

| Prop       | Type               | Default | Description                                                                                                                                                                                                                                |
| ---------- | ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `locale`   | `string`           | —       | A BCP 47 language tag, such as `"de"` or `"ar-EG"`: the wrapper's `lang`, the pickers' default `locale`, and, with no `dir`, the direction of its script. Unset, a nested provider keeps the outer one's. A tag `Intl` refuses is ignored. |
| `dir`      | `'ltr'` \| `'rtl'` | —       | The direction, whatever the locale. Unset, it follows this provider's `locale`, else an outer provider's direction, else the page's.                                                                                                       |
| `children` | `ReactNode`        | —       | The part of the app it covers.                                                                                                                                                                                                             |

The helper props, the other attributes of a `<div>` and the `ref` land on the wrapper.
