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

**This is the one package that publishes with `pnpm publish`, not `npm publish`
(#436).** `npm publish` does not resolve pnpm's `workspace:` protocol, so
`workspace:^` shipped verbatim in 1.0.0 and made the package uninstallable
(#412). That was patched by a `prepack` hook reimplementing pnpm's rewrite, and
the reimplementation was wrong twice in one review — so the publish step now
goes to `@semantic-release/exec` running `pnpm publish`, which resolves every
pnpm specifier shape by construction. `@semantic-release/npm` stays in the chain
with `npmPublish: false` purely for its `prepare` step, which writes the version
`@semantic-release/git` then commits.

Three things about that split are load-bearing, and none of them fails loudly:

- **`--provenance` is required.** pnpm reads `publishConfig.registry` and
  `.access` but takes `provenance` from options only. `publishConfig.provenance`
  was deliberately REMOVED from this package's manifest rather than left in
  place: it does nothing under pnpm, and the most likely reason anyone would
  delete the flag is reading `"provenance": true` in package.json and concluding
  it is redundant. Drop the flag and #411's provenance quietly stops being
  produced.
- **`--embed-readme` is required.** pnpm defaults it to false where npm defaults
  it to true; without it the npmjs.com page loses its README.
- **The auth pre-flight is weaker than it was.** `@semantic-release/npm`
  exchanged a real OIDC token during `verifyConditions`. With `npmPublish: false`
  that is off, and semantic-release finishes every `prepare` step — the release
  commit and the tag — before the first `publish` step. So a failed publish
  leaves both behind and spends the version.
  `scripts/verify-oidc-context.mjs` runs as the exec plugin's
  `verifyConditionsCmd` and checks only that an OIDC context exists; it does not
  prove npm will accept the token.

**This package must be published with `pnpm publish`, and that is enforced.** The
old `prepack` hook rewrote `workspace:^` for whatever was packing, so it covered a
manual publish as well as the release pipeline. Deleting it left the guarantee
living only in `release.config.js`, which the conformance rule then exempts
precisely because pnpm handles it, so the specifier had no mechanical guard at all
outside CI. `prepublishOnly` now runs `scripts/require-pnpm-publish.mjs`, which
refuses any publisher that is not pnpm (both `npm publish` and `pnpm publish` run
that hook, and they identify themselves in `npm_config_user_agent`).

It covers the realistic mistake, not every path. `--ignore-scripts` skips the
hook outright (both npm and pnpm gate lifecycle scripts on it), `npm pack` runs
`prepack` and `prepare` rather than `prepublishOnly`, and publishing a pre-built
tarball runs none of the package's scripts. It is a guard against the likely
mistake, not a proof. Check what a manifest will actually ship with
`pnpm -C bestax-migrate pack`.

`@allxsmith/bestax-bulma` still stays a **devDependency** — it is only the
typecheck target for the e2e, never imported at runtime, and consumers of a
codemod CLI must not be made to install the component library. That is a policy
rule, not a protocol one: `pnpm check:conformance --only=publishable-manifests`
does **not** enforce it (and now exempts this package from the protocol rule
entirely, since pnpm resolves it), so re-adding the library as a plain-semver
runtime dependency passes CI. That one is on review.

The skill lives at repo-root
`skills/bestax-migrate/`. It **is** bundled into create-bestax (settled in #385): the
original existing-sites-only policy lost to one uniform bundle, and the skill sits idle
in a fresh scaffold until legacy imports show up. The canonical roster of surfaces that
must agree on bundling lives in `create-bestax/CLAUDE.md`'s sync rules — don't restate
it here. When the mapping gains or loses coverage, update
`skills/bestax-migrate/references/` and the docs migration guide in the same PR.
