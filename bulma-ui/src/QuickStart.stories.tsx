import { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './elements/Button';
import { Box } from './elements/Box';
import { Title } from './elements/Title';
import { Notification } from './elements/Notification';
import { useState } from 'react';

const meta: Meta = {
  title: 'Quick Start/Getting Started',
  parameters: {
    docs: {
      description: {
        component: `
# Welcome to Bestax Bulma! 🎉

**Bestax Bulma** is a comprehensive React component library built on Bulma CSS v1, providing 60+ fully-typed, accessible components for building modern web applications.

---

## 🚀 Quick Start

Get started with bestax-bulma in just a few steps:

1. **Install the package**
   - \`npm install @allxsmith/bestax-bulma bulma\`

2. **Import Bulma CSS**
   - Add \`import 'bulma/css/bulma.min.css'\` to your app

3. **Start using components**
   - Import and use components like \`Button\`, \`Box\`, \`Modal\`, etc.

### 📖 Complete Setup Guide
For detailed installation instructions, framework integrations, and configuration options, visit:

**→ [bestax.io/docs/guides/getting-started/installation](https://bestax.io/docs/guides/getting-started/installation)**

---

## 📚 Documentation & Resources

### Full Documentation
Visit **[bestax.io](https://bestax.io)** for:
- Complete API documentation
- Installation & setup guides
- Framework-specific tutorials (Next.js, Vite, CRA)
- Live interactive examples
- TypeScript configurations

### Component Categories
- **[Elements](https://bestax.io/docs/category/elements)** - Basic building blocks (Button, Box, Title, Tag, etc.)
- **[Components](https://bestax.io/docs/category/components)** - Advanced UI (Modal, Navbar, Card, Dropdown, etc.)
- **[Form](https://bestax.io/docs/category/form)** - Form controls (Input, Select, Checkbox, Field, etc.)
- **[Layout](https://bestax.io/docs/category/layout)** - Structure (Container, Section, Hero, Level, etc.)
- **[Grid & Columns](https://bestax.io/docs/category/grid)** - Responsive layouts
- **[Helpers](https://bestax.io/docs/category/helpers)** - Utilities (Theme, Config, useBulmaClasses)

---

## ✨ Why Bestax Bulma?

- ✅ **Latest Bulma v1** - Full support for newest features
- ✅ **TypeScript Ready** - Complete type definitions
- ✅ **Tree Shakeable** - Import only what you need
- ✅ **99% Test Coverage** - Reliable and stable
- ✅ **Zero Dependencies** - Just React and Bulma CSS
- ✅ **Accessible** - Built with a11y best practices

---

## 🔗 Links

- 📚 **[Documentation](https://bestax.io)** - Full docs and guides
- 💬 **[GitHub](https://github.com/allxsmith/bestax)** - Source code and issues
- 📦 **[NPM](https://www.npmjs.com/package/@allxsmith/bestax-bulma)** - Package info

---

> **Note:** This Storybook provides an interactive component explorer. For complete documentation, tutorials, and guides, please visit **[bestax.io](https://bestax.io)**.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

// Interactive Demo
function DemoApp() {
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

export const InteractiveDemo: Story = {
  render: () => <DemoApp />,
  name: 'Interactive Demo',
};
