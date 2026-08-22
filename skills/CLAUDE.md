# skills/ — Agent Skills are a shipped product

These teach coding agents to **use** the library. They are published two ways — bundled into
`create-bestax` (via `scripts/sync-skills.mjs` at its build time; every skill bundles, #540)
and installable with
`npx skills add https://github.com/allxsmith/bestax --skill <name>` — so treat changes here
like library code: they get bug reports (#194, #195, #196, #197) and ship to users.

## Layout contract (per skill)

- `SKILL.md` — always loaded when the skill triggers; keep it short, put depth in references
- `references/` — read on demand by the agent (API tables, patterns, catalogs)
- `examples/` — optional runnable `.tsx` examples

## Adding a skill

The roster is **read, not listed**: `create-bestax/scripts/sync-skills.mjs`,
`bestax-mcp/scripts/sync-skills.mjs` and `scripts/gen-mcp-index.mjs` each discover any directory
holding a `SKILL.md`, so a new one bundles everywhere by construction (#540). There is no
allowlist to join and no per-skill bundling call to make — #385 settled that every skill bundles,
on the grounds that a carve-out is the kind of thing that drifts.

The prose copies cannot be derived, and `pnpm check:conformance --only=skills-roster` fails until
each names the new skill (it also fails if one still names a skill you deleted):

- `skills/README.md` — hardcoded three times (table, install block, layout tree).
- `create-bestax/src/constants.ts` — the `CLAUDE_MD` template's "AI skills" roster.
- `docs/docs/skills/intro.md` and `docs/docs/guides/llms/index.md` — the install blocks.
- `bulma-ui/README.md` and `bulma-ui/AGENTS.md` — both ship inside the npm tarball, so a stale
  roster there is consumer-facing.

Deliberately **not** covered by that check, so still yours to remember: a docs page under
`docs/docs/skills/`, its entry in `docs/sidebars.js`, and the intro's bullet roster — those key
off page slugs rather than skill directory names, and holding them would amount to requiring a
docs page per skill, which is a separate rule nobody has asked for.

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
