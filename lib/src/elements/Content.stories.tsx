import { Meta, StoryObj } from '@storybook/react';
import { Content } from './Content'; // Adjust the import path based on your project structure

// Meta configuration for the Content component
const meta: Meta<typeof Content> = {
  title: 'Components/Content',
  component: Content,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    textColor: {
      control: 'select',
      options: [
        'primary',
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
    size: {
      control: 'select',
      options: ['small', 'normal', 'medium', 'large'],
      description:
        'Content size using Bulma is-small, is-medium, is-large classes',
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
    textAlign: {
      control: 'select',
      options: ['centered', 'justified', 'left', 'right'],
      description: 'Text alignment using Bulma has-text-* classes',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class',
    },
    children: {
      control: 'text',
      description: 'Content inside the block (typically HTML elements)',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Content>;

// Default story
export const Default: Story = {
  args: {
    children: 'Default Content',
  },
};

// Content with primary text color
export const PrimaryText: Story = {
  args: {
    children: 'Content with Primary Text',
    textColor: 'primary',
  },
};

// Content with light background
export const LightBackground: Story = {
  args: {
    children: 'Content with Light Background',
    bgColor: 'light',
  },
};

// Content with medium size
export const MediumSize: Story = {
  args: {
    children: 'Content with Medium Size',
    size: 'medium',
  },
};

// Content with spacing and alignment
export const SpacedAndAligned: Story = {
  args: {
    children: 'Content with Margin, Padding, and Centered Text',
    m: '4',
    p: '4',
    textAlign: 'centered',
  },
};

// Content with custom class
export const CustomClass: Story = {
  args: {
    children: 'Content with Custom Class',
    className: 'custom-content-class',
  },
};

// Content with viewport-specific text color
export const ViewportSpecific: Story = {
  args: {
    children: 'Content with Tablet-specific Primary Text',
    textColor: 'primary',
    viewport: 'tablet',
  },
};

// Interactive content with multiple props
export const Interactive: Story = {
  args: {
    children: 'Interactive Content',
    textColor: 'success',
    bgColor: 'dark',
    size: 'large',
    m: '3',
    p: '3',
    textAlign: 'right',
  },
};

// Content with typographic elements
export const TypographicContent: Story = {
  args: {
    textColor: 'info',
    p: '3',
  },
  render: args => (
    <Content {...args}>
      <h1>Heading 1</h1>
      <p>This is a paragraph styled by Bulma’s content class.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
      <blockquote>This is a blockquote styled by Bulma.</blockquote>
      <h2>Heading 2</h2>
      <p>
        Another paragraph with <strong>bold</strong> and <em>italic</em> text.
      </p>
    </Content>
  ),
};

// New Story: Rich Content with All HTML Tags (Small Size)
export const RichContentSmall: Story = {
  args: {
    size: 'small',
    textColor: 'primary',
    p: '3',
  },
  render: args => (
    <Content {...args}>
      <h1>Lorem Ipsum Heading</h1>
      <p>
        Lorem ipsum dolor sit amet, <strong>consectetur adipiscing</strong>{' '}
        elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <h2>Subheading</h2>
      <p>
        Ut enim ad minim veniam, quis <em>nostrud exercitation</em> ullamco
        laboris nisi ut aliquip ex ea commodo consequat.
      </p>
      <ul>
        <li>Lorem ipsum dolor sit amet</li>
        <li>Consectetur adipiscing elit</li>
        <li>Sed do eiusmod tempor</li>
      </ul>
      <ol>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
      </ol>
      <dl>
        <dt>Term 1</dt>
        <dd>Description for term 1.</dd>
        <dt>Term 2</dt>
        <dd>Description for term 2.</dd>
      </dl>
      <h3>Another Heading</h3>
      <blockquote>
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur.
      </blockquote>
      <h4>Heading Level 4</h4>
      <h5>Heading Level 5</h5>
      <h6>Heading Level 6</h6>
      <table>
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
            <th>Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Row 1, Cell 1</td>
            <td>Row 1, Cell 2</td>
            <td>Row 1, Cell 3</td>
          </tr>
          <tr>
            <td>Row 2, Cell 1</td>
            <td>Row 2, Cell 2</td>
            <td>Row 2, Cell 3</td>
          </tr>
        </tbody>
      </table>
    </Content>
  ),
};

// New Story: Rich Content with All HTML Tags (Normal Size)
export const RichContentNormal: Story = {
  args: {
    size: 'normal',
    textColor: 'info',
    p: '3',
  },
  render: args => (
    <Content {...args}>
      <h1>Lorem Ipsum Heading</h1>
      <p>
        Lorem ipsum dolor sit amet, <strong>consectetur adipiscing</strong>{' '}
        elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <h2>Subheading</h2>
      <p>
        Ut enim ad minim veniam, quis <em>nostrud exercitation</em> ullamco
        laboris nisi ut aliquip ex ea commodo consequat.
      </p>
      <ul>
        <li>Lorem ipsum dolor sit amet</li>
        <li>Consectetur adipiscing elit</li>
        <li>Sed do eiusmod tempor</li>
      </ul>
      <ol>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
      </ol>
      <dl>
        <dt>Term 1</dt>
        <dd>Description for term 1.</dd>
        <dt>Term 2</dt>
        <dd>Description for term 2.</dd>
      </dl>
      <h3>Another Heading</h3>
      <blockquote>
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur.
      </blockquote>
      <h4>Heading Level 4</h4>
      <h5>Heading Level 5</h5>
      <h6>Heading Level 6</h6>
      <table>
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
            <th>Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Row 1, Cell 1</td>
            <td>Row 1, Cell 2</td>
            <td>Row 1, Cell 3</td>
          </tr>
          <tr>
            <td>Row 2, Cell 1</td>
            <td>Row 2, Cell 2</td>
            <td>Row 2, Cell 3</td>
          </tr>
        </tbody>
      </table>
    </Content>
  ),
};

// New Story: Rich Content with All HTML Tags (Medium Size)
export const RichContentMedium: Story = {
  args: {
    size: 'medium',
    textColor: 'success',
    p: '3',
  },
  render: args => (
    <Content {...args}>
      <h1>Lorem Ipsum Heading</h1>
      <p>
        Lorem ipsum dolor sit amet, <strong>consectetur adipiscing</strong>{' '}
        elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <h2>Subheading</h2>
      <p>
        Ut enim ad minim veniam, quis <em>nostrud exercitation</em> ullamco
        laboris nisi ut aliquip ex ea commodo consequat.
      </p>
      <ul>
        <li>Lorem ipsum dolor sit amet</li>
        <li>Consectetur adipiscing elit</li>
        <li>Sed do eiusmod tempor</li>
      </ul>
      <ol>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
      </ol>
      <dl>
        <dt>Term 1</dt>
        <dd>Description for term 1.</dd>
        <dt>Term 2</dt>
        <dd>Description for term 2.</dd>
      </dl>
      <h3>Another Heading</h3>
      <blockquote>
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur.
      </blockquote>
      <h4>Heading Level 4</h4>
      <h5>Heading Level 5</h5>
      <h6>Heading Level 6</h6>
      <table>
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
            <th>Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Row 1, Cell 1</td>
            <td>Row 1, Cell 2</td>
            <td>Row 1, Cell 3</td>
          </tr>
          <tr>
            <td>Row 2, Cell 1</td>
            <td>Row 2, Cell 2</td>
            <td>Row 2, Cell 3</td>
          </tr>
        </tbody>
      </table>
    </Content>
  ),
};

// New Story: Rich Content with All HTML Tags (Large Size)
export const RichContentLarge: Story = {
  args: {
    size: 'large',
    textColor: 'warning',
    p: '3',
  },
  render: args => (
    <Content {...args}>
      <h1>Lorem Ipsum Heading</h1>
      <p>
        Lorem ipsum dolor sit amet, <strong>consectetur adipiscing</strong>{' '}
        elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <h2>Subheading</h2>
      <p>
        Ut enim ad minim veniam, quis <em>nostrud exercitation</em> ullamco
        laboris nisi ut aliquip ex ea commodo consequat.
      </p>
      <ul>
        <li>Lorem ipsum dolor sit amet</li>
        <li>Consectetur adipiscing elit</li>
        <li>Sed do eiusmod tempor</li>
      </ul>
      <ol>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
      </ol>
      <dl>
        <dt>Term 1</dt>
        <dd>Description for term 1.</dd>
        <dt>Term 2</dt>
        <dd>Description for term 2.</dd>
      </dl>
      <h3>Another Heading</h3>
      <blockquote>
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur.
      </blockquote>
      <h4>Heading Level 4</h4>
      <h5>Heading Level 5</h5>
      <h6>Heading Level 6</h6>
      <table>
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
            <th>Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Row 1, Cell 1</td>
            <td>Row 1, Cell 2</td>
            <td>Row 1, Cell 3</td>
          </tr>
          <tr>
            <td>Row 2, Cell 1</td>
            <td>Row 2, Cell 2</td>
            <td>Row 2, Cell 3</td>
          </tr>
        </tbody>
      </table>
    </Content>
  ),
};
