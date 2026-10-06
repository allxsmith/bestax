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
  - The root `scripts/` suite holds each file to its own floor in
    [`scripts/coverage-floors.json`](./scripts/coverage-floors.json), checked by
    `pnpm test`. A floor is where the file stood, less a small allowance on
    branches, not a target;
    [`scripts/coverage-floors.mjs`](./scripts/coverage-floors.mjs) says what
    to do when one fails
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

When the advisory has no patched release at all (GitHub's `first_patched_version` is null and npm's
latest is still in the vulnerable range), there is nothing for an override to force. Add the GHSA
to `auditConfig.ignoreGhsas` instead, with the same review-date marker, and say in the comment above
it how the package reaches this tree and why that exposure is acceptable, as the existing entries
do. Remove the entry once a fix publishes.

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
pnpm run test:scripts   # the scripts/ suite alone, held to its per-file coverage floors
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
for pkg in bulma-ui create-bestax bestax-migrate bestax-mcp eslint-plugin; do
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

- **A PR targeting `main` gets a CodeRabbit review** automatically once it is out of draft. Address or refute its comments — it
  reviews incrementally and marks addressed comments "✅ Addressed". It also rate-limits, so a
  push during a spent window waits for the next one; the AI-assisted section below says how to
  nudge it. A human maintainer still reviews and merges everything.
- **`@claude` mentions are maintainer-only** (they spend the maintainer's Claude usage).
  External contributors don't need them — just push your changes.
- **Issues labeled `claude-fix`** are implemented autonomously: Claude opens a PR labeled
  `ai-loop` and iterates with the AI reviewers until it converges, then a human reviews and
  squash-merges. Don't add or remove the loop labels (`ai-loop`, `needs-human-review`,
  `ai-loop-paused`) on PRs you don't own — they are the loop's state machine.
- **Hand-driven PRs that want a deep review**: applying the `deep-review` label is what starts
  a run — pushing a commit does not, and neither does commenting — and a label that is still on
  the PR emits no event when applied again, so every re-run means removing it and adding it
  back. Apply it at open, fix everything it raised, then toggle it. The re-run settles its own
  open threads — verified fixed, still wrong, or conceded — and raises nothing new; when the
  newer commits themselves want reviewing, post a `deep-review: fresh` comment first, then
  toggle the label to start the run. Both the label and the steer are triage+ only, so this is a
  maintainer's move rather than yours. On a PR from a fork it is nobody's move: the job runs
  only for same-repo PRs, so the label does nothing there whoever applies it, and the run
  reports skipped.
  That steer sticks: the run re-reads the newest `deep-review:` comment it can attribute to a
  triage+ author, so later toggles stay fresh for as long as it is still the newest triage+ steer the run
  can see — the settle-my-threads pass is the default only until the
  first time someone asks for a fresh one. CodeRabbit reviews incrementally
  on its own and rate-limits, so let it go last and nudge it with `@coderabbitai review` when
  its window reopens.
  Do not relabel per push: each application spends a full opus session, and relabeling after
  every fix is what turned #643 into 14 review rounds.
- **Know when to stop fixing.** The autonomous loop stops after `MAX_ITERATIONS` fix rounds
  (`claude-pr-loop.yml` sets it), pauses, and labels the PR `ai-loop-paused` for a human. Give
  a hand-driven PR the same stopping point. Once the PR has been through that many rounds and
  what is left is wording rather than behaviour, reply once naming the findings you are leaving
  and why, then take the PR to human review. The reviewers keep reviewing; what changes
  is that you stop treating every finding as blocking. A finding that names a defect in
  behaviour still earns another round.
