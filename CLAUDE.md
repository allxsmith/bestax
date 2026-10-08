# bestax

React component library for **Bulma v1** in TypeScript. pnpm monorepo orchestrated by turbo:

- `bulma-ui/` — the library, published as `@allxsmith/bestax-bulma` (has its own CLAUDE.md)
- `docs/` — Docusaurus site → https://bestax.io (has its own CLAUDE.md)
- `create-bestax/` — the `npm create bestax` scaffolder (has its own CLAUDE.md)
- `bestax-migrate/` — the `bestax-migrate` codemod CLI, and in `codemod/` its Codemod Registry
  wrapper (has its own CLAUDE.md)
- `bestax-mcp/` — the `bestax-mcp` MCP server; its `data/` index is **generated**
  (has its own CLAUDE.md)
- `eslint-plugin/` — `@allxsmith/eslint-plugin-bestax`, lint rules for the library;
  its `src/generated/` metadata is **generated** (has its own CLAUDE.md)
- `skills/` — Agent Skills, a **shipped product** bundled into create-bestax (has its own CLAUDE.md)
- `plugin/`: the hand-written inputs of the `bestax` coding-agent plugin, which is **generated**
  into allxsmith/bestax-skills (see "The bestax plugin" below)
- `telemetry-worker/` — Cloudflare Worker ingesting the CLIs' opt-in telemetry
  (deployed from CI by `deploy-worker.yml` — a merged change under it ships to
  production immediately)
- `eval/agent-loop/` — cold-start eval harness: does an unassisted agent build correctly when
  given one of our guidance channels (the skills, the MCP server, both)? Frozen rubric, its
  own README
- `.github/` — CI and AI-automation workflows, **human-authored only** (has its own CLAUDE.md,
  which is the security contract for anything in `workflows/`)
- `scripts/gen-component-catalog.mjs` — generates the skill component catalog (`pnpm gen:catalog`)
- `scripts/gen-mcp-index.mjs` — generates the MCP server's data index (`pnpm gen:mcp`)
- `scripts/gen-skills-rosters.mjs` — writes the skill install rosters from `skills/` (`pnpm gen:skills`)
- `scripts/gen-skills-repo.mjs`: writes the allxsmith/bestax-skills tree into a directory
  (`node scripts/gen-skills-repo.mjs <dir>`, in a checkout with full history)
- `scripts/gen-eslint-meta.mjs` — generates the ESLint plugin's component metadata
  (`pnpm gen:eslint-meta`)

## Toolchain

Node 22 locally (`.nvmrc`; CI runs Node 24) and `pnpm@11.9.0` (pinned via `packageManager`; run
`corepack enable` once). Install with `pnpm install --frozen-lockfile` for CI parity.

## Commands

```bash
pnpm all            # the pre-PR gate: build, typecheck, test+coverage, bundle:stats, conformance, the three staleness checks, lint, format:check, storybook build
pnpm test           # jest (bulma-ui + create-bestax + bestax-migrate + bestax-mcp + eslint-plugin), then test:scripts
pnpm test:scripts   # the root scripts/ node:test suite, with coverage held to per-file floors (see below)
pnpm test:coverage  # coverage — thresholds live in each package's jest config (see below)
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit (each package's build program)
pnpm typecheck:tests # tsc over bulma-ui's tests and stories, which `typecheck` excludes
pnpm format         # prettier --write (format:check to verify; covers md/mdx too)
pnpm gen:catalog    # regenerate the skills component catalog (CI fails if stale)
pnpm gen:mcp        # regenerate the MCP server's data index (CI fails if stale)
pnpm gen:skills     # regenerate the skill install rosters (conformance fails if stale)
pnpm gen:eslint-meta # regenerate the ESLint plugin's metadata (CI fails if stale)
pnpm gen            # every generator (api docs, catalog, MCP index, skill rosters, eslint metadata)
pnpm docs           # Docusaurus dev server :3000
pnpm storybook      # Storybook dev server :6006
pnpm exec turbo run test --filter=@allxsmith/bestax-bulma   # scope any task to one package
```

