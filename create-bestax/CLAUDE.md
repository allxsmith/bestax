# create-bestax — the `npm create bestax` scaffolder

CLI that scaffolds a Vite app wired for `@allxsmith/bestax-bulma`. Agents and CI are
first-class consumers: **every prompt must have a flag equivalent**, and the non-interactive
path (`-y` + flags, no TTY) must never hang or regress (#192).

## Architecture

- `src/index.ts` — bin entry (Node version check); `src/cli.ts` — the commander program
- `src/prompts.ts` — interactive questions (each maps to a flag)
- `src/project-creator.ts` — writes the project: copies a template, injects options,
  installs skills, writes `CLAUDE.md`
- `src/constants.ts` — user-facing strings **and scaffolded-file templates** (e.g. the
  `CLAUDE_MD` template written into generated apps)
- `src/validators.ts`, `src/display.ts`, `src/file-system.ts` — support modules
- `templates/vite`, `templates/vite-ts` — the app templates

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
  users and to the MCP server while scaffolded apps keep the old text until an unrelated
  release happens by. When a `skills/` change corrects something users would otherwise
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
