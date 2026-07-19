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

- `src/cli.ts` — file walk + in-process runner (NOT jscodeshift's worker Runner: fragile
  from ESM, hides per-file stats). `src/runner.ts` is shared by CLI and tests.
- `src/sources/react-bulma-components/`: `transform.ts` (orchestration: imports →
  per-element special/rename/responsive/props → import rewrite), `mapping.ts` (data),
  `specials.ts` (structural handlers), `props.ts` (PropAction interpreter), `responsive.ts`
  (breakpoint-object flattening), `jsx-utils.ts` (AST helpers).
- Components with no bestax equivalent (Element, Tile) keep a trimmed, TODO-annotated RBC
  import so the code still runs during gradual migration.

## Testing

- Fixture pairs: `__testfixtures__/<case>.input.tsx` → `.output.tsx`, exact-match. To
  update outputs after changing the transform, regenerate them by running the built
  transform over the inputs and reviewing the diff — do not hand-edit drift in.
- Kitchen sink e2e (`e2e/kitchen-sink.test.ts`): copies `fixtures/kitchen-sink` to
  `.e2e-tmp/`, migrates it, and runs `tsc --noEmit` on the output against the built
  bulma-ui (`turbo` orders the build; see `bestax-migrate#test` in root turbo.json).
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
(`release.config.js`, tag `bestax-migrate@x.y.z`). The skill lives at repo-root
`skills/bestax-migrate/` and is deliberately **not** bundled into create-bestax (existing
sites only) — keep `create-bestax/scripts/sync-skills.mjs` untouched. When the mapping
gains or loses coverage, update `skills/bestax-migrate/references/` and the docs migration
guide in the same PR.
