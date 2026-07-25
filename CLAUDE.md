# bestax

React component library for **Bulma v1** in TypeScript. pnpm monorepo orchestrated by turbo:

- `bulma-ui/` — the library, published as `@allxsmith/bestax-bulma` (has its own CLAUDE.md)
- `docs/` — Docusaurus site → https://bestax.io (has its own CLAUDE.md)
- `create-bestax/` — the `npm create bestax` scaffolder (has its own CLAUDE.md)
- `skills/` — Agent Skills, a **shipped product** bundled into create-bestax (has its own CLAUDE.md)
- `scripts/gen-component-catalog.mjs` — generates the skill component catalog (`pnpm gen:catalog`)

## Toolchain

Node 22 locally (`.nvmrc`; CI runs Node 24) and `pnpm@11.9.0` (pinned via `packageManager`; run
`corepack enable` once). Install with `pnpm install --frozen-lockfile` for CI parity.

## Commands

```bash
pnpm all            # the pre-PR gate: build, typecheck, test+coverage, bundle:stats, lint, format:check, storybook build
pnpm test           # jest (bulma-ui + create-bestax)
pnpm test:coverage  # coverage — thresholds live in each package's jest config (see below)
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm format         # prettier --write (format:check to verify; covers md/mdx too)
pnpm gen:catalog    # regenerate the skills component catalog (CI fails if stale)
pnpm docs           # Docusaurus dev server :3000
pnpm storybook      # Storybook dev server :6006
pnpm exec turbo run test --filter=@allxsmith/bestax-bulma   # scope any task to one package
```

## Quality gates

Enforced by CI (`.github/workflows/ci.yml`):

- Coverage thresholds from the jest configs: **bulma-ui 99%** (all metrics),
  create-bestax 95% (78% branches).
- Stale skill catalog fails (`gen:catalog:check`); build, typecheck, lint, format, audit.
- House conventions fail via `pnpm check:conformance` (error messages name the file and fix);
  a **React 18/19 matrix** builds and tests bulma-ui on both majors.

Enforced in review (a green CI does **not** check these):

- CI only checks that a story and docs page **exist** per component — prop-level changes still
  need both updated, and skill-affecting changes update `skills/` **in the same PR**.
- Run `pnpm all` locally before opening a PR.

## Commits — release-affecting, not cosmetic

Conventional Commits, enforced by commitlint (husky `commit-msg` hook) and consumed by
semantic-release. Two repo-specific rules:

- Commits of type `feat|fix|perf|refactor|style` **must** use a scope of `bulma-ui`, `docs`, or
  `create-bestax` — unscoped release types are rejected (`commitlint.config.js`).
- **Packages release independently, keyed off the scope**: `feat(bulma-ui)` bumps only
  `@allxsmith/bestax-bulma`; `fix(create-bestax)` bumps only `create-bestax`. The
  `releaseRules` in each package's `release.config.js` are the source of truth.

```
feat(bulma-ui): add Collapse component   → minor release of bulma-ui only
fix(create-bestax): handle missing TTY   → patch release of create-bestax only
docs: fix typo in contributing guide     → no release; scope optional
```

Full versioning details (breaking-change footers, tag formats): `VERSIONING.md`.

## Dependencies are a deliberate act

`pnpm-workspace.yaml` (read its comments before touching deps) enforces supply-chain hardening:

- Install/postinstall scripts are **blocked by default** — new native deps need an `allowBuilds` entry.
- `minimumReleaseAge` cooldown: versions younger than 3 days won't install.
- Isolated node linker: undeclared (phantom) dependencies fail — declare everything you import.

## Workflow

PRs target `main`; direct pushes to `main` are not allowed. Full contributor guide:
`CONTRIBUTING.md`; for a new component, `CONTRIBUTING-COMPONENTS.md` is the end-to-end
checklist. New components should stay within the Bulma spec — propose anything beyond it in
an issue first.

AI/LLM surfaces: the docs build publishes an LLM index (see `docs/CLAUDE.md`); the skills are a
shipped product (see `skills/CLAUDE.md`). This file is also read by **CodeRabbit** (PR reviews)
and the **`@claude`** GitHub Action (project instructions), so keep it accurate.

## AI development loop

Issues labeled `claude-fix` (requires triage+ access, verified live) are implemented autonomously: Claude opens a PR labeled
`ai-loop`, CodeRabbit + a Claude deep review comment on it, and `claude-pr-loop.yml` drives
fix/verify rounds (cap 4) until CI is green and every AI review thread is resolved. Labels:
`ai-loop` (in the loop), `needs-human-review` (converged or contested — owner reviews and
squash-merges manually; the loop never merges), `ai-loop-paused` (cap/guard hit). A triage+
user can also apply the opt-in `deep-review` label to any PR to run the Claude deep
review on it (re-applying the label re-runs it; a `deep-review:`-prefixed PR comment from
a triage+ user pre-steers its focus). AI-assisted PRs (bestaxbot author or the
Claude Code attribution footer) also get an auto-applied `claude-assisted` provenance
label. Kill switches: remove `ai-loop` (per PR) or set repo
variable `AI_LOOP_ENABLED=false` (whole system). The `<!-- ai-loop-state … -->` PR comment
is machine-managed — never reformat its first line. The loop refuses PRs that touch
`.github/**` or the jest/commitlint/release/pnpm-workspace configs.
Separately, `ai-triage` runs a one-shot sonnet triage session that comments with related
issues/duplicates: automatic on new issues/PRs when `AI_TRIAGE_MODE=auto` (outside authors
capped at `AI_TRIAGE_DAILY_LIMIT`/day via a counter comment on issue #290; items opened by
triage+ collaborators are uncapped), or on demand via the label
(triage+ only, budget-exempt; auto-removed after the run). Fork PRs are never triaged
(same-repo `pull_request` only — never `pull_request_target`; see #312). Flagged duplicates may be
auto-closed after 14 days per `AI_TRIAGE_AUTOCLOSE` (see the ai-development docs guide).
Stale automation: PRs go `stale` at 30 days and close 14 days later — except Claude-assisted
PRs (`claude-assisted` label or bestaxbot author), which skip that sweep and instead close
after 90 days of inactivity; `neverstale` exempts a PR from both layers.
