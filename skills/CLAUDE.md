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

The roster is **read, not listed** (#540). `create-bestax/scripts/sync-skills.mjs` and
`bestax-mcp/scripts/sync-skills.mjs` each copy every directory holding a `SKILL.md` into their
package, and `scripts/gen-mcp-index.mjs` discovers the same set to generate the MCP manifest
(it indexes, it does not bundle). A new skill therefore reaches all three by construction:
there is no allowlist to join, and no per-skill bundling call to make. Full provenance
(#385 vs #540) and the slot for a future per-skill opt-out live in
`create-bestax/scripts/sync-skills.mjs`'s header.

The three install blocks (this README, the docs intro, the llms guide) are **generated**:
`pnpm gen` rewrites them between their `bestax:generated skills-install` markers from the
directory listing (#542, `scripts/gen-skills-rosters.mjs`), and the `skills-roster` conformance
check fails while a committed block is stale. Do not hand-edit inside the markers.

What stays hand-written is prose that cannot be derived — the "Use it when…" tables, the layout
tree, the scaffolded `CLAUDE_MD` roster, AGENTS.md's parenthetical.
`pnpm check:conformance --only=skills-roster` holds those to the directory in both directions:
it fails if one omits your new skill, and if one still names a skill you deleted.
`SKILL_ROSTERS` in `scripts/check-conformance.mjs` is the authoritative list and the failure
names every file you missed, so this file deliberately keeps no roster of rosters — that would
be the same bug one level up.

The docs-site surfaces — the per-skill page under `docs/docs/skills/`, its entry in
`docs/sidebars.js`, and the intro's bullet roster — are held by the same check through the
slug transform (directory name minus the `bestax-` prefix, exactly what `gen-mcp-index.mjs`
ships as `promptName`). A new skill fails conformance until its docs page, sidebar entry, and
intro bullet exist.

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
