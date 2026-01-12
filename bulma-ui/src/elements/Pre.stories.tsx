import { Meta, StoryObj } from '@storybook/react-vite';
import { Pre } from './Pre';
import { Code } from './Code';

const meta: Meta<typeof Pre> = {
  title: 'Elements/Pre',
  component: Pre,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    textColor: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'light',
        'dark',
        'white',
        'inherit',
        'current',
      ],
      description: 'Text color using Bulma has-text-* classes',
    },
    bgColor: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'light',
        'dark',
        'inherit',
        'current',
      ],
      description: 'Background color using Bulma has-background-* classes',
    },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: 'Margin size using Bulma m-* classes',
    },
    p: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: 'Padding size using Bulma p-* classes',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Pre>;

export const Default: Story = {
  args: {
    children: `function hello() {
  console.log("Hello, World!");
}`,
  },
};

export const WithCodeElement: Story = {
  render: () => (
    <Pre>
      <Code>{`const greeting = "Hello";
const name = "World";
console.log(\`\${greeting}, \${name}!\`);`}</Code>
    </Pre>
  ),
  name: 'With Code Element',
};

export const DarkBackground: Story = {
  args: {
    children: `npm install @allxsmith/bestax-bulma
npm run build`,
    bgColor: 'dark',
    textColor: 'white',
    p: '4',
  },
  name: 'Dark Background',
};

export const LightBackground: Story = {
  args: {
    children: `{
  "name": "my-app",
  "version": "1.0.0"
}`,
    bgColor: 'light',
    p: '4',
  },
  name: 'Light Background',
};

export const PrimaryAccent: Story = {
  args: {
    children: `// Important note
const config = {
  debug: true,
  verbose: true
};`,
    textColor: 'primary',
    p: '3',
  },
  name: 'Primary Accent',
};

export const TerminalOutput: Story = {
  render: () => (
    <Pre bgColor="dark" textColor="success" p="4">
      {`$ npm run build
> @allxsmith/bestax-bulma@2.0.0 build
> tsc && vite build

vite v6.0.0 building for production...
✓ 123 modules transformed.
dist/index.js  45.23 kB
✓ built in 2.34s`}
    </Pre>
  ),
  name: 'Terminal Output',
};

export const MultipleCodeBlocks: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Pre bgColor="light" p="3">
        <Code>{`// JavaScript
const add = (a, b) => a + b;`}</Code>
      </Pre>
      <Pre bgColor="light" p="3">
        <Code>{`// TypeScript
const add = (a: number, b: number): number => a + b;`}</Code>
      </Pre>
    </div>
  ),
  name: 'Multiple Code Blocks',
};

export const AsciiArt: Story = {
  args: {
    children: `
    ____  __  ____    __  _______
   / __ )/ / / / /   /  |/  / __ \\
  / __  / / / / /   / /|_/ / /_/ /
 / /_/ / /_/ / /___/ /  / / __  /
/_____/\\____/_____/_/  /_/_/ /_/
`,
    textAlign: 'centered',
  },
  name: 'ASCII Art',
};
