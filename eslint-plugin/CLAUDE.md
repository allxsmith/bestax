# eslint-plugin

ESLint rules for `@allxsmith/bestax-bulma`, published as
`@allxsmith/eslint-plugin-bestax`. Flat config only, ESM only.

## What belongs here

A rule earns its place in `recommended` by reporting code that does not do what
it looks like it does — a value the library drops on the floor, a prop it has
retired, a prop that emits no class in the context it is used. That set has no
warnings, only errors, because none of it is a preference.

A rule about how working code should be _spelled_ can still ship, but it ships
off by default and is declared in `OPT_IN_RULES`. `no-color-as-surface` is the
one such rule today. Both lists live in `src/configs/recommended.ts` and the
surface test asserts they account for every rule, so a new rule cannot ship
switched off by accident.

## Hard rules

- **A rule never guesses.** If a prop's value is not a readable string literal,
  or the element carries a spread that could change the picture, the rule says
  nothing. A false positive on correct code costs more than a missed report,
  because it teaches people to switch the rule off.
- **Resolve elements through the import, never by tag name.** A project with its
  own `<Box>` must not be linted against Bulma's. `lib/elements.ts` owns this,
  and handles the aliased, namespaced and compound forms.
- **Valid values come from the library at runtime**, imported from its
  `/constants` subpath — never copied into this package. That is what keeps the
  rules matching the version the consumer installed, and it is why
  `@allxsmith/bestax-bulma` is a real runtime dependency here rather than a dev
  or peer one. The subpath exists so linting does not load React.
- **`src/generated/` is generated.** `pnpm gen:eslint-meta` writes it from the
  library's TSDoc via `scripts/gen-eslint-meta.mjs`; `gen:eslint-meta:check`
  fails on a stale copy. Never hand-edit it, and never hand-maintain a second
  copy of what it holds.

## Component metadata

Two things the rules need are read from the library rather than restated:

- Deprecated props and their replacements. The replacement is not a separate
  field — it is parsed out of the note, which the library phrases `Use \`X\`
  instead`. That is where the autofix comes from.
- Which elements treat `color` as a text alias rather than a filled variant.
  Read from the TSDoc sentence the library states it in, so `Button` and `Hero`
  (which have real `is-<color>` modifiers) stay out of it.

Both are keyed by the JSX element name as written, so a compound part is
`"Navbar.Brand"`. That distinction is load-bearing: `<Buttons>` takes a text
alias, `<Buttons.Button>` takes a real variant.

The generator refuses to write an empty table. A TSDoc rewording that stops
matching fails the run rather than silently disabling a rule.

## Tests

`src/__tests__/*.test.ts`, ESLint's own `RuleTester`. Every rule here is
syntactic, so none needs type information and the typed-lint parser services
are not used — `@typescript-eslint/parser` is a dev dependency for parsing TSX
and nothing more.

`RuleTester.run` emits its own `describe`/`it`, so it is called at the top level
of a test file, never inside one.

Each rule's suite carries valid cases for the ways the rule could wrongly fire,
not just invalid cases for what it should catch. Several of those silences came
from linting the library's own documentation — a corpus of examples that are
supposed to be correct, so anything reported there is either a docs bug or a
rule bug. Running the rules over the docs' code fences is worth repeating
whenever a rule changes. The autofix is pinned with
`output`, and `output: null` asserts that no fix is offered — which is the
assertion for a deprecation with no replacement, and for a rename onto a prop
the element already sets.

Thresholds 95% / 78% branches, matching the other non-library packages.
`src/generated/` is excluded from coverage: its correctness is the generator's
staleness gate, not a test here.

## Releases

Scope `eslint-plugin`, tags `@allxsmith/eslint-plugin-bestax@X.Y.Z`. Publishes
with `pnpm publish` through `scripts/lib/pnpm-publish.mjs`, like every other
package here. See `VERSIONING.md`.
