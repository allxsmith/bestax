---
title: ESLint Plugin
sidebar_label: ESLint Plugin
sidebar_position: 12
---

# ESLint Plugin

`@allxsmith/eslint-plugin-bestax` reports bestax-bulma code that does not do
what it looks like it does.

The helper props validate by membership: `useBulmaClasses` checks a value
against the list it accepts and emits nothing when it does not match. There is
no throw, no console warning, and no fallback. So this compiles, renders, and
tells you nothing at all:

```jsx
<Box textAlign="center" mt="1rem" textColor="blue" />
```

Every helper prop on that element is wrong, and not one of them emits a class:
Bulma spells it `centered`, the spacing scale is `0`–`6` and `auto` rather than
CSS lengths, and `blue` is not one of its colours. The plugin is the thing that
says so.

## Setup

Requires ESLint 9 or 10 with [flat config](https://eslint.org/docs/latest/use/configure/configuration-files).
The plugin is ESM-only and cannot be `require()`d from a legacy `.eslintrc.js`.

```bash
npm install --save-dev @allxsmith/eslint-plugin-bestax
```

```js title="eslint.config.js"
import bestax from '@allxsmith/eslint-plugin-bestax';

export default [bestax.configs.recommended];
```

The recommended config registers the plugin as `@allxsmith/bestax` and turns
on every rule that reports broken code, as an error. `no-color-as-surface` is
left off — see below. To choose rules yourself:

```js title="eslint.config.js"
import bestax from '@allxsmith/eslint-plugin-bestax';

export default [
  {
    plugins: { '@allxsmith/bestax': bestax },
    rules: {
      '@allxsmith/bestax/valid-helper-value': 'error',
      '@allxsmith/bestax/no-deprecated-props': 'warn',
    },
  },
];
```

## What it will not do

Every rule resolves elements through the import, so your own `<Box>` is never
linted against Bulma's rules. And every rule only judges what it can read: a
prop whose value is a variable, a template with an interpolation, or an element
carrying a spread is left alone rather than guessed at. A false report on
correct code is worse than a missed one, because it teaches people to switch
the rule off.

There are no style rules here. Nothing in this plugin has an opinion about
whether you _should_ use a helper prop — only about whether the one you wrote
does anything.

## Rules

### valid-helper-value

Reports helper values the library will drop.

```jsx
<Box textAlign="center" />   // ✗ Did you mean `centered`?
<Box textSize="8" />         // ✗ the scale is 1–7
<Box mt="1rem" />            // ✗ the scale is 0–6 and auto
<Box textColor="blue" />     // ✗ not a Bulma colour
```

The valid values are read from the library's own exported tuples at lint time,
through its `/constants` subpath, so the rule always agrees with the version
you have installed rather than with a list baked into the plugin.

It deliberately skips component-specific `color` props, which have their own
unions — `<Button color="ghost">` is correct, and the value rule has no business
reporting it. It also knows the documented extras, so these are all accepted:

```jsx
<Box display="none" />             // ✓ display also takes `none`
<Box textColor="inherit" />        // ✓ and the CSS-wide keywords
<Box bgColor="scheme-main-bis" />  // ✓ bgColor also takes the scheme colours
```

### no-deprecated-props

Reports props the library has deprecated, and fixes the renames.

```jsx
<Button isFullWidth />       // ✗ → isFullwidth        (fixable)
<Columns gapSize="3" />      // ✗ → gap                (fixable)
<Icon icon="rocket" />       // ✗ → name               (fixable)
<Sidebar fullWidth />        // ✗ → isFullwidth        (fixable)
<Tabs color="info" />        // ✗ no `.tabs.is-<color>` CSS exists — no fix
<Tags isMultiline />         // ✗ never had an effect — no fix
```

A rename carries its replacement, so it is autofixable. A prop retired outright
— one that emits a class no shipped CSS matches, or never did anything — is
reported with the library's own reason and no fix, because there is nothing to
rename it to.

The table is generated from the library's TSDoc, so a rename reaches the plugin
with the release that makes it.

No fix is offered when the element already sets the replacement, since
rewriting would collapse two props into a duplicate and the library documents
which one wins:

```jsx
<Button isFullWidth isFullwidth /> // ✗ reported, not fixed
```

### no-color-as-surface

:::note Opt-in

This rule is not in `recommended`. Unlike the others it reports code that
works: `color` is a documented alias, and an author who writes it may well want
coloured text. Turn it on if you want the call site to say which it meant.

:::

On the content elements, `color` is a text-colour alias: it renders
`has-text-<color>`, exactly like `textColor`, and there is no `.box.is-<color>`
CSS for it to mean anything else.

```jsx
<Box color="primary" />     // ✗ this colours TEXT → fixes to textColor
<Box textColor="primary" /> // ✓ text
<Box bgColor="primary" />   // ✓ a coloured surface
```

It stays silent when the element sets a background explicitly, because then
`color` is unambiguously the text half of a deliberate pairing:

```jsx
<Box backgroundColor="light" color="dark" /> // ✓ surface and text, both meant
```

Elements with a real `is-<color>` modifier are untouched, and the distinction
follows the compound tree:

```jsx
<Button color="primary" />        // ✓ a filled button
<Hero color="info" />             // ✓ a filled hero
<Buttons.Button color="primary" />// ✓ a real variant
<Buttons color="primary" />       // ✗ the wrapper takes the text alias
```

### no-inert-flex-props

The flex _container_ props emit nothing unless a `display` prop is `flex` or
`inline-flex` — so this looks like it centres its children and does nothing:

```jsx
<Box justifyContent="center" />                // ✗
<Box display="flex" justifyContent="center" /> // ✓
<Box displayTablet="flex" alignItems="center" />// ✓ a responsive band counts
```

The flex _child_ props describe the element inside somebody else's container,
so they always apply and are never reported:

```jsx
<Box flexGrow="1" flexShrink="0" alignSelf="center" /> // ✓
```

## Related

- [Helper props reference](../../api/helpers/usebulmaclasses.md)
- [Valid values](../../api/helpers/valid-values.md)
- [Margin and padding helpers](../helpers/margin-and-padding.md)
