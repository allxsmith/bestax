---
title: Toolchain Specific Setups
sidebar_label: Toolchains
sidebar_position: 3
---

# Toolchain Specific Setups

This guide provides detailed setup instructions for bestax-bulma across different **React frameworks** and **build tools**. Whether you're using modern tools like **Vite** or **Next.js**, or working with legacy setups, we've got you covered.

---

## ❤️ Vite + React + Bulma + bestax-bulma

Vite is a modern, fast build tool that's become the go-to choice for React applications. Here's how to set up bestax-bulma with Vite.

### JavaScript Example

1. **Create a new Vite React project:**

   ```bash
   npm create vite@latest my-bulma-app -- --template react
   cd my-bulma-app
   npm install
   ```

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   ```

3. **Update your main.jsx file:**

   ```jsx title="src/main.jsx"
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import App from './App.jsx';

   // Import Bulma CSS
   import 'bulma/css/bulma.min.css';
   // Import Font Awesome
   import '@fortawesome/fontawesome-free/css/all.min.css';

   ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>
   );
   ```

4. **Update your App.jsx:**

   ```jsx title="src/App.jsx"
   import React, { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     Subtitle,
     Icon,
     Notification,
     Columns,
     Column,
   } from '@allxsmith/bestax-bulma';

   function App() {
     const [showNotification, setShowNotification] = useState(false);

     return (
       <Box className="container" p="6">
         <Title size="1" className="has-text-centered">
           🚀 Vite + React + bestax-bulma
         </Title>

         <Subtitle size="4" className="has-text-centered has-text-grey">
           Modern React development with Bulma components
         </Subtitle>

         <Columns className="is-centered" mt="5">
           <Column size="half">
             <Box className="has-text-centered">
               <Button
                 color="primary"
                 size="large"
                 onClick={() => setShowNotification(!showNotification)}
               >
                 <Icon name="fas fa-magic" />
                 <span>Toggle Notification</span>
               </Button>

               {showNotification && (
                 <Notification color="success" mt="4">
                   <Icon name="fas fa-check-circle" />
                   <strong>Success!</strong> Your Vite + React + bestax-bulma
                   setup is working perfectly!
                 </Notification>
               )}
             </Box>
           </Column>
         </Columns>
       </Box>
     );
   }

   export default App;
   ```

### TypeScript Example

1. **Create a new Vite React TypeScript project:**

   ```bash
   npm create vite@latest my-bulma-app -- --template react-ts
   cd my-bulma-app
   npm install
   ```

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   npm install -D @types/react @types/react-dom
   ```

3. **Update your main.tsx file:**

   ```tsx title="src/main.tsx"
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import App from './App.tsx';

   // Import Bulma CSS
   import 'bulma/css/bulma.min.css';
   // Import Font Awesome
   import '@fortawesome/fontawesome-free/css/all.min.css';

   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>
   );
   ```

4. **Update your App.tsx:**

   ```tsx title="src/App.tsx"
   import React, { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     Subtitle,
     Icon,
     Notification,
     Columns,
     Column,
   } from '@allxsmith/bestax-bulma';

   const App: React.FC = () => {
     const [showNotification, setShowNotification] = useState<boolean>(false);

     return (
       <Box className="container" p="6">
         <Title size="1" className="has-text-centered">
           🚀 Vite + React + bestax-bulma
         </Title>

         <Subtitle size="4" className="has-text-centered has-text-grey">
           Modern TypeScript React development with Bulma components
         </Subtitle>

         <Columns className="is-centered" mt="5">
           <Column size="half">
             <Box className="has-text-centered">
               <Button
                 color="primary"
                 size="large"
                 onClick={() => setShowNotification(!showNotification)}
               >
                 <Icon name="fas fa-magic" />
                 <span>Toggle Notification</span>
               </Button>

               {showNotification && (
                 <Notification color="success" mt="4">
                   <Icon name="fas fa-check-circle" />
                   <strong>Success!</strong> Your Vite + React + bestax-bulma
                   TypeScript setup is working perfectly!
                 </Notification>
               )}
             </Box>
           </Column>
         </Columns>
       </Box>
     );
   };

   export default App;
   ```

---

## Next.js

Next.js is a popular React framework that provides server-side rendering, static site generation, and many other features out of the box.

### JavaScript Example (Next.js 13+ with App Router)

1. **Create a new Next.js project:**

   ```bash
   npx create-next-app@latest my-bulma-app
   cd my-bulma-app
   ```

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   ```

3. **Update your root layout:**

   ```jsx title="app/layout.js"
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

   ```jsx title="app/page.js"
   'use client';

   import React, { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     Subtitle,
     Icon,
     Notification,
     Container,
     Section,
   } from '@allxsmith/bestax-bulma';

   export default function Home() {
     const [showNotification, setShowNotification] = useState(false);

     return (
       <Section>
         <Container>
           <Box className="has-text-centered" p="6">
             <Title size="1">⚡ Next.js + bestax-bulma</Title>

             <Subtitle size="4" className="has-text-grey">
               Server-side rendering with Bulma components
             </Subtitle>

             <Button
               color="primary"
               size="large"
               mt="5"
               onClick={() => setShowNotification(!showNotification)}
             >
               <Icon name="fas fa-rocket" />
               <span>Launch App</span>
             </Button>

             {showNotification && (
               <Notification color="info" mt="4">
                 <Icon name="fas fa-info-circle" />
                 <strong>Great!</strong> Your Next.js + bestax-bulma setup is
                 working!
               </Notification>
             )}
           </Box>
         </Container>
       </Section>
     );
   }
   ```

