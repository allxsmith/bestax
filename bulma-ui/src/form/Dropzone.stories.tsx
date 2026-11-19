import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Dropzone, type DropzoneRejection } from './Dropzone';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Icon } from '../elements/Icon';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { LocaleProvider } from '../helpers/LocaleProvider';

const colors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'dark',
  'light',
  'white',
] as const;

const meta: Meta<typeof Dropzone> = {
  title: 'Form/Dropzone',
  component: Dropzone,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An area to drop files on or click to pick them. The real file input lies over Bulma’s boxed file widget, so it’s one tab stop that Enter and Space open, and it holds the chosen files, so a form submits them. Each pick, drop or paste is checked against accept, maxSize, maxFiles and multiple; the chosen files are listed with a remove button each, refusals say why, and both are announced. It doesn’t upload anything.',
      },
    },
  },
  args: {
    label: 'Attachments',
    multiple: true,
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Field label above the zone, which names the input',
    },
    buttonLabel: {
      control: 'text',
      description: 'The zone’s text, which names the input; keep it short',
    },
    hint: {
      control: 'text',
      description: 'A line under the zone that describes the input',
    },
    accept: {
      control: 'text',
      description:
        'File types it takes, as the native attribute writes them; checked on every pick, drop and paste',
    },
    multiple: {
      control: 'boolean',
      description:
        'Takes several files, adding each pick, drop or paste to the list',
    },
    maxSize: {
      control: 'number',
      description: 'The largest file it takes, in bytes',
    },
    maxFiles: {
      control: 'number',
      description: 'With multiple, how many files the list holds at most',
    },
    showFileList: {
      control: 'boolean',
      description: 'Shows the chosen files under the zone',
    },
    allowPaste: {
      control: 'boolean',
      description: 'Takes files pasted while the input has focus',
    },
    preventDocumentDrop: {
      control: 'boolean',
      description:
        'Stops the browser opening a file dropped outside any drop target',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input and hides the remove buttons',
    },
    required: {
      control: 'boolean',
      description: 'The browser’s own check that a file was chosen',
    },
    color: {
      control: 'select',
      options: [undefined, ...colors],
      description: 'Bulma color modifier for the zone',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Size modifier for the zone',
    },
    message: {
      control: 'text',
      description: 'Help or validation message under the Dropzone',
    },
    messageColor: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ],
      description: 'Bulma color for the message',
    },
    name: {
      control: 'text',
      description: 'The files’ name in the form’s data',
    },
    icon: {
      control: false,
      description: 'An icon above the zone’s text',
    },
    files: {
      control: false,
      description: 'The chosen files, to control the list',
    },
    onFilesChange: {
      action: 'filesChange',
      description: 'Called with the whole list each time it changes',
    },
    onReject: {
      action: 'reject',
      description: 'Called with the files a pick, drop or paste refused',
    },
    removeLabel: {
      control: false,
      description: 'Names a file’s remove button, for localization',
    },
    rejectionMessage: {
      control: false,
      description: 'The text shown and announced for a refused file',
    },
    addedMessage: {
      control: false,
      description: 'What’s announced when files are added',
    },
    removedMessage: {
      control: false,
      description: 'What’s announced when a file is removed',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the root',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dropzone>;

export const Default: Story = {
  args: {
    icon: <Icon name="upload" />,
    hint: 'Any files, as many as you like',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Attachments');
    await expect(input).toHaveAttribute('type', 'file');
    await expect(input).toHaveAttribute('multiple');
  },
};

export const OnePdf: Story = {
  args: {
    label: 'CV',
    multiple: false,
    name: 'cv',
    accept: '.pdf,application/pdf',
    maxSize: 5_000_000,
    hint: 'PDF up to 5 MB',
    required: true,
  },
};

export const ImagesUpToFive: Story = {
  args: {
    label: 'Photos',
    accept: 'image/*',
    maxFiles: 5,
    icon: <Icon name="images" />,
    buttonLabel: 'Choose or drop photos',
    hint: 'Up to 5 images',
  },
};

export const InAForm: Story = {
  render: function InAFormExample() {
    const [sent, setSent] = useState<string[] | null>(null);
    return (
      <form
        onSubmit={event => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSent(
            data
              .getAll('attachments')
              .filter((value): value is File => typeof value !== 'string')
              .filter(file => file.name !== '')
              .map(file => file.name)
          );
        }}
      >
        <Dropzone
          label="Attachments"
          name="attachments"
          multiple
          required
          hint="The form submits whatever the input holds"
        />
        <Buttons>
          <Button type="submit" color="primary">
            Send
          </Button>
          <Button type="reset">Reset</Button>
        </Buttons>
        {sent && <p>Sent: {sent.join(', ') || 'nothing'}</p>}
      </form>
    );
  },
};

export const Controlled: Story = {
  render: function ControlledExample() {
    const [files, setFiles] = useState<File[]>([]);
    const [refused, setRefused] = useState<DropzoneRejection[]>([]);
    return (
      <>
        <Dropzone
          label="Documents"
          multiple
          accept=".pdf,.docx"
          files={files}
          onFilesChange={setFiles}
          onReject={setRefused}
        />
        <p>
          {files.length} in state; last refused:{' '}
          {refused.map(r => `${r.file.name} (${r.code})`).join(', ') || 'none'}
        </p>
        <Button onClick={() => setFiles([])}>Clear</Button>
      </>
    );
  },
};

export const OpenFromAButton: Story = {
  render: function OpenFromAButtonExample() {
    const ref = useRef<HTMLInputElement>(null);
    return (
      <>
        <Dropzone ref={ref} label="Attachments" multiple />
        <Button onClick={() => ref.current?.showPicker()}>Browse…</Button>
      </>
    );
  },
};

export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <Columns isMultiline>
        {colors.map(color => (
          <Column key={color} size="one-third">
            <Dropzone
              label={color}
              color={color}
              multiple
              showFileList={false}
            />
          </Column>
        ))}
      </Columns>
    );
  },
};

export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <>
        {(['small', undefined, 'medium', 'large'] as const).map(size => (
          <Dropzone
            key={size ?? 'normal'}
            label={size ?? 'normal'}
            size={size}
            icon={<Icon name="upload" />}
          />
        ))}
      </>
    );
  },
};

export const Disabled: Story = {
  args: {
    label: 'Attachments',
    disabled: true,
    hint: 'Uploads are closed',
  },
};

export const LocalizedRightToLeft: Story = {
  render: function LocalizedRightToLeftExample() {
    return (
      <LocaleProvider locale="ar-EG" dir="rtl">
        <Dropzone
          label="المرفقات"
          multiple
          buttonLabel="اختر الملفات أو أفلتها"
          hint="أي ملفات"
          removeLabel={file => `إزالة ${file.name}`}
          addedMessage={files =>
            files.length === 1
              ? `تمت إضافة ${files[0].name}`
              : `تمت إضافة ${files.length} ملفات`
          }
          removedMessage={file => `تمت إزالة ${file.name}`}
        />
      </LocaleProvider>
    );
  },
};
