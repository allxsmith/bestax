# bulma-ui — `@allxsmith/bestax-bulma`

The component library. Rollup builds ESM + CJS + types into `dist/`; `src/scss` ships in the
npm package so consumers can build the styles themselves.

## Source map (each folder has its own CLAUDE.md with the real rules)

- `src/elements/` — simple single-purpose Bulma elements (Button, Box, Icon, …)
- `src/components/` — composite/interactive widgets (Navbar, Modal, …) + bestax extras (Carousel, Dialog, …)
- `src/form/` — form controls on Bulma's Field/Control model
- `src/layout/` — page structure (Container, Section, Hero, …)
- `src/columns/` — flexbox column system; `src/grid/` — CSS Grid system
- `src/helpers/` — the shared helper-prop system (`useBulmaClasses`), `Theme`, `Config`
- `src/scss/` — SCSS for the "extras" (components beyond stock Bulma) + flavor builds
- `src/skill-examples/` — Storybook stories showcasing agent-generated output of the `skills/`
- `src/index.ts` — the public API; everything exported here is public forever (semver)

## The component anatomy rule

A new or changed component is **five artifacts, not one**. Touch all of:

1. `src/<folder>/Foo.tsx` — the component
2. `src/<folder>/__tests__/Foo.test.tsx` — tests (coverage threshold: **99%**, `jest.config.js`)
3. `src/<folder>/Foo.stories.tsx` — Storybook story
4. `docs/docs/api/<folder>/foo.md` — the API docs page
5. `src/index.ts` — the export

…then run `pnpm gen:catalog` (CI's `gen:catalog:check` fails if the skill catalog is stale).
If the change invalidates guidance in `skills/`, update the skill in the same PR.
For a **new** component, `/CONTRIBUTING-COMPONENTS.md` is the complete checklist — it adds the
docs listing surfaces and skills sync that CI's `check:conformance` enforces.

The full worked walkthrough (including the SCSS side for extras) is
`skills/bestax-custom-component/references/library-contributor.md` — follow it rather than
improvising.

## Conventions

- Every component routes its Bulma helper props through `useBulmaClasses` and forwards
  `...rest`; see `src/helpers/CLAUDE.md` before adding a prop that several components share.
- Components must work with a custom class prefix (`ConfigProvider`) — tests assert
  `bestax-`-prefixed class output; never hardcode a `"button"`-style class string outside the
  classname helpers (`usePrefixedClassNames`).
- Scope: components should map to the Bulma spec. Extras beyond Bulma (a new Carousel-like
  widget) need an issue discussion first, and pair with SCSS in `src/scss/`.
- Tests: jest + ts-jest + Testing Library, in each folder's `__tests__/`. Run one file with
  `pnpm --filter @allxsmith/bestax-bulma exec jest src/elements/__tests__/Button.test.tsx`.
  The 99% bar is reachable with the techniques in `src/components/__tests__/Reveal.test.tsx`
  (IntersectionObserver/matchMedia mocks, SSR via `renderToStaticMarkup`).
- Stories: types from `@storybook/react-vite`; `tags: ['autodocs']`; every argType gets a
  `description` (meta-test enforced). No inline `style={{}}` in stories/docs examples — helper
  props (no `gap` helper — space with `m*`/`p*`); legacy inline styles exist, don't copy them.
- Must build and pass tests on **React 18 and 19** (CI matrix) — avoid single-major APIs.
- Bundle size is marketing-visible (the READMEs link the live bundlephobia badge) — check `pnpm bundle:stats`
  (writes `dist/stats.html`) when adding anything with real runtime weight.
