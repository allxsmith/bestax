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

- `pnpm build` and `prepack` run `scripts/sync-skills.mjs`, which copies **the skills named
  in its hardcoded `SKILLS` allowlist** — not the whole repo-root `skills/` dir — into the
  package. An unlisted skill silently doesn't bundle; a delisted one silently vanishes (the
  script empties the destination first, and its success line reports the array length either
  way); no CI check compares the list against `skills/*`. Bundling is a per-skill policy
  decision (bestax-migrate's was settled as bundled, #385) — when adding a skill, decide it
  explicitly and keep the allowlist, `skills/README.md`, `docs/docs/skills/intro.md`, any
  per-skill docs page that states bundling (`docs/docs/skills/migrate.mdx` does), and the
  `CLAUDE_MD` roster in `src/constants.ts` in agreement. **Never edit the bundled copy** — change `skills/` at the
  repo root; the build re-syncs.
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
