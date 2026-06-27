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

## Install

Add a skill to your agent with the [`skills`](https://skills.sh/) CLI:

```sh
npx skills add https://github.com/allxsmith/bestax --skill bestax-custom-component
npx skills add https://github.com/allxsmith/bestax --skill bestax-form
```

Or add them both:

```sh
npx skills add https://github.com/allxsmith/bestax --skill bestax-custom-component --skill bestax-form
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
```

## See also

- Documentation: https://bestax.io
- LLM-ready docs: https://bestax.io/llms.txt
