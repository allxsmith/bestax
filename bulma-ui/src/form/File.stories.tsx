import { Meta, StoryObj } from '@storybook/react';
import File from './File';
import { Icon } from '../elements/Icon';
import { Field } from './Field';
import { Control } from './Control';

const meta: Meta<typeof File> = {
  title: 'Form/File',
  component: File,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof File>;

export const Default: Story = {
  render: () => (
    <File buttonLabel="Choose a file..." iconLeft={<Icon name="upload" />} />
  ),
};

export const ModifiersHasNameWithFileName: Story = {
  render: () => (
    <File
      hasName
      fileName="resume.pdf"
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const ModifiersBoxedBlock: Story = {
  render: () => (
    <File isBoxed buttonLabel="Choose a file..." iconLeft={<Icon name="upload" />} />
  ),
};

export const ModifiersHasNameAndBoxedBlock: Story = {
  render: () => (
    <File
      isBoxed
      hasName
      fileName="holiday.jpg"
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

// Colors
export const ColorsPrimary: Story = {
  render: () => (
    <File
      color="primary"
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const ColorsInfo: Story = {
  render: () => (
    <File
      color="info"
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const ColorsWarning: Story = {
  render: () => (
    <File
      color="warning"
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const ColorsDanger: Story = {
  render: () => (
    <File
      color="danger"
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

// Sizes
export const SizesSmall: Story = {
  render: () => (
    <File
      size="small"
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesNormal: Story = {
  render: () => (
    <File buttonLabel="Choose a file..." iconLeft={<Icon name="upload" />} />
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
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesLarge: Story = {
  render: () => (
    <File
      size="large"
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesNormalWithName: Story = {
  render: () => (
    <File
      hasName
      fileName="sample.txt"
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesNormalWithBoxed: Story = {
  render: () => (
    <File isBoxed buttonLabel="Choose a file..." iconLeft={<Icon name="upload" />} />
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
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

export const SizesLargeWithBoxed: Story = {
  render: () => (
    <File
      size="large"
      isBoxed
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
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
      buttonLabel="Choose a file..."
      iconLeft={<Icon name="upload" />}
    />
  ),
};

// ============================================================
// Context-aware Field/Control stories
// ============================================================

/**
 * Standalone with label — File renders its own Field+Control wrapper automatically.
 * Note: `label` is the Field label; `buttonLabel` is for the button text.
 */
export const WithLabel: Story = {
  render: () => <File label="Attachment" />,
};

/**
 * Inside Field — the outer Field turns off File's auto Field rendering via context.
 * Demonstrates horizontal layout composition.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Attachment">
      <Field.Body>
        <File />
      </Field.Body>
    </Field>
  ),
};

/**
 * Full manual composition — Field+Control provided externally.
 * File manages its own control internally, so the outer Control
 * simply provides context signaling.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Attachment">
      <Field.Body>
        <Field>
          <Control>
            <File />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};
