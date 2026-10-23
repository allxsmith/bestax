# templates: Bulma templates rebuilt with bestax

Each folder here is a free Bulma template from aldi's
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), ported to bestax: a
complete create-bestax `vite-ts` project that StackBlitz opens on its own. StackBlitz opens it
from a generated mirror of this folder rather than from here; CONTRIBUTING.md ("The
bestax-templates repository") says what the mirror holds and how it is published. The docs site
lists the templates on its Templates page (`docs/src/pages/templates`). #1118 is the epic, with
one issue per template; #1121 specifies this folder. The first porting pass's branches
(`port/<slug>-template`), which #1118 keeps as references for parity decisions, show the recipes
below worked out.

## What a template folder is

- **A create-bestax scaffold without its lint setup.** The port lives in `src/` (an `App` plus
  section components) and the upstream's images in `public/`.
- **Not a workspace package.** It stays out of `pnpm-workspace.yaml`, carries no lockfile, and its
  `package.json` takes registry ranges only, because StackBlitz imports the folder and nothing
  else. To run one inside this repo, `pnpm install --ignore-workspace` in its folder; the root
  `.gitignore` keeps what that writes out of git.
- **What git tracks.** A template is the files git tracks in its folder, which is what the
  checks read and the mirror publishes, so an image you have not added yet is missing from both.
- **`LICENSE`:** the upstream license notice verbatim, followed by the notice for the bestax
  port. The docs entry's `license` names that upstream license.
- **`README.md`:** who made the original and where it lives, the upstream commit it was ported
  from, a mention of awesome-bulma-templates, how to run it (`npm install && npm run dev`), and
  any upstream bug the port fixed.

Its docs entry in `docs/src/data/templates.js` (whose header documents each field) and its
screenshot in `docs/static/img/templates/` belong to it too. `scripts/templates.test.mjs` holds
the folder, the entry and the screenshot to each other, and its failures name the file and the
fix.

## Porting a template

1. **Get the original.** Clone the upstream repo into a scratch folder outside this repo and check
   out the commit you port from. Its full SHA goes in the README and the docs entry.
2. **Scaffold, outside the workspace.** From a build of create-bestax, or `npm create bestax@latest`
   with the same arguments. Give it a path in the scratch folder that ends in the slug, which names
   the package:

   ```bash
   node <repo>/create-bestax/dist/index.js <scratch>/<slug> -t vite-ts -i fontawesome -y --no-skills --no-telemetry
   ```

   Then strip the lint setup: delete `eslint.config.js`, the `lint` script and the lint
   devDependencies, the same packages the docs StackBlitz builder drops (`isLintPackage` in
   `docs/src/theme/CodeBlock/sandbox/projects.mjs`). Drop the starter page the port replaces too:
   `src/App.css` and the logos in `public/`, with the favicon link that names one. Give
   `@allxsmith/bestax-bulma` the caret range of bulma-ui's version in this checkout
   (`bulma-ui/package.json`), since the templates test refuses a floor newer than that; npm still
   installs the newest release in the range. Copy the result into `templates/<slug>/` without
   `node_modules`.

3. **Convert.** Copy the upstream page into a scratch folder of its own, with the images it uses
   beside it at the same relative paths, so the codemod reports each relative URL to one as
   `html-url:relative` rather than `html-url:missing`. Put a `package.json` that depends on
   `typescript`, or a `tsconfig.json`, beside it too: the codemod writes a TypeScript module only
   for a TypeScript package, and a `.jsx` one otherwise. Then run it from a build of
   bestax-migrate, or `npx bestax-migrate@latest` with the same arguments, with `--dry` first and
   then without, and keep the report:

   ```bash
   node <repo>/bestax-migrate/dist/index.js bulma-classes <scratch>/index.html --css bestax
   ```

   `--css bestax` matters because `bulma-classes` defaults to `--css keep`, which leaves an app on
   its own Bulma and has the stylesheet TODO tell you to keep loading it, while a template loads
   bestax's stylesheet and declares no `bulma`. Under `--css bestax` the module imports
   `@allxsmith/bestax-bulma/bestax.css` in place of the page's Bulma `<link>`, which the
   scaffold's `src/main.tsx` already does, so that import goes when the module moves into
   `src/App.tsx`. The module it writes beside the page is the
   converted markup, with a `TODO(bestax-migrate)` for whatever it left. The `html-*` ones say
   where the page's head, stylesheets and scripts go, with a recipe for each in the bestax-migrate
   skill's `references/bulma-classes/unmappables.md`. Move the module into `src/App.tsx` and
   split it into section components, port the upstream stylesheet into `src/index.css` with what
   **Setting back the original's look** (below) lists, and put what `index.html` keeps of the
   upstream head (web fonts, the favicon, its meta tags) into the scaffold's, leaving out the
   Bulma and plugin `<link>` and `<script>` tags.

   An original with several pages converts every page, by name or with `-e html` over its folder.
   - Each module becomes a page component, and the parts the pages repeat become section
     components they share.
   - `src/App.tsx` renders the page the address names, and the links between the pages are among
     the `html-url:relative` TODOs.
   - Route on the URL's hash in a small module of the template's own, so it installs no router
     package and every page opens in StackBlitz's preview.

4. **Resolve every `TODO(bestax-migrate)`** with the skills (bestax-migrate,
   bestax-layout-scaffold, bestax-form, bestax-icons, bestax-theming) and the bestax MCP server
   (`lookup_bulma_classes`, `get_props`, `get_examples`).
   - Upstream scripts become React state.
   - bulma-carousel becomes `Carousel`, and jQuery goes away.
   - Bulma 0.x markup moves to v1.
   - bulma-social stays only where bestax has nothing equivalent.
   - Some classes get no TODO, so look for them too:
     - A second component class on a converted element (`box` on a `Notification`) needs its
       own component.
   - Assets:
     - Large upstream images are recompressed into `public/`. Unsplash hot-links stay hot-links.
     - Other third-party hot-links that may vanish become small local files in `public/`.
     - Check the license of any hot-linked asset that needs credit (an Icons8 logo, for one).
5. **Check parity.** Screenshot the original (the entry's `demo`) and the port side by side at
   phone and desktop widths, in light and dark (`prefers-color-scheme`), and check that the
   burger, modals, forms and theme toggles work. Fix upstream bugs minimally and note each one
   in the README.
   - **The look.** Compare what **Setting back the original's look** (below) lists.
   - **An original built for one scheme.** Bulma follows the visitor's color scheme, and such an
     original often looks the same in both, holding its colors with overrides of its own. When
     it does, pin the scheme it was built for on the `<html>` in `index.html`
     (`data-theme="light"` for a light-only original), so the first paint has it too, and leave
     those overrides out (the bestax-theming skill's contrast rules say why).
   - **An original with a light/dark toggle.** A tiny inline script in `index.html`'s `<head>`
     writes `data-theme` on `<html>` before the first paint, from the visitor's saved choice or
     else the OS preference. The app starts from that attribute, passes its state to
     `Theme colorMode` for the toggle, and saves each choice in `localStorage` under the key the
     script reads. `Theme` alone writes the attribute from an effect, so the OS scheme flashes
     first. The bestax-theming skill's `examples/dark-mode.tsx` has the script and the app's
     side.
6. **Finish up.**
   - `git add` the folder first. The screenshot builds what git tracks, as the checks read it
     (**What git tracks**, above).
   - Take the card's screenshot, which also proves the template installs and builds from its
     folder alone: `pnpm --filter @allxsmith/bestax-docs screenshot:template <slug>`.
   - Add the entry to `docs/src/data/templates.js` and the template's line to the Templates
     section of the root `NOTICE`.
   - Run `pnpm format`, then `pnpm test:scripts` and `pnpm lint`.
7. **File what the tools missed.** Anything the codemod should have converted, or a gap in the
   library, gets its own issue linked from #1118.

A template's commits are `feat(docs)`: `templates` is not a release scope, and the docs entry is
what publishes it. The header reads
`feat(docs): add the <Name> template, ported from <owner>'s <repo>`, and commitlint caps its
length, so drop "the" when the repo's name is long.

## Setting back the original's look

Each line below says where its override goes, in `src/index.css` unless it names a prop. Bulma
declares many of its variables on a component's selector rather than `:root`, and an override on
`:root` loses to those. Copy each value rather than recalling it.

### bestax's blue primary

bestax's stylesheet builds Bulma with a blue primary, as the codemod's `html-asset` TODO says. An
original made for stock Bulma's turquoise sets it back on `:root`:

- `--bulma-primary-h`, `-s` and `-l`, with `--bulma-primary-invert-l` (the bestax-migrate skill's
  `references/css-migration.md` says why the invert goes with them).
- `--bulma-primary-on-scheme-l`, which Bulma's Sass build computes from the primary it is given,
  bestax's blue, so changing the trio alone does not recompute it. Text the original colors with
  `has-text-primary` takes that shade with `colorShade="on-scheme"` beside `textColor="primary"`.

Copy the values from stock Bulma v1's own `bulma.css` (the `bulma` package's `css/bulma.css`,
which bulma-ui installs). The on-scheme lightness differs between light and dark, and a `:root`
rule in `src/index.css` pins whatever it sets in both. A single-scheme original takes its own
scheme's value on `:root`; an original with a light/dark toggle sets each scheme's value under
`[data-theme='light']` and `[data-theme='dark']` instead.

### A Bulma 0.x original

Bulma v1 changed defaults a 0.x original relies on. Compare each of these, and set back the ones
that differ, copying the value from the `bulma.css` the original loads or from its own
stylesheet:

- **On `:root`:**
  - the font, `--bulma-family-primary`;
  - the link color, `--bulma-link-h`, `-s` and `-l`;
  - the corner radius, `--bulma-radius`;
  - the greys, which v1 tints: the background takes `--bulma-scheme-h` and `-s`, and the text
    `--bulma-text-h` and `-s` of its own, so set both pairs.
- **On `.title` and `.content`:** the heading weights, `--bulma-title-weight` and
  `--bulma-content-heading-weight`.
- **On `.button`:** `--bulma-button-weight`, and `--bulma-button-outer-shadow-a` for the outer
  shadow v1 gives an uncolored button.
- **On `.label`:** a plain `font-weight`. `.label` reads `--bulma-weight-semibold` directly, so
  `--bulma-label-weight` changes nothing.
- **On `.box` and `.card`:** the radius and shadow, `--bulma-box-radius` and `--bulma-box-shadow`,
  `--bulma-card-radius` and `--bulma-card-shadow`.
- **On `.hero`:** a medium hero's padding, `--bulma-hero-body-padding-medium`.
- **On `.navbar`:** the burger's color, `--bulma-navbar-burger-color`.
- **On `.navbar a.navbar-item.is-active`:** v1 fills the active item, and switches the fill on
  at `a.navbar-item.is-active`, so a less specific selector can't take it off. The fill is
  `--bulma-navbar-item-background-a`.
- **On a `Navbar.Item` that holds other items:** the flex `gap` on `.navbar-item` spaces them,
  and `gap="0"` takes it off.
- **An original's plain `.button` rule:** v1's colored buttons set variables rather than a
  color, and the `background-color` that reads them is on `.button` itself, so the original's
  `.button { background-color }` now outranks the colored buttons too. Move the rule onto a
  class of the plain buttons' own.

## The checks

- **`scripts/templates.test.mjs`**, in `pnpm test:scripts`: the folder, the entry and the
  screenshot, each against the others, and the manifest against every package the template
  imports or its scripts run, since StackBlitz installs from the manifest alone.
- **`scripts/skill-examples-typecheck.test.mjs`**: every template's `src/` compiles under the
  `vite-ts` template's compiler options against the built library. It resolves React and the
  library from this repo's install, so it holds the code, and the templates test holds the
  manifest.
- **`pnpm lint`** lints `templates/*/src` with `templates/eslint.config.js`: the root rules plus
  the bestax ESLint plugin, with `no-bulma-component-class` at error so no raw Bulma component
  class ships in a port. It loads the plugin's build, so build first.
- Prettier formats the TypeScript and the README with the rest of the repo.
