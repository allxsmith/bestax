import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Taginput, TaginputTag } from './Taginput';

const meta: Meta<typeof Taginput> = {
  title: 'Form/Taginput',
  component: Taginput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A tag input component for managing multiple tags. Supports autocomplete suggestions, custom templates, and keyboard navigation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      description: 'Current tags (controlled)',
    },
    data: {
      description: 'Autocomplete suggestions',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    allowNew: {
      control: 'boolean',
      description: 'Allow creating new tags',
    },
    allowDuplicates: {
      control: 'boolean',
      description: 'Allow duplicate tags',
    },
    closable: {
      control: 'boolean',
      description: 'Show close button on tags',
    },
    maxTags: {
      control: 'number',
      description: 'Maximum number of tags',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    color: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Input focus color',
    },
    tagColor: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'dark',
        'light',
      ],
      description: 'Tag color',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Input size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Taginput>;

const frameworks = [
  'React',
  'Vue',
  'Angular',
  'Svelte',
  'Solid',
  'Preact',
  'Ember',
  'Backbone',
  'Alpine',
  'Lit',
];

/**
 * Basic taginput with free text entry.
 */
export const Default: Story = {
  render: function DefaultExample() {
    const [tags, setTags] = useState<TaginputTag[]>([]);

    return (
      <div style={{ maxWidth: '500px' }}>
        <Taginput placeholder="Add tags..." onChange={setTags} />
        {tags.length > 0 && (
          <p className="mt-4 is-size-7 has-text-grey">
            Tags: {tags.join(', ')}
          </p>
        )}
      </div>
    );
  },
};

/**
 * Taginput with autocomplete suggestions.
 */
export const WithAutocomplete: Story = {
  render: function WithAutocompleteExample() {
    const [tags, setTags] = useState<TaginputTag[]>(['React']);

    return (
      <div style={{ maxWidth: '500px' }}>
        <Taginput
          data={frameworks}
          defaultValue={['React']}
          placeholder="Search frameworks..."
          onChange={setTags}
        />
        {tags.length > 0 && (
          <p className="mt-4 is-size-7 has-text-grey">
            Selected: {tags.join(', ')}
          </p>
        )}
      </div>
    );
  },
};

/**
 * Only allow tags from the suggestion list.
 */
export const RestrictToList: Story = {
  render: function RestrictToListExample() {
    return (
      <div style={{ maxWidth: '500px' }}>
        <p className="mb-4 help">Only tags from the list can be added</p>
        <Taginput
          data={frameworks}
          allowNew={false}
          placeholder="Select frameworks..."
        />
      </div>
    );
  },
};

/**
 * Pre-filled with default tags.
 */
export const DefaultTags: Story = {
  render: function DefaultTagsExample() {
    return (
      <div style={{ maxWidth: '500px' }}>
        <Taginput
          defaultValue={['JavaScript', 'TypeScript', 'Node.js']}
          placeholder="Add more..."
        />
      </div>
    );
  },
};

/**
 * Limit maximum number of tags.
 */
export const MaxTags: Story = {
  render: function MaxTagsExample() {
    return (
      <div style={{ maxWidth: '500px' }}>
        <p className="mb-4 help">Maximum 3 tags allowed</p>
        <Taginput maxTags={3} placeholder="Add up to 3 tags..." />
      </div>
    );
  },
};

/**
 * Allow duplicate tags.
 */
export const AllowDuplicates: Story = {
  render: function AllowDuplicatesExample() {
    return (
      <div style={{ maxWidth: '500px' }}>
        <p className="mb-4 help">Same tag can be added multiple times</p>
        <Taginput allowDuplicates placeholder="Type the same tag twice..." />
      </div>
    );
  },
};

/**
 * Different tag colors.
 */
export const TagColors: Story = {
  render: function TagColorsExample() {
    return (
      <div
        className="is-flex is-flex-direction-column"
        style={{ gap: '1rem', maxWidth: '500px' }}
      >
        <Taginput
          defaultValue={['Primary']}
          tagColor="primary"
          placeholder="Primary tags..."
        />
        <Taginput
          defaultValue={['Success']}
          tagColor="success"
          placeholder="Success tags..."
        />
        <Taginput
          defaultValue={['Warning']}
          tagColor="warning"
          placeholder="Warning tags..."
        />
        <Taginput
          defaultValue={['Danger']}
          tagColor="danger"
          placeholder="Danger tags..."
        />
        <Taginput
          defaultValue={['Info']}
          tagColor="info"
          placeholder="Info tags..."
        />
        <Taginput
          defaultValue={['Dark']}
          tagColor="dark"
          placeholder="Dark tags..."
        />
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
        style={{ gap: '1rem', maxWidth: '500px' }}
      >
        <Taginput
          defaultValue={['Small']}
          size="small"
          placeholder="Small size..."
        />
        <Taginput defaultValue={['Normal']} placeholder="Normal size..." />
        <Taginput
          defaultValue={['Medium']}
          size="medium"
          placeholder="Medium size..."
        />
        <Taginput
          defaultValue={['Large']}
          size="large"
          placeholder="Large size..."
        />
      </div>
    );
  },
};

