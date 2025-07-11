# bestax-bulma

A modern, flexible React component library built with the latest Bulma v1 and TypeScript.

---

## 📚 Comprehensive Documentation

**Looking for full documentation, guides, API references, and best practices?**  
👉 **Visit our official docs at [https://bestax.cc](https://bestax.cc)**

> The documentation site is the best place to learn about all bestax-bulma features, usage patterns, and updates. We strongly recommend using the docs as your primary resource!

---

## 🚀 Getting Started

### 1. Install the package

```bash
npm install @allxsmith/bestax-bulma
# or
yarn add @allxsmith/bestax-bulma
```

### 2. Import Bulma CSS

You must include Bulma’s CSS in your project. The easiest way is to import it in your main JS/TS file:

```js
import 'bulma/css/bulma.min.css';
```

Or add it via CDN in your HTML:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bulma@1.0.0/css/bulma.min.css"
/>
```

### 3. (Optional) Add an Icon Library

Many components work well with icons. We recommend [Font Awesome](https://fontawesome.com/):

```bash
npm install @fortawesome/fontawesome-free
```

And then import in your code as needed.

### 4. Quick Example

Here’s how to use the `Button` component:

```tsx
import React from 'react';
import { Button } from '@allxsmith/bestax-bulma';
import 'bulma/css/bulma.min.css';

function App() {
  return (
    <div>
      <Button color="primary" onClick={() => alert('Clicked!')}>
        Click Me
      </Button>
    </div>
  );
}

export default App;
```

---

## 💎 Why Choose bestax-bulma?

- **Supports the latest Bulma v1.x**  
  Other React Bulma libraries are stuck on Bulma 0.9.4 — bestax-bulma is built for the future.
- **Super small bundle size**  
  The published ESM/CJS builds (dist/index.esm.js) are just over 81kB. Smaller than most other CSS based React frameworks.
- **Zero external dependencies**  
  Clean install, smaller bundle, fewer codeql security issues.
- **99% unit test coverage**  
  Rigorously tested for reliability and stability.
- **100% TypeScript**  
  Full type safety for you and your team.
- **100% Bulma Implementation**  
  Complete bulma implementation.
- **Active developer support**  
  Issues? Questions? PRs? Get fast responses and real improvements.

---

## 📦 NPM Package

View the package on npmjs:  
👉 [https://www.npmjs.com/package/@allxsmith/bestax-bulma](https://www.npmjs.com/package/@allxsmith/bestax-bulma)

---

## 📚 Documentation

**For full documentation, guides, and best practices, please use our official docs site:**

👉 [https://bestax.cc](https://bestax.cc)

> **Always refer to the [documentation site](https://bestax.cc) first:**  
> It’s the most complete and up-to-date source for everything bestax-bulma!

---

## 📖 Storybook

Explore live, interactive component examples in our Storybook:

👉 [https://bestax.cc/storybook](https://bestax.cc/storybook)

---

## 🙏 Special Thanks

### [Bulma](https://github.com/jgthms/bulma)

bestax-bulma is built on top of the incredible [@jgthms/bulma](https://github.com/jgthms/bulma) CSS framework.

If you find Bulma useful, please consider [sponsoring Jeremy Thomas](https://github.com/sponsors/jgthms) to support the continued development of Bulma.

_Note: We are not affiliated with Bulma or Jeremy Thomas in any way...We’re just big fans of the Bulma framework!_

---

## Attribution

- The [Bulma CSS framework](https://bulma.io) is © Jeremy Thomas and licensed under the [MIT License](https://github.com/jgthms/bulma/blob/master/LICENSE).
- Some example content and documentation in this site is adapted from the Bulma website ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)), © Jeremy Thomas.

See [Bulma’s license page](https://github.com/jgthms/bulma/blob/main/LICENSE) for more details.

## License

Source code licensed MIT
