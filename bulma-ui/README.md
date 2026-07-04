# @allxsmith/bestax-bulma

[![npm version](https://img.shields.io/npm/v/@allxsmith/bestax-bulma.svg)](https://www.npmjs.com/package/@allxsmith/bestax-bulma)
[![npm downloads](https://img.shields.io/npm/dm/@allxsmith/bestax-bulma.svg)](https://www.npmjs.com/package/@allxsmith/bestax-bulma)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@allxsmith/bestax-bulma.svg)](https://bundlephobia.com/package/@allxsmith/bestax-bulma)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Coverage](https://img.shields.io/badge/coverage-99%25-brightgreen.svg)](https://github.com/allxsmith/bestax/blob/main/bulma-ui/jest.config.js)
[![Bulma](https://img.shields.io/badge/Bulma-v1.0+-00d1b2.svg)](https://bulma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript-first React component library for the **Bulma v1** CSS framework — 80+ fully typed, tree-shakeable components, including extras like Carousel, Dialog, Sidebar, Steps, and date/time pickers.

**Requires React `^18 || ^19`.** Bulma v1 is the only runtime dependency and installs automatically.

Part of the [bestax monorepo](https://github.com/allxsmith/bestax) — see also [`create-bestax`](https://www.npmjs.com/package/create-bestax) for scaffolding new projects.

---

## 📚 Comprehensive Documentation

**Looking for full documentation, guides, API references, and best practices?**  
👉 **Visit our official docs at [https://bestax.io](https://bestax.io)**

> The documentation site is the best place to learn about all bestax-bulma features, usage patterns, and updates. We strongly recommend using the docs as your primary resource!

---

## 🚀 Getting Started

Starting fresh? Scaffold a ready-to-go app instead: `npm create bestax@latest my-app`.

### 1. Install the package

```bash
npm install @allxsmith/bestax-bulma
# or
pnpm add @allxsmith/bestax-bulma
```

### 2. Import the CSS

The library bundles its own CSS (Bulma v1 + the bestax extras). Import it once in your main JS/TS file:

```js
import '@allxsmith/bestax-bulma/bestax.css';
```

Prefer stock Bulma? That works too — add `extras.css` for the bestax-only components' styles:

```js
import 'bulma/css/bulma.min.css';
import '@allxsmith/bestax-bulma/extras.css';
```

More flavors are shipped as subpath exports — prefixed classes (`versions/bestax-prefixed.css` + `<ConfigProvider classPrefix="bestax-">`), no-helpers, no-dark-mode, and raw SCSS at `@allxsmith/bestax-bulma/scss/*`. See the [installation guide](https://bestax.io/docs/guides/getting-started/installation).

### 3. (Optional) Add an Icon Library

Five icon libraries are supported as optional peer dependencies: [Font Awesome](https://fontawesome.com/) (`@fortawesome/fontawesome-free`), Material Design Icons (`@mdi/font`), `ionicons`, `material-icons`, and `material-symbols`.

```bash
npm install @fortawesome/fontawesome-free
```

Set the default for your whole app with [`ConfigProvider`](https://bestax.io/docs/api/helpers/config), e.g. `<ConfigProvider iconLibrary="fa">`.

### 4. Quick Example

```tsx
import '@allxsmith/bestax-bulma/bestax.css';
import { Button } from '@allxsmith/bestax-bulma';

function App() {
  return (
    <Button color="primary" onClick={() => alert('Clicked!')}>
      Click Me
    </Button>
  );
}

export default App;
```

### 5. Theming and Dark Mode

Wrap your app in [`Theme`](https://bestax.io/docs/api/helpers/theme) to override Bulma's `--bulma-*` CSS variables and control the color scheme:

```tsx
import { Theme } from '@allxsmith/bestax-bulma';

<Theme isRoot colorMode="system">
  {/* colorMode: 'light' | 'dark' | 'system' */}
  <App />
</Theme>;
```

---

## ⭐ Why Choose bestax-bulma?

- **Supports the latest Bulma v1.x**
  Other React Bulma libraries are stuck on Bulma 0.9.4 — bestax-bulma is built for the future.
- **80+ components**
  All of Bulma v1, plus extras: Carousel, Dialog, Sidebar, Steps, Autocomplete, Taginput, DateInput/TimeInput/DateTimeInput pickers, and more. (Migrating from v2? Snackbar merged into [Toast](https://bestax.io/docs/api/components/toast).)
- **Dark mode & theming built in**
  `Theme colorMode`, `--bulma-*` variable overrides, and prefixed-class builds via `ConfigProvider`.
- **Just one dependency: Bulma**
  Every Bulma library depends on it — we ship it automatically. Clean install, fewer security concerns.
- **Tree-shakeable ESM + CJS**
  Import only what you use — see the live [bundle size](https://bundlephobia.com/package/@allxsmith/bestax-bulma).
- **99% unit test coverage**
  Enforced in CI by the [jest config](https://github.com/allxsmith/bestax/blob/main/bulma-ui/jest.config.js) — not just claimed.
- **100% TypeScript**
  Full type safety for you and your team.
- **Active developer support**
  Issues? Questions? PRs? Get fast responses and real improvements.

---

## 📦 NPM Package

View the package on npmjs:  
👉 [https://www.npmjs.com/package/@allxsmith/bestax-bulma](https://www.npmjs.com/package/@allxsmith/bestax-bulma)

---

## 📚 Documentation

**For full documentation, guides, and best practices, please use our official docs site:**

👉 [https://bestax.io](https://bestax.io)

> **Always refer to the [documentation site](https://bestax.io) first:**  
> It's the most complete and up-to-date source for everything bestax-bulma!

---

## 📖 Storybook

Explore live, interactive component examples in our Storybook:

👉 [https://bestax.io/storybook](https://bestax.io/storybook)

---

## 🤖 For AI Tools

Building with an AI agent (Claude Code, Cursor, Copilot)? bestax-bulma ships LLM-optimized docs:

- 📘 **[LLMs guide](https://bestax.io/docs/guides/llms)** — how to use the library with AI tools
- 📄 **[llms.txt](https://bestax.io/llms.txt)** — curated index · **[llms-full.txt](https://bestax.io/llms-full.txt)** — the full docs in one file · every docs page is also served as raw markdown
- 🧩 **[Agent Skills](https://bestax.io/docs/skills/intro)** — teach your agent the bestax way:

  | Skill                     | Use it when…                                                                     |
  | ------------------------- | -------------------------------------------------------------------------------- |
  | `bestax-layout-scaffold`  | Turning a high-level request (dashboard, landing page, …) into a responsive page |
  | `bestax-form`             | Building forms — Field/Control composition and the full input inventory          |
  | `bestax-theming`          | Customizing colors, fonts, dark mode via `Theme` and `--bulma-*` variables       |
  | `bestax-custom-component` | Building a new custom component beyond stock Bulma, the bestax way               |

  ```bash
  npx skills add https://github.com/allxsmith/bestax --skill bestax-layout-scaffold
  ```

  New projects get the skills automatically with `npm create bestax@latest my-app --skills` (plus a generated `CLAUDE.md`).

---

## 🙏 Special Thanks

### [Bulma](https://github.com/jgthms/bulma)

bestax-bulma is built on top of the incredible [@jgthms/bulma](https://github.com/jgthms/bulma) CSS framework.

If you find Bulma useful, please consider [sponsoring Jeremy Thomas](https://github.com/sponsors/jgthms) to support the continued development of Bulma.

_Note: We are not affiliated with Bulma or Jeremy Thomas in any way...We're just big fans of the Bulma framework!_

---

## Attribution

- The [Bulma CSS framework](https://bulma.io) is © Jeremy Thomas and licensed under the [MIT License](https://github.com/jgthms/bulma/blob/master/LICENSE).
- Some example content and documentation in this site is adapted from the Bulma website ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)), © Jeremy Thomas.

See [Bulma's license page](https://github.com/jgthms/bulma/blob/main/LICENSE) for more details.

## License

Source code licensed MIT
