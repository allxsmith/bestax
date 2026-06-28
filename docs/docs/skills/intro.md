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
```

Then explore each skill — what it does, how to install it, and live examples:

- **[Custom Component](./custom-component)** — build a new custom component the bestax way
  (check for an existing one first, then the helper hooks + Bulma v1 SCSS pattern).
- **[Form](./form)** — build forms with the bestax form components and the validate-it-yourself
  error pattern (no form library).
- **[Theming](./theming)** — customize colors, branding, and dark mode by overriding Bulma's
  `--bulma-*` variables with the `Theme` component.
