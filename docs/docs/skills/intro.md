---
title: Skills
sidebar_label: Overview
sidebar_position: 1
---

# Bestax Agent Skills

Drop-in [Agent Skills](https://skills.sh/) that teach coding agents — Claude Code, Cursor, and
other skills.sh-compatible tools — how to build with **@allxsmith/bestax-bulma** the right way.
A skill is a small `SKILL.md` an agent loads automatically when your task matches, plus
`references/` it reads on demand.

## The skills

### `bestax-custom-component`

Build a new custom Bulma "extra" component the bestax way: `forwardRef` + the helper hooks
(`useBulmaClasses`, `usePrefixedClassNames`, `classNames`), the Bulma v1 SCSS
register-vars/getVar pattern, Storybook stories, tests, docs, and the export/build wiring.

**Use when** adding a component beyond stock Bulma.
[Read the skill →](https://github.com/allxsmith/bestax/blob/main/skills/bestax-custom-component/SKILL.md)

### `bestax-form`

Build forms with the bestax form components: Field/Control composition, the full input inventory
(Input, Select, Switch, Autocomplete, Slider, Rate, Taginput, …), common props, and the
validate-it-yourself error pattern. There is **no form/validation library** — you own the state
and surface errors with `color="danger"` + `message` + `messageColor`.

**Use when** building or wiring up a form.
[Read the skill →](https://github.com/allxsmith/bestax/blob/main/skills/bestax-form/SKILL.md)

## Quick start

Install a skill into your agent with the [`skills`](https://skills.sh/) CLI:

```sh
npx skills add https://github.com/allxsmith/bestax --skill bestax-custom-component
npx skills add https://github.com/allxsmith/bestax --skill bestax-form
```

Or add both at once:

```sh
npx skills add https://github.com/allxsmith/bestax \
  --skill bestax-custom-component --skill bestax-form
```

Once added, your agent loads the skill's `SKILL.md` automatically when the task matches and pulls
in the deeper `references/` material as needed. You can also just point your assistant at the
[`skills/` directory on GitHub](https://github.com/allxsmith/bestax/tree/main/skills).

## See them in action

The [**Examples**](./examples/custom-component) pages show each skill actually used — the prompt
given to the agent, the model that produced it, the live result, and the full generated code.