### TypeScript Example (Next.js 13+ with App Router)

1. **Create a new Next.js TypeScript project:**

   ```bash
   npx create-next-app@latest my-bulma-app --typescript
   cd my-bulma-app
   ```

2. **Install bestax-bulma and dependencies:**

   ```bash
   npm install @allxsmith/bestax-bulma bulma @fortawesome/fontawesome-free
   ```

3. **Update your root layout:**

   ```tsx title="app/layout.tsx"
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

   ```tsx title="app/page.tsx"
   'use client';

   import React, { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     Subtitle,
     Icon,
     Notification,
     Container,
     Section,
   } from '@allxsmith/bestax-bulma';

   export default function Home(): JSX.Element {
     const [showNotification, setShowNotification] = useState<boolean>(false);

     return (
       <Section>
         <Container>
           <Box className="has-text-centered" p="6">
             <Title size="1">⚡ Next.js + bestax-bulma</Title>

             <Subtitle size="4" className="has-text-grey">
               Server-side rendering with TypeScript and Bulma components
             </Subtitle>

             <Button
               color="primary"
               size="large"
               mt="5"
               onClick={() => setShowNotification(!showNotification)}
             >
               <Icon name="fas fa-rocket" />
               <span>Launch App</span>
             </Button>

             {showNotification && (
               <Notification color="info" mt="4">
                 <Icon name="fas fa-info-circle" />
                 <strong>Great!</strong> Your Next.js TypeScript + bestax-bulma
                 setup is working!
               </Notification>
             )}
           </Box>
         </Container>
       </Section>
     );
   }
   ```

---

## CRA and Other Legacy Bundlers

For Create React App and other legacy bundlers like Webpack 4, the setup process is slightly different.

### JavaScript Example (Create React App)

1. **Create a new CRA project:**

   ```bash
   npx create-react-app my-bulma-app
   cd my-bulma-app
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
   ```

4. **Update your App.js:**

   ```jsx title="src/App.js"
   import React, { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     Subtitle,
     Icon,
     Notification,
     Container,
   } from '@allxsmith/bestax-bulma';

   function App() {
     const [count, setCount] = useState(0);

     return (
       <Container>
         <Box className="has-text-centered" p="6">
           <Title size="1">⚛️ Create React App + bestax-bulma</Title>

           <Subtitle size="4" className="has-text-grey">
             Classic React setup with Bulma components
           </Subtitle>

           <Box mt="5">
             <Title size="3">Count: {count}</Title>

             <div className="buttons is-centered">
               <Button color="success" onClick={() => setCount(count + 1)}>
                 <Icon name="fas fa-plus" />
                 <span>Increment</span>
               </Button>

               <Button color="danger" onClick={() => setCount(count - 1)}>
                 <Icon name="fas fa-minus" />
                 <span>Decrement</span>
               </Button>

               <Button color="warning" onClick={() => setCount(0)}>
                 <Icon name="fas fa-redo" />
                 <span>Reset</span>
               </Button>
             </div>
           </Box>

           {count >= 10 && (
             <Notification color="primary" mt="4">
               <Icon name="fas fa-trophy" />
               <strong>Achievement Unlocked!</strong> You've reached {count}{' '}
               clicks!
             </Notification>
           )}
         </Box>
       </Container>
     );
   }

   export default App;
   ```

### TypeScript Example (Create React App)

1. **Create a new CRA TypeScript project:**

   ```bash
   npx create-react-app my-bulma-app --template typescript
   cd my-bulma-app
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
   import React, { useState } from 'react';
   import {
     Box,
     Button,
     Title,
     Subtitle,
     Icon,
     Notification,
     Container,
   } from '@allxsmith/bestax-bulma';

   const App: React.FC = () => {
     const [count, setCount] = useState<number>(0);

     return (
       <Container>
         <Box className="has-text-centered" p="6">
           <Title size="1">⚛️ Create React App + bestax-bulma</Title>

           <Subtitle size="4" className="has-text-grey">
             Classic TypeScript React setup with Bulma components
           </Subtitle>

           <Box mt="5">
             <Title size="3">Count: {count}</Title>

             <div className="buttons is-centered">
               <Button color="success" onClick={() => setCount(count + 1)}>
                 <Icon name="fas fa-plus" />
                 <span>Increment</span>
               </Button>

               <Button color="danger" onClick={() => setCount(count - 1)}>
                 <Icon name="fas fa-minus" />
                 <span>Decrement</span>
               </Button>

               <Button color="warning" onClick={() => setCount(0)}>
                 <Icon name="fas fa-redo" />
                 <span>Reset</span>
               </Button>
             </div>
           </Box>

           {count >= 10 && (
             <Notification color="primary" mt="4">
               <Icon name="fas fa-trophy" />
               <strong>Achievement Unlocked!</strong> You've reached {count}{' '}
               clicks!
             </Notification>
           )}
         </Box>
       </Container>
     );
   };

   export default App;
   ```

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
