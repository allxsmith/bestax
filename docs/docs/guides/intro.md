---
title: Quick Start
sidebar_label: Quick Start
sidebar_position: 1
---

# Quick Start

Get **bestax-bulma** running in under 2 minutes with this quick start guide.

:::tip
For detailed installation options, framework-specific guides, or troubleshooting, check out our [comprehensive guides](/docs/guides/getting-started/installation).
:::

---

## 1. Create a React App

Using Vite (recommended for quick setup):

```bash
npm create vite@latest my-bestax-app -- --template react
cd my-bestax-app
```

---

## 2. Install Dependencies

```bash
npm install @allxsmith/bestax-bulma bulma
```

---

## 3. Add Bulma CSS

In your `src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bulma/css/bulma.min.css'; // Add this line
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 4. Use Your First Component

Replace `src/App.jsx`:

```jsx
import { Button, Box, Title, Notification } from '@allxsmith/bestax-bulma';
import { useState } from 'react';

function App() {
  const [showAlert, setShowAlert] = useState(false);

  return (
    <Box>
      <Title>Welcome to bestax-bulma! 🎉</Title>

      <Button color="primary" onClick={() => setShowAlert(!showAlert)}>
        Click me!
      </Button>

      {showAlert && (
        <Notification color="success" mt="4">
          Great! You're ready to build with bestax-bulma.
        </Notification>
      )}
    </Box>
  );
}

export default App;
```

---

## 5. Run Your App

```bash
npm run dev
```

**That's it!** Visit http://localhost:5173 to see your app running.

---

## What's Next?

Now that you have bestax-bulma running:

### 📦 **Installation Options**

→ [Installation Guide](/docs/guides/getting-started/installation)

- Different ways to include Bulma CSS
- Adding icon libraries (Font Awesome, Material Icons)
- Prerequisites and browser support

### 🛠️ **Toolchain Setup**

→ [Toolchains](/docs/guides/getting-started/react-setups)

- Next.js setup (with SSR)
- TypeScript configuration
- Create React App setup
- Vite advanced configuration

### 🎨 **Explore Components**

→ [Browse all components](/docs/category/elements)

- 60+ React components
- Full Bulma v1 support
- Live examples and API docs

---

## Component Categories

bestax-bulma provides a complete set of Bulma components organized into logical groups:

### 🟢 [Elements](/docs/category/elements)

Basic building blocks like [Button](/docs/api/elements/button), [Box](/docs/api/elements/box), [Title](/docs/api/elements/title), and [Tag](/docs/api/elements/tag).

### 🟦 [Layout](/docs/category/layout)

Structure your app with [Container](/docs/api/layout/container), [Section](/docs/api/layout/section), [Hero](/docs/api/layout/hero), and [Level](/docs/api/layout/level).

### 🟧 [Components](/docs/category/components)

Advanced UI components like [Modal](/docs/api/components/modal), [Navbar](/docs/api/components/navbar), [Card](/docs/api/components/card), and [Dropdown](/docs/api/components/dropdown).

### 🟪 [Form](/docs/category/form)

Complete form controls including [Input](/docs/api/form/input), [Select](/docs/api/form/select), [Checkbox](/docs/api/form/checkbox), and [Field](/docs/api/form/field).

### 🟩 [Grid & Columns](/docs/category/grid)

Responsive layouts with [Grid](/docs/api/grid), [Columns](/docs/api/columns), and [Cell](/docs/api/grid/cell).

---

## Live Playground

Want to experiment? Try our live examples:

```tsx live
// Try editing this code!
function Demo() {
  const [count, setCount] = useState(0);

  return (
    <Box>
      <Title size="4">Interactive Demo</Title>
      <Buttons>
        <Button color="primary" onClick={() => setCount(count + 1)}>
          Clicked {count} times
        </Button>
        <Button color="danger" isOutlined onClick={() => setCount(0)}>
          Reset
        </Button>
      </Buttons>
    </Box>
  );
}
```

---

## Need Help?

- 📚 **[Full Documentation](/docs/guides/getting-started/installation)** - Detailed setup guides
- 🎨 **[Storybook](https://bestax.io/storybook)** - Interactive component explorer
- 💬 **[GitHub Issues](https://github.com/allxsmith/bestax/issues)** - Report bugs or request features
- 📦 **[NPM Package](https://www.npmjs.com/package/@allxsmith/bestax-bulma)** - Package details

---

## Why bestax-bulma?

- ✅ **Latest Bulma v1** - Full support for the newest Bulma features
- ✅ **TypeScript Ready** - Complete type definitions included
- ✅ **Tree Shakeable** - Only import what you need
- ✅ **99% Test Coverage** - Reliable and stable
- ✅ **Zero Dependencies** - Just React and Bulma CSS

---

:::info Bulma CSS Required
Remember that bestax-bulma components require Bulma CSS to be loaded. The components provide the React integration, while Bulma CSS provides the styling.
:::
