---
name: bestax-migrate
description: Migrate an existing app from react-bulma-components (v4) to @allxsmith/bestax-bulma on Bulma v1 — run the bestax-migrate codemod, then resolve every TODO(bestax-migrate) comment it leaves using the mapping references. Use when a repo imports react-bulma-components and wants to move to bestax-bulma, when TODO(bestax-migrate) comments are present in a codebase, or when asked to migrate off an unmaintained React Bulma library.
license: MIT
---

# Migrating from react-bulma-components to bestax-bulma

`react-bulma-components` is unmaintained (last release 2022, Bulma 0.9.x).
`@allxsmith/bestax-bulma` is an actively maintained React library for **Bulma v1**. The
`bestax-migrate` codemod automates most of the conversion; this skill drives the codemod and
finishes what it flags.

## Workflow

Run these steps in order. Don't hand-convert what the codemod converts automatically.

1. **Swap dependencies** (keep `react-bulma-components` installed until the end if the app
   must keep building during migration):

   ```sh
   npm install @allxsmith/bestax-bulma bulma
   ```

2. **Dry-run the codemod** on the source directory and review the report:

   ```sh
   pnpm dlx bestax-migrate react-bulma-components src/ --dry
   ```

3. **Apply it** (same command without `--dry`), then run the project's formatter — the
   codemod preserves surrounding formatting but doesn't prettify what it rewrites.

4. **Resolve every TODO**: `grep -rn "TODO(bestax-migrate)" src/`. Each comment names the
   prop/component and a hint. Recipes for every recurring case are in
   [references/unmappables.md](references/unmappables.md); the full component and prop
   tables are in [references/component-map.md](references/component-map.md) and
   [references/prop-map.md](references/prop-map.md). Delete each comment as you resolve it.

5. **Migrate the CSS to Bulma v1** — react-bulma-components apps run Bulma 0.9, and some
   class patterns changed. Follow [references/css-migration.md](references/css-migration.md).

6. **Finish**: remove `react-bulma-components` from package.json, typecheck/build, and
   review the rendered app side by side against the pre-migration UI.

## What the codemod handles vs. flags

All 32 react-bulma-components v4 components have a mapping. Imports (named, namespace, and
`const { Input } = Form` destructuring), component renames, prop renames/value conversions,
and responsive breakpoint objects convert automatically. It flags with
`TODO(bestax-migrate)` instead of guessing: `Element` and `Tile` (no bestax equivalent —
Tile is replaced by Bulma v1's Grid), controlled `Dropdown`/`Dropdown.Item value`,
`touch`/`until*` breakpoints, dynamic prop values it can't rewrite, and props with no
bestax counterpart. Never "fix" a TODO by silencing it — convert the code per the
references, or deliberately keep the old markup with `className` styling.

## Rules

- The codemod is idempotent on already-migrated files (it only touches files importing
  `react-bulma-components`) — safe to re-run after partial manual work.
- Don't downgrade converted props back to RBC names; bestax uses `is*` booleans
  (`isLoading`), string size unions (`textSize="4"`), and `as` instead of `renderAs`.
- If a component the app uses isn't in the component map, it wasn't part of RBC v4 —
  check for a local wrapper component and migrate its internals instead.
