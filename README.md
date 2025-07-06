# bestax Monorepo

Welcome to the **bestax** monorepo!

This repository contains all source code and documentation for the [bestax-bulma](https://www.npmjs.com/package/@allxsmith/bestax-bulma) React component library and its documentation site.

---

## Packages

This monorepo uses [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) and [Turborepo](https://turbo.build/) for managing multiple packages:

- [`bulma-ui/`](./bulma-ui):  
  The Bulma-based React component library.
  - NPM: [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma)
  - Source: [`bulma-ui/`](./bulma-ui)
  - [README & Usage](./bulma-ui/README.md)
- [`docs/`](./docs):  
  The [Docusaurus](https://docusaurus.io/) site documenting the component library.
  - Live site: [bestax.cc](https://bestax.cc)
  - [Component API Reference](/docs/api) (see the docs site sidebar)
  - [Storybook](https://bestax.cc/storybook) (UI tests and live playground)

---

## Getting Started

### 1. Install dependencies

Make sure you have [Node.js](https://nodejs.org/) and [npm](https://npmjs.com/) installed.

From the root of the repo:

```bash
npm install
```

> This will install dependencies for all workspaces.

---

### 2. Useful scripts

All scripts are run from the repo root and use [Turborepo](https://turbo.build/).

- **Build all packages:**
  ```bash
  npm run build
  ```
- **Start development mode (where supported):**
  ```bash
  npm run dev
  ```
- **Run all tests:**
  ```bash
  npm test
  ```
- **Check code formatting:**
  ```bash
  npm run format:check
  ```
- **Lint all packages:**
  ```bash
  npm run lint
  ```
- **Type check all packages:**
  ```bash
  npm run typecheck
  ```
- **Run Storybook for component development:**
  ```bash
  npm run storybook
  ```
- **Run Docs locally:**
  ```bash
  npm run docs
  ```
- **Run ALL, my favorite:**
  ```bash
  npm run all
  ```
- **See all scripts in [package.json](./package.json).**

---

### 3. Working in individual packages

- **bulma-ui:**  
  See [`bulma-ui/README.md`](./bulma-ui/README.md) for library-specific dev instructions.

- **docs:**  
  To run or build the docs site locally:
  ```bash
  cd docs
  npm install
  npm start
  ```
  or use the root-level `npm run docs`.

---

## Contributing

Pull requests and issues are welcome!  
See individual package READMEs for more details.

---

## License

MIT © [Alex Smith](https://github.com/allxsmith)
