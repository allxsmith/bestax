import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from './Switch';
import { Field } from './Field';
import { Input } from './Input';
import { Select } from './Select';

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
    passiveType: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Color for the unchecked (inactive) state',
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
 * Switch with passive type (unchecked state color).
 * The passive type sets the color when the switch is OFF, while the active
 * color (set via `color`) shows when the switch is ON.
 */
export const PassiveType: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Switch color="success" passiveType="danger">
        Success active / Danger passive
      </Switch>
      <Switch color="primary" passiveType="warning">
        Primary active / Warning passive
      </Switch>
      <Switch color="info" passiveType="danger" isOutlined>
        Outlined info / danger passive
      </Switch>
      <Switch color="success" passiveType="danger" isRounded>
        Rounded success / danger passive
      </Switch>
    </div>
  ),
};

/**
 * Form with mixed inputs: Input, Select, and Switch together.
 */
export const FormExample: Story = {
  render: function UserProfileForm() {
    const [profile, setProfile] = useState({
      name: '',
      email: '',
      role: '',
      notifications: true,
      twoFactor: false,
      publicProfile: true,
    });

    const toggle =
      (key: 'notifications' | 'twoFactor' | 'publicProfile') =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile(prev => ({ ...prev, [key]: e.target.checked }));
      };

    return (
      <div style={{ maxWidth: '500px' }}>
        <h4 className="title is-5">User Profile</h4>
        <Input
          label="Full Name"
          placeholder="Jane Doe"
          value={profile.name}
          onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
        />
        <Input
          label="Email"
          type="email"
          placeholder="jane@example.com"
          value={profile.email}
          onChange={e =>
            setProfile(prev => ({ ...prev, email: e.target.value }))
          }
        />
        <Select
          label="Role"
          value={profile.role}
          onChange={e =>
            setProfile(prev => ({ ...prev, role: e.target.value }))
          }
        >
          <option value="">Select a role...</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </Select>
        <Field label="Preferences">
          <Field>
            <Switch
              color="success"
              passiveType="danger"
              checked={profile.notifications}
              onChange={toggle('notifications')}
            >
              Email notifications
            </Switch>
          </Field>
          <Field>
            <Switch
              color="info"
              checked={profile.twoFactor}
              onChange={toggle('twoFactor')}
            >
              Two-factor authentication
            </Switch>
          </Field>
          <Field>
            <Switch
              color="primary"
              isRounded
              checked={profile.publicProfile}
              onChange={toggle('publicProfile')}
            >
              Public profile
            </Switch>
          </Field>
        </Field>
      </div>
    );
  },
};

/**
 * Horizontal form layout mixing Input, Select, and Switch.
 */
export const HorizontalForm: Story = {
  render: function HorizontalSettingsForm() {
    const [form, setForm] = useState({
      username: '',
      timezone: '',
      darkMode: false,
      autoSave: true,
    });

    return (
      <div style={{ maxWidth: '700px' }}>
        <h4 className="title is-5">Account Settings</h4>
        <Input
          horizontal
          label="Username"
          placeholder="Enter username"
          value={form.username}
          onChange={e =>
            setForm(prev => ({ ...prev, username: e.target.value }))
          }
        />
        <Select
          horizontal
          label="Timezone"
          value={form.timezone}
          onChange={e =>
            setForm(prev => ({ ...prev, timezone: e.target.value }))
          }
        >
          <option value="">Select timezone...</option>
          <option value="utc">UTC</option>
          <option value="est">Eastern (EST)</option>
          <option value="cst">Central (CST)</option>
          <option value="pst">Pacific (PST)</option>
        </Select>
        <Field horizontal label="Dark mode">
          <Field>
            <Switch
              color="info"
              isThin
              checked={form.darkMode}
              onChange={e =>
                setForm(prev => ({ ...prev, darkMode: e.target.checked }))
              }
            >
              {form.darkMode ? 'On' : 'Off'}
            </Switch>
          </Field>
        </Field>
        <Field horizontal label="Auto-save">
          <Field>
            <Switch
              color="success"
              passiveType="danger"
              isRounded
              checked={form.autoSave}
              onChange={e =>
                setForm(prev => ({ ...prev, autoSave: e.target.checked }))
              }
            >
              {form.autoSave ? 'Enabled' : 'Disabled'}
            </Switch>
          </Field>
        </Field>
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
      <Switch color="success" passiveType="danger" isRounded>
        Rounded with passive type
      </Switch>
    </div>
  ),
};
