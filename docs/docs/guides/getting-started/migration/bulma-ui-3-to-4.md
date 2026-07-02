---
title: bestax-bulma 3.x → 4.x
sidebar_label: 3.x to 4.x
sidebar_position: 1
---

# Upgrading bestax-bulma 3.x → 4.x

This guide explains what changes when you upgrade `@allxsmith/bestax-bulma` from 3.x to 4.x. There is **one** consumer-facing change: the minimum supported React version is now 18. Everything else in this release is internal tooling and has no effect on your code.

## TL;DR

:::tip One thing to check
4.x drops support for **React 16 and 17**. If your app is already on React 18 or 19, upgrade freely — nothing in your code needs to change. If you're still on React 16 or 17, stay on `@allxsmith/bestax-bulma@3` until you can move to React 18+.
:::

| Area               | What changed                                                        | Action               |
| ------------------ | ------------------------------------------------------------------- | -------------------- |
| React peer range   | Now `^18.0.0 \|\| ^19.0.0` (was `^16.8 \|\| ^17 \|\| ^18 \|\| ^19`) | Be on React 18 or 19 |
| Component behavior | No changes                                                          | None                 |
| Props / exports    | No removals or renames                                              | None                 |
| CSS / SCSS         | No changes                                                          | None                 |

## The one breaking change: React 18 minimum

4.x sets the React `peerDependencies` range to:

```json
"react": "^18.0.0 || ^19.0.0",
"react-dom": "^18.0.0 || ^19.0.0"
```

React 16.8 and 17 are no longer supported. The library is built and tested against **React 18 and 19** on every commit (see [Compatibility](#compatibility-react-18--19) below).

**Who is affected:**

- ✅ On React 18 or 19 — upgrade with no code changes. Your existing components, props, imports, and CSS all behave exactly as they did in 3.x.
- ⚠️ On React 16 or 17 — `npm install @allxsmith/bestax-bulma@4` will emit a peer-dependency warning, and some components rely on hooks/behavior that assume a modern React. **Stay on `@3`** until you can upgrade React:

  ```bash
  npm install @allxsmith/bestax-bulma@^3
  ```

**Why this changed:** dropping the legacy React versions lets the library use modern React idioms (e.g. `useId` for accessible, SSR-safe element IDs) without compatibility shims, and keeps the maintenance surface focused on the versions the ecosystem actually runs.

## Compatibility: React 18 + 19

Every change to bestax-bulma is now built, type-checked, and tested against **both React 18 and React 19** in CI. A change that breaks either major fails the build, so 4.x (and every release after it) is verified against both lines — pick whichever your app uses.

## No other changes

There are **no** component, prop, export, or CSS changes in 4.x:

- No components were removed, renamed, or had behavior changed.
- No props were removed or renamed.
- The stylesheets (`extras.css`, `bestax.css`, and the prefixed / no-helpers / no-dark-mode variants) and the SCSS entry points are unchanged.

The rest of the 4.0 work was internal developer tooling (ESLint 10, a TypeScript-first React lint plugin, and the expanded React Hooks ruleset). None of it ships in the package or affects consumers.

:::note Coming from 2.x?
If you're upgrading across two majors, read the [2.x → 3.x guide](./bulma-ui-2-to-3.md) first — that release carried the form-input and themed Radio/Checkbox changes. The 2→3 jump is where the real work is; 3→4 is just the React floor.
:::
