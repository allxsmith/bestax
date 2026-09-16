# @allxsmith/eslint-plugin-bestax

[![npm version](https://img.shields.io/npm/v/@allxsmith/eslint-plugin-bestax.svg)](https://www.npmjs.com/package/@allxsmith/eslint-plugin-bestax)
[![npm downloads](https://img.shields.io/npm/dm/@allxsmith/eslint-plugin-bestax.svg)](https://www.npmjs.com/package/@allxsmith/eslint-plugin-bestax)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@allxsmith/eslint-plugin-bestax)](https://socket.dev/npm/package/@allxsmith/eslint-plugin-bestax/overview)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/allxsmith/bestax/badge)](https://scorecard.dev/viewer/?uri=github.com/allxsmith/bestax)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/14361/badge)](https://www.bestpractices.dev/projects/14361)
[![npm provenance](https://img.shields.io/badge/npm-provenance-3fb950.svg)](https://www.npmjs.com/package/@allxsmith/eslint-plugin-bestax#provenance)
[![Security policy](https://img.shields.io/badge/security-policy-blue.svg)](https://github.com/allxsmith/bestax/blob/main/SECURITY.md)

ESLint rules for [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma).

Every rule here reports code that does not do what it looks like it does. The
library's helper props validate by membership and emit nothing for a value they
do not recognise, with no throw and no warning, so `textColor="blue"` renders
nothing and says nothing.

**Scope, up front:** the helper props are typed as literal unions, so if you
write bestax in `.tsx` and run `tsc`, it already catches a wrong literal. This
plugin is for the places that check does not reach: JavaScript and JSX
projects, code in markdown and MDX, and lint stages that run before or instead
of typechecking. The deprecation and flex rules are additive everywhere, since
no type error marks a deprecated prop or a flex prop that emits nothing.

## Requirements

ESLint 10, using [flat config](https://eslint.org/docs/latest/use/configure/configuration-files).
The plugin is ESM-only, so it cannot be `require()`d from a legacy
`.eslintrc.js`.

## Setup

```bash
npm install --save-dev @allxsmith/eslint-plugin-bestax
```

### TypeScript

The preset sets no `parser`, so a TypeScript parser has to come from a config
object of your own. Put it first; the preset after:

```js
// eslint.config.js
import bestax from '@allxsmith/eslint-plugin-bestax';
import parser from '@typescript-eslint/parser';

export default [
  { files: ['**/*.{ts,tsx}'], languageOptions: { parser } },
  bestax.configs.recommended,
];
```

Any TypeScript setup that sets a parser works the same way, `typescript-eslint`
included, precisely because the preset does not set one of its own.

### JavaScript and JSX

With no TypeScript in the project, the preset alone is enough — it matches
`.js`, `.mjs`, `.cjs`, `.jsx` and `.tsx`, and turns on JSX parsing:

```js
// eslint.config.js
import bestax from '@allxsmith/eslint-plugin-bestax';

export default [bestax.configs.recommended];
```

Do not use that form on a `.tsx` file. Without a TypeScript parser the default
one reaches the first type annotation and stops:
`Parsing error: The keyword 'interface' is reserved`.

### Picking rules yourself

`files` is load-bearing: a flat config object without it inherits ESLint's
default `**/*.{js,mjs,cjs}` set, so leaving it out silently lints none of your
JSX.

```js
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

## Rules

In `recommended` — each reports code that does not do what it says:

| Rule                  | Fixable | What it catches                                                                                                         |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `valid-helper-value`  | —       | Helper values the library silently drops: `textAlign="center"` (it is `centered`), `textSize="8"`, `mt="1rem"`          |
| `no-deprecated-props` | yes     | Props the library deprecated: `isFullWidth`, `gapSize*`, `icon`. Also the retired ones that emit a class no CSS matches |
| `no-inert-flex-props` | —       | `justifyContent` and friends without a flex `display`, which emit nothing                                               |

Opt-in — this one reports code that works, and buys explicitness instead:

| Rule                  | Fixable | What it asks for                                                              |
| --------------------- | ------- | ----------------------------------------------------------------------------- |
| `no-color-as-surface` | yes     | `textColor` instead of the `color` alias, where `color` cannot mean a surface |

Each rule resolves elements through the import and through scope, so neither
your own `<Box>` nor a local shadowing the imported one is linted against
Bulma's rules, and each skips a value it cannot read as a literal.

A spread is handled by what it can change: `no-color-as-surface` and
`no-inert-flex-props` go silent, since a spread may carry the prop that makes
the code correct; `no-deprecated-props` reports but offers no fix; and
`valid-helper-value` still reports, because an explicit attribute wins over a
spread so a wrong literal is wrong regardless. No autofix changes what the code
renders.

### valid-helper-value

```jsx
<Box textAlign="center" />   // ✗ not a value textAlign accepts. Did you mean `centered`?
<Box textAlign="centered" /> // ✓
```

The valid values come from the library's own exported tuples at lint time, by
way of its `/constants` subpath, rather than from a list copied into this
package. The version those tuples come from is the copy of
`@allxsmith/bestax-bulma` this plugin resolves, which in an ordinary deduped
install is the same one your app uses; across a major bump it may not be, so
keep the two in step. Component-specific `color` props are deliberately not
checked, since `<Button color="ghost">` is correct and reporting it would be
worse than reporting nothing.

### no-deprecated-props

```jsx
<Button isFullWidth />  // ✗ deprecated → fixes to isFullwidth
<Tabs color="info" />   // ✗ no .tabs.is-<color> CSS exists; no fix offered
```

The table is generated from the library's own TSDoc, so a rename lands here
with the library rather than after someone notices.

### no-color-as-surface

Off by default. `color` on the content elements is a documented alias for
`textColor`, so this rule is about saying which you meant, not about broken
code.

```jsx
<Box color="primary" />    // ✗ ambiguous → fixes to textColor
<Box bgColor="primary" />  // ✓ a coloured surface
<Button color="primary" /> // ✓ Button really has an is-primary variant

// ✓ silent: the background is explicit, so `color` is plainly the text half
<Box backgroundColor="light" color="dark" />
```

### no-inert-flex-props

```jsx
<Box justifyContent="center" />                // ✗ emits nothing
<Box display="flex" justifyContent="center" /> // ✓
<Box flexGrow="1" />                           // ✓ child props always apply
```

## Links

- [Documentation](https://bestax.io/docs/guides/getting-started/eslint-plugin)
- [Component library](https://www.npmjs.com/package/@allxsmith/bestax-bulma)
- [Repository](https://github.com/allxsmith/bestax)

## License

MIT
