import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Autocomplete } from './Autocomplete';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { Field } from './Field';
import { Control } from './Control';
import { Button } from '../elements/Button';
import { Block } from '../elements/Block';
import { Paragraph } from '../elements/Paragraph';
import { Span } from '../elements/Span';

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
  { value: 'us', label: 'United States', flag: '\u{1F1FA}\u{1F1F8}' },
  { value: 'ca', label: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  { value: 'uk', label: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}' },
  { value: 'au', label: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  { value: 'de', label: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  { value: 'fr', label: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  { value: 'jp', label: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
  { value: 'br', label: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}' },
  { value: 'in', label: 'India', flag: '\u{1F1EE}\u{1F1F3}' },
  { value: 'mx', label: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}' },
];

const ResponsiveWrapper = ({ children }: { children: React.ReactNode }) => (
  <Columns>
    <Column
      sizeMobile="full"
      sizeTablet="half"
      sizeDesktop="one-third"
      sizeWidescreen="one-quarter"
    >
      {children}
    </Column>
  </Columns>
);

/**
 * Basic autocomplete with string array.
 */
export const Default: Story = {
  render: function DefaultExample() {
    const [selected, setSelected] = useState<string | null>(null);

    return (
      <ResponsiveWrapper>
        <Autocomplete
          data={fruits}
          placeholder="Search for a fruit..."
          onSelect={item => setSelected(item as string)}
        />
        {selected && <Paragraph mt="4">Selected: {selected}</Paragraph>}
      </ResponsiveWrapper>
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
      <ResponsiveWrapper>
        <Autocomplete
          data={countries}
          field="label"
          placeholder="Search for a country..."
          onSelect={item => setSelected(item)}
        />
        {selected && (
          <Paragraph mt="4">
            Selected: {selected.flag} {selected.label}
          </Paragraph>
        )}
      </ResponsiveWrapper>
    );
  },
};

/**
 * Autocomplete with clear button.
 */
export const Clearable: Story = {
  render: function ClearableExample() {
    return (
      <ResponsiveWrapper>
        <Autocomplete
          data={fruits}
          placeholder="Search and clear..."
          clearable
        />
      </ResponsiveWrapper>
    );
  },
};

/**
 * Opens dropdown when input is focused.
 */
export const OpenOnFocus: Story = {
  render: function OpenOnFocusExample() {
    return (
      <ResponsiveWrapper>
        <Autocomplete
          data={fruits.slice(0, 8)}
          placeholder="Click to see all options..."
          openOnFocus
        />
      </ResponsiveWrapper>
    );
  },
};

/**
 * Keeps first option highlighted for quick selection.
 */
export const KeepFirst: Story = {
  render: function KeepFirstExample() {
    return (
      <ResponsiveWrapper>
        <Paragraph mb="4" className="help">
          Type to filter. First match is highlighted for Enter key selection.
        </Paragraph>
        <Autocomplete
          data={fruits}
          placeholder="Type and press Enter..."
          keepFirst
        />
      </ResponsiveWrapper>
    );
  },
};

/**
 * Custom item template with rich content.
 */
export const CustomTemplate: Story = {
  render: function CustomTemplateExample() {
    return (
      <ResponsiveWrapper>
        <Autocomplete
          data={countries}
          field="label"
          placeholder="Search for a country..."
          itemTemplate={item => (
            <Block display="flex" alignItems="center">
              <Span mr="2" textSize="5">
                {(item as any).flag}
              </Span>
              <Span>{(item as any).label}</Span>
            </Block>
          )}
        />
      </ResponsiveWrapper>
    );
  },
};

/**
 * Different input colors.
 */
export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <ResponsiveWrapper>
        <Field>
          <Autocomplete data={fruits} placeholder="Primary" color="primary" />
        </Field>
        <Field>
          <Autocomplete data={fruits} placeholder="Success" color="success" />
        </Field>
        <Field>
          <Autocomplete data={fruits} placeholder="Warning" color="warning" />
        </Field>
        <Field>
          <Autocomplete data={fruits} placeholder="Danger" color="danger" />
        </Field>
        <Field>
          <Autocomplete data={fruits} placeholder="Info" color="info" />
        </Field>
      </ResponsiveWrapper>
    );
  },
};

/**
 * Different input sizes.
 */
export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <ResponsiveWrapper>
        <Field>
          <Autocomplete data={fruits} placeholder="Small" size="small" />
        </Field>
        <Field>
          <Autocomplete data={fruits} placeholder="Normal" />
        </Field>
        <Field>
          <Autocomplete data={fruits} placeholder="Medium" size="medium" />
        </Field>
        <Field>
          <Autocomplete data={fruits} placeholder="Large" size="large" />
        </Field>
      </ResponsiveWrapper>
    );
  },
};

