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

- **A rule never guesses**, and the readers in `lib/elements.ts` are where the
  judgement lives. Do not hand-roll an AST value check in a rule: that is how
  `no-color-as-surface` came to report ``color={`primary`}`` with the string
  `<value>` in its message and to autofix a bare `color` it had never read.
  Three readers, and picking the wrong one is the recurring bug here:
  - `literalValue()` for the value itself, when a rule needs to judge it.
  - `isUnreadableValue()` for a "say nothing" guard. It separates genuinely
    unknown (`{mode}`) from readable but of a type no tuple entry can be
    (`true`, `{false}`, a number) — the second is knowably wrong, and a guard
    testing "not a string literal" swallows it.
  - `isKnownNonNullish()` where a guard stands in front of a `??`. `readable`
    is too weak there: a readable `null` is still nullish, and using the wrong
    one made `redundant` claim `color` was ignored on an element rendering it.
- **A spread is handled by what it can change**, and the answer differs per
  rule, so state it in the rule's header. `no-color-as-surface` and
  `no-inert-flex-props` go silent, because a spread may carry the prop that
  makes the code correct. `no-deprecated-props` reports but withholds its fix,
  because the deprecated prop is written explicitly while the fix's safety
  guard is not knowable. `valid-helper-value` judges only the values that
  render, which means a LEADING spread does not silence it but a TRAILING one
  does. JSX is last-wins throughout, spreads included, so the tempting
  shorthand "an explicit attribute wins over a spread" is false of
  `<Box textAlign="center" {...rest} />` — `rest.textAlign` is what renders.
  `valuesThatRender()` owns that; `winningAttributes()` settles duplicate names
  only.
- **No autofix may change what the code renders, or stop it compiling.** Two
  ways that happened: renaming onto a prop a spread already set, and renaming
  two deprecated props onto the SAME replacement (`Tabs` deprecates both
  `isFullWidth` and `fullwidth` in favour of `isFullwidth`), which emitted a
  duplicate JSX attribute. Track what a pass has already claimed.

  There is a weaker version of the same rule, and it caught both
  name-rewriting rules in turn: a fix may not leave DEAD source behind either.
  A name written twice is read last-wins, so a rule reads the winner and
  reports correctly, and then renaming the winner leaves the loser sitting
  there. `<Tabs isFullWidth isFullWidth />` became
  `<Tabs isFullWidth isFullwidth />`, still deprecated; `<Box color="bogus"
color="primary" />` became `<Box color="bogus" textColor="primary" />`,
  which renders right and carries a `color` nobody wants. `doubledNames()` is
  the reader, and every fix that rewrites an attribute name withholds itself
  on it.

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
library uses to say so, and other components funnel `color` the same way while
wording their TSDoc differently. Grep the `color: textColor ?? color` construct
rather than trusting a list here: the miss set is larger than it looks and
includes compound parts whose parent is in the set. The miss is a false
negative on an opt-in rule, which is the safe direction; keying on that
construct instead of on prose is the real fix and wants its own change. Until
then the generated comment says so, because absence from that set does not mean
the element has a real `is-<color>` modifier.

## Running it

The value tuples come from `bulma-ui/dist`, so this package's tests and
typecheck need that build. `turbo.json` declares the edge, which means
`pnpm exec turbo run test --filter=@allxsmith/eslint-plugin-bestax` builds it
first — but `pnpm --filter … test` bypasses turbo entirely and fails on a bare
`Cannot find module '@allxsmith/bestax-bulma/constants'`, which reads like a
missing dependency rather than a missing build. Go through turbo, or build
`bulma-ui` first.

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

## ESM-only, and what that does not mean

The package ships ESM and no CommonJS build, and the README said that made it
unusable from a CommonJS config. That is false on the Node range this package
supports. `require(esm)` handles a module with no top-level await, and
`dist/index.js` has none, so an `eslint.config.cjs` can `require()` the plugin
and read `configs.recommended` straight off the result: `rules` and `configs`
are named exports alongside the default, so there is no `.default` hop either.
Verified both ways, the second with `--no-experimental-require-module`, which
throws `ERR_REQUIRE_ESM` the way an older Node does.

Worth writing down because the false version is the intuitive one, and because
it was reasoning about ESLint 10 rather than about Node: ESLint 10 dropped
eslintrc entirely, so the `.eslintrc.js` the claim named cannot be used at all,
and the config format a CommonJS user actually reaches for is flat config in a
`.cjs` file.

## Why the peer range is `^10` only

Nothing in the rules reaches past an ESLint 8.40-era API — `context.sourceCode`,
`getScope`, flat config, `meta.version` — so `^9` would very likely work, and a
review said so. It stays at `^10` anyway, because:

- Nothing here is tested against 9.x. There is no ESLint 9 in the lockfile and
  no 9/10 matrix analogous to bulma-ui's React 18/19 one, and this package has
  now been through several rounds of "the claim was true of the code I ran and
  false of the code I shipped".
- `engines.node` is `>=22`, matching the repo. ESLint 9's own floor is Node 18,
  so widening the peer range without lowering `engines` would only reach
  someone on Node 22+ who is still on ESLint 9 — a narrow group to make an
  untested promise for.

Widening it is a small change once there is a matrix to back it. Do that first.

## Releases

Scope `eslint-plugin`, tags `@allxsmith/eslint-plugin-bestax@X.Y.Z`. Publishes
with `pnpm publish` through `scripts/lib/pnpm-publish.mjs`, like every other
package here. See `VERSIONING.md`.
