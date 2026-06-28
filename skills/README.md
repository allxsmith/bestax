# bestax-bulma Agent Skills

Drop-in [Agent Skills](https://skills.sh/) that teach coding agents (Claude Code, Cursor, and
other skills.sh-compatible tools) how to work with
[`@allxsmith/bestax-bulma`](https://github.com/allxsmith/bestax) the right way.

Each skill is a folder with a `SKILL.md` (the always-loaded instructions) plus a `references/`
directory the agent reads on demand.

## Skills

| Skill                                                           | Use it when…                                                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`bestax-custom-component`](./bestax-custom-component/SKILL.md) | Building a **new custom component** beyond stock Bulma — React + TS, the Bulma v1 SCSS CSS-variable pattern, stories, tests, docs, and export/build wiring.    |
| [`bestax-form`](./bestax-form/SKILL.md)                         | Building **forms** — Field/Control composition, the full input inventory, and the validate-it-yourself error pattern (there is no form library).               |
| [`bestax-theming`](./bestax-theming/SKILL.md)                   | **Theming** — customize colors, branding, fonts/radius tokens, and dark mode by overriding Bulma's `--bulma-*` variables with the `Theme` component.           |
| [`bestax-layout-scaffold`](./bestax-layout-scaffold/SKILL.md)   | **Layout scaffolding** — turn a high-level request (dashboard, landing page, auth page, catalog) into a complete responsive page from named layout archetypes. |

## Install

Add a skill to your agent with the [`skills`](https://skills.sh/) CLI:

```sh
npx skills add https://github.com/allxsmith/bestax --skill bestax-custom-component
npx skills add https://github.com/allxsmith/bestax --skill bestax-form
npx skills add https://github.com/allxsmith/bestax --skill bestax-theming
npx skills add https://github.com/allxsmith/bestax --skill bestax-layout-scaffold
```

## Layout

```
skills/
  bestax-custom-component/
    SKILL.md
    references/
      api.md        # helper hooks, classNames, valid-value constants, SCSS utilities
      patterns.md   # Dialog — the canonical worked example
  bestax-form/
    SKILL.md
    references/
      api.md        # per-component props
      patterns.md   # complete form + advanced inputs
  bestax-theming/
    SKILL.md
    references/
      css-variables.md        # the --bulma-* map + override mechanisms
      themeable-components.md  # color/size props + accepted values
    examples/
      theme-config.tsx         # custom brand theme (app root + scoped)
      dark-mode.tsx            # light/dark toggle via data-theme
  bestax-layout-scaffold/
    SKILL.md
    references/
      layout-components.md     # layout component inventory + props
      archetypes.md            # the 4 page archetypes
    examples/
      app-shell.tsx            # fixed navbar + sidebar menu + content
      landing.tsx              # hero + sections + footer
      centered.tsx             # centered single column
      card-grid.tsx            # multiline columns of cards
```

## See also

- Documentation: https://bestax.io
- LLM-ready docs: https://bestax.io/llms.txt
