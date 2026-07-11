# New component checklist

The definition of complete for adding a component to `@allxsmith/bestax-bulma` — for humans
and AI agents alike. `pnpm check:conformance` and CI enforce most of it; this file is the
full sequence. Conventions live in the folder `CLAUDE.md`s; templates in
`skills/bestax-custom-component/references/library-contributor.md`.

## 0. Classify first — everything below forks on this

|                  | Stock Bulma (in the Bulma v1 spec)     | Extra / "Beyond Bulma"                                            |
| ---------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Prerequisite     | —                                      | Issue discussion first (component proposal)                       |
| SCSS             | **None** — Bulma provides the CSS      | Partial required (register-vars pattern)                          |
| Homepage listing | `docs/src/data/componentCategories.js` | `docs/src/components/EnhancedAddons/index.js` + SVG in `icons.js` |

Before building anything: scan `skills/bestax-custom-component/references/component-catalog.md`
for an existing component or synonym. If one fits, use or extend it.

## 1. The artifacts

- [ ] `bulma-ui/src/<folder>/Foo.tsx` — helper props via `useBulmaClasses`, own classes via
      `usePrefixedClassNames`, spread `rest`
- [ ] `bulma-ui/src/<folder>/__tests__/Foo.test.tsx` — 99% all metrics; must include a
      `ConfigProvider classPrefix` test (pattern: `Reveal.test.tsx`)
- [ ] `bulma-ui/src/<folder>/Foo.stories.tsx` — import types from `@storybook/react-vite`;
      `tags: ['autodocs']`; a `description` on every argType; no inline `style={{}}`
- [ ] _(extras only)_ `bulma-ui/src/scss/<folder>/_foo.scss` + `@use 'foo';` in that folder's
      `_index.scss` — see `bulma-ui/src/scss/CLAUDE.md`
- [ ] `docs/docs/api/<folder>/foo.md` — mirror `docs/docs/api/components/avatar.md`;
      frontmatter `title:` = the exact exported name (the catalog generator parses it)
- [ ] Export in `bulma-ui/src/index.ts`, then `pnpm gen:catalog`

## 2. Listing surfaces (the step everyone misses)

- [ ] `### Foo` section on the category guide page (`docs/docs/guides/library/components.md`
      or `form.md`) — one prose sentence + a `tsx live` example
- [ ] Homepage: **exactly one** surface per the table above — never both. Plural group
      containers (`Avatars`) are not listed as cards; the guide page lists them.

## 3. Skills sync (same PR, always)

- [ ] Themeable (SCSS partial or color/size props)? Add rows to
      `skills/bestax-theming/references/themeable-components.md` and its new `--bulma-*` vars
      to `css-variables.md`
- [ ] Changed shared helper props? Update `skills/bestax-custom-component/references/api.md`

## 4. Gates

- [ ] `pnpm check:conformance` and `pnpm gen:catalog:check`
- [ ] `pnpm all` (build, typecheck, test+coverage, bundle:stats, lint, format, storybook build)
- [ ] Works on **React 18 and 19** — CI runs both majors; avoid single-major APIs
- [ ] Visually inspect every variant in Storybook, light and dark mode

## 5. Before opening the PR

- [ ] Re-read your full diff against this checklist — each miss a reviewer catches costs a
      review round
- [ ] Conventional commit with scope: `feat(bulma-ui): add Foo`
