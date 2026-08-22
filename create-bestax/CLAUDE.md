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
  not listed (#540): there is no allowlist, so a new skill bundles without anyone remembering
  to add it, and a deleted one stops bundling. That replaced a hardcoded `SKILLS` array which
  errored on a listed-but-missing skill and said nothing about the reverse. Every skill now
  bundles; #385 settled only `bestax-migrate`'s case and kept the per-skill rule, so dropping
  that rule is #540's decision, taken on #385's reasoning. What is _not_ derivable is the
  prose rosters, this package's `CLAUDE_MD` roster in `src/constants.ts` among them. The
  `skills-roster` conformance check holds every one of them to the directory in both directions;
  `SKILL_ROSTERS` in `scripts/check-conformance.mjs` is the authoritative list, and its failure
  names each file you missed. **Never edit the bundled copy** — change `skills/` at the repo
  root; the build re-syncs.
- The `CLAUDE_MD` template in `constants.ts` is what every generated app tells its AI agents.
  When library conventions, skills, or the canonical docs entrypoint change (#203), check
  whether this template must change too.
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
