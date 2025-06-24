import { Meta, StoryObj } from '@storybook/react';
import File from './File';
import { Icon } from '../elements/Icon';

const meta: Meta<typeof File> = {
  title: 'Form/File',
  component: File,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof File>;

export const Default: Story = {
  render: () => (
    <File label="Choose a file..." iconLeft={<Icon name="upload" />} />
  ),
};

export const ModifiersHasNameWithFileName: Story = {
  render: () => (
    <File
      hasName
      fileName="resume.pdf"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const ModifiersHasRight: Story = {
  render: () => (
    <File
      hasName
      isRight
      fileName="contract.pdf"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const ModifiersFullWidth: Story = {
  render: () => (
    <File
      hasName
      isFullwidth
      fileName="picture.png"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const ModifiersBoxedBlock: Story = {
  render: () => (
    <File isBoxed label="Choose a file..." iconLeft={<Icon name="upload" />} />
  ),
};

export const ModifiersHasNameAndBoxedBlock: Story = {
  render: () => (
    <File
      isBoxed
      hasName
      fileName="holiday.jpg"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

// Colors
export const ColorsPrimary: Story = {
  render: () => (
    <File
      color="primary"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const ColorsInfo: Story = {
  render: () => (
    <File
      color="info"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const ColorsWarning: Story = {
  render: () => (
    <File
      color="warning"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const ColorsDanger: Story = {
  render: () => (
    <File
      color="danger"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

// Sizes
export const SizesSmall: Story = {
  render: () => (
    <File
      size="small"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesNormal: Story = {
  render: () => (
    <File label="Choose a file..." iconLeft={<Icon name="upload" />} />
  ),
  parameters: {
    docs: {
      description: {
        story: 'This is the default size.',
      },
    },
  },
};

export const SizesMedium: Story = {
  render: () => (
    <File
      size="medium"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesLarge: Story = {
  render: () => (
    <File
      size="large"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

// Sizes with Name
export const SizesSmallWithName: Story = {
  render: () => (
    <File
      size="small"
      hasName
      fileName="sample.txt"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesNormalWithName: Story = {
  render: () => (
    <File
      hasName
      fileName="sample.txt"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'This is the default size with name.',
      },
    },
  },
};

export const SizesMediumWithName: Story = {
  render: () => (
    <File
      size="medium"
      hasName
      fileName="sample.txt"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesLargeWithName: Story = {
  render: () => (
    <File
      size="large"
      hasName
      fileName="sample.txt"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

// Sizes with Boxed
export const SizesSmallWithBoxed: Story = {
  render: () => (
    <File
      size="small"
      isBoxed
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesNormalWithBoxed: Story = {
  render: () => (
    <File isBoxed label="Choose a file..." iconLeft={<Icon name="upload" />} />
  ),
  parameters: {
    docs: {
      description: {
        story: 'This is the default size with boxed.',
      },
    },
  },
};

export const SizesMediumWithBoxed: Story = {
  render: () => (
    <File
      size="medium"
      isBoxed
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesLargeWithBoxed: Story = {
  render: () => (
    <File
      size="large"
      isBoxed
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

// Sizes with Name and Boxed
export const SizesSmallWithNameAndBoxed: Story = {
  render: () => (
    <File
      size="small"
      isBoxed
      hasName
      fileName="summary.docx"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesNormalWithNameAndBoxed: Story = {
  render: () => (
    <File
      isBoxed
      hasName
      fileName="summary.docx"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'This is the default size with name and boxed.',
      },
    },
  },
};

export const SizesMediumWithNameAndBoxed: Story = {
  render: () => (
    <File
      size="medium"
      isBoxed
      hasName
      fileName="summary.docx"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesLargeWithNameAndBoxed: Story = {
  render: () => (
    <File
      size="large"
      isBoxed
      hasName
      fileName="summary.docx"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

// Alignments
export const AlignmentCenter: Story = {
  render: () => (
    <File
      color="info"
      isCentered
      isBoxed
      hasName
      fileName="centered.pdf"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const AlignmentRight: Story = {
  render: () => (
    <File
      color="primary"
      isRight
      hasName
      fileName="right.pdf"
      label="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};
