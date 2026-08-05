# skills/ — Agent Skills are a shipped product

These teach coding agents to **use** the library. They are published two ways — bundled into
`create-bestax` (via `scripts/sync-skills.mjs` at its build time, per its `SKILLS`
allowlist — bundling is opt-in per skill) and installable with
`npx skills add https://github.com/allxsmith/bestax --skill <name>` — so treat changes here
like library code: they get bug reports (#194, #195, #196, #197) and ship to users.

## Layout contract (per skill)

- `SKILL.md` — always loaded when the skill triggers; keep it short, put depth in references
- `references/` — read on demand by the agent (API tables, patterns, catalogs)
- `examples/` — optional runnable `.tsx` examples

## Adding a skill

A new skill directory publishes nothing by itself — update every roster in the same PR:

- `create-bestax/scripts/sync-skills.mjs` `SKILLS` allowlist, **if** the skill should bundle
  into scaffolded apps (per-skill policy, see #385; nothing warns when a directory is absent
  from the list), plus the scaffolded-app roster in `create-bestax/src/constants.ts`
  (`CLAUDE_MD` template) when bundled.
- `skills/README.md` — the roster is hardcoded three times (table, install block, layout tree).
- A docs page under `docs/docs/skills/` and the intro's roster.

## Rules

- `bestax-custom-component/references/component-catalog.md` is **generated** — never
  hand-edit. Regenerate with `pnpm gen:catalog`; CI fails on staleness (`gen:catalog:check`).
- Skills must track the library API: a component or helper-prop change that invalidates skill
  guidance updates the skill **in the same PR** (the anatomy rule in `bulma-ui/CLAUDE.md`
  ends with this step).
- Skill docs state facts an agent can act on (props, valid values, copy-pasteable patterns) —
  when fixing a skill bug, fix the _guidance that produced the bad output_, not just the
  example.
- Storybook renders agent-generated showcases of these skills from
  `bulma-ui/src/skill-examples/` — update those when a skill's canonical example changes.
