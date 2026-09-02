# bestax

React component library for **Bulma v1** in TypeScript. pnpm monorepo orchestrated by turbo:

- `bulma-ui/` — the library, published as `@allxsmith/bestax-bulma` (has its own CLAUDE.md)
- `docs/` — Docusaurus site → https://bestax.io (has its own CLAUDE.md)
- `create-bestax/` — the `npm create bestax` scaffolder (has its own CLAUDE.md)
- `bestax-migrate/` — the `bestax-migrate` codemod CLI (has its own CLAUDE.md)
- `bestax-mcp/` — the `bestax-mcp` MCP server; its `data/` index is **generated**
  (has its own CLAUDE.md)
- `skills/` — Agent Skills, a **shipped product** bundled into create-bestax (has its own CLAUDE.md)
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

## Toolchain

Node 22 locally (`.nvmrc`; CI runs Node 24) and `pnpm@11.9.0` (pinned via `packageManager`; run
`corepack enable` once). Install with `pnpm install --frozen-lockfile` for CI parity.

## Commands

```bash
pnpm all            # the pre-PR gate: build, typecheck, test+coverage, bundle:stats, lint, format:check, storybook build
pnpm test           # jest (bulma-ui + create-bestax + bestax-migrate + bestax-mcp)
pnpm test:coverage  # coverage — thresholds live in each package's jest config (see below)
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm format         # prettier --write (format:check to verify; covers md/mdx too)
pnpm gen:catalog    # regenerate the skills component catalog (CI fails if stale)
pnpm gen:mcp        # regenerate the MCP server's data index (CI fails if stale)
pnpm gen:skills     # regenerate the skill install rosters (conformance fails if stale)
pnpm gen            # all four generators (api docs, catalog, MCP index, skill rosters)
pnpm docs           # Docusaurus dev server :3000
pnpm storybook      # Storybook dev server :6006
pnpm exec turbo run test --filter=@allxsmith/bestax-bulma   # scope any task to one package
```

Run `pnpm format` before `pnpm lint` when running a subset by hand: lint includes prettier
(`eslint-plugin-prettier`), so an unformatted tree fails lint while typecheck and tests pass, and
turbo reports "1 of 3 successful" with the cause several screens up. `pnpm all` orders them.

## Quality gates

Enforced by CI (`.github/workflows/ci.yml`):

- Coverage thresholds from the jest configs: **bulma-ui 99%** (all metrics);
  every other jest package 95% (78% branches). `docs` has no jest suite.
- Stale skill catalog fails (`gen:catalog:check`) and a stale MCP index fails
  (`gen:mcp:check`); build, typecheck, lint, format, audit.
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
  `create-bestax`, `bestax-migrate`, or `bestax-mcp` — an unscoped commit of any of these
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
  `npm:@jsr/…` specifier and `link:`/`portal:`/`file:` are not rewritten at all, so those
  four are a violation in **any** section, exemption or not. `workspace:`/`catalog:` are
  additionally a violation in a section consumers resolve, since pnpm resolving them does
  not stop every consumer being made to install the dependency. Which packages publish with pnpm
  is **declared** in `check:conformance` rather than inferred from their release config —
  inferring it meant parsing semantic-release's config format, which was wrong four times,
  and every miss granted the exemption.

## Workflow

PRs target `main`; direct pushes to `main` are not allowed — a repository ruleset enforces
this, and its only automation bypass is the GitHub App that pushes semantic-release's
`chore(release)` commit. Full contributor guide:
`CONTRIBUTING.md`; for a new component, `CONTRIBUTING-COMPONENTS.md` is the end-to-end
checklist. New components should stay within the Bulma spec — propose anything beyond it in
an issue first.

AI/LLM surfaces: the docs build publishes an LLM index (see `docs/CLAUDE.md`); the skills are a
shipped product (see `skills/CLAUDE.md`); the MCP server serves a generated index of both (see
`bestax-mcp/CLAUDE.md`). This file is also read by **CodeRabbit** (PR reviews)
and the **`@claude`** GitHub Action (project instructions), so keep it accurate.

## AI development loop

**The fix loop.** Issues labeled `claude-fix` (requires triage+ access, verified live) are
implemented autonomously: Claude opens a PR labeled `ai-loop`, CodeRabbit + a Claude deep
review comment on it, and `claude-pr-loop.yml` drives fix/verify rounds (cap 4) until CI is
green and every AI review thread is resolved.

- **Labels:** `ai-loop` (in the loop), `needs-human-review` (converged or contested — owner
  reviews and squash-merges manually; the loop never merges), `ai-loop-paused` (cap/guard
  hit). AI-assisted PRs (bestaxbot author or the Claude Code attribution footer) also get
  an auto-applied `claude-assisted` provenance label.
