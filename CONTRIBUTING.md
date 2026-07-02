# Contributing to bestax-bulma

Thank you for your interest in contributing to **bestax-bulma**!  
This project is a modern, flexible React component library built on top of Bulma v1 and TypeScript, and we welcome your ideas and improvements.

---

## Table of Contents

- [Requirements](#requirements)
- [Setting Up & Running the Project](#setting-up--running-the-project)
- [Development Workflow](#development-workflow)
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
  - Coverage must remain **95% or higher**
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
if you need a version younger than the cooldown, add it to `minimumReleaseAgeExclude`.

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
5. **Update/add unit tests** (coverage must remain at 95% or higher).
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

## Pull Request Guidelines

- **Describe your change** clearly in the PR.
- **Reference related issues** if applicable.
- **Keep PRs focused**: One feature/fix per PR is preferred.
- **Ensure all quality checks pass** before requesting review.

---

## Semantic Release & Publishing

We use [Semantic Release](https://semantic-release.gitbook.io/) to automate publishing of the `bulma-ui` package as `bulma-bestax` on npm.

- Use [Conventional Commits](https://www.conventionalcommits.org/) to trigger releases.
- The PR title and commit messages should reflect the type of release (fix, feat, BREAKING CHANGE, etc.).
- Only the `main` branch is published.

### npm authentication (OIDC trusted publishing)

Publishing authenticates with npm via [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers) — there is **no long-lived `NPM_TOKEN`**. This avoids the `EOTP` (one-time password) failures that 2FA-protected accounts hit when publishing with a token.

For this to work, each published package must have a trusted publisher configured **once** on npmjs.com (Package → Settings → Trusted Publisher):

- Packages: `@allxsmith/bestax-bulma` and `create-bestax`
- Provider: **GitHub Actions**
- Repository: `allxsmith/bestax`
- Workflow: `ci.yml`

The CI `publish` job grants `id-token: write` and upgrades npm to a version that supports OIDC.

---

## Code Quality Standards

- **Unit tests** required for all new features and bug fixes.
- **Coverage must not drop below 95%.**
- **Linting, formatting, and type checks** must all pass.
- **Storybook stories** required for any visible or interactive UI change.
- **Documentation** must be updated to reflect your changes (see [Documentation](#documentation)).

---

## Commit Message Guidelines

- **Format all commit messages as follows:**
  - **Subject line:** Imperative mood, ≤ 80 chars
  - **Blank line**
  - **List of changes (bullet points or short sentences)**
  - **Optional paragraph describing the motivation or context**

**Example:**

```
Add support for Bulma breadcrumb component

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
