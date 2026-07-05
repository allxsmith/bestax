# bestax — agent guide

TypeScript-first React component library for Bulma v1 (`@allxsmith/bestax-bulma`), a project
scaffolder (`create-bestax`), and the Docusaurus source of https://bestax.io. pnpm + Turborepo
monorepo.

- **Contributing to this repo?** Read [`CLAUDE.md`](CLAUDE.md) — toolchain, commands, quality
  gates, and commit conventions. It applies to all agents, not just Claude.
- **Using the library?** Fetch https://bestax.io/llms.txt (curated docs index) or
  https://bestax.io/llms-full.txt (complete docs in one file). Every docs page is also served
  as raw markdown — see https://bestax.io/docs/guides/llms.
- **Agent Skills** (layout scaffolding, forms, theming, custom components) live in
  [`skills/`](skills/README.md): `npx skills add https://github.com/allxsmith/bestax --skill <name>`
