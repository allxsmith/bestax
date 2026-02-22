import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Autocomplete } from './Autocomplete';

const meta: Meta<typeof Autocomplete> = {
  title: 'Form/Autocomplete',
  component: Autocomplete,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An autocomplete input component with dropdown suggestions. Supports keyboard navigation, custom templates, and infinite scroll.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      description: 'Array of options to display',
    },
    value: {
      control: 'text',
      description: 'Current input value (controlled)',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    field: {
      control: 'text',
      description: 'Object property to use as display field',
    },
    clearable: {
      control: 'boolean',
      description: 'Show clear button',
    },
    openOnFocus: {
      control: 'boolean',
      description: 'Open dropdown when focused',
    },
    keepFirst: {
      control: 'boolean',
      description: 'Keep first option highlighted',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    maxHeight: {
      control: 'number',
      description: 'Maximum dropdown height in pixels',
    },
    color: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Input color',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Input size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Autocomplete>;

const fruits = [
  'Apple',
  'Banana',
  'Cherry',
  'Date',
  'Elderberry',
  'Fig',
  'Grape',
  'Honeydew',
  'Jackfruit',
  'Kiwi',
  'Lemon',
  'Mango',
  'Nectarine',
  'Orange',
  'Papaya',
  'Quince',
  'Raspberry',
  'Strawberry',
  'Tangerine',
  'Watermelon',
];

const countries = [
  { value: 'us', label: 'United States', flag: '🇺🇸' },
  { value: 'ca', label: 'Canada', flag: '🇨🇦' },
  { value: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'au', label: 'Australia', flag: '🇦🇺' },
  { value: 'de', label: 'Germany', flag: '🇩🇪' },
  { value: 'fr', label: 'France', flag: '🇫🇷' },
  { value: 'jp', label: 'Japan', flag: '🇯🇵' },
  { value: 'br', label: 'Brazil', flag: '🇧🇷' },
  { value: 'in', label: 'India', flag: '🇮🇳' },
  { value: 'mx', label: 'Mexico', flag: '🇲🇽' },
];

/**
 * Basic autocomplete with string array.
 */
export const Default: Story = {
  render: function DefaultExample() {
    const [selected, setSelected] = useState<string | null>(null);

    return (
      <div style={{ maxWidth: '400px' }}>
        <Autocomplete
          data={fruits}
          placeholder="Search for a fruit..."
          onSelect={item => setSelected(item as string)}
        />
        {selected && <p className="mt-4">Selected: {selected}</p>}
      </div>
    );
  },
};

/**
 * Autocomplete with object data and custom field.
 */
export const ObjectData: Story = {
  render: function ObjectDataExample() {
    const [selected, setSelected] = useState<any>(null);

    return (
      <div style={{ maxWidth: '400px' }}>
        <Autocomplete
          data={countries}
          field="label"
          placeholder="Search for a country..."
          onSelect={item => setSelected(item)}
        />
        {selected && (
          <p className="mt-4">
            Selected: {selected.flag} {selected.label}
          </p>
        )}
      </div>
    );
  },
};

/**
 * Autocomplete with clear button.
 */
export const Clearable: Story = {
  render: function ClearableExample() {
    return (
      <div style={{ maxWidth: '400px' }}>
        <Autocomplete
          data={fruits}
          placeholder="Search and clear..."
          clearable
        />
      </div>
    );
  },
};

/**
 * Opens dropdown when input is focused.
 */
export const OpenOnFocus: Story = {
  render: function OpenOnFocusExample() {
    return (
      <div style={{ maxWidth: '400px' }}>
        <Autocomplete
          data={fruits.slice(0, 8)}
          placeholder="Click to see all options..."
          openOnFocus
        />
      </div>
    );
  },
};

/**
 * Keeps first option highlighted for quick selection.
 */
export const KeepFirst: Story = {
  render: function KeepFirstExample() {
    return (
      <div style={{ maxWidth: '400px' }}>
        <p className="mb-4 help">
          Type to filter. First match is highlighted for Enter key selection.
        </p>
        <Autocomplete
          data={fruits}
          placeholder="Type and press Enter..."
          keepFirst
        />
      </div>
    );
  },
};

/**
 * Custom item template with rich content.
 */
export const CustomTemplate: Story = {
  render: function CustomTemplateExample() {
    return (
      <div style={{ maxWidth: '400px' }}>
        <Autocomplete
          data={countries}
          field="label"
          placeholder="Search for a country..."
          itemTemplate={item => (
            <div className="is-flex is-align-items-center">
              <span className="mr-2" style={{ fontSize: '1.5rem' }}>
                {(item as any).flag}
              </span>
              <span>{(item as any).label}</span>
            </div>
          )}
        />
      </div>
    );
  },
};

/**
 * Different input colors.
 */
export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <div
        className="is-flex is-flex-direction-column"
        style={{ gap: '1rem', maxWidth: '400px' }}
      >
        <Autocomplete data={fruits} placeholder="Primary" color="primary" />
        <Autocomplete data={fruits} placeholder="Success" color="success" />
        <Autocomplete data={fruits} placeholder="Warning" color="warning" />
        <Autocomplete data={fruits} placeholder="Danger" color="danger" />
        <Autocomplete data={fruits} placeholder="Info" color="info" />
      </div>
    );
  },
};

