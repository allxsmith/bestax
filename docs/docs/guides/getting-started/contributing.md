---
title: Contributing
sidebar_label: Contributing
sidebar_position: 10
---

# Contributing to bestax-bulma

Thanks for your interest in contributing! This page mirrors the highlights of the repository's
[`CONTRIBUTING.md`](https://github.com/allxsmith/bestax/blob/main/CONTRIBUTING.md) — which stays the
canonical source — and gives you a copy-pasteable **local development command reference** for the
pnpm toolchain.

## Requirements

Before opening a PR, make sure:

- **All tests pass** (`pnpm test` & `pnpm test:coverage`) — coverage must stay **≥ 95%**.
- **Lint, format, and type checks pass** (`pnpm lint`, `pnpm format:check`, `pnpm typecheck`).
- **Storybook covers UI changes** — any UI change needs a corresponding story.
- **Docs are updated** for new or changed behavior.
- **CI passes** (`pnpm all`) and the PR targets `main` (direct pushes to `main` aren't allowed).

## Prerequisites

Use **Node 22** (the LTS this repo targets — see [`.nvmrc`](https://github.com/allxsmith/bestax/blob/main/.nvmrc)).
The repo uses **pnpm**, pinned via the `packageManager` field. The simplest way to get the exact
version on any Node is to enable **Corepack** (bundled with Node):

```bash
corepack enable
```

pnpm powers the project's supply-chain hardening — lifecycle/postinstall scripts are blocked by
default and a 3-day release-age cooldown prevents installing just-published versions. See
[`pnpm-workspace.yaml`](https://github.com/allxsmith/bestax/blob/main/pnpm-workspace.yaml) for the
exact settings.

## Local Development Commands

Everything here is safe to run locally; **nothing publishes** (see the note at the end).

### 1. One-time setup

```bash
corepack enable                    # makes `pnpm` use the pinned pnpm@11.9.0
pnpm install --frozen-lockfile     # exact CI-parity install (fails if the lockfile drifts)
# or just `pnpm install` for a normal dev install
```

### 2. Run the whole CI suite locally (the big one)

```bash
pnpm run all
# = turbo: build, typecheck, test, test:coverage, bundle:stats, lint,
#   format:check  &&  build-storybook (bulma-ui)
```

### 3. Individual checks

```bash
pnpm run build          # turbo build all packages
pnpm run typecheck
pnpm run test           # jest (bulma-ui + create-bestax)
pnpm run test:coverage  # coverage (must stay >= 95%)
pnpm run lint
pnpm run format:check   # prettier check (use `pnpm run format` to auto-fix)
pnpm run bundle:stats   # writes bulma-ui/dist/stats.html
```

### 4. Docusaurus (docs site → http://localhost:3000)

```bash
pnpm docs                                                   # dev server (hot reload)

# production build + preview:
pnpm exec turbo run build --filter=@allxsmith/bestax-docs   # builds docs + bulma-ui dep
pnpm --filter @allxsmith/bestax-docs run serve              # serves the built site
```

The build also regenerates `/llms.txt` and `/llms-full.txt` under `docs/build/`.

### 5. Storybook (→ http://localhost:6006)

```bash
pnpm storybook                                              # dev server
pnpm --filter @allxsmith/bestax-bulma run build-storybook   # static build -> bulma-ui/storybook-static
```

### 6. Turbo directly (filters + caching)

```bash
pnpm exec turbo run build --filter=@allxsmith/bestax-bulma   # one package (+ its deps)
pnpm exec turbo run test --filter=create-bestax
pnpm exec turbo run build                                    # everything (cached on re-run)
pnpm exec turbo run build --force                            # ignore turbo cache
```

### 7. create-bestax — scaffold a throwaway app

Scaffold **outside the repo** so it's a standalone app (inside the repo you'd need
`--ignore-workspace`):

```bash
pnpm --filter create-bestax run build
node "$PWD/create-bestax/dist/index.js" /tmp/my-bestax-app -t vite-ts -b complete -i fontawesome -y
cd /tmp/my-bestax-app && pnpm install && pnpm dev     # verify the generated app runs
```

### 8. Supply-chain / pnpm hardening checks

```bash
pnpm audit --audit-level=high     # the CI gate (should exit 0)
pnpm approve-builds               # shows which install scripts are blocked/allowed
pnpm why serialize-javascript     # trace a transitive dep (confirms the >=7.0.3 override)
pnpm why prettier                 # confirm a single pinned version
pnpm outdated -r                  # what's behind (the cooldown may hold some back)
pnpm list --depth 0               # top-level deps per workspace
pnpm dedupe --check               # report duplicate versions without changing anything
```

Want to _see the cooldown block something_? Try adding a just-published package — pnpm refuses it
(then discard the change):

```bash
pnpm add -w some-brand-new-package         # expect ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION
git checkout package.json pnpm-lock.yaml   # undo
```

### 9. Preview the release without publishing (semantic-release dry-run)

Runs the real commit analysis and next-version calc, but publishes nothing:

```bash
export GITHUB_TOKEN=your_token   # the github plugin needs a repo-read token even in dry-run
cd bulma-ui      && pnpm exec semantic-release --dry-run --no-ci ; cd ..
cd create-bestax && pnpm exec semantic-release --dry-run --no-ci ; cd ..
```

It prints "The next release version is X.Y.Z" per package (or "no release") from your local commits —
no `npm publish`, no tag, no GitHub release.

:::tip Safe to run; never publishes
Everything above is safe. The only things that actually publish are `pnpm exec semantic-release`
**without** `--dry-run` (CI-only, on merge to `main`) and a manual `npm publish` — neither of which
is in this list.
:::

## Workflow & conventions

1. Branch off `main`, make your change in the right workspace (`bulma-ui`, `create-bestax`, or `docs`).
2. Add/update tests (≥ 95% coverage) and Storybook stories for UI changes.
3. Run `pnpm all`, then open a PR targeting `main`.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) — the type and scope
drive [semantic-release](https://semantic-release.gitbook.io/). Releasing types (`feat`, `fix`,
`perf`, `refactor`, `style`) must be scoped to `bulma-ui` or `create-bestax`; `docs`, `chore`, `ci`,
`build`, and `test` don't publish. Publishing uses npm **OIDC trusted publishing** with **provenance**
(no long-lived token). See [`CONTRIBUTING.md`](https://github.com/allxsmith/bestax/blob/main/CONTRIBUTING.md)
for the full details.

## AI-assisted development & review

Every PR gets an automatic **CodeRabbit** review (address or refute its comments — it re-reviews
on each push), and maintainers can invoke the **`@claude`** assistant (maintainer-only, since it
spends the maintainer's Claude usage). Issues labeled `claude-fix` are implemented autonomously:
Claude opens a PR labeled `ai-loop` that iterates with the AI reviewers until it converges, and a
human always reviews and squash-merges the result. Don't touch the loop labels (`ai-loop`,
`needs-human-review`, `ai-loop-paused`) on PRs you don't own. Full details:
[AI-Assisted Development](./ai-development.md).
