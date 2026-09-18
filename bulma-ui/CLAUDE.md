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

A new or changed component is **five artifacts, not one**. Touch all of: <!-- bestax:count-ok: the list immediately below is the definition -->

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

## The `./constants` subpath

`exports["./constants"]` serves `src/helpers/bulmaClassHelpers.ts` on its own,
as `dist/constants.cjs` and `dist/constants.esm.js`, so tooling can read the
helper value tuples (`validColors`, `validTextSizes`, …) without loading React
or any component. `@allxsmith/eslint-plugin-bestax` validates against them that
way rather than copying them.

It serves that module WHOLE, which is wider than "the value tuples": it also
carries `createBulmaClassHelpers`, which is `@internal`, and `cursorClasses`,
which the package root does not re-export. Read that as the subpath's actual
contract rather than an oversight, and do not reach for `stripInternal` to
narrow it — `@internal` marks props on `Button`, `Link`, `LinkButton`,
`Navbar` and `Avatar` as well, so turning it on would drop those from the
published component types, which is a change to the library's public surface
and wants its own review. The narrowing that would be free is a second source
file, and that would split the cursor tuple from the classes it maps to, which
is the drift this file exists to prevent.

These keep it working, and each of them failed once:

- That file must stay import-free. The rollup entry keeps the main bundle's
  `external` so a future `useMemo` in it cannot inline React into a bundle
  whose whole point is not needing React. The `require` condition's types lean
  on it as well, for the reason given below.
- The CommonJS artifact must be `constants.cjs`, not `constants.cjs.js`. This
  package is `"type": "module"`, so Node reads a `.js` file as ESM whatever
  the bundle's format is, and a bundle writing `exports.x = …` cannot load as
  CommonJS under that reading. What a caller sees depends on the Node version,
  which is why this is worth stating as the defect rather than as a symptom:
  reviewers observed both a load-time throw and an empty namespace object on
  different versions. Either way the tuples are not there, and the empty-object
  case is the worse one because nothing fails.
- Each condition needs its OWN `types`, and the `require` one must be
  `constants.d.cts`. The same rule, one layer up and less visible: a `.d.ts`
  in a `"type": "module"` package is read as ESM by TypeScript, so a
  `module: node16` CommonJS consumer answered the subpath with TS1479 while
  the file the require condition points at loaded perfectly. Runtime and types
  each need the extension that says what they are. The `.d.cts` is written by
  a rollup hook as a VERBATIM COPY of the declaration, not as a re-export of
  it, because a `.d.cts` re-exporting from a `.d.ts` hits the identical error
  one level down. Copying is only sound while the source module imports
  nothing, which is the import-free rule above; the build and
  `scripts/constants-subpath.test.mjs` both refuse if that stops being true,
  and the test typechecks a real node16 CommonJS consumer rather than
  asserting the map's shape.

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
  never wrap it. A compound family ships these artifacts beyond the base anatomy rule:
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

## Releases

Independent semantic-release keyed off the `bulma-ui` commit scope
(`release.config.js`, tag `@allxsmith/bestax-bulma@x.y.z`). It publishes with
`pnpm publish`, like every package here (#532) — the command, its flags, and the
ways that publish fails quietly are documented in `VERSIONING.md` and
`scripts/lib/pnpm-publish.mjs`.

Two things specific to this package. It is the only **scoped** one, and scoped
packages default to `restricted`, so `access` has to be set somewhere or the
release is private. It is set twice over — `publishConfig.access` here and
`--access public` on the shared publish command — and either alone is enough,
so neither is load-bearing on its own. Removing both is the mistake, and it
costs more here than anywhere else. And its `prepack`/`postpack`
pair (`scripts/pack-pointer-files.mjs`, #344) swaps the contributor
`CLAUDE.md` for the consumer copy of `AGENTS.md` inside the tarball and puts it
back — pnpm runs both hooks, so the round trip holds, but if a pack is
interrupted a `CLAUDE.md.bak` is left behind and the next `prepack` refuses
until you restore it.