/**
 * Loading state while fetching data.
 */
export const Loading: Story = {
  render: function LoadingExample() {
    return (
      <ResponsiveWrapper>
        <Autocomplete data={[]} placeholder="Loading..." loading />
      </ResponsiveWrapper>
    );
  },
};

/**
 * Disabled autocomplete.
 */
export const Disabled: Story = {
  render: function DisabledExample() {
    return (
      <ResponsiveWrapper>
        <Autocomplete data={fruits} placeholder="Disabled" disabled />
      </ResponsiveWrapper>
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
      <ResponsiveWrapper>
        <Autocomplete
          data={fruits}
          value={value}
          placeholder="Search..."
          onInput={setValue}
          openOnFocus
          empty={
            <Block textAlign="centered" p="4">
              <Paragraph textColor="grey">No fruits found</Paragraph>
              <Paragraph textColor="grey-light" textSize="7">
                Try a different search term
              </Paragraph>
            </Block>
          }
        />
      </ResponsiveWrapper>
    );
  },
};

/**
 * With header and footer in dropdown.
 */
export const HeaderFooter: Story = {
  render: function HeaderFooterExample() {
    return (
      <ResponsiveWrapper>
        <Autocomplete
          data={fruits.slice(0, 5)}
          placeholder="Search fruits..."
          openOnFocus
          header={<Span>Popular Fruits</Span>}
          footer={<a href="#">View all fruits</a>}
        />
      </ResponsiveWrapper>
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
      <ResponsiveWrapper>
        <Block display="flex" alignItems="center" mb="4" className="is-gap-2">
          <Span>Value: &quot;{value}&quot;</Span>
          <Button size="small" onClick={handleClear}>
            Clear
          </Button>
        </Block>
        <Autocomplete
          data={fruits}
          value={value}
          placeholder="Controlled input..."
          onInput={setValue}
          onSelect={item => setSelected(item as string)}
        />
        {selected && <Paragraph mt="4">Selected: {selected}</Paragraph>}
      </ResponsiveWrapper>
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
      <ResponsiveWrapper>
        <Paragraph mb="4" className="help">
          Type to simulate async search (500ms delay)
        </Paragraph>
        <Autocomplete
          data={data}
          placeholder="Search fruits..."
          loading={loading}
          onInput={handleInput}
          empty="No results found"
        />
      </ResponsiveWrapper>
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
      <ResponsiveWrapper>
        <Autocomplete
          data={dataWithDisabled}
          field="label"
          placeholder="Some options are disabled..."
          openOnFocus
        />
      </ResponsiveWrapper>
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
    };

    return (
      <Columns>
        <Column
          sizeMobile="full"
          sizeTablet="half"
          sizeDesktop="one-third"
          sizeWidescreen="one-quarter"
        >
          <form onSubmit={handleSubmit}>
            <Field label="Favorite Fruit">
              <Control>
                <Autocomplete
                  data={fruits}
                  placeholder="Select a fruit..."
                  clearable
                  keepFirst
                  onInput={setFruit}
                />
              </Control>
            </Field>
            <Field>
              <Control>
                <Button color="primary" type="submit">
                  Submit
                </Button>
              </Control>
            </Field>
          </form>
        </Column>
      </Columns>
    );
  },
};

// ============================================================
// Context-aware Field/Control stories
// ============================================================

/**
 * Standalone with label — Autocomplete renders its own Field+Control wrapper automatically.
 */
export const WithLabel: Story = {
  render: () => (
    <Autocomplete label="Fruit" data={fruits} placeholder="Search..." />
  ),
};

/**
 * Inside Field — the outer Field turns off Autocomplete's auto Field rendering via context.
 * Demonstrates horizontal layout composition.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Fruit">
      <Field.Body>
        <Autocomplete data={fruits} placeholder="Search..." />
      </Field.Body>
    </Field>
  ),
};

/**
 * Full manual composition — Field+Control provided externally.
 * Autocomplete manages its own control internally, so the outer Control
 * simply provides context signaling.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Fruit">
      <Field.Body>
        <Field>
          <Control>
            <Autocomplete data={fruits} placeholder="Search..." />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Form submission — Autocomplete is HTML-form-compatible. Pass a `name` prop
 * and the typed/selected text is forwarded to the inner `<input>` so the value
 * submits with the surrounding form.
 */
export const WithName: Story = {
  render: function AutocompleteForm() {
    const [submitted, setSubmitted] = useState<string>('');
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
        }}
      >
        <Autocomplete
          name="city"
          data={['New York', 'London', 'Paris', 'Tokyo', 'Sydney']}
          placeholder="Search a city…"
        />
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="button is-primary">
            Submit
          </button>
        </div>
        {submitted && <pre style={{ marginTop: '1rem' }}>{submitted}</pre>}
      </form>
    );
  },
};