- Run `pnpm format` before `pnpm lint`: lint includes prettier (`eslint-plugin-prettier`), so an
  unformatted tree fails lint while typecheck and tests pass, and `pnpm all` runs lint before
  `format:check` without formatting, so it fails there too. A multi-task `turbo run` buries the cause.
- `pnpm all` runs `bundle:stats` in a `turbo run` of its own, after the tests. It rebuilds
  `bulma-ui/dist`, which other packages' tests typecheck against, and nothing orders the two inside
  one run, so folding it back in brings back a flaky "is not a module" failure.

## Quality gates

Enforced by CI (`.github/workflows/ci.yml`):

- Coverage thresholds from the jest configs: **bulma-ui 99%** (all metrics);
  every other jest package 95% (78% branches). `docs` has no jest suite.
- The root `scripts/` suite has a coverage floor per file in `scripts/coverage-floors.json`,
  checked by `pnpm test:scripts` (which `pnpm test` and `pnpm all` run). Per file because a
  total hides a small script losing most of its coverage. A floor is where the file stood,
  less a small allowance on branches for run-to-run noise, not a target. A file below its
  floor fails, as does a loaded file with no row or a row no test loads. Floors are judged
  only on a green run, so without `bulma-ui/dist` the suites still fail on their own "build
  first" messages. `scripts/coverage-floors.mjs` has the rest, including when lowering a
  floor is the right fix.
- A stale generated artefact fails its own step: the skill catalog
  (`gen:catalog:check`), the MCP index (`gen:mcp:check`) and the ESLint
  plugin's metadata (`gen:eslint-meta:check`). Plus build, typecheck, lint,
  format, audit.
