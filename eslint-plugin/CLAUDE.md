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

Every one of these was a shipped bug before it was a rule. Read them as scar
tissue, not as style.

- **A rule never guesses.** If a prop's value is not a readable string literal
  the rule says nothing. Use `literalValue()` for this; do not hand-roll a
  `Literal` check, which is how `no-color-as-surface` came to report
  ``color={`primary`}`` with the string `<value>` in its message and to
  autofix a bare `color` it had never read.
- **A spread is handled by what it can change**, and the answer differs per
  rule, so state it in the rule's header. `no-color-as-surface` and
  `no-inert-flex-props` go silent, because a spread may carry the prop that
  makes the code correct. `no-deprecated-props` reports but withholds its fix,
  because the deprecated prop is written explicitly while the fix's safety
  guard is not knowable. `valid-helper-value` reports normally: an explicit
  attribute wins over a spread, so a wrong literal is wrong regardless.
- **No autofix may change what the code renders, or stop it compiling.** Two
  ways that happened: renaming onto a prop a spread already set, and renaming
  two deprecated props onto the SAME replacement (`Tabs` deprecates both
  `isFullWidth` and `fullwidth` in favour of `isFullwidth`), which emitted a
  duplicate JSX attribute. Track what a pass has already claimed.
- **Resolve elements through the import AND through scope**, never by tag name
  alone. A project with its own `<Box>`, or a local shadowing the imported one,
  must not be linted against Bulma's. `elementOf()` is the entry point;
  `resolveElement()` is only its name-table half. `bestax-migrate`'s
  `resolvesToBinding` exists for the same bug.
- **Collect imports on `Program`, not in an `ImportDeclaration` visitor.**
  ESLint traverses in document order, so a visitor has not seen an import that
  appears below the JSX using it, and every rule went silent on that file.
  Imports hoist, so such a file is perfectly legal.
- **Read the generated tables with own-property checks.** The keys come from
  user source, so `table[name]` resolves `Object.prototype` members:
  `<Icon valueOf="x" />` reported a deprecation with an empty note. A `Map` or
  `Object.hasOwn` is the fix; `HELPER_VALUES` and the text-alias set are
  already a `Map` and a `Set` and so are immune.
- **Valid values come from the library at runtime**, imported from its
  `/constants` subpath — never copied into this package. The subpath exists so
  linting does not load React or the components.

  Be precise about what that buys, because the first draft of this line
  overclaimed it: the tuples come from the copy of the library THIS PACKAGE
  resolves, which an ordinary deduped install makes the same one the app uses,
  but a major-version split does not. `peerDependencies` is what would read the
  consumer's copy; a runtime `dependencies` entry is a deliberate product
  decision here (it is what makes the package count as a dependent on npm),
  and `SIBLING_RUNTIME_DEPS` in `check:conformance` is where that is declared.
  Do not quietly "fix" it to a peer dependency.

- **`src/generated/` is generated.** `pnpm gen:eslint-meta` writes it from the
  library's TSDoc via `scripts/gen-eslint-meta.mjs`; `gen:eslint-meta:check`
  regenerates and diffs, and runs in `pnpm all`. Never hand-edit it, and never
  hand-maintain a second copy of what it holds.
- **The preset must declare `files`.** A flat config object without it inherits
  ESLint's default `**/*.{js,mjs,cjs}` set, and since every rule here visits
  only `JSXOpeningElement`, the preset shipped linting nothing at all while
  reporting no error. `src/__tests__/index.test.ts` pins that end to end; an
  end-to-end check that supplies its own `files` proves nothing about the
  preset.
- **`meta.version` is load-bearing.** ESLint folds it into the `--cache` config
  fingerprint, so without it an upgrade that adds or tightens a rule is served
  from a stale cache and never runs.

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

The generator refuses to write an empty table, and separately fails if a named
anchor stops matching, so rewording one component's TSDoc cannot quietly drop
it from a rule. Anchors rather than a count, so a legitimate addition needs no
edit.

**The text-alias set is known incomplete.** It is read from the sentence the
library uses to say so, and `Level`, `Section`, `Footer` and `Media` funnel
`color` the same way while wording their TSDoc differently. The miss is a false
negative on an opt-in rule, which is the safe direction; keying on the
`color: textColor ?? color` construct instead of on prose is the real fix and
wants its own change. Until then the generated comment says so, because absence
from that set does not mean the element has a real `is-<color>` modifier.

## Tests

`src/__tests__/*.test.ts`, ESLint's own `RuleTester`. Every rule here is
syntactic, so none needs type information and the typed-lint parser services
are not used — `@typescript-eslint/parser` is a dev dependency for parsing TSX
and nothing more.

`RuleTester.run` emits its own `describe`/`it`, so it is called at the top level
of a test file, never inside one. An `errors` entry takes `messageId` or
`message`, never both, and passing both fails with an opaque `assert(received)`
rather than saying so.

`src/__tests__/helpers.ts` writes the import ABOVE the JSX. That is convenient
and it once hid a real bug, so a rule's suite needs at least one fixture that
does not use it.

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
