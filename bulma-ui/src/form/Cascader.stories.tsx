import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cascader } from './Cascader';
import type { TreeItemData } from './TreeSelect';
import { Paragraph } from '../elements/Paragraph';
import { Code } from '../elements/Code';
import { LocaleProvider } from '../helpers/LocaleProvider';

const places: TreeItemData[] = [
  {
    value: 'europe',
    label: 'Europe',
    children: [
      {
        value: 'germany',
        label: 'Germany',
        children: [
          { value: 'berlin', label: 'Berlin' },
          { value: 'munich', label: 'Munich' },
          { value: 'hamburg', label: 'Hamburg' },
        ],
      },
      {
        value: 'france',
        label: 'France',
        children: [
          { value: 'paris', label: 'Paris' },
          { value: 'lyon', label: 'Lyon' },
        ],
      },
      {
        value: 'spain',
        label: 'Spain',
        disabled: true,
        children: [{ value: 'madrid', label: 'Madrid' }],
      },
    ],
  },
  {
    value: 'asia',
    label: 'Asia',
    children: [
      {
        value: 'japan',
        label: 'Japan',
        children: [
          { value: 'tokyo', label: 'Tokyo' },
          { value: 'osaka', label: 'Osaka' },
        ],
      },
      {
        value: 'korea',
        label: 'Korea',
        children: [{ value: 'seoul', label: 'Seoul' }],
      },
    ],
  },
];

const categories: TreeItemData[] = [
  {
    value: 'clothing',
    label: 'Clothing',
    icon: 'shirt',
    children: [
      { value: 'shirts', label: 'Shirts' },
      { value: 'shoes', label: 'Shoes' },
    ],
  },
  {
    value: 'home',
    label: 'Home',
    icon: 'house',
    children: [
      { value: 'kitchen', label: 'Kitchen' },
      { value: 'garden', label: 'Garden' },
    ],
  },
];

const meta: Meta<typeof Cascader> = {
  title: 'Form/Cascader',
  component: Cascader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A form field whose value sits at the end of a path. It opens a panel of columns, one per level, and shows the path in the field.',
      },
    },
  },
  args: {
    label: 'City',
    data: places,
    placeholder: 'Pick a city',
  },
  argTypes: {
    data: {
      control: false,
      description: 'The tree, as nodes nested through children',
    },
    value: {
      control: false,
      description: 'The picked value, when you hold it',
    },
    defaultValue: {
      control: false,
      description: 'The value to begin with',
    },
    onChange: {
      action: 'change',
      description: 'Called with the picked value, or null when cleared',
    },
    parentsSelectable: {
      control: 'boolean',
      description: 'Whether a parent can be the value, not only a leaf',
    },
    closeOnSelect: {
      control: 'boolean',
      description: 'Closes the panel after a pick',
    },
    searchable: {
      control: 'boolean',
      description: 'Puts a search box at the top, which lists matching paths',
    },
    clearable: {
      control: 'boolean',
      description: 'Shows a clear button while something is picked',
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
      description: 'The field’s size, which the columns follow',
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
type Story = StoryObj<typeof Cascader>;

export const Default: Story = {};

function ControlledExample() {
  const [city, setCity] = useState<string | null>('munich');
  return (
    <>
      <Cascader
        label="City"
        name="city"
        data={places}
        value={city}
        onChange={setCity}
        clearable
      />
      <Paragraph>
        Value: <Code>{JSON.stringify(city)}</Code>
      </Paragraph>
    </>
  );
}

export const Controlled: Story = {
  parameters: {
    // An axe exemption, with its reason in src/__tests__/stories-a11y.test.ts.
    a11y: { config: { rules: [{ id: 'target-size', enabled: false }] } },
  },
  render: function Render() {
    return <ControlledExample />;
  },
};

export const Searchable: Story = {
  args: { searchable: true, clearable: true, empty: 'No cities match' },
};

export const ParentsSelectable: Story = {
  args: {
    label: 'Category',
    data: categories,
    parentsSelectable: true,
    placeholder: 'Pick a category',
    labels: { separator: ' › ' },
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
    <Cascader
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
        <Cascader label="Small" size="small" data={places} />
        <Cascader label="Normal" data={places} />
        <Cascader label="Medium" size="medium" data={places} />
        <Cascader label="Large" size="large" data={places} />
      </>
    );
  },
};

export const RightToLeft: Story = {
  parameters: {
    // An axe exemption, with its reason in src/__tests__/stories-a11y.test.ts.
    a11y: { config: { rules: [{ id: 'target-size', enabled: false }] } },
  },
  render: function Render() {
    return (
      <LocaleProvider locale="ar" dir="rtl">
        <Cascader
          label="المدينة"
          data={[
            {
              value: 'europe',
              label: 'أوروبا',
              children: [
                {
                  value: 'germany',
                  label: 'ألمانيا',
                  children: [{ value: 'berlin', label: 'برلين' }],
                },
              ],
            },
            { value: 'oceania', label: 'أوقيانوسيا' },
          ]}
          defaultValue="berlin"
          clearable
        />
      </LocaleProvider>
    );
  },
};
