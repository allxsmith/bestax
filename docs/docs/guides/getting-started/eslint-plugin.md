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
no throw, no console warning, and no fallback. So this renders, and says
nothing about itself:

```jsx
<Box textAlign="center" mt="1rem" textColor="blue" />
```

Every helper prop on that element is wrong, and not one of them emits a class:
Bulma spells it `centered`, the spacing scale is `0`–`6` and `auto` rather than
CSS lengths, and `blue` is not one of its colours.

:::info Where this helps, and where TypeScript already does

The helper props are typed as literal unions, so in a `.tsx` file `tsc` already
rejects every one of those, and it does it well: `textAlign="center"` gets
TS2820 with its own "Did you mean 'centered'?".

So `valid-helper-value` is for the places that check does not reach:
JavaScript and JSX projects, and lint stages that run before or instead of
typechecking. The preset matches no `.md`/`.mdx`, so code in a documentation
fence is out of reach without an ESLint markdown processor, and even then each
fence needs its own import for the elements to resolve.

`no-deprecated-props` and `no-inert-flex-props` are additive everywhere. No
type error marks a deprecated prop, and none marks a flex prop that emits
nothing.

:::

## Setup

Requires ESLint 10 with [flat config](https://eslint.org/docs/latest/use/configure/configuration-files).
The plugin is ESM-only, which does not rule out a CommonJS config: an
`eslint.config.cjs` can `require()` it on a Node that supports `require(esm)`,
reading `configs.recommended` straight off the result. Without that support it
throws `ERR_REQUIRE_ESM`, and an `import` from `eslint.config.mjs` works
either way.

<PackageManagerTabs>

```bash
pnpm add -D @allxsmith/eslint-plugin-bestax
```

</PackageManagerTabs>

The recommended config registers the plugin as `@allxsmith/bestax`, matches
`.js`, `.mjs`, `.cjs`, `.jsx` and `.tsx`, enables JSX parsing, and turns on
every rule that reports broken code as an error. The opt-in rules,
`no-color-as-surface` and `no-bulma-component-class`, are left off; see below.

It deliberately sets **no `parser`**, so that whatever you configure for
TypeScript survives. Which means a TypeScript project has to supply one:

```js title="eslint.config.js"
import bestax from '@allxsmith/eslint-plugin-bestax';
import parser from '@typescript-eslint/parser';

export default [
  { files: ['**/*.{ts,tsx}'], languageOptions: { parser } },
  bestax.configs.recommended,
];
```

Any TypeScript setup that sets a parser works the same way, `typescript-eslint`
included, precisely because the preset does not set one of its own.

If the project contains no `.tsx` at all, the preset alone is enough:

```js title="eslint.config.js"
import bestax from '@allxsmith/eslint-plugin-bestax';

export default [bestax.configs.recommended];
```

:::caution The parser is a requirement, not a nicety

The preset matches `.tsx`, because that is where a TypeScript project's JSX
lives and the rules have to reach it. With no parser supplied it hands that
file to the default one, which stops at the first type annotation:
`Parsing error: The keyword 'interface' is reserved`.

The failure is loud on purpose. Leaving `.tsx` out of the preset's own `files`
was the alternative, and it is worse: a TypeScript project would then get no
rules on any `.tsx` file, silently, even with a parser configured, because a
flat config object only applies to what its own `files` matches.

:::

To choose rules yourself, note that `files` is doing real work here: a flat
config object without it inherits ESLint's default `**/*.{js,mjs,cjs}` set, so
leaving it out means your `.jsx` and `.tsx` files are never linted and you get
no error saying so.

```js title="eslint.config.js"
import bestax from '@allxsmith/eslint-plugin-bestax';

export default [
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { '@allxsmith/bestax': bestax },
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      '@allxsmith/bestax/valid-helper-value': 'error',
      '@allxsmith/bestax/no-deprecated-props': 'warn',
    },
  },
];
```

## What it will not do

The rules that judge bestax elements resolve them through the import, and
through scope, so neither your own `<Box>` nor a local that shadows the
imported one is linted against Bulma's rules. `no-bulma-component-class` reads
plain HTML elements instead, and leaves components, custom elements and
anything inside `<svg>` alone. The rules that judge a prop's value skip one they
cannot read as a literal: a variable, or a template with an interpolation.

A spread is treated by what it can change. `no-color-as-surface` and
`no-inert-flex-props` go silent, because a spread may carry the very prop that
would make the code correct. `no-deprecated-props` still reports, since the
deprecated prop is written right there, but offers no fix. `valid-helper-value`
judges only the values that actually render, so a spread _before_ the
attribute leaves it reporting while a spread _after_ it does not — JSX is
last-wins throughout, spreads included. `no-bulma-component-class` reports
either way, because the class is written right there.

No autofix here changes what the code renders. A false report on correct code
is worse than a missed one, because it teaches people to switch the rule off.

The `recommended` set has no style rules. Nothing in it has an opinion about
whether you _should_ use a helper prop, only about whether the one you wrote
does anything. The rules about spelling rather than correctness ship switched
off for exactly that reason.

## Rules

### valid-helper-value

Reports helper values the library will drop.

```jsx
<Box textAlign="center" />   // ✗ Did you mean `centered`?
<Box textSize="8" />         // ✗ the scale is 1–7
<Box mt="1rem" />            // ✗ the scale is 0–6 and auto
<Box textColor="blue" />     // ✗ not a Bulma colour
<Box float="center" />       // ✗ float pulls left or right
<Box shadow />               // ✗ reads as a boolean; the value is `shadowless`
```

The valid values are read from the library's own exported tuples at lint time,
through its `/constants` subpath, rather than from a list baked into the
plugin. Those tuples come from the copy of the library this plugin resolves,
which in an ordinary deduped install is the one your app uses; across a major
bump it may not be, so keep the two in step.

One family is outside its reach, knowingly: component-specific `color` props
have their own unions, so `<Button color="ghost">` is correct and the value
rule has no business reporting it.

There is also one element where a helper name means something else, and the
rule knows it. `Theme` accepts a prop for every Bulma CSS variable, and
`--bulma-radius` gives it a `radius` prop, so on `Theme` that prop sets the
variable instead of emitting a class. The rule skips `radius` on `Theme`
alone: every other helper prop on it, and `radius` on everything else, is
still checked.

It knows the documented extras, so these are all accepted:

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
<Icon icon="rocket" />       // ✗ → name               (reported, not fixed)
<Sidebar fullWidth />        // ✗ → isFullwidth        (fixable)
<Tabs color="info" />        // ✗ no `.tabs.is-<color>` CSS exists — no fix
<Tags isMultiline />         // ✗ never had an effect — no fix
```

A rename is autofixable when the swap cannot change what renders. Everything
else is reported with the library's own reason and no fix:

- A prop retired outright, which emits a class no shipped CSS matches or never
  did anything, so there is nothing to rename it to.
- A note naming more than one replacement, such as `Icon`'s `libraryFeatures`,
  which became `variant` and `features`.
- `icon` → `name`, because the two do not read their value the same way: the
  library keeps only the last space-separated segment of `icon` and never
  splits `name`, so renaming `icon="material-symbols-outlined home"` would turn
  the `home` ligature into that string as literal text.
- Two deprecated props on one element that rename to the same target, since the
  library picks between them in a fixed order and promoting either one changes
  the result.

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
<Box bgColor="info" color="primary" /> // ✓ surface and text, both meant
```

Elements with a real `is-<color>` modifier are untouched, and the distinction
follows the compound tree:

```jsx
<Button color="primary" />        // ✓ a filled button
<Hero color="info" />             // ✓ a filled hero
<Buttons.Button color="primary" />// ✓ a real variant
<Buttons color="primary" />       // ✗ the wrapper takes the text alias
```

### no-bulma-component-class

:::note Opt-in

This rule is not in `recommended`. Bulma's classes on plain markup work, so
preferring the component is a choice an app makes, not a bug in its code. Turn
it on once an app has moved onto bestax, with the
[`bulma-classes` codemod](./migration/bulma-classes.md) or by hand, to keep raw
Bulma markup from coming back.

:::

It reports a plain element styled with a Bulma class that bestax has a
component for, and names the component:

```jsx
<button className="button is-primary" /> // ✗ bestax renders .button as Button
<div className="card" />                 // ✗ bestax has Card, converted by hand
```

Helper classes are left alone, since they are valid on any tag and a `<div>`
has no bestax wrapper to move them to. So are the classes bestax renders only
inside a component, and the parts of a family, whose outermost class is the
one reported:

```jsx
<div className="has-text-centered mt-4" /> // ✓ helper classes
<p className="help" />                   // ✓ bestax renders .help inside its form controls
<header className="card-header" />       // ✓ the .card around it is what gets reported
```

It reads the classes a `className` spells out, including the strings in a
ternary, a template, or a call to `clsx`, `classnames` or `tailwind-merge`
(however the file imports or requires it). It does not read a word glued to an expression
(`` `button${size}` ``), a CSS-module lookup (`styles['box']`, or `cx('box')`
where `cx` is `classNames.bind(styles)`), or the arguments of any other call,
which may be a lookup key. That includes a joiner your app defines, like a `cn`
in `lib/utils`: the rule cannot see what it does, so it stays quiet there. An element
carrying several is reported once, for the class the codemod would decide by.

It only reports. Whether an element converts depends on its tag, attributes
and children, and the codemod is the one place that judges that.

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
