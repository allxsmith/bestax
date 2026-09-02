# Contributing to bestax-bulma

Thank you for your interest in contributing to **bestax-bulma**!  
This project is a modern, flexible React component library built on top of Bulma v1 and TypeScript, and we welcome your ideas and improvements.

---

## Table of Contents

- [Requirements](#requirements)
- [Setting Up & Running the Project](#setting-up--running-the-project)
- [Local Development Commands](#local-development-commands)
- [Development Workflow](#development-workflow)
- [AI-Assisted Development & Review](#ai-assisted-development--review)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Semantic Release & Publishing](#semantic-release--publishing)
- [Code Quality Standards](#code-quality-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Component Scope](#component-scope)
- [Documentation](#documentation)
- [Contact](#contact)

---

## Requirements

Before contributing, your PR **must** satisfy the following:

- **All tests pass** (`pnpm test` & `pnpm test:coverage`)
  - Coverage thresholds are enforced per package by jest: **bulma-ui 99%** on all metrics
    ([`bulma-ui/jest.config.js`](./bulma-ui/jest.config.js)); **every other jest
    package** 95% (78% branches), each in its own config. `docs` runs
    `node --test` and has no coverage threshold
- **Linting and formatting pass** (`pnpm lint`, `pnpm format:check`)
- **Type checks pass** (`pnpm typecheck`)
- **Storybook runs and covers UI changes** (`pnpm storybook`)
  - Any UI change must have a corresponding Storybook story
- **Documentation is up-to-date**
  - Update or create relevant markdown files for the [Docusaurus docs](./docs)
- **CI/CD checks pass** (`pnpm all`)
- **Pull request targets the `main` branch**
  - **Direct pushes to `main` are not allowed.** PRs are required and will be reviewed.

---

## Setting Up & Running the Project

Get up and running quickly with these steps, whether you want to contribute or just explore the project locally.

### 1. Node & Package Manager

Use **Node 22** (the LTS this repo targets — see [`.nvmrc`](.nvmrc)); with `nvm`, run `nvm use`.

This repo uses **pnpm**, pinned via the `packageManager` field (`pnpm@11.9.0`). The simplest way to
get the exact version — on any Node — is to enable **Corepack** (bundled with Node), which makes the
`pnpm` command automatically use the pinned version:

```bash
corepack enable
```

pnpm is what powers our supply-chain hardening (see [`pnpm-workspace.yaml`](pnpm-workspace.yaml) and
the [Security guide](./docs/docs/guides/security.md)): lifecycle/postinstall scripts are blocked by
default, and a 3-day `minimumReleaseAge` cooldown prevents installing just-published versions. If you
add a dependency whose install scripts must run, add it to `allowBuilds` (run `pnpm approve-builds`);
if you need a version younger than the cooldown, see the runbook below.

#### When a fresh advisory turns CI red

`pnpm audit --audit-level=high` is a blocking gate, and the cooldown refuses anything published in
the last 72 hours. When an advisory's only patched release is younger than that, the two rules
genuinely conflict: the gate demands a version the resolver won't fetch, and **every open PR goes
red**, including yours, over a transitive dependency you never touched (#391). That is expected, it
is not your PR's fault, and this is the way out:

1. Force the patched version in `overrides`, scoped to the affected range rather than unscoped.
   When each major ships its own backport, scope per major (`'thing@3': '>=3.1.6 <4'`) so the
   other majors are untouched. When the advisory has a single patched floor across majors, use
   an unbounded-lower selector instead (`'thing@<3.1.6': '>=3.1.6'`), as the committed
   `postcss` and `sharp` entries do — scoping that case to whichever major the lockfile happens
   to hold today leaves older majors unguarded if a future dependency edge pulls one in.
2. If the patch is still inside the cooldown, add it to `minimumReleaseAgeExclude` too — without
   this the resolver refuses the version step 1 demands. **Qualify it with the exact version**
   (`- 'fast-uri@3.1.6'`, not `- fast-uri`): a bare package name waives the cooldown for every
   future release of that package, so a later lockfile refresh could pull in a different
   just-published version that nobody reviewed. That is the whole defence you are stepping
   around, so step around it as narrowly as possible.
3. Annotate both entries with a review date — this is required, not a nicety:

   ```yaml
   # bestax:review 2026-11-13 — drop once the ajv chain resolves to >=3.1.6 itself
   'fast-uri@3': '>=3.1.6 <4'
   ```

4. Run `pnpm install`, confirm `pnpm audit --audit-level=high` is clean, and commit the lockfile
   with it.

Every bypass is temporary by construction, so `pnpm check:conformance --only=bypass-expiry` fails
the build if an entry has no annotation, and fails again once a review date arrives — that is your
reminder to drop it, re-resolve, and leave it out if nothing changed. A standing policy that is not
debt (the `prettier` pin) uses `# bestax:permanent — why` instead and never expires.

The same annotation is required when you **grant a package its install scripts** — a `pkg: true`
entry under `allowBuilds` re-enables the single most consequential default this repo turns off, so
say why. Only grants need one: a `pkg: false` entry restates the block-by-default rule and
the gate leaves it alone. Before granting, check whether the package ships a prebuilt binary for
your platform as an `optionalDependency` — several here do, which can make the build script
redundant (see the `@swc/core` entry, denied for exactly that reason).

Note that `pnpm all` does **not** run the conformance checks; CI does. Run
`pnpm check:conformance` yourself after editing `pnpm-workspace.yaml`.

### 2. Clone and Install

```bash
git clone https://github.com/allxsmith/bestax.git
cd bestax
pnpm install
```

### 3. Run the Documentation Site

From the root of the monorepo, start the Docusaurus documentation site:

```bash
pnpm docs
```

Visit [http://localhost:3000](http://localhost:3000) to view the docs.

### 4. Run Storybook

To explore and develop components interactively:

```bash
pnpm storybook
```

Visit the displayed local URL to view Storybook.

### 5. Build All Packages

To build all packages in the repo:

```bash
pnpm build
```

### 6. Run All Checks

This will run build, typecheck, tests (with coverage), lint, format check, and Storybook build:

```bash
pnpm all
```

---

## Local Development Commands

A practical, copy-pasteable reference — grouped by what you're testing. Everything here is safe to
run locally; **nothing publishes** (see the note at the end).

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
pnpm run test           # jest in every package + the docs and scripts/ node:test suites
pnpm run test:coverage  # coverage (bulma-ui 99%; every other jest package 95%, 78% branches)
pnpm run lint
pnpm run format:check   # prettier check (use `pnpm run format` to auto-fix)
pnpm run bundle:stats   # writes bulma-ui/dist/stats.html
```

### 4. Docusaurus (docs site -> http://localhost:3000)

```bash
pnpm docs                                                   # dev server (hot reload)

# production build + preview:
pnpm exec turbo run build --filter=@allxsmith/bestax-docs   # builds docs + bulma-ui dep
pnpm --filter @allxsmith/bestax-docs run serve              # serves the built site
```

The build also regenerates `/llms.txt` and `/llms-full.txt` under `docs/build/`.

### 5. Storybook (-> http://localhost:6006)

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

Runs the real commit analysis + next-version calc, but publishes nothing:

```bash
export GITHUB_TOKEN=<a token with repo read>   # the github plugin needs it even in dry-run
for pkg in bulma-ui create-bestax bestax-migrate bestax-mcp; do
  ( cd "$pkg" && pnpm exec semantic-release --dry-run --no-ci )
done
```

It prints "The next release version is X.Y.Z" per package (or "no release") from your local commits —
no `npm publish`, no tag, no GitHub release.

> **Safe to run; never publishes:** everything above. The only things that actually publish are
> `pnpm exec semantic-release` **without** `--dry-run` (CI-only, on merge to `main`) and a manual
> `pnpm publish --provenance --embed-readme --access public` — neither of which is in this list.
> Those flags are not optional, and a bare `pnpm publish` ships unattested and loses the npm
> page's README.
>
> You are unlikely to need a manual publish at all. Every package's `prepack` and
> `prepublishOnly` hooks refuse publishers they recognise as not being pnpm, so a stray
> `npm publish` or `npm pack` exits with an explanation rather than shipping an unresolved
> specifier (#412) — though `--ignore-scripts` skips both, and neither travels with a tarball
> packed elsewhere. Why each flag matters and what the guard does and does not cover:
> [`VERSIONING.md`](./VERSIONING.md#release-process) and `scripts/require-pnpm-publish.mjs`.

---

## Development Workflow

1. **Fork and clone the repository.**
2. **Create a branch** off `main` for your work:
   ```bash
   git checkout -b my-feature
   ```
3. **Install dependencies** from the root if you haven't already:
   ```bash
   pnpm install
   ```
4. **Make your changes** in the appropriate workspace (`bulma-ui` for components, `docs` for documentation).
5. **Update/add unit tests** (coverage must stay above each package's jest threshold — 99% for bulma-ui, 95% with 78% branches for every other jest package).
6. **Add or update Storybook stories** for UI-related changes.
7. **Update documentation** in `/docs` as needed.
8. **Run all checks**:

   ```bash
   pnpm all
   ```

   This command will run build, typecheck, tests (w/ coverage), lint, format check, and Storybook build.

9. **Commit your changes** following the [commit message guidelines](#commit-message-guidelines).
10. **Push and open a Pull Request** targeting the `main` branch.
11. **Participate in code review** and update your PR if requested.

---

## AI-Assisted Development & Review

This repo uses AI reviewers and an autonomous fix loop — full details in the docs:
[AI-Assisted Development](https://bestax.io/docs/guides/getting-started/ai-development).
The short version for contributors:

- **Every PR gets a CodeRabbit review** automatically. Address or refute its comments — it
  re-reviews on each push and marks addressed comments "✅ Addressed". A human maintainer still
  reviews and merges everything.
- **`@claude` mentions are maintainer-only** (they spend the maintainer's Claude usage).
  External contributors don't need them — just push your changes.
- **Issues labeled `claude-fix`** are implemented autonomously: Claude opens a PR labeled
  `ai-loop` and iterates with the AI reviewers until it converges, then a human reviews and
  squash-merges. Don't add or remove the loop labels (`ai-loop`, `needs-human-review`,
  `ai-loop-paused`) on PRs you don't own — they are the loop's state machine.
- **PR titles must be scoped conventional commits** — the title becomes the squash commit and
  drives semantic-release (see [Commit Message Guidelines](#commit-message-guidelines)).

---

## Pull Request Guidelines

- **Describe your change** clearly in the PR.
- **Reference related issues** if applicable.
- **Keep PRs focused**: One feature/fix per PR is preferred.
- **Ensure all quality checks pass** before requesting review.

---

## Semantic Release & Publishing

We use [Semantic Release](https://semantic-release.gitbook.io/) to automate publishing of every package to npm: `bulma-ui` as [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma), plus [`create-bestax`](https://www.npmjs.com/package/create-bestax), [`bestax-migrate`](https://www.npmjs.com/package/bestax-migrate) and [`bestax-mcp`](https://www.npmjs.com/package/bestax-mcp).

- Use [Conventional Commits](https://www.conventionalcommits.org/) to trigger releases — see [Commit Message Guidelines](#commit-message-guidelines).
- **Packages version and release independently, keyed off the commit scope** — `feat(bulma-ui)` releases only bestax-bulma. See [`VERSIONING.md`](./VERSIONING.md).
- Only the `main` branch is published.

### npm authentication (OIDC trusted publishing)

Publishing authenticates with npm via [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers) — there is **no long-lived `NPM_TOKEN`**. This avoids the `EOTP` (one-time password) failures that 2FA-protected accounts hit when publishing with a token.

For this to work, each published package must have a trusted publisher configured **once** on npmjs.com (Package → Settings → Trusted Publisher):

- Packages: `@allxsmith/bestax-bulma`, `create-bestax`, `bestax-migrate` and `bestax-mcp` — every publishable package, and a missing entry fails the publish _after_ the release commit and tag are pushed
- Provider: **GitHub Actions**
- Repository: `allxsmith/bestax`
- Workflow: `ci.yml`

The CI `publish` job grants `id-token: write`. It no longer pins an npm version: that pin existed because `npm publish` needed npm >= 11.5.1 for OIDC, and since #532 every package publishes with `pnpm publish`, which carries its own OIDC exchange.

---

## Code Quality Standards

- **Unit tests** required for all new features and bug fixes.
- **Coverage must not drop below the per-package jest thresholds** (bulma-ui 99%; every other jest package 95%, 78% branches). `docs` has no jest suite and no threshold.
- **Linting, formatting, and type checks** must all pass.
- **Storybook stories** required for any visible or interactive UI change.
- **Documentation** must be updated to reflect your changes (see [Documentation](#documentation)).

---

## Commit Message Guidelines

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint via the husky `commit-msg` hook ([`commitlint.config.js`](./commitlint.config.js)):

- **Format:** `<type>(<scope>): <subject>` — imperative subject, blank line, then an optional
  body with bullet points and context.
- **Release types need a scope:** commits of type `feat`, `fix`, `perf`, `refactor`, `style`
  or `revert` **must** use a scope of `bulma-ui`, `docs`, `create-bestax`, `bestax-migrate`
  or `bestax-mcp` (repo-specific commitlint rule — the scope decides which package releases,
  see [`VERSIONING.md`](./VERSIONING.md)). One correction worth knowing about `revert`:
  a scoped conventional `revert(<scope>): …` **releases nothing** — the only revert rule is
  commit-analyzer's default `{ revert: true, release: 'patch' }`, keyed on the angular
  `revertPattern`, which matches a `Revert "…"` **or** bare `revert: …` header followed by a
  `This reverts commit <sha>` body; a parenthesized `revert(<scope>):` header matches
  neither. The two detected forms differ in what fences them: an unscoped `revert: …` is
  rejected by commitlint's scope rule before it can land, while git's own `Revert "…"` form
  is skipped by commitlint's default `ignores` entirely — and its generated body **does**
  trip the default patch rule for every package, making it the real hazard. So keep reverts
  conventional and scoped, and ship an actual rollback release as a follow-up
  `fix(<scope>): …`. `RELEASE_TYPES` and `RELEASE_SCOPES`
  in `commitlint.config.js` are the source of truth.
- **Breaking changes** need a `BREAKING CHANGE:` footer in the body — a `!` after the type is
  **not** picked up by our release tooling.
- Non-releasing types (`docs`, `chore`, `ci`, `test`, `build`) may omit the scope.

**Example:**

```
feat(bulma-ui): add support for Bulma breadcrumb component

- Implement Breadcrumb component and tests
- Add Storybook stories
- Update API docs for Breadcrumb

This adds full support for Bulma's breadcrumb navigation and documents usage.
```

---

## Component Scope

- **All changes to `bulma-ui` should focus on components available in the Bulma CSS framework.**
- If you wish to propose components outside the Bulma spec, please open an issue to discuss first.

---

## Documentation

- **All public APIs and components must be documented in Markdown in `/docs/api/`** (see existing structure for organization).
- Update `/docs/docs/guides/` for guides, overviews, or new usage patterns.
- **All new features or changes must be documented before PR approval.**

---

## Contact

Questions or ideas?  
Open an issue or start a discussion on GitHub!

---

Thank you for helping make **bestax-bulma** better!
