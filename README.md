# bestax

[![npm version](https://img.shields.io/npm/v/@allxsmith/bestax-bulma.svg)](https://www.npmjs.com/package/@allxsmith/bestax-bulma)
[![npm downloads](https://img.shields.io/npm/dm/@allxsmith/bestax-bulma.svg)](https://www.npmjs.com/package/@allxsmith/bestax-bulma)
[![create-bestax](https://img.shields.io/npm/v/create-bestax.svg?label=create-bestax)](https://www.npmjs.com/package/create-bestax)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@allxsmith/bestax-bulma.svg)](https://bundlephobia.com/package/@allxsmith/bestax-bulma)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Coverage](https://img.shields.io/badge/coverage-99%25-brightgreen.svg)](https://github.com/allxsmith/bestax/blob/main/bulma-ui/jest.config.js)
[![Bulma](https://img.shields.io/badge/Bulma-v1.0+-00d1b2.svg)](https://bulma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript-first React component library for the **Bulma v1** CSS framework — 80+ fully typed components — plus a project scaffolder and AI agent tooling.

## 📋 At a glance

|                      |                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Library**          | [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma) — `npm install @allxsmith/bestax-bulma`                                                     |
| **Scaffolder**       | [`create-bestax`](https://www.npmjs.com/package/create-bestax) — `npm create bestax@latest my-app`                                                                             |
| **Requires**         | React `^18 \|\| ^19` (+ `react-dom`). Bulma v1 is the library's only runtime dependency — installed automatically                                                              |
| **Styles**           | `import '@allxsmith/bestax-bulma/bestax.css';` — Bulma v1 + the bestax extras ([more flavors](#-styling-and-theming))                                                          |
| **Icons (optional)** | Font Awesome, Material Design Icons, Ionicons, Material Icons, Material Symbols — all optional peer dependencies                                                               |
| **Docs**             | [bestax.io](https://bestax.io) · [Storybook](https://bestax.io/storybook)                                                                                                      |
| **LLM docs**         | [llms.txt](https://bestax.io/llms.txt) (curated index) · [llms-full.txt](https://bestax.io/llms-full.txt) (complete docs, one file)                                            |
| **Agent Skills**     | `npx skills add https://github.com/allxsmith/bestax --skill bestax-layout-scaffold` ([all four skills](skills/README.md))                                                      |
| **Community**        | [Discord](https://discord.gg/zehJrQGtKu) · [Stack Overflow `bestax`](https://stackoverflow.com/questions/tagged/bestax) · [Issues](https://github.com/allxsmith/bestax/issues) |

> **If you are an AI agent or LLM:** fetch **<https://bestax.io/llms.txt>** for a curated index of the full documentation, or **<https://bestax.io/llms-full.txt>** for the complete docs in a single file, before answering questions about or writing code with this library. Every page on [bestax.io](https://bestax.io) is also available as raw markdown — see the [LLMs guide](https://bestax.io/docs/guides/llms).

**Full documentation, guides, and API reference: 👉 [https://bestax.io](https://bestax.io)** — the docs site is always the most complete and up-to-date resource.

---

## 🚀 Quick start

### New project

Scaffold a Vite app with everything wired up (CSS flavor, icon library, optional AI skills + `CLAUDE.md`):

```bash
npm create bestax@latest my-app
# or: pnpm create bestax my-app
```

Useful flags: `-t vite|vite-ts` (template), `-b complete|prefixed|no-helpers|no-helpers-prefixed|no-dark-mode` (CSS flavor), `-i fontawesome|mdi|ionicons|material-icons|material-symbols|none` (icons), `--skills` (install the [Agent Skills](#-for-ai-tools) into `.claude/skills`), `-y` (accept defaults). See the [create-bestax README](create-bestax/README.md).

### Existing project

```bash
npm install @allxsmith/bestax-bulma
# or: pnpm add @allxsmith/bestax-bulma
```

Import the bundled CSS once (Bulma v1 + the bestax extras), then use components:

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
```

Prefer stock Bulma? `import 'bulma/css/bulma.min.css';` works too — you'll just miss the bestax-only components' styles (add `@allxsmith/bestax-bulma/extras.css` for those).

Theming, dark mode, and configuration are one wrapper away:

```tsx
import { Theme, ConfigProvider } from '@allxsmith/bestax-bulma';

function Root() {
  return (
    <Theme isRoot colorMode="system">
      {/* colorMode: 'light' | 'dark' | 'system' */}
      <ConfigProvider iconLibrary="fa">
        <App />
      </ConfigProvider>
    </Theme>
  );
}
```

[Installation guide](https://bestax.io/docs/guides/getting-started/installation) · [Configuration](https://bestax.io/docs/guides/features/configuration)

---

## 📦 What's in this repo

| Path                                 | Package                                                                            | What it is                                                                                                |
| ------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`bulma-ui/`](bulma-ui/)             | [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma) | The component library                                                                                     |
| [`create-bestax/`](create-bestax/)   | [`create-bestax`](https://www.npmjs.com/package/create-bestax)                     | Project scaffolder — `npm create bestax@latest`                                                           |
| [`bestax-migrate/`](bestax-migrate/) | [`bestax-migrate`](https://www.npmjs.com/package/bestax-migrate)                   | Codemods for migrating existing apps from other React Bulma libraries                                     |
| [`docs/`](docs/)                     | —                                                                                  | Docusaurus source of [bestax.io](https://bestax.io)                                                       |
| [`skills/`](skills/)                 | —                                                                                  | [Agent Skills](https://bestax.io/docs/skills/intro) for coding agents (also bundled into `create-bestax`) |

The published packages are versioned and released independently.

---

## 🧩 Components

80+ components covering all of Bulma v1, plus bestax extras (Carousel, Dialog, Sidebar, Steps, date/time pickers, and more):

- **[Elements](https://bestax.io/docs/api/elements/button)** — Button, Table, Tag, Title, Icon, Image, Notification, Progress, Skeleton, Content, Delete, and typed HTML wrappers (Paragraph, Span, Figure, lists, …)
- **[Components](https://bestax.io/docs/api/components/modal)** — Navbar, Modal, Card, Dropdown, Menu, Message, Pagination, Panel, Tabs, Breadcrumb, Toast, Tooltip, Steps, Sidebar, Carousel, Collapse, Dialog, Loading
- **[Form](https://bestax.io/docs/api/form/input)** — Field/Control, Input, Select, TextArea, Checkbox(es), Radio(s), Switch, Slider, Rate, File, Numberinput, Autocomplete, Taginput, and DateInput / TimeInput / DateTimeInput pickers
- **[Layout](https://bestax.io/docs/api/layout/container)** — Container, Section, Hero, Level, Media, Footer
- **[Columns](https://bestax.io/docs/api/columns/columns)** & **[Grid](https://bestax.io/docs/api/grid/grid)** — classic 12-column flexbox columns and the Bulma v1 CSS Grid
- **[Helpers](https://bestax.io/docs/api/helpers/theme)** — `Theme`, `ConfigProvider`, `useBulmaClasses`, `classNames`

> Migrating from v2? Snackbar was merged into [Toast](https://bestax.io/docs/api/components/toast) in v3 — see the [migration guides](https://bestax.io/docs/guides/getting-started/migration).

---

## 🎨 Styling and theming

Pick one CSS flavor (all shipped with the library — matching `create-bestax -b`):

| Import                                                            | What you get                                                                        |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `@allxsmith/bestax-bulma/bestax.css`                              | **Default.** Bulma v1 + bestax extras                                               |
| `@allxsmith/bestax-bulma/versions/bestax-prefixed.css`            | All classes prefixed `bestax-` — pair with `<ConfigProvider classPrefix="bestax-">` |
| `@allxsmith/bestax-bulma/versions/bestax-no-helpers.css`          | Without Bulma helper classes                                                        |
| `@allxsmith/bestax-bulma/versions/bestax-no-helpers-prefixed.css` | Prefixed, without helpers                                                           |
| `@allxsmith/bestax-bulma/versions/bestax-no-dark-mode.css`        | Without dark-mode styles                                                            |
| `@allxsmith/bestax-bulma/extras.css`                              | bestax extras only — for use alongside stock `bulma/css/bulma.min.css`              |
| `@allxsmith/bestax-bulma/scss/*`                                  | Raw SCSS for full customization                                                     |

- **Dark mode:** `<Theme colorMode="dark">` (or `"system"` to follow the OS) — [docs](https://bestax.io/docs/api/helpers/theme)
- **Brand colors, fonts, radius:** the [`Theme`](https://bestax.io/docs/api/helpers/theme) component overrides Bulma's `--bulma-*` CSS variables (globally with `isRoot`, or scoped to a subtree). Default primary color is `#1e6b99`
- **Class prefixing & icon defaults:** [`ConfigProvider`](https://bestax.io/docs/api/helpers/config) sets `classPrefix` and `iconLibrary` for a whole tree
- **CSS variables reference:** [docs](https://bestax.io/docs/guides/features/css-variables)

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

## ⭐ Why bestax-bulma?

- **Built for Bulma v1.x** — most other React Bulma libraries are stuck on Bulma 0.9.4
- **100% TypeScript** — every component and prop fully typed
- **One runtime dependency: Bulma** — it ships with the library; clean install, fewer security concerns
- **Lightweight** — see the live [bundlephobia badge](https://bundlephobia.com/package/@allxsmith/bestax-bulma); tree-shakeable ESM + CJS
- **99% test coverage** — enforced in CI by the [jest config](bulma-ui/jest.config.js), not just claimed
- **Active developer support** — issues, questions, and PRs get fast responses

---

## 💬 Community

- [Discord](https://discord.gg/zehJrQGtKu)
- [Stack Overflow — tag `bestax`](https://stackoverflow.com/questions/tagged/bestax)
- [GitHub issues](https://github.com/allxsmith/bestax/issues)

---

## Contributing

Want to contribute or run the project locally? See [`CONTRIBUTING.md`](CONTRIBUTING.md). In short:

```bash
corepack enable && pnpm install --frozen-lockfile
pnpm all   # build, typecheck, test + coverage, lint — the pre-PR gate
```

This is a pnpm + Turborepo monorepo; contributor-facing AI context lives in [`CLAUDE.md`](CLAUDE.md) (mirrored for other tools in [`AGENTS.md`](AGENTS.md)).

---

## 🙏 Attribution

bestax-bulma is built on top of the incredible [Bulma](https://bulma.io) CSS framework,
© [Jeremy Thomas](https://github.com/jgthms) and licensed under the
[MIT License](https://github.com/jgthms/bulma/blob/main/LICENSE). Some example content and
documentation is adapted from the Bulma website
([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)), © Jeremy Thomas.

If you find Bulma useful, please consider
[sponsoring Jeremy Thomas](https://github.com/sponsors/jgthms) to support its continued
development.

_We are not affiliated with Bulma or Jeremy Thomas in any way — we're just big fans of the
Bulma framework!_

---

## License

MIT © [Alex Smith](https://github.com/allxsmith)
