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

The roster is **read, not listed**. `create-bestax/scripts/sync-skills.mjs` and
`bestax-mcp/scripts/sync-skills.mjs` each copy every directory holding a `SKILL.md` into their
package, and `scripts/gen-mcp-index.mjs` discovers the same set to generate the MCP manifest
(it indexes, it does not bundle). A new skill therefore reaches all three by construction
(#540): there is no allowlist to join, and no per-skill bundling call to make. Note the
provenance — #385 settled only `bestax-migrate`'s case and kept the per-skill rule; dropping that
rule is #540's own decision, taken on the reasoning #385 gave for it ("a per-skill carve-out is
exactly the kind of thing that drifts").

What stays hand-written is prose — rosters spread across the READMEs, the docs, and the
scaffolded `CLAUDE_MD`. `pnpm check:conformance --only=skills-roster` holds those to the
directory in both directions: it fails if one omits your new skill, and if one still names a
skill you deleted. `SKILL_ROSTERS` in `scripts/check-conformance.mjs` is the authoritative list
and the failure names every file you missed, so this file deliberately keeps no roster of
rosters — that would be the same bug one level up.

Deliberately outside that check, so still yours to remember: a docs page under
`docs/docs/skills/`, its entry in `docs/sidebars.js`, and the intro's bullet roster. Those key
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
