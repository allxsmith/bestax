# templates: the porting guide

Each folder here is a free Bulma template from aldi's
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), rebuilt as a
complete create-bestax project with bestax components (#1118). The Templates page on bestax.io
opens each one in StackBlitz, which imports the folder straight from GitHub:

```text
https://stackblitz.com/github/allxsmith/bestax/tree/main/templates/<slug>
```

That decides most of what follows. StackBlitz never sees the rest of this repo, so a template
has to install and build on its own. And every template is someone else's work, so it keeps
their MIT notice and says where it came from.

This file is the pipeline a port goes through. What a finished template is held to lives in
`scripts/lib/templates.mjs`, whose header lists every rule, and "The checks" below says where
each one runs.

## What a template is

`templates/<slug>/`, with a kebab-case slug. The slug is in the StackBlitz URL and in every
link the Templates page makes, so pick it once.

- **A create-bestax `vite-ts` project:** `package.json`, `index.html`, the tsconfigs,
  `vite.config.ts`, `src/` and `public/`. `src/` holds `main.tsx`, an `App.tsx` that renders one
  component per section of the page, and `index.css`.
- **`package.json`:**
  - `"private": true`, and registry ranges only: no `workspace:`, `link:`, `file:` or
    `catalog:`, and no git or path specifiers.
  - `@allxsmith/bestax-bulma` in `dependencies` at the current release's caret range, and no
    `bulma`. bestax's stylesheet carries Bulma.
  - None of the scaffold's ESLint setup: no `lint` script, no `globals`, and no devDependency
    with `eslint` in its name. That's what the docs sandbox builder strips too, so StackBlitz
    installs quickly.
- **No `eslint.config.js`.** ESLint reads the config nearest each file, so a template's own
  would replace `templates/eslint.config.js`, the one the repo lints it with.
- **`public/`:** the upstream images, recompressed when they're large. Unsplash hot-links stay
  hot-links.
- **`LICENSE`:** the upstream MIT notice verbatim, then the notice for the bestax port. See
  [LICENSE](#license) below.
- **`README.md`:** who made the original and where it lives, the commit it was ported from, a
  mention of awesome-bulma-templates, the upstream bugs the port fixed, and how to run it. See
  [README](#readme) below.
- **No lockfile, and not a workspace package.** `pnpm-workspace.yaml` leaves `templates/` out,
  and the root `.gitignore` keeps a lockfile from a local install out of the commit.

Outside its folder, each template also has an entry in `docs/src/data/templates.js`, a
screenshot at `docs/static/img/templates/<slug>.jpg`, and a line under Templates in the root
`NOTICE`.

## The pipeline

Work through these in order. Where a step depends on something not built yet, it says so.

### 1. Get the original

Clone the upstream repo into a scratch folder outside this repo, and check out the commit
you're porting:

```bash
mkdir -p /tmp/port && cd /tmp/port
git clone https://github.com/<owner>/<repo>
git -C <repo> checkout <sha>
```

Write the full SHA everywhere it goes: the README and the data entry. Read the upstream LICENSE
now. If there isn't one, or it isn't MIT, stop and say so on the port issue rather than porting.

Note what the page loads: its Bulma version, icon and web fonts, Bulma extensions, jQuery, and
its own scripts. Each template's port issue, linked from #1118, lists these and proposes its
tags.

### 2. Scaffold

Run create-bestax in the scratch folder, outside this repo, the way a user would. It takes a
bare name, not a path:

```bash
cd /tmp/port
npm create bestax@latest <slug> -- -t vite-ts -i fontawesome -y --no-skills --no-telemetry
```

To scaffold from this checkout instead, build create-bestax and run its build with the same
flags, still from the scratch folder:

```bash
pnpm exec turbo run build --filter=create-bestax
node <this repo>/create-bestax/dist/index.js <slug> -t vite-ts -i fontawesome -y --no-skills --no-telemetry
```

`-i fontawesome` fits the templates that use Font Awesome. If the upstream uses another icon
font create-bestax offers, pass that one.

Copy the result into `templates/<slug>/` without `node_modules`, then strip the ESLint setup:
delete `eslint.config.js`, the `lint` script, `globals`, and every devDependency with `eslint`
in its name. Keep the scaffold's `.gitignore`.

### 3. Convert

**Not built yet:** bestax-migrate reads HTML once #1119 lands. Then it converts the page
directly:

```bash
pnpm dlx bestax-migrate bulma-classes /tmp/port/<repo>/index.html
```

It writes the page as a component module beside the `.html`, and leaves a
`TODO(bestax-migrate)` and a report entry for everything a component can't carry: the
`<head>`, the scripts, inline event handlers, and the stylesheets and assets the page loads.
Leave `--css` at its default, since the scaffold's `main.tsx` already imports bestax's
stylesheet.

Until then, convert the page's `<body>` to JSX by hand (`class` to `className`, `for` to
`htmlFor`, `style` strings to objects, void elements closed, comments to `{/* */}`), save it as
a `.tsx` beside the page, and run the codemod's JSX input over it, which works today:

```bash
pnpm dlx bestax-migrate bulma-classes /tmp/port/<repo>/index.tsx
```

To use codemod changes that haven't been released, build it with
`pnpm exec turbo run build --filter=bestax-migrate` and run `node bestax-migrate/dist/index.js`
in place of `pnpm dlx bestax-migrate`.

Either way, move the result into `src/`. Split it into one component per section of the page
under `src/components/`, and have `App.tsx` render them in order. Port the upstream stylesheet
into `src/index.css`, and copy the images the page uses into `public/`.

### 4. Resolve every TODO(bestax-migrate)

Resolve each `TODO(bestax-migrate)` with the skills and the bestax MCP server, not from memory:

- The skills: `bestax-migrate` (its `unmappables.md` reference has a recipe for each TODO
  rule), `bestax-layout-scaffold`, `bestax-form`, `bestax-icons` and `bestax-theming`.
- The MCP server: `lookup_bulma_classes` for a class, `get_props` for a component's props, and
  `get_examples` for working code.

What usually comes up:

- Upstream scripts become React state: the navbar burger, modals, tabs, dropdowns and theme
  toggles.
- bulma-carousel becomes `Carousel`, and jQuery goes away.
- Bulma 0.x markup moves to v1.
- bulma-social stays only where bestax has nothing equivalent, with its classes on a bestax
  `Button` through `className`.

The templates test fails while a `TODO(bestax-migrate)` is left in `src/`, and the lint fails
on a raw Bulma class that bestax has a component for.

### 5. Check parity

Serve the original and the port side by side:

```bash
npx serve /tmp/port/<repo>
cd templates/<slug> && npm install --no-package-lock && npm run dev
```

Compare them at a phone width and a desktop width, with screenshots of both (Playwright, or the
browser's device toolbar), and by hand: the burger, modals, forms and theme toggles all work
in the port. Fix upstream bugs minimally, and note each one in the README, so nobody takes it
for a porting mistake.

### 6. Finish up

- Run `npm run build` in the template. It's `tsc -b && vite build`, the build StackBlitz runs.
- **Not built yet:** the Templates page (#1120) adds the screenshot script and the data file.
  `docs/scripts/screenshot-template.mjs <slug>` writes the screenshot, and
  `docs/src/data/templates.js` gets the entry, in its `templates` export: `slug`, `title`,
  `description`, `author { name, url }`, `source`, `sourceSha`, `demo`, `license` and `tags`.
  The checks read `slug`, `source` and `sourceSha`, and hold the README and the NOTICE line to
  the last two. Until #1120 lands neither has anywhere to go, so the first template lands with
  that PR or after it.
- Add the template's line to the root `NOTICE`, under Templates:

  ```text
  templates/<slug> is a port of <repo> by <author> (<source>), licensed under the MIT license.
  ```

- Run the repo checks. The type-check and the lint read the library's and the ESLint plugin's
  builds, so build those first (the plugin's build builds the library too):

  ```bash
  pnpm exec turbo run build --filter=@allxsmith/eslint-plugin-bestax
  pnpm format
  pnpm test:scripts
  pnpm lint
  pnpm check:conformance
  ```

### 7. File what the tools missed

Anything the codemod should have converted and didn't, and any gap in the library the port
runs into, gets its own issue, linked from #1118. Write it so it stands on its own: the
upstream markup, what the tool did with it, and what it should have done.

## LICENSE

The upstream notice comes first and verbatim, then the port's, which is the root `LICENSE` with
the year of the port:

```text
<the upstream LICENSE, verbatim>

---

The bestax port of this template is licensed under the same terms:

MIT License

Copyright (c) <year> Alex Smith

<the rest of the root LICENSE>
```

The check tells the two notices apart by the holder the root `LICENSE` names, and fails a
LICENSE missing either one or with the port's first.

## README

````markdown
# <Title>, rebuilt with bestax

<One line on what the page is.>

The original is [<repo>](https://github.com/<owner>/<repo>) by
[<author>](https://github.com/<owner>), ported from commit
[`<sha>`](https://github.com/<owner>/<repo>/tree/<sha>). It's one of the free Bulma
templates in aldi's [awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates).

## Run it

```bash
npm install
npm run dev
```

This folder isn't part of the bestax pnpm workspace, so in a clone of the monorepo, run it with
npm or with `pnpm install --ignore-workspace`.

## Changes from the original

- <each upstream bug the port fixed, and anything else it does differently>
````

## The checks

- **`scripts/templates.test.mjs`**, in `pnpm test:scripts`, holds every folder here to the rules
  in `scripts/lib/templates.mjs`, and fails a data entry, screenshot or NOTICE line with no
  folder. It proves each rule on the fixture tree in `scripts/fixtures/templates-repo`, never on
  a folder here, so it passes with no templates.
- **`scripts/skill-examples-typecheck.test.mjs`**, in the same suite, compiles each template's
  `src/` with the template's own compiler options against the built library, the way its
  `tsc -b` does.
- **`pnpm lint`** lints `templates/*/src` with `templates/eslint.config.js`: the root config
  plus the bestax ESLint plugin, with `no-bulma-component-class` at error. The templates test
  checks that the lint reaches every source here.
- **`pnpm format`** formats the TypeScript and the README with the rest of the repo.

No check compares a port with its original. That's step 5, by hand, and the PR says what you
compared.