- **A PR based on another PR's branch draws fewer reviewers.** Ask for what you want with
  `@coderabbitai review`, and prefer landing a stack one PR at a time. The
  [AI-Assisted Development](https://bestax.io/docs/guides/getting-started/ai-development) guide
  is where the mechanism lives.
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

We use [Semantic Release](https://semantic-release.gitbook.io/) to automate publishing of every package to npm: `bulma-ui` as [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma), plus [`create-bestax`](https://www.npmjs.com/package/create-bestax), [`bestax-migrate`](https://www.npmjs.com/package/bestax-migrate), [`bestax-mcp`](https://www.npmjs.com/package/bestax-mcp) and `eslint-plugin` as [`@allxsmith/eslint-plugin-bestax`](https://www.npmjs.com/package/@allxsmith/eslint-plugin-bestax).

- Use [Conventional Commits](https://www.conventionalcommits.org/) to trigger releases — see [Commit Message Guidelines](#commit-message-guidelines).
- **Packages version and release independently, keyed off the commit scope** — `feat(bulma-ui)` releases only bestax-bulma. See [`VERSIONING.md`](./VERSIONING.md).
- Only the `main` branch is published.

### npm authentication (OIDC trusted publishing)

Publishing authenticates with npm via [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers) — there is **no long-lived `NPM_TOKEN`**. This avoids the `EOTP` (one-time password) failures that 2FA-protected accounts hit when publishing with a token.

For this to work, each published package must have a trusted publisher configured **once** on npmjs.com (Package → Settings → Trusted Publisher):

- Packages: `@allxsmith/bestax-bulma`, `create-bestax`, `bestax-migrate`, `bestax-mcp` and `@allxsmith/eslint-plugin-bestax` — every publishable package, and a missing entry fails the publish _after_ the release commit and tag are pushed
- Provider: **GitHub Actions**
- Repository: `allxsmith/bestax`
- Workflow: `ci.yml`

The CI `publish` job grants `id-token: write`. It no longer pins an npm version: that pin existed because `npm publish` needed npm >= 11.5.1 for OIDC, and since #532 every package publishes with `pnpm publish`, which carries its own OIDC exchange.

`bestax-mcp`'s listing in the official MCP Registry is published by a different workflow, `mcp-registry.yml`, from each `bestax-mcp@` GitHub release. Do **not** add that workflow as a trusted publisher on npm. It runs a third-party binary while holding `id-token: write`, and npm refusing that workflow's tokens is what keeps the binary away from npm. It needs no secret: the registry accepts its GitHub OIDC token for the `io.github.allxsmith` namespace.

### Codemod Registry (bestax-migrate)

`bestax-migrate/codemod/` is a small wrapper package in the [Codemod Registry](https://app.codemod.com/registry) that runs one pinned `bestax-migrate` release from npm. A maintainer publishes it by hand with `.github/workflows/codemod-registry.yml` (Actions, "Codemod Registry", run on `main`, `publish` checked). Left unchecked, only its `validate` job runs, which holds no secret and no `id-token: write`. Do **not** add that workflow as a trusted publisher on npm. Its `publish` job runs the third-party `codemod` CLI while holding `id-token: write`, and npm refusing that workflow's tokens is what keeps the CLI away from npm.

The wrapper does not follow `bestax-migrate` releases on its own. To move it to the release `bestax-migrate/package.json` is at, run `node scripts/codemod-registry.mjs bump`, commit the result as `build(bestax-migrate): …` (which releases nothing), merge it, then run the workflow with `publish` checked. Until then its check step fails, naming that command. The `codemod` CLI itself is installed with `npm ci` from `.github/codemod-cli/`, and the header of `scripts/codemod-registry.mjs` says how to move that pin.

One-time setup, in this order. Steps 1 and 2 come **before** the workflow is merged: a job that names an environment which does not exist creates it on the spot, with no reviewer and no branch rule, so the environment has to be there, protected, before anything on `main` can name it.

1. Create a GitHub environment named `codemod-registry` with the maintainer as required reviewer and deployment branches limited to `main`.
2. Sign in at [app.codemod.com](https://app.codemod.com) with GitHub, create an API key that can publish packages, and save it as a secret of that environment (not a repository secret) named `CODEMOD_API_KEY`.
3. Merge the workflow.
4. Run the workflow with `publish` unchecked, then checked. The first publish creates the unscoped `bestax-migrate` package with the API key.
5. At [app.codemod.com/api-keys](https://app.codemod.com/api-keys), add a Trusted Publisher for `bestax-migrate`: owner `allxsmith`, repository `bestax`, workflow `.github/workflows/codemod-registry.yml`, environment `codemod-registry`, ref `refs/heads/main`.
6. Delete the `CODEMOD_API_KEY` secret and revoke the key. Later runs publish with a GitHub OIDC token, so no long-lived registry credential remains.

### The bestax-skills repository

The `bestax` coding-agent plugin installs from its own public repository, [allxsmith/bestax-skills](https://github.com/allxsmith/bestax-skills), because Claude Code installs a plugin marketplace by cloning the whole repository. Every file there is generated by `scripts/gen-skills-repo.mjs` from `skills/`, the hand-written inputs in `plugin/`, and bestax-mcp's `server.json`, `package.json` and generated skill index. It reads them through the same helpers the rest of the repo uses: the skills through the vetting gate the skill syncs use, so an untracked skill file stops it, the MCP launch through the `server.json` reader the MCP Registry workflow uses, and the README's skill list from `bestax-mcp/data/skills.json`. `.github/workflows/skills-publish.yml` pushes the result on a merge that touches those inputs, after each `bestax-mcp` release, and on a manual dispatch, and it commits only when the tree changed. Never edit bestax-skills by hand. Change the source here and the workflow carries it over.

To preview the tree, run `node scripts/gen-skills-repo.mjs <new directory>` in a clone with full history. It fails, naming each file, if the tree breaks a rule of Anthropic's plugin directory. The workflow adds `--require-checkout`, which turns a git listing that fails into an error instead of skipping the untracked-file gate, and `--require-published`, which asks the npm registry for the exact `bestax-mcp` version the plugin pins and refuses one npm does not serve. That happens when a release's npm publish fails after its release commit has already reached `main`. The next run after a successful publish carries the tree over.

The plugin's version, in the root `plugin.json` that catalogs such as awesome-copilot pin and in `.claude-plugin/plugin.json` that Claude Code reads, is the MAJOR.MINOR in `plugin/manifest.json`, then a patch: the number of commits on `main` that touched the plugin's content, plus `OUTPUT_FORMAT` in the generator. The content is the files inside the skill directories under `skills/`, `plugin/`, the three bestax-mcp inputs, `LICENSE` and `NOTICE` (`CONTENT_PATHS` in the generator). `skills/README.md` and `skills/CLAUDE.md` do not ship, so a commit to them alone does not count. The patch rises with each commit to that content, so nobody bumps it by hand. A commit that changes only the generator's code does not move the count, so a generator change that alters the published output raises `OUTPUT_FORMAT` by one in the same pull request. Claude Code updates users only when the version changes, so a change that skips that bump does not reach them. The generator's tests catch a missed bump on the paths their fixed inputs reach: they build the tree from those inputs and compare its hash with one pinned next to the `OUTPUT_FORMAT` it was recorded at, and a failure says what to set both to. A change that leaves the output alone, such as one to comments, needs neither. A change that adds a rendering path adds a fixed input that reaches it. Bump the minor in `plugin/manifest.json` in any change that drops or renames a content path, because the count can then fall. The generator refuses a shallow clone, whose count would be too low.

`plugin/icon.png` is published as `.claude-plugin/icon.png`, the icon Anthropic's directory shows for the plugin, and the Claude manifest names it in `icon`. The generator refuses an icon that is not a complete PNG, square, 512 to 2048 px a side and under 2 MB. It is rendered from `docs/static/img/logo.svg` with ImageMagick 7, by the command in the generator's header, so run that again after a logo change. The directory takes the icon only the first time the plugin is saved or submitted, so a new icon does not change a listing that already exists.

The workflow pushes with an SSH deploy key that can write to bestax-skills and nothing else. The private key is a secret of the `skills-publish` environment, which admits `main` only and has no required reviewer (the workflow's header says why). Only the workflow's `publish` job uses the key, and that job checks out nothing and runs no repository code. The `generate` job, which has no secret, runs the generator on `main` and hands the tree on as a tar archive. `publish` checks that the archive holds only regular files and directories inside the tree, then pushes it with git and ssh. The workflow's header lists everything that job runs. Never paste a real key into an issue, a pull request or these docs.

One-time setup, in this order. Step 1 comes **before** the workflow is merged: a job that names an environment which does not exist creates it on the spot, with no branch rule. If steps 2 to 6 also come first, the merge itself publishes. Otherwise the merge's run fails at its push step and points here, and step 7 publishes.

1. Create the `skills-publish` environment with deployment limited to `main`, then confirm the policy before any secret exists:

   ```bash
   gh api -X PUT repos/allxsmith/bestax/environments/skills-publish \
     -F 'deployment_branch_policy[protected_branches]=false' \
     -F 'deployment_branch_policy[custom_branch_policies]=true'
   gh api -X POST repos/allxsmith/bestax/environments/skills-publish/deployment-branch-policies \
     -f name=main -f type=branch
   gh api repos/allxsmith/bestax/environments/skills-publish/deployment-branch-policies
   ```

   The last command must list exactly one policy, `main` of type `branch`. This repository has other writers, including bestaxbot, whose token reaches sessions that run pull request code, and any writer can dispatch the workflow from a branch carrying its own copy of the file. The branch rule is what keeps such a run away from the key, so do not set the secret in step 5 until it is confirmed.

2. Create the public repository, empty, with issues and the wiki off so reports come here:

   ```bash
   gh repo create allxsmith/bestax-skills --public \
     --description "The bestax coding-agent plugin, generated from allxsmith/bestax" \
     --homepage https://bestax.io/docs/guides/llms
   gh repo edit allxsmith/bestax-skills --enable-issues=false --enable-wiki=false
   ```

3. Generate an ed25519 key pair in a scratch directory outside any clone. It has no passphrase, because the workflow cannot type one:

   ```bash
   ssh-keygen -t ed25519 -N '' -C skills-publish -f bestax-skills-deploy
   ```

4. Add the public key to bestax-skills as a deploy key with write access:

   ```bash
   gh repo deploy-key add bestax-skills-deploy.pub --repo allxsmith/bestax-skills \
     --title skills-publish --allow-write
   ```

5. Store the private key as a secret of the environment, not a repository secret, then delete both files:

   ```bash
   gh secret set BESTAX_SKILLS_DEPLOY_KEY --repo allxsmith/bestax --env skills-publish < bestax-skills-deploy
   rm bestax-skills-deploy bestax-skills-deploy.pub
   ```

6. Protect `main` in bestax-skills with two rulesets. The first refuses force pushes and deletion from everyone, the deploy key included, so a leaked key cannot rewrite or delete the published history. The second takes changes only through a pull request and lets the deploy key alone skip that rule, so the workflow's plain push still lands and is the only direct writer:

   ```bash
   gh api -X POST repos/allxsmith/bestax-skills/rulesets --input - <<'EOF'
   {
     "name": "main history",
     "target": "branch",
     "enforcement": "active",
     "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
     "bypass_actors": [],
     "rules": [{ "type": "deletion" }, { "type": "non_fast_forward" }]
   }
   EOF
   gh api -X POST repos/allxsmith/bestax-skills/rulesets --input - <<'EOF'
   {
     "name": "main changes",
     "target": "branch",
     "enforcement": "active",
     "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
     "bypass_actors": [{ "actor_type": "DeployKey", "actor_id": null, "bypass_mode": "always" }],
     "rules": [
       {
         "type": "pull_request",
         "parameters": {
           "required_approving_review_count": 1,
           "dismiss_stale_reviews_on_push": false,
           "require_code_owner_review": false,
           "require_last_push_approval": false,
           "required_review_thread_resolution": false
         }
       }
     ]
   }
   EOF
   ```

7. Run the workflow once, then check that the run is green and that bestax-skills has a commit naming the allxsmith/bestax commit it came from:

   ```bash
   gh workflow run skills-publish.yml --repo allxsmith/bestax --ref main
   gh run list --workflow skills-publish.yml --repo allxsmith/bestax --limit 1
   ```

To rotate the key, repeat steps 3 to 5, then remove the old deploy key with `gh repo deploy-key list --repo allxsmith/bestax-skills` and `gh repo deploy-key delete <id> --repo allxsmith/bestax-skills`. If GitHub ever rotates its SSH host keys, the push step fails until the `known_hosts` list in the workflow is updated from GitHub's published fingerprints.

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
  or `revert` **must** use a scope of `bulma-ui`, `docs`, `create-bestax`, `bestax-migrate`,
  `bestax-mcp` or `eslint-plugin` (repo-specific commitlint rule — the scope decides which package releases,
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