/**
 * Different input sizes.
 */
export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <div
        className="is-flex is-flex-direction-column"
        style={{ gap: '1rem', maxWidth: '400px' }}
      >
        <Autocomplete data={fruits} placeholder="Small" size="small" />
        <Autocomplete data={fruits} placeholder="Normal" />
        <Autocomplete data={fruits} placeholder="Medium" size="medium" />
        <Autocomplete data={fruits} placeholder="Large" size="large" />
      </div>
    );
  },
};

/**
 * Loading state while fetching data.
 */
export const Loading: Story = {
  render: function LoadingExample() {
    return (
      <div style={{ maxWidth: '400px' }}>
        <Autocomplete data={[]} placeholder="Loading..." loading />
      </div>
    );
  },
};

/**
 * Disabled autocomplete.
 */
export const Disabled: Story = {
  render: function DisabledExample() {
    return (
      <div style={{ maxWidth: '400px' }}>
        <Autocomplete data={fruits} placeholder="Disabled" disabled />
      </div>
    );
  },
};

/**
 * Custom empty state when no results found.
 */
export const EmptyState: Story = {
  render: function EmptyStateExample() {
    const [value, setValue] = useState('xyz');

    return (
      <div style={{ maxWidth: '400px' }}>
        <Autocomplete
          data={fruits}
          value={value}
          placeholder="Search..."
          onInput={setValue}
          openOnFocus
          empty={
            <div className="has-text-centered p-4">
              <p className="has-text-grey">No fruits found</p>
              <p className="has-text-grey-light is-size-7">
                Try a different search term
              </p>
            </div>
          }
        />
      </div>
    );
  },
};

/**
 * With header and footer in dropdown.
 */
export const HeaderFooter: Story = {
  render: function HeaderFooterExample() {
    return (
      <div style={{ maxWidth: '400px' }}>
        <Autocomplete
          data={fruits.slice(0, 5)}
          placeholder="Search fruits..."
          openOnFocus
          header={<span>Popular Fruits</span>}
          footer={<a href="#">View all fruits</a>}
        />
      </div>
    );
  },
};

/**
 * Controlled component with external state.
 */
export const Controlled: Story = {
  render: function ControlledExample() {
    const [value, setValue] = useState('');
    const [selected, setSelected] = useState<string | null>(null);

    const handleClear = () => {
      setValue('');
      setSelected(null);
    };

    return (
      <div style={{ maxWidth: '400px' }}>
        <div
          className="is-flex is-align-items-center mb-4"
          style={{ gap: '0.5rem' }}
        >
          <span>Value: "{value}"</span>
          <button className="button is-small" onClick={handleClear}>
            Clear
          </button>
        </div>
        <Autocomplete
          data={fruits}
          value={value}
          placeholder="Controlled input..."
          onInput={setValue}
          onSelect={item => setSelected(item as string)}
        />
        {selected && <p className="mt-4">Selected: {selected}</p>}
      </div>
    );
  },
};

/**
 * Async data loading with debounce simulation.
 */
export const AsyncData: Story = {
  render: function AsyncDataExample() {
    const [data, setData] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleInput = (value: string) => {
      if (!value) {
        setData([]);
        return;
      }

      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filtered = fruits.filter(f =>
          f.toLowerCase().includes(value.toLowerCase())
        );
        setData(filtered);
        setLoading(false);
      }, 500);
    };

    return (
      <div style={{ maxWidth: '400px' }}>
        <p className="mb-4 help">Type to simulate async search (500ms delay)</p>
        <Autocomplete
          data={data}
          placeholder="Search fruits..."
          loading={loading}
          onInput={handleInput}
          empty="No results found"
        />
      </div>
    );
  },
};

/**
 * Items with disabled state.
 */
export const DisabledItems: Story = {
  render: function DisabledItemsExample() {
    const dataWithDisabled = [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana', disabled: true },
      { value: 'cherry', label: 'Cherry' },
      { value: 'date', label: 'Date', disabled: true },
      { value: 'elderberry', label: 'Elderberry' },
    ];

    return (
      <div style={{ maxWidth: '400px' }}>
        <Autocomplete
          data={dataWithDisabled}
          field="label"
          placeholder="Some options are disabled..."
          openOnFocus
        />
      </div>
    );
  },
};

/**
 * Form integration example.
 */
export const FormIntegration: Story = {
  render: function FormIntegrationExample() {
    const [fruit, setFruit] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Selected fruit: ${fruit}`);
    };

    return (
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
        <div className="field">
          <label className="label">Favorite Fruit</label>
          <div className="control">
            <Autocomplete
              data={fruits}
              placeholder="Select a fruit..."
              clearable
              keepFirst
              onInput={setFruit}
            />
          </div>
        </div>
        <div className="field">
          <div className="control">
            <button type="submit" className="button is-primary">
              Submit
            </button>
          </div>
        </div>
      </form>
    );
  },
};
