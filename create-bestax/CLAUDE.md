# create-bestax — the `npm create bestax` scaffolder

CLI that scaffolds a Vite app wired for `@allxsmith/bestax-bulma`. Agents and CI are
first-class consumers: **every prompt must have a flag equivalent**, and the non-interactive
path (`-y` + flags, no TTY) must never hang or regress (#192).

The one question `-y` does not answer is whether to delete a non-empty target directory: only
`--overwrite` or a yes at the prompt does, and without either the run stops and changes nothing.
Every flag is validated before anything on disk changes, and the directory is emptied only after
the last prompt, so a typo or a Ctrl+C never costs the user their files (#945).

## Architecture

- `src/index.ts` — bin entry (Node version check); `src/cli.ts` — the commander program.
  Every run goes through `runCLI`, which drops the `--` that pnpm and bun forward verbatim, so
  `<pm> create bestax my-app -- -t vite-ts` works under every package manager (#950)
- `src/prompts.ts` — interactive questions (each maps to a flag)
- `src/project-creator.ts` — writes the project: copies a template, injects options,
  installs skills, writes `CLAUDE.md`
- `src/constants.ts` — user-facing strings **and scaffolded-file templates** (e.g. the
  `CLAUDE_MD` template written into generated apps)
- `src/validators.ts`, `src/display.ts`, `src/file-system.ts` — support modules
- `templates/vite`, `templates/vite-ts` — the app templates

## Dependencies

`@allxsmith/bestax-bulma` is a declared runtime dependency (#644). The scaffolder is built for
the library and its manifest says so, the way bulma-ui declares `bulma` without importing it:
nothing in `src/` imports the library, the templates pin the published package themselves
(`^5.0.0` in `templates/*/package.json`), and the e2e installs from the registry with
`--ignore-workspace`. It is spelled `workspace:^`, which `pnpm publish` rewrites to the release
current at pack time (bulma-ui releases first in the same job), and the sibling rule in
`check:conformance` allows it only because `SIBLING_RUNTIME_DEPS` declares this exact pair.
What a consumer sees: `npm create bestax` installs the library, `bulma`, and `react`/`react-dom`
alongside the CLI.

`react` and `react-dom` are declared dependencies too, with the library's peer ranges, though
nothing imports them either. npm installs a dependency's peers by itself, but Yarn 1 does not,
and without them `yarn create bestax` warned that the library's peers were unmet (#950). npm
installs the same packages either way. `src/__tests__/package-manifest.test.ts` fails when this
manifest leaves out a required peer of the installed library or gives one a range outside it, and
`check:conformance --only=peer-ranges` fails when a peer it declares carries anything but the
library's whole peer range, written the same way. Dependabot narrows these ranges when it bumps
react (#1012), so restore them on its PR; when the peer range itself moves, change them in a
`fix(create-bestax)` commit so the CLI releases with it.

## Sync rules (this package re-ships other parts of the repo)

- `pnpm build` and `prepack` run `scripts/sync-skills.mjs`, which copies **every directory
  under the repo-root `skills/` that holds a `SKILL.md`** into the package. The roster is read,
  not listed (#540): every skill bundles by construction, with no allowlist to join. Full
  provenance (#385 vs #540) and the slot for a future per-skill opt-out live in that script's
  header. If such an opt-out is ever exercised, the docs pages that assert bundling —
  today `docs/docs/skills/migrate.mdx` and `docs/docs/skills/intro.md` — must be corrected in
  the same change: no automated check reads those claims. What is _not_ derivable is the
  prose rosters, this package's `CLAUDE_MD` roster in `src/constants.ts` among them. The
  `skills-roster` conformance check holds every one of them to the directory in both directions;
  `SKILL_ROSTERS` in `scripts/check-conformance.mjs` is the authoritative list, and its failure
  names each file you missed. **Never edit the bundled copy** — change `skills/` at the repo
  root; the build re-syncs.
- **A correction to a skill's _content_ does not reach `npm create bestax` until this
  package itself releases.** `release.config.js` refuses every commit scoped to something
  else (`{ scope: '!(create-bestax)', release: false }`), and the bundled copy under
  `templates/skills` is a gitignored build artifact, so it carries no tracked diff that
  could trigger one. A fix landed as `fix(bestax-migrate)` therefore ships to that CLI's
  users and to the MCP server while scaffolded apps keep the old text until some unrelated
  create-bestax release comes along. When a `skills/` change corrects something users would otherwise
  keep receiving, land a `fix(create-bestax)` commit with it (#597).
- The `CLAUDE_MD` template in `constants.ts` is what every generated app tells its AI agents.
  When library conventions, skills, or the canonical docs entrypoint change (#203), check
  whether this template must change too.
- `src/telemetry-core.ts` is the shared consent/beacon kernel, duplicated
  byte-for-byte into `bestax-migrate/src/telemetry-core.ts` (standalone
  publishes, no bundler — so no workspace package). **Edit the copy here, then
  copy it over migrate's**; `check:conformance --only=telemetry-core` fails on
  any divergence. Tool-specific payload builders stay in each package's
  `src/telemetry.ts`, and the worker's allowlists must gain new enum values
  FIRST (`check:conformance --only=telemetry-allowlists`) or events are
  silently dropped at ingest.
- Templates pin the library's CSS import and icon setup — a change to bulma-ui's published
  exports or flavors (`bestax.css`, `versions/*.css`) may require a template update.
- The scaffolder edits the starter `App` with string patterns, so `src/__tests__/templates.test.ts`
  runs every edit against the real templates. Under a `noHelpers` flavor each helper prop in
  the starter becomes a named class from `NO_HELPERS_STARTER_CLASSES` in `src/constants.ts`;
  a helper prop added to the starter needs a row there, and that test fails until it has one.
  The icon step runs after that swap and writes into the same `App`, so what it inserts can
  use no helper prop at all; the test scans the `App` both steps leave behind.
- An icon library's `packageVersion` follows the newest arm of bestax-bulma's peer range for
  it, not the newest release: on a 0.x package the caret holds the minor, so a pin past the
  peer range makes npm refuse the scaffold's install. The same test holds the two together.

## Testing

- Unit: `pnpm --filter create-bestax test` (jest, ESM via `--experimental-vm-modules`).
- E2E: `pnpm --filter create-bestax test:e2e` (Playwright, `e2e/` — scaffolds real apps and
  boots them; see `e2e/README.md`).
- Manual smoke: build, then scaffold **outside the repo**
  (`node create-bestax/dist/index.js /tmp/app -t vite-ts -y`) — inside the workspace you'd
  need `--ignore-workspace`.

## Releases

Independent semantic-release keyed off the `create-bestax` commit scope
(`release.config.js`, tag `create-bestax@x.y.z`). It publishes with
`pnpm publish`, like every package here (#532) — the command, its flags, and the
ways that publish fails quietly are documented in `VERSIONING.md` and
`scripts/lib/pnpm-publish.mjs`.

Its `prepack` runs the guard and then `scripts/sync-skills.mjs`, so the skills
bundled into `templates/` are refreshed as part of packing rather than
committed. There is no `postpack` because nothing is swapped out, only copied
in — a local `pnpm pack` therefore leaves `templates/skills/` populated, which
is gitignored and expected.
