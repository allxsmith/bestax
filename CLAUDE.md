# bestax

React component library for **Bulma v1** in TypeScript. pnpm monorepo orchestrated by turbo:

- `bulma-ui/` — the library, published as `@allxsmith/bestax-bulma` (has its own CLAUDE.md)
- `docs/` — Docusaurus site → https://bestax.io (has its own CLAUDE.md)
- `create-bestax/` — the `npm create bestax` scaffolder (has its own CLAUDE.md)
- `skills/` — Agent Skills, a **shipped product** bundled into create-bestax (has its own CLAUDE.md)
- `scripts/gen-component-catalog.mjs` — generates the skill component catalog (`pnpm gen:catalog`)

## Toolchain

Node 22 (`.nvmrc`) and `pnpm@11.9.0` (pinned via `packageManager`; run `corepack enable` once).
Install with `pnpm install --frozen-lockfile` for CI parity.

## Commands

```bash
pnpm all            # the pre-PR gate: build, typecheck, test+coverage, bundle:stats, lint, format:check, storybook build
pnpm test           # jest (bulma-ui + create-bestax)
pnpm test:coverage  # coverage — must stay >= 95%
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm format         # prettier --write (format:check to verify; covers md/mdx too)
pnpm gen:catalog    # regenerate the skills component catalog (CI fails if stale)
pnpm docs           # Docusaurus dev server :3000
pnpm storybook      # Storybook dev server :6006
pnpm exec turbo run test --filter=@allxsmith/bestax-bulma   # scope any task to one package
```

## Quality gates (CI enforces all of these)

- Test coverage **≥ 95%**.
- Every visible/interactive UI change needs a **Storybook story**.
- Every public API change needs a **docs page update** (`docs/docs/api/...`) before PR approval.
- Component/prop changes that affect the skills update `skills/` **in the same PR**, then `pnpm gen:catalog`.
- `pnpm all` must pass locally before opening a PR.

## Commits — release-affecting, not cosmetic

Conventional Commits, enforced by commitlint (husky `commit-msg` hook) and consumed by
semantic-release. One non-standard rule (`commitlint.config.js`): commits of type
`feat|fix|perf|refactor|style` **must** use a scope of `bulma-ui`, `docs`, or `create-bestax` —
unscoped release types are rejected because they would bump both packages.

```
feat(bulma-ui): add Collapse component   → minor release of BOTH packages (synchronized versioning)
fix(create-bestax): handle missing TTY   → patch release
docs: fix typo in contributing guide     → no release; scope optional
```

Both packages always release together with identical versions — see `VERSIONING.md`.

## Dependencies are a deliberate act

`pnpm-workspace.yaml` (read its comments before touching deps) enforces supply-chain hardening:

- Install/postinstall scripts are **blocked by default** — new native deps need an `allowBuilds` entry.
- `minimumReleaseAge` cooldown: versions younger than 3 days won't install.
- Isolated node linker: undeclared (phantom) dependencies fail — declare everything you import.

## Workflow

PRs target `main`; direct pushes to `main` are not allowed. Keep PRs focused (one feature/fix).
Full contributor guide: `CONTRIBUTING.md`. New components should stay within the Bulma spec —
propose anything beyond it in an issue first.

## AI / LLM surfaces

Usage skills live in `skills/`; LLM-ready docs are generated at `https://bestax.io/llms.txt`
(canonical guide: https://bestax.io/docs/guides/llms). This repo treats AI agents as first-class
contributors _and_ consumers — changes to docs/skills alter what agents everywhere are taught.
