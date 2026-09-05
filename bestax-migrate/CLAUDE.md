# bestax-migrate — codemods onto bestax-bulma

jscodeshift-based CLI (`pnpm dlx bestax-migrate <source> <paths…>`) that migrates existing
apps from other React Bulma libraries to `@allxsmith/bestax-bulma`. Multi-source by design:
each source library registers in `src/sources/registry.ts`. Three are shipped —
`react-bulma-components` (v4 only), `rbx` (v2 only) and `bloomer` (0.6 only).

## Hard rules

- **No source library is EVER installed anywhere in this repo** (supply-chain policy) —
  not react-bulma-components, not rbx, not bloomer. Fixtures are read as _text_ (`__testfixtures__`,
  `fixtures/kitchen-sink`, `fixtures/rbx-kitchen-sink`, `fixtures/bloomer-kitchen-sink`); the migration _input_ is never
  typechecked or executed. Validation typechecks the migrated _output_ against the
  workspace `@allxsmith/bestax-bulma`. The kitchen-sink manifests are named
  `package.input.json`, not `package.json`: Dependabot's alert graph treats any file with
  that name as a real manifest whatever the lockfile says, and opened a security-update PR
  against the rbx fixture's deliberately-old `node-sass` (#615). The e2e renames its copy
  back inside `.e2e-tmp`, so the pass under test still sees a genuine `package.json`.
- Mapping-table first: each source's `mapping.ts` is its single source of truth. Every
  export of that library must have an entry (`mapped`/`partial`/`todo`) — the
  `mapping-coverage` test walks the vendored `RBC_EXPORTS` / `RBX_EXPORTS` / `BLOOMER_EXPORTS` list against it,
  in both directions, so the table cannot grow an entry for something the library never
  exported either. New coverage is a table edit (plus a `special` handler in `specials.ts`
  when structure changes).
