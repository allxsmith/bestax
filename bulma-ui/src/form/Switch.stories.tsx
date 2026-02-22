import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from './Switch';
import { Field } from './Field';

const meta: Meta<typeof Switch> = {
  title: 'Form/Switch',
  component: Switch,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A toggle switch component for on/off states. Commonly used for settings, preferences, and feature toggles.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Color variant for the switch',
    },
    size: {
      control: 'select',
      options: ['small', 'normal', 'medium', 'large'],
      description: 'Size of the switch',
    },
    isRounded: {
      control: 'boolean',
      description: 'Use rounded switch style',
    },
    isThin: {
      control: 'boolean',
      description: 'Use thin switch style',
    },
    isOutlined: {
      control: 'boolean',
      description: 'Use outlined switch style',
    },
    isRtl: {
      control: 'boolean',
      description: 'Right-to-left layout (label on left)',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled',
    },
    children: {
      control: 'text',
      description: 'Label content for the switch',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

/**
 * Basic switch with default styling.
 */
export const Default: Story = {
  args: {
    children: 'Enable feature',
  },
};

/**
 * Switch with different color variants.
 */
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Switch color="primary" defaultChecked>
        Primary
      </Switch>
      <Switch color="link" defaultChecked>
        Link
      </Switch>
      <Switch color="info" defaultChecked>
        Info
      </Switch>
      <Switch color="success" defaultChecked>
        Success
      </Switch>
      <Switch color="warning" defaultChecked>
        Warning
      </Switch>
      <Switch color="danger" defaultChecked>
        Danger
      </Switch>
    </div>
  ),
};

/**
 * Switch with different size variants.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Switch size="small" defaultChecked>
        Small
      </Switch>
      <Switch size="normal" defaultChecked>
        Normal
      </Switch>
      <Switch size="medium" defaultChecked>
        Medium
      </Switch>
      <Switch size="large" defaultChecked>
        Large
      </Switch>
    </div>
  ),
};

/**
 * Switch with rounded style.
 */
export const Rounded: Story = {
  args: {
    isRounded: true,
    color: 'success',
    defaultChecked: true,
    children: 'Rounded switch',
  },
};

/**
 * Switch with thin style.
 */
export const Thin: Story = {
  args: {
    isThin: true,
    color: 'info',
    defaultChecked: true,
    children: 'Thin switch',
  },
};

/**
 * Switch with outlined style.
 */
export const Outlined: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Switch isOutlined color="primary" defaultChecked>
        Primary outlined
      </Switch>
      <Switch isOutlined color="success" defaultChecked>
        Success outlined
      </Switch>
      <Switch isOutlined color="danger" defaultChecked>
        Danger outlined
      </Switch>
    </div>
  ),
};

/**
 * Switch with RTL (right-to-left) layout.
 */
export const RtlLayout: Story = {
  args: {
    isRtl: true,
    color: 'primary',
    defaultChecked: true,
    children: 'Label on left',
  },
};

/**
 * Disabled switch states.
 */
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Switch disabled>Disabled unchecked</Switch>
      <Switch disabled defaultChecked color="success">
        Disabled checked
      </Switch>
    </div>
  ),
};

/**
 * Controlled switch with state management.
 */
export const Controlled: Story = {
  render: function ControlledSwitch() {
    const [isEnabled, setIsEnabled] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Switch
          color="primary"
          checked={isEnabled}
          onChange={e => setIsEnabled(e.target.checked)}
        >
          Feature is {isEnabled ? 'enabled' : 'disabled'}
        </Switch>
        <p>
          Current state: <strong>{isEnabled ? 'ON' : 'OFF'}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Switch without label.
 */
export const NoLabel: Story = {
  args: {
    color: 'primary',
    defaultChecked: true,
  },
};

/**
 * Switch within a Field component.
 */
export const WithField: Story = {
  render: () => (
    <Field>
      <Switch color="success" defaultChecked>
        Accept terms and conditions
      </Switch>
    </Field>
  ),
};

/**
 * Multiple switches for settings.
 */
export const SettingsExample: Story = {
  render: function SettingsPanel() {
    const [settings, setSettings] = useState({
      notifications: true,
      darkMode: false,
      autoSave: true,
      analytics: false,
    });

    const updateSetting =
      (key: keyof typeof settings) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, [key]: e.target.checked }));
      };

    return (
      <div style={{ maxWidth: '400px' }}>
        <h4 className="title is-5">Settings</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Switch
            color="primary"
            checked={settings.notifications}
            onChange={updateSetting('notifications')}
          >
            Push notifications
          </Switch>
          <Switch
            color="info"
            checked={settings.darkMode}
            onChange={updateSetting('darkMode')}
          >
            Dark mode
          </Switch>
          <Switch
            color="success"
            checked={settings.autoSave}
            onChange={updateSetting('autoSave')}
          >
            Auto-save documents
          </Switch>
          <Switch
            color="warning"
            checked={settings.analytics}
            onChange={updateSetting('analytics')}
          >
            Share analytics data
          </Switch>
        </div>
      </div>
    );
  },
};

/**
 * All style combinations.
 */
export const StyleCombinations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Switch color="success" isRounded defaultChecked>
        Rounded success
      </Switch>
      <Switch color="info" isThin defaultChecked>
        Thin info
      </Switch>
      <Switch color="primary" isOutlined isRounded defaultChecked>
        Outlined rounded primary
      </Switch>
      <Switch color="danger" isThin isOutlined defaultChecked>
        Thin outlined danger
      </Switch>
    </div>
  ),
};
