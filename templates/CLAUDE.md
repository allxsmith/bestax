# templates: Bulma templates rebuilt with bestax

Each folder here is a free Bulma template from aldi's
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), ported to bestax: a
complete create-bestax `vite-ts` project that StackBlitz opens on its own. StackBlitz opens it
from a generated mirror of this folder rather than from here; CONTRIBUTING.md ("The
bestax-templates repository") says what the mirror holds and how it is published. The docs site
lists the templates on its Templates page (`docs/src/pages/templates`). #1118 is the epic, with
one issue per template; #1121 specifies this folder.

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
   with the same arguments. It takes the project's name rather than a path, so run it from the
   scratch folder:

   ```bash
   cd <scratch>
   node <repo>/create-bestax/dist/index.js <slug> -t vite-ts -i fontawesome -y --no-skills --no-telemetry
   ```

   Then strip the lint setup: delete `eslint.config.js`, the `lint` script and the lint
   devDependencies, the same packages the docs StackBlitz builder drops (`isLintPackage` in
   `docs/src/theme/CodeBlock/sandbox/projects.mjs`). Drop the starter page the port replaces too:
   `src/App.css` and the logos in `public/`, with the favicon link that names one. Give
   `@allxsmith/bestax-bulma` the caret range of bulma-ui's version in this checkout
   (`bulma-ui/package.json`), since the templates test refuses a floor newer than that; npm still
   installs the newest release in the range. Copy the result into `templates/<slug>/` without
   `node_modules`.

3. **Convert.** Copy the upstream page into a scratch folder of its own, beside a `package.json`
   that depends on `typescript` or a `tsconfig.json`: the codemod writes a TypeScript module only
   for a TypeScript package, and a `.jsx` one otherwise. Then run it from a build of
   bestax-migrate, or `npx bestax-migrate@latest` with the same arguments, with `--dry` first and
   then without, and keep the report:

   ```bash
   node <repo>/bestax-migrate/dist/index.js bulma-classes <scratch>/index.html --css bestax
   ```

   `--css bestax` matters because `bulma-classes` defaults to `--css keep`, which leaves an app on
   its own Bulma and has the stylesheet TODO tell you to keep loading it, while a template loads
   bestax's stylesheet and declares no `bulma`. The module it writes beside the page is the
   converted markup, with a `TODO(bestax-migrate)` for whatever it left. The `html-*` ones say
   where the page's head, stylesheets and scripts go, with a recipe for each in the bestax-migrate
   skill's `references/bulma-classes/unmappables.md`. Move the module into `src/App.tsx` and
   split it into section components, port the upstream stylesheet into `src/index.css`, and put
   what `index.html` keeps of the upstream head (web fonts, the favicon, its meta tags) into the
   scaffold's, leaving out the Bulma and plugin `<link>` and `<script>` tags.

   An original with more than one page converts every page, by name or with `-e html` over its
   folder. Copy its images in beside the pages too, or each relative URL to one is reported as
   `html-url:missing` rather than `html-url:relative`. Each module becomes a page component, the
   parts the pages repeat become section components they share, and `src/App.tsx` renders the
   page the address names; the links between the pages are among the `html-url:relative` TODOs.
   `templates/tropico` routes on the URL's hash in a small module of its own, so the template
   installs no router package and every page opens in StackBlitz's preview.

4. **Resolve every `TODO(bestax-migrate)`** with the skills (bestax-migrate,
   bestax-layout-scaffold, bestax-form, bestax-icons, bestax-theming) and the bestax MCP server
   (`lookup_bulma_classes`, `get_props`, `get_examples`).
   - Upstream scripts become React state.
   - bulma-carousel becomes `Carousel`, and jQuery goes away.
   - Bulma 0.x markup moves to v1.
   - bulma-social stays only where bestax has nothing equivalent.
   - Large upstream images are recompressed into `public/`. Unsplash hot-links stay hot-links.
5. **Check parity.** Screenshot the original (the entry's `demo`) and the port side by side at
   phone and desktop widths, in light and dark (`prefers-color-scheme`), and check that the
   burger, modals, forms and theme toggles work. Bulma follows the visitor's color scheme, and
   an original built for one scheme often looks the same in both, holding its colors with
   overrides of its own. When it does, pin the scheme it was built for on the `<html>` in
   `index.html` (`data-theme="light"` for a light-only original), so the first paint has it too,
   and leave those overrides out (the bestax-theming skill's contrast rules say why). Fix
   upstream bugs minimally and note each one in the README.
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
what publishes it.

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
