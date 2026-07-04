# CLAUDE.md

Guidance for Claude Code (and the `@claude` GitHub Action) working in this repo.
CodeRabbit also reads this file when reviewing PRs. Keep it concise and current.

## What this is

`@allxsmith/bestax` — a **pnpm + Turborepo monorepo** for **bestax-bulma**, a
TypeScript-first React component library for the Bulma v1 CSS framework.
Published to npm; docs live at https://bestax.io.

## Layout

- `bulma-ui/` — the `@allxsmith/bestax-bulma` library (React 19, Rollup build,
  Jest, Storybook). **Most component work happens here.**
- `docs/` — `@allxsmith/bestax-docs`, the Docusaurus site (deployed to
  Cloudflare Pages). Also generates `llms.txt` / `llms-full.txt`.
- `create-bestax/` — the `create-bestax` CLI scaffolder (`templates/vite`,
  `templates/vite-ts`) with Playwright e2e tests.
- `skills/` — shipped Agent Skills: `bestax-custom-component`, `bestax-form`,
  `bestax-layout-scaffold`, `bestax-theming`. **Consult the relevant skill's
  `references/` before building components, forms, layouts, or theming.**
- `scripts/` — repo tooling (e.g. `gen-component-catalog.mjs`).

## Environment

- **Node 22+** (repo targets Node 22 LTS; CI runs Node 24). **pnpm 11.9.0**,
  pinned via `packageManager` — run `corepack enable` to get the exact version.
- Install with `pnpm install` (or `pnpm install --frozen-lockfile` for CI parity).
- Supply-chain hardening in `pnpm-workspace.yaml`: postinstall scripts are
  blocked by default (`allowBuilds` allowlist) and a **3-day `minimumReleaseAge`
  cooldown** blocks just-published versions. Don't add deps that need install
  scripts without also updating `allowBuilds`.

## Commands (root, via Turbo)

```bash
pnpm all            # full CI suite: build, typecheck, test, test:coverage,
                    # bundle:stats, lint, format:check, + build-storybook
pnpm build          # build all packages
pnpm typecheck      # tsc --noEmit across packages
pnpm test           # jest
pnpm test:coverage  # coverage — MUST stay >= 95%
pnpm lint           # eslint
pnpm format         # prettier --write   (format:check = verify only)
pnpm gen:catalog:check   # regenerate + verify the component catalog (CI gate)
pnpm storybook      # Storybook dev server (:6006)
pnpm docs           # Docusaurus dev server (:3000)
```

Scope to one package with Turbo filters, e.g.
`pnpm exec turbo run test --filter=@allxsmith/bestax-bulma`.

## Non-negotiables (all enforced by `ci.yml`)

- **Test coverage must remain ≥ 95%.** Add/adjust Jest tests with every change.
- **Every visible/interactive UI change needs a Storybook story.**
- **After changing components, run `pnpm gen:catalog:check`** — the generated
  `skills/bestax-custom-component/references/component-catalog.md` must be in sync
  (CI fails otherwise).
- `pnpm lint`, `pnpm typecheck`, and `pnpm format:check` must pass. Prettier is
  pinned to 3.9.4 — don't reformat unrelated files.
- **Strict TypeScript, no `any`.** Prefer accessible markup (semantic elements,
  `aria-*`).
- **Public APIs/components must be documented** in `docs/api/`; guides in
  `docs/docs/guides/`.
- **Component scope:** `bulma-ui` covers components that exist in Bulma. Anything
  outside the Bulma spec should be discussed in an issue first.

## Git & PRs

- Branch off `main`; **direct pushes to `main` are not allowed** — always PR.
- Claude Code works on `claude/`-prefixed branches.
- **Conventional Commits** (commitlint enforced): `feat:`, `fix:`,
  `docs:`, `refactor:`, `chore:`, etc. — the type drives semantic-release
  versioning. Subject in imperative mood, ≤ 80 chars, then a blank line and a
  bullet list of changes.
- Keep PRs focused (one feature/fix). Fill out `.github/pull_request_template.md`.

## Gotchas — do not touch

- **Publishing is fully automated** by semantic-release on merge to `main`
  (npm OIDC trusted publishing, GPG-signed release commits). **Never bump
  versions, edit changelogs, or run `npm publish` by hand.**
- React **18 & 19 compat matrix** runs in CI — don't rely on version-specific APIs.
- `docs/` and `bulma-ui/` changes trigger Cloudflare Pages deploys via `deploy.yml`.
