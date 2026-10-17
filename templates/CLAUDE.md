# templates: Bulma templates rebuilt with bestax

Each folder here is a free Bulma template from aldi's
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), ported to bestax: a
complete create-bestax `vite-ts` project that StackBlitz opens straight from GitHub
(`https://stackblitz.com/github/allxsmith/bestax/tree/main/templates/<slug>`). The docs site lists
them on its Templates page (`docs/src/pages/templates`). #1118 is the epic, with one issue per
template; #1121 specifies this folder.

## What a template folder is

- **A create-bestax scaffold without its lint setup.** The port lives in `src/` (an `App` plus
  section components) and the upstream's images in `public/`.
- **Not a workspace package.** It stays out of `pnpm-workspace.yaml`, carries no lockfile, and its
  `package.json` takes registry ranges only, because StackBlitz imports the folder and nothing
  else. To run one inside this repo, `pnpm install --ignore-workspace` in its folder, and delete
  the `pnpm-lock.yaml` that writes before you commit; the checks refuse it.
- **`LICENSE`:** the upstream MIT notice verbatim, followed by the notice for the bestax port.
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
   with the same flags:

   ```bash
   node create-bestax/dist/index.js <scratch>/<slug> -t vite-ts -i fontawesome -y --no-skills --no-telemetry
   ```

   Then strip the lint setup: delete `eslint.config.js`, the `lint` script and the lint
   devDependencies, the same packages the docs StackBlitz builder drops (`isLintPackage` in
   `docs/src/theme/CodeBlock/sandbox/projects.mjs`). Give `@allxsmith/bestax-bulma` the current
   release's caret range, and copy the result into `templates/<slug>/` without `node_modules`.

3. **Convert.** `bestax-migrate bulma-classes <upstream>/index.html` turns the markup into bestax
   components. Reading HTML is #1119, so until that lands this step is the intended command, and
   the conversion goes by hand along the bestax-migrate skill's `bulma-classes` references. Move
   the output into `src/` and split it into section components. Port the upstream stylesheet into
   `src/index.css`, and drop the Bulma and plugin `<link>` and `<script>` tags from `index.html`.
4. **Resolve every `TODO(bestax-migrate)`** with the skills (bestax-migrate,
   bestax-layout-scaffold, bestax-form, bestax-icons, bestax-theming) and the bestax MCP server
   (`lookup_bulma_classes`, `get_props`, `get_examples`).
   - Upstream scripts become React state.
   - bulma-carousel becomes `Carousel`, and jQuery goes away.
   - Bulma 0.x markup moves to v1.
   - bulma-social stays only where bestax has nothing equivalent.
   - Large upstream images are recompressed into `public/`. Unsplash hot-links stay hot-links.
5. **Check parity.** Screenshot the original (the entry's `demo`) and the port side by side at
   phone and desktop widths, and check that the burger, modals, forms and theme toggles work. Fix
   upstream bugs minimally and note each one in the README.
6. **Finish up.**
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
  screenshot, each against the others.
- **`scripts/skill-examples-typecheck.test.mjs`**: every template's `src/` compiles under the
  `vite-ts` template's compiler options against the built library, as it does in StackBlitz.
- **`pnpm lint`** lints `templates/*/src` with `templates/eslint.config.js`: the root rules plus
  the bestax ESLint plugin, with `no-bulma-component-class` at error so no raw Bulma component
  class ships in a port. It loads the plugin's build, so build first.
- Prettier formats the TypeScript and the README with the rest of the repo.
