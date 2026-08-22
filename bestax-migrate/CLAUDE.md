# bestax-migrate — codemods onto bestax-bulma

jscodeshift-based CLI (`pnpm dlx bestax-migrate <source> <paths…>`) that migrates existing
apps from other React Bulma libraries to `@allxsmith/bestax-bulma`. Multi-source by design:
each source library registers in `src/sources/registry.ts`; the first is
`react-bulma-components` (v4 only).

## Hard rules

- **react-bulma-components is NEVER installed anywhere in this repo** (supply-chain
  policy). Fixtures are read as _text_ (`__testfixtures__`, `fixtures/kitchen-sink`); the
  migration _input_ is never typechecked or executed. Validation typechecks the migrated
  _output_ against the workspace `@allxsmith/bestax-bulma`.
- Mapping-table first: `src/sources/react-bulma-components/mapping.ts` is the single source
  of truth. Every RBC v4 export must have an entry (`mapped`/`partial`/`todo`) — the
  `mapping-coverage` test walks the vendored `RBC_EXPORTS` list against it. New coverage is
  a table edit (plus a `special` handler in `specials.ts` when structure changes).
- Anything unsafe gets a `// TODO(bestax-migrate): <hint>` comment on the enclosing
  statement + a report entry — never a silent skip, never a best-guess rewrite of dynamic
  values.

## Architecture

- `src/cli.ts` — file walk + per-type routing (js-ish → jscodeshift transform,
  .scss/.sass → `transformStyles`, nearest package.json → `updateDependencies`) with an
  in-process runner (NOT jscodeshift's worker Runner: fragile from ESM, hides per-file
  stats). `src/runner.ts` is shared by CLI and tests. `--css bestax|bulma|keep` picks the
  stylesheet target; `--no-deps` skips the manifest step.
- `src/sources/react-bulma-components/`: `transform.ts` (orchestration: imports + css →
  per-element special/rename/responsive/props → import rewrite), `mapping.ts` (data),
  `specials.ts` (structural handlers), `props.ts` (PropAction interpreter), `responsive.ts`
  (breakpoint-object flattening), `styles.ts` (line-based SCSS/SASS transform — Sass has
  no jscodeshift parser, so it only rewrites provably-safe patterns), `deps.ts`
  (package.json updater; never runs an install), `jsx-utils.ts` (AST helpers).
- Components with no bestax equivalent (Element, Tile) keep a trimmed, TODO-annotated RBC
  import so the code still runs during gradual migration.

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
- Real-world corpus: `pnpm --filter bestax-migrate validate:corpus` fetches the
  react-bulma-components repo's own MIT-licensed Storybook stories (pinned SHA, text only,
  into `.e2e-tmp/`) and scores the transform over them — fails on any crash or
  unknown-component TODO. Deliberately NOT in CI (no third-party fetches in the pipeline);
  run it before releases and after mapping changes, and eyeball the before/after diffs it
  writes to `.e2e-tmp/corpus-out/`.

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
codemod CLI must not be made to install the component library. That is a policy
rule, not a protocol one, and the conformance check enforces only part of it.
The pack-time exemption this package gets is narrow: `workspace:`/`catalog:` in
**devDependencies** only. Moving the library to `dependencies` as `workspace:^`
is flagged (consumers would be made to install it), but re-adding it as a
**plain semver range** still passes CI, because that is a policy question rather
than a protocol one. That one is on review.

The skill lives at repo-root
`skills/bestax-migrate/`. It **is** bundled into create-bestax (settled in #385): the
original existing-sites-only policy lost to one uniform bundle, and the skill sits idle
in a fresh scaffold until legacy imports show up. The canonical roster of surfaces that
must agree on bundling lives in `create-bestax/CLAUDE.md`'s sync rules — don't restate
it here. When the mapping gains or loses coverage, update
`skills/bestax-migrate/references/` and the docs migration guide in the same PR.
