# @allxsmith/eslint-plugin-bestax

[![npm version](https://img.shields.io/npm/v/@allxsmith%2Feslint-plugin-bestax.svg)](https://www.npmjs.com/package/@allxsmith/eslint-plugin-bestax)
[![npm downloads](https://img.shields.io/npm/dm/@allxsmith%2Feslint-plugin-bestax.svg)](https://www.npmjs.com/package/@allxsmith/eslint-plugin-bestax)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@allxsmith/eslint-plugin-bestax)](https://socket.dev/npm/package/@allxsmith/eslint-plugin-bestax/overview)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/allxsmith/bestax/badge)](https://scorecard.dev/viewer/?uri=github.com/allxsmith/bestax)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/14361/badge)](https://www.bestpractices.dev/projects/14361)
[![npm provenance](https://img.shields.io/badge/npm-provenance-3fb950.svg)](https://www.npmjs.com/package/@allxsmith/eslint-plugin-bestax#provenance)
[![Security policy](https://img.shields.io/badge/security-policy-blue.svg)](https://github.com/allxsmith/bestax/blob/main/SECURITY.md)

ESLint rules for [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma).

Every rule here reports code that does not do what it looks like it does. The
library's helper props validate by membership and emit nothing for a value they
do not recognise — no throw, no warning — so `textColor="blue"` type-checks,
renders nothing, and tells you nothing. That is the class of bug this plugin
exists to close.

## Requirements

ESLint 9 or 10, using [flat config](https://eslint.org/docs/latest/use/configure/configuration-files).
The plugin is ESM-only, so it cannot be `require()`d from a legacy
`.eslintrc.js`.

## Setup

```bash
npm install --save-dev @allxsmith/eslint-plugin-bestax
```

```js
// eslint.config.js
import bestax from '@allxsmith/eslint-plugin-bestax';

export default [bestax.configs.recommended];
```

Or register it yourself and pick rules:

```js
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

Each rule only judges values it can actually read: a prop whose value is a
variable, or an element carrying a spread, is left alone rather than guessed
at.

### valid-helper-value

```jsx
<Box textAlign="center" />   // ✗ not a value textAlign accepts. Did you mean `centered`?
<Box textAlign="centered" /> // ✓
```

The valid values come from the library's own exported tuples at lint time, by
way of its `/constants` subpath, so the rule always matches the version you
have installed. Component-specific `color` props are deliberately not checked —
`<Button color="ghost">` is correct, and reporting it would be worse than
reporting nothing.

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
