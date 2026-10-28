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
- the date and time pickers inside, which take its `locale` and start the week on that locale's first day;
- the numbers the library writes, such as page numbers, badge counts and a slider's output, and the filtering in `Combobox`, `Autocomplete`, `Taginput` and `Command`, which follow the `locale` too.

Without a provider none of this changes: a picker uses the runtime's own locale and starts the week on Sunday, numbers are written as they always have been, and filtering ignores case only.

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

The date and time pickers take the provider's `locale` unless they have their own, for their day and month names and any `Intl` format. Inside a provider, the week starts on the first day of the locale the picker uses: Monday for `"de"`, Saturday for `"ar-EG"`, Sunday for `"en-US"`. A picker's own `firstDayOfWeek` still wins, and a picker with its own `dayNames` keeps Sunday unless it sets `firstDayOfWeek` too, since it shows those names exactly as given.

```tsx live
<LocaleProvider locale="de">
  <DateInput inline label="Liefertermin" />
</LocaleProvider>
```

Outside a provider a picker keeps Sunday, even with a `locale` of its own, so pages that never asked for a different first day don't get one. The first day comes from a copy of [CLDR](https://cldr.unicode.org/)'s week data that the library carries, rather than from each browser's, because browsers disagree about a few regions, China among them, and a calendar rendered on the server has to come out the same in the browser. A `-u-fw-` extension in the tag, such as `"en-US-u-fw-mon"`, picks the day outright.

### Numbers and Matching

With a `locale`, the numbers the library writes itself are written the way that locale writes them, with its digits and separators: `Pagination`'s page numbers, `Steps` markers, a `Badge` count, the `Avatars` surplus, a `RingProgress` in sections, `Rate`'s score, the `Slider` output, `Taginput`'s counter and the count of files `File` shows. Where an accessible name repeats a number on screen, as a page link's does, it's written the same way, so the name still holds the text. A label function you pass, such as `getPageLabel` or `formatOutput`, takes over as before.

```tsx live
<LocaleProvider locale="ar-EG">
  <Pagination total={12} current={5} />
</LocaleProvider>
```

Typing in `Combobox`, `Autocomplete`, `Taginput` and `Command` filters the list the way the language compares letters: case and accents are ignored where it treats them as the same letter, so "cafe" finds "Café", while in Swedish "a" doesn't find "å", a letter of its own there.

```tsx live
<LocaleProvider locale="fr">
  <Combobox
    label="Boisson"
    data={['Café', 'Thé', 'Chocolat chaud']}
    placeholder="Tapez « the »"
  />
</LocaleProvider>
```

The pickers' digits stay as they are: their typed text is a token format of ASCII digits, and a calendar in another set of digits would sit under it. Numbers inside the library's English labels that aren't on screen, such as a carousel slide's "1 of 3", stay as they are too, since they get translated together with their words.

### Portaled Content

What the library portals renders outside the provider's wrapper, at the end of `document.body` or in the `portalContainer` a [`ConfigProvider`](./config.md) sets. Inside a provider, that content keeps the provider's `dir` and `lang`. That covers a `Portal`'s children, a `Popover`, `HoverCard` or `ContextMenu` panel, a `Combobox` menu or picker popover with `appendToBody`, a `Modal` or `Dialog` with `portal`, a `Sidebar`, and toasts and notifications.

A container inside the provider's own wrapper takes the content as it is, and the content follows the provider through the page. Any other, `document.body` included, gets it inside one `<div>` carrying the values, with `display: contents`, so it adds no box and changes no layout. It is still an element, though, so content that must be its container's direct child, such as a `<tr>` portaled into a `<tbody>`, belongs in a container inside the provider. Which of the two is settled when the content mounts: switching the locale while a dialog or a toast is open updates that `<div>` in place, so what's open keeps its typed text, focus and timers.

```tsx live
<LocaleProvider locale="fa">
  <Popover trigger={<Button>جزئیات</Button>} appendToBody ariaLabel="جزئیات">
    <Popover.Body>
      این پنل بیرون از بخش رندر می‌شود و همچنان راست‌به‌چپ است.
    </Popover.Body>
  </Popover>
</LocaleProvider>
```

A date or time picker with a `locale` of its own is read the way a nested provider is: its popover, portaled or not, and an inline calendar take its `lang`, and the direction of its locale unless it has a `dir` of its own. So a French picker in an Arabic section shows a French calendar laid out left to right.

For content you portal yourself without `Portal`, put the values from `useLocale()` on it.

### Server Rendering

The wrapper's `dir` and `lang` come from its props, so the server and the browser write the same ones, and portaled content only renders after hydration.

Set a `locale` when an `inline` picker renders on the server. With none, `Intl` names its days in the runtime's own language, which is the server's on the server and the reader's in the browser, and the two renders don't match when those differ. With a locale they match, as long as the server's `Intl` data and the browser's spell the names alike. They don't always: Node and Safari write the short name for Saturday differently in Arabic. Where that matters, pass the picker its own `dayNames`, and with them the `firstDayOfWeek` they start on. The calendar shows `dayNames` exactly as given, from the first column, so a picker that brings its own keeps the week on Sunday, as it did before the provider, unless `firstDayOfWeek` says otherwise.

```tsx live
<LocaleProvider locale="ar-EG">
  <DateInput
    inline
    label="تاريخ التسليم"
    firstDayOfWeek={6}
    dayNames={[
      'السبت',
      'الأحد',
      'الاثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
    ]}
  />
</LocaleProvider>
```

For an app that's in one language throughout, also set `lang` and `dir` on `<html>` in your page shell. That reaches what sits outside any provider, and the provider still carries them onto portaled content.

In the Next.js App Router, `LocaleProvider` is a client component, since it holds React context, so render it from a file marked `'use client'` and use that in the root layout, which stays a Server Component:

```tsx title="app/providers.tsx"
'use client';

import { LocaleProvider } from '@allxsmith/bestax-bulma';

export function Providers({ children }: { children: React.ReactNode }) {
  return <LocaleProvider locale="ar-EG">{children}</LocaleProvider>;
}
```

```tsx title="app/layout.tsx"
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar-EG" dir="rtl">
      <body>
        <Providers>{children}</Providers>
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