/**
 * Attached tags style.
 */
export const Attached: Story = {
  render: function AttachedExample() {
    return (
      <div style={{ maxWidth: '500px' }}>
        <Taginput
          defaultValue={['React', 'Vue', 'Angular']}
          attached
          placeholder="Add more..."
        />
      </div>
    );
  },
};

/**
 * Non-closable tags.
 */
export const NonClosable: Story = {
  render: function NonClosableExample() {
    return (
      <div style={{ maxWidth: '500px' }}>
        <p className="mb-4 help">Tags cannot be removed by clicking</p>
        <Taginput
          defaultValue={['Permanent', 'Tags']}
          closable={false}
          placeholder="Add more..."
        />
      </div>
    );
  },
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  render: function DisabledExample() {
    return (
      <div style={{ maxWidth: '500px' }}>
        <Taginput
          defaultValue={['Cannot', 'Modify']}
          disabled
          placeholder="Disabled..."
        />
      </div>
    );
  },
};

/**
 * Read-only state.
 */
export const Readonly: Story = {
  render: function ReadonlyExample() {
    return (
      <div style={{ maxWidth: '500px' }}>
        <Taginput
          defaultValue={['Read', 'Only']}
          readonly
          placeholder="Read only..."
        />
      </div>
    );
  },
};

/**
 * Custom confirm keys.
 */
export const CustomConfirmKeys: Story = {
  render: function CustomConfirmKeysExample() {
    return (
      <div style={{ maxWidth: '500px' }}>
        <p className="mb-4 help">Press Enter, comma, or semicolon to add tag</p>
        <Taginput
          confirmKeys={['Enter', ',', ';']}
          placeholder="Type and press Enter, comma, or semicolon..."
        />
      </div>
    );
  },
};

/**
 * Open dropdown on focus.
 */
export const OpenOnFocus: Story = {
  render: function OpenOnFocusExample() {
    return (
      <div style={{ maxWidth: '500px' }}>
        <p className="mb-4 help">Click to see all available options</p>
        <Taginput
          data={frameworks}
          openOnFocus
          placeholder="Click to see suggestions..."
        />
      </div>
    );
  },
};

/**
 * Custom tag template.
 */
export const CustomTemplate: Story = {
  render: function CustomTemplateExample() {
    const languages = [
      { value: 'js', label: 'JavaScript', icon: '📜' },
      { value: 'ts', label: 'TypeScript', icon: '💎' },
      { value: 'py', label: 'Python', icon: '🐍' },
    ];

    return (
      <div style={{ maxWidth: '500px' }}>
        <Taginput
          defaultValue={languages}
          field="label"
          tagTemplate={tag => (
            <span>
              {(tag as any).icon} {(tag as any).label}
            </span>
          )}
          placeholder="Add languages..."
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
    const [tags, setTags] = useState<TaginputTag[]>(['Initial']);

    const handleClear = () => setTags([]);
    const handleAdd = () => setTags([...tags, `Tag ${tags.length + 1}`]);

    return (
      <div style={{ maxWidth: '500px' }}>
        <div className="buttons mb-4">
          <button className="button is-small" onClick={handleAdd}>
            Add Tag
          </button>
          <button className="button is-small is-danger" onClick={handleClear}>
            Clear All
          </button>
        </div>
        <Taginput
          value={tags}
          onChange={setTags}
          placeholder="Controlled input..."
        />
        <p className="mt-4 is-size-7 has-text-grey">
          Tags: {JSON.stringify(tags)}
        </p>
      </div>
    );
  },
};

/**
 * Form integration example.
 */
export const FormIntegration: Story = {
  render: function FormIntegrationExample() {
    const [skills, setSkills] = useState<TaginputTag[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Skills: ${skills.join(', ')}`);
    };

    return (
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
        <div className="field">
          <label className="label">Skills</label>
          <div className="control">
            <Taginput
              data={[
                'JavaScript',
                'TypeScript',
                'React',
                'Node.js',
                'Python',
                'Go',
                'Rust',
              ]}
              placeholder="Add your skills..."
              onChange={setSkills}
            />
          </div>
          <p className="help">Type to search or add new skills</p>
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

/**
 * With callbacks for tag events.
 */
export const WithCallbacks: Story = {
  render: function WithCallbacksExample() {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
      setLogs(prev => [...prev.slice(-4), message]);
    };

    return (
      <div style={{ maxWidth: '500px' }}>
        <Taginput
          placeholder="Add tags to see events..."
          onAdd={tag => addLog(`Added: ${tag}`)}
          onRemove={(tag, index) => addLog(`Removed: ${tag} at index ${index}`)}
          onTyping={value => addLog(`Typing: ${value}`)}
        />
        {logs.length > 0 && (
          <div className="mt-4">
            <p className="is-size-7 has-text-weight-bold">Events:</p>
            {logs.map((log, i) => (
              <p key={i} className="is-size-7 has-text-grey">
                {log}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  },
};
