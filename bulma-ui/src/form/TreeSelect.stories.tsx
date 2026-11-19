import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeSelect, type TreeItemData } from './TreeSelect';
import { Paragraph } from '../elements/Paragraph';
import { Code } from '../elements/Code';
import { LocaleProvider } from '../helpers/LocaleProvider';

const folders: TreeItemData[] = [
  {
    value: 'docs',
    label: 'Documents',
    icon: 'folder',
    children: [
      { value: 'invoices', label: 'Invoices', icon: 'file-invoice' },
      { value: 'contracts', label: 'Contracts', icon: 'file-contract' },
      {
        value: 'archive',
        label: 'Archive',
        icon: 'box-archive',
        children: [
          { value: 'archive-2025', label: '2025' },
          { value: 'archive-2024', label: '2024' },
        ],
      },
    ],
  },
  {
    value: 'photos',
    label: 'Photos',
    icon: 'folder',
    children: [
      { value: 'summer', label: 'Summer' },
      { value: 'winter', label: 'Winter' },
    ],
  },
  { value: 'shared', label: 'Shared with me', icon: 'users', disabled: true },
];

const regions: TreeItemData[] = [
  {
    value: 'europe',
    label: 'Europe',
    children: [
      { value: 'france', label: 'France' },
      { value: 'germany', label: 'Germany' },
      { value: 'spain', label: 'Spain' },
    ],
  },
  {
    value: 'asia',
    label: 'Asia',
    children: [
      { value: 'japan', label: 'Japan' },
      { value: 'korea', label: 'Korea' },
    ],
  },
  { value: 'oceania', label: 'Oceania' },
];

const meta: Meta<typeof TreeSelect> = {
  title: 'Form/TreeSelect',
  component: TreeSelect,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A form field whose options are a tree. It opens a panel holding a real TreeView, picks one item or checks a branch at a time, and can search labels.',
      },
    },
  },
  args: {
    label: 'Save to',
    data: folders,
    placeholder: 'Pick a folder',
  },
  argTypes: {
    data: {
      control: false,
      description: 'The tree, as nodes nested through children',
    },
    selectionMode: {
      control: 'inline-radio',
      options: ['single', 'checkbox', 'checkbox-independent'],
      description: 'One item, checks with the cascade, or checks one by one',
    },
    checkedStrategy: {
      control: 'inline-radio',
      options: ['child', 'parent', 'all'],
      description: "What a checked branch puts in the value, in 'checkbox'",
    },
    value: {
      control: false,
      description: 'The picked value, or the checked list, when you hold it',
    },
    defaultValue: {
      control: false,
      description: 'The value to begin with',
    },
    onChange: {
      action: 'change',
      description: 'Called with the new value or list',
    },
    searchable: {
      control: 'boolean',
      description: 'Puts a search box at the top of the panel',
    },
    clearable: {
      control: 'boolean',
      description: 'Shows a clear button while something is picked',
    },
    parentsSelectable: {
      control: 'boolean',
      description: "Whether a parent's row picks it, in 'single'",
    },
    closeOnSelect: {
      control: 'boolean',
      description: "Closes the panel after a pick, in 'single'",
    },
    empty: {
      control: 'text',
      description: 'What the panel shows when the search matches nothing',
    },
    placeholder: {
      control: 'text',
      description: 'What the field shows while nothing is picked',
    },
    disabled: {
      control: 'boolean',
      description: 'The field cannot be used',
    },
    required: {
      control: 'boolean',
      description: 'A value is needed before the form submits',
    },
    color: {
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
      description: 'Bulma color modifier for the field',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'The field’s size, which the tree follows',
    },
    isRounded: {
      control: 'boolean',
      description: 'Rounds the field’s corners',
    },
    position: {
      control: 'select',
      options: ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'auto'],
      description: 'Where the panel opens, relative to the field',
    },
    appendToBody: {
      control: 'boolean',
      description: 'Renders the panel through a portal',
    },
    label: {
      control: 'text',
      description: 'The field’s label, which names the panel too',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TreeSelect>;

export const Default: Story = {};

export const Searchable: Story = {
  args: { searchable: true, clearable: true, empty: 'No folders match' },
};

export const OnlyLeaves: Story = {
  args: { parentsSelectable: false, label: 'File' },
};

function CheckboxExample() {
  const [picked, setPicked] = useState<string[]>(['france', 'germany']);
  return (
    <>
      <TreeSelect
        label="Regions"
        name="regions"
        selectionMode="checkbox"
        data={regions}
        value={picked}
        onChange={setPicked}
        searchable
      />
      <Paragraph>
        Value: <Code>{JSON.stringify(picked)}</Code>
      </Paragraph>
    </>
  );
}

export const Checkbox: Story = {
  render: function Render() {
    return <CheckboxExample />;
  },
};

function StrategyExample() {
  const [picked, setPicked] = useState<string[]>(['europe']);
  return (
    <>
      <TreeSelect
        label="Regions, as their topmost checked items"
        selectionMode="checkbox"
        checkedStrategy="parent"
        data={regions}
        value={picked}
        onChange={setPicked}
      />
      <Paragraph>
        Value: <Code>{JSON.stringify(picked)}</Code>
      </Paragraph>
    </>
  );
}

export const CheckedStrategy: Story = {
  render: function Render() {
    return <StrategyExample />;
  },
};

export const CheckboxIndependent: Story = {
  args: {
    label: 'Categories',
    selectionMode: 'checkbox-independent',
    data: regions,
    defaultValue: ['europe'],
    placeholder: undefined,
  },
};

function LazyExample() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const data: TreeItemData[] = [
    {
      value: 'photos',
      label: 'Photos',
      hasChildren: true,
      isLoading: loading,
      children: loaded
        ? [
            { value: 'summer', label: 'Summer' },
            { value: 'winter', label: 'Winter' },
          ]
        : undefined,
    },
    { value: 'docs', label: 'Documents' },
  ];
  return (
    <TreeSelect
      label="Folder"
      data={data}
      onExpandedChange={expanded => {
        if (expanded.includes('photos') && !loaded && !loading) {
          setLoading(true);
          setTimeout(() => {
            setLoaded(true);
            setLoading(false);
          }, 1000);
        }
      }}
    />
  );
}

export const LazyLoading: Story = {
  render: function Render() {
    return <LazyExample />;
  },
};

export const Sizes: Story = {
  render: function Render() {
    return (
      <>
        <TreeSelect label="Small" size="small" data={folders} />
        <TreeSelect label="Normal" data={folders} />
        <TreeSelect label="Medium" size="medium" data={folders} />
        <TreeSelect label="Large" size="large" data={folders} />
      </>
    );
  },
};

export const RightToLeft: Story = {
  render: function Render() {
    return (
      <LocaleProvider locale="ar" dir="rtl">
        <TreeSelect
          label="المجلد"
          data={[
            {
              value: 'docs',
              label: 'المستندات',
              children: [{ value: 'invoices', label: 'الفواتير' }],
            },
            { value: 'photos', label: 'الصور' },
          ]}
          defaultValue="invoices"
          clearable
        />
      </LocaleProvider>
    );
  },
};