- **Deep review on demand:** a triage+ user can apply the opt-in `deep-review` label to any
  PR to run the Claude deep review on it (re-applying the label re-runs it; a
  `deep-review:`-prefixed PR comment from a triage+ user pre-steers its focus). Its output
  lands as a PR review from `claude` marked `<!-- claude-deep-review -->`; it reviewed the
  code checked out when its workflow started, which a racing push may have superseded — so
  look for that review comment (not the current head's checks) and verify its findings
  against current code. **Today a PR whose copy of `claude-review.yml` differs from the default
  branch's is not deep-reviewed:** the run logs `Skipping action due to workflow validation` and
  posts nothing while the job still goes green — so check for the review comment, never the job's
  conclusion. Read that condition as written, because the narrower version ("a PR that _modifies_
  `claude-review.yml`") is what this line said until it bit. The workflow runs from the **PR
  head's** copy, so what matters is only whether that copy still matches the default branch —
  never the branch's age, and never whether the PR touched the file. An old branch that has since
  merged or rebased the current version is fine; a branch opened five minutes ago off a stale
  base is not. #578's flip changed the file, so every PR still carrying the pre-flip copy
  inherited a skipped review; #605 reproduced it (`"egress_policy":"audit"` read from the branch's
  own retained copy, session skipped) and merging `main` in fixed it. Expect this after any edit
  to `claude-review.yml`, and confirm the head's copy matches before trusting a green
  deep-review job. That is a
  consequence of configuration rather than a property of the action: the validation lives on
  the OIDC to app-token exchange, and `setupGitHubToken()` returns before reaching it whenever
  a `github_token` input is supplied — the same early return `ai-triage.yml` already documents
  for #312. `claude-review.yml` and `claude.yml` are where this bites in practice, but they are
  not the only jobs that omit the input: `claude-pr-loop.yml`'s `verify` omits one too. Its
  usual triggers (`workflow_run` / `workflow_dispatch` / `schedule`) are not PR contexts, so the
  validation path is not reached on them — but that workflow also fires on
  `pull_request_review`, and its gate can select `verify` on that event, so a PR modifying
  `claude-pr-loop.yml` can hit the same silent skip on the review-triggered path. Treat
  "omits `github_token` **and** can run in a PR context" as the test, not the workflow name.
  Supplying `GITHUB_TOKEN` would
  restore the review, at the cost of moving the posting identity away from `claude`, which the
  loop's gate and the `<!-- claude-deep-review -->` convention rely on. Weigh that before
  changing it.
- **Reviewer mechanics:** CodeRabbit reviews incrementally and rate-limits on OSS. After it
  posts "review limit reached" it will not retry on its own; once the window resets, push a
  commit or comment `@coderabbitai review`. Copilot also auto-reviews PRs and re-reviews on
  push.
- **State comment:** the `<!-- ai-loop-state … -->` PR comment is machine-managed — never
  reformat its first line.
- **Refusals:** the loop refuses PRs that touch `.github/**` or the
  jest/commitlint/release/pnpm-workspace configs — workflow changes are human-authored, and
  `.github/CLAUDE.md` states the rules they must hold to (allowlists are a confinement
  boundary and never widen casually; action SHAs stay on the repo-wide pin; anything that
  spends model usage gates on `== 'on'`).

**Kill switches and variables.** Remove `ai-loop` (per PR) or set repo variable
`AI_LOOP_ENABLED=false` (whole system). Every repository variable that steers this
automation is tabulated in the ai-development docs guide, including which ones require an
exact value. Everything that spends model usage is explicit opt-in —
`AI_LOOP_ENABLED=true`, `AI_SCAN_MODE=on` (or `y`), `AI_LOOP_COPILOT=true` — so unset,
empty, `off` or a typo all mean off, and deleting a variable never enables anything.
`AI_TRIAGE_MODE` is the exception: its label path is `!= 'off'`, so unset still allows
label-triggered triage.

**Triage.** `ai-triage` runs a one-shot sonnet triage session that searches for related
issues/duplicates and reports them as a structured payload; the session itself posts nothing
(#457). `scripts/render-triage-comment.mjs` renders the comment deterministically
from that payload in the session's own job, and a separate job — holding the PAT and
running no model — publishes it as bestaxbot. Triage is
automatic on new issues/PRs when `AI_TRIAGE_MODE=auto` (outside authors
capped at `AI_TRIAGE_DAILY_LIMIT`/day via a counter comment on issue #290; items opened by
triage+ collaborators are uncapped), or on demand via the label (triage+ only,
budget-exempt; auto-removed after the run). Fork PRs are never triaged (same-repo
`pull_request` only — never `pull_request_target`; see #312). Flagged duplicates may be
auto-closed after 14 days per `AI_TRIAGE_AUTOCLOSE` (see the ai-development docs guide).

**Repro drafts.** A triage+ user can apply `claude-repro` to an issue: Claude drafts a
reproduction test (author-only — never executed by CI) that github-actions[bot] posts for a
human to run; the pipeline holds no PAT and no job co-locates the model token with code
execution.

**Security scan.** `ai-scan.yml` read-only-scans new issues/PRs for malicious code, prompt
injection, and social engineering, applying `needs-security-review` (fail-closed; controls
`AI_SCAN_MODE`, `AI_SCAN_DAILY_LIMIT`). A clean verdict is advisory (it only covers the
text as it was at open time), but the flag itself **gates every entry point this repo
controls** — `claude-repro`, `claude-fix`, `@claude` and `@bestaxbot` all refuse a flagged
item until a maintainer removes the label. If `@claude` seems to ignore a mention, check
for that label first.

**Stale automation.** PRs go `stale` at 30 days and close 14 days later — except
Claude-assisted PRs (`claude-assisted` label or bestaxbot author), which skip that sweep
and instead close after 90 days of inactivity; `neverstale` exempts a PR from both layers.
