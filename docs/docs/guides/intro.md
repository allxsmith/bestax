---
title: Quick Start
sidebar_label: Quick Start
sidebar_position: 1
---

# Quick Start

## Create a Bestax App

The fastest way to get started. The scaffolder sets up a Vite + React project with bestax-bulma and CSS pre-configured:

```bash
npm create bestax@latest my-bestax-app
cd my-bestax-app
npm install
npm run dev
```

:::info CSS is included automatically
The scaffolder configures `bestax.css` for you — a single stylesheet that includes both Bulma and all bestax extras. No manual CSS setup needed.
:::

That's it! Visit http://localhost:5173 to see your app. Skip ahead to [Next Steps](#next-steps), or keep reading to add bestax to an existing project.

---

## Add to an Existing Project

### Install Dependencies

```bash
npm install @allxsmith/bestax-bulma
```

### Add Bestax CSS

Import the combined stylesheet in your application entry point (e.g. `main.jsx`, `main.tsx`, `index.js`):

```js
import '@allxsmith/bestax-bulma/bestax.css';
```

This single import includes both Bulma base styles and all bestax extras.

:::tip Already using Bulma?
If you already import Bulma CSS separately, you can keep that and just add the extras:

```js
import 'bulma/css/bulma.min.css';
import '@allxsmith/bestax-bulma/extras.css';
```

:::

---

## Use Your First Component

Replace `src/App.jsx` (or add to your existing app):

```jsx title="src/App.jsx"
import { Button, Box, Title, Notification } from '@allxsmith/bestax-bulma';
import { useState } from 'react';

function App() {
  const [showAlert, setShowAlert] = useState(false);

  return (
    <Box>
      <Title>Welcome to bestax-bulma!</Title>

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

## Run Your App

```bash
npm run dev
```

Visit http://localhost:5173 to see your app running.

---

## Next Steps

- [Installation Options](/docs/guides/getting-started/installation) -- Icon libraries, CDN, custom Bulma builds, and more
- [Extra Components](/docs/guides/getting-started/using-extras) -- Toast, Dialog, Slider, Switch, and other extras
- [Toolchains](/docs/guides/getting-started/react-setups) -- Next.js, TypeScript, and Create React App guides
- [Browse Components](/docs/category/elements) -- Full API docs and live examples
