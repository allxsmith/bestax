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

/**
 * A basic file input. `buttonLabel` sets the CTA text; `iconLeft` adds an icon.
 */
export const Default: Story = {
  render: () => (
    <File buttonLabel="Choose a file\u2026" iconLeft={<Icon name="upload" />} />
  ),
};

/**
 * `hasName` displays the selected file name. `fileName` shows a custom or
 * pre-selected name.
 */
export const WithFilename: Story = {
  render: () => (
    <File
      hasName
      fileName="resume.pdf"
      buttonLabel="Choose a file\u2026"
      iconLeft={<Icon name="upload" />}
    />
  ),
};

/**
 * `isRight` + `hasName` puts the CTA on the right and the filename on the left.
 */
export const CtaOnRight: Story = {
  render: () => (
    <File
      hasName
      isRight
      fileName="contract.pdf"
      buttonLabel="Choose a file\u2026"
      iconLeft={<Icon name="upload" />}
    />
  ),
};

/**
 * `isFullwidth` makes the widget take the full width of its container.
 */
export const FullWidth: Story = {
  render: () => (
    <File
      hasName
      isFullwidth
      fileName="picture.png"
      buttonLabel="Choose a file\u2026"
      iconLeft={<Icon name="upload" />}
    />
  ),
};

/**
 * `isBoxed` stacks the icon over the text into a square box.
 */
export const Boxed: Story = {
  render: () => (
    <File
      isBoxed
      buttonLabel="Choose a file\u2026"
      iconLeft={<Icon name="upload" />}
    />
  ),
};

/**
 * `isBoxed` + `hasName` for a boxed widget that also shows the filename.
 */
export const BoxedWithName: Story = {
  render: () => (
    <File
      isBoxed
      hasName
      fileName="holiday.jpg"
      buttonLabel="Choose a file\u2026"
      iconLeft={<Icon name="upload" />}
    />
  ),
};

/**
 * The four color combos Bulma's docs show.
 */
export const Colors: Story = {
  render: () => (
    <>
      <File
        color="primary"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        color="info"
        hasName
        fileName="resume.pdf"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        color="warning"
        isBoxed
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="cloud-upload-alt" />}
      />
      <File
        color="danger"
        isBoxed
        hasName
        fileName="resume.pdf"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="cloud-upload-alt" />}
      />
    </>
  ),
};

/**
 * The `size` prop controls the file input's size.
 */
export const Sizes: Story = {
  render: () => (
    <>
      <File
        size="small"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File buttonLabel="Choose a file\u2026" iconLeft={<Icon name="upload" />} />
      <File
        size="medium"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        size="large"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
    </>
  ),
};

/**
 * `size` + `hasName` scales the filename display alongside the button.
 */
export const SizesWithName: Story = {
  render: () => (
    <>
      <File
        size="small"
        hasName
        fileName="sample.txt"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        hasName
        fileName="sample.txt"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        size="medium"
        hasName
        fileName="sample.txt"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        size="large"
        hasName
        fileName="sample.txt"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
    </>
  ),
};

/**
 * `size` + `isBoxed` for boxed file inputs at every size.
 */
export const SizesWithBoxed: Story = {
  render: () => (
    <>
      <File
        size="small"
        isBoxed
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        isBoxed
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        size="medium"
        isBoxed
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        size="large"
        isBoxed
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
    </>
  ),
};

/**
 * `isBoxed` + `hasName` + `size` for a boxed file input that also shows the
 * filename, at every size.
 */
export const SizesWithBoxedAndName: Story = {
  render: () => (
    <>
      <File
        size="small"
        isBoxed
        hasName
        fileName="summary.docx"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        isBoxed
        hasName
        fileName="summary.docx"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        size="medium"
        isBoxed
        hasName
        fileName="summary.docx"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
      <File
        size="large"
        isBoxed
        hasName
        fileName="summary.docx"
        buttonLabel="Choose a file\u2026"
        iconLeft={<Icon name="upload" />}
      />
    </>
  ),
};

/**
 * `isCentered` centers the widget within its parent container.
 */
export const AlignmentCentered: Story = {
  render: () => (
    <File
      color="info"
      isCentered
      isBoxed
      hasName
      fileName="centered.pdf"
      buttonLabel="Choose a file\u2026"
      iconLeft={<Icon name="upload" />}
    />
  ),
};

/**
 * `isRight` aligns the widget to the right of its parent.
 */
export const AlignmentRight: Story = {
  render: () => (
    <File
      color="primary"
      isRight
      hasName
      fileName="right.pdf"
      buttonLabel="Choose a file\u2026"
      iconLeft={<Icon name="upload" />}
    />
  ),
};

// ============================================================
// Context-Aware Rendering — File adjusts to its surrounding wrappers
// ============================================================

/**
 * Default (with label) — `label` adds a Field label above the widget.
 */
export const WithLabel: Story = {
  render: () => (
    <File
      label="Document"
      buttonLabel="Choose a file\u2026"
      iconLeft={<Icon name="upload" />}
    />
  ),
};

/**
 * Inside Field — the outer Field turns off File's auto Field rendering via context.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Document">
      <Field.Body>
        <Field>
          <File
            buttonLabel="Choose a file\u2026"
            iconLeft={<Icon name="upload" />}
          />
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Inside Field and Control — File doesn't consume Control's context, but the
 * outer Field is still detected.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Document">
      <Field.Body>
        <Field>
          <Control iconLeftName="paperclip">
            <File
              buttonLabel="Choose a file\u2026"
              iconLeft={<Icon name="upload" />}
            />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};
