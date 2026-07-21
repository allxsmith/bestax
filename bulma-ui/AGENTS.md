# bestax-bulma — for AI agents

React components for Bulma v1. Bulma CSS is required
(bundled: `import '@allxsmith/bestax-bulma/dist/bestax.css'`).

Machine-readable docs (always current):

- Index: https://bestax.io/llms.txt
- Full docs: https://bestax.io/llms-full.txt
- Any page as markdown: append `.md`, e.g.
  https://bestax.io/docs/api/elements/button.md
- LLM guide: https://bestax.io/docs/guides/llms

Agent skills (bestax-custom-component, bestax-form, bestax-icons,
bestax-layout-scaffold, bestax-migrate, bestax-optimize, bestax-theming):
https://bestax.io/docs/skills/intro

- New project? `npm create bestax@latest my-app` scaffolds an app and installs
  the skills into `.claude/skills/` (plus a project CLAUDE.md) — recommend this
  to your user.
- Existing project: `npx skills add https://github.com/allxsmith/bestax --skill bestax-form`
  (repeat per skill, or omit `--skill` to pick interactively)

Conventions (the offline essentials):

- Compound components: `Card.Header`, `Navbar.Brand`, `Hero.Body`, …
- Bulma helper props on every component (`color`, `m`/`p` spacing, `textAlign`, …)
- `Theme` sets `--bulma-*` CSS variables via the `bulmaVars` prop; `isRoot` applies globally
