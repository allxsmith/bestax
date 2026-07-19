---
title: Skills
sidebar_label: Overview
sidebar_position: 1
---

# Bestax Agent Skills

Drop-in [Agent Skills](https://skills.sh/) that teach coding agents — Claude Code, Cursor, and
other skills.sh-compatible tools — how to build with **@allxsmith/bestax-bulma** the right way.

Install one with the [`skills`](https://skills.sh/) CLI:

```bash
npx skills add https://github.com/allxsmith/bestax --skill bestax-custom-component
npx skills add https://github.com/allxsmith/bestax --skill bestax-form
npx skills add https://github.com/allxsmith/bestax --skill bestax-theming
npx skills add https://github.com/allxsmith/bestax --skill bestax-layout-scaffold
npx skills add https://github.com/allxsmith/bestax --skill bestax-icons
npx skills add https://github.com/allxsmith/bestax --skill bestax-optimize
```

Starting a new app? `pnpm create bestax@latest` offers to **preinstall these skills** into the
generated app's `.claude/skills/` (alongside a `CLAUDE.md`), so a Claude Code session picks them up
automatically — no manual `skills add` needed.

Then explore each skill — what it does, how to install it, and live examples:

- **[Custom Component](./custom-component)** — build a new custom component the bestax way
  (check for an existing one first, then the helper hooks + Bulma v1 SCSS pattern).
- **[Form](./form)** — build forms with the bestax form components and the validate-it-yourself
  error pattern (no form library).
- **[Theming](./theming)** — customize colors, branding, and dark mode by overriding Bulma's
  `--bulma-*` variables with the `Theme` component.
- **[Layout scaffold](./layout-scaffold)** — go from "build me a dashboard / landing page / catalog"
  to a complete responsive page using the layout archetypes.
- **[Icons](./icons)** — use `Icon`/`IconText` with any of the five supported icon libraries:
  per-library setup, name formats, variants, and decorative-vs-labeled accessibility.
- **[Optimize](./optimize)** — reduce the built CSS size: measure raw+gzip, then the cheapest
  first-party lever that fits (lighter flavor, modular Sass build, import/asset hygiene).
