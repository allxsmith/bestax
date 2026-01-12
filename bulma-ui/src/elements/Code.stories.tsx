import { Meta, StoryObj } from '@storybook/react-vite';
import { Code } from './Code';
import { Paragraph } from './Paragraph';

const meta: Meta<typeof Code> = {
  title: 'Elements/Code',
  component: Code,
  parameters: {
    layout: 'centered',
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
    children: {
      control: 'text',
      description: 'Code content inside the element',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Code>;

export const Default: Story = {
  args: {
    children: 'console.log("Hello, World!")',
  },
};

export const VariableName: Story = {
  render: () => (
    <Paragraph>
      The <Code>userName</Code> variable stores the current user&apos;s name.
    </Paragraph>
  ),
  name: 'Variable Name',
};

export const FunctionCall: Story = {
  render: () => (
    <Paragraph>
      Use <Code>Array.map()</Code> to transform each element in the array.
    </Paragraph>
  ),
  name: 'Function Call',
};

export const CommandLine: Story = {
  render: () => (
    <Paragraph>
      Run <Code>npm install</Code> to install the dependencies.
    </Paragraph>
  ),
  name: 'Command Line',
};

export const WithPrimaryColor: Story = {
  args: {
    children: 'import React from "react"',
    textColor: 'primary',
  },
  name: 'Primary Color',
};

export const WithBackground: Story = {
  args: {
    children: 'const x = 42',
    bgColor: 'light',
    textColor: 'dark',
    p: '1',
  },
  name: 'With Background',
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Code textColor="primary">primary code</Code>
      <Code textColor="link">link code</Code>
      <Code textColor="info">info code</Code>
      <Code textColor="success">success code</Code>
      <Code textColor="warning">warning code</Code>
      <Code textColor="danger">danger code</Code>
    </div>
  ),
  name: 'All Colors',
};

export const FilePath: Story = {
  render: () => (
    <Paragraph>
      Edit the configuration file at <Code>src/config/settings.ts</Code> to
      change the default values.
    </Paragraph>
  ),
  name: 'File Path',
};

export const KeyboardShortcut: Story = {
  render: () => (
    <Paragraph>
      Press <Code>Ctrl + C</Code> to copy and <Code>Ctrl + V</Code> to paste.
    </Paragraph>
  ),
  name: 'Keyboard Shortcut',
};
