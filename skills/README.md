# bestax-bulma Agent Skills

Drop-in [Agent Skills](https://skills.sh/) that teach coding agents (Claude Code, Cursor, and
other skills.sh-compatible tools) how to work with
[`@allxsmith/bestax-bulma`](https://github.com/allxsmith/bestax) the right way.

Each skill is a folder with a `SKILL.md` (the always-loaded instructions) plus a `references/`
directory the agent reads on demand.

## Skills

| Skill                                                           | Use it when…                                                                                                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`bestax-custom-component`](./bestax-custom-component/SKILL.md) | Building a **new custom component** beyond stock Bulma — React + TS, the Bulma v1 SCSS CSS-variable pattern, stories, tests, docs, and export/build wiring. |
| [`bestax-form`](./bestax-form/SKILL.md)                         | Building **forms** — Field/Control composition, the full input inventory, and the validate-it-yourself error pattern (there is no form library).            |
| [`bestax-theming`](./bestax-theming/SKILL.md)                   | **Theming** — customize colors, branding, fonts/radius tokens, and dark mode by overriding Bulma's `--bulma-*` variables with the `Theme` component.        |

## Install

Add a skill to your agent with the [`skills`](https://skills.sh/) CLI:

```sh
npx skills add https://github.com/allxsmith/bestax --skill bestax-custom-component
npx skills add https://github.com/allxsmith/bestax --skill bestax-form
npx skills add https://github.com/allxsmith/bestax --skill bestax-theming
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
```

## See also

- Documentation: https://bestax.io
- LLM-ready docs: https://bestax.io/llms.txt
