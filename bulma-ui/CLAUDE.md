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

…then run `pnpm gen` (regenerates the API pages' generated regions **and** the skill catalog;
CI's `gen:catalog:check` and `check:conformance` fail if either is stale).
If the change invalidates guidance in `skills/`, update the skill in the same PR.
For a **new** component, `/CONTRIBUTING-COMPONENTS.md` is the complete checklist — it adds the
docs listing surfaces and skills sync that CI's `check:conformance` enforces.

The full worked walkthrough (including the SCSS side for extras) is
`skills/bestax-custom-component/references/library-contributor.md` — follow it rather than
improvising.

## Conventions

- Every component routes its Bulma helper props through `useBulmaClasses` and forwards
  `...rest`; see `src/helpers/CLAUDE.md` before adding a prop that several components share.
- **TSDoc is the docs source, not a comment.** Every `<Foo>Props` member needs an inline
  `/** … */` — `scripts/gen-api-docs.mjs` renders those into the API page's Props table, so a
  missing one is a build error, and the component's own summary sentence becomes the page's
  Overview. Two tags: `@defaultValue` when the default is computed rather than destructured
  (the AST can't see it), and `@extraProp {Type} [name=default] - desc` to document a notable
  prop inherited from the DOM base type. Do **not** add `@property` blocks above an interface —
  that older style is unverifiable and drifted from the real types; it has been migrated away.
  A sub-component's own summary sentence becomes its line in the page's `**Subcomponents:**`
  list, so write it for a reader ("Top bar for navigation or branding"), not for the compiler.
  Type aliases get the same treatment: a union too long to inline in a cell is rendered as its
  name plus a `**Types:**` footnote built from the alias's own TSDoc.
- Multi-part components attach sub-components as statics via `withSubComponents`
  (`src/helpers/withSubComponents.ts`) — it must mutate the base (identity-preserving),
  never wrap it. A compound family ships four artifacts beyond the base anatomy rule:
  an identity test per static (`expect(Parent.Sub).toBe(Sub)`, or `toBeDefined()` +
  dot-path render for module-private subs) in a `describe('Compound components')` block,
  a `CompoundUsage` story, and a `### Compound (dot-notation) usage` live example at the
  end of the API page's `## Usage` section. Prefer exporting subs by name from the same
  module so identity tests are possible.
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
