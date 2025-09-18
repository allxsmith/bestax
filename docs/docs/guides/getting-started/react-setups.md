---
title: Toolchains
sidebar_label: Toolchains
sidebar_position: 3
---

# Toolchains

Complete integration guides for using bestax-bulma with popular React frameworks and build tools.

:::info Prerequisites
This guide assumes you've already installed bestax-bulma and understand the basics. If not, check out:

- [Quick Start](/docs/guides/intro) - 2-minute setup
- [Installation Guide](/docs/guides/getting-started/installation) - Package options, Bulma CSS, icons
  :::

Each framework has specific setup requirements and best practices. Choose your framework below for detailed instructions.

---

## ❤️ Vite + React + Bulma + bestax-bulma

Vite is a modern, fast build tool that's become the go-to choice for React applications. Here's how to set up bestax-bulma with Vite.

### JavaScript Example

1. **Create a new Vite React project:**

   ```bash
   npm create vite@latest my-bulma-vite-app -- --template react
   cd my-bulma-vite-app
   npm install
   ```

   :::info Template Argument Explained
   - `--template react`: Uses the official React template with JavaScript
   - Alternative templates: `react-ts` (TypeScript), `react-swc` (with SWC compiler)
   - The `--` separates npm arguments from Vite create arguments
     :::

   :::tip Vite Documentation
   For more details about `npm create vite` and available templates, see the [official Vite documentation](https://vitejs.dev/guide/#scaffolding-your-first-vite-project).
   :::

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   ```

3. **Update your main.jsx file:**

   ```jsx title="src/main.jsx"
   import { StrictMode } from 'react';
   import { createRoot } from 'react-dom/client';
   import App from './App.jsx';

   // Import Bulma CSS
   import 'bulma/css/bulma.min.css';
   // Import Font Awesome
   import '@fortawesome/fontawesome-free/css/all.min.css';
   import './index.css';

   createRoot(document.getElementById('root')).render(
     <StrictMode>
       <App />
     </StrictMode>
   );
   ```

4. **Update your App.jsx:**

   ```jsx title="src/App.jsx"
   import { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     SubTitle,
     Icon,
     Notification,
     Columns,
     Column,
     Container,
     Section,
   } from '@allxsmith/bestax-bulma';
   import './App.css';

   function App() {
     const [showNotification, setShowNotification] = useState(false);

     return (
       <Container>
         <Section>
           <Box textAlign="centered">
             <Title size="1" textAlign="centered">
               🚀 Vite + React + bestax-bulma
             </Title>

             <SubTitle size="4" textAlign="centered" color="grey">
               Modern React development with Bulma components
             </SubTitle>

             <Columns isCentered mt="5">
               <Column size="half">
                 <Button
                   color="primary"
                   size="large"
                   onClick={() => setShowNotification(!showNotification)}
                 >
                   <Icon name="magic" />
                   <span>Toggle Notification</span>
                 </Button>

                 {showNotification && (
                   <Notification color="success" mt="4">
                     <Icon name="check-circle" />
                     <strong>Success!</strong> Your Vite + React + bestax-bulma
                     setup is working perfectly!
                   </Notification>
                 )}
               </Column>
             </Columns>
           </Box>
         </Section>
       </Container>
     );
   }

   export default App;
   ```

5. **Run your application:**

   ```bash
   npm run dev
   ```

   :::tip Application Available
   Your Vite + React + bestax-bulma application will be available at `http://localhost:5173`
   :::

### TypeScript Example

1. **Create a new Vite React TypeScript project:**

   ```bash
   npm create vite@latest my-bulma-vite-ts-app -- --template react-ts
   cd my-bulma-vite-ts-app
   npm install
   ```

   :::info Template Argument Explained
   - `--template react-ts`: Uses the official React template with TypeScript
   - Includes TypeScript configuration and type definitions out of the box
   - Alternative: `react-swc-ts` (TypeScript with SWC compiler for faster builds)
     :::

   :::tip Vite Documentation
   For more details about `npm create vite` and available templates, see the [official Vite documentation](https://vitejs.dev/guide/#scaffolding-your-first-vite-project).
   :::

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   npm install -D @types/react @types/react-dom
   ```

3. **Update your main.tsx file:**

   ```tsx title="src/main.tsx"
   import { StrictMode } from 'react';
   import { createRoot } from 'react-dom/client';
   import App from './App.tsx';

   // Import Bulma CSS
   import 'bulma/css/bulma.min.css';
   // Import Font Awesome
   import '@fortawesome/fontawesome-free/css/all.min.css';
   import './index.css';

   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <App />
     </StrictMode>
   );
   ```

4. **Update your App.tsx:**

   ```tsx title="src/App.tsx"
   import { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     SubTitle,
     Icon,
     Notification,
     Columns,
     Column,
     Container,
     Section,
   } from '@allxsmith/bestax-bulma';
   import './App.css';

   function App() {
     const [showNotification, setShowNotification] = useState<boolean>(false);

     return (
       <Container>
         <Section>
           <Box textAlign="centered">
             <Title size="1" textAlign="centered">
               🚀 Vite + React + bestax-bulma
             </Title>

             <SubTitle size="4" textAlign="centered" color="grey">
               Modern TypeScript React development with Bulma components
             </SubTitle>

             <Columns isCentered mt="5">
               <Column size="half">
                 <Button
                   color="primary"
                   size="large"
                   onClick={() => setShowNotification(!showNotification)}
                 >
                   <Icon name="magic" />
                   <span>Toggle Notification</span>
                 </Button>

                 {showNotification && (
                   <Notification color="success" mt="4">
                     <Icon name="check-circle" />
                     <strong>Success!</strong> Your Vite + React + bestax-bulma
                     TypeScript setup is working perfectly!
                   </Notification>
                 )}
               </Column>
             </Columns>
           </Box>
         </Section>
       </Container>
     );
   }

   export default App;
   ```

5. **Run your application:**

   ```bash
   npm run dev
   ```

   :::tip Application Available
   Your Vite + React + TypeScript + bestax-bulma application will be available at `http://localhost:5173`
   :::

---

## Next.js

Next.js is a popular React framework that provides server-side rendering, static site generation, and many other features out of the box.

### JavaScript Example (Next.js 13+ with App Router)

1. **Create a new Next.js project:**

   ```bash
   npx create-next-app@latest my-bulma-next-app --js --eslint --no-tailwind --src-dir --app --import-alias "@/*" --turbopack
   cd my-bulma-next-app
   ```

   :::info Command Arguments Explained
   - `--js`: Use JavaScript (not TypeScript)
   - `--eslint`: Include ESLint for code quality
   - `--no-tailwind`: Skip Tailwind CSS (we're using Bulma!)
   - `--src-dir`: Create a `src/` directory for better organization
   - `--app`: Use App Router (recommended for Next.js 13+)
   - `--import-alias "@/*"`: Set up path alias for cleaner imports
   - `--turbopack`: Use Turbopack (experimental, faster development)
     :::

   :::tip Next.js Documentation
   For more details about `create-next-app` options, see the [official Next.js documentation](https://nextjs.org/docs/app/api-reference/create-next-app).
   :::

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   ```

3. **Update your root layout:**

   ```jsx title="src/app/layout.js"
   // Import Bulma CSS globally
   import 'bulma/css/bulma.min.css';
   import '@fortawesome/fontawesome-free/css/all.min.css';

   export const metadata = {
     title: 'Next.js + bestax-bulma',
     description: 'Next.js application with Bulma components',
   };

   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>{children}</body>
       </html>
     );
   }
   ```

4. **Update your main page:**

   ```jsx title="src/app/page.js"
   'use client';

   import { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     SubTitle,
     Icon,
     Notification,
     Columns,
     Column,
     Container,
     Section,
   } from '@allxsmith/bestax-bulma';
   // Uncomment if you want to use CSS modules within this page
   // Note: this page.modules.css has some styles you should review since
   //       they may not pertain to our example
   // import styles from "./page.module.css";

   export default function Home() {
     const [showNotification, setShowNotification] = useState(false);

     return (
       <Container>
         <Section>
           <Box textAlign="centered">
             <Title size="1" textAlign="centered">
               🚀 Next.js + React + bestax-bulma
             </Title>

             <SubTitle size="4" textAlign="centered" color="grey">
               Server-side rendering with Bulma components
             </SubTitle>

             <Columns isCentered mt="5">
               <Column size="half">
                 <Button
                   color="primary"
                   size="large"
                   onClick={() => setShowNotification(!showNotification)}
                 >
                   <Icon name="magic" />
                   <span>Toggle Notification</span>
                 </Button>

                 {showNotification && (
                   <Notification color="success" mt="4">
                     <Icon name="check-circle" />
                     <strong>Success!</strong> Your Next.js + React +
                     bestax-bulma setup is working perfectly!
                   </Notification>
                 )}
               </Column>
             </Columns>
           </Box>
         </Section>
       </Container>
     );
   }
   ```

5. **Run your application:**

   ```bash
   npm run dev
   ```

   :::tip Application Available
   Your Next.js + React + bestax-bulma application will be available at `http://localhost:3000`
   :::

### TypeScript Example (Next.js 13+ with App Router)

1. **Create a new Next.js TypeScript project:**

   ```bash
   npx create-next-app@latest my-bulma-next-ts-app --ts --eslint --no-tailwind --src-dir --app --import-alias "@/*" --turbopack
   cd my-bulma-next-ts-app
   ```

   :::info Command Arguments Explained
   - `--ts`: Use TypeScript (not JavaScript)
   - `--eslint`: Include ESLint for code quality
   - `--no-tailwind`: Skip Tailwind CSS (we're using Bulma!)
   - `--src-dir`: Create a `src/` directory for better organization
   - `--app`: Use App Router (recommended for Next.js 13+)
   - `--import-alias "@/*"`: Set up path alias for cleaner imports
   - `--turbopack`: Use Turbopack (experimental, faster development)
     :::

   :::tip Next.js Documentation
   For more details about `create-next-app` options, see the [official Next.js documentation](https://nextjs.org/docs/app/api-reference/create-next-app).
   :::

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   ```

3. **Update your root layout:**

   ```tsx title="src/app/layout.tsx"
   import type { Metadata } from 'next';

   // Import Bulma CSS globally
   import 'bulma/css/bulma.min.css';
   import '@fortawesome/fontawesome-free/css/all.min.css';

   export const metadata: Metadata = {
     title: 'Next.js + bestax-bulma',
     description: 'Next.js TypeScript application with Bulma components',
   };

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html lang="en">
         <body>{children}</body>
       </html>
     );
   }
   ```

4. **Update your main page:**

   ```tsx title="src/app/page.tsx"
   'use client';

   import { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     SubTitle,
     Icon,
     Notification,
     Columns,
     Column,
     Container,
     Section,
   } from '@allxsmith/bestax-bulma';
   // Uncomment if you want to use CSS modules within this page
   // Note: this page.modules.css has some styles you should review since
   //       they may not pertain to our example
   // import styles from "./page.module.css";
   export default function Home(): JSX.Element {
     const [showNotification, setShowNotification] = useState<boolean>(false);

     return (
       <Container>
         <Section>
           <Box textAlign="centered">
             <Title size="1" textAlign="centered">
               🚀 Next.js + React + bestax-bulma
             </Title>

             <SubTitle size="4" textAlign="centered" color="grey">
               Server-side rendering with TypeScript and Bulma components
             </SubTitle>

             <Columns isCentered mt="5">
               <Column size="half">
                 <Button
                   color="primary"
                   size="large"
                   onClick={() => setShowNotification(!showNotification)}
                 >
                   <Icon name="magic" />
                   <span>Toggle Notification</span>
                 </Button>

                 {showNotification && (
                   <Notification color="success" mt="4">
                     <Icon name="check-circle" />
                     <strong>Success!</strong> Your Next.js TypeScript +
                     bestax-bulma setup is working perfectly!
                   </Notification>
                 )}
               </Column>
             </Columns>
           </Box>
         </Section>
       </Container>
     );
   }
   ```

5. **Run your application:**

   ```bash
   npm run dev
   ```

   :::tip Application Available
   Your Next.js + TypeScript + bestax-bulma application will be available at `http://localhost:3000`
   :::

---

## CRA and Other Legacy Bundlers

For Create React App and other legacy bundlers like Webpack 4, the setup process is slightly different.

### JavaScript Example (Create React App)

1. **Create a new CRA project:**

   ```bash
   npx create-react-app my-bulma-cra-app
   cd my-bulma-cra-app
   ```

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   ```

3. **Update your index.js:**

   ```jsx title="src/index.js"
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import App from './App';
   import reportWebVitals from './reportWebVitals';

   // Import Bulma CSS
   import 'bulma/css/bulma.min.css';
   // Import Font Awesome
   import '@fortawesome/fontawesome-free/css/all.min.css';
   // Import default CRA styles last
   import './index.css';

   const root = ReactDOM.createRoot(document.getElementById('root'));
   root.render(
     <React.StrictMode>
       <App />
     </React.StrictMode>
   );

   // If you want to start measuring performance in your app, pass a function
   // to log results (for example: reportWebVitals(console.log))
   // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
   reportWebVitals();
   ```

4. **Update your App.js:**

   ```jsx title="src/App.js"
   import { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     SubTitle,
     Icon,
     Notification,
     Columns,
     Column,
     Container,
     Section,
   } from '@allxsmith/bestax-bulma';

   function App() {
     const [showNotification, setShowNotification] = useState(false);

     return (
       <Container>
         <Section>
           <Box textAlign="centered">
             <Title size="1" textAlign="centered">
               🚀 Create React App + bestax-bulma
             </Title>

             <SubTitle size="4" textAlign="centered" color="grey">
               Client-side rendering with JavaScript and Bulma components
             </SubTitle>

             <Columns isCentered mt="5">
               <Column size="half">
                 <Button
                   color="primary"
                   size="large"
                   onClick={() => setShowNotification(!showNotification)}
                 >
                   <Icon name="magic" />
                   <span>Toggle Notification</span>
                 </Button>

                 {showNotification && (
                   <Notification color="success" mt="4">
                     <Icon name="check-circle" />
                     <strong>Success!</strong> Your Create React App +
                     bestax-bulma setup is working perfectly!
                   </Notification>
                 )}
               </Column>
             </Columns>
           </Box>
         </Section>
       </Container>
     );
   }

   export default App;
   ```

5. **Run your application:**

   ```bash
   npm start
   ```

   :::tip Application Available
   Your Create React App + bestax-bulma application will be available at `http://localhost:3000`
   :::

### TypeScript Example (Create React App)

1. **Create a new CRA TypeScript project:**

   ```bash
   npx create-react-app my-bulma-cra-ts-app --template typescript
   cd my-bulma-cra-ts-app
   ```

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   ```

3. **Update your index.tsx:**

   ```tsx title="src/index.tsx"
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import App from './App';
   import reportWebVitals from './reportWebVitals';

   // Import Bulma CSS
   import 'bulma/css/bulma.min.css';
   // Import Font Awesome
   import '@fortawesome/fontawesome-free/css/all.min.css';
   // Import default CRA styles last
   import './index.css';

   const root = ReactDOM.createRoot(
     document.getElementById('root') as HTMLElement
   );
   root.render(
     <React.StrictMode>
       <App />
     </React.StrictMode>
   );

   // If you want to start measuring performance in your app, pass a function
   // to log results (for example: reportWebVitals(console.log))
   // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
   reportWebVitals();
   ```

4. **Update your App.tsx:**

   ```tsx title="src/App.tsx"
   import { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     SubTitle,
     Icon,
     Notification,
     Columns,
     Column,
     Container,
     Section,
   } from '@allxsmith/bestax-bulma';

   const App: React.FC = () => {
     const [showNotification, setShowNotification] = useState<boolean>(false);

     return (
       <Container>
         <Section>
           <Box textAlign="centered">
             <Title size="1" textAlign="centered">
               🚀 Create React App + bestax-bulma
             </Title>

             <SubTitle size="4" textAlign="centered" color="grey">
               Client-side rendering with TypeScript and Bulma components
             </SubTitle>

             <Columns isCentered mt="5">
               <Column size="half">
                 <Button
                   color="primary"
                   size="large"
                   onClick={() => setShowNotification(!showNotification)}
                 >
                   <Icon name="magic" />
                   <span>Toggle Notification</span>
                 </Button>

                 {showNotification && (
                   <Notification color="success" mt="4">
                     <Icon name="check-circle" />
                     <strong>Success!</strong> Your Create React App TypeScript
                     + bestax-bulma setup is working perfectly!
                   </Notification>
                 )}
               </Column>
             </Columns>
           </Box>
         </Section>
       </Container>
     );
   };

   export default App;
   ```

5. **Run your application:**

   ```bash
   npm start
   ```

   Your Create React App + TypeScript + bestax-bulma application will be available at `http://localhost:3000`

---

````

### TypeScript Example (Create React App)

1. **Create a new CRA TypeScript project:**

```bash
npx create-react-app my-bulma-cra-ts-app --template typescript
cd my-bulma-cra-ts-app
````

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   ```

3. **Update your index.tsx:**

   ```tsx title="src/index.tsx"
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import App from './App';

   // Import Bulma CSS
   import 'bulma/css/bulma.min.css';
   // Import Font Awesome
   import '@fortawesome/fontawesome-free/css/all.min.css';
   // Import default CRA styles last
   import './index.css';

   const root = ReactDOM.createRoot(
     document.getElementById('root') as HTMLElement
   );
   root.render(
     <React.StrictMode>
       <App />
     </React.StrictMode>
   );
   ```

4. **Update your App.tsx:**

   ```tsx title="src/App.tsx"
   import { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     SubTitle,
     Icon,
     Notification,
     Columns,
     Column,
   } from '@allxsmith/bestax-bulma';

   const App: React.FC = () => {
     const [showNotification, setShowNotification] = useState<boolean>(false);

     return (
       <Box textAlign="centered">
         <Title size="1" textAlign="centered">
           🚀 Create React App + bestax-bulma
         </Title>

         <SubTitle size="4" textAlign="centered" color="grey">
           Client-side rendering with TypeScript and Bulma components
         </SubTitle>

         <Columns isCentered mt="5">
           <Column size="half">
             <Button
               color="primary"
               size="large"
               onClick={() => setShowNotification(!showNotification)}
             >
               <Icon name="magic" />
               <span>Toggle Notification</span>
             </Button>

             {showNotification && (
               <Notification color="success" mt="4">
                 <Icon name="check-circle" />
                 <strong>Success!</strong> Your Create React App TypeScript +
                 bestax-bulma setup is working perfectly!
               </Notification>
             )}
           </Column>
         </Columns>
       </Box>
     );
   };

   export default App;
   ```

5. **Run your application:**

   ```bash
   npm start
   ```

   :::tip Application Available
   Your Create React App + TypeScript + bestax-bulma application will be available at `http://localhost:3000`
   :::

---

## SSR (Server-Side Rendering)

bestax-bulma is designed to work seamlessly with SSR frameworks. Here are some important considerations:

### General SSR Guidelines

1. **CSS Import Strategy**: Always import Bulma CSS at the application level (not component level) to ensure consistent styling during hydration.

2. **Hydration Compatibility**: All bestax-bulma components are designed to render identically on server and client, preventing hydration mismatches.

3. **No Browser Dependencies**: bestax-bulma components don't rely on browser-specific APIs during initial render, making them SSR-safe.

### Next.js Specific

```tsx
// ✅ Good: Import CSS in layout.tsx (App Router) or _app.tsx (Pages Router)
import 'bulma/css/bulma.min.css';

// ❌ Avoid: Importing CSS in individual components
// This can cause CSS to load after component render
```

### Remix

```tsx title="app/root.tsx"
import type { LinksFunction } from '@remix-run/node';
import bulmaStyles from 'bulma/css/bulma.min.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: bulmaStyles },
];
```

### Gatsby

```tsx title="gatsby-browser.js"
import 'bulma/css/bulma.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
```

---

## Troubleshooting

### Syntax Errors

**Problem**: TypeScript errors when using bestax-bulma components.

**Solution**: Ensure you have the latest TypeScript version and proper type declarations:

```bash
npm install -D typescript @types/react @types/react-dom
```

### Tree Shaking Issues

**Problem**: Large bundle size when importing bestax-bulma.

**Solution**: Use named imports instead of default imports:

```tsx
// ✅ Good: Named imports (tree-shakeable)
import { Button, Box, Title } from '@allxsmith/bestax-bulma';

// ❌ Avoid: Default import (includes entire library)
import BestaxBulma from '@allxsmith/bestax-bulma';
```

### Responsiveness Issues

**Problem**: Components don't respond properly on mobile devices.

**Solution**: Ensure the viewport meta tag is present in your HTML:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### CSS Loading Order

**Problem**: Bulma styles are overridden by other CSS.

**Solution**: Import Bulma CSS before your custom styles:

```tsx
// ✅ Correct order
import 'bulma/css/bulma.min.css'; // First
import './custom-styles.css'; // After Bulma
```

### Migration from Other Libraries

**Problem**: Migrating from react-bulma or other Bulma React libraries.

**Solution**: bestax-bulma uses similar prop names but with modern React patterns:

```tsx
// Old library
<Button isColor="primary" isSize="large" />

// bestax-bulma
<Button color="primary" size="large" />
```

### Performance Optimization

For production builds, consider:

1. **Bundle Analysis**: Use tools like `webpack-bundle-analyzer` to identify large dependencies
2. **CSS Purging**: Use PurgeCSS to remove unused Bulma styles
3. **Component Lazy Loading**: Load heavy components dynamically

```tsx
// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

---

## Next Steps

- **Explore Components**: Browse the [API documentation](/docs/category/elements) to see all available components
- **Learn Configuration**: Read about [ConfigProvider](/docs/api/helpers/config) for global settings
- **Customize with Theming**: Discover [Theme](/docs/api/helpers/theme) for advanced customization
- **Check Examples**: Visit our [Storybook](https://bestax.cc/storybook) for live component examples
