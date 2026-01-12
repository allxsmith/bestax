import { Meta, StoryObj } from '@storybook/react-vite';
import { Figure } from './Figure';

const meta: Meta<typeof Figure> = {
  title: 'Elements/Figure',
  component: Figure,
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
  },
};

export default meta;

type Story = StoryObj<typeof Figure>;

export const Default: Story = {
  render: () => (
    <Figure>
      <img src="/logo.png" alt="Placeholder" style={{ display: 'block' }} />
    </Figure>
  ),
};

export const WithCaption: Story = {
  render: () => (
    <Figure>
      <img src="/logo.png" alt="Placeholder" style={{ display: 'block' }} />
      <Figure.Caption>This is a caption for the image</Figure.Caption>
    </Figure>
  ),
  name: 'With Caption',
};

export const CaptionWithColor: Story = {
  render: () => (
    <Figure>
      <img src="/logo.png" alt="Placeholder" style={{ display: 'block' }} />
      <Figure.Caption textColor="grey">
        This is a grey colored caption
      </Figure.Caption>
    </Figure>
  ),
  name: 'Caption with Color',
};

export const WithBackground: Story = {
  render: () => (
    <Figure bgColor="light" textColor="dark" p="4">
      <img src="/logo.png" alt="Placeholder" style={{ display: 'block' }} />
      <Figure.Caption mt="2">Figure with background and padding</Figure.Caption>
    </Figure>
  ),
  name: 'With Background',
};

export const CenteredCaption: Story = {
  render: () => (
    <Figure textAlign="centered">
      <img
        src="/logo.png"
        alt="Placeholder"
        style={{ display: 'block', margin: '0 auto' }}
      />
      <Figure.Caption textSize="7" mt="2">
        Centered caption with smaller text
      </Figure.Caption>
    </Figure>
  ),
  name: 'Centered Caption',
};

export const MultipleFigures: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Figure>
        <img src="/logo.png" alt="First" style={{ display: 'block' }} />
        <Figure.Caption>First figure</Figure.Caption>
      </Figure>
      <Figure>
        <img src="/logo.png" alt="Second" style={{ display: 'block' }} />
        <Figure.Caption>Second figure</Figure.Caption>
      </Figure>
      <Figure>
        <img src="/logo.png" alt="Third" style={{ display: 'block' }} />
        <Figure.Caption>Third figure</Figure.Caption>
      </Figure>
    </div>
  ),
  name: 'Multiple Figures',
};

export const CodeFigure: Story = {
  render: () => (
    <Figure bgColor="dark" p="4">
      <pre style={{ color: 'white', margin: 0 }}>
        <code>{`function hello() {
  console.log("Hello, World!");
}`}</code>
      </pre>
      <Figure.Caption textColor="grey-light" mt="2">
        Example code snippet
      </Figure.Caption>
    </Figure>
  ),
  name: 'Code Figure',
};