- **A new source is a directory plus one registry line.** `src/sources/_shared/` holds
  everything library-agnostic: `jsx-utils.ts` (AST helpers + `TransformContext`),
  `props.ts` (the `PropAction` interpreter — its universal table is a parameter, not an
  import), `imports.ts` (binding collection and import aliasing), `specials-utils.ts`
  (`alignTarget`, `mergeClassName`, `parseIconClasses`, `modifierClass`, `restrictAsToTargets`,
  the `stripModifierProps` factory and the `makeStructuralHelpers` factory behind
  `replaceWithPlain`/`collapseOntoChild`), `viewports.ts` (Bulma's nine viewports → bestax's
  prop suffixes), and `make-styles-transform.ts` (the whole Bulma 0.9→v1 stylesheet transform,
  parameterised by the source package's own specifiers). What stays per-source is the data
  — `mapping.ts`, `specials.ts`, `responsive.ts`, `deps.ts` — plus a `transform.ts` that
  orchestrates them. bloomer's is the plain one: its exports are flat, so it has no
  destructuring pass, no alias registry and no wrapping pass; the rbx and RBC copies still
  carry all three.
- `'<source>'` must be added to `MIGRATE_SOURCE_VALUES` in `telemetry-worker/src/schema.ts`
  or its events are dropped at ingest; `check:conformance --only=telemetry-allowlists`
  fails until it is. That worker deploys to production on merge, so the two land together.
  The same check regex-scrapes each source's `index.ts` for
  `: MigrationSource = { … name: '…' }` — a declaration that doesn't match that shape is a
  hard violation, not a skip.
- Anything unsafe gets a `// TODO(bestax-migrate): <hint>` comment on the enclosing
  statement + a report entry — never a silent skip, never a best-guess rewrite of dynamic
  values.
- **A TODO message is a claim about bestax; read the component before writing it.** Four
  shipped on #613 were false (Modal "always closes on Escape"; a Field TODO naming `isGrouped`).
  The rbx e2e fails on an undocumented rule (RBC's does not); nothing checks the guidance is true.
- **A defect in one source's `transform.ts` is almost certainly in the others.** Nine fixes were
  ported RBC↔rbx on #613 and review kept finding the unported half. Fix the siblings in the same
  commit, or move the logic into `_shared/` (the alias registry, the literal/object helpers
  and the structural-handler helpers went there on #410 for exactly this reason).
- **Resolve references by binding, not by identifier text.** Every serious bug on #613 came
  from a name-keyed map (`function F(Header)` became `F(Card.Header)`). Use
  `makeAliasRegistry` from `_shared/imports.ts`: ancestors decide ownership, `scope.lookup`
  vetoes a nearer binding.
- **The report may only describe what actually happened.** The manifest headline said "bumped
  bulma" in most manifest shapes where nothing was bumped. Track each mutation; phrase from it.
- **The stylesheet and manifest passes must agree on what is removable.** Both report rather
  than remove `bulma-*` extensions, since markup outside the source may still use their classes.
  rbx enumerates its four in `deps.ts` and `transform.ts`; the shared Sass pass flags any `bulma-*`.
- **Never change `bulma-ui` to make a migration cleaner.** Map onto the library as it is and
  emit a TODO otherwise. A gap earns a `bulma-ui` issue only if it is a bestax defect or the
  source is genuinely better, not merely different (#616 to #622 are the worked example).

## Architecture

- `src/cli.ts` — file walk + per-type routing (js-ish → jscodeshift transform,
  .scss/.sass → `transformStyles`, nearest package.json → `updateDependencies`) with an
  in-process runner (NOT jscodeshift's worker Runner: fragile from ESM, hides per-file
  stats). `src/runner.ts` is shared by CLI and tests. `--css bestax|bulma|keep` picks the
  stylesheet target; `--no-deps` skips the manifest step.
- `src/sources/react-bulma-components/` (and `rbx/`, same shape): `transform.ts`
  (orchestration: imports + css → per-element special/rename/responsive/props → import
  rewrite), `mapping.ts` (data), `specials.ts` (structural handlers), `responsive.ts`
  (breakpoint-object flattening), `styles.ts` (a thin call into `_shared/make-styles-transform.ts`,
  line-based because Sass has no jscodeshift parser), `deps.ts` (package.json updater; never
  runs an install). The PropAction interpreter and AST helpers live in `_shared/`.
- Components with no bestax equivalent (Element, Tile) keep a trimmed, TODO-annotated RBC
  import so the code still runs during gradual migration.
- `src/telemetry-core.ts` is a byte-for-byte copy of
  `create-bestax/src/telemetry-core.ts` — never edit it here; edit the
  create-bestax original and copy it over (`check:conformance
--only=telemetry-core` enforces identity). This package's payload builder and
  caps live in `src/telemetry.ts`; the caps are pinned to the ingest worker's
  bounds by `scripts/telemetry-contract.test.mjs`.

## Testing

- Fixture pairs: `__testfixtures__/<case>.input.tsx` → `.output.tsx`, exact-match. To
  update outputs after changing the transform, regenerate them by running the built
  transform over the inputs and reviewing the diff — do not hand-edit drift in.
- Kitchen sink e2e (`e2e/kitchen-sink.test.ts`): copies `fixtures/kitchen-sink` to a
  `mkdtemp`'d dir under `.e2e-tmp/`, migrates it, and runs `tsc --noEmit` on the output
  against the built bulma-ui (`turbo` orders the build; see `bestax-migrate#test` in root
  turbo.json). The scratch dir is **per process, never a fixed path**: `pnpm all` runs
  `test` and `test:coverage` in one turbo invocation, so two jest processes run this file
  concurrently and a shared path lets them clobber each other's rmSync/cpSync — the suite
  then fails as though the codemod had not run. `BESTAX_E2E_KEEP=1` leaves the dir behind.
  `src/leftovers.tsx` holds every intentionally-unsupported pattern — excluded from the
  typecheck, asserted via TODO rules instead. New unsupported patterns go there; new
  supported ones go in the other fixture files, which must stay TODO-free.
- Fixtures and `.e2e-tmp` are excluded from tsc/eslint/prettier at both root and package
  level (root `eslint.config.js` + both `.prettierignore`s) — keep them that way.
- Real-world corpus, one script per source, both fetching a pinned SHA as text only into
  `.e2e-tmp/` and failing on any crash or unknown-component TODO. Deliberately NOT in CI
  (no third-party fetches in the pipeline); run them before releases and after mapping
  changes, and eyeball the before/after diffs they write:
  - `validate:corpus` — react-bulma-components' own MIT Storybook stories →
    `.e2e-tmp/corpus-out/`.
  - `validate:corpus:rbx` — rbx's own MIT docs. rbx used **docz**, not Storybook, so the
    script extracts the `<Playground>` blocks out of its 43 `*.docs.mdx` pages (254 blocks)
    and rebuilds each page as one synthetic module written the way a consumer writes rbx.
    Output lands in `.e2e-tmp/corpus-out-rbx/`.
  - `validate:corpus:bloomer` — bloomer's own MIT docs: 39 React "Scene" `.tsx` files that
    render the library through a relative `src` import, migrated as written after that
    specifier becomes `'bloomer'`. Output lands in `.e2e-tmp/corpus-out-bloomer/`.

  The corpus is the only check that sees breadth; the kitchen-sink e2e is the only one that
  sees bestax's _real_ prop names. Both are needed — the rbx e2e's typecheck caught six
  mapping errors that 254 clean Playgrounds had not.

- After editing a test file, check the total test count did not drop: a range replacement
  between two non-adjacent `describe` blocks deleted 868 lines on #613 and the suite stayed green
  at 699 instead of 781. Compare the `Tests:` line from `pnpm test` (bare `jest` miscounts on ESM).

## Releases

Independent semantic-release, keyed off the `bestax-migrate` commit scope
(`release.config.js`, tag `bestax-migrate@x.y.z`).

**Publishing is shared, and this package is why it looks the way it does.**
Every package here publishes with `pnpm publish` rather than `npm publish`
(#436, then #532), through the plugin pair in `scripts/lib/pnpm-publish.mjs`.
The mechanism and the ways it fails quietly are documented once in
`VERSIONING.md` and in that helper. The `prepack` / `prepublishOnly` guard is
documented in `scripts/require-pnpm-publish.mjs`, and that header is worth
reading before touching it: why it keys on `npm_execpath` rather than the
inherited `npm_config_user_agent`, and why it refuses only packers it can
name instead of allow-listing pnpm. `pnpm check:conformance` reports a
violation if either hook is missing, so the exemption and the guard that
compensates for it cannot drift apart.

What is specific to bestax-migrate is the specifier that forced it.
`npm publish` does not resolve pnpm's `workspace:` protocol, so the
`workspace:^` below shipped verbatim in 1.0.0 and made the package
uninstallable (#412). That was first patched by a `prepack` hook
reimplementing pnpm's rewrite, and the reimplementation was wrong twice in one
review — which is the whole argument for handing the job to pnpm instead of
owning a subset of its logic. This is still the only package carrying such a
specifier, so it is the one whose tarball is worth inspecting after any change
to how packing works: `pnpm -C bestax-migrate pack`.

`@allxsmith/bestax-bulma` still stays a **devDependency** — it is only the
typecheck target for the e2e, never imported at runtime, and consumers of a
codemod CLI must not be made to install the component library. Both halves of
that are now enforced by `publishable-manifests` (#537): the protocol rule
flags `workspace:^` in a consumer section, and the sibling rule flags a
workspace package name in `dependencies`/`optionalDependencies` **whatever
the specifier says** — so the plain-semver spelling that used to pass on
review attention alone fails CI with the move-it-back fix named. One
appearance that is NOT a counterexample: the e2e asserts the **migrated
app's** manifest depends on the library (`e2e/kitchen-sink.test.ts`) — that
is the codemod's output, which should depend on it, and no check reads it.

The skill lives at repo-root
`skills/bestax-migrate/`. It **is** bundled into create-bestax (settled in #385): the
original existing-sites-only policy lost to one uniform bundle, and the skill sits idle
in a fresh scaffold until legacy imports show up. The canonical roster of surfaces that
must agree on bundling lives in `create-bestax/CLAUDE.md`'s sync rules — don't restate
it here. When the mapping gains or loses coverage, update
`skills/bestax-migrate/references/` and the docs migration guide in the same PR.