- **Tests and stories are type-checked too**, by a second project
  (`bulma-ui/tsconfig.test.json`, script `typecheck:tests`) — `tsconfig.json` excludes
  them because it is also the build's program. ts-jest transpiles rather than checks
  (the repo sets `isolatedModules`), so jest never stands in for this. Two consequences
  worth knowing: an `@ts-expect-error` in a test or story is live and fails as TS2578
  once it stops being needed, and in JSX the directive must sit in its OWN single-line
  `{/* … */}` — TypeScript anchors it to the line a comment STARTS on, so a multi-line
  one suppresses nothing (#663).
- **`pnpm build` is not a type gate.** `@rollup/plugin-typescript` reports semantic errors
  as warnings, so the build succeeds on source that does not type-check. The two `typecheck`
  scripts are what stands between a type error and a published package, which is why both
  run in CI even though one reads a subset of the other's files: `tsconfig.test.json`
  extends the build config and REPLACES its include/exclude rather than merging, so only the
  narrower `typecheck` checks the shipped program without `types/assets.d.ts` — and its
  `declare module '*.svg'` — in scope.
- House conventions fail via `pnpm check:conformance` (error messages name the file and fix);
  a **React 18/19 matrix** builds and tests bulma-ui on both majors.

Enforced in review (a green CI does **not** check these):

- CI only checks that a story and docs page **exist** per component — prop-level changes still
  need both updated, and skill-affecting changes update `skills/` **in the same PR**.
- Run `pnpm all` locally before opening a PR.

## Commits — release-affecting, not cosmetic

Conventional Commits, enforced by commitlint (husky `commit-msg` hook) and consumed by
semantic-release. Two repo-specific rules:

- Commits of type `feat|fix|perf|refactor|style|revert` **must** use a scope of `bulma-ui`, `docs`,
  `create-bestax`, `bestax-migrate`, `bestax-mcp`, or `eslint-plugin` — an unscoped commit of any of these
  scope-gated types is rejected
  (`RELEASE_SCOPES` in `commitlint.config.js` is the source of truth). One exception worth
  knowing: commitlint's default ignores skip git's own `Revert "…"` messages, so the hook cannot
  reject an unscoped revert in that form — keep reverts conventional and scoped by hand, and
  know that a scoped revert releases nothing: ship a rollback as `fix(<scope>)` (see
  VERSIONING.md for why).
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
- **Every bypass carries an expiry.** Entries in `allowBuilds` (grants only — a `pkg: false`
  denial restates the default and is exempt), `overrides`, `minimumReleaseAgeExclude` and
  `auditConfig.ignoreGhsas` need `# bestax:review YYYY-MM-DD — why` (or `# bestax:permanent — why`
  for standing policy) in the comment above them. `check:conformance --only=bypass-expiry` fails
  on a missing annotation and again once a date arrives, so a temporary bypass can't silently
  become permanent (#391). A blocking audit gate plus the cooldown means a fresh advisory can red
  every open PR — CONTRIBUTING.md has the runbook.
- Isolated node linker: undeclared (phantom) dependencies fail — declare everything you import.
- **How a package publishes decides what its manifest may contain.** `npm publish` resolves
  no pack-time protocol at all, so a package published that way must not ship one — the
  tarball becomes uninstallable (#412). Every package here hands its publish step to
  `pnpm publish` instead (#436 for bestax-migrate, #532 for the rest), through the shared
  `scripts/lib/pnpm-publish.mjs`, which buys each a **narrow** exemption:
  `workspace:`/`catalog:` in **devDependencies** only. `jsr:` becomes an aliased
  `npm:@jsr/…` specifier and `link:`/`portal:`/`file:` are not rewritten at all, so each
  of those is a violation in **any** section, exemption or not. `workspace:`/`catalog:` are
  additionally a violation in a section consumers resolve, since pnpm resolving them does
  not stop every consumer being made to install the dependency. Which packages publish with pnpm
  is **declared** in `check:conformance` rather than inferred from their release config —
  inferring it meant parsing semantic-release's config format, which was wrong four times,
  and every miss granted the exemption. A workspace **sibling** in `dependencies` or
  `optionalDependencies` is separately a violation however the specifier is spelled (#537), and
  the only way through is a line in `SIBLING_RUNTIME_DEPS` — same declared shape — for a
  package that depends on a sibling at runtime on purpose (#644: the three CLIs and
  the ESLint plugin on `@allxsmith/bestax-bulma`, the way bulma-ui declares `bulma`); the test holds that declaration
  to the real manifests, so a removed dependency cannot leave a standing exemption.

## Workflow

PRs target `main`; direct pushes to `main` are not allowed — a repository ruleset enforces
this, and its only automation bypass is the GitHub App that pushes semantic-release's
`chore(release)` commit. Full contributor guide:
`CONTRIBUTING.md`; for a new component, `CONTRIBUTING-COMPONENTS.md` is the end-to-end
checklist. New components should stay within the Bulma spec — propose anything beyond it in
an issue first.

AI/LLM surfaces: the docs build publishes an LLM index (see `docs/CLAUDE.md`); the skills are a
shipped product (see `skills/CLAUDE.md`); the MCP server serves a generated index of both (see
`bestax-mcp/CLAUDE.md`). This file is also read by **CodeRabbit** (PR reviews), by the
**`@claude`** GitHub Action and the Claude deep review (project instructions), and by
**bestaxbot**'s sessions, so keep it accurate.

**The bestax plugin.** The `bestax` coding-agent plugin, the skills plus the MCP server, installs
from its own repository, allxsmith/bestax-skills, so an install does not clone this one.
`.github/workflows/skills-publish.yml` generates that repository's whole tree with
`scripts/gen-skills-repo.mjs`, from `skills/`, `plugin/` and bestax-mcp's `server.json`,
`package.json` and `data/skills.json`, each time one of them changes on `main` and after each
bestax-mcp release. Never edit bestax-skills. Change the source here and the workflow carries it
over once merged. The generator reuses the repo's readers rather than its own: the skill vetting
gate in `scripts/lib/skills.mjs`, the `server.json` reader in `scripts/mcp-registry-publish.mjs`,
and the region helpers in `scripts/lib/api-page.mjs`. Its header lists the rest.

- `plugin/manifest.json` holds the manifest fields. Its `plugin.version` is MAJOR.MINOR only.
  The generator appends a patch, the number of commits on `main` that touched the plugin's
  content (`CONTENT_PATHS`) plus `OUTPUT_FORMAT`, both in the generator, so the version in the
  Agent Plugins `plugin.json`, `.claude-plugin/plugin.json` and `.cursor-plugin/plugin.json`
  rises with each content commit and nobody bumps it by hand. A generator change that alters the published output raises
  `OUTPUT_FORMAT` in the same PR. Its tests pin a hash of the tree built from fixed inputs next
  to `OUTPUT_FORMAT`, so a change to the output for those inputs fails until the two are updated
  together, and a comment-only change passes. They see only the paths those inputs reach, so a
  new rendering path gets an input of its own. Bump the minor whenever a path leaves
  `CONTENT_PATHS`, since the count can then fall. The workflow's paths filter is
  `PUBLISH_PATHS`, the content plus the generator's code. Claude Code updates users only when
  the version changes, so a missed `OUTPUT_FORMAT` bump holds them back. The bestax-mcp pin is
  read from bestax-mcp's `package.json`, and the publish run refuses one npm does not serve
  (`--require-published`).
- `plugin/icon.png` is the plugin's icon, published as `.claude-plugin/icon.png` and named by
  `icon` in the Claude manifest. The generator refuses one that is not a complete PNG, square,
  512 to 2048 px a side and under 2 MB. Its header has the ImageMagick command that renders it
  from `docs/static/img/logo.svg`. Anthropic's directory takes the icon only the first time the
  plugin is saved or submitted, so a new one does not reach an existing listing.
- `plugin/logo.png` is the same logo on a white background, published as `assets/logo.png` and
  named by `logo` in `.cursor-plugin/plugin.json`, the manifest the Cursor Marketplace reviews.
  Cursor asks for a logo with a background plate, so the generator refuses one that is not a
  complete square PNG or that can hold a transparent pixel. The generator's header has its
  ImageMagick command too. That manifest takes its display name from `cursor.displayName` in
  `plugin/manifest.json`.
- `plugin/SECURITY.md` is copied as written to bestax-skills' `SECURITY.md`. That repository has
  its issues turned off, so the file gives the private reporting channels and links the monorepo's
  `SECURITY.md` for the rest. A change to how vulnerabilities are reported updates both.
- `gemini-extension.json` makes bestax-skills a Gemini CLI extension, with the same server launch
  as the Claude manifest. Gemini's extension gallery lists a repository that has this file and the
  `gemini-cli-extension` topic. A tree cannot carry a topic, so it is set by hand on bestax-skills.
- `plugin/README.md` becomes the repository's README, and it must say everything the plugin
  runs, sends or fetches. Its skill list and the server's launch command and environment
  variables are generated into its `bestax:generated` regions, from the skill index and
  `server.json`. The prose around them is hand-written: a change to what bestax-mcp does over
  the network, to its telemetry or to its dependencies updates it in the same PR.
- The generator fails on a tree that breaks a rule of Anthropic's plugin directory, and its tests
  run it on the real tree, so `pnpm test` catches a skill change that would.

## Distribution and listings

`docs/docs/guides/distribution.md` lists the registries, plugin marketplaces, directories and
curated lists we know carry Bestax, and marks which ones only change when a maintainer updates
them by hand. Third-party entries copy facts from this repo, and no check here can see them.

- Read its "What goes stale" section before a change that adds, renames or removes a skill,
  changes what `bestax-mcp` offers or how it starts, ships a new major, renames or moves a
  package or a bestax.io page, or changes an install command. Say in the PR which listings
  that section names need a manual update.
- Update the page in the same PR when a listing is added, accepted or removed, or when how one
  updates changes.

## AI review and bestaxbot

Every PR gets a CodeRabbit review. A Claude deep review, run by this repository's own
`claude-review.yml` and posting as `claude[bot]`, runs on bestaxbot's PRs once CI is green
and on any same-repo PR a triage+ user labels `deep-review`, never on a fork. `@claude`
mentions (`claude.yml`) are maintainer-only. Both read the `AI_CLAUDE_ENABLED` repository
variable: exactly `true` turns them on; anything else, unset included, is off. Copilot may
review too. `.github/CLAUDE.md` is the security contract for those workflows.

**bestaxbot** is a GitHub App maintained in a separate private repository. Describe it here
and in the docs by what it does in this repository, never by its internals: no prompts,
models, caps, budgets, runners, tokens or file names. The ai-development docs guide is the
public description, and this section must not say more than that guide does.

What it does here: implements `claude-fix` issues on `claude/` branches and opens the PR;
answers every review thread on its own PRs (fixes what is right, refutes what is wrong,
never resolves a reviewer's threads, and asks for a re-check by re-applying `deep-review`);
drafts a reproduction test on `claude-repro` for a human to run (CI never runs it); triages
new issues and PRs for duplicates and related work; screens new items for malicious code,
prompt injection and social engineering; keeps a status comment current on its PR; hands a
converged PR to a human with `needs-human-review`; replies to `@bestaxbot`. What it never
does: merge, approve or enable auto-merge; push outside `claude/`; change workflows,
release, commitlint, coverage or dependency policy; add dependencies; act on an item
carrying `needs-security-review`; run fork code.

**The labels are the contract.** Never add or remove the bot's labels on PRs you do not own.

- `claude-fix` (issues, triage+): the bot implements it and opens a PR.
- `claude-repro` (issues, triage+): the bot drafts a repro test for a human to run.
- `ai-triage` (issues and PRs, triage+): triage on demand; the label comes off when done.
- `deep-review` (PRs, triage+; the bot on its own PRs): starts the deep review. A re-run is
  remove-and-re-add, since re-applying a label already present emits no event; pushes and
  comments start nothing. A re-run settles that review's open threads and raises nothing
  new. A comment starting `deep-review: fresh` from a triage+ author asks for a full review
  of the current code and stays in force until a newer `deep-review:` comment from a
  triage+ author replaces it, so getting the settle pass back means changing the steer,
  never a label action.
- `ai-loop` (the bot's PRs): the bot is working the PR. Remove it to stop the bot there; add
  it back to resume from the current head.
- `ai-loop-paused`: the bot parked itself; its note on the PR says why.
- `needs-human-review`: converged or contested; the owner reviews and squash-merges. The
  label also runs the screenshot pass (`story-screenshots.yml`).
- `review-converged`: set by `review-converged.yml` on a `deep-review` PR based on the
  default branch, the bot's included, when the newest deep review is pinned to the head
  with nothing open, every thread is resolved and every check is green; a later push takes
  it off until a fresh review. `scripts/review-converged.mjs` holds the definition.
- `needs-security-review`: the bot and `@claude` refuse the item until a maintainer removes
  it; third-party reviewers are not gated; a clean screen covers the text at open time only.
  If `@claude` seems to ignore a mention, check for this label first.
- `claude-assisted`: provenance; the bot's PRs and any PR carrying the Claude Code footer.
- `stale` / `neverstale`: the stale sweep and its exemption. `slop` (triage+): a low-quality
  AI-generated PR; `on-slop.yml` posts a standard note and closes it.

**Reviewer mechanics.** CodeRabbit reviews incrementally and rate-limits on OSS. After it
posts "review limit reached" it will not retry on its own; once the window resets, push a
commit or comment `@coderabbitai review`. Copilot re-reviews on push. A deep review lands as
a PR review from `claude` marked `<!-- claude-deep-review -->` and reviewed the code checked
out when its run started, which a racing push may have superseded, so look for that review
and verify its findings against current code. A PR whose copy of `claude-review.yml`
differs from the default branch's gets no deep review: the run skips on workflow validation
and posts nothing while the job still goes green, so check for the review, never the job's
conclusion, and merge `main` into the branch after any edit to that file.

**Guardrails.** Humans always merge. A repository ruleset confines the bot to `claude/`
branches and its App holds no permission to change workflows, so a PR touching `.github/**`
or the jest, commitlint, release or pnpm-workspace configs is a human's to write. After a
bounded number of rounds the bot parks a PR rather than thrashing. Remove `ai-loop` to stop
one PR; the maintainers can stop the bot entirely. The bot's code being private is defence
in depth, not a control: every gate is enforced by GitHub against the App's identity and
holds with the code public or not.
